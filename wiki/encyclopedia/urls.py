from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("wiki/", views.index, name="index"),
    path("wiki/add", views.add, name="add"),
    path("wiki/search", views.search_entry, name="search"),
    path("wiki/random", views.random_page, name="random"),
    path("wiki/<str:name>", views.pages, name="pages"),   
    path("add", views.add, name="add"),
    path("search", views.search_entry, name="search"),
    path("random", views.random_page, name="random"),
    path("<str:name>", views.pages, name="pages")    
]
