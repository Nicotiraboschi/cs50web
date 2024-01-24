from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    def __str__(self):
        return f"user:{self.username}"

    def serialize(self):
        return {
            "username": self.username,
            "posts": [post.serialize() for post in self.posts.order_by("-timestamp").all()],
            "followers": [follower.follower.username for follower in self.followers.all()],
            "following": [following.user.username for following in self.following.all()]
        }

    
class Follower(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")

    def __str__(self):
        return f"{self.follower} follows {self.user}"
    
    class Meta:
        unique_together = ("user", "follower")


class Post(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="posts")
    content = models.CharField(max_length=280)
    timestamp = models.DateTimeField(auto_now_add=True)

    def serialize(self):
        return {
            "id": self.id,
            "user": self.user.username,
            "content": self.content,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "likes_count": self.post_liked.all().count(),
            "likers": [liker.user.username for liker in self.post_liked.all()]

        }
    
    def __str__(self):
        return f"User:{self.user.username}, content:{self.content}, at timestamp:{self.timestamp}"

class Liker(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="liker")
    post_liked = models.ForeignKey("Post", on_delete=models.CASCADE, related_name="post_liked")

    def serialize(self):
        return {
            "user": self.user.username,
            "post_liked": self.post_liked
        }
    
    class Meta:
        unique_together = ("user", "post_liked")
