
export function renderSomeProfile(context) {
  // We assume "user" is an object within the context
  const user = context.user || {};
  const isOnline = context.is_online || false;
  const games = context.games || [];
  const gamesWon = context.gamesWon || 0;
  const friends = context.friends || [];

  // The container where we'll inject the profile card
  const container = document.getElementById("profile-container");
  if (!container) {
    console.error("No #profile-container element found in the DOM.");
    return;
  }

  // Clear any existing content
  container.innerHTML = "";

  // === Create the top-level card ===
  const cardDiv = document.createElement("div");
  cardDiv.classList.add("card", "m-2");

  // Outer row
  const row = document.createElement("div");
  row.classList.add("row", "g-0");

  // ====== Left Column (Avatar) ======
  const colMd4 = document.createElement("div");
  colMd4.classList.add("col-md-4");

  // Create img element for avatar
  const avatarImg = document.createElement("img");
  if (user.avatar) {
    avatarImg.src = user.avatar;
    avatarImg.alt = user.username ? ` ${user.username}` : "User Avatar";
  } else {
    // fallback if no avatar URL
    avatarImg.src = "/media/avatars/default.jpg"; 
    avatarImg.alt = "Default avatar";
  }
  avatarImg.classList.add("d-flex", "mt-5", "m-auto", "rounded");
  avatarImg.style.maxWidth = "200px";

  colMd4.appendChild(avatarImg);

  // ====== Right Column (Details) ======
  const colMd8 = document.createElement("div");
  colMd8.classList.add("col-md-8");

  const profileCardBody = document.createElement("div");
  profileCardBody.classList.add("profilecard-body");

  // Online/Offline status
  const statusEl = document.createElement("h4");
  statusEl.classList.add("profilecard-text");
  const statusSpan = document.createElement("span");
  statusSpan.textContent = isOnline ? "Online" : "Offline";
  statusSpan.classList.add(isOnline ? "text-success" : "text-danger");

  statusEl.innerHTML = `Status: `;
  statusEl.appendChild(statusSpan);
  profileCardBody.appendChild(statusEl);

  // Username
  const usernameP = document.createElement("p");
  usernameP.classList.add("profilecard-text");
  usernameP.textContent = `Username: ${user.username || "Unknown"}`;
  profileCardBody.appendChild(usernameP);

  // Alias (if present)
  if (user.alias) {
    const aliasP = document.createElement("p");
    aliasP.classList.add("profilecard-text");
    aliasP.textContent = `Alias: ${user.alias}`;
    profileCardBody.appendChild(aliasP);
  }

  // Email
  if (user.email) {
    const emailP = document.createElement("p");
    emailP.classList.add("profilecard-text");
    emailP.textContent = `Email: ${user.email}`;
    profileCardBody.appendChild(emailP);
  }

  // Games
  if (games.length > 0) {
    const gamesStats = document.createElement("p");
    gamesStats.classList.add("profilecard-text");
    gamesStats.textContent = `Games won: ${gamesWon} out of ${games.length}`;
    profileCardBody.appendChild(gamesStats);
  } else {
    const noGamesP = document.createElement("p");
    noGamesP.classList.add("profilecard-text");
    noGamesP.textContent = "Games won: 0";
    profileCardBody.appendChild(noGamesP);
  }

  // Friends
  const friendsP = document.createElement("p");
  friendsP.classList.add("profilecard-text");
  friendsP.textContent = "Friends:";
  profileCardBody.appendChild(friendsP);

  if (friends.length > 0) {
    // Create a container for friend thumbnails
    const friendsContainer = document.createElement("div");
    friendsContainer.classList.add("profilecard-text", "mb-3", "mx-auto");

    friends.forEach(friendObj => {
      const friend = friendObj.friend || {};
      const isFriendOnline = friendObj.is_online;

      if (friend.username) {
        // Create a friend button
        const friendLink = document.createElement("a");
        friendLink.style.textDecoration = "none";
        friendLink.href = `/profile/${friend.username}`;

        // Outer div
        const friendDiv = document.createElement("div");
        friendDiv.classList.add("btn", "btn-primary", "position-relative", "mx-2", "rounded");

        // Avatar
        const friendImg = document.createElement("img");
        friendImg.src = friend.avatar || "/media/avatars/default.jpg";
        friendImg.alt = `${friend.username} avatar`;
        friendImg.classList.add("img-thumbnail", "d-flex", "mx-auto", "my-auto");
        friendImg.style.width = "100px";
        friendImg.style.height = "100px";
        friendDiv.appendChild(friendImg);

        // Username label
        const userSpan = document.createElement("span");
        userSpan.classList.add("position-absolute", "border", "border-dark", "bg-white", "top-100", "start-50", "translate-middle", "text-dark", "rounded", "px-1");
        userSpan.style.whiteSpace = "nowrap";
        userSpan.textContent = friend.username;
        friendDiv.appendChild(userSpan);

        // Online/Offline indicator
        const statusSpan = document.createElement("span");
        statusSpan.classList.add("position-absolute", "top-0", "start-100", "translate-middle", "p-2", "border", "border-light", "rounded-circle");
        statusSpan.style.backgroundColor = isFriendOnline ? "green" : "red";
        friendDiv.appendChild(statusSpan);

        // Append friendDiv to link
        friendLink.appendChild(friendDiv);
        friendsContainer.appendChild(friendLink);
      } else {
        const unknownP = document.createElement("p");
        unknownP.textContent = "Unknown friend";
        friendsContainer.appendChild(unknownP);
      }
    });

    profileCardBody.appendChild(friendsContainer);
  } else {
    const noFriendsP = document.createElement("p");
    noFriendsP.classList.add("profilecard-text");
    noFriendsP.textContent = "You have no friends :(";
    profileCardBody.appendChild(noFriendsP);
  }

  colMd8.appendChild(profileCardBody);

  // Append left and right columns
  row.appendChild(colMd4);
  row.appendChild(colMd8);

  // Add row to the card
  cardDiv.appendChild(row);

  // Finally, append the entire card to the container
  container.appendChild(cardDiv);
}
