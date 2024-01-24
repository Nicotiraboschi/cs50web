from django.shortcuts import render
import markdown2
from django.core.files.storage import default_storage
from django.http import HttpResponse
import random

from . import util


def index(request):
    return render(request, "encyclopedia/index.html", {
        "entries": util.list_entries()
    })

def pages(request, name):
    if request.method == "POST" and request.POST["button"] == "edit":
        body = util.get_entry(name)
        return render(request, "encyclopedia/edit.html", {
            "body" : body,
            "name": name
        })
    elif request.method == "POST":
        body = request.POST["body"].encode('ascii')
        util.save_entry(name, body)
        return render(request, "encyclopedia/pages.html", {
                "entry": markdown2.markdown(body),
                "title" : name
            })
    else:
        try:
            return render(request, "encyclopedia/pages.html", {
                "entry": markdown2.markdown(util.get_entry(name)),
                "title" : name
            })
        except TypeError:
            return render(request, "encyclopedia/error.html", {
                "body": "entry doesn't exist"
            })
    
def add(request):
    if request.method == "POST":
        title = request.POST["title"]
        body = request.POST["text"]
        filename = f"entries/{title}.md"
        if default_storage.exists(filename):
            return render(request, "encyclopedia/error.html", {
                "body" : "page already exists"
            })
        util.save_entry(title, body)
        return render(request, "encyclopedia/pages.html", {
            "title" : title,
            "entry": markdown2.markdown(body)
        })
    elif request.method == "GET":
        return render(request, "encyclopedia/add.html")

def random_page(request):
    entries = util.list_entries()
    title = random.choice(entries) 
    entry = util.get_entry(title)
    return render(request, "encyclopedia/pages.html", {
        "title" : title,
        "entry" : markdown2.markdown(entry)
    })

def search_entry(request):
    name = request.POST["button"]
    try:
        return render(request, "encyclopedia/pages.html", {
            "entry": markdown2.markdown(util.get_entry(name)),
            "title" : name
        })
    except TypeError:
        return render(request, "encyclopedia/search.html", {
            "name": name,
            "entries": util.list_entries()
        })