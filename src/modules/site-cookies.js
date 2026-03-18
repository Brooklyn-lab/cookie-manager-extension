import { state } from "./state.js";
import { showToast, debugLog, showStatus, clearStatusMessage, breakLongString, formatCookieValue } from "./ui.js";
import { autoSyncCookieStates } from "./cookies.js";

// Function to clear all site data (cookies + storage)
export function clearAllSiteData(domain, url) {
  // Check if URL is a restricted chrome:// or extension:// URL
  if (
    url &&
    (url.startsWith("chrome://") ||
      url.startsWith("chrome-extension://") ||
      url.startsWith("moz-extension://"))
  ) {
    showStatus(
      "Cannot clear data on restricted pages (chrome:// URLs)",
      "error"
    );
    return;
  }

  showStatus("Clearing all site data...", "info");

  // First manually clear storage through script injection (most reliable)
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs[0]) {
      showStatus("No active tab found", "error");
      return;
    }

    // Additional URL check from tab
    const tabUrl = tabs[0].url;
    if (
      tabUrl &&
      (tabUrl.startsWith("chrome://") ||
        tabUrl.startsWith("chrome-extension://") ||
        tabUrl.startsWith("moz-extension://"))
    ) {
      showStatus("Cannot clear data on restricted pages", "error");
      return;
    }

    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        func: function () {
          let clearedItems = {
            localStorage: 0,
            sessionStorage: 0,
            indexedDB: false,
            error: null,
          };

          try {
            // Clear localStorage
            if (typeof localStorage !== "undefined") {
              clearedItems.localStorage = localStorage.length;
              localStorage.clear();
            }

            // Clear sessionStorage
            if (typeof sessionStorage !== "undefined") {
              clearedItems.sessionStorage = sessionStorage.length;
              sessionStorage.clear();
            }

            // Clear IndexedDB (more complex)
            if (typeof indexedDB !== "undefined") {
              try {
                // Get all databases and delete them
                if (indexedDB.databases) {
                  indexedDB.databases().then((databases) => {
                    databases.forEach((db) => {
                      if (db.name) {
                        const deleteReq = indexedDB.deleteDatabase(db.name);
                        deleteReq.onsuccess = () => {
                          // Database deleted successfully
                        };
                      }
                    });
                  });
                }
                clearedItems.indexedDB = true;
              } catch (e) {
                console.warn("Could not clear IndexedDB:", e);
              }
            }

            return { success: true, cleared: clearedItems };
          } catch (e) {
            return { success: false, error: e.message };
          }
        },
      },
      function (results) {
        if (results && results[0] && results[0].result) {
          const result = results[0].result;
          if (result.success) {
            debugLog(
              `Manual storage clear: localStorage(${result.cleared.localStorage}) sessionStorage(${result.cleared.sessionStorage}) indexedDB(${result.cleared.indexedDB})`
            );

            // After manual clearing, use browsingData API for additional cleanup
            chrome.browsingData.remove(
              {
                origins: [url],
              },
              {
                localStorage: true,
                indexedDB: true,
                webSQL: true,
                cacheStorage: true,
                serviceWorkers: true,
                cache: true,
              },
              function () {
                // Clear cookies last
                clearAllSiteCookies(domain);

                if (chrome.runtime.lastError) {
                  showStatus(
                    `Cleared storage manually, browsingData error: ${chrome.runtime.lastError.message}`,
                    "success"
                  );
                } else {
                  showStatus(`Cleared all data for ${domain}`, "success");
                }

                // Auto-refresh page after a short delay to ensure everything is cleared
                setTimeout(() => {
                  chrome.tabs.reload(tabs[0].id);
                }, 1000);
              }
            );
          } else {
            showStatus(`Error clearing storage: ${result.error}`, "error");
          }
        } else {
          showStatus("Failed to clear storage", "error");
        }
      }
    );
  });
}

// Function to clear all cookies for the current site
export function clearAllSiteCookies(domain) {
  // Show loading message
  showStatus("Clearing cookies...", "info");

  // Get current tab URL to get ALL cookies accessible to this page
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs[0]) {
      showStatus("No active tab found", "error");
      return;
    }

    const currentUrl = tabs[0].url;

    // Check if URL is restricted
    if (
      currentUrl &&
      (currentUrl.startsWith("chrome://") ||
        currentUrl.startsWith("chrome-extension://") ||
        currentUrl.startsWith("moz-extension://"))
    ) {
      showStatus("Cannot clear cookies on restricted pages", "error");
      return;
    }

    // Get cookies for current URL (this gets ALL cookies accessible to this page, including third-party)
    chrome.cookies.getAll({ url: currentUrl }, function (siteCookies) {
      if (chrome.runtime.lastError) {
        showStatus(
          `Error getting cookies: ${chrome.runtime.lastError.message}`,
          "error"
        );
        return;
      }

      debugLog(
        `Found ${siteCookies.length} cookies accessible to ${currentUrl}`
      );

      if (siteCookies.length === 0) {
        showStatus("No cookies found for this site", "info");
        return;
      }

      // Remove each cookie
      let removedCount = 0;
      let successCount = 0;
      let totalCount = siteCookies.length;

      siteCookies.forEach((cookie) => {
        // Generate URL for cookie removal using the original cookie domain
        let cookieDomain = cookie.domain;

        // Remove leading dot if present, but try different approaches
        const domainVariants = [];
        if (cookieDomain.startsWith(".")) {
          domainVariants.push(cookieDomain.substring(1)); // Remove dot
          domainVariants.push(domain); // Try current domain
        } else {
          domainVariants.push(cookieDomain);
        }

        const protocols = ["https", "http"];
        let attemptIndex = 0;
        let allAttempts = [];

        // Generate all possible URL combinations
        domainVariants.forEach((domVar) => {
          protocols.forEach((protocol) => {
            allAttempts.push(`${protocol}://${domVar}${cookie.path || "/"}`);
          });
        });

        function tryRemove() {
          if (attemptIndex >= allAttempts.length) {
            removedCount++;
            debugLog(
              `Failed to remove cookie: ${cookie.name} from ${cookie.domain}`
            );
            if (removedCount === totalCount) {
              showStatus(
                `Removed ${successCount} of ${totalCount} cookies from this page`,
                "success"
              );

              // Sync saved cookie buttons after clearing all cookies
              setTimeout(() => {
                autoSyncCookieStates();
              }, 300);
            }
            return;
          }

          const url = allAttempts[attemptIndex];
          debugLog(`Trying to remove ${cookie.name} with URL: ${url}`);

          chrome.cookies.remove(
            {
              url: url,
              name: cookie.name,
            },
            function (details) {
              if (details) {
                successCount++;
                removedCount++;
                debugLog(
                  `✓ Successfully removed: ${cookie.name} from ${cookie.domain}`
                );
                if (removedCount === totalCount) {
                  showStatus(
                    `Removed ${successCount} of ${totalCount} cookies from this page`,
                    "success"
                  );

                  // Sync saved cookie buttons after clearing all cookies
                  setTimeout(() => {
                    autoSyncCookieStates();
                  }, 300);
                }
              } else {
                attemptIndex++;
                tryRemove();
              }
            }
          );
        }

        tryRemove();
      });
    });
  });
}

// Function to display information about cookies in the extension popup
export function showSiteCookiesInfo(domain) {
  const statusMessage = document.getElementById("status-message");

  // Show loading message
  showStatus("Loading cookies...", "info");

  // Get all cookies
  chrome.cookies.getAll({}, function (allCookies) {
    if (chrome.runtime.lastError) {
      showStatus(
        `Error getting cookies: ${chrome.runtime.lastError.message}`,
        "error"
      );
      return;
    }

    // Filter cookies for the current domain
    const siteCookies = allCookies.filter((cookie) => {
      // Exact domain match
      if (cookie.domain === domain) return true;

      // Check if domain is a subdomain of cookie.domain (for .example.com cookies)
      if (
        cookie.domain.startsWith(".") &&
        domain.endsWith(cookie.domain.substring(1))
      )
        return true;

      return false;
    });

    // Create HTML elements for cookie display
    const cookiesContainer = document.createElement("div");
    cookiesContainer.className = "site-cookies-container";

    const headerElement = document.createElement("div");
    headerElement.className = "site-cookies-header";
    headerElement.textContent = `Site cookies for ${domain}`;
    cookiesContainer.appendChild(headerElement);

    const countElement = document.createElement("div");
    countElement.className = "site-cookies-count";
    countElement.textContent = `Total cookies found: ${siteCookies.length}`;
    cookiesContainer.appendChild(countElement);

    if (siteCookies.length === 0) {
      const noCookiesElement = document.createElement("div");
      noCookiesElement.className = "site-cookies-none";
      noCookiesElement.textContent = "No cookies found for this site.";
      cookiesContainer.appendChild(noCookiesElement);
    } else {
      // Sort cookies alphabetically by name
      siteCookies.sort((a, b) => a.name.localeCompare(b.name));

      siteCookies.forEach((cookie, index) => {
        const cookieElement = document.createElement("div");
        cookieElement.className = "site-cookie-item search-result-item";

        const cookieHeader = document.createElement("div");
        cookieHeader.className = "search-cookie-header";

        const nameValueDiv = document.createElement("div");
        nameValueDiv.className = "search-name-value";

        // Create name section safely
        const nameLabel = document.createElement("strong");
        nameLabel.textContent = "Name:";
        const nameSpan = document.createElement("span");
        nameSpan.className = "clickable-site-cookie-name";
        nameSpan.setAttribute("data-cookie-name", cookie.name);
        nameSpan.title = "Click to copy cookie name";
        nameSpan.textContent = breakLongString(cookie.name);

        const lineBreak = document.createElement("br");

        // Create value section safely
        const valueLabel = document.createElement("strong");
        valueLabel.textContent = "Value:";
        const valueSpan = document.createElement("span");
        valueSpan.className = "clickable-site-cookie-value";
        valueSpan.setAttribute("data-cookie-value", cookie.value);
        valueSpan.title = "Click to copy cookie value";
        valueSpan.textContent = breakLongString(
          formatCookieValue(cookie.value)
        );

        // Append all elements
        nameValueDiv.appendChild(nameLabel);
        nameValueDiv.appendChild(document.createTextNode(" "));
        nameValueDiv.appendChild(nameSpan);
        nameValueDiv.appendChild(lineBreak);
        nameValueDiv.appendChild(valueLabel);
        nameValueDiv.appendChild(document.createTextNode(" "));
        nameValueDiv.appendChild(valueSpan);

        // Create edit button
        const editBtn = document.createElement("button");
        editBtn.className = "search-cookie-edit-btn";
        editBtn.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#007bff"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';
        editBtn.title = "Edit cookie value";
        editBtn.setAttribute("data-cookie-name", cookie.name);
        editBtn.setAttribute("data-cookie-domain", cookie.domain);
        editBtn.setAttribute("data-cookie-path", cookie.path || "/");
        editBtn.setAttribute("data-cookie-value", cookie.value);

        // Create delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "site-cookie-delete-btn";
        deleteBtn.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 32 32" fill="#dc3545"><path d="M5 7v19c0 1.326.527 2.598 1.464 3.536A5.004 5.004 0 0 0 10 31h12a5.004 5.004 0 0 0 3.536-1.464A5.004 5.004 0 0 0 27 26V7h3a1 1 0 0 0 0-2H2a1 1 0 0 0 0 2h3Zm20 0v19c0 .796-.316 1.559-.879 2.121A2.996 2.996 0 0 1 22 29H10a2.996 2.996 0 0 1-2.121-.879A2.996 2.996 0 0 1 7 26V7h18ZM11 3h10a1 1 0 0 0 0-2H11a1 1 0 0 0 0 2Z"/><path d="M12 12v12a1 1 0 0 0 2 0V12a1 1 0 0 0-2 0ZM18 12v12a1 1 0 0 0 2 0V12a1 1 0 0 0-2 0Z"/></svg>';
        deleteBtn.title = "Delete this cookie";
        deleteBtn.setAttribute("data-cookie-name", cookie.name);
        deleteBtn.setAttribute("data-cookie-domain", cookie.domain);
        deleteBtn.setAttribute("data-cookie-path", cookie.path || "/");

        // Create save button
        const saveBtn = document.createElement("button");
        saveBtn.className = "search-cookie-save-btn";
        saveBtn.title = "Save cookie to your list";
        saveBtn.setAttribute("data-cookie-name", cookie.name);
        saveBtn.setAttribute("data-cookie-domain", cookie.domain);
        saveBtn.setAttribute("data-cookie-path", cookie.path || "/");
        saveBtn.setAttribute("data-cookie-value", cookie.value);
        saveBtn.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#28a745"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>';

        // Create button container
        const buttonContainer = document.createElement("div");
        buttonContainer.className = "search-cookie-buttons";
        buttonContainer.appendChild(saveBtn);
        buttonContainer.appendChild(editBtn);
        buttonContainer.appendChild(deleteBtn);

        cookieHeader.appendChild(nameValueDiv);
        cookieHeader.appendChild(buttonContainer);

        cookieElement.appendChild(cookieHeader);

        const cookieDetailsDiv = document.createElement("div");
        cookieDetailsDiv.className = "cookie-details-search";

        const cookieDomain = document.createElement("div");
        cookieDomain.className = "site-cookie-domain";
        cookieDomain.innerHTML = `<strong>Domain:</strong> ${
          cookie.domain || domain
        }`;
        cookieDetailsDiv.appendChild(cookieDomain);

        const cookiePath = document.createElement("div");
        cookiePath.className = "site-cookie-path";
        cookiePath.innerHTML = `<strong>Path:</strong> ${cookie.path || "/"}`;
        cookieDetailsDiv.appendChild(cookiePath);

        const cookieExpires = document.createElement("div");
        cookieExpires.className = "site-cookie-expires";
        if (cookie.expirationDate) {
          const expiryDate = new Date(cookie.expirationDate * 1000);
          cookieExpires.innerHTML = `<strong>Expires:</strong> ${expiryDate.toLocaleString()}`;
        } else {
          cookieExpires.innerHTML = `<strong>Expires:</strong> Session cookie`;
        }
        cookieDetailsDiv.appendChild(cookieExpires);

        const sameSiteVal = cookie.sameSite || "unspecified";
        const sameSiteLabel = { no_restriction: "None", lax: "Lax", strict: "Strict", unspecified: "Unspecified" }[sameSiteVal] || sameSiteVal;
        const sameSiteCssClass = { no_restriction: "samesite-none", lax: "samesite-lax", strict: "samesite-strict", unspecified: "samesite-unspecified" }[sameSiteVal] || "samesite-unspecified";

        const cookieFlags = document.createElement("div");
        cookieFlags.className = "site-cookie-flags";
        cookieFlags.innerHTML = `<strong>Secure:</strong> ${
          cookie.secure ? "Yes" : "No"
        } | <strong>HttpOnly:</strong> ${cookie.httpOnly ? "Yes" : "No"
        } | <strong>SameSite:</strong> <span class="samesite-badge ${sameSiteCssClass}">${sameSiteLabel}</span>`;
        cookieDetailsDiv.appendChild(cookieFlags);

        cookieElement.appendChild(cookieDetailsDiv);

        cookiesContainer.appendChild(cookieElement);
      });
    }

    // Clear previous content and append the new container
    statusMessage.innerHTML = "";
    statusMessage.appendChild(cookiesContainer);
    statusMessage.className = "info";
    statusMessage.style.display = "block";

    // Set flag to indicate site cookies are displayed
    state.siteCookiesDisplayed = true;

    // Scroll to the site cookies section after it's displayed
    setTimeout(() => {
      statusMessage.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  });
}

// Function to delete a specific site cookie
export function deleteSiteCookie(cookieName, cookieDomain, cookiePath) {
  const statusMessage = document.getElementById("status-message");

  // Try both http and https protocols to ensure cookie is removed
  const protocols = ["https", "http"];
  let removalAttempts = 0;
  let successfulRemoval = false;

  function attemptRemoval(protocol) {
    const cookieDetails = {
      name: cookieName,
      url: `${protocol}://${cookieDomain.replace(/^\./, "")}${cookiePath}`,
    };

    chrome.cookies.remove(cookieDetails, function (result) {
      removalAttempts++;

      if (result && !successfulRemoval) {
        successfulRemoval = true;

        showToast(`Cookie "${cookieName}" deleted successfully`, "error");

        // Remove the specific cookie element from site cookies display (same logic as search results)
        const siteCookieItems =
          statusMessage.querySelectorAll(".site-cookie-item");
        siteCookieItems.forEach((item) => {
          const deleteBtn = item.querySelector(".site-cookie-delete-btn");
          if (
            deleteBtn &&
            deleteBtn.getAttribute("data-cookie-name") === cookieName &&
            deleteBtn.getAttribute("data-cookie-domain") === cookieDomain &&
            deleteBtn.getAttribute("data-cookie-path") === cookiePath
          ) {
            item.remove();
          }
        });

        // Update the count manually without calling problematic functions
        const countElement = statusMessage.querySelector(
          ".site-cookies-count"
        );
        const remainingItems =
          statusMessage.querySelectorAll(".site-cookie-item");
        if (countElement) {
          countElement.textContent = `Total cookies found: ${remainingItems.length}`;

          // Renumber remaining cookies manually (safe way)
          remainingItems.forEach((item, index) => {
            const header = item.querySelector(".site-cookie-header");
            if (header) {
              const firstChild = header.firstChild;
              if (firstChild && firstChild.nodeType === Node.TEXT_NODE) {
                firstChild.textContent = `${index + 1}. `;
              }
            }
          });

          // If no cookies left, show "no cookies" message and auto-close after 5 seconds
          if (remainingItems.length === 0) {
            const cookiesContainer = statusMessage.querySelector(
              ".site-cookies-container"
            );
            if (cookiesContainer) {
              const noCookiesElement = document.createElement("div");
              noCookiesElement.className = "site-cookies-none";
              noCookiesElement.textContent =
                "No cookies found for this site.";
              cookiesContainer.appendChild(noCookiesElement);

              // Auto-close site cookies window after 5 seconds
              showToast(
                "Site cookies window will close in 5 seconds",
                "info",
                5000
              );
              setTimeout(() => {
                state.siteCookiesDisplayed = false;
                clearStatusMessage();
              }, 5000);
            }
          }
        }

        // Sync saved cookie buttons after cookie deletion
        setTimeout(() => {
          autoSyncCookieStates();
        }, 200);

        return;
      }

      // If both attempts are done and none successful
      if (removalAttempts >= protocols.length && !successfulRemoval) {
        if (chrome.runtime.lastError) {
          showToast(
            `Error deleting cookie "${cookieName}": ${chrome.runtime.lastError.message}`,
            "error"
          );
        } else {
          showToast(
            `Cookie "${cookieName}" not found or could not be deleted`,
            "error"
          );
        }
      }
    });
  }

  // Try both protocols
  protocols.forEach((protocol) => {
    attemptRemoval(protocol);
  });
}

// Helper function to refresh the site cookies display
export function refreshSiteCookiesDisplay() {
  const statusMessage = document.getElementById("status-message");

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0]) {
      try {
        const urlObj = new URL(tabs[0].url);
        const domain = urlObj.hostname;

        // Save current scroll position
        const savedScrollTop = statusMessage.scrollTop;

        showSiteCookiesInfo(domain);

        // Restore scroll position after a short delay to allow content to render
        setTimeout(() => {
          statusMessage.scrollTop = savedScrollTop;
        }, 10);
      } catch (e) {
        console.error("Error refreshing cookies display:", e);
      }
    }
  });
}

// Function to remove specific cookie element from DOM without refreshing entire list
export function removeCookieElementFromDOM(cookieName, cookieDomain, cookiePath) {
  // Find all delete buttons and locate the one that matches our cookie
  const deleteButtons = document.querySelectorAll(".site-cookie-delete-btn");

  deleteButtons.forEach((button) => {
    const btnCookieName = button.getAttribute("data-cookie-name");
    const btnCookieDomain = button.getAttribute("data-cookie-domain");
    const btnCookiePath = button.getAttribute("data-cookie-path");

    if (
      btnCookieName === cookieName &&
      btnCookieDomain === cookieDomain &&
      btnCookiePath === cookiePath
    ) {
      // Find the parent cookie item and remove it
      const cookieItem = button.closest(".site-cookie-item");
      if (cookieItem) {
        cookieItem.remove();

        // Update the cookie count and renumber remaining cookies
        updateCookieCount();
        renumberCookies();
      }
    }
  });
}

// Function to update cookie count after deletion
export function updateCookieCount() {
  const countElement = document.querySelector(".site-cookies-count");
  const cookieItems = document.querySelectorAll(".site-cookie-item");

  if (countElement) {
    countElement.textContent = `Total cookies found: ${cookieItems.length}`;

    // If no cookies left, show "no cookies" message
    if (cookieItems.length === 0) {
      const cookiesContainer = document.querySelector(
        ".site-cookies-container"
      );
      if (cookiesContainer) {
        const noCookiesElement = document.createElement("div");
        noCookiesElement.className = "site-cookies-none";
        noCookiesElement.textContent = "No cookies found for this site.";
        cookiesContainer.appendChild(noCookiesElement);
      }
    }
  }
}

// Function to renumber remaining cookies after deletion
export function renumberCookies() {
  const cookieHeaders = document.querySelectorAll(".site-cookie-header");

  cookieHeaders.forEach((header, index) => {
    // Find the text node that contains the number and update only that
    const firstChild = header.firstChild;
    if (firstChild && firstChild.nodeType === Node.TEXT_NODE) {
      // Update only the number part, preserve the rest of the HTML
      firstChild.textContent = `${index + 1}. `;
    } else {
      // Fallback: if structure is different, find and update the number
      const headerText = header.textContent;
      const numberMatch = headerText.match(/^\d+\./);
      if (numberMatch) {
        header.innerHTML = header.innerHTML.replace(
          /^\d+\./,
          `${index + 1}.`
        );
      }
    }
  });
}

// Function to copy site cookie name to clipboard
export function copySiteCookieNameToClipboard(cookieName, cookieItem) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(cookieName)
      .then(() => {
        showToast("✓ Cookie name copied!", "success");
      })
      .catch((err) => {
        debugLog(`Clipboard API failed: ${err}`, "error");
        fallbackCopySiteCookieToClipboard(cookieName, "name", cookieItem);
      });
  } else {
    fallbackCopySiteCookieToClipboard(cookieName, "name", cookieItem);
  }
}

// Function to copy site cookie value to clipboard
export function copySiteCookieValueToClipboard(cookieValue, cookieItem) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(cookieValue)
      .then(() => {
        showToast("✓ Cookie value copied!", "success");
      })
      .catch((err) => {
        debugLog(`Clipboard API failed: ${err}`, "error");
        fallbackCopySiteCookieToClipboard(cookieValue, "value", cookieItem);
      });
  } else {
    fallbackCopySiteCookieToClipboard(cookieValue, "value", cookieItem);
  }
}

// Fallback function for copying site cookie data to clipboard
function fallbackCopySiteCookieToClipboard(text, type, cookieItem) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.className = "hidden-textarea";
  document.body.appendChild(textArea);

  try {
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    if (successful) {
      showToast(`✓ Cookie ${type} copied!`, "success");
    } else {
      showToast(`❌ Failed to copy cookie ${type}`, "error");
    }
  } catch (err) {
    debugLog(`Fallback copy failed: ${err}`, "error");
    showToast("❌ Copy not supported", "error");
  }

  document.body.removeChild(textArea);
}

// Function to remove cookie item from site cookies display
export function removeSiteCookieItem(cookieName, cookieDomain, cookiePath) {
  const statusMessage = document.getElementById("status-message");
  const siteCookieItems = statusMessage.querySelectorAll(".site-cookie-item");

  siteCookieItems.forEach((item) => {
    const deleteBtn = item.querySelector(".site-cookie-delete-btn");
    if (deleteBtn) {
      const itemCookieName = deleteBtn.getAttribute("data-cookie-name");
      const itemCookieDomain = deleteBtn.getAttribute("data-cookie-domain");
      const itemCookiePath = deleteBtn.getAttribute("data-cookie-path");

      if (
        itemCookieName === cookieName &&
        itemCookieDomain === cookieDomain &&
        itemCookiePath === cookiePath
      ) {
        item.remove();
      }
    }
  });
}

// Function to update cookie value in site cookies display
export function updateSiteCookieValue(
  cookieName,
  cookieDomain,
  cookiePath,
  newValue
) {
  const statusMessage = document.getElementById("status-message");
  const siteCookieItems = statusMessage.querySelectorAll(".site-cookie-item");

  siteCookieItems.forEach((item) => {
    const editBtn = item.querySelector(".search-cookie-edit-btn");
    if (editBtn) {
      const itemCookieName = editBtn.getAttribute("data-cookie-name");
      const itemCookieDomain = editBtn.getAttribute("data-cookie-domain");
      const itemCookiePath = editBtn.getAttribute("data-cookie-path");

      if (
        itemCookieName === cookieName &&
        itemCookieDomain === cookieDomain &&
        itemCookiePath === cookiePath
      ) {
        // Update the data attribute with new value
        editBtn.setAttribute("data-cookie-value", newValue);

        // Update the displayed value
        const valueSpan = item.querySelector(".clickable-site-cookie-value");
        if (valueSpan) {
          valueSpan.setAttribute("data-cookie-value", newValue);
          valueSpan.textContent = breakLongString(
            formatCookieValue(newValue)
          );
        }

        return;
      }
    }
  });
}

// Function to update cookie name and value in site cookies display
export function updateSiteCookieName(
  oldCookieName,
  cookieDomain,
  cookiePath,
  newCookieName,
  newValue
) {
  const statusMessage = document.getElementById("status-message");
  const siteCookieItems = statusMessage.querySelectorAll(".site-cookie-item");

  siteCookieItems.forEach((item) => {
    const editBtn = item.querySelector(".search-cookie-edit-btn");
    if (editBtn) {
      const itemCookieName = editBtn.getAttribute("data-cookie-name");
      const itemCookieDomain = editBtn.getAttribute("data-cookie-domain");
      const itemCookiePath = editBtn.getAttribute("data-cookie-path");

      if (
        itemCookieName === oldCookieName &&
        itemCookieDomain === cookieDomain &&
        itemCookiePath === cookiePath
      ) {
        // Update data attributes with new name and value
        editBtn.setAttribute("data-cookie-name", newCookieName);
        editBtn.setAttribute("data-cookie-value", newValue);

        // Update delete button data attribute too
        const deleteBtn = item.querySelector(".site-cookie-delete-btn");
        if (deleteBtn) {
          deleteBtn.setAttribute("data-cookie-name", newCookieName);
        }

        // Update displayed name
        const nameSpan = item.querySelector(".clickable-site-cookie-name");
        if (nameSpan) {
          nameSpan.textContent = newCookieName;
        }

        // Update displayed value
        const valueSpan = item.querySelector(".clickable-site-cookie-value");
        if (valueSpan) {
          valueSpan.setAttribute("data-cookie-value", newValue);
          valueSpan.textContent = breakLongString(
            formatCookieValue(newValue)
          );
        }

        return;
      }
    }
  });
}
