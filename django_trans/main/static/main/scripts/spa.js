// spa.js
import { init_pong, unload_pong } from '/static/main/scripts/pong.js';

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

  // 3. Insert the partial's HTML into the main content
  mainContent.innerHTML = cacheDiv.innerHTML;

  // 4. Load any logic specific to this new page
  loadPageLogic(templateName);

  // 5. Update navbar highlight
  updateActiveNav(templateName);

  // 6. Record the new template as current
  currentTemplate = templateName;
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
