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

  // Debug button handlers
  const openDevToolsBtn = document.getElementById("openDevToolsBtn");

  // Timer for automatically hiding messages
  let hideStatusTimer = null;

  // Track if add cookie form was just used
  let isAddCookieJustUsed = false;

  // Add accordion functionality for "Add new cookie"
  accordionHeader.addEventListener("click", function () {
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
        safeRenderHTML(
          cookiesList,
          `<div class="no-cookies-message">No saved cookies yet</div>`
        );

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

  // Handler for opening Site cookies
  openDevToolsBtn.addEventListener("click", function () {
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

      try {
        const urlObj = new URL(tabs[0].url);
        const domain = urlObj.hostname;

        // Відкриваємо cookies для поточного сайту
        chrome.tabs.create(
          {
            url: `chrome://settings/cookies/detail?site=${domain}`,
            active: true,
          },
          function (newTab) {
            if (chrome.runtime.lastError) {
              showStatus(`Error: ${chrome.runtime.lastError.message}`, "error");

              // Спробуємо показати вбудовану інформацію про куки
              showSiteCookiesInfo(domain);
            }
          }
        );
      } catch (e) {
        showStatus(`Error: ${e.message}`, "error");
      }
    });
  });

  // Функція для показу інформації про куки в самому розширенні
  function showSiteCookiesInfo(domain) {
    // Показуємо повідомлення про завантаження
    showStatus("Loading cookies...", "info");

    // Отримуємо всі куки
    chrome.cookies.getAll({}, function (allCookies) {
      if (chrome.runtime.lastError) {
        showStatus(
          `Error getting cookies: ${chrome.runtime.lastError.message}`,
          "error"
        );
        return;
      }

      // Фільтруємо куки для поточного домену
      const siteCookies = allCookies.filter((cookie) => {
        // Точне співпадіння домену
        if (cookie.domain === domain) return true;

        // Перевіряємо, чи є домен субдоменом cookie.domain (для .example.com кук)
        if (
          cookie.domain.startsWith(".") &&
          domain.endsWith(cookie.domain.substring(1))
        )
          return true;

        return false;
      });

      // Форматуємо куки для відображення
      let htmlContent = `<strong>Site cookies for ${domain}</strong><br>`;
      htmlContent += `<strong>Total cookies found: ${siteCookies.length}</strong><br><br>`;

      if (siteCookies.length === 0) {
        htmlContent += "No cookies found for this site.<br>";
      } else {
        // Сортуємо куки за іменем
        siteCookies.sort((a, b) => a.name.localeCompare(b.name));

        siteCookies.forEach((cookie, index) => {
          htmlContent += `<div style="margin: 5px 0; padding: 5px; border-left: 3px solid #9e9e9e;">`;
          htmlContent += `<strong>${index + 1}. ${cookie.name}</strong><br>`;
          htmlContent += `Value: ${formatCookieValue(cookie.value)}<br>`;
          htmlContent += `Domain: ${cookie.domain || domain}<br>`;
          htmlContent += `Path: ${cookie.path || "/"}<br>`;

          if (cookie.expirationDate) {
            const expiryDate = new Date(cookie.expirationDate * 1000);
            htmlContent += `Expires: ${expiryDate.toLocaleString()}<br>`;
          } else {
            htmlContent += `Expires: Session cookie<br>`;
          }

          htmlContent += `Secure: ${cookie.secure ? "Yes" : "No"} | HttpOnly: ${
            cookie.httpOnly ? "Yes" : "No"
          }<br>`;
          htmlContent += `</div>`;
        });
      }

      // Безпечне відображення HTML
      safeRenderHTML(statusMessage, htmlContent);
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
      // For site cookies info, use safeRenderHTML to render formatted HTML content
      safeRenderHTML(statusMessage, message);
    } else if (message.includes("Current domain:")) {
      // Для повідомлень про домен просто пропускаємо відображення
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

  // Function to clear all status messages, including messages under cookie items
  function clearAllStatusMessages() {
    // Clear global message
    statusMessage.textContent = "";
    statusMessage.style.display = "none";

    // Clear global message timer
    if (hideStatusTimer) {
      clearTimeout(hideStatusTimer);
      hideStatusTimer = null;
    }

    // Clear form validation message
    clearFormValidation();

    // Clear statuses under cookies
    const cookieStatusElements = document.querySelectorAll(
      ".cookie-status-message"
    );
    cookieStatusElements.forEach((statusElement) => {
      statusElement.className = "cookie-status-message";
      statusElement.textContent = "";

      // Clear timer if exists
      if (statusElement.hideTimer) {
        clearTimeout(statusElement.hideTimer);
        statusElement.hideTimer = null;
      }
    });
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
    // Get current tab URL to determine default domain
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
});
