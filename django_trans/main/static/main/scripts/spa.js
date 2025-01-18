// spa.js
import { init_pong, unload_pong } from '/static/main/scripts/pong.js';
import { renderGames } from '/static/main/scripts/renderGames.js';
import { renderProfile } from '/static/main/scripts/renderProfile.js';

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
        if (!context)
          return;
        // Insert the partial's HTML into the main content
          mainContent.innerHTML = cacheDiv.innerHTML;
          if (context.games) {
            console.log("Games data:", context.games); 
          }
          else if (context.err) {
            console.log("Error data:", context.err); 
          }
          else if (context.profile) {
            renderProfile(profileContext);
          }
          else if (context.someProfile) {
            renderProfile(profileSomeContext);
          }
          else {
            console.log("FAILED", context);
          }
          // Load any logic specific to this new page
          loadPageLogic(templateName);

          // Update navbar highlight
          updateActiveNav(templateName);
          if (context.games)
            renderGames(context.games);
          if (context.profile)
            renderProfile(context.profile);
          // Record the new template as current
          currentTemplate = templateName;
      })
      .catch(err => { //Still renders template without context
          console.error(`Error fetching context for ${templateName}:`, err);

          // Render the cached HTML without context
          const cacheDiv = document.getElementById(`template-${templateName}`);
          if (cacheDiv) {
              mainContent.innerHTML = cacheDiv.innerHTML;
          } else {
              mainContent.innerHTML = `<p>Error loading content for "${templateName}". Please try again later.</p>`;
          }

          // Update navbar highlight
          updateActiveNav(templateName);

          // Record the new template as current
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
  if (templateName === 'profile') { //#templateName#username

  }
  // Add other pages' init logic as needed
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
