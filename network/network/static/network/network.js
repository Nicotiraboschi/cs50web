countPage = 1;
posts_per_page = 10;

document.addEventListener("DOMContentLoaded", function () {
  if (document.querySelector("#write-button")) {
    document.querySelector("#write-button").addEventListener("click", function () {
      countPage = 1
      deleteCurrent()
      document.querySelector("#write-button").classList.add("current");
      write();
    })
    document.querySelector("#profile-button").addEventListener("click", function () {
      countPage = 1
      user = document.querySelector("#profile-button").innerHTML;
      deleteCurrent()
      document.querySelector("#profile-button").classList.add("current");
      profile(user)
    })
    document.querySelector("#following-button").addEventListener("click", function () {
      countPage = 1
      deleteCurrent()
      document.querySelector("#following-button").classList.add("current");
      following();
    })
  }
  // everywhere but in the login and register page 
  if (document.querySelector("#write-view")) {
    allPosts()
  }
})

// reset stuff
function resetFollowInfo() {
  if (document.querySelector("#followers-stat")) {
    document.querySelector("#followers-stat").remove();
  }
  if (document.querySelector("#follow-button")) {
    document.querySelector("#follow-button").remove();
  }
}
function deleteCurrent() {
  document.querySelector(".current").classList.remove("current");
}

// resets the space for posts
function resetPosts() {
  document.querySelector("#posts-list").remove();
  const postsList = document.createElement("div");
  postsList.id = "posts-list";
  const postsView = document.querySelector("#posts-view");
  postsView.appendChild(postsList);
}

// pages
// allPosts

function allPosts() {
  document.querySelector("#write-view").style.display = "none";

  document.querySelector("#posts-title").innerHTML = "All Posts";
  resetFollowInfo();
  resetPosts();

  fetch(`/network/posts?page=${countPage}&fetch_type=all`)
    .then(response => response.json())
    .then(data => {
      const posts = data.posts;
      const hasNextPage = data.has_next_page;
      const currentUser = data.current_user;
      paginationButtons(hasNextPage, "all", "beginning");
      // list of posts
      posts.forEach(post => {
        listPosts(post.id, post.content, post.timestamp, post.user, post.likes_count, post.likers, currentUser)
      })
      paginationButtons(hasNextPage, "all", "end");
    })
}

// Following Page
function following() {
  document.querySelector("#write-view").style.display = "none";
  document.querySelector("#posts-title").innerHTML = "Your Favourites";

  resetFollowInfo();
  resetPosts();
  fetch(`/network/posts?page=${countPage}&fetch_type=following`)
    .then(response => response.json())
    .then(data => {
      const posts = data.posts;
      const hasNextPage = data.has_next_page;
      const currentUser = data.current_user;
      paginationButtons(hasNextPage, "following", "beginning");
      posts.forEach(post => {
        listPosts(post.id, post.content, post.timestamp, post.user, post.likes_count, post.likers, currentUser)
      })
    })
}

// Profile Page
function profile(userUsername) {

  //HACK TRY

  /* console.log("hi");
      const profileButton = document.createElement("li");
      profileButton.classList.add("nav-item");
      document.querySelector(".navbar-nav").appendChild(profileButton);

      const profileText= document.createElement("a");
      profileText.innerHTML = "nico1";
      profileText.classList.add("nav-link");
      profileText.id = "profile-button";
      profileButton.appendChild(profileText);

      const followingButton = document.createElement("li");
      followingButton.classList.add("nav-item");
      document.querySelector(".navbar-nav").appendChild(followingButton);

      const followingText = document.createElement("a");
      followingText.innerHTML = "Following";
      followingText.classList.add("nav-link");
      followingText.id = "following-button";
      followingButton.appendChild(followingText);

  document.querySelector("#following-button").addEventListener("click", function () {
      countPage = 1
      deleteCurrent()
      document.querySelector("#following-button").classList.add("current");
      following();
    })
 */

  //document.querySelector("#profile-button").innerHTML = "nico2";


  document.querySelector("#write-view").style.display = "none";
  fetch(`/network/${userUsername}`)
    .then(response => response.json())
    .then(data => {
      const currentUser = data.current_user;
      const user = data.user;
      const postsTitle = document.querySelector("#posts-title");
      postsTitle.innerHTML = user.username;
      //  follow button
      if (document.querySelector("#profile-button") && document.querySelector("#profile-button").innerHTML != user.username) {

        if (!document.querySelector("#follow-button")) {
          followElement = document.createElement('p');
        }
        followElement.id = "follow-button";
        followElement.classList.add("btn", "btn-sm", "btn-outline-primary");
        document.querySelector("#posts-view").appendChild(followElement);
        updatedFollowButton(user);
        followElement.addEventListener("click", () => follow(user), { once: true })
      }
      else {
        if (document.querySelector("#follow-button")) {
          document.querySelector("#follow-button").remove();
        }
      }
      updatedFollowStats(user)
      // starts with the page clean
      resetPosts();
      // lists the posts
      if (user.posts.length > countPage * posts_per_page) {
        hasNextPage = true;
      }
      else {
        hasNextPage = false;
      }
      paginationButtons(hasNextPage, userUsername, "beginning");
      for (let i = (countPage - 1) * posts_per_page; i < user.posts.length && i < (countPage * posts_per_page); i++) {
        listPosts(user.posts[i].id, user.posts[i].content, user.posts[i].timestamp, user.posts[i].user, user.posts[i].likes_count, user.posts[i].likers, currentUser)
      }
      paginationButtons(hasNextPage, userUsername, "end");
    })
}

// write page
function write() {
  document.querySelector("#posts-view").style.display = "none";
  document.querySelector("#write-view").style.display = "block";
  document.querySelector("#text-form").value = "";
  document.querySelector("#text-form").focus();


  const contentElement = document.querySelector("#text-form");

  document.querySelector("#submit-post").addEventListener("click", function () {
    content = contentElement.value;
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    event.preventDefault();
    fetch('/network/write', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify({
        "content": content
      })
    })
      .then(response => response.json())
      .then(location.reload())
  })
}


// list all posts
function listPosts(id, content, timestamp, user, likes, likers, currentUser) {
  document.querySelector("#posts-view").style.display = "block";

  const postsList = document.querySelector("#posts-list")
  const divPost = document.createElement("div");
  divPost.classList.add("post");
  postsList.appendChild(divPost);

  const userTitle = document.createElement("h5")
  userTitle.innerHTML = user;
  userTitle.style.cursor = "pointer";
  userTitle.addEventListener("click", function () {
    countPage = 1
    profile(user)
  });
  divPost.appendChild(userTitle);

  if (document.querySelector("#profile-button") && document.querySelector("#profile-button").innerHTML === user) {
    const editButton = document.createElement("p");
    editButton.innerHTML = "Edit"
    editButton.id = "edit-button";
    editButton.classList.add("pointers");
    divPost.appendChild(editButton);
    editButton.addEventListener("click", () => edit_post(content, id))
  }
  const contentPost = document.createElement("h6");
  contentPost.id = id;
  contentPost.innerHTML = content;
  divPost.appendChild(contentPost);

  const timestampPost = document.createElement("p");
  timestampPost.innerHTML = timestamp;
  divPost.appendChild(timestampPost);

  const likesElement = document.createElement("p");
  const likesCount = likes;

  const initialHeart = likers.includes(currentUser) ? "💞" : "💔";
  likesElement.innerHTML = `${initialHeart}${likesCount}`;
  likesElement.id = "likes";
  divPost.appendChild(likesElement);
  if (document.querySelector("#profile-button")) {
    likesElement.classList.add("pointers");

    likesElement.addEventListener("click", function () {
      event.preventDefault();
      fetch(`/network/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]').value,
        },
        body: JSON.stringify({ "action": "like" })
      })
        .then(response => response.json())
        .then(response_data => {
          // Update the likes count immediately after receiving the response
          const liked = response_data.liked;
          const post = response_data.post;
          const heart = liked ? "💞" : "💔";
          likesElement.innerHTML = `${heart}${post.likes_count}`;
        });
    })
  }
}


// functionalities
// pagination buttons
function paginationButtons(hasNextPage, page, position) {
  // numberPage
  countPageElement = document.createElement("h6");
  countPageElement.innerHTML = `Page ${countPage}`;

  countPageElement.style.marginBottom = "0.5rem"
  countPageElement.classList.add("count-page");

  // previousPageElement
  previousPageElement = document.createElement("button");
  previousPageElement.innerHTML = "Previous";
  previousPageElement.classList.add("btn", "btn-sm", "btn-outline-primary", "previous-page-button");

  // nextPageElement
  nextPageElement = document.createElement("button");
  nextPageElement.innerHTML = "Next";
  nextPageElement.classList.add("btn", "btn-sm", "btn-outline-primary", "next-page-button");

  if (position == "beginning") {
    const title = document.querySelector("#posts-list");
    title.appendChild(countPageElement);
    title.appendChild(previousPageElement);
    title.appendChild(nextPageElement);
  }
  else if (position == "end") {
    const end = document.querySelector("#posts-list");
    end.appendChild(countPageElement);
    end.appendChild(previousPageElement);
    end.appendChild(nextPageElement);
  }
  // shows previous when it should
  if (countPage == 1) {
    previousPageElement.style.display = "none";
  }
  else {
    previousPageElement.style.display = "inline-block";
  }
  // shows next when it should
  if (!hasNextPage) {
    nextPageElement.style.display = "none";
  }
  else {
    nextPageElement.style.display = "inline-block";
  }
  // clicking on buttons
  nextPageElement.addEventListener("click", function () {
    countPage++;
    countPageElement.innerHTML = `Page ${countPage}`;
    if (page == "all") {
      allPosts();
    }
    else if (page == "following") {
      following()
    }
    else {
      console.log(page);

      profile(page)
    }
  })
  previousPageElement.addEventListener("click", function () {
    countPage--;
    countPageElement.innerHTML = `Page ${countPage}`;
    if (page == "all") {
      allPosts();
    }
    else if (page == "following") {
      following()
    }
    else {
      profile(page)
    }
  })
}


// edit one post
function edit_post(content, postId) {
  document.querySelector("#posts-view").style.display = "none";
  document.querySelector("#write-view").style.display = "block";
  const contentElement = document.querySelector("#text-form");
  contentElement.focus();
  document.querySelector("#text-form").value = content;
  document.querySelector("#submit-post").value = "Save";
  document.querySelector("#submit-post").addEventListener("click", function () {
    content = contentElement.value;
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    event.preventDefault();

    fetch(`/network/${postId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify({ "action": "edit", "content": content })
    })
      .then(response => response.json())
      .then(post => {
        // Update the post immediately after receiving the response
        document.querySelector("h6").innerHTML = post.id;
        allPosts();
      });
  }, { once: true })
}

// follow function
function follow(user) {
  event.preventDefault();
  fetch(`network/${user.username}`, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]').value,
    },
    body: JSON.stringify({
      "user": user,
    })
  })
    .then(response => {
      updatedFollowStats(user);
      updatedFollowButton(user);
      profile(user.username);
    })
}

// update followButtons
function updatedFollowButton(user) {
  if (user.followers.includes(document.querySelector("#profile-button").innerHTML)) {
    followElement.innerHTML = "Unfollow";
  }
  else {
    followElement.innerHTML = "Follow";
  }
}
// update follow stats
function updatedFollowStats(user) {
  const postsView = document.querySelector("#posts-view");
  if (!document.querySelector("#followers-stat")) {
    followersElement = document.createElement('p');
  }
  followersElement.id = "followers-stat";
  followersElement.innerHTML = `Followed by ${user.followers.length}, Follows ${user.following.length}`;
  postsView.appendChild(followersElement);
}