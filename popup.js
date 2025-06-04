document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const cookieNameInput = document.getElementById("cookieName");
  const cookieValueInput = document.getElementById("cookieValue");
  const cookieDomainInput = document.getElementById("cookieDomain");
  const cookiePathInput = document.getElementById("cookiePath");
  const cookieExpirationInput = document.getElementById("cookieExpiration");
  const isGlobalCookieCheckbox = document.getElementById("isGlobalCookie");
  const addCookieBtn = document.getElementById("addCookieBtn");
  const cookiesList = document.getElementById("cookiesList");
  const statusMessage = document.getElementById("status-message");
  const formValidationMessage = document.getElementById(
    "form-validation-message"
  );
  const accordion = document.querySelector(".accordion");
  const accordionHeader = document.querySelector(".accordion-header");
  const savedCookiesAccordion = document.querySelector(
    ".saved-cookies-accordion"
  );
  const savedCookiesHeader =
    savedCookiesAccordion.querySelector(".accordion-header");
  const currentDomainElement = document.getElementById("currentDomain");

  // Site cookies button handler
  const openDevToolsBtn = document.getElementById("openDevToolsBtn");

  // Clear all cookies button handler
  const clearAllCookiesBtn = document.getElementById("clearAllCookiesBtn");

  // Clear all data button handler
  const clearAllDataBtn = document.getElementById("clearAllDataBtn");

  // Timer for automatically hiding messages
  let hideStatusTimer = null;

  // Track if add cookie form was just used
  let isAddCookieJustUsed = false;

  // Function to clear status message area
  function clearStatusMessage() {
    statusMessage.innerHTML = "";
    statusMessage.className = "";
    statusMessage.style.display = "none";

    // Clear timer if it exists
    if (hideStatusTimer) {
      clearTimeout(hideStatusTimer);
      hideStatusTimer = null;
    }
  }

  // Add accordion functionality for "Add new cookie"
  accordionHeader.addEventListener("click", function () {
    // Clear status message area when opening/closing accordion
    clearStatusMessage();

    // Get the content element
    const content = accordion.querySelector(".accordion-content");
    const isActive = accordion.classList.contains("active");

    if (isActive) {
      // If closing the accordion, first fade out the content
      const form = content.querySelector(".add-cookie-form");
      form.style.opacity = "0";

      // After a short delay, toggle the active class
      setTimeout(function () {
        accordion.classList.remove("active");
      }, 100);
    } else {
      // If opening, toggle class immediately
      accordion.classList.add("active");

      // Then fade in the content
      const form = content.querySelector(".add-cookie-form");
      form.style.opacity = "0";

      setTimeout(function () {
        form.style.opacity = "1";
      }, 50);
    }
  });

  // Add accordion functionality for "Saved cookies"
  savedCookiesHeader.addEventListener("click", function () {
    // Clear status message area when opening/closing accordion
    clearStatusMessage();

    // Get the content element
    const content = savedCookiesAccordion.querySelector(".accordion-content");
    const isActive = savedCookiesAccordion.classList.contains("active");
    const savedContent = content.querySelector(".saved-cookies-content");

    if (isActive) {
      // If closing the accordion, first fade out the content
      savedContent.style.opacity = "0";

      // After a short delay, toggle the active class
      setTimeout(function () {
        savedCookiesAccordion.classList.remove("active");
        // Reset max-height to ensure proper animation
        content.style.maxHeight = "0";
        content.style.padding = "0 15px";
      }, 200);
    } else {
      // If opening, toggle class immediately
      savedCookiesAccordion.classList.add("active");

      // Then fade in the content and set proper height
      savedContent.style.opacity = "0";
      content.style.maxHeight = "300px";
      content.style.padding = "15px";

      setTimeout(function () {
        savedContent.style.opacity = "1";
      }, 100);
    }
  });

  // Function for logging with status display
  function debugLog(message, type = "info") {
    console.log(`[DEBUG] ${message}`);

    // List of messages that should never be shown in the UI
    if (
      message.includes("Is global cookie:") ||
      message.includes("Current domain:") ||
      message.includes("Cookie domain:") ||
      message.includes("Exact domain match") ||
      message.includes("Subdomain match") ||
      message.includes("Using domain for cookie operation:") ||
      message.includes("Checking cookie existence:") ||
      message.includes("Found cookie") ||
      message.includes("Value:") ||
      message.includes("Path:") ||
      message.includes("Domain:") ||
      message.includes("Expires:") ||
      message.includes("Cookie set successfully:") ||
      message.includes("Setting cookie with details:") ||
      message.includes("Removing cookie with details:") ||
      message.includes("Checking cookie with URL:") ||
      message.includes("Toggling cookie:") ||
      message.includes("Check before toggle:") ||
      message.includes("Found existing cookie:") ||
      message.includes("Saving cookie:") ||
      message.includes("Current saved cookies:") ||
      message.includes("Updating existing cookie") ||
      message.includes("Adding new cookie to the list") ||
      message.includes("Cookies saved to storage") ||
      message.includes("Found cookie at index") ||
      message.includes("Deleted cookie from list") ||
      message.includes("Deleting cookie:") ||
      message.includes("Set domain for global cookie") ||
      message.includes("Tab domain:") ||
      message.includes("Domain allowed check:") ||
      message.includes("Cookie successfully removed from page:") ||
      message.includes("Cookie for removal not found on page") ||
      message.includes("Set domain for global cookie removal to")
    ) {
      // Only log to console, don't show to user
      return;
    }

    // Don't show error messages in the global status (footer)
    // These should only be shown under the specific cookie
    if (
      type === "error" &&
      (message.includes("domain") ||
        message.includes("Domain mismatch") ||
        message.includes("specific to") ||
        message.includes("doesn't match"))
    ) {
      // Only log to console, don't show in global status
      return;
    }

    // Only show messages from footer buttons or general operations in the footer
    showStatus(message, type || "error");
  }

  // Add handler for global cookie checkbox
  isGlobalCookieCheckbox.addEventListener("change", function () {
    if (this.checked) {
      cookieDomainInput.disabled = true;
      cookieDomainInput.placeholder = "Global cookie (any domain)";
      cookieDomainInput.value = ""; // Clear field when selecting global cookie
    } else {
      cookieDomainInput.disabled = false;
      cookieDomainInput.placeholder = "example.com";
      // Get current tab URL to determine default domain
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const currentUrl = tabs[0].url;
        const urlObj = new URL(currentUrl);
        cookieDomainInput.placeholder = urlObj.hostname;
      });
    }
  });

  // Load saved cookies when popup opens
  loadSavedCookies();

  // Initialize form state on load (global cookie by default)
  cookieDomainInput.disabled = isGlobalCookieCheckbox.checked;
  cookieDomainInput.placeholder = isGlobalCookieCheckbox.checked
    ? "Global cookie (any domain)"
    : "example.com";

  // Initialize current domain display
  updateCurrentDomain();

  // Get current tab URL to determine default domain
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentUrl = tabs[0].url;
    const urlObj = new URL(currentUrl);
    // Save current domain for future use
    if (!isGlobalCookieCheckbox.checked) {
      cookieDomainInput.placeholder = urlObj.hostname;
    }
  });

  // Add handler for the add cookie button
  addCookieBtn.addEventListener("click", function () {
    // Clear previous validation messages
    clearFormValidation();

    const name = cookieNameInput.value.trim();
    const value = cookieValueInput.value.trim();
    let domain = cookieDomainInput.value.trim();
    const path = cookiePathInput.value.trim();
    const expirationDaysInput = cookieExpirationInput.value;
    const isGlobal = isGlobalCookieCheckbox.checked;

    // Validate input
    const nameValidation = validateCookieName(name);
    if (!nameValidation.valid) {
      showFormValidation(nameValidation.message, "error", cookieNameInput);
      return;
    }

    const valueValidation = validateCookieValue(value);
    if (!valueValidation.valid) {
      showFormValidation(valueValidation.message, "error", cookieValueInput);
      return;
    }

    const domainValidation = validateCookieDomain(domain, isGlobal);
    if (!domainValidation.valid) {
      showFormValidation(domainValidation.message, "error", cookieDomainInput);
      return;
    }

    const pathValidation = validateCookiePath(path);
    if (!pathValidation.valid) {
      showFormValidation(pathValidation.message, "error", cookiePathInput);
      return;
    }

    const expirationValidation = validateExpirationDays(expirationDaysInput);
    if (!expirationValidation.valid) {
      showFormValidation(
        expirationValidation.message,
        "error",
        cookieExpirationInput
      );
      return;
    }

    const expirationDays = expirationValidation.value;

    debugLog(
      `Attempting to add cookie: ${name}=${value} ${
        isGlobal ? "(global)" : `for ${domain || "current domain"}`
      }`,
      "info"
    );

    // If it's a global cookie, set domain to null
    if (isGlobal) {
      domain = null;
      saveCookie(name, value, domain, path, expirationDays, isGlobal);
    }
    // If domain not specified and not global, use current tab domain
    else if (!domain) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const currentUrl = tabs[0].url;
        const urlObj = new URL(currentUrl);
        domain = urlObj.hostname;
        debugLog(`Using current domain: ${domain}`, "info");
        saveCookie(name, value, domain, path, expirationDays, isGlobal);
      });
    } else {
      saveCookie(name, value, domain, path, expirationDays, isGlobal);
    }
  });

  // Function to save a new cookie
  function saveCookie(name, value, domain, path, expirationDays, isGlobal) {
    // Create object to save in storage
    const cookieConfig = {
      name,
      value,
      domain,
      path,
      expirationDays,
      isGlobal,
      id: Date.now().toString(),
    };

    debugLog(`Saving cookie: ${JSON.stringify(cookieConfig)}`, "info");

    // Check if domain is sensitive and show warning if needed
    const targetDomain = isGlobal ? "global" : domain;
    const action = "save";

    showSensitiveDomainWarning(targetDomain, action)
      .then(() => {
        // Continue with saving after warning (if needed)

        // Save to chrome.storage
        chrome.storage.local.get(["savedCookies"], function (result) {
          const savedCookies = result.savedCookies || [];

          debugLog(`Current saved cookies: ${savedCookies.length}`, "info");

          // Check if this cookie already exists in the list
          // For global cookies, compare only by name
          const existingIndex = savedCookies.findIndex((cookie) => {
            if (isGlobal || cookie.isGlobal) {
              return cookie.name === name;
            } else {
              return cookie.name === name && cookie.domain === domain;
            }
          });

          // Encrypt cookie values before storing
          const encryptedCookieConfig =
            encryptionHelpers.encryptCookieValues(cookieConfig);

          if (existingIndex !== -1) {
            debugLog(
              `Updating existing cookie at index ${existingIndex}`,
              "info"
            );
            savedCookies[existingIndex] = encryptedCookieConfig;
          } else {
            debugLog(`Adding new cookie to the list`, "info");
            savedCookies.push(encryptedCookieConfig);
          }

          chrome.storage.local.set({ savedCookies }, function () {
            if (chrome.runtime.lastError) {
              debugLog(
                `Error saving to storage: ${chrome.runtime.lastError.message}`,
                "error"
              );
              return;
            }

            debugLog(
              `Cookies saved to storage, count: ${savedCookies.length}`,
              "info"
            );

            // Set cookie on active tab
            setCookie(cookieConfig); // Use unencrypted version for setting cookie

            // Set flag that we just used the add cookie form
            isAddCookieJustUsed = true;

            // Clear form fields
            cookieNameInput.value = "";
            cookieValueInput.value = "";
            cookieDomainInput.value = "";
            isGlobalCookieCheckbox.checked = true;
            cookieDomainInput.disabled = true;
            cookieDomainInput.placeholder = "Global cookie (any domain)";

            // Close accordion after successful addition
            // Fade out the form first
            const form = accordion.querySelector(".add-cookie-form");
            form.style.opacity = "0";

            setTimeout(function () {
              accordion.classList.remove("active");

              // Update cookie list
              loadSavedCookies();

              // No need to show the global message, as the cookie will appear in the list
              // This prevents duplicate messages

              // Reset the flag after a short delay
              setTimeout(function () {
                isAddCookieJustUsed = false;
              }, 500);
            }, 100);
          });
        });
      })
      .catch((error) => {
        // User cancelled or other error
        debugLog(`Cookie save cancelled: ${error.message}`, "info");
      });
  }

  // Function to load saved cookies
  function loadSavedCookies() {
    chrome.storage.local.get(["savedCookies"], function (result) {
      if (chrome.runtime.lastError) {
        debugLog(
          `Error reading from storage: ${chrome.runtime.lastError.message}`,
          "error"
        );
        return;
      }

      const savedCookies = result.savedCookies || [];
      debugLog(`Loaded ${savedCookies.length} cookies from storage`, "info");

      // Clear the list
      while (cookiesList.firstChild) {
        cookiesList.removeChild(cookiesList.firstChild);
      }

      if (savedCookies.length === 0) {
        const noCookiesElement = document.createElement("div");
        noCookiesElement.className = "no-cookies-message";
        noCookiesElement.textContent = "No saved cookies yet";
        cookiesList.appendChild(noCookiesElement);

        // If no cookies, close the saved cookies accordion and open the add form
        if (savedCookiesAccordion.classList.contains("active")) {
          // Close the saved cookies accordion with animation
          const content =
            savedCookiesAccordion.querySelector(".accordion-content");
          const savedContent = content.querySelector(".saved-cookies-content");
          savedContent.style.opacity = "0";

          setTimeout(function () {
            savedCookiesAccordion.classList.remove("active");
            content.style.maxHeight = "0";
            content.style.padding = "0 15px";
          }, 200);
        }

        // Make sure the add cookie form is open
        if (!accordion.classList.contains("active")) {
          accordion.classList.add("active");
          const form = accordion.querySelector(".add-cookie-form");
          form.style.opacity = "0";

          setTimeout(function () {
            form.style.opacity = "1";
          }, 50);
        }

        return;
      }

      // If cookies exist, open the saved cookies accordion and close the add form
      if (!savedCookiesAccordion.classList.contains("active")) {
        savedCookiesAccordion.classList.add("active");
        const content =
          savedCookiesAccordion.querySelector(".accordion-content");
        const savedContent = content.querySelector(".saved-cookies-content");

        content.style.maxHeight = "300px";
        content.style.padding = "15px";
        savedContent.style.opacity = "0";

        setTimeout(function () {
          savedContent.style.opacity = "1";
        }, 100);
      }

      // Close the add cookie form only when first loading saved cookies
      if (accordion.classList.contains("active") && !isAddCookieJustUsed) {
        const content = accordion.querySelector(".accordion-content");
        const form = content.querySelector(".add-cookie-form");
        form.style.opacity = "0";

        setTimeout(function () {
          accordion.classList.remove("active");
        }, 100);
      }

      // Add each cookie to the list
      savedCookies.forEach(function (cookie) {
        const cookieItem = createCookieElement(cookie);
        cookiesList.appendChild(cookieItem);
      });
    });
  }

  // Function to create a cookie element
  function createCookieElement(cookie) {
    // Decrypt cookie if it's encrypted
    const decryptedCookie = cookie.isEncrypted
      ? encryptionHelpers.decryptCookieValues(cookie)
      : cookie;

    const cookieItem = document.createElement("div");
    cookieItem.className = "cookie-item";
    cookieItem.dataset.id = decryptedCookie.id;

    const cookieInfo = document.createElement("div");
    cookieInfo.className = "cookie-info";

    const cookieName = document.createElement("div");
    cookieName.className = "cookie-name";
    cookieName.textContent = decryptedCookie.name;
    cookieName.title = "Click to copy cookie name";
    cookieName.addEventListener("click", function () {
      copyCookieNameToClipboard(decryptedCookie.name, cookieItem);
    });

    const cookieDetails = document.createElement("div");
    cookieDetails.className = "cookie-details";

    // Different text for global and regular cookies
    if (decryptedCookie.isGlobal) {
      cookieDetails.textContent = `Global | Value: ${decryptedCookie.value.substring(
        0,
        15
      )}${decryptedCookie.value.length > 15 ? "..." : ""}`;
    } else {
      cookieDetails.textContent = `${
        decryptedCookie.domain
      } | Value: ${decryptedCookie.value.substring(0, 15)}${
        decryptedCookie.value.length > 15 ? "..." : ""
      }`;
    }

    cookieInfo.appendChild(cookieName);
    cookieInfo.appendChild(cookieDetails);

    const cookieControls = document.createElement("div");
    cookieControls.className = "cookie-controls";

    // Toggle cookie button
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "toggle-btn";
    toggleBtn.textContent = "Add/Remove";
    toggleBtn.title = "Add/remove cookie on current site";
    toggleBtn.addEventListener("click", function () {
      debugLog(`Toggling cookie: ${decryptedCookie.name}`, "info");
      toggleCookie(decryptedCookie.id);
    });

    // Check cookie button
    const checkBtn = document.createElement("button");
    checkBtn.className = "check-btn";
    checkBtn.textContent = "Check";
    checkBtn.title = "Check if cookie exists on current site";
    checkBtn.addEventListener("click", function () {
      debugLog(`Checking cookie existence: ${decryptedCookie.name}`, "info");
      checkCookieExistence(decryptedCookie, cookieItem);
    });

    // Delete cookie button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "✕";
    deleteBtn.title = "Remove cookie from list";
    deleteBtn.addEventListener("click", function () {
      debugLog(`Deleting cookie: ${decryptedCookie.name}`, "info");
      deleteCookie(decryptedCookie.id);
    });

    cookieControls.appendChild(toggleBtn);
    cookieControls.appendChild(checkBtn);
    cookieControls.appendChild(deleteBtn);

    cookieItem.appendChild(cookieInfo);
    cookieItem.appendChild(cookieControls);

    // Add status message field for this cookie item operations
    const statusMessage = document.createElement("div");
    statusMessage.className = "cookie-status-message";
    statusMessage.id = `status-${decryptedCookie.id}`;
    cookieItem.appendChild(statusMessage);

    return cookieItem;
  }

  // Function to copy only cookie name to clipboard
  function copyCookieNameToClipboard(cookieName, cookieItem) {
    // Copy to clipboard using the modern API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(cookieName)
        .then(() => {
          showCookieStatus(
            cookieItem.dataset.id,
            "✓ Name copied",
            "success",
            cookieItem
          );
        })
        .catch((err) => {
          debugLog(`Clipboard API failed: ${err}`, "error");
          fallbackCopyNameToClipboard(cookieName, cookieItem);
        });
    } else {
      // Fallback for older browsers
      fallbackCopyNameToClipboard(cookieName, cookieItem);
    }
  }

  // Fallback function for copying cookie name to clipboard
  function fallbackCopyNameToClipboard(cookieName, cookieItem) {
    // Create a temporary textarea
    const textArea = document.createElement("textarea");
    textArea.value = cookieName;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);

    try {
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      if (successful) {
        showCookieStatus(
          cookieItem.dataset.id,
          "✓ Name copied",
          "success",
          cookieItem
        );
      } else {
        showCookieStatus(
          cookieItem.dataset.id,
          "❌ Failed to copy",
          "error",
          cookieItem
        );
      }
    } catch (err) {
      debugLog(`Fallback copy failed: ${err}`, "error");
      showCookieStatus(
        cookieItem.dataset.id,
        "❌ Copy not supported",
        "error",
        cookieItem
      );
    }

    document.body.removeChild(textArea);
  }

  // Function to copy cookie data to clipboard
  function copyCookieToClipboard(cookie, cookieItem) {
    // Create cookie string in different formats
    const formats = {
      // JavaScript format
      javascript: `document.cookie = "${cookie.name}=${cookie.value}; path=${
        cookie.path || "/"
      }${
        cookie.domain && !cookie.isGlobal ? `; domain=${cookie.domain}` : ""
      }";`,

      // JSON format
      json: JSON.stringify(
        {
          name: cookie.name,
          value: cookie.value,
          domain: cookie.isGlobal ? "any" : cookie.domain,
          path: cookie.path || "/",
          isGlobal: cookie.isGlobal,
        },
        null,
        2
      ),

      // Simple name=value format
      simple: `${cookie.name}=${cookie.value}`,

      // cURL format
      curl: `--cookie "${cookie.name}=${cookie.value}"`,

      // Detailed format
      detailed: `Name: ${cookie.name}
Value: ${cookie.value}
Domain: ${cookie.isGlobal ? "Global (any domain)" : cookie.domain}
Path: ${cookie.path || "/"}
Type: ${cookie.isGlobal ? "Global Cookie" : "Domain-specific Cookie"}`,
    };

    // Use the detailed format as default
    const textToCopy = formats.detailed;

    // Copy to clipboard using the modern API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          showCookieStatus(
            cookie.id,
            "✓ Cookie copied to clipboard",
            "success",
            cookieItem
          );
        })
        .catch((err) => {
          debugLog(`Clipboard API failed: ${err}`, "error");
          fallbackCopyToClipboard(textToCopy, cookie, cookieItem);
        });
    } else {
      // Fallback for older browsers
      fallbackCopyToClipboard(textToCopy, cookie, cookieItem);
    }
  }

  // Fallback function for copying to clipboard
  function fallbackCopyToClipboard(text, cookie, cookieItem) {
    // Create a temporary textarea
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);

    try {
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      if (successful) {
        showCookieStatus(
          cookie.id,
          "✓ Cookie copied to clipboard",
          "success",
          cookieItem
        );
      } else {
        showCookieStatus(
          cookie.id,
          "❌ Failed to copy cookie",
          "error",
          cookieItem
        );
      }
    } catch (err) {
      debugLog(`Fallback copy failed: ${err}`, "error");
      showCookieStatus(cookie.id, "❌ Copy not supported", "error", cookieItem);
    }

    document.body.removeChild(textArea);
  }

  // Function to check if cookie exists on current site
  function checkCookieExistence(cookie, cookieItem) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0] || !tabs[0].url) {
        debugLog("No active tab to check cookie", "error");
        showCookieStatus(
          cookie.id,
          "No active tab to check cookie",
          "error",
          cookieItem
        );
        return;
      }

      try {
        const urlObj = new URL(tabs[0].url);
        const domain = urlObj.hostname;

        // Validate cookie name for security
        const nameValidation = validateCookieName(cookie.name);
        if (!nameValidation.valid) {
          debugLog(`Invalid cookie name: ${nameValidation.message}`, "error");
          showCookieStatus(
            cookie.id,
            `Invalid cookie name: ${nameValidation.message}`,
            "error",
            cookieItem
          );
          return;
        }

        // For global cookies, use current domain
        const cookieDomain = cookie.isGlobal ? domain : cookie.domain;
        const cookiePath = cookie.path || "/";

        // For non-global cookies, check if current domain matches the cookie domain
        if (!cookie.isGlobal) {
          let domainMatches = false;

          // Check for exact domain match
          if (cookie.domain === domain) {
            domainMatches = true;
          }
          // Check for subdomain (if cookie domain starts with a dot)
          else if (
            cookie.domain.startsWith(".") &&
            domain.endsWith(cookie.domain.substring(1))
          ) {
            domainMatches = true;
          }

          if (!domainMatches) {
            debugLog(
              `Domain mismatch: Cookie domain ${cookie.domain} doesn't match current domain ${domain}`,
              "error"
            );
            showCookieStatus(
              cookie.id,
              `Cookie "${cookie.name}" is specific to ${cookie.domain} domain. Can't check on current domain (${domain}).`,
              "error",
              cookieItem
            );
            return;
          }
        }

        // Validate domain and path
        if (!cookie.isGlobal) {
          const domainValidation = validateCookieDomain(cookieDomain, false);
          if (!domainValidation.valid) {
            debugLog(
              `Invalid cookie domain: ${domainValidation.message}`,
              "error"
            );
            showCookieStatus(
              cookie.id,
              `Invalid cookie domain: ${domainValidation.message}`,
              "error",
              cookieItem
            );
            return;
          }
        }

        const pathValidation = validateCookiePath(cookiePath);
        if (!pathValidation.valid) {
          debugLog(`Invalid cookie path: ${pathValidation.message}`, "error");
          showCookieStatus(
            cookie.id,
            `Invalid cookie path: ${pathValidation.message}`,
            "error",
            cookieItem
          );
          return;
        }

        // Check cookie existence through chrome.cookies API
        const url = `http${cookieDomain.startsWith(".") ? "s" : ""}://${
          cookieDomain.startsWith(".")
            ? cookieDomain.substring(1)
            : cookieDomain
        }${cookiePath}`;

        debugLog(`Checking cookie with URL: ${url}`, "info");

        chrome.cookies.get(
          {
            url: url,
            name: cookie.name,
          },
          function (result) {
            if (chrome.runtime.lastError) {
              debugLog(
                `Error checking cookie: ${chrome.runtime.lastError.message}`,
                "error"
              );
              showCookieStatus(
                cookie.id,
                `Error checking cookie: ${chrome.runtime.lastError.message}`,
                "error",
                cookieItem
              );
              return;
            }

            if (result) {
              debugLog(
                `Found cookie "${cookie.name}" on site ${domain}:`,
                "info"
              );
              debugLog(`Value: ${result.value}`, "info");
              debugLog(`Path: ${result.path}`, "info");
              debugLog(`Domain: ${result.domain}`, "info");
              debugLog(
                `Expires: ${new Date(
                  result.expirationDate * 1000
                ).toLocaleString()}`,
                "info"
              );

              // Show message with information
              showCookieStatus(
                cookie.id,
                `Cookie "${cookie.name}" is already set on ${domain}`,
                "success",
                cookieItem
              );
            } else {
              debugLog(
                `Cookie "${cookie.name}" not found on site ${domain}`,
                "info"
              );
              showCookieStatus(
                cookie.id,
                `Cookie "${cookie.name}" not found on current site`,
                "error",
                cookieItem
              );
            }
          }
        );
      } catch (e) {
        debugLog(`Error processing URL: ${e.message}`, "error");
        showCookieStatus(cookie.id, `Error: ${e.message}`, "error", cookieItem);
      }
    });
  }

  // Function to enable/disable cookie
  function toggleCookie(cookieId) {
    chrome.storage.local.get(["savedCookies"], function (result) {
      if (chrome.runtime.lastError) {
        debugLog(
          `Error reading from storage: ${chrome.runtime.lastError.message}`,
          "error"
        );
        return;
      }

      const savedCookies = result.savedCookies || [];
      const cookieIndex = savedCookies.findIndex(
        (cookie) => cookie.id === cookieId
      );

      debugLog(`Found cookie at index ${cookieIndex} for toggling`, "info");

      if (cookieIndex !== -1) {
        const cookie = savedCookies[cookieIndex];

        // Get the cookie item element
        const cookieItem = document.querySelector(
          `.cookie-item[data-id="${cookieId}"]`
        );

        // Decrypt cookie if it's encrypted
        const decryptedCookie = cookie.isEncrypted
          ? encryptionHelpers.decryptCookieValues(cookie)
          : cookie;

        debugLog(`Toggling cookie: ${JSON.stringify(decryptedCookie)}`, "info");

        // Check if cookie exists on current site
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            if (!tabs[0] || !tabs[0].url) {
              debugLog("No active tab to check cookie", "error");
              showCookieStatus(
                cookieId,
                "No active tab to check cookie",
                "error",
                cookieItem
              );
              return;
            }

            try {
              const urlObj = new URL(tabs[0].url);
              const domain = urlObj.hostname;

              debugLog(`Current domain: ${domain}`, "info");
              debugLog(`Cookie domain: ${decryptedCookie.domain}`, "info");
              debugLog(`Is global cookie: ${decryptedCookie.isGlobal}`, "info");

              // For non-global cookies, check if domain matches
              if (!decryptedCookie.isGlobal) {
                let domainMatches = false;

                // Check exact domain match
                if (decryptedCookie.domain === domain) {
                  debugLog(`Exact domain match found`, "info");
                  domainMatches = true;
                }
                // Check if cookie domain starts with dot (applies to all subdomains)
                else if (
                  decryptedCookie.domain.startsWith(".") &&
                  domain.endsWith(decryptedCookie.domain.substring(1))
                ) {
                  debugLog(`Subdomain match found`, "info");
                  domainMatches = true;
                }

                if (!domainMatches) {
                  // If the cookie is domain-specific and current domain doesn't match
                  showCookieStatus(
                    cookieId,
                    `Cookie "${decryptedCookie.name}" is specific to ${decryptedCookie.domain} domain. Current domain (${domain}) doesn't match.`,
                    "error",
                    cookieItem
                  );
                  return;
                }
              }

              // For global cookies, use current domain
              const cookieDomain = decryptedCookie.isGlobal
                ? domain
                : decryptedCookie.domain;
              const cookiePath = decryptedCookie.path || "/";

              debugLog(
                `Using domain for cookie operation: ${cookieDomain}`,
                "info"
              );

              // Check if domain is sensitive and show warning if needed
              const targetDomain = decryptedCookie.isGlobal
                ? domain
                : decryptedCookie.domain;
              const action = "modify";

              showSensitiveDomainWarning(targetDomain, action)
                .then(() => {
                  // Continue with cookie operation after warning (if user confirmed)

                  // Check cookie existence through chrome.cookies API
                  const protocol = cookieDomain.startsWith(".")
                    ? "https"
                    : "http";
                  const urlDomain = cookieDomain.startsWith(".")
                    ? cookieDomain.substring(1)
                    : cookieDomain;

                  const url = `${protocol}://${urlDomain}${cookiePath}`;

                  debugLog(`Checking cookie with URL: ${url}`, "info");

                  chrome.cookies.get(
                    {
                      url: url,
                      name: decryptedCookie.name,
                    },
                    function (result) {
                      if (chrome.runtime.lastError) {
                        debugLog(
                          `Error checking cookie: ${chrome.runtime.lastError.message}`,
                          "error"
                        );
                        showCookieStatus(
                          cookieId,
                          `Error checking cookie: ${chrome.runtime.lastError.message}`,
                          "error",
                          cookieItem
                        );
                        return;
                      }

                      const cookieExists = !!result;
                      debugLog(
                        `Check before toggle: cookie "${
                          decryptedCookie.name
                        }" ${
                          cookieExists ? "found" : "not found"
                        } on site ${domain}`,
                        "info"
                      );

                      if (cookieExists) {
                        debugLog(
                          `Found existing cookie: ${JSON.stringify(result)}`,
                          "info"
                        );
                      }

                      // Regardless of cookie status in storage, just toggle it on the site
                      if (cookieExists) {
                        // If cookie exists - remove it
                        removeCookieFromCurrentTab(decryptedCookie, tabs[0]);
                        showCookieStatus(
                          cookieId,
                          `Cookie "${decryptedCookie.name}" removed from site ${domain}`,
                          "removed",
                          cookieItem
                        );
                      } else {
                        // If cookie doesn't exist - add it
                        setCookieForCurrentTab(decryptedCookie, tabs[0]);
                        showCookieStatus(
                          cookieId,
                          `Cookie "${decryptedCookie.name}" added to site ${domain}`,
                          "success",
                          cookieItem
                        );
                      }
                    }
                  );
                })
                .catch((error) => {
                  // User cancelled or other error
                  debugLog(`Cookie toggle cancelled: ${error.message}`, "info");
                  showCookieStatus(
                    cookieId,
                    `Operation cancelled: ${error.message}`,
                    "error",
                    cookieItem
                  );
                });
            } catch (e) {
              debugLog(`Error processing URL: ${e.message}`, "error");
              showCookieStatus(
                cookieId,
                `Error: ${e.message}`,
                "error",
                cookieItem
              );
            }
          }
        );
      } else {
        debugLog(`Cookie with ID ${cookieId} not found`, "error");
      }
    });
  }

  // Function to delete cookie
  function deleteCookie(cookieId) {
    chrome.storage.local.get(["savedCookies"], function (result) {
      if (chrome.runtime.lastError) {
        debugLog(
          `Error reading from storage: ${chrome.runtime.lastError.message}`,
          "error"
        );
        return;
      }

      const savedCookies = result.savedCookies || [];
      const cookieIndex = savedCookies.findIndex(
        (cookie) => cookie.id === cookieId
      );

      debugLog(`Found cookie at index ${cookieIndex} for deletion`, "info");

      if (cookieIndex !== -1) {
        const cookie = savedCookies[cookieIndex];
        const cookieName = cookie.name; // Save name for message

        // Remove cookie from page (if global, only from current tab)
        if (cookie.isGlobal) {
          chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabs) {
              if (tabs[0] && tabs[0].url) {
                removeCookieFromCurrentTab(cookie, tabs[0]);
              }
            }
          );
        } else {
          removeCookie(cookie);
        }

        // Remove from saved cookies
        savedCookies.splice(cookieIndex, 1);

        debugLog(
          `Deleted cookie from list, new count: ${savedCookies.length}`,
          "info"
        );

        chrome.storage.local.set({ savedCookies }, function () {
          if (chrome.runtime.lastError) {
            debugLog(
              `Error saving to storage: ${chrome.runtime.lastError.message}`,
              "error"
            );
            return;
          }

          loadSavedCookies();
          // No need for global status message as the deleted cookie will no longer be in the list
          // This prevents duplicate messages
        });
      } else {
        debugLog(`Cookie with ID ${cookieId} not found`, "error");
      }
    });
  }

  // Function to set cookie on current page (for global cookies)
  function setCookieForCurrentTab(cookie, tab) {
    try {
      const urlObj = new URL(tab.url);
      const domain = urlObj.hostname;

      // Clone cookie object to avoid modifying the original
      const cookieForTab = { ...cookie };

      // Set current tab domain for global cookie
      if (cookie.isGlobal) {
        cookieForTab.domain = domain;
      }

      // Set cookie
      setCookie(cookieForTab);
    } catch (e) {
      debugLog(`Error processing tab URL: ${e.message}`, "error");
    }
  }

  // Function to remove cookie from current tab (for global cookies)
  function removeCookieFromCurrentTab(cookie, tab) {
    try {
      const urlObj = new URL(tab.url);
      const domain = urlObj.hostname;

      // Clone cookie object to avoid modifying the original
      const cookieForTab = { ...cookie };

      // Set current tab domain for global cookie
      if (cookie.isGlobal) {
        cookieForTab.domain = domain;
      }

      // Remove cookie
      removeCookie(cookieForTab);
    } catch (e) {
      debugLog(`Error processing tab URL: ${e.message}`, "error");
    }
  }

  // Function to set cookie on current page
  function setCookie(cookie) {
    // Decrypt cookie if it's encrypted
    const decryptedCookie = cookie.isEncrypted
      ? encryptionHelpers.decryptCookieValues(cookie)
      : cookie;

    // Calculate expiration date
    const expirationDate = new Date();
    expirationDate.setDate(
      expirationDate.getDate() + decryptedCookie.expirationDays
    );

    // For global cookies, make sure there's a domain to set
    let domain = decryptedCookie.domain;
    if (!domain && decryptedCookie.isGlobal) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0] && tabs[0].url) {
          try {
            const urlObj = new URL(tabs[0].url);
            domain = urlObj.hostname;
            debugLog(`Set domain for global cookie to: ${domain}`, "info");
            completeCookieSet(domain);
          } catch (e) {
            debugLog(`Error processing tab URL: ${e.message}`, "error");
            // Show message only in global status, as this is a general error
            showStatus(`Error setting cookie: ${e.message}`, "error");
          }
        }
      });
      return;
    }

    completeCookieSet(domain);

    function completeCookieSet(domain) {
      // Add Same-Origin validation checks
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0] && tabs[0].url) {
          try {
            const urlObj = new URL(tabs[0].url);
            const tabDomain = urlObj.hostname;

            debugLog(
              `Tab domain: ${tabDomain}, Cookie domain: ${domain}`,
              "info"
            );

            // Check if we're trying to set cookie for a different domain than current tab
            // and only if it's not a global cookie
            if (!decryptedCookie.isGlobal && domain !== tabDomain) {
              // Check if tab domain is a subdomain of the cookie domain (for .example.com)
              const isDomainAllowed =
                domain.startsWith(".") &&
                tabDomain.endsWith(domain.substring(1));

              debugLog(`Domain allowed check: ${isDomainAllowed}`, "info");

              if (!isDomainAllowed) {
                debugLog(
                  `Cannot set cookie for domain ${domain} from ${tabDomain} due to Same-Origin Policy restrictions`,
                  "error"
                );
                // Show security message in form validation instead of global status
                showFormValidation(
                  `Security: Cannot set cookie for ${domain} from current page due to Same-Origin restrictions`,
                  "error"
                );
                return;
              }
            }
          } catch (e) {
            debugLog(`Error in Same-Origin check: ${e.message}`, "error");
            showStatus(`Error setting cookie: ${e.message}`, "error");
            return;
          }
        }
      });

      // Construct a valid URL for the cookie
      let protocol = "http";
      let urlDomain = domain;

      // If domain starts with a dot, use https and remove the leading dot for URL
      if (domain && domain.startsWith(".")) {
        protocol = "https";
        urlDomain = domain.substring(1);
      }

      // Create object for chrome.cookies API
      const cookieDetails = {
        url: `${protocol}://${urlDomain}${decryptedCookie.path || "/"}`,
        name: decryptedCookie.name,
        value: decryptedCookie.value,
        path: decryptedCookie.path || "/",
        domain: domain && domain.startsWith(".") ? domain : null,
        secure: false,
        httpOnly: false,
        expirationDate: Math.floor(expirationDate.getTime() / 1000),
      };

      debugLog(
        `Setting cookie with details: ${JSON.stringify(cookieDetails)}`,
        "info"
      );

      // Set cookie
      chrome.cookies.set(cookieDetails, function (result) {
        if (chrome.runtime.lastError) {
          debugLog(
            `Error setting cookie: ${chrome.runtime.lastError.message}`,
            "error"
          );
          // Show error in global status, as it's not related to a specific cookie item
          showStatus(
            `Error setting cookie: ${chrome.runtime.lastError.message}`,
            "error"
          );
        } else {
          debugLog(
            `Cookie set successfully: ${
              result ? JSON.stringify(result) : "no result"
            }`,
            "info"
          );
          // Success message is no longer needed as cookie will appear in the list
          // This prevents duplicate messages
        }
      });
    }
  }

  // Function to remove cookie from page
  function removeCookie(cookie) {
    // Decrypt cookie if it's encrypted
    const decryptedCookie = cookie.isEncrypted
      ? encryptionHelpers.decryptCookieValues(cookie)
      : cookie;

    // For global cookies, make sure there's a domain to remove from
    let domain = decryptedCookie.domain;
    if (!domain && decryptedCookie.isGlobal) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0] && tabs[0].url) {
          try {
            const urlObj = new URL(tabs[0].url);
            domain = urlObj.hostname;
            debugLog(
              `Set domain for global cookie removal to: ${domain}`,
              "info"
            );
            completeCookieRemove();
          } catch (e) {
            debugLog(`Error processing tab URL: ${e.message}`, "error");
            showStatus(`Error removing cookie: ${e.message}`, "error");
          }
        }
      });
      return;
    }

    completeCookieRemove();

    function completeCookieRemove() {
      // Construct a valid URL for the cookie
      let protocol = "http";
      let urlDomain = domain;

      // If domain starts with a dot, use https and remove the leading dot for URL
      if (domain && domain.startsWith(".")) {
        protocol = "https";
        urlDomain = domain.substring(1);
      }

      const cookieDetails = {
        url: `${protocol}://${urlDomain}${decryptedCookie.path || "/"}`,
        name: decryptedCookie.name,
      };

      debugLog(
        `Removing cookie with details: ${JSON.stringify(cookieDetails)}`,
        "info"
      );

      chrome.cookies.remove(cookieDetails, function (result) {
        if (chrome.runtime.lastError) {
          if (
            chrome.runtime.lastError.message !== "No cookie found with name"
          ) {
            debugLog(
              `Error removing cookie: ${chrome.runtime.lastError.message}`,
              "error"
            );
            showStatus(
              `Error removing cookie: ${chrome.runtime.lastError.message}`,
              "error"
            );
          } else {
            debugLog(`Cookie for removal not found on page`, "info");
            // If cookie not found, don't show a message as it's not a critical error
          }
        } else {
          debugLog(
            `Cookie successfully removed from page: ${
              result ? JSON.stringify(result) : "no result"
            }`,
            "info"
          );
          // Don't show a message, as user already knows the cookie was deleted from site
        }
      });
    }
  }

  // Handler for opening DevTools
  openDevToolsBtn.addEventListener("click", function () {
    // Check if cookie info is already visible
    if (
      statusMessage.style.display === "block" &&
      statusMessage.querySelector(".site-cookies-container")
    ) {
      // If visible - hide it
      clearStatusMessage();
      return;
    }

    // Close all accordions
    closeAllAccordions();

    // Update current domain display
    updateCurrentDomain();

    // Get current tab
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0]) {
        showStatus("No active tab found", "error");
        return;
      }

      // Show cookies info directly in extension popup
      // Skip DevTools opening attempt, which causes issues
      try {
        const urlObj = new URL(tabs[0].url);
        const domain = urlObj.hostname;
        showSiteCookiesInfo(domain);
      } catch (e) {
        showStatus(`Error: ${e.message}`, "error");
      }
    });
  });

  // Handler for clearing all cookies on current tab
  clearAllCookiesBtn.addEventListener("click", function () {
    // Close all accordions and clear status
    closeAllAccordions();

    // Show confirmation and get current tab
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0]) {
        showStatus("No active tab found", "error");
        return;
      }

      try {
        const urlObj = new URL(tabs[0].url);
        const domain = urlObj.hostname;
        clearAllSiteCookies(domain);
      } catch (e) {
        showStatus(`Error: ${e.message}`, "error");
      }
    });
  });

  // Handler for clearing all site data (storage + cookies)
  clearAllDataBtn.addEventListener("click", function () {
    // Close all accordions and clear status
    closeAllAccordions();

    // Get current tab
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0]) {
        showStatus("No active tab found", "error");
        return;
      }

      try {
        const urlObj = new URL(tabs[0].url);
        const domain = urlObj.hostname;
        clearAllSiteData(domain, tabs[0].url);
      } catch (e) {
        showStatus(`Error: ${e.message}`, "error");
      }
    });
  });

  // Handler for cookie search
  const searchCookieBtn = document.getElementById("searchCookieBtn");
  const cookieSearchInput = document.getElementById("cookieSearchInput");

  searchCookieBtn.addEventListener("click", function () {
    const cookieName = cookieSearchInput.value.trim();
    if (cookieName) {
      searchCookieOnCurrentSite(cookieName);
    } else {
      showSearchResult("Please enter a cookie name to search", "error");
    }
  });

  // Allow search on Enter key
  cookieSearchInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      const cookieName = event.target.value.trim();
      if (cookieName) {
        searchCookieOnCurrentSite(cookieName);
      } else {
        showSearchResult("Please enter a cookie name to search", "error");
      }
    }
  });

  // Event delegation for clicking on cookie values in search results
  document
    .getElementById("search-result")
    .addEventListener("click", function (event) {
      if (event.target.classList.contains("clickable-value")) {
        const fullValue = event.target.getAttribute("data-full-value");
        if (fullValue) {
          copyCookieValueToClipboard(fullValue);
        }
      }
    });

  // Event delegation for clicking on cookie names and values in site cookies info
  document
    .getElementById("status-message")
    .addEventListener("click", function (event) {
      if (event.target.classList.contains("clickable-site-cookie-name")) {
        const cookieName = event.target.getAttribute("data-cookie-name");
        const cookieItem = event.target.closest(".site-cookie-item");
        if (cookieName && cookieItem) {
          copySiteCookieNameToClipboard(cookieName, cookieItem);
        }
      } else if (
        event.target.classList.contains("clickable-site-cookie-value")
      ) {
        const cookieValue = event.target.getAttribute("data-cookie-value");
        const cookieItem = event.target.closest(".site-cookie-item");
        if (cookieValue && cookieItem) {
          copySiteCookieValueToClipboard(cookieValue, cookieItem);
        }
      }
    });

  // Function to clear all site data (cookies + storage)
  function clearAllSiteData(domain, url) {
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
                          deleteReq.onsuccess = () =>
                            console.log(`Deleted IndexedDB: ${db.name}`);
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
  function clearAllSiteCookies(domain) {
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
                  successCount > 0 ? "success" : "info"
                );
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
  function showSiteCookiesInfo(domain) {
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
          cookieElement.className = "site-cookie-item";

          const cookieHeader = document.createElement("div");
          cookieHeader.className = "site-cookie-header";
          cookieHeader.innerHTML = `${
            index + 1
          }. <span class="clickable-site-cookie-name" data-cookie-name="${cookie.name.replace(
            /"/g,
            "&quot;"
          )}" title="Click to copy cookie name">${breakLongString(
            cookie.name
          )}</span>`;
          cookieElement.appendChild(cookieHeader);

          const cookieValue = document.createElement("div");
          cookieValue.className = "site-cookie-value";
          cookieValue.innerHTML = `Value: <span class="clickable-site-cookie-value" data-cookie-value="${cookie.value.replace(
            /"/g,
            "&quot;"
          )}" title="Click to copy cookie value">${breakLongString(
            formatCookieValue(cookie.value)
          )}</span>`;
          cookieElement.appendChild(cookieValue);

          const cookieDomain = document.createElement("div");
          cookieDomain.className = "site-cookie-domain";
          cookieDomain.textContent = `Domain: ${cookie.domain || domain}`;
          cookieElement.appendChild(cookieDomain);

          const cookiePath = document.createElement("div");
          cookiePath.className = "site-cookie-path";
          cookiePath.textContent = `Path: ${cookie.path || "/"}`;
          cookieElement.appendChild(cookiePath);

          const cookieExpires = document.createElement("div");
          cookieExpires.className = "site-cookie-expires";
          if (cookie.expirationDate) {
            const expiryDate = new Date(cookie.expirationDate * 1000);
            cookieExpires.textContent = `Expires: ${expiryDate.toLocaleString()}`;
          } else {
            cookieExpires.textContent = `Expires: Session cookie`;
          }
          cookieElement.appendChild(cookieExpires);

          const cookieFlags = document.createElement("div");
          cookieFlags.className = "site-cookie-flags";
          cookieFlags.textContent = `Secure: ${
            cookie.secure ? "Yes" : "No"
          } | HttpOnly: ${cookie.httpOnly ? "Yes" : "No"}`;
          cookieElement.appendChild(cookieFlags);

          cookiesContainer.appendChild(cookieElement);
        });
      }

      // Clear previous content and append the new container
      statusMessage.innerHTML = "";
      statusMessage.appendChild(cookiesContainer);
      statusMessage.className = "info";
      statusMessage.style.display = "block";
    });
  }

  // Function to display status messages in the global status area
  // This should only be used for general information, not for cookie-specific messages
  function showStatus(message, type) {
    // Filter out any cookie-specific messages regardless of type
    if (
      message.includes("Cookie") &&
      (message.includes("not found") ||
        message.includes("domain") ||
        message.includes("Domain") ||
        message.includes("match") ||
        message.includes("specific to") ||
        message.includes("added to site") ||
        message.includes("removed from site") ||
        message.includes("already set on") ||
        message.includes("set successfully"))
    ) {
      // Only log to console, don't show in the UI
      console.log(
        `[STATUS] Not showing cookie-specific message in footer: ${message}`
      );
      return;
    }

    // Reset previous timer if it was set
    if (hideStatusTimer) {
      clearTimeout(hideStatusTimer);
      hideStatusTimer = null;
    }

    // Update message
    if (type === "info" && message.includes("Site cookies for")) {
      // For site cookies info, handle it separately - don't try to display here
      console.log(
        "Site cookies info being displayed via showSiteCookiesInfo()"
      );
      return;
    } else if (message.includes("Current domain:")) {
      console.log(`Domain message: ${message}`);
      return; // Don't show in status message area
    } else {
      // For regular messages, use textContent for security
      statusMessage.textContent = message;
    }

    statusMessage.className = type;
    statusMessage.style.display = "block";

    // If error related to cookie name, open the accordion form with animation
    if (type === "error" && message.includes("Please specify")) {
      // Only open if it's not already open
      if (!accordion.classList.contains("active")) {
        // First add the active class
        accordion.classList.add("active");

        // Then animate the form content
        const form = accordion.querySelector(".add-cookie-form");
        form.style.opacity = "0";

        setTimeout(function () {
          form.style.opacity = "1";
        }, 50);
      }
    }

    // Automatically hide message after 3 seconds, but only for successful operations and not cookies info
    if (type === "success" || type === "removed") {
      hideStatusTimer = setTimeout(function () {
        statusMessage.style.display = "none";
        hideStatusTimer = null;
      }, 3000);
    }
  }

  // Function to close all accordions
  function closeAllAccordions() {
    // Clear status message when closing accordions
    clearStatusMessage();

    // Close the Add new cookie accordion if it's open
    if (accordion.classList.contains("active")) {
      const content = accordion.querySelector(".accordion-content");
      const form = content.querySelector(".add-cookie-form");
      form.style.opacity = "0";

      setTimeout(function () {
        accordion.classList.remove("active");
      }, 100);
    }

    // Close the Saved cookies accordion if it's open
    if (savedCookiesAccordion.classList.contains("active")) {
      const content = savedCookiesAccordion.querySelector(".accordion-content");
      const savedContent = content.querySelector(".saved-cookies-content");
      savedContent.style.opacity = "0";

      setTimeout(function () {
        savedCookiesAccordion.classList.remove("active");
        content.style.maxHeight = "0";
        content.style.padding = "0 15px";
      }, 200);
    }
  }

  // Function to display status messages under the specific cookie
  function showCookieStatus(cookieId, message, type, cookieItem) {
    // If cookieItem is provided, use it directly
    let statusElement;

    if (cookieItem) {
      statusElement = cookieItem.querySelector(".cookie-status-message");
    } else {
      // Otherwise, find it by ID
      statusElement = document.getElementById(`status-${cookieId}`);
    }

    if (!statusElement) {
      // If status element not found, log error to console but don't show global message
      console.error(`Status element for cookie ID ${cookieId} not found`);
      return;
    }

    // Remove any existing classes
    statusElement.className = "cookie-status-message";

    // Add the new class based on type
    statusElement.classList.add(type);

    // Set message
    statusElement.textContent = message;

    // Automatically hide all messages after 3 seconds
    // For 'info' type messages (site cookies)
    // don't hide automatically
    if (message.indexOf("Site cookies for") === -1) {
      // Clear previous timers if they exist
      if (statusElement.hideTimer) {
        clearTimeout(statusElement.hideTimer);
      }

      // Set new timer (3 seconds)
      statusElement.hideTimer = setTimeout(() => {
        statusElement.className = "cookie-status-message";
        statusElement.hideTimer = null;
      }, 3000);
    }
  }

  // Function to highlight invalid form field
  function highlightInvalidField(fieldElement, isInvalid) {
    if (isInvalid) {
      fieldElement.classList.add("invalid-field");
    } else {
      fieldElement.classList.remove("invalid-field");
    }
  }

  // Function to clear all field highlights
  function clearFieldHighlights() {
    const formFields = [
      cookieNameInput,
      cookieValueInput,
      cookieDomainInput,
      cookiePathInput,
      cookieExpirationInput,
    ];
    formFields.forEach((field) => {
      field.classList.remove("invalid-field");
    });
  }

  // Function to show validation message for the form
  function showFormValidation(message, type, invalidField = null) {
    // Clear previous validation messages
    formValidationMessage.textContent = message;
    formValidationMessage.className = "validation-message";
    formValidationMessage.classList.add(type);

    // Auto-hide success messages after 3 seconds
    if (type === "success") {
      setTimeout(function () {
        formValidationMessage.classList.remove(type);
        formValidationMessage.textContent = "";
      }, 3000);
    }

    // Highlight invalid field if provided
    if (invalidField) {
      highlightInvalidField(invalidField, true);
    }
  }

  // Function to clear validation message
  function clearFormValidation() {
    formValidationMessage.textContent = "";
    formValidationMessage.className = "validation-message";
    clearFieldHighlights();
  }

  // Helper function to format cookie value (truncate if too long)
  function formatCookieValue(value) {
    if (!value) return "";
    if (value.length <= 50) return value;
    return value.substring(0, 50) + "...";
  }

  // Add input event handlers to clear invalid state when user starts typing
  cookieNameInput.addEventListener("input", function () {
    highlightInvalidField(this, false);
  });

  cookieValueInput.addEventListener("input", function () {
    highlightInvalidField(this, false);
  });

  cookieDomainInput.addEventListener("input", function () {
    highlightInvalidField(this, false);
  });

  cookiePathInput.addEventListener("input", function () {
    highlightInvalidField(this, false);
  });

  cookieExpirationInput.addEventListener("input", function () {
    highlightInvalidField(this, false);
  });

  // Function to update current domain display
  function updateCurrentDomain() {
    // Get current tab URL to determine domain
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0] && tabs[0].url) {
        try {
          const urlObj = new URL(tabs[0].url);
          const domain = urlObj.hostname;
          document.getElementById(
            "currentDomain"
          ).textContent = `Current domain: ${domain}`;
        } catch (e) {
          document.getElementById("currentDomain").textContent =
            "Current domain: error parsing URL";
          console.error("Error parsing URL:", e);
        }
      } else {
        document.getElementById("currentDomain").textContent =
          "Current domain: unknown";
      }
    });
  }

  // Function to break long strings for display
  function breakLongString(str, maxLength = 35) {
    if (!str || str.length <= maxLength) return str;
    let result = "";
    for (let i = 0; i < str.length; i += maxLength) {
      result += str.slice(i, i + maxLength);
      if (i + maxLength < str.length) {
        result += "<wbr>"; // Word break opportunity
      }
    }
    return result;
  }

  // Function to search for a specific cookie on current site
  function searchCookieOnCurrentSite(cookieName) {
    // Clear previous results
    clearSearchResult();

    // Show searching status
    showSearchResult(
      `Searching for cookie "${breakLongString(
        cookieName
      )}" on current site...`,
      "searching"
    );

    // Validate cookie name
    const nameValidation = validateCookieName(cookieName);
    if (!nameValidation.valid) {
      showSearchResult(
        `Invalid cookie name: ${nameValidation.message}`,
        "error"
      );
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0] || !tabs[0].url) {
        showSearchResult("No active tab to search cookie", "error");
        return;
      }

      try {
        const urlObj = new URL(tabs[0].url);
        const domain = urlObj.hostname;
        const url = tabs[0].url;

        debugLog(`Searching for cookie "${cookieName}" on ${domain}`, "info");

        // Search using chrome.cookies API with timeout protection
        let searchCompleted = false;

        // Set a timeout for the search
        const searchTimeout = setTimeout(() => {
          if (!searchCompleted) {
            debugLog(`Cookie search timed out for ${cookieName}`, "error");
            showSearchResult(
              `Search timed out for cookie "${breakLongString(cookieName)}"`,
              "error"
            );
          }
        }, 5000);

        chrome.cookies.get(
          {
            url: url,
            name: cookieName,
          },
          function (cookie) {
            searchCompleted = true;
            clearTimeout(searchTimeout);

            if (chrome.runtime.lastError) {
              debugLog(
                `Chrome cookies API error: ${chrome.runtime.lastError.message}`,
                "error"
              );
              showSearchResult(
                `Error searching cookie: ${chrome.runtime.lastError.message}`,
                "error"
              );
              return;
            }

            if (cookie) {
              // Cookie found
              debugLog(
                `Cookie found: ${cookie.name} on ${cookie.domain}`,
                "info"
              );
              const cookieInfo = `
                <strong>Cookie found:</strong><br>
                <strong>${breakLongString(cookie.name)}</strong>
                <div class="cookie-details-search">
                  <strong>Name:</strong> ${breakLongString(cookie.name)}<br>
                  <strong>Value:</strong> <span class="clickable-value" data-full-value="${cookie.value.replace(
                    /"/g,
                    "&quot;"
                  )}" title="Click to copy value">${
                cookie.value.length > 50
                  ? breakLongString(cookie.value.substring(0, 50)) + "..."
                  : breakLongString(cookie.value)
              }</span><br>
                  <strong>Domain:</strong> ${cookie.domain}<br>
                  <strong>Path:</strong> ${cookie.path}<br>
                  <strong>Secure:</strong> ${cookie.secure ? "Yes" : "No"}<br>
                  <strong>HttpOnly:</strong> ${cookie.httpOnly ? "Yes" : "No"}
                </div>
              `;
              showSearchResult(cookieInfo, "found");
            } else {
              // Cookie not found - check if it might exist with different domains
              debugLog(
                `Cookie not found on primary domain, checking variations...`,
                "info"
              );
              searchCookieAllDomains(cookieName, domain, url);
            }
          }
        );
      } catch (e) {
        showSearchResult(`Error: ${e.message}`, "error");
      }
    });
  }

  // Function to search cookie on all possible domain variations
  function searchCookieAllDomains(cookieName, currentDomain, currentUrl) {
    // Try different domain variations
    const domainVariations = [
      currentDomain,
      `.${currentDomain}`,
      currentDomain.replace(/^www\./, ""),
      `.${currentDomain.replace(/^www\./, "")}`,
    ];

    let foundCookie = null;
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
      if (!searchCompleted && !foundCookie) {
        debugLog(`All domain searches timed out for ${cookieName}`, "error");
        showSearchResult(
          `Search timed out - cookie "${breakLongString(
            cookieName
          )}" not found`,
          "not-found"
        );
        searchCompleted = true;
      }
    }, 8000);

    uniqueDomains.forEach((domain) => {
      const testUrl = `https://${
        domain.startsWith(".") ? domain.substring(1) : domain
      }/`;

      debugLog(`Searching domain variation: ${domain} (${testUrl})`, "info");

      chrome.cookies.get(
        {
          url: testUrl,
          name: cookieName,
        },
        function (cookie) {
          searchCount++;

          if (searchCompleted) return; // Prevent multiple results

          if (cookie && !foundCookie) {
            foundCookie = cookie;
            searchCompleted = true;
            clearTimeout(allSearchTimeout);

            debugLog(
              `Cookie found on domain variation: ${cookie.domain}`,
              "info"
            );

            const cookieInfo = `
              <strong>Cookie found on ${cookie.domain}:</strong><br>
              <strong>${breakLongString(cookie.name)}</strong>
              <div class="cookie-details-search">
                <strong>Name:</strong> ${breakLongString(cookie.name)}<br>
                <strong>Value:</strong> <span class="clickable-value" data-full-value="${cookie.value.replace(
                  /"/g,
                  "&quot;"
                )}" title="Click to copy value">${
              cookie.value.length > 50
                ? breakLongString(cookie.value.substring(0, 50)) + "..."
                : breakLongString(cookie.value)
            }</span><br>
                <strong>Domain:</strong> ${cookie.domain}<br>
                <strong>Path:</strong> ${cookie.path}<br>
                <strong>Note:</strong> This cookie exists but may not be accessible from current domain (${currentDomain})
              </div>
            `;
            showSearchResult(cookieInfo, "found");
          } else if (
            searchCount === uniqueDomains.length &&
            !foundCookie &&
            !searchCompleted
          ) {
            // All searches completed, no cookie found
            searchCompleted = true;
            clearTimeout(allSearchTimeout);

            debugLog(`Cookie not found in any domain variation`, "info");
            showSearchResult(
              `Cookie "${breakLongString(
                cookieName
              )}" not found on current site or related domains`,
              "not-found"
            );
          }
        }
      );
    });
  }

  // Function to copy cookie value to clipboard
  function copyCookieValueToClipboard(cookieValue) {
    // Copy to clipboard using the modern API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(cookieValue)
        .then(() => {
          // Show temporary success message
          showTemporaryMessage(
            "✓ Cookie value copied to clipboard!",
            "success"
          );
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
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);

    try {
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      if (successful) {
        showTemporaryMessage("✓ Cookie value copied to clipboard!", "success");
      } else {
        showTemporaryMessage("❌ Failed to copy cookie value", "error");
      }
    } catch (err) {
      debugLog(`Fallback copy failed: ${err}`, "error");
      showTemporaryMessage("❌ Copy not supported", "error");
    }

    document.body.removeChild(textArea);
  }

  // Function to show temporary message without affecting search results
  function showTemporaryMessage(message, type) {
    // Create temporary message element if it doesn't exist
    let tempMessage = document.getElementById("temp-copy-message");
    if (!tempMessage) {
      tempMessage = document.createElement("div");
      tempMessage.id = "temp-copy-message";
      tempMessage.className = "temp-message";

      // Insert after search result
      const searchResult = document.getElementById("search-result");
      searchResult.parentNode.insertBefore(
        tempMessage,
        searchResult.nextSibling
      );
    }

    tempMessage.textContent = message;
    tempMessage.className = `temp-message ${type}`;
    tempMessage.style.display = "block";

    // Auto-hide after 2 seconds
    setTimeout(() => {
      tempMessage.style.display = "none";
    }, 2000);
  }

  // Function to copy site cookie name to clipboard
  function copySiteCookieNameToClipboard(cookieName, cookieItem) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(cookieName)
        .then(() => {
          showSiteCookieItemMessage(
            cookieItem,
            "✓ Cookie name copied!",
            "success"
          );
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
  function copySiteCookieValueToClipboard(cookieValue, cookieItem) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(cookieValue)
        .then(() => {
          showSiteCookieItemMessage(
            cookieItem,
            "✓ Cookie value copied!",
            "success"
          );
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
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);

    try {
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      if (successful) {
        showSiteCookieItemMessage(
          cookieItem,
          `✓ Cookie ${type} copied!`,
          "success"
        );
      } else {
        showSiteCookieItemMessage(
          cookieItem,
          `❌ Failed to copy cookie ${type}`,
          "error"
        );
      }
    } catch (err) {
      debugLog(`Fallback copy failed: ${err}`, "error");
      showSiteCookieItemMessage(cookieItem, "❌ Copy not supported", "error");
    }

    document.body.removeChild(textArea);
  }

  // Function to show message within specific cookie item
  function showSiteCookieItemMessage(cookieItem, message, type) {
    // Create or update message element within this specific cookie item
    let tempMessage = cookieItem.querySelector(".cookie-item-message");
    if (!tempMessage) {
      tempMessage = document.createElement("div");
      tempMessage.className = "cookie-item-message";

      // Insert at the end of the cookie item
      cookieItem.appendChild(tempMessage);
    }

    tempMessage.textContent = message;
    tempMessage.className = `cookie-item-message ${type}`;
    tempMessage.style.display = "block";

    // Auto-hide after 2 seconds
    setTimeout(() => {
      tempMessage.style.display = "none";
    }, 2000);
  }

  // Function to show message within site cookies info (legacy function kept for compatibility)
  function showSiteCookieMessage(message, type) {
    // Create temporary message element within status-message if it doesn't exist
    let tempMessage = document.getElementById("site-cookie-copy-message");
    if (!tempMessage) {
      tempMessage = document.createElement("div");
      tempMessage.id = "site-cookie-copy-message";
      tempMessage.className = "site-cookie-temp-message";

      // Insert at the top of status-message
      const statusMessage = document.getElementById("status-message");
      if (statusMessage.firstChild) {
        statusMessage.insertBefore(tempMessage, statusMessage.firstChild);
      } else {
        statusMessage.appendChild(tempMessage);
      }
    }

    tempMessage.textContent = message;
    tempMessage.className = `site-cookie-temp-message ${type}`;
    tempMessage.style.display = "block";

    // Auto-hide after 2 seconds
    setTimeout(() => {
      tempMessage.style.display = "none";
    }, 2000);
  }

  // Function to clear search results
  function clearSearchResult() {
    const searchResult = document.getElementById("search-result");
    searchResult.innerHTML = "";
    searchResult.className = "search-result";
    searchResult.style.display = "none";

    // Clear any existing timers
    if (searchResult.hideTimer) {
      clearTimeout(searchResult.hideTimer);
      searchResult.hideTimer = null;
    }
  }

  // Function to show search results
  function showSearchResult(message, type) {
    const searchResult = document.getElementById("search-result");

    // Clear any existing timers first
    if (searchResult.hideTimer) {
      clearTimeout(searchResult.hideTimer);
      searchResult.hideTimer = null;
    }

    searchResult.innerHTML = message;
    searchResult.className = `search-result ${type}`;
    searchResult.style.display = "block";

    debugLog(`Search result: ${type} - ${message}`, "info");

    // Auto-hide after 8 seconds for success messages
    if (type === "found") {
      searchResult.hideTimer = setTimeout(() => {
        clearSearchResult();
      }, 8000);
    }

    // Auto-hide searching status after 10 seconds (as fallback)
    if (type === "searching") {
      searchResult.hideTimer = setTimeout(() => {
        showSearchResult("Search timed out", "error");
      }, 10000);
    }
  }
});
