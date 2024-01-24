
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # API routes
    path("network/write", views.write_post, name="write"),
    path("network/posts", views.posts, name="posts"),
    path("network/<int:postId>", views.post, name="post"),
    path("network/<str:username>", views.profile, name="profile"),
]
