from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.db.models import Max
from decimal import Decimal

from .models import *

@login_required
def index(request):
    return render(request, "auctions/index.html", {
        "n_favourites": Watchlist.objects.filter(user=request.user).count(),
        "listings": Listing.objects.all()
    })


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
            return render(request, "auctions/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "auctions/login.html")


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
            return render(request, "auctions/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "auctions/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "auctions/register.html")

@login_required
def create_listing(request):
    if request.method == "POST":
        item = request.POST["item"]
        price = Decimal(request.POST["price"])
        description = request.POST["description"]
        category = request.POST["category"].lower()
        poster = request.user
        image = request.FILES.get("image")
        if price < 0:
            return render(request, "auctions/create_listing.html", {
            "message": "Too kind! Don't pay to gift!",
            "listings": Listing.objects.all(),
            "n_favourites": Watchlist.objects.filter(user=request.user).count()
            })
        try:
            category_object = Category.objects.get(category=category)
        except Category.DoesNotExist:
            category_object = Category(category=category)
        category_object.save()
        # category=category.category
        if image:
            listing = Listing(item=item, price=price, description=description, image=image, category=category_object, poster=poster)
        else:
            listing = Listing(item=item, price=price, description=description, category=category_object, poster=poster)
        listing.save()
        return HttpResponseRedirect(reverse("index"))
    return render(request, "auctions/create_listing.html", {
        "n_favourites": Watchlist.objects.filter(user=request.user).count(),
        "listings": Listing.objects.all(),
    })


@login_required
def item(request, item_id):
    item_id=int(item_id)
    listing = Listing.objects.get(pk=item_id)
    if request.method == "POST" and request.POST["submit"]=="Place":
        my_bid = Decimal(request.POST["amount"])
        if my_bid <= listing.price:
            return render(request, "auctions/item.html", {
                "n_favourites": Watchlist.objects.filter(user=request.user).count(),
                "message": "Your bid must me higher than the current",
                "item": listing,
                "bids": Bid.objects.filter(listing=listing).count(),
                "my_bid": my_bid,
                "comments": Comment.objects.filter(listing=listing),
            })
        else:
            # user = User.objects.get(username=request.user.username)
            old_bid, created = Bid.objects.get_or_create(listing=listing,bidder=User.objects.get(username=request.user.username))

            # If the bid already exists, update its amount
            if not created:
                old_bid = Bid.objects.get(listing=listing, bidder=User.objects.get(username=request.user.username))
            old_bid.amount = my_bid
            old_bid.save()
            listing.price = my_bid
            listing.save()
            return HttpResponseRedirect(reverse('item', args=[item_id]))


    elif request.method == "POST" and request.POST["submit"]=="Post":
        comment = request.POST["comment"]
        new_Comment = Comment(listing=listing, commenter=request.user, comment=comment)
        new_Comment.save()
        return HttpResponseRedirect(reverse('item', args=[item_id]))


    elif request.method == "POST" and "Add" in request.POST["submit"]:
        try:
            favourite = Watchlist.objects.get(listing=listing, user=request.user)
            favourite.delete()
        except Watchlist.DoesNotExist:
            favourite = Watchlist.objects.create(listing=listing, user=request.user)
            favourite.save()
        return HttpResponseRedirect(reverse('item', args=[item_id]))

    elif request.method == "POST" and "Remove" in request.POST["submit"]:
        favourite = Watchlist.objects.get(listing=listing, user=request.user)
        favourite.delete()
        return HttpResponseRedirect(reverse('item', args=[item_id]))


    elif request.method == "POST":
        try:
            winner = Bid.objects.all().get(amount=listing.price, listing=listing).bidder.username
        except Bid.DoesNotExist:
            winner = "none"
        listing.winner = winner
        listing.save()
        return HttpResponseRedirect(reverse('item', args=[item_id]))
            


    else:
        if listing.poster != request.user.username:
            my_bid_obj = Bid.objects.filter(listing=listing, bidder=User.objects.get(username=request.user.username)).first()
            my_bid = my_bid_obj.amount if my_bid_obj else None        
        else:
            my_bid = None
        try:
            watched = Watchlist.objects.get(user=request.user, listing=listing)
            watched = True
        except Watchlist.DoesNotExist:
            watched = False
        
        return render(request, "auctions/item.html", {
            "n_favourites": Watchlist.objects.filter(user=request.user).count(),
            "item": listing,
            "bids": Bid.objects.filter(listing=listing).count(),
            "my_bid": my_bid,
            "comments": Comment.objects.filter(listing=listing),
            "watched": watched
            })

@login_required
def watchlist(request, username):
    if request.user.username != username:
        return render(request, "auctions/error.html", {
            "n_favourites": Watchlist.objects.filter(user=request.user).count(),
            "message": "Not allowed here, it's not your Watchlist!"
        })
    if request.method == "POST":
        return
        # TO DO
    else:
        favourites = Watchlist.objects.filter(user=request.user)
        return render(request, "auctions/watchlist.html", {
            "n_favourites": Watchlist.objects.filter(user=request.user).count(),
            "favourites": favourites,
            "username": request.user.username
        })

        
@login_required
def categories(request):
    categories = Category.objects.all().distinct()
    return render(request, "auctions/categories.html", {
        "n_favourites": Watchlist.objects.filter(user=request.user).count(),
        "categories": categories
    })


@login_required
def category(request, category):
    category = Category.objects.get(category=category)
    listings = category.listings.all()
    return render(request, "auctions/category.html", {
        "category": category,
        "n_favourites": Watchlist.objects.filter(user=request.user).count(),
        "listings": listings
    })


