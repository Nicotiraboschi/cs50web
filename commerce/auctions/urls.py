from django.urls import path

from django.conf import settings
from django.conf.urls.static import static

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("accounts/login/", views.login_view, name="login"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("create", views.create_listing, name="create"),
    path("<int:item_id>", views.item, name="item"),
    path("<str:username>/watchlist", views.watchlist, name="watchlist"),
    path("categories", views.categories, name="categories"),
    path("<str:category>", views.category, name="category")
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)