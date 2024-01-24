""" from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse """

import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import JsonResponse
from django.shortcuts import HttpResponse, HttpResponseRedirect, render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q


from .models import User, Post, Follower, Liker


def index(request):
    return render(request, "network/index.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

# @csrf_exempt
@login_required
def write_post(request):
    if request.method == "POST":
        # get data
        data = json.loads(request.body)

        #get content of the post
        content = data.get("content", "")
        user = request.user

        post = Post(user=request.user, content=content)
        post.save()

        return JsonResponse({"message": "Posted successfully."}, status=201)


@login_required
def post(request, postId):
    try:
        post = Post.objects.get(pk=postId)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found."}, status=404)
    data = json.loads(request.body)
    action = data.get("action")
    if action == "edit":
        if request.user == post.user:
            post.content = data["content"]
            post.save()
            return JsonResponse(post.serialize(), safe=False)
        else:
            return JsonResponse({"error": "Not Your Post."}, status=401)

    elif action == "like":
        try:
            liker = Liker.objects.get(user=request.user, post_liked=post)
            liker.delete()
            liked = False
        except Liker.DoesNotExist:
            Liker.objects.create(user=request.user, post_liked=post)
            liked = True

        response_data = {
            "post": post.serialize(),
            "liked": liked
        }
        return JsonResponse(response_data, safe=False)

def profile(request, username):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found."}, status=404)        
    # follows/unfollows
    if request.method == "POST" and request.user.username != username:
        try:
            follower = Follower.objects.get(user=user, follower=request.user)
            follower.delete()  # Unfollow
        except Follower.DoesNotExist:
            Follower.objects.create(user=user, follower=request.user)  # Follow
    response_data = {
        "current_user": request.user.username,
        "user": user.serialize()
    }
    return JsonResponse(response_data, safe=False)

        
def posts(request):
    page = int(request.GET.get('page', 1))
    fetch_type = request.GET.get('fetch_type', '')  

    posts_per_page = 10
    start_index = (page - 1) * posts_per_page
    end_index = start_index + posts_per_page
    posts = []
    next_post = False
    if fetch_type == "all":
        posts = Post.objects.order_by("-timestamp")[start_index:end_index]
        # Fetch one additional post to check if there is a next page
        next_post = Post.objects.order_by("-timestamp")[end_index:end_index+1].first()

    elif fetch_type == "following":
        following_list = request.user.serialize()["following"]
        posts = Post.objects.filter(user__username__in=following_list).order_by("-timestamp")[start_index:end_index]
        # Fetch one additional post to check if there is a next page
        next_post = Post.objects.filter(user__username__in=following_list).order_by("-timestamp")[end_index:end_index+1].first()
    response_data = {
        "posts": [post.serialize() for post in posts[:posts_per_page]],  # 10posts
        "has_next_page": next_post is not None,
        "current_user": request.user.username
    }
    return JsonResponse(response_data)

