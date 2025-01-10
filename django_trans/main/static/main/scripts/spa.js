// spa.js

console.log("SPA with Hashing Loaded");

// Runs once the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // 1. Check the current hash or default to 'home'
  let currentHash = window.location.hash.replace("#", "") || 'home';
  if (!currentHash) {
    currentHash = "home"; // fallback if no hash in the URL
    window.location.hash = currentHash; // set the hash explicitly
  }
  loadTemplate(currentHash);
});

// 2. Listen for hash changes (back/forward or user manual changes in the URL)
window.addEventListener("hashchange", () => {
  const newHash = window.location.hash.replace("#", "") || "home";
  loadTemplate(newHash);
});


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
 * loadTemplate(templateName)
 * 
 * Swaps the content from #template-{templateName} into #main-content
 * This requires that you have a <div id="template-{templateName}"> inside #template-cache.
 */
function loadTemplate(templateName) {
  console.log(`Loading template: ${templateName}`);

  // The hidden container might look like <div id="template-cache"><div id="template-pong">...content...</div></div>
  const cacheDiv = document.getElementById(`template-${templateName}`);
  const mainContent = document.getElementById("main-content");

  if (!cacheDiv) {
    console.warn(`No cached template found for: ${templateName}`);
    // If missing, handle gracefully, for example:
    mainContent.innerHTML = `<p>Template "${templateName}" not found.</p>`;
    return;
  }

  // Insert the HTML from the cache into the main content
  mainContent.innerHTML = cacheDiv.innerHTML;
}
