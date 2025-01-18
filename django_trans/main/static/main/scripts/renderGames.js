
export function renderGames(games) {
    const gamesList = document.getElementById("games-list");
    const noGames = document.getElementById("no-games");
  
    // Clear existing items
    gamesList.innerHTML = "";
  
    if (!games || games.length === 0) {
      // Show fallback message
      noGames.style.display = "block";
      return;
    } else {
      noGames.style.display = "none";
    }
  
    games.forEach(game => {
      // Create a <li> for each game
      const listItem = document.createElement("li");
      listItem.classList.add("list-group-item");
  
      // Build the match card structure
      const cardDiv = document.createElement("div");
      cardDiv.classList.add("card");
  
      const matchCardBody = document.createElement("div");
      matchCardBody.classList.add("matchcard-body");
  
      // Row: Date + Score
      const rowDiv = document.createElement("div");
      rowDiv.classList.add("row");
  
      const dateCol = document.createElement("div");
      dateCol.classList.add("col-6");
      dateCol.innerHTML = `<strong>Date:</strong> ${new Date(game.date).toLocaleString()}`;
  
      const scoreCol = document.createElement("div");
      scoreCol.classList.add("col-auto", "text-white", "bg-dark", "rounded");
      scoreCol.style.fontFamily = "'Orbitron', sans-serif";
  
      // Build the scoreboard: player scores
      let scoreHTML = "";
      if (game.players && game.players.length > 0) {
        game.players.forEach((player, idx) => {
          scoreHTML += `<span class="fs-2 fw-bold">${player.score}</span>`;
          if (idx === 0 && game.players.length > 1) {
            scoreHTML += `<span class="fs-2">:</span>`;
          }
        });
      }
      scoreCol.innerHTML = `<div class="mx-auto">${scoreHTML}</div>`;
  
      // Append columns
      rowDiv.appendChild(dateCol);
      rowDiv.appendChild(scoreCol);
  
      // Next row: "Players:"
      const playersHeaderRow = document.createElement("div");
      playersHeaderRow.classList.add("row", "mt-1", "text-white", "pb-1", "bg-secondary", "rounded-bottom-0", "border", "border-black", "rounded", "ms-0", "me-2");
      playersHeaderRow.innerHTML = `<strong>Players:</strong>`;
  
      // Players listing
      const playersRow = document.createElement("div");
      playersRow.classList.add("row", "ms-0", "me-2");
  
      const playersList = document.createElement("ul");
      playersList.classList.add("bg-secondary-subtle", "rounded-top-0", "border", "rounded", "border-black");
  
      // Build each player's item
      if (game.players) {
        game.players.forEach(player => {
          const playerItem = document.createElement("li");
          playerItem.classList.add("d-flex", "align-items-center", "border-secondary", "border-bottom", "pt-1");
  
          // Player avatar
          const colAuto = document.createElement("div");
          colAuto.classList.add("col-auto");
  
          const positionRelative = document.createElement("div");
          positionRelative.classList.add("position-relative");
  
          const avatarImg = document.createElement("img");
          avatarImg.src = player.user.avatar;
          avatarImg.alt = `${player.user.username}'s avatar`;
          avatarImg.classList.add("mb-1");
          avatarImg.style.width = "100px";
          avatarImg.style.height = "100px";
          avatarImg.style.marginRight = "10px";
  
          positionRelative.appendChild(avatarImg);
  
          // Crown icon for winner
          if (player.winner) {
            const winnerIcon = document.createElement("div");
            winnerIcon.classList.add("position-absolute", "top-0", "start-50", "translate-middle-x", "fs-5");
            winnerIcon.style.zIndex = 9999;
            winnerIcon.textContent = "👑";
            positionRelative.appendChild(winnerIcon);
          }
  
          colAuto.appendChild(positionRelative);
          playerItem.appendChild(colAuto);
  
          // Username
          const userCol = document.createElement("div");
          userCol.classList.add("col-2");
          userCol.innerHTML = `<a href="/profile/${player.user.username}" style="white-space: nowrap;">
                                  ${player.user.username}
                              </a>`;
          playerItem.appendChild(userCol);
  
          // Alias
          const aliasCol = document.createElement("div");
          aliasCol.classList.add("col-2");
          if (player.user.alias) {
            aliasCol.innerHTML = `AKA ${player.user.alias}`;
          }
          playerItem.appendChild(aliasCol);
  
          // Score + winner
          const scoreCol = document.createElement("div");
          scoreCol.classList.add("col-4");
          scoreCol.textContent = `Score: ${player.score}`;
          if (player.winner) {
            scoreCol.textContent += " Winner👑";
          }
          playerItem.appendChild(scoreCol);
  
          playersList.appendChild(playerItem);
        });
      }
  
      playersRow.appendChild(playersList);
  
      // Append everything
      matchCardBody.appendChild(rowDiv);
      matchCardBody.appendChild(playersHeaderRow);
      matchCardBody.appendChild(playersRow);
  
      cardDiv.appendChild(matchCardBody);
      listItem.appendChild(cardDiv);
  
      gamesList.appendChild(listItem);
    });
  }
  