// spa.js
import { init_pong, unload_pong } from '/static/main/scripts/pong.js';
import { renderGames } from '/static/main/scripts/renderGames.js';
import { renderProfile } from '/static/main/scripts/renderProfile.js';
import { renderSomeProfile } from '/static/main/scripts/renderSomeProfile.js';

console.log("SPA with Hashing Loaded");

document.unload_pong = unload_pong;
document.init_pong = init_pong;

// Keep track of the currently active template
let currentTemplate = null;

// Runs once the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Check the current hash or default to 'home'
  let currentHash = window.location.hash.replace("#", "") || 'home';
  if (!currentHash) {
    currentHash = "home"; // fallback if no hash in the URL
    window.location.hash = currentHash; // set the hash explicitly
  }
  loadTemplate(currentHash);
});

// Listen for hash changes (Back/Forward or manual changes in the URL)
window.addEventListener("hashchange", () => {
  const newHash = window.location.hash.replace("#", "") || "home";
  loadTemplate(newHash);
});

/**
 * loadTemplate(templateName)
 * - Unloads any previously active page logic
 * - Swaps the content from #template-{templateName} into #main-content
 * - Loads page-specific logic (if needed)
 */
function loadTemplate(templateName) {
  console.log(`Loading template: ${templateName}`);

  // 1. Unload logic from the currently active page (if any)
  unloadPageLogic(currentTemplate);

  // 2. Get the cached partial from #template-cache
  const cacheDiv = document.getElementById(`template-${templateName}`);
  const mainContent = document.getElementById("main-content");
  if (!cacheDiv) {
    console.warn(`No cached template found for: ${templateName}`);
    mainContent.innerHTML = `<p>Template "${templateName}" not found.</p>`;
    currentTemplate = null;
    return;
  }


  // Fetching new context
  fetch(`/context/${templateName}/`)
      .then(response => {
        if (!response.ok)
          return;
        return response.json(); // Parse JSON response
    })
      .then(context => {
        if (!context){
          console.error(`Error fetching in context for ${templateName}:`, err);
          return;
        }
          currentTemplate = templateName;
          mainContent.innerHTML = cacheDiv.innerHTML;
          loadPageLogic(templateName);
          updateActiveNav(templateName);
          if (templateName === "games") {
            console.log("Games data:", context.games); 
            renderGames(context.games);
            return;
          }
          if (templateName === "profile") {
            console.log("Rendering Profile");
            renderProfile(context);
            console.log("Rendering Profile done");
            return;
          } else if (context.someProfile) {
            console.log("Profile some data:", context.someProfile); 
            renderSomeProfile(profileSomeContext);
            return;
          }
      })
      .catch(err => { //Still renders template without context
          console.error(`Error fetching context for ${templateName}:`, err);
          const cacheDiv = document.getElementById(`template-${templateName}`);
          if (cacheDiv) {
              mainContent.innerHTML = cacheDiv.innerHTML;
          } else {
              mainContent.innerHTML = `<p>Error loading content for "${templateName}". Please try again later.</p>`;
          }
          updateActiveNav(templateName);
          currentTemplate = templateName;

      });

}

/**
 * updateActiveNav(templateName)
 * - Highlights the correct navbar link (if it exists)
 */
function updateActiveNav(templateName) {
  // Remove 'active' class from all nav items
  document.querySelectorAll('.navbar-nav .nav-item').forEach(item => {
    item.classList.remove('active');
  });

  // Add 'active' class to the corresponding nav item
  const activeLink = document.querySelector(`[href="#${templateName}"]`);
  if (activeLink) {
    activeLink.closest('.nav-item').classList.add('active');
  }
}

/**
 * loadPageLogic(templateName)
 * - Initializes logic when a new template is loaded
 */
function loadPageLogic(templateName) {
  if (templateName === 'pong') {
    init_pong();
  }
}

/**
 * unloadPageLogic(oldTemplate)
 * - Cleans up logic/resources from the previously active page
 */
function unloadPageLogic(oldTemplate) {
  if (oldTemplate === 'pong') {
    unload_pong();
  }
  // Add other pages' unload logic as needed
}
