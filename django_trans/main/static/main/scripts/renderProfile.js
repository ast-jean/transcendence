export function renderProfile(profileContext) {
  const container = document.getElementById("template-profile");
  if (!container) {
    console.error("No template-profile found in the DOM.");
    return;
  }

  // Clear any existing content
  container.innerHTML = "";

  // 1. Create the top-level .card
  const cardDiv = document.createElement("div");
  cardDiv.classList.add("card", "mx-auto", "m-2");
  cardDiv.style.maxWidth = "1000px";

  // 2. Outer row
  const rowDiv = document.createElement("div");
  rowDiv.classList.add("row", "g-0");

  // ============= Left Column (Avatar) =============
  const colLeft = document.createElement("div");
  colLeft.classList.add("col-md-4");

  const userObj = profileContext.user || {};
  let avatarUrl = "/media/avatars/default.jpg"; // fallback
  if (userObj.avatar) {
    avatarUrl = userObj.avatar;
  }

  const avatarImg = document.createElement("img");
  avatarImg.src = avatarUrl;
  avatarImg.alt = userObj.username ? userObj.username : "User avatar";
  avatarImg.classList.add("d-flex", "mt-5", "m-auto", "rounded");
  avatarImg.style.maxWidth = "200px";

  colLeft.appendChild(avatarImg);

  // ============= Right Column (Details) =============
  const colRight = document.createElement("div");
  colRight.classList.add("col-md-8");

  const profileCardBody = document.createElement("div");
  profileCardBody.classList.add("profilecard-body");

  // Online/Offline Status
  const isOnline = profileContext.is_online;
  const statusH4 = document.createElement("h4");
  statusH4.classList.add("profilecard-text");
  statusH4.innerHTML = `Status: <span class="${isOnline ? 'text-success' : 'text-danger'}">
                        ${isOnline ? 'Online' : 'Offline'}</span>`;
  profileCardBody.appendChild(statusH4);

  // Username
  const usernameP = document.createElement("p");
  usernameP.classList.add("profilecard-text");
  usernameP.textContent = `Username: ${userObj.username || 'N/A'}`;
  profileCardBody.appendChild(usernameP);

  // Alias (if any)
  if (userObj.alias) {
    const aliasP = document.createElement("p");
    aliasP.classList.add("profilecard-text");
    aliasP.textContent = `Alias: ${userObj.alias}`;
    profileCardBody.appendChild(aliasP);
  }

  // Email
  if (userObj.email) {
    const emailP = document.createElement("p");
    emailP.classList.add("profilecard-text");
    emailP.textContent = `Email: ${userObj.email}`;
    profileCardBody.appendChild(emailP);
  }

  // Games Info
  const gamesArr = profileContext.games || [];
  const gamesWon = profileContext.gamesWon || 0;
  if (gamesArr.length > 0) {
    const gamesP = document.createElement("p");
    gamesP.classList.add("profilecard-text");
    gamesP.textContent = `Games won: ${gamesWon} out of ${gamesArr.length}`;
    profileCardBody.appendChild(gamesP);
  } else {
    const noGamesP = document.createElement("p");
    noGamesP.classList.add("profilecard-text");
    noGamesP.textContent = "Games won: 0";
    profileCardBody.appendChild(noGamesP);
  }

  // Friends
  const friendsLabel = document.createElement("p");
  friendsLabel.classList.add("profilecard-text");
  friendsLabel.textContent = "Friends:";
  profileCardBody.appendChild(friendsLabel);

  const friends = profileContext.friends || [];
  if (friends.length > 0) {
    const friendsContainer = document.createElement("div");
    friendsContainer.classList.add("profilecard-text", "mb-3", "mx-auto");

    friends.forEach(friendObj => {
      const f = friendObj.friend || {};
      if (f.username) {
        // Create link
        const friendLink = document.createElement("a");
        friendLink.classList.add("pb-2");
        friendLink.style.textDecoration = "none";
        friendLink.href = `#/profile-${f.username}`; // or your old route

        // Outer DIV
        const friendDiv = document.createElement("div");
        friendDiv.classList.add("btn", "btn-primary", "position-relative", "mx-2", "rounded");

        // Friend avatar
        const friendImg = document.createElement("img");
        friendImg.src = f.avatar || "/media/avatars/default.jpg";
        friendImg.alt = `${f.username} avatar`;
        friendImg.classList.add("img-thumbnail", "d-flex", "mx-auto", "my-auto");
        friendImg.style.width = "100px";
        friendImg.style.height = "100px";
        friendDiv.appendChild(friendImg);

        // Friend username label
        const userSpan = document.createElement("span");
        userSpan.classList.add("position-absolute", "border", "border-dark", "bg-white", "top-100", "start-50", "translate-middle", "text-dark", "rounded", "px-1");
        userSpan.style.whiteSpace = "nowrap";
        userSpan.textContent = f.username;
        friendDiv.appendChild(userSpan);

        // Online/Offline indicator
        const isFriendOnline = friendObj.is_online;
        const statusSpan = document.createElement("span");
        statusSpan.classList.add("position-absolute", "top-0", "start-100", "translate-middle", "p-2", "border", "border-light", "rounded-circle");
        statusSpan.style.backgroundColor = isFriendOnline ? "green" : "red";
        friendDiv.appendChild(statusSpan);

        // Put friendDiv inside the <a> link
        friendLink.appendChild(friendDiv);
        friendsContainer.appendChild(friendLink);
      } else {
        const unknownFriend = document.createElement("p");
        unknownFriend.textContent = "Unknown friend";
        friendsContainer.appendChild(unknownFriend);
      }
    });

    profileCardBody.appendChild(friendsContainer);
  } else {
    const noFriendsP = document.createElement("p");
    noFriendsP.classList.add("profilecard-text");
    noFriendsP.textContent = "You have no friends :(";
    profileCardBody.appendChild(noFriendsP);
  }

  colRight.appendChild(profileCardBody);

  // Put colLeft and colRight into rowDiv
  rowDiv.appendChild(colLeft);
  rowDiv.appendChild(colRight);

  // Put rowDiv into cardDiv
  cardDiv.appendChild(rowDiv);

  // Add the card to the container
  container.appendChild(cardDiv);

  // (Optional) Create a second .card for "Edit Profile", "Change Password", etc.
  // if you want to replicate the forms or collapsibles.
}
