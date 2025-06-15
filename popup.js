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
    // Don't clear if site cookies are currently displayed
    if (
      siteCookiesDisplayed &&
      statusMessage.querySelector(".site-cookies-container")
    ) {
      // Only clear the class and timer, but preserve the site cookies content
      statusMessage.className = "info";
      if (hideStatusTimer) {
        clearTimeout(hideStatusTimer);
        hideStatusTimer = null;
      }
      return;
    }
    statusMessage.innerHTML = "";
    statusMessage.className = "";
    statusMessage.style.display = "none";
    siteCookiesDisplayed = false; // Reset flag when clearing

    // Clear timer if it exists
    if (hideStatusTimer) {
      clearTimeout(hideStatusTimer);
      hideStatusTimer = null;
    }
  }

  // Function to scroll accordion into view
  function scrollAccordionIntoView(accordionElement) {
    setTimeout(() => {
      // Reset any scroll behavior modifications from previous calls
      const container = document.querySelector(".container");
      if (container) {
        container.style.scrollBehavior = "";
      }

      // Simple scroll without style manipulation
      accordionElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  }

  // Function to scroll add new cookie accordion - same approach as Saved cookies
  function scrollAddCookieAccordionIntoView() {
    setTimeout(() => {
      // Use scrollIntoView with start block for stability
      accordion.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }, 100);
  }

  // Add accordion functionality for "Add new cookie"
  accordionHeader.addEventListener("click", function () {
    // Close site cookies when opening accordion
    if (siteCookiesDisplayed) {
      siteCookiesDisplayed = false;
      clearStatusMessage();
    }
    // Clear search results when clicking accordion
    clearSearchResult();

    // Get the content element
    const content = accordion.querySelector(".accordion-content");
    const isActive = accordion.classList.contains("active");

    if (isActive) {
      // If closing the accordion, toggle active class immediately
      accordion.classList.remove("active");

      // Clear any inline styles that might prevent closing
      const form = content.querySelector(".add-cookie-form");
      if (form) {
        form.style.opacity = "";
      }
    } else {
      // Close other accordion first
      if (savedCookiesAccordion.classList.contains("active")) {
        savedCookiesAccordion.classList.remove("active");
        const otherContent =
          savedCookiesAccordion.querySelector(".accordion-content");
        const otherSavedContent = otherContent.querySelector(
          ".saved-cookies-content"
        );
        otherSavedContent.style.opacity = "0";
        otherContent.style.maxHeight = "0";
        otherContent.style.padding = "0 15px";
      }

      // If opening, toggle class immediately
      accordion.classList.add("active");

      // Clear form fields and reset to defaults when opening
      cookieNameInput.value = "";
      cookieValueInput.value = "";
      cookieDomainInput.value = "";
      cookiePathInput.value = "/";
      cookieExpirationInput.value = "30";
      isGlobalCookieCheckbox.checked = true;
      cookieDomainInput.disabled = true;
      cookieDomainInput.placeholder = "Global cookie (any domain)";

      // Clear any validation messages and field highlights
      clearFormValidation();

      // Then fade in the content
      const form = content.querySelector(".add-cookie-form");
      form.style.opacity = "0";

      setTimeout(function () {
        form.style.opacity = "1";
        // Focus on the Name input after form is visible
        const nameInput = form.querySelector("#cookieName");
        if (nameInput) {
          nameInput.focus();
        }
      }, 50);

      // Scroll accordion into view when opening
      scrollAddCookieAccordionIntoView();
    }
  });

  // Add accordion functionality for "Saved cookies"
  savedCookiesHeader.addEventListener("click", function () {
    // Close site cookies when opening accordion
    if (siteCookiesDisplayed) {
      siteCookiesDisplayed = false;
      clearStatusMessage();
    }
    // Clear search results when clicking accordion
    clearSearchResult();

    // Get the content element
    const content = savedCookiesAccordion.querySelector(".accordion-content");
    const isActive = savedCookiesAccordion.classList.contains("active");
    const savedContent = content.querySelector(".saved-cookies-content");

    if (isActive) {
      // If closing the accordion, toggle active class immediately
      savedCookiesAccordion.classList.remove("active");

      // Clear any inline styles that might prevent closing
      content.style.maxHeight = "";
      content.style.padding = "";
      savedContent.style.opacity = "";

      // Reset any scroll behavior modifications
      const container = document.querySelector(".container");
      if (container) {
        container.style.scrollBehavior = "";
      }

      // Clear status message after closing
      clearStatusMessage();
    } else {
      // Close other accordion first
      if (accordion.classList.contains("active")) {
        accordion.classList.remove("active");
        const otherContent = accordion.querySelector(".accordion-content");
        const otherForm = otherContent.querySelector(".add-cookie-form");
        otherForm.style.opacity = "0";
      }

      // If opening, toggle class immediately
      savedCookiesAccordion.classList.add("active");

      // Then fade in the content and set proper height
      savedContent.style.opacity = "0";
      content.style.maxHeight = "300px";
      content.style.padding = "15px";

      setTimeout(function () {
        savedContent.style.opacity = "1";
      }, 100);

      // Scroll accordion into view when opening - stable approach
      setTimeout(() => {
        // Use window.scrollTo for precise positioning
        const accordionTop = savedCookiesAccordion.offsetTop;
        const offset = Math.max(0, accordionTop - 50); // 50px offset from top for better visibility

        window.scrollTo({
          top: offset,
          behavior: "smooth",
        });
      }, 200);
    }
  });

  // Function for logging with status display
  function debugLog(message, type = "info") {
    // Only log to console in debug mode
    if (DEBUG_MODE) {
      console.log(`[DEBUG] ${message}`);
    }

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
      message.includes("Set domain for global cookie removal to") ||
      message.includes("Updating button state for cookie") ||
      message.includes("Auto-synced") ||
      message.includes("cookies with") ||
      message.includes("API call") ||
      (message.includes("Loaded") &&
        message.includes("cookies from storage")) ||
      message.includes("Updated draggable state for") ||
      message.includes("Loading cookies...") ||
      message.includes("Clearing all site data...") ||
      message.includes("Manual storage clear:") ||
      message.includes("Clearing cookies...") ||
      message.includes("Cleared all data for") ||
      (message.includes("Found") &&
        message.includes("cookies accessible to")) ||
      (message.includes("Trying to remove") && message.includes("with URL:"))
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

  // Auto-sync cookie states when extension opens
  // autoSyncCookieStates(); // REMOVED - call after DOM creation

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
    // Clear search results when adding new cookie
    clearSearchResult();

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

            // Set cookie on active tab (without showing toast - will be shown by setCookie function)
            setCookie(cookieConfig); // Use unencrypted version for setting cookie

            // Set flag that we just used the add cookie form
            isAddCookieJustUsed = true;

            // Clear form fields and reset to defaults
            cookieNameInput.value = "";
            cookieValueInput.value = "";
            cookieDomainInput.value = "";
            cookiePathInput.value = "/";
            cookieExpirationInput.value = "30";
            isGlobalCookieCheckbox.checked = true;
            cookieDomainInput.disabled = true;
            cookieDomainInput.placeholder = "Global cookie (any domain)";

            // Clear any validation messages and field highlights
            clearFormValidation();

            // Close accordion after successful addition
            // Fade out the form first
            const form = accordion.querySelector(".add-cookie-form");
            form.style.opacity = "0";

            setTimeout(function () {
              accordion.classList.remove("active");

              // Update cookie list
              loadSavedCookies();

              // Don't auto-sync here - let the setCookie function handle it
              // after verifying the cookie was actually set
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
            // Focus on the Name input after form is visible
            const nameInput = form.querySelector("#cookieName");
            if (nameInput) {
              nameInput.focus();
            }
          }, 50);

          // Scroll accordion into view when opening programmatically
          scrollAddCookieAccordionIntoView();
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

        // Scroll accordion into view when opening programmatically
        scrollAccordionIntoView(savedCookiesAccordion);
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

      // Sync button states after DOM elements are created
      setTimeout(() => {
        autoSyncCookieStates();
      }, 100);

      // Initialize drag and drop after cookies are loaded (only if there are cookies)
      if (savedCookies.length > 1) {
        setTimeout(() => {
          initializeDragAndDrop();
        }, 150);
      }

      // Update draggable state based on cookie count
      updateDraggableState(savedCookies.length);
    });
  }

  // Update draggable state based on number of cookies
  function updateDraggableState(cookieCount) {
    const cookieItems = document.querySelectorAll(".cookie-item");

    cookieItems.forEach((item) => {
      if (cookieCount > 1) {
        // Enable dragging
        item.draggable = true;
        item.classList.add("draggable-enabled");
        item.classList.remove("draggable-disabled");
      } else {
        // Disable dragging
        item.draggable = false;
        item.classList.add("draggable-disabled");
        item.classList.remove("draggable-enabled");
      }
    });

    // Update cookies list class for styling
    if (cookieCount > 1) {
      cookiesList.classList.add("multi-cookies");
      cookiesList.classList.remove("single-cookie");
    } else {
      cookiesList.classList.add("single-cookie");
      cookiesList.classList.remove("multi-cookies");
    }

    debugLog(
      `Updated draggable state for ${cookieCount} cookies: ${
        cookieCount > 1 ? "enabled" : "disabled"
      }`,
      "info"
    );
  }

  // Initialize drag and drop functionality
  function initializeDragAndDrop() {
    let draggedElement = null;
    let dragOverElement = null;
    let originalOrder = null;

    function handleDragStart(e) {
      if (!e.target.classList.contains("cookie-item")) return;

      draggedElement = e.target;
      e.target.classList.add("dragging");
      cookiesList.classList.add("dragging-active");

      // Store original order for comparison
      const cookieElements = Array.from(
        cookiesList.querySelectorAll(".cookie-item")
      );
      originalOrder = cookieElements.map((el) => el.dataset.id);

      // Set drag data
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/html", e.target.outerHTML);

      debugLog(`Started dragging cookie: ${e.target.dataset.id}`, "info");
    }

    function handleDragOver(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      const afterElement = getDragAfterElement(cookiesList, e.clientY);
      const dragging = document.querySelector(".dragging");

      if (afterElement == null) {
        cookiesList.appendChild(dragging);
      } else {
        cookiesList.insertBefore(dragging, afterElement);
      }
    }

    function handleDragEnter(e) {
      e.preventDefault();
      if (
        e.target.classList.contains("cookie-item") &&
        e.target !== draggedElement
      ) {
        // Remove previous drag-over classes
        document
          .querySelectorAll(".drag-over, .drag-over-bottom")
          .forEach((el) => {
            el.classList.remove("drag-over", "drag-over-bottom");
          });

        dragOverElement = e.target;

        // Determine if we should show border above or below
        const rect = e.target.getBoundingClientRect();
        const mouseY = e.clientY;
        const elementMiddle = rect.top + rect.height / 2;

        if (mouseY < elementMiddle) {
          e.target.classList.add("drag-over");
        } else {
          e.target.classList.add("drag-over-bottom");
        }
      }
    }

    function handleDragLeave(e) {
      if (e.target.classList.contains("cookie-item")) {
        e.target.classList.remove("drag-over", "drag-over-bottom");
      }
    }

    function handleDrop(e) {
      e.preventDefault();

      if (draggedElement) {
        // Get the new order of cookie IDs
        const cookieElements = Array.from(
          cookiesList.querySelectorAll(".cookie-item")
        );
        const newOrder = cookieElements.map((el) => el.dataset.id);

        // Check if order actually changed
        const orderChanged =
          !originalOrder ||
          originalOrder.length !== newOrder.length ||
          originalOrder.some((id, index) => id !== newOrder[index]);

        if (orderChanged) {
          // Update the order in storage
          updateCookieOrder(newOrder);

          debugLog(`Dropped cookie, new order: ${newOrder.join(", ")}`, "info");
          showToast("✓ Cookie order updated", "success");
        } else {
          debugLog(
            "Cookie dropped at same position, no reorder needed",
            "info"
          );
        }
      }

      // Clean up
      document
        .querySelectorAll(".drag-over, .drag-over-bottom")
        .forEach((el) => {
          el.classList.remove("drag-over", "drag-over-bottom");
        });
    }

    function handleDragEnd(e) {
      e.target.classList.remove("dragging");
      cookiesList.classList.remove("dragging-active");

      // Clean up all drag classes
      document
        .querySelectorAll(".drag-over, .drag-over-bottom")
        .forEach((el) => {
          el.classList.remove("drag-over", "drag-over-bottom");
        });

      draggedElement = null;
      dragOverElement = null;
      originalOrder = null;
    }

    function getDragAfterElement(container, y) {
      const draggableElements = [
        ...container.querySelectorAll(".cookie-item:not(.dragging)"),
      ];

      return draggableElements.reduce(
        (closest, child) => {
          const box = child.getBoundingClientRect();
          const offset = y - box.top - box.height / 2;

          if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
          } else {
            return closest;
          }
        },
        { offset: Number.NEGATIVE_INFINITY }
      ).element;
    }

    // Store function references for cleanup
    if (!cookiesList._dragHandlers) {
      cookiesList._dragHandlers = {
        dragstart: handleDragStart,
        dragover: handleDragOver,
        dragenter: handleDragEnter,
        dragleave: handleDragLeave,
        drop: handleDrop,
        dragend: handleDragEnd,
      };
    }

    // Remove existing event listeners to prevent duplicates
    Object.entries(cookiesList._dragHandlers).forEach(([event, handler]) => {
      cookiesList.removeEventListener(event, handler);
    });

    // Add event listeners to cookies list
    cookiesList.addEventListener("dragstart", handleDragStart);
    cookiesList.addEventListener("dragover", handleDragOver);
    cookiesList.addEventListener("dragenter", handleDragEnter);
    cookiesList.addEventListener("dragleave", handleDragLeave);
    cookiesList.addEventListener("drop", handleDrop);
    cookiesList.addEventListener("dragend", handleDragEnd);

    // Update stored handlers
    cookiesList._dragHandlers = {
      dragstart: handleDragStart,
      dragover: handleDragOver,
      dragenter: handleDragEnter,
      dragleave: handleDragLeave,
      drop: handleDrop,
      dragend: handleDragEnd,
    };
  }

  // Update cookie order in storage
  function updateCookieOrder(newOrder) {
    chrome.storage.local.get(["savedCookies"], function (result) {
      if (chrome.runtime.lastError) {
        debugLog(
          `Error reading cookies for reorder: ${chrome.runtime.lastError.message}`,
          "error"
        );
        return;
      }

      const savedCookies = result.savedCookies || [];

      // Create a map for quick lookup
      const cookieMap = new Map();
      savedCookies.forEach((cookie) => {
        cookieMap.set(cookie.id, cookie);
      });

      // Reorder cookies according to new order
      const reorderedCookies = newOrder
        .map((id) => cookieMap.get(id))
        .filter((cookie) => cookie);

      // Save the new order
      chrome.storage.local.set({ savedCookies: reorderedCookies }, function () {
        if (chrome.runtime.lastError) {
          debugLog(
            `Error saving reordered cookies: ${chrome.runtime.lastError.message}`,
            "error"
          );
          showToast("❌ Failed to save cookie order", "error");
        } else {
          debugLog(
            `Successfully reordered ${reorderedCookies.length} cookies`,
            "info"
          );
        }
      });
    });
  }

  // Function to create a cookie element
  function createCookieElement(cookie) {
    // Decrypt cookie if it's encrypted (with error handling)
    let decryptedCookie;
    try {
      decryptedCookie = cookie.isEncrypted
        ? encryptionHelpers.decryptCookieValues(cookie)
        : cookie;
    } catch (error) {
      debugLog(`Failed to decrypt cookie: ${error.message}`, "error");
      // Fallback to unencrypted version if decryption fails
      decryptedCookie = { ...cookie, isEncrypted: false };
    }

    const cookieItem = document.createElement("div");
    cookieItem.className = "cookie-item";
    cookieItem.dataset.id = decryptedCookie.id;
    // Draggable state will be set by updateDraggableState function

    // Drag handle
    const dragHandle = document.createElement("div");
    dragHandle.className = "drag-handle";
    dragHandle.innerHTML = "⋮⋮";
    dragHandle.title = "Drag to reorder";

    // Edit button (pencil icon) in top-right corner
    const editBtn = document.createElement("button");
    editBtn.className = "cookie-edit-btn-icon";
    editBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#007bff"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';
    editBtn.title = "Edit cookie value";
    editBtn.addEventListener("click", function () {
      debugLog(`Editing cookie: ${decryptedCookie.name}`, "info");
      editCookieValue(decryptedCookie.id);
    });

    // Delete button (trash icon) in top-right corner
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn-icon";
    deleteBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 32 32" fill="#dc3545"><path d="M5 7v19c0 1.326.527 2.598 1.464 3.536A5.004 5.004 0 0 0 10 31h12a5.004 5.004 0 0 0 3.536-1.464A5.004 5.004 0 0 0 27 26V7h3a1 1 0 0 0 0-2H2a1 1 0 0 0 0 2h3Zm20 0v19c0 .796-.316 1.559-.879 2.121A2.996 2.996 0 0 1 22 29H10a2.996 2.996 0 0 1-2.121-.879A2.996 2.996 0 0 1 7 26V7h18ZM11 3h10a1 1 0 0 0 0-2H11a1 1 0 0 0 0 2Z"/><path d="M12 12v12a1 1 0 0 0 2 0V12a1 1 0 0 0-2 0ZM18 12v12a1 1 0 0 0 2 0V12a1 1 0 0 0-2 0Z"/></svg>';
    deleteBtn.title = "Remove cookie from list";
    deleteBtn.addEventListener("click", function () {
      debugLog(`Deleting cookie: ${decryptedCookie.name}`, "info");
      deleteCookie(decryptedCookie.id);
    });

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
    const pathInfo = decryptedCookie.path || "/";
    const expirationInfo = decryptedCookie.expirationDays
      ? `${decryptedCookie.expirationDays}d`
      : "30d";

    // Create value span separately to avoid HTML entity issues
    const valueSpan = document.createElement("span");
    valueSpan.className = "clickable-value";
    valueSpan.title = "Click to copy value";
    const displayValue = decryptedCookie.value.substring(0, 15);
    const hasMore = decryptedCookie.value.length > 15;
    valueSpan.textContent = displayValue + (hasMore ? "..." : "");

    if (decryptedCookie.isGlobal) {
      cookieDetails.innerHTML = `Global | Path: ${pathInfo} | Expires: ${expirationInfo}<br>Value: `;
      cookieDetails.appendChild(valueSpan);
    } else {
      cookieDetails.innerHTML = `${decryptedCookie.domain} | Path: ${pathInfo} | Expires: ${expirationInfo}<br>Value: `;
      cookieDetails.appendChild(valueSpan);
    }

    // Add event listener for value clicking
    valueSpan.addEventListener("click", function () {
      copyCookieValueToClipboard(decryptedCookie.value);
    });

    cookieInfo.appendChild(cookieName);
    cookieInfo.appendChild(cookieDetails);

    // Toggle cookie button (full width)
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "toggle-btn-full";
    toggleBtn.textContent = "Add/Remove";
    toggleBtn.title = "Add/remove cookie on current site";
    toggleBtn.addEventListener("click", function () {
      debugLog(`Toggling cookie: ${decryptedCookie.name}`, "info");
      toggleCookie(decryptedCookie.id);
    });

    cookieItem.appendChild(editBtn);
    cookieItem.appendChild(deleteBtn);
    cookieItem.appendChild(cookieInfo);
    cookieItem.appendChild(toggleBtn);

    // Add status message field for this cookie item operations
    const statusMessage = document.createElement("div");
    statusMessage.className = "cookie-status-message";
    statusMessage.id = `status-${decryptedCookie.id}`;
    cookieItem.appendChild(statusMessage);

    // Add drag handle
    cookieItem.appendChild(dragHandle);

    return cookieItem;
  }

  // Function to copy only cookie name to clipboard
  function copyCookieNameToClipboard(cookieName, cookieItem) {
    // Copy to clipboard using the modern API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(cookieName)
        .then(() => {
          showToast("✓ Name copied", "success");
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
    textArea.className = "hidden-textarea";
    document.body.appendChild(textArea);

    try {
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      if (successful) {
        showToast("✓ Name copied", "success");
      } else {
        showToast("❌ Failed to copy", "error");
      }
    } catch (err) {
      debugLog(`Fallback copy failed: ${err}`, "error");
      showToast("❌ Copy not supported", "error");
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
          showToast("✓ Cookie copied to clipboard", "success");
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
    textArea.className = "hidden-textarea";
    document.body.appendChild(textArea);

    try {
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      if (successful) {
        showToast("✓ Cookie copied to clipboard", "success");
      } else {
        showToast("❌ Failed to copy cookie", "error");
      }
    } catch (err) {
      debugLog(`Fallback copy failed: ${err}`, "error");
      showToast("❌ Copy not supported", "error");
    }

    document.body.removeChild(textArea);
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
              showToast("No active tab to check cookie", "error");
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
                  showToast(
                    `Cookie "${decryptedCookie.name}" is specific to ${decryptedCookie.domain} domain. Current domain (${domain}) doesn't match.`,
                    "error"
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
                        showToast(
                          `Error checking cookie: ${chrome.runtime.lastError.message}`,
                          "error"
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
                        showToast(
                          `Cookie "${decryptedCookie.name}" removed from site ${domain}`,
                          "error"
                        );
                      } else {
                        // If cookie doesn't exist - add it
                        setCookieForCurrentTab(decryptedCookie, tabs[0]);
                        // Toast will be shown by setCookie function
                      }

                      // Update button state after toggle operation
                      setTimeout(() => {
                        autoSyncCookieStates();
                      }, 200);
                    }
                  );
                })
                .catch((error) => {
                  // User cancelled or other error
                  debugLog(`Cookie toggle cancelled: ${error.message}`, "info");
                  showToast(`Operation cancelled: ${error.message}`, "error");
                });
            } catch (e) {
              debugLog(`Error processing URL: ${e.message}`, "error");
              showToast(`Error: ${e.message}`, "error");
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

        // Auto-sync cookie states after deletion
        setTimeout(() => {
          autoSyncCookieStates();
        }, 200);
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
            const tabPath = urlObj.pathname;

            debugLog(
              `Tab domain: ${tabDomain}, Cookie domain: ${domain}`,
              "info"
            );
            debugLog(
              `Tab path: ${tabPath}, Cookie path: ${
                decryptedCookie.path || "/"
              }`,
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
                // Show security message as toast
                showToast(
                  `❌ Cannot set cookie for ${domain} from current page due to Same-Origin restrictions`,
                  "error"
                );
                return;
              }
            }

            // Note: Browser allows setting cookies with any path from any page on the same domain
            // The path only controls WHERE the cookie will be sent, not WHERE it can be set from
          } catch (e) {
            debugLog(`Error in Same-Origin check: ${e.message}`, "error");
            showToast(`❌ Error setting cookie: ${e.message}`, "error");
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
          showToast(
            `❌ Failed to set cookie: ${chrome.runtime.lastError.message}`,
            "error"
          );
        } else if (result) {
          debugLog(
            `Cookie set successfully: ${JSON.stringify(result)}`,
            "info"
          );
          showToast(
            `✅ Cookie "${decryptedCookie.name}" added successfully`,
            "success"
          );

          // Sync button states after successful cookie setting
          setTimeout(() => {
            autoSyncCookieStates();
          }, 300);
        } else {
          // No result means cookie was not set (likely due to path/domain restrictions)
          debugLog(`Cookie not set - no result returned`, "error");
          showToast(
            `❌ Cookie "${decryptedCookie.name}" could not be set. Check path and domain restrictions.`,
            "error"
          );
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
    // Check if site cookies are already displayed using the global flag
    if (siteCookiesDisplayed) {
      // If visible - hide it and clear search results
      siteCookiesDisplayed = false;
      clearStatusMessage();
      clearSearchResult();
      return;
    }

    // Clear search results when opening site cookies
    clearSearchResult();

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
    // Clear search results when clicking footer button
    clearSearchResult();
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
    // Clear search results when clicking footer button
    clearSearchResult();
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
  const searchResult = document.getElementById("search-result");
  const exportCookiesBtn = document.getElementById("exportCookiesBtn");
  const importCookiesBtn = document.getElementById("importCookiesBtn");
  const importFileInput = document.getElementById("importFileInput");

  // Track last search term to avoid duplicate searches
  let lastSearchTerm = "";
  let lastNotFoundTerm = "";

  // Debug mode flag - set to false for production
  const DEBUG_MODE = false;

  searchCookieBtn.addEventListener("click", function () {
    // Always close all accordions when focusing on search
    closeAllAccordions();

    const cookieName = cookieSearchInput.value.trim();
    if (cookieName) {
      // Check if this is the same search term as last time AND results are visible
      const searchResult = document.getElementById("search-result");
      const hasVisibleResults = searchResult.innerHTML.trim() !== "";

      if (cookieName === lastSearchTerm && hasVisibleResults) {
        // Don't perform duplicate search if results are already visible
        return;
      }

      if (cookieName === lastNotFoundTerm) {
        // Show toast for previously not found cookie without any search UI
        showToast(
          `Cookies containing "${breakLongString(
            cookieName
          )}" not found on current site or related domains`,
          "error"
        );
        return;
      }

      // Remove error state if exists
      cookieSearchInput.classList.remove("search-input-error");
      lastSearchTerm = cookieName; // Update last search term
      searchCookieOnCurrentSite(cookieName);
    } else {
      // Add error state and focus input
      cookieSearchInput.classList.add("search-input-error");
      cookieSearchInput.focus();
      showToast("Please enter a cookie name to search", "error");

      // Clear search results and cache when validation fails
      clearSearchResult();
      lastSearchQuery = null;
      lastSearchDomain = null;
      lastSearchResult = null;

      // Remove error state after 3 seconds
      setTimeout(() => {
        cookieSearchInput.classList.remove("search-input-error");
      }, 3000);
    }
  });

  // Allow search on Enter key
  cookieSearchInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      // Always close all accordions when focusing on search
      closeAllAccordions();

      const cookieName = event.target.value.trim();
      if (cookieName) {
        // Check if this is the same search term as last time AND results are visible
        const searchResult = document.getElementById("search-result");
        const hasVisibleResults = searchResult.innerHTML.trim() !== "";

        if (cookieName === lastSearchTerm && hasVisibleResults) {
          // Don't perform duplicate search if results are already visible
          return;
        }

        if (cookieName === lastNotFoundTerm) {
          // Show toast for previously not found cookie without any search UI
          showToast(
            `Cookies containing "${breakLongString(
              cookieName
            )}" not found on current site or related domains`,
            "error"
          );
          return;
        }

        // Remove error state if exists
        cookieSearchInput.classList.remove("search-input-error");
        lastSearchTerm = cookieName; // Update last search term
        searchCookieOnCurrentSite(cookieName);
      } else {
        // Add error state
        cookieSearchInput.classList.add("search-input-error");
        showToast("Please enter a cookie name to search", "error");

        // Clear search results and cache when validation fails
        clearSearchResult();
        lastSearchQuery = null;
        lastSearchDomain = null;
        lastSearchResult = null;

        // Remove error state after 3 seconds
        setTimeout(() => {
          cookieSearchInput.classList.remove("search-input-error");
        }, 3000);
      }
    }
  });

  // Clear error state when user starts typing
  cookieSearchInput.addEventListener("input", function () {
    if (cookieSearchInput.classList.contains("search-input-error")) {
      cookieSearchInput.classList.remove("search-input-error");
    }

    // Clear search cache when user modifies input
    lastSearchQuery = null;
    lastSearchDomain = null;
    lastSearchResult = null;
  });

  // Event delegation for clicking on cookie values in search results
  document
    .getElementById("search-result")
    .addEventListener("click", function (event) {
      if (event.target.classList.contains("clickable-name")) {
        const cookieName = event.target.getAttribute("data-cookie-name");
        if (cookieName) {
          navigator.clipboard
            .writeText(cookieName)
            .then(() => {
              showToast("✓ Cookie name copied!", "success");
            })
            .catch(() => {
              showToast("❌ Failed to copy cookie name", "error");
            });
        }
      } else if (event.target.classList.contains("clickable-value")) {
        const fullValue = event.target.getAttribute("data-full-value");
        if (fullValue) {
          copyCookieValueToClipboard(fullValue);
        }
      } else if (
        event.target.classList.contains("search-cookie-edit-btn") ||
        event.target.closest(".search-cookie-edit-btn")
      ) {
        const editBtn = event.target.classList.contains(
          "search-cookie-edit-btn"
        )
          ? event.target
          : event.target.closest(".search-cookie-edit-btn");
        const cookieName = editBtn.getAttribute("data-cookie-name");
        const cookieDomain = editBtn.getAttribute("data-cookie-domain");
        const cookiePath = editBtn.getAttribute("data-cookie-path");
        const cookieValue = editBtn.getAttribute("data-cookie-value");

        if (cookieName && cookieDomain && cookiePath) {
          editSearchedCookie(cookieName, cookieDomain, cookiePath, cookieValue);
        }
      } else if (
        event.target.classList.contains("search-cookie-delete-btn") ||
        event.target.closest(".search-cookie-delete-btn")
      ) {
        const deleteBtn = event.target.classList.contains(
          "search-cookie-delete-btn"
        )
          ? event.target
          : event.target.closest(".search-cookie-delete-btn");
        const cookieName = deleteBtn.getAttribute("data-cookie-name");
        const cookieDomain = deleteBtn.getAttribute("data-cookie-domain");
        const cookiePath = deleteBtn.getAttribute("data-cookie-path");

        if (cookieName && cookieDomain && cookiePath) {
          deleteSearchedCookie(cookieName, cookieDomain, cookiePath);
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
      } else if (
        event.target.classList.contains("search-cookie-edit-btn") ||
        event.target.closest(".search-cookie-edit-btn")
      ) {
        const editBtn = event.target.classList.contains(
          "search-cookie-edit-btn"
        )
          ? event.target
          : event.target.closest(".search-cookie-edit-btn");
        const cookieName = editBtn.getAttribute("data-cookie-name");
        const cookieDomain = editBtn.getAttribute("data-cookie-domain");
        const cookiePath = editBtn.getAttribute("data-cookie-path");
        const cookieValue = editBtn.getAttribute("data-cookie-value");

        if (cookieName && cookieDomain && cookiePath) {
          editSearchedCookie(cookieName, cookieDomain, cookiePath, cookieValue);
        }
      } else if (
        event.target.classList.contains("site-cookie-delete-btn") ||
        event.target.closest(".site-cookie-delete-btn")
      ) {
        const deleteBtn = event.target.classList.contains(
          "site-cookie-delete-btn"
        )
          ? event.target
          : event.target.closest(".site-cookie-delete-btn");
        const cookieName = deleteBtn.getAttribute("data-cookie-name");
        const cookieDomain = deleteBtn.getAttribute("data-cookie-domain");
        const cookiePath = deleteBtn.getAttribute("data-cookie-path");

        if (cookieName && cookieDomain && cookiePath) {
          deleteSiteCookie(cookieName, cookieDomain, cookiePath);
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

          // Create button container
          const buttonContainer = document.createElement("div");
          buttonContainer.className = "search-cookie-buttons";
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

          const cookieFlags = document.createElement("div");
          cookieFlags.className = "site-cookie-flags";
          cookieFlags.innerHTML = `<strong>Secure:</strong> ${
            cookie.secure ? "Yes" : "No"
          } | <strong>HttpOnly:</strong> ${cookie.httpOnly ? "Yes" : "No"}`;
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
      siteCookiesDisplayed = true;

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
  function deleteSiteCookie(cookieName, cookieDomain, cookiePath) {
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
                  siteCookiesDisplayed = false;
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
  function refreshSiteCookiesDisplay() {
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
  function removeCookieElementFromDOM(cookieName, cookieDomain, cookiePath) {
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
  function updateCookieCount() {
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
  function renumberCookies() {
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

  // Function to delete a searched cookie
  function deleteSearchedCookie(cookieName, cookieDomain, cookiePath) {
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
          lastSearchQuery = null;
          lastSearchDomain = null;
          lastSearchResult = null;

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
      return;
    } else if (message.includes("Current domain:")) {
      return; // Don't show in status message area
    } else {
      // For regular messages, use textContent for security
      statusMessage.textContent = message;
      siteCookiesDisplayed = false; // Reset flag when showing regular messages
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
          // Focus on the Name input after form is visible
          const nameInput = form.querySelector("#cookieName");
          if (nameInput) {
            nameInput.focus();
          }
        }, 50);

        // Scroll accordion into view when opening for validation errors
        scrollAddCookieAccordionIntoView();
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

  // Function to close saved cookies accordion
  function closeSavedCookiesAccordion() {
    if (savedCookiesAccordion.classList.contains("active")) {
      // Close accordion immediately
      savedCookiesAccordion.classList.remove("active");

      // Clear any inline styles that might prevent closing
      const content = savedCookiesAccordion.querySelector(".accordion-content");
      if (content) {
        content.style.maxHeight = "";
        content.style.padding = "";
      }
    }
  }

  // Function to close all accordions
  function closeAllAccordions() {
    // Don't clear status message if site cookies are displayed
    if (
      !siteCookiesDisplayed ||
      !statusMessage.querySelector(".site-cookies-container")
    ) {
      clearStatusMessage();
    }

    // Close the Add new cookie accordion if it's open
    if (accordion.classList.contains("active")) {
      accordion.classList.remove("active");

      // Clear any inline styles for add cookie form
      const content = accordion.querySelector(".accordion-content");
      if (content) {
        const form = content.querySelector(".add-cookie-form");
        if (form) {
          form.style.opacity = "";
        }
      }
    }

    // Close the Saved cookies accordion if it's open
    if (savedCookiesAccordion.classList.contains("active")) {
      savedCookiesAccordion.classList.remove("active");

      // Clear any inline styles for saved cookies accordion
      const content = savedCookiesAccordion.querySelector(".accordion-content");
      if (content) {
        content.style.maxHeight = "";
        content.style.padding = "";

        const savedContent = content.querySelector(".saved-cookies-content");
        if (savedContent) {
          savedContent.style.opacity = "";
        }
      }
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

  // Function to safely create search results container
  function createSearchResultsContainer(cookies, headerText) {
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

  // Search cache variables
  let lastSearchQuery = null;
  let lastSearchDomain = null;
  let lastSearchResult = null;
  let siteCookiesDisplayed = false; // Flag to prevent clearing site cookies

  // Function to search for a specific cookie on current site
  function searchCookieOnCurrentSite(cookieName) {
    // Validate that search term is not empty
    if (!cookieName || cookieName.trim() === "") {
      showToast("Please enter a cookie name to search", "error");
      clearSearchResult(); // Clear old results when validation fails
      // Clear cache to prevent stale results
      lastSearchQuery = null;
      lastSearchDomain = null;
      lastSearchResult = null;
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
          lastSearchQuery === searchTerm &&
          lastSearchDomain === domain &&
          lastSearchResult !== null
        ) {
          // debugLog(`Using cached search result for "${cookieName}" on ${domain}`, "info"); // Removed to avoid console clutter

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
          const normalizedCached = lastSearchResult.content
            .replace(/\s+/g, " ")
            .trim();
          const contentChanged = normalizedCurrent !== normalizedCached;

          // Handle cached "not found" result - show toast only, no search UI
          if (lastSearchResult.type === "not-found") {
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
            currentType !== lastSearchResult.type ||
            !isCurrentlyVisible
          ) {
            showSearchResult(lastSearchResult.content, lastSearchResult.type);
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
  function performNewSearch(cookieName, searchTerm, domain, url) {
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
            lastSearchQuery = searchTerm;
            lastSearchDomain = domain;
            lastSearchResult = {
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
  function searchCookieAllDomains(cookieName, currentDomain, currentUrl) {
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
        lastNotFoundTerm = cookieName;
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
            lastSearchQuery = searchTerm;
            lastSearchDomain = currentDomain;
            lastSearchResult = {
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
            lastSearchQuery = searchTerm;
            lastSearchDomain = currentDomain;
            lastSearchResult = {
              content: "", // Empty content since we only show toast
              type: "not-found",
            };
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

  // Global toast notification function
  function showToast(message, type = "info", duration = 3000) {
    const toastContainer = document.getElementById("toast-container");

    // Create toast element
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    // Add to container
    toastContainer.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
      toast.classList.add("show");
    }, 10);

    // Auto-remove after duration
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  // Function to copy site cookie name to clipboard
  function copySiteCookieNameToClipboard(cookieName, cookieItem) {
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
  function copySiteCookieValueToClipboard(cookieValue, cookieItem) {
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

  // Legacy functions removed - now using global toast system

  // Function to clear search results
  function clearSearchResult() {
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
  function removeSearchResultItem(cookieName, cookieDomain, cookiePath) {
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
  function hasSearchResults() {
    const searchResult = document.getElementById("search-result");
    const resultItems = searchResult.querySelectorAll(".search-result-item");
    return resultItems.length > 0;
  }

  // Function to show search results
  function showSearchResult(message, type) {
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
    // debugLog(`Search result: ${type} - ${message}`, "info"); // Removed to avoid console clutter

    // Keep search timeout only for "searching" status as fallback
    if (type === "searching") {
      searchResult.hideTimer = setTimeout(() => {
        showToast("Search timed out", "error");
        clearSearchResult();
      }, 10000);
    }
  }

  // Function to automatically sync cookie states (optimized)
  function autoSyncCookieStates() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0] || !tabs[0].url) {
        debugLog("No active tab for auto-sync", "info");
        return;
      }

      try {
        const urlObj = new URL(tabs[0].url);
        const domain = urlObj.hostname;

        // Get saved cookies from storage
        chrome.storage.local.get(["savedCookies"], function (result) {
          const savedCookies = result.savedCookies || [];

          if (savedCookies.length === 0) {
            return;
          }

          // OPTIMIZATION: Single API call for all domain cookies
          chrome.cookies.getAll({ domain }, function (browserCookies) {
            if (chrome.runtime.lastError) {
              debugLog(
                `Auto-sync error: ${chrome.runtime.lastError.message}`,
                "error"
              );
              return;
            }

            // Create Map for fast lookup (O(1) instead of O(n))
            const browserCookiesMap = new Map();
            browserCookies.forEach((cookie) => {
              const key = `${cookie.name}:${cookie.domain}:${cookie.path}`;
              browserCookiesMap.set(key, cookie);
            });

            // Check each saved cookie
            savedCookies.forEach((savedCookie) => {
              // First check if cookie can be applied to current domain
              const canApply = canApplyCookieToCurrentDomain(
                savedCookie,
                domain
              );

              if (!canApply) {
                // Disable button for domain mismatch
                updateToggleButtonState(savedCookie.id, false, true); // true = disabled
              } else {
                // Check if cookie exists and update normally
                const exists = checkCookieInMap(
                  savedCookie,
                  browserCookiesMap,
                  domain
                );
                updateToggleButtonState(savedCookie.id, exists, false); // false = enabled
              }
            });

            debugLog(
              `Auto-synced ${savedCookies.length} cookies with 1 API call`,
              "info"
            );
          });
        });
      } catch (e) {
        debugLog(`Auto-sync URL error: ${e.message}`, "error");
      }
    });
  }

  // Optimized cookie existence check through Map
  function checkCookieInMap(savedCookie, browserCookiesMap, currentDomain) {
    const cookieName = savedCookie.name;
    const targetDomain = savedCookie.isGlobal
      ? currentDomain
      : savedCookie.domain;
    const cookiePath = savedCookie.path || "/";

    // Try different key variants
    const possibleKeys = [
      `${cookieName}:${targetDomain}:${cookiePath}`,
      `${cookieName}:.${targetDomain}:${cookiePath}`,
      `${cookieName}:${targetDomain}:/`,
      `${cookieName}:.${targetDomain}:/`,
    ];

    // Check if cookie exists with any of the possible keys
    return possibleKeys.some((key) => browserCookiesMap.has(key));
  }

  // Function to update toggle button visual state
  function updateToggleButtonState(cookieId, exists, disabled = false) {
    const cookieItem = document.querySelector(
      `.cookie-item[data-id="${cookieId}"]`
    );
    if (!cookieItem) {
      debugLog(`Cookie item not found for ID: ${cookieId}`, "error");
      return;
    }

    const toggleBtn = cookieItem.querySelector(".toggle-btn-full");
    if (!toggleBtn) {
      debugLog(`Toggle button not found for cookie ID: ${cookieId}`, "error");
      return;
    }

    debugLog(
      `Updating button state for cookie ${cookieId}: exists=${exists}, disabled=${disabled}`,
      "info"
    );

    if (disabled) {
      // Domain mismatch - disable button
      toggleBtn.disabled = true;
      toggleBtn.textContent = "Domain Mismatch";
      toggleBtn.classList.add("disabled");
      toggleBtn.classList.remove("cookie-exists", "cookie-missing");
      toggleBtn.title = "Cannot apply this cookie to current domain";
    } else if (exists) {
      // Cookie exists - show as "Remove" button (can remove)
      toggleBtn.disabled = false;
      toggleBtn.textContent = "Remove";
      toggleBtn.classList.add("cookie-exists");
      toggleBtn.classList.remove("cookie-missing", "disabled");
      toggleBtn.title = "Remove cookie from current site";
    } else {
      // Cookie doesn't exist - show as "Add" button (can add)
      toggleBtn.disabled = false;
      toggleBtn.textContent = "Add";
      toggleBtn.classList.add("cookie-missing");
      toggleBtn.classList.remove("cookie-exists", "disabled");
      toggleBtn.title = "Add cookie to current site";
    }
  }

  // Function to check if cookie can be applied to current domain
  function canApplyCookieToCurrentDomain(cookie, currentDomain) {
    // Global cookies can always be applied
    if (cookie.isGlobal) {
      return true;
    }

    // Check exact domain match
    if (cookie.domain === currentDomain) {
      return true;
    }

    // Check subdomain match (if cookie domain starts with a dot)
    if (
      cookie.domain.startsWith(".") &&
      currentDomain.endsWith(cookie.domain.substring(1))
    ) {
      return true;
    }

    return false;
  }

  // Function to update toggle button state with domain check
  function updateToggleButtonWithDomainCheck(cookieId) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0] || !tabs[0].url) {
        return;
      }

      try {
        const urlObj = new URL(tabs[0].url);
        const currentDomain = urlObj.hostname;

        // Get cookie data
        chrome.storage.local.get(["savedCookies"], function (result) {
          const savedCookies = result.savedCookies || [];
          const cookie = savedCookies.find((c) => c.id === cookieId);

          if (!cookie) {
            return;
          }

          const cookieItem = document.querySelector(
            `.cookie-item[data-id="${cookieId}"]`
          );
          if (!cookieItem) {
            return;
          }

          const toggleBtn = cookieItem.querySelector(".toggle-btn-full");
          if (!toggleBtn) {
            return;
          }

          // Check if cookie can be applied to current domain
          const canApply = canApplyCookieToCurrentDomain(cookie, currentDomain);

          if (!canApply) {
            // Disable button if domain doesn't match
            toggleBtn.disabled = true;
            toggleBtn.textContent = "Domain Mismatch";
            toggleBtn.classList.add("disabled");
            toggleBtn.classList.remove("cookie-exists", "cookie-missing");
            toggleBtn.title = `Cannot apply this cookie to ${currentDomain}. Cookie is for ${cookie.domain}.`;
          } else {
            // Enable button and continue with normal sync
            toggleBtn.disabled = false;
            toggleBtn.classList.remove("disabled");
            // Let normal auto-sync handle the state
            autoSyncCookieStates();
          }
        });
      } catch (e) {
        debugLog(`Error in domain check: ${e.message}`, "error");
      }
    });
  }

  // Export cookies functionality
  exportCookiesBtn.addEventListener("click", function () {
    exportSavedCookies();
  });

  // Import cookies functionality
  importCookiesBtn.addEventListener("click", function () {
    importFileInput.click();
  });

  // Handle file input change
  importFileInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      importSavedCookies(file);
    }
  });

  // Export saved cookies to JSON file
  function exportSavedCookies() {
    chrome.storage.local.get(["savedCookies"], function (result) {
      if (chrome.runtime.lastError) {
        showToast(
          `❌ Error reading cookies: ${chrome.runtime.lastError.message}`,
          "error"
        );
        return;
      }

      const savedCookies = result.savedCookies || [];

      if (savedCookies.length === 0) {
        showToast("No saved cookies to export", "info");
        return;
      }

      // Decrypt cookies for export (user-friendly format)
      const decryptedCookies = savedCookies.map((cookie) => {
        try {
          return cookie.isEncrypted
            ? encryptionHelpers.decryptCookieValues(cookie)
            : cookie;
        } catch (error) {
          debugLog(
            `Failed to decrypt cookie for export: ${error.message}`,
            "error"
          );
          // Return unencrypted version if decryption fails
          return { ...cookie, isEncrypted: false };
        }
      });

      // Create export data with metadata
      const exportData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        cookieCount: decryptedCookies.length,
        cookies: decryptedCookies,
      };

      // Create JSON blob
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cookies-export-${
        new Date().toISOString().split("T")[0]
      }.json`;

      // Trigger download
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up object URL
      URL.revokeObjectURL(url);

      showToast(`✓ Exported ${savedCookies.length} cookies`, "success");
      debugLog(`Exported ${savedCookies.length} cookies to file`, "info");
    });
  }

  // Import cookies from JSON file
  function importSavedCookies(file) {
    if (!file) {
      showToast("❌ No file selected", "error");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".json")) {
      showToast("❌ Please select a JSON file", "error");
      return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const importData = JSON.parse(e.target.result);

        // Validate import data structure
        if (!importData || typeof importData !== "object") {
          throw new Error("Invalid file structure");
        }

        if (!importData.cookies || !Array.isArray(importData.cookies)) {
          throw new Error("No valid cookies array found");
        }

        const importedCookies = importData.cookies;

        if (importedCookies.length === 0) {
          showToast("No cookies found in file", "info");
          return;
        }

        // Validate each cookie has required fields and valid data
        const invalidCookies = [];
        for (let i = 0; i < importedCookies.length; i++) {
          const cookie = importedCookies[i];
          const errors = [];

          // Check required fields
          if (!cookie.id || typeof cookie.id !== "string") {
            errors.push("missing or invalid id");
          }
          if (
            !cookie.name ||
            typeof cookie.name !== "string" ||
            cookie.name.trim() === ""
          ) {
            errors.push("missing or invalid name");
          }
          if (cookie.value === undefined || typeof cookie.value !== "string") {
            errors.push("missing or invalid value");
          }

          // Check path format if present
          if (cookie.path && typeof cookie.path === "string") {
            // Path should start with / and not be a full URL
            if (
              cookie.path.includes("://") ||
              (!cookie.path.startsWith("/") && cookie.path !== "")
            ) {
              errors.push(
                `invalid path format: "${cookie.path}" (should be like "/" or "/path", not URL)`
              );
            }
          }

          // Check domain format if present
          if (cookie.domain && typeof cookie.domain === "string") {
            // Domain should not include protocol
            if (cookie.domain.includes("://")) {
              errors.push(
                `invalid domain format: "${cookie.domain}" (should be like "example.com", not URL)`
              );
            }
          }

          if (errors.length > 0) {
            invalidCookies.push(
              `Cookie ${i + 1} (${cookie.name || "unnamed"}): ${errors.join(
                ", "
              )}`
            );
          }
        }

        if (invalidCookies.length > 0) {
          throw new Error(
            `Invalid cookie data found:\n${invalidCookies.join("\n")}`
          );
        }

        // Force fresh read from storage to get current state
        chrome.storage.local.get(["savedCookies"], function (result) {
          if (chrome.runtime.lastError) {
            showToast(
              `❌ Error reading existing cookies: ${chrome.runtime.lastError.message}`,
              "error"
            );
            importFileInput.value = "";
            return;
          }

          const existingCookies = result.savedCookies || [];
          debugLog(
            `Current saved cookies count: ${existingCookies.length}`,
            "info"
          );
          const existingNames = new Set(existingCookies.map((c) => c.name));
          debugLog(
            `Existing cookie names: ${Array.from(existingNames).join(", ")}`,
            "info"
          );

          // Filter out cookies that already exist (by name)
          const duplicates = importedCookies.filter((cookie) =>
            existingNames.has(cookie.name)
          );
          const newCookies = importedCookies.filter(
            (cookie) => !existingNames.has(cookie.name)
          );

          if (newCookies.length === 0) {
            const duplicateNames = duplicates.map((c) => c.name).join(", ");
            showToast(
              `All cookies already exist (by name): ${duplicateNames} - no new cookies imported`,
              "info"
            );
            // Clear file input even when no new cookies to import
            importFileInput.value = "";
            return;
          }

          // Generate new IDs for imported cookies, set defaults, and encrypt them
          const cookiesWithNewIds = newCookies.map((cookie) => {
            const cookieWithId = {
              ...cookie,
              id:
                Date.now().toString() + Math.random().toString(36).substr(2, 9),
              isEncrypted: false, // Imported cookies are in plain text
              // Set default values for missing fields
              expirationDays: cookie.expirationDays || 30,
              domain: cookie.domain || null,
              path: cookie.path || "/",
              isGlobal: cookie.isGlobal !== undefined ? cookie.isGlobal : true,
            };

            // Encrypt the cookie for storage
            try {
              return encryptionHelpers.encryptCookieValues(cookieWithId);
            } catch (error) {
              debugLog(
                `Failed to encrypt imported cookie: ${error.message}`,
                "error"
              );
              return cookieWithId; // Return unencrypted if encryption fails
            }
          });

          // Merge new cookies with existing ones
          const mergedCookies = [...existingCookies, ...cookiesWithNewIds];

          // Save merged cookies
          chrome.storage.local.set(
            { savedCookies: mergedCookies },
            function () {
              if (chrome.runtime.lastError) {
                showToast(
                  `❌ Error saving cookies: ${chrome.runtime.lastError.message}`,
                  "error"
                );
                return;
              }

              // Clear file input to allow reimporting same file
              importFileInput.value = "";

              // Reload the saved cookies display
              loadSavedCookies();

              const skippedCount = importedCookies.length - newCookies.length;
              let message = `✓ Imported ${newCookies.length} cookies`;
              if (skippedCount > 0) {
                const skippedNames = duplicates.map((c) => c.name).join(", ");
                message += ` (${skippedCount} skipped - already exist: ${skippedNames})`;
              }

              showToast(message, "success");
              debugLog(
                `Imported ${newCookies.length} new cookies, skipped ${skippedCount} existing`,
                "info"
              );
            }
          );
        });
      } catch (error) {
        showToast(`❌ Error reading file: ${error.message}`, "error");
        debugLog(`Import error: ${error.message}`, "error");
      }
    };

    reader.onerror = function () {
      showToast("❌ Error reading file", "error");
    };

    reader.readAsText(file);
  }

  // Function to edit cookie value
  function editCookieValue(cookieId) {
    // Get cookie from storage
    chrome.storage.local.get(["savedCookies"], function (result) {
      let savedCookies = result.savedCookies || [];

      // Find the cookie to edit
      const cookieIndex = savedCookies.findIndex(
        (cookie) => cookie.id === cookieId
      );
      if (cookieIndex === -1) {
        showToast("Cookie not found", "error");
        return;
      }

      const cookie = savedCookies[cookieIndex];

      // Decrypt cookie if encrypted
      const decryptedCookie = cookie.isEncrypted
        ? encryptionHelpers.decryptCookieValues(cookie)
        : cookie;

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
            <label for="edit-cookie-name"><strong>Name:</strong></label>
            <input type="text" id="edit-cookie-name" placeholder="Cookie name">
            <label for="edit-cookie-value"><strong>Value:</strong></label>
            <textarea id="edit-cookie-value" rows="4" placeholder="Enter cookie value..."></textarea>
          </div>
          <div class="edit-modal-footer">
            <button id="save-cookie-edit" class="edit-save-btn">Save</button>
            <button id="cancel-cookie-edit" class="edit-cancel-btn">Cancel</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Set values safely using properties instead of innerHTML
      const nameInput = modal.querySelector("#edit-cookie-name");
      const textarea = modal.querySelector("#edit-cookie-value");
      nameInput.value = decryptedCookie.name;
      textarea.value = decryptedCookie.value;
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
        .querySelector("#cancel-cookie-edit")
        .addEventListener("click", closeModal);

      // Click outside to close
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          closeModal();
        }
      });

      // Save handler
      modal.querySelector("#save-cookie-edit").addEventListener("click", () => {
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

        // Debug logging
        console.log("Before update:", {
          originalName: decryptedCookie.name,
          originalValue: decryptedCookie.value,
          newName,
          newValue,
          isEncrypted: savedCookies[cookieIndex].isEncrypted,
        });

        // Store original decrypted name (what's actually in browser)
        const originalBrowserName = decryptedCookie.name;

        // First decrypt the cookie completely, then update values, then re-encrypt
        let updatedCookie = savedCookies[cookieIndex].isEncrypted
          ? encryptionHelpers.decryptCookieValues(savedCookies[cookieIndex])
          : { ...savedCookies[cookieIndex] };

        // Update the decrypted cookie
        updatedCookie.name = newName;
        updatedCookie.value = newValue;

        console.log("After decryption and update:", {
          name: updatedCookie.name,
          value: updatedCookie.value,
          isEncrypted: updatedCookie.isEncrypted,
        });

        // Re-encrypt if the original was encrypted
        if (savedCookies[cookieIndex].isEncrypted) {
          updatedCookie = encryptionHelpers.encryptCookieValues(updatedCookie);
          console.log("After re-encryption:", {
            name: updatedCookie.name,
            value: updatedCookie.value,
            isEncrypted: updatedCookie.isEncrypted,
          });
        }

        // Replace the cookie in the array
        savedCookies[cookieIndex] = updatedCookie;

        // Save to storage
        chrome.storage.local.set({ savedCookies }, () => {
          if (chrome.runtime.lastError) {
            showToast("Failed to save cookie", "error");
            return;
          }
          const nameChanged = newName !== decryptedCookie.name;

          // Check if cookie exists in browser and update only if it does
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              const currentUrl = new URL(tabs[0].url);
              const currentDomain = currentUrl.hostname;

              // Check if this cookie should be active on current domain
              const finalCookie = savedCookies[cookieIndex];
              const shouldCheckBrowserCookie =
                finalCookie.isGlobal ||
                (finalCookie.domain &&
                  (currentDomain === finalCookie.domain ||
                    currentDomain.endsWith(
                      "." + finalCookie.domain.replace(/^\./, "")
                    )));

              if (shouldCheckBrowserCookie) {
                // Check if the original saved cookie exists in browser
                const checkUrl = `https://${
                  finalCookie.domain || currentDomain
                }${finalCookie.path || "/"}`;

                console.log("Checking for existing cookie:", {
                  originalBrowserName,
                  decryptedName: decryptedCookie.name,
                  newName,
                  checkUrl,
                  nameChanged,
                });

                chrome.cookies.get(
                  {
                    name: originalBrowserName, // Use original decrypted name (what's in browser)
                    url: checkUrl,
                  },
                  (existingCookie) => {
                    console.log("Existing cookie found:", existingCookie);
                    // Only update browser cookie if it already exists
                    if (existingCookie) {
                      // Always remove old cookie first, then create new one
                      // This is more reliable than trying to update in place
                      chrome.cookies.remove(
                        {
                          name: originalBrowserName,
                          url: checkUrl,
                        },
                        () => {
                          console.log("Removed old cookie, creating new one");
                          // Create new cookie with updated data
                          const setUrl = `https://${
                            finalCookie.domain || currentDomain
                          }${finalCookie.path || "/"}`;
                          const cookieDetails = {
                            name: newName,
                            value: newValue,
                            domain: finalCookie.domain || currentDomain,
                            path: finalCookie.path || "/",
                            url: setUrl,
                          };

                          if (finalCookie.expirationDays) {
                            cookieDetails.expirationDate =
                              Math.floor(Date.now() / 1000) +
                              finalCookie.expirationDays * 24 * 60 * 60;
                          }

                          chrome.cookies.set(cookieDetails, (result) => {
                            console.log("New cookie created:", result);
                          });
                        }
                      );
                    }
                    // If cookie doesn't exist in browser, don't add it - just update saved data
                  }
                );
              }
            }
          });

          if (nameChanged) {
            showToast(
              `Cookie renamed to "${newName}" and updated successfully`,
              "success"
            );
          } else {
            showToast("Cookie updated successfully", "success");
          }

          // Refresh the cookie list
          loadSavedCookies();

          // Close modal
          closeModal();
        });
      });

      // Enter key to save
      textarea.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && e.ctrlKey) {
          modal.querySelector("#save-cookie-edit").click();
        }
      });
    });
  }

  // Function to edit a searched cookie
  function editSearchedCookie(
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
  function updateSearchResultCookieValue(
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
  function updateSearchResultCookieName(
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
            lastSearchQuery = null;
            lastSearchDomain = null;
            lastSearchResult = null;

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

  // Function to remove cookie item from site cookies display
  function removeSiteCookieItem(cookieName, cookieDomain, cookiePath) {
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

  // Function to update cookie name and value in site cookies display
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
});
