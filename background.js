// This file is for background functionality
// It handles auto-applying cookies and extension installation events

console.log("Cookie Manager background script loaded");

// Listen for installation events
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("Cookie Manager extension installed");

    // Initialize storage settings
    chrome.storage.local.set({
      installedAt: new Date().toString(),
      savedCookies: [],
    });
  } else if (details.reason === "update") {
    console.log(`Cookie Manager updated from ${details.previousVersion}`);
  }
});

// If we need any background functionality in the future, it can be added here

// Message handler for working with cookies from popup.js
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // For future functionality extensions
  if (request.action === "getCookies") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentUrl = tabs[0].url;
      const urlObj = new URL(currentUrl);
      const domain = urlObj.hostname;

      // Get all cookies for current domain
      chrome.cookies.getAll({ domain }, function (cookies) {
        sendResponse({ cookies });
      });

      return true; // Return true for asynchronous response
    });

    return true;
  }
});

// Listen for tab updates to automatically set cookies
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  // Only trigger when page is fully loaded
  if (changeInfo.status === "complete" && tab.url) {
    try {
      const urlObj = new URL(tab.url);
      const domain = urlObj.hostname;

      // Check if there are active cookies for this domain
      chrome.storage.local.get(["savedCookies"], function (result) {
        const savedCookies = result.savedCookies || [];

        // Filter cookies for current domain and global cookies
        const applicableCookies = savedCookies.filter(function (cookie) {
          // Check if domain matches or it's a global cookie
          return (
            cookie.isActive &&
            (cookie.isGlobal ||
              cookie.domain === domain ||
              (cookie.domain &&
                cookie.domain.startsWith(".") &&
                domain.endsWith(cookie.domain.substring(1))))
          );
        });

        // Set cookies for current domain
        applicableCookies.forEach(function (cookie) {
          // Calculate expiration date
          const expirationDate = new Date();
          expirationDate.setDate(
            expirationDate.getDate() + cookie.expirationDays
          );

          // For global cookies, use current tab domain
          const cookieDomain = cookie.isGlobal
            ? null
            : cookie.domain.startsWith(".")
            ? cookie.domain
            : null;

          // Create object for chrome.cookies API
          const cookieDetails = {
            url: `http${domain.startsWith(".") ? "s" : ""}://${domain}${
              cookie.path
            }`,
            name: cookie.name,
            value: cookie.value,
            path: cookie.path,
            domain: cookieDomain,
            secure: false,
            httpOnly: false,
            expirationDate: Math.floor(expirationDate.getTime() / 1000),
          };

          // Set cookie
          chrome.cookies.set(cookieDetails, function (result) {
            if (chrome.runtime.lastError) {
              console.error(`Error: ${chrome.runtime.lastError.message}`);
            } else {
              console.log(
                `Cookie ${cookie.name} set for ${domain}${
                  cookie.isGlobal ? " (global)" : ""
                }`
              );
            }
          });
        });
      });
    } catch (e) {
      console.error(`Error processing URL: ${e.message}`);
    }
  }
});
