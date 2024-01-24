from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    username = models.CharField(max_length = 50, blank = True, null = True, unique = True)
    email = models.EmailField(unique = True)

class Category(models.Model):
    category = models.CharField(max_length=64, null=True) 

    def __str__(self):
        return f"Category:{self.category}"

class Listing(models.Model):
    winner = models.CharField(max_length=64, null=True) 
    poster = models.CharField(max_length=64, null=True) 
    item = models.CharField(max_length=64, null=True) 
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    description = models.CharField(max_length=100, null=True) 
    image = models.ImageField(upload_to='listing_images/', default='listing_images/nothing.jpg')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="listings", null=True) 

    def __str__(self):
        return f"Item: {self.item}, price: {self.price}, description: {self.description}, category: {self.category.category}, winner: {self.winner}"


class Bid(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="bid_item", null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    bidder = models.ForeignKey(User, on_delete=models.CASCADE, related_name="buyer", null=True)

    def __str__(self):
        return f"Listing:{self.listing.id}, bid:{self.amount}, user:{self.bidder.username}"


class Comment(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="comment", null=True)
    commenter = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviewer", null=True)
    comment = models.CharField(max_length=1000, null=True)

    def __str__(self):
        return f"Listing:{self.listing.id}, commenter:{self.commenter.username}, comment:{self.comment}"

class Watchlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="favourite", null=True)


