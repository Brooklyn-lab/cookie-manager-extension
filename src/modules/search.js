import { encryptionHelpers, validateCookieName, validateCookieValue } from "../utils.js";
import { state } from "./state.js";
import { showToast, debugLog, breakLongString, formatCookieValue } from "./ui.js";
import { autoSyncCookieStates, loadSavedCookies } from "./cookies.js";

// Function to safely create search results container
export function createSearchResultsContainer(cookies, headerText) {
  const container = document.createElement("div");

  // Create header
  const header = document.createElement("div");
  header.className = "search-cookie-header";
  const headerStrong = document.createElement("strong");
  headerStrong.textContent = headerText;
  header.appendChild(headerStrong);
  container.appendChild(header);

  // Create cookie items
  cookies.forEach((cookie) => {
    const cookieItem = document.createElement("div");
    cookieItem.className = "search-result-item";

    // Cookie header section
    const cookieHeader = document.createElement("div");
    cookieHeader.className = "search-cookie-header";

    // Name-value section
    const nameValueDiv = document.createElement("div");
    nameValueDiv.className = "search-name-value";

    // Name
    const nameLabel = document.createElement("strong");
    nameLabel.textContent = "Name:";
    const nameSpan = document.createElement("span");
    nameSpan.className = "clickable-name";
    nameSpan.setAttribute("data-cookie-name", cookie.name);
    nameSpan.title = "Click to copy name";
    nameSpan.textContent = breakLongString(cookie.name);

    const lineBreak = document.createElement("br");

    // Value
    const valueLabel = document.createElement("strong");
    valueLabel.textContent = "Value:";
    const valueSpan = document.createElement("span");
    valueSpan.className = "clickable-value";
    valueSpan.setAttribute("data-full-value", cookie.value);
    valueSpan.title = "Click to copy value";
    const displayValue =
      cookie.value.length > 50
        ? breakLongString(cookie.value.substring(0, 50)) + "..."
        : breakLongString(cookie.value);
    valueSpan.textContent = displayValue;

    nameValueDiv.appendChild(nameLabel);
    nameValueDiv.appendChild(document.createTextNode(" "));
    nameValueDiv.appendChild(nameSpan);
    nameValueDiv.appendChild(lineBreak);
    nameValueDiv.appendChild(valueLabel);
    nameValueDiv.appendChild(document.createTextNode(" "));
    nameValueDiv.appendChild(valueSpan);

    // Buttons section
    const buttonsDiv = document.createElement("div");
    buttonsDiv.className = "search-cookie-buttons";

    // Edit button
    const editBtn = document.createElement("button");
    editBtn.className = "search-cookie-edit-btn";
    editBtn.setAttribute("data-cookie-name", cookie.name);
    editBtn.setAttribute("data-cookie-domain", cookie.domain);
    editBtn.setAttribute("data-cookie-path", cookie.path);
    editBtn.setAttribute("data-cookie-value", cookie.value);
    editBtn.title = "Edit cookie value";
    editBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#007bff"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "search-cookie-delete-btn";
    deleteBtn.setAttribute("data-cookie-name", cookie.name);
    deleteBtn.setAttribute("data-cookie-domain", cookie.domain);
    deleteBtn.setAttribute("data-cookie-path", cookie.path);
    deleteBtn.title = "Delete this cookie";
    deleteBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 32 32" fill="#dc3545"><path d="M5 7v19c0 1.326.527 2.598 1.464 3.536A5.004 5.004 0 0 0 10 31h12a5.004 5.004 0 0 0 3.536-1.464A5.004 5.004 0 0 0 27 26V7h3a1 1 0 0 0 0-2H2a1 1 0 0 0 0 2h3Zm20 0v19c0 .796-.316 1.559-.879 2.121A2.996 2.996 0 0 1 22 29H10a2.996 2.996 0 0 1-2.121-.879A2.996 2.996 0 0 1 7 26V7h18ZM11 3h10a1 1 0 0 0 0-2H11a1 1 0 0 0 0 2Z"/><path d="M12 12v12a1 1 0 0 0 2 0V12a1 1 0 0 0-2 0ZM18 12v12a1 1 0 0 0 2 0V12a1 1 0 0 0-2 0Z"/></svg>';

    // Save button
    const saveBtn = document.createElement("button");
    saveBtn.className = "search-cookie-save-btn";
    saveBtn.setAttribute("data-cookie-name", cookie.name);
    saveBtn.setAttribute("data-cookie-domain", cookie.domain);
    saveBtn.setAttribute("data-cookie-path", cookie.path);
    saveBtn.setAttribute("data-cookie-value", cookie.value);
    saveBtn.title = "Save cookie to your list";
    saveBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#28a745"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>';

    buttonsDiv.appendChild(saveBtn);
    buttonsDiv.appendChild(editBtn);
    buttonsDiv.appendChild(deleteBtn);

    cookieHeader.appendChild(nameValueDiv);
    cookieHeader.appendChild(buttonsDiv);

    // Cookie details section
    const detailsDiv = document.createElement("div");
    detailsDiv.className = "cookie-details-search";

    const domainStrong = document.createElement("strong");
    domainStrong.textContent = "Domain:";
    detailsDiv.appendChild(domainStrong);
    detailsDiv.appendChild(document.createTextNode(" " + cookie.domain));
    detailsDiv.appendChild(document.createElement("br"));

    const pathStrong = document.createElement("strong");
    pathStrong.textContent = "Path:";
    detailsDiv.appendChild(pathStrong);
    detailsDiv.appendChild(document.createTextNode(" " + cookie.path));
    detailsDiv.appendChild(document.createElement("br"));

    const secureStrong = document.createElement("strong");
    secureStrong.textContent = "Secure:";
    detailsDiv.appendChild(secureStrong);
    detailsDiv.appendChild(
      document.createTextNode(" " + (cookie.secure ? "Yes" : "No"))
    );
    detailsDiv.appendChild(document.createElement("br"));

    const httpOnlyStrong = document.createElement("strong");
    httpOnlyStrong.textContent = "HttpOnly:";
    detailsDiv.appendChild(httpOnlyStrong);
    detailsDiv.appendChild(
      document.createTextNode(" " + (cookie.httpOnly ? "Yes" : "No"))
    );

    cookieItem.appendChild(cookieHeader);
    cookieItem.appendChild(detailsDiv);
    container.appendChild(cookieItem);
  });

  return container;
}

// Function to search for a specific cookie on current site
export function searchCookieOnCurrentSite(cookieName) {
  // Validate that search term is not empty
  if (!cookieName || cookieName.trim() === "") {
    showToast("Please enter a cookie name to search", "error");
    clearSearchResult();
    // Clear cache to prevent stale results
    state.lastSearchQuery = null;
    state.lastSearchDomain = null;
    state.lastSearchResult = null;
    return;
  }

  const searchTerm = cookieName.toLowerCase().trim();

  // Get current domain for cache comparison
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs[0] || !tabs[0].url) {
      showToast("No active tab to search cookie", "error");
      clearSearchResult();
      return;
    }

    try {
      const urlObj = new URL(tabs[0].url);
      const domain = urlObj.hostname;

      // Check if we have cached result for same query and domain
      if (
        state.lastSearchQuery === searchTerm &&
        state.lastSearchDomain === domain &&
        state.lastSearchResult !== null
      ) {
        // Check if current displayed content is different from cached
        const searchResult = document.getElementById("search-result");
        const currentContent = searchResult.innerHTML;
        const currentType = searchResult.className.replace(
          "search-result ",
          ""
        );
        const isCurrentlyVisible =
          window.getComputedStyle(searchResult).display !== "none";

        // More robust content comparison - normalize whitespace and check key elements
        const normalizedCurrent = currentContent.replace(/\s+/g, " ").trim();
        const normalizedCached = state.lastSearchResult.content
          .replace(/\s+/g, " ")
          .trim();
        const contentChanged = normalizedCurrent !== normalizedCached;

        // Handle cached "not found" result - show toast only, no search UI
        if (state.lastSearchResult.type === "not-found") {
          showToast(
            `Cookies containing "${breakLongString(
              cookieName
            )}" not found on current site or related domains`,
            "error"
          );
          clearSearchResult();
          return;
        }

        // Only update if content, type, or visibility state actually changed to avoid layout shift
        if (
          contentChanged ||
          currentType !== state.lastSearchResult.type ||
          !isCurrentlyVisible
        ) {
          showSearchResult(state.lastSearchResult.content, state.lastSearchResult.type);
        }
        return;
      }

      // Clear previous results and proceed with new search
      clearSearchResult();
      performNewSearch(cookieName, searchTerm, domain, tabs[0].url);
    } catch (e) {
      showToast(`Error: ${e.message}`, "error");
      clearSearchResult();
    }
  });
}

// Function to perform actual search and cache results
export function performNewSearch(cookieName, searchTerm, domain, url) {
  // Show searching status
  showSearchResult(
    `Searching for cookies containing "${breakLongString(
      cookieName
    )}" on current site...`,
    "searching"
  );

  try {
    debugLog(
      `Searching for cookies containing "${cookieName}" on ${domain}`,
      "info"
    );

    // Search using chrome.cookies API with timeout protection
    let searchCompleted = false;

    // Set a timeout for the search
    const searchTimeout = setTimeout(() => {
      if (!searchCompleted) {
        debugLog(`Cookie search timed out for ${cookieName}`, "error");
        showToast(
          `Search timed out for cookie "${breakLongString(cookieName)}"`,
          "error"
        );
        clearSearchResult();
      }
    }, 5000);

    chrome.cookies.getAll(
      {
        url: url,
      },
      function (cookies) {
        searchCompleted = true;
        clearTimeout(searchTimeout);

        if (chrome.runtime.lastError) {
          debugLog(
            `Chrome cookies API error: ${chrome.runtime.lastError.message}`,
            "error"
          );
          showToast(
            `Error searching cookie: ${chrome.runtime.lastError.message}`,
            "error"
          );
          clearSearchResult();
          return;
        }

        // Filter cookies that contain the search term
        const matchingCookies = cookies.filter((cookie) =>
          cookie.name.toLowerCase().includes(searchTerm)
        );

        if (matchingCookies.length > 0) {
          // Cookies found
          debugLog(
            `${matchingCookies.length} cookie(s) found containing "${cookieName}"`,
            "info"
          );

          // Create search results container safely
          const searchContainer = createSearchResultsContainer(
            matchingCookies,
            `Found ${matchingCookies.length} cookie(s):`
          );
          const cookiesInfo = searchContainer.outerHTML;

          // Cache the successful result
          state.lastSearchQuery = searchTerm;
          state.lastSearchDomain = domain;
          state.lastSearchResult = {
            content: cookiesInfo,
            type: "found",
          };

          showSearchResult(cookiesInfo, "found");
        } else {
          // No cookies found - check if it might exist with different domains
          debugLog(
            `No cookies containing "${cookieName}" found on primary domain, checking variations...`,
            "info"
          );
          searchCookieAllDomains(cookieName, domain, url);
        }
      }
    );
  } catch (e) {
    showToast(`Error: ${e.message}`, "error");
    clearSearchResult();
  }
}

// Function to search cookie on all possible domain variations
export function searchCookieAllDomains(cookieName, currentDomain, currentUrl) {
  const searchTerm = cookieName.toLowerCase().trim();

  // Update existing search status to show we're checking variations
  showSearchResult(
    `Searching for cookies containing "${breakLongString(
      cookieName
    )}" in related domains...`,
    "searching"
  );

  // Try different domain variations
  const domainVariations = [
    currentDomain,
    `.${currentDomain}`,
    currentDomain.replace(/^www\./, ""),
    `.${currentDomain.replace(/^www\./, "")}`,
  ];

  let foundCookies = [];
  let searchCount = 0;
  let searchCompleted = false;

  // Remove duplicates
  const uniqueDomains = [...new Set(domainVariations)];
  debugLog(
    `Searching ${
      uniqueDomains.length
    } domain variations: ${uniqueDomains.join(", ")}`,
    "info"
  );

  // Set a timeout for all domain searches
  const allSearchTimeout = setTimeout(() => {
    if (!searchCompleted && foundCookies.length === 0) {
      debugLog(`All domain searches timed out for ${cookieName}`, "error");
      showToast(
        `Search timed out - cookies containing "${breakLongString(
          cookieName
        )}" not found`,
        "error"
      );
      clearSearchResult();
      searchCompleted = true;

      // Remember this term as not found to avoid future UI searches
      state.lastNotFoundTerm = cookieName;
    }
  }, 8000);

  uniqueDomains.forEach((domain) => {
    const testUrl = `https://${
      domain.startsWith(".") ? domain.substring(1) : domain
    }/`;

    debugLog(`Searching domain variation: ${domain} (${testUrl})`, "info");

    chrome.cookies.getAll(
      {
        url: testUrl,
      },
      function (cookies) {
        searchCount++;

        if (searchCompleted) return; // Prevent multiple results

        // Filter cookies that contain the search term OR where search term contains cookie name
        const matchingCookies = cookies.filter((cookie) => {
          const cookieName = cookie.name.toLowerCase();
          return (
            cookieName.includes(searchTerm) || searchTerm.includes(cookieName)
          );
        });

        if (matchingCookies.length > 0) {
          foundCookies.push(...matchingCookies);
          searchCompleted = true;
          clearTimeout(allSearchTimeout);

          debugLog(
            `${matchingCookies.length} cookie(s) found on domain variation: ${domain}`,
            "info"
          );

          // Create search results container safely
          const searchContainer = createSearchResultsContainer(
            matchingCookies,
            `Found ${matchingCookies.length} cookie(s) on ${domain}:`
          );
          const cookiesInfo = searchContainer.outerHTML;

          showSearchResult(cookiesInfo, "found");

          // Cache the successful result
          state.lastSearchQuery = searchTerm;
          state.lastSearchDomain = currentDomain;
          state.lastSearchResult = {
            content: cookiesInfo,
            type: "found",
          };
        } else if (
          searchCount === uniqueDomains.length &&
          foundCookies.length === 0 &&
          !searchCompleted
        ) {
          // All searches completed, no cookies found
          searchCompleted = true;
          clearTimeout(allSearchTimeout);

          debugLog(
            `No cookies containing "${cookieName}" found in any domain variation`,
            "info"
          );
          showToast(
            `Cookies containing "${breakLongString(
              cookieName
            )}" not found on current site or related domains`,
            "error"
          );
          clearSearchResult();

          // Cache the "not found" result to prevent repeated searching
          state.lastSearchQuery = searchTerm;
          state.lastSearchDomain = currentDomain;
          state.lastSearchResult = {
            content: "", // Empty content since we only show toast
            type: "not-found",
          };
        }
      }
    );
  });
}

// Function to copy cookie value to clipboard
export function copyCookieValueToClipboard(cookieValue) {
  // Copy to clipboard using the modern API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(cookieValue)
      .then(() => {
        showToast("✓ Value copied", "success");
      })
      .catch((err) => {
        debugLog(`Clipboard API failed: ${err}`, "error");
        fallbackCopyValueToClipboard(cookieValue);
      });
  } else {
    // Fallback for older browsers
    fallbackCopyValueToClipboard(cookieValue);
  }
}

// Fallback function for copying cookie value to clipboard
function fallbackCopyValueToClipboard(cookieValue) {
  // Create a temporary textarea
  const textArea = document.createElement("textarea");
  textArea.value = cookieValue;
  textArea.className = "hidden-textarea";
  document.body.appendChild(textArea);

  try {
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    if (successful) {
      showToast("✓ Value copied", "success");
    } else {
      showToast("❌ Failed to copy", "error");
    }
  } catch (err) {
    debugLog(`Fallback copy failed: ${err}`, "error");
    showToast("❌ Copy not supported", "error");
  }

  document.body.removeChild(textArea);
}

// Function to clear search results
export function clearSearchResult() {
  const searchResult = document.getElementById("search-result");
  searchResult.innerHTML = "";
  searchResult.className = "search-result";

  // Clear any existing timers
  if (searchResult.hideTimer) {
    clearTimeout(searchResult.hideTimer);
    searchResult.hideTimer = null;
  }

  // Don't reset lastSearchTerm here - keep it to prevent duplicate searches
}

// Function to remove specific search result item
export function removeSearchResultItem(cookieName, cookieDomain, cookiePath) {
  const searchResult = document.getElementById("search-result");

  // Find the specific search result item to remove
  const resultItems = searchResult.querySelectorAll(".search-result-item");

  resultItems.forEach((item) => {
    const deleteBtn = item.querySelector(".search-cookie-delete-btn");
    if (deleteBtn) {
      const itemCookieName = deleteBtn.getAttribute("data-cookie-name");
      const itemCookieDomain = deleteBtn.getAttribute("data-cookie-domain");
      const itemCookiePath = deleteBtn.getAttribute("data-cookie-path");

      if (
        itemCookieName === cookieName &&
        itemCookieDomain === cookieDomain &&
        itemCookiePath === cookiePath
      ) {
        // Remove this specific item
        item.remove();

        // Check if there are remaining results
        const remainingItems = searchResult.querySelectorAll(
          ".search-result-item"
        );

        if (remainingItems.length === 0) {
          // No more results - close the search window
          clearSearchResult();
        } else {
          // Update the header count
          const contentDiv = searchResult.querySelector(
            ".search-result-header"
          ).nextElementSibling;
          const header = contentDiv.querySelector(
            ".search-cookie-header strong"
          );
          if (header) {
            const currentText = header.textContent;
            // Check if it has domain-specific text
            const domainMatch = currentText.match(
              /Found \d+ cookie\(s\) on (.+):/
            );
            if (domainMatch) {
              // Keep the domain info
              header.textContent = `Found ${remainingItems.length} cookie(s) on ${domainMatch[1]}:`;
            } else {
              // Regular format without domain
              header.textContent = `Found ${remainingItems.length} cookie(s):`;
            }
          }
        }
        return;
      }
    }
  });
}

// Function to check if search results have any remaining items
export function hasSearchResults() {
  const searchResult = document.getElementById("search-result");
  const resultItems = searchResult.querySelectorAll(".search-result-item");
  return resultItems.length > 0;
}

// Function to show search results
export function showSearchResult(message, type) {
  const searchResult = document.getElementById("search-result");

  // Check if we're trying to set the same content and class - avoid unnecessary DOM changes
  const currentContent = searchResult.innerHTML;
  const currentClassName = searchResult.className;
  const newClassName = `search-result ${type}`;

  if (currentContent === message && currentClassName === newClassName) {
    debugLog(`Search result unchanged, skipping DOM update`, "info");
    return;
  }

  // Clear any existing timers first
  if (searchResult.hideTimer) {
    clearTimeout(searchResult.hideTimer);
    searchResult.hideTimer = null;
  }

  searchResult.innerHTML = message;
  searchResult.className = newClassName;

  // Keep search timeout only for "searching" status as fallback
  if (type === "searching") {
    searchResult.hideTimer = setTimeout(() => {
      showToast("Search timed out", "error");
      clearSearchResult();
    }, 10000);
  }
}

export function saveSearchedCookie(cookieName, cookieDomain, cookiePath, cookieValue) {
  chrome.storage.local.get(["savedCookies"], function (result) {
    if (chrome.runtime.lastError) {
      showToast(`Error reading storage: ${chrome.runtime.lastError.message}`, "error");
      return;
    }

    const savedCookies = result.savedCookies || [];
    const alreadyExists = savedCookies.some((c) => {
      const decrypted = c.isEncrypted
        ? encryptionHelpers.decryptCookieValues(c)
        : c;
      return decrypted.name === cookieName && decrypted.domain === cookieDomain;
    });

    if (alreadyExists) {
      showToast(`Cookie "${cookieName}" is already in your saved list`, "info");
      return;
    }

    const newCookie = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: cookieName,
      value: cookieValue || "",
      domain: cookieDomain,
      path: cookiePath || "/",
      expirationDays: 30,
      isGlobal: false,
      isEncrypted: false,
    };

    const encrypted = encryptionHelpers.encryptCookieValues(newCookie);
    savedCookies.push(encrypted);

    chrome.storage.local.set({ savedCookies }, function () {
      if (chrome.runtime.lastError) {
        showToast(`Error saving cookie: ${chrome.runtime.lastError.message}`, "error");
        return;
      }

      showToast(`Cookie "${cookieName}" saved to your list`, "success");
      debugLog(`Saved searched cookie: ${cookieName} (${cookieDomain})`, "info");
      loadSavedCookies();
      setTimeout(() => {
        autoSyncCookieStates();
      }, 300);
    });
  });
}

// Function to delete a searched cookie
export function deleteSearchedCookie(cookieName, cookieDomain, cookiePath) {
  // Try both http and https protocols to ensure cookie is removed
  const protocols = ["https", "http"];
  let removalAttempts = 0;
  let successfulRemoval = false;
  let toastShown = false; // Flag to prevent duplicate toasts

  function attemptRemoval(protocol) {
    const cookieDetails = {
      name: cookieName,
      url: `${protocol}://${cookieDomain.replace(/^\./, "")}${cookiePath}`,
    };

    chrome.cookies.remove(cookieDetails, function (result) {
      removalAttempts++;

      if (result && !toastShown) {
        successfulRemoval = true;
        toastShown = true; // Set flag to prevent duplicate toasts
        showToast(`✓ Cookie "${cookieName}" deleted successfully`, "success");

        // Remove the deleted cookie element from search results
        const searchResult = document.getElementById("search-result");
        const cookieItems = searchResult.querySelectorAll(
          ".search-result-item"
        );
        cookieItems.forEach((item) => {
          const deleteBtn = item.querySelector(".search-cookie-delete-btn");
          if (
            deleteBtn &&
            deleteBtn.getAttribute("data-cookie-name") === cookieName &&
            deleteBtn.getAttribute("data-cookie-domain") === cookieDomain &&
            deleteBtn.getAttribute("data-cookie-path") === cookiePath
          ) {
            item.remove();
          }
        });

        // Check if any results remain, if not - clear the entire search result
        if (!hasSearchResults()) {
          clearSearchResult();
        }

        // Sync saved cookie buttons after cookie deletion
        setTimeout(() => {
          autoSyncCookieStates();
        }, 200);

        // Clear search cache since results may have changed
        state.lastSearchQuery = null;
        state.lastSearchDomain = null;
        state.lastSearchResult = null;

        return;
      } else if (result) {
        // Cookie was removed but toast already shown
        successfulRemoval = true;
      }

      // If both attempts are done and none successful
      if (
        removalAttempts >= protocols.length &&
        !successfulRemoval &&
        !hasShownMessage
      ) {
        hasShownMessage = true;
        if (chrome.runtime.lastError) {
          showToast(
            `❌ Error deleting cookie "${cookieName}": ${chrome.runtime.lastError.message}`,
            "error"
          );
        } else {
          showToast(
            `❌ Cookie "${cookieName}" not found or could not be deleted`,
            "error"
          );
        }
        clearSearchResult();
      }
    });
  }

  // Try both protocols
  protocols.forEach((protocol) => {
    attemptRemoval(protocol);
  });
}

// Function to edit a searched cookie
export function editSearchedCookie(
  cookieName,
  cookieDomain,
  cookiePath,
  currentValue
) {
  // Create modal for editing
  const modal = document.createElement("div");
  modal.className = "edit-modal";
  modal.innerHTML = `
    <div class="edit-modal-content">
      <div class="edit-modal-header">
        <h3>Edit Cookie</h3>
        <button class="edit-modal-close">&times;</button>
      </div>
      <div class="edit-modal-body">
        <label for="edit-search-cookie-name"><strong>Name:</strong></label>
        <input type="text" id="edit-search-cookie-name" placeholder="Cookie name">
        <label for="edit-search-cookie-value"><strong>Value:</strong></label>
        <textarea id="edit-search-cookie-value" rows="4" placeholder="Enter cookie value..."></textarea>
      </div>
      <div class="edit-modal-footer">
        <button id="save-search-cookie-edit" class="edit-save-btn">Save</button>
        <button id="cancel-search-cookie-edit" class="edit-cancel-btn">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Set values safely using properties instead of innerHTML
  const nameInput = modal.querySelector("#edit-search-cookie-name");
  const textarea = modal.querySelector("#edit-search-cookie-value");
  nameInput.value = cookieName;
  textarea.value = currentValue;
  textarea.focus();
  textarea.select();

  // Close modal handlers
  const closeModal = () => {
    document.body.removeChild(modal);
  };

  modal
    .querySelector(".edit-modal-close")
    .addEventListener("click", closeModal);
  modal
    .querySelector("#cancel-search-cookie-edit")
    .addEventListener("click", closeModal);

  // Click outside to close
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Save handler
  modal
    .querySelector("#save-search-cookie-edit")
    .addEventListener("click", () => {
      const newName = nameInput.value.trim();
      const newValue = textarea.value.trim();

      if (newName === "") {
        showToast("Cookie name cannot be empty", "error");
        nameInput.focus();
        return;
      }

      // Validate cookie name for security
      const nameValidation = validateCookieName(newName);
      if (!nameValidation.valid) {
        showToast(nameValidation.message, "error");
        nameInput.focus();
        return;
      }

      if (newValue === "") {
        showToast("Cookie value cannot be empty", "error");
        textarea.focus();
        return;
      }

      // Validate cookie value for security
      const valueValidation = validateCookieValue(newValue);
      if (!valueValidation.valid) {
        showToast(valueValidation.message, "error");
        textarea.focus();
        return;
      }

      // Try both http and https protocols to set cookie
      const protocols = ["https", "http"];
      let updateAttempts = 0;
      let successfulUpdate = false;

      function attemptUpdate(protocol) {
        const url = `${protocol}://${cookieDomain.replace(
          /^\./,
          ""
        )}${cookiePath}`;

        // First, remove the existing cookie to prevent duplicates
        const removeDetails = {
          name: cookieName,
          url: url,
        };

        chrome.cookies.remove(removeDetails, function (removeResult) {
          // Small delay to ensure removal is processed before setting new cookie
          setTimeout(() => {
            // Now set the new cookie with potentially new name
            const cookieDetails = {
              name: newName,
              value: newValue,
              domain: cookieDomain,
              path: cookiePath,
              url: url,
            };

            chrome.cookies.set(cookieDetails, function (result) {
              updateAttempts++;

              if (result && !successfulUpdate) {
                successfulUpdate = true;

                const nameChanged = newName !== cookieName;
                if (nameChanged) {
                  showToast(
                    `✓ Cookie renamed from "${cookieName}" to "${newName}" and updated`,
                    "success"
                  );

                  // Update cookie name and value inline without DOM refresh
                  updateSearchResultCookieName(
                    cookieName,
                    cookieDomain,
                    cookiePath,
                    newName,
                    newValue
                  );

                  updateSiteCookieName(
                    cookieName,
                    cookieDomain,
                    cookiePath,
                    newName,
                    newValue
                  );
                } else {
                  showToast(
                    `✓ Cookie "${cookieName}" updated successfully`,
                    "success"
                  );

                  // Update the displayed value in search results
                  updateSearchResultCookieValue(
                    cookieName,
                    cookieDomain,
                    cookiePath,
                    newValue
                  );

                  // Also update site cookies display if present
                  updateSiteCookieValue(
                    cookieName,
                    cookieDomain,
                    cookiePath,
                    newValue
                  );
                }

                // Close modal
                closeModal();
              } else if (
                updateAttempts === protocols.length &&
                !successfulUpdate
              ) {
                showToast(
                  `❌ Failed to update cookie "${cookieName}"`,
                  "error"
                );
              }
            });
          }, 100); // 100ms delay
        });
      }

      // Try both protocols
      protocols.forEach(attemptUpdate);
    });

  // Enter key to save
  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      modal.querySelector("#save-search-cookie-edit").click();
    }
  });
}

// Function to update cookie value in search results display
export function updateSearchResultCookieValue(
  cookieName,
  cookieDomain,
  cookiePath,
  newValue
) {
  const searchResult = document.getElementById("search-result");
  const resultItems = searchResult.querySelectorAll(".search-result-item");

  resultItems.forEach((item) => {
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
        const valueSpan = item.querySelector(".clickable-value");
        if (valueSpan) {
          valueSpan.setAttribute("data-full-value", newValue);
          valueSpan.textContent =
            newValue.length > 50
              ? breakLongString(newValue.substring(0, 50)) + "..."
              : breakLongString(newValue);
        }

        return;
      }
    }
  });
}

// Function to update cookie name and value in search results display
export function updateSearchResultCookieName(
  oldCookieName,
  cookieDomain,
  cookiePath,
  newCookieName,
  newValue
) {
  const searchResult = document.getElementById("search-result");
  const resultItems = searchResult.querySelectorAll(".search-result-item");

  // Check if new name matches current search query
  const searchInput = document.getElementById("cookieSearchInput");
  const currentSearchTerm = searchInput
    ? searchInput.value.toLowerCase().trim()
    : "";
  const newNameMatchesSearch =
    !currentSearchTerm ||
    newCookieName.toLowerCase().includes(currentSearchTerm);

  resultItems.forEach((item) => {
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
        if (newNameMatchesSearch) {
          // Update data attributes with new name and value
          editBtn.setAttribute("data-cookie-name", newCookieName);
          editBtn.setAttribute("data-cookie-value", newValue);

          // Update delete button data attribute too
          const deleteBtn = item.querySelector(".search-cookie-delete-btn");
          if (deleteBtn) {
            deleteBtn.setAttribute("data-cookie-name", newCookieName);
          }

          // Update displayed name
          const nameSpan = item.querySelector(".clickable-name");
          if (nameSpan) {
            nameSpan.textContent = newCookieName;
          }

          // Update displayed value
          const valueSpan = item.querySelector(".clickable-value");
          if (valueSpan) {
            valueSpan.setAttribute("data-full-value", newValue);
            valueSpan.textContent =
              newValue.length > 50
                ? breakLongString(newValue.substring(0, 50)) + "..."
                : breakLongString(newValue);
          }
        } else {
          // New name doesn't match search - remove this item
          item.remove();

          // Clear search cache to force fresh results
          state.lastSearchQuery = null;
          state.lastSearchDomain = null;
          state.lastSearchResult = null;

          // Check if any results remain
          const remainingItems = searchResult.querySelectorAll(
            ".search-result-item"
          );
          if (remainingItems.length === 0) {
            showSearchResult(
              `Cookies containing "${currentSearchTerm}" not found on current site or related domains`,
              "not-found"
            );
          } else {
            // Update count in header
            const header = searchResult.querySelector(
              ".search-cookie-header"
            );
            if (header) {
              header.innerHTML = `<strong>Found ${remainingItems.length} cookie(s):</strong>`;
            }
          }
        }

        return;
      }
    }
  });
}

// Internal helper — update cookie value in site cookies display
function updateSiteCookieValue(
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

// Internal helper — update cookie name and value in site cookies display
function updateSiteCookieName(
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
