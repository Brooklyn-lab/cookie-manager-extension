import { encryptionHelpers, validateCookieName, validateCookieValue, showSensitiveDomainWarning } from "../utils.js";
import { state } from "./state.js";
import { showToast, debugLog, breakLongString, formatCookieValue, scrollAccordionIntoView, showStatus, scrollAddCookieAccordionIntoView, clearFormValidation } from "./ui.js";
import { initializeDragAndDrop, updateDraggableState } from "./dnd.js";

// Internal helper — copy cookie value to clipboard
function copyCookieValueToClipboard(cookieValue) {
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
    fallbackCopyValueToClipboard(cookieValue);
  }
}

// Internal helper — fallback for copying cookie value
function fallbackCopyValueToClipboard(cookieValue) {
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

export function saveCookie(name, value, domain, path, expirationDays, isGlobal, options = {}) {
  const cookieConfig = {
    name,
    value,
    domain,
    path,
    expirationDays,
    isGlobal,
    sameSite: options.sameSite || "unspecified",
    secure: options.secure || false,
    httpOnly: options.httpOnly || false,
    id: Date.now().toString(),
  };

  debugLog(`Saving cookie: ${JSON.stringify(cookieConfig)}`, "info");

  const targetDomain = isGlobal ? "global" : domain;
  const action = "save";

  showSensitiveDomainWarning(targetDomain, action)
    .then(() => {
      chrome.storage.local.get(["savedCookies"], function (result) {
        const savedCookies = result.savedCookies || [];

        debugLog(`Current saved cookies: ${savedCookies.length}`, "info");

        const existingIndex = savedCookies.findIndex((cookie) => {
          if (isGlobal || cookie.isGlobal) {
            return cookie.name === name;
          } else {
            return cookie.name === name && cookie.domain === domain;
          }
        });

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

          setCookie(cookieConfig);

          state.isAddCookieJustUsed = true;

          document.getElementById("cookieName").value = "";
          document.getElementById("cookieValue").value = "";
          document.getElementById("cookieDomain").value = "";
          document.getElementById("cookiePath").value = "/";
          document.getElementById("cookieExpiration").value = "30";
          document.getElementById("cookieSameSite").value = "unspecified";
          document.getElementById("cookieSecure").checked = false;
          document.getElementById("cookieHttpOnly").checked = false;
          document.getElementById("isGlobalCookie").checked = true;
          document.getElementById("cookieDomain").disabled = true;
          document.getElementById("cookieDomain").placeholder = "Global cookie (any domain)";

          clearFormValidation();

          const accordion = document.querySelector(".accordion");
          const form = accordion.querySelector(".add-cookie-form");
          form.style.opacity = "0";

          setTimeout(function () {
            accordion.classList.remove("active");

            loadSavedCookies();

            setTimeout(function () {
              state.isAddCookieJustUsed = false;
            }, 500);
          }, 100);
        });
      });
    })
    .catch((error) => {
      debugLog(`Cookie save cancelled: ${error.message}`, "info");
    });
}

export function loadSavedCookies() {
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

    const cookiesList = document.getElementById("cookiesList");

    while (cookiesList.firstChild) {
      cookiesList.removeChild(cookiesList.firstChild);
    }

    if (savedCookies.length === 0) {
      const noCookiesElement = document.createElement("div");
      noCookiesElement.className = "no-cookies-message";
      noCookiesElement.textContent = "No saved cookies yet";
      cookiesList.appendChild(noCookiesElement);

      const savedCookiesAccordion = document.querySelector(".saved-cookies-accordion");
      if (savedCookiesAccordion.classList.contains("active")) {
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

      const accordion = document.querySelector(".accordion");
      if (!accordion.classList.contains("active")) {
        accordion.classList.add("active");
        const form = accordion.querySelector(".add-cookie-form");
        form.style.opacity = "0";

        setTimeout(function () {
          form.style.opacity = "1";
          const nameInput = form.querySelector("#cookieName");
          if (nameInput) {
            nameInput.focus();
          }
        }, 50);

        scrollAddCookieAccordionIntoView();
      }

      return;
    }

    const savedCookiesAccordion = document.querySelector(".saved-cookies-accordion");
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

      scrollAccordionIntoView(savedCookiesAccordion);
    }

    const accordion = document.querySelector(".accordion");
    if (accordion.classList.contains("active") && !state.isAddCookieJustUsed) {
      const content = accordion.querySelector(".accordion-content");
      const form = content.querySelector(".add-cookie-form");
      form.style.opacity = "0";

      setTimeout(function () {
        accordion.classList.remove("active");
      }, 100);
    }

    savedCookies.forEach(function (cookie) {
      const cookieItem = createCookieElement(cookie);
      cookiesList.appendChild(cookieItem);
    });

    setTimeout(() => {
      autoSyncCookieStates();
    }, 100);

    if (savedCookies.length > 1) {
      setTimeout(() => {
        initializeDragAndDrop();
      }, 150);
    }

    updateDraggableState(savedCookies.length);

    document.dispatchEvent(new CustomEvent("cookies-rendered"));
  });
}

export function createCookieElement(cookie) {
  let decryptedCookie;
  try {
    decryptedCookie = cookie.isEncrypted
      ? encryptionHelpers.decryptCookieValues(cookie)
      : cookie;
  } catch (error) {
    debugLog(`Failed to decrypt cookie: ${error.message}`, "error");
    decryptedCookie = { ...cookie, isEncrypted: false };
  }

  const cookieItem = document.createElement("div");
  cookieItem.className = "cookie-item";
  cookieItem.dataset.id = decryptedCookie.id;

  const dragHandle = document.createElement("div");
  dragHandle.className = "drag-handle";
  dragHandle.innerHTML = "⋮⋮";
  dragHandle.title = "Drag to reorder";

  const editBtn = document.createElement("button");
  editBtn.className = "cookie-edit-btn-icon";
  editBtn.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#007bff"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';
  editBtn.title = "Edit cookie value";
  editBtn.addEventListener("click", function () {
    debugLog(`Editing cookie: ${decryptedCookie.name}`, "info");
    editCookieValue(decryptedCookie.id);
  });

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
  cookieName.textContent = breakLongString(decryptedCookie.name);
  cookieName.title = "Click to copy cookie name";
  cookieName.addEventListener("click", function () {
    copyCookieNameToClipboard(decryptedCookie.name, cookieItem);
  });

  const cookieDetails = document.createElement("div");
  cookieDetails.className = "cookie-details";

  const pathInfo = decryptedCookie.path || "/";
  const expirationInfo = decryptedCookie.expirationDays
    ? `${decryptedCookie.expirationDays}d`
    : "30d";

  const valueSpan = document.createElement("span");
  valueSpan.className = "clickable-value";
  valueSpan.title = "Click to copy value";
  valueSpan.textContent = breakLongString(formatCookieValue(decryptedCookie.value));

  const sameSiteVal = decryptedCookie.sameSite || "unspecified";
  const sameSiteLabel = { no_restriction: "None", lax: "Lax", strict: "Strict", unspecified: "Unspec." }[sameSiteVal] || sameSiteVal;
  const sameSiteCssClass = { no_restriction: "samesite-none", lax: "samesite-lax", strict: "samesite-strict", unspecified: "samesite-unspecified" }[sameSiteVal] || "samesite-unspecified";

  const flagsParts = [];
  if (decryptedCookie.secure) flagsParts.push("Secure");
  if (decryptedCookie.httpOnly) flagsParts.push("HttpOnly");
  const flagsStr = flagsParts.length > 0 ? ` | ${flagsParts.join(", ")}` : "";

  const sameSiteBadge = `<span class="samesite-badge ${sameSiteCssClass}">${sameSiteLabel}</span>`;

  if (decryptedCookie.isGlobal) {
    cookieDetails.innerHTML = `Global | Path: ${pathInfo} | Expires: ${expirationInfo} | ${sameSiteBadge}${flagsStr}<br>Value: `;
    cookieDetails.appendChild(valueSpan);
  } else {
    cookieDetails.innerHTML = `${decryptedCookie.domain} | Path: ${pathInfo} | Expires: ${expirationInfo} | ${sameSiteBadge}${flagsStr}<br>Value: `;
    cookieDetails.appendChild(valueSpan);
  }

  valueSpan.addEventListener("click", function () {
    copyCookieValueToClipboard(decryptedCookie.value);
  });

  cookieInfo.appendChild(cookieName);
  cookieInfo.appendChild(cookieDetails);

  const toggleBtn = document.createElement("button");
  toggleBtn.className = "toggle-btn-full";
  toggleBtn.textContent = "Add/Remove";
  toggleBtn.title = "Add/remove cookie on current site";
  toggleBtn.addEventListener("click", function () {
    debugLog(`Toggling cookie: ${decryptedCookie.name}`, "info");
    toggleCookie(decryptedCookie.id);
  });

  const groupBadge = document.createElement("span");
  groupBadge.className = "cookie-group-badge";
  groupBadge.dataset.cookieId = decryptedCookie.id;
  groupBadge.title = "Click to assign group";

  cookieItem.appendChild(editBtn);
  cookieItem.appendChild(deleteBtn);
  cookieItem.appendChild(cookieInfo);
  cookieItem.appendChild(groupBadge);
  cookieItem.appendChild(toggleBtn);

  const statusMessage = document.createElement("div");
  statusMessage.className = "cookie-status-message";
  statusMessage.id = `status-${decryptedCookie.id}`;
  cookieItem.appendChild(statusMessage);

  cookieItem.appendChild(dragHandle);

  return cookieItem;
}

export function copyCookieNameToClipboard(cookieName, cookieItem) {
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
    fallbackCopyNameToClipboard(cookieName, cookieItem);
  }
}

export function fallbackCopyNameToClipboard(cookieName, cookieItem) {
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

export function copyCookieToClipboard(cookie, cookieItem) {
  const formats = {
    javascript: `document.cookie = "${cookie.name}=${cookie.value}; path=${
      cookie.path || "/"
    }${
      cookie.domain && !cookie.isGlobal ? `; domain=${cookie.domain}` : ""
    }";`,

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

    simple: `${cookie.name}=${cookie.value}`,

    curl: `--cookie "${cookie.name}=${cookie.value}"`,

    detailed: `Name: ${cookie.name}
Value: ${cookie.value}
Domain: ${cookie.isGlobal ? "Global (any domain)" : cookie.domain}
Path: ${cookie.path || "/"}
Type: ${cookie.isGlobal ? "Global Cookie" : "Domain-specific Cookie"}`,
  };

  const textToCopy = formats.detailed;

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
    fallbackCopyToClipboard(textToCopy, cookie, cookieItem);
  }
}

export function fallbackCopyToClipboard(text, cookie, cookieItem) {
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

export function toggleCookie(cookieId) {
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

      const cookieItem = document.querySelector(
        `.cookie-item[data-id="${cookieId}"]`
      );

      const decryptedCookie = cookie.isEncrypted
        ? encryptionHelpers.decryptCookieValues(cookie)
        : cookie;

      debugLog(`Toggling cookie: ${JSON.stringify(decryptedCookie)}`, "info");

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

            const cookieDomain = decryptedCookie.isGlobal
              ? domain
              : decryptedCookie.domain;
            const cookiePath = decryptedCookie.path || "/";

            debugLog(
              `Using domain for cookie operation: ${cookieDomain}`,
              "info"
            );

            const targetDomain = decryptedCookie.isGlobal
              ? domain
              : decryptedCookie.domain;
            const action = "modify";

            showSensitiveDomainWarning(targetDomain, action)
              .then(() => {
                const isSecure = decryptedCookie.secure ||
                  decryptedCookie.sameSite === "no_restriction";
                const protocol =
                  cookieDomain.startsWith(".") || isSecure
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

                    if (cookieExists) {
                      removeCookieFromCurrentTab(decryptedCookie, tabs[0]);
                      showToast(
                        `Cookie "${decryptedCookie.name}" removed from ${cookieDomain}`,
                        "error"
                      );
                    } else {
                      setCookieForCurrentTab(decryptedCookie, tabs[0]);
                    }

                    setTimeout(() => {
                      autoSyncCookieStates();
                    }, 200);
                  }
                );
              })
              .catch((error) => {
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

export function deleteCookie(cookieId) {
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
      const cookieName = cookie.name;

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
      });

      setTimeout(() => {
        autoSyncCookieStates();
      }, 200);
    } else {
      debugLog(`Cookie with ID ${cookieId} not found`, "error");
    }
  });
}

export function setCookieForCurrentTab(cookie, tab) {
  try {
    const urlObj = new URL(tab.url);
    const domain = urlObj.hostname;

    const cookieForTab = { ...cookie };

    if (cookie.isGlobal) {
      cookieForTab.domain = domain;
    }

    setCookie(cookieForTab);
  } catch (e) {
    debugLog(`Error processing tab URL: ${e.message}`, "error");
  }
}

export function removeCookieFromCurrentTab(cookie, tab) {
  try {
    const urlObj = new URL(tab.url);
    const domain = urlObj.hostname;

    const cookieForTab = { ...cookie };

    if (cookie.isGlobal) {
      cookieForTab.domain = domain;
    }

    removeCookie(cookieForTab);
  } catch (e) {
    debugLog(`Error processing tab URL: ${e.message}`, "error");
  }
}

export function setCookie(cookie) {
  const decryptedCookie = cookie.isEncrypted
    ? encryptionHelpers.decryptCookieValues(cookie)
    : cookie;

  const expirationDate = new Date();
  expirationDate.setDate(
    expirationDate.getDate() + decryptedCookie.expirationDays
  );

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
          showStatus(`Error setting cookie: ${e.message}`, "error");
        }
      }
    });
    return;
  }

  completeCookieSet(domain);

  function completeCookieSet(domain) {
    let protocol = "http";
    let urlDomain = domain;

    if (domain && domain.startsWith(".")) {
      protocol = "https";
      urlDomain = domain.substring(1);
    }

    const sameSite = decryptedCookie.sameSite || "unspecified";
    const isSecure = decryptedCookie.secure || sameSite === "no_restriction" || false;
    const isHttpOnly = decryptedCookie.httpOnly || false;

    if (isSecure && protocol === "http") {
      protocol = "https";
      urlDomain = domain && domain.startsWith(".") ? domain.substring(1) : domain;
    }

    const cookieDetails = {
      url: `${protocol}://${urlDomain}${decryptedCookie.path || "/"}`,
      name: decryptedCookie.name,
      value: decryptedCookie.value,
      path: decryptedCookie.path || "/",
      domain: domain && domain.startsWith(".") ? domain : null,
      secure: isSecure,
      httpOnly: isHttpOnly,
      sameSite: sameSite,
      expirationDate: Math.floor(expirationDate.getTime() / 1000),
    };

    debugLog(
      `Setting cookie with details: ${JSON.stringify(cookieDetails)}`,
      "info"
    );

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

        setTimeout(() => {
          autoSyncCookieStates();
        }, 300);
      } else {
        debugLog(`Cookie not set - no result returned`, "error");
        showToast(
          `❌ Cookie "${decryptedCookie.name}" could not be set. Check path and domain restrictions.`,
          "error"
        );
      }
    });
  }
}

export function removeCookie(cookie) {
  const decryptedCookie = cookie.isEncrypted
    ? encryptionHelpers.decryptCookieValues(cookie)
    : cookie;

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
    let protocol = "http";
    let urlDomain = domain;

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
        }
      } else {
        debugLog(
          `Cookie successfully removed from page: ${
            result ? JSON.stringify(result) : "no result"
          }`,
          "info"
        );
      }
    });
  }
}

export function autoSyncCookieStates() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs[0] || !tabs[0].url) {
      debugLog("No active tab for auto-sync", "info");
      return;
    }

    try {
      const urlObj = new URL(tabs[0].url);
      const domain = urlObj.hostname;
      const tabUrl = tabs[0].url;

      chrome.storage.local.get(["savedCookies"], function (result) {
        const savedCookies = result.savedCookies || [];

        if (savedCookies.length === 0) {
          return;
        }

        chrome.cookies.getAll({ url: tabUrl }, function (browserCookies) {
          if (chrome.runtime.lastError) {
            debugLog(
              `Auto-sync error: ${chrome.runtime.lastError.message}`,
              "error"
            );
            return;
          }

          const browserCookiesMap = new Map();
          browserCookies.forEach((cookie) => {
            const key = `${cookie.name}:${cookie.domain}:${cookie.path}`;
            browserCookiesMap.set(key, cookie);
          });

          const sameDomainCookies = [];
          const crossDomainCookies = [];

          savedCookies.forEach((savedCookie) => {
            const canApply = canApplyCookieToCurrentDomain(
              savedCookie,
              domain
            );
            if (canApply) {
              sameDomainCookies.push(savedCookie);
            } else {
              crossDomainCookies.push(savedCookie);
            }
          });

          sameDomainCookies.forEach((savedCookie) => {
            const exists = checkCookieInMap(
              savedCookie,
              browserCookiesMap,
              domain
            );
            updateToggleButtonState(savedCookie.id, exists, false);
          });

          crossDomainCookies.forEach((savedCookie) => {
            checkCrossDomainCookieState(savedCookie);
          });

          debugLog(
            `Auto-synced ${sameDomainCookies.length} same-domain + ${crossDomainCookies.length} cross-domain cookies`,
            "info"
          );
        });
      });
    } catch (e) {
      debugLog(`Auto-sync URL error: ${e.message}`, "error");
    }
  });
}

export function checkCookieInMap(savedCookie, browserCookiesMap, currentDomain) {
  const cookieName = savedCookie.name;
  const targetDomain = savedCookie.isGlobal
    ? currentDomain
    : savedCookie.domain;
  const cookiePath = savedCookie.path || "/";

  const possibleKeys = [
    `${cookieName}:${targetDomain}:${cookiePath}`,
    `${cookieName}:.${targetDomain}:${cookiePath}`,
    `${cookieName}:${targetDomain}:/`,
    `${cookieName}:.${targetDomain}:/`,
  ];

  return possibleKeys.some((key) => browserCookiesMap.has(key));
}

/**
 * Check existence of a saved cookie on its own domain via chrome.cookies.get().
 * Used for non-global cookies whose domain differs from the active tab.
 */
export function checkCrossDomainCookieState(savedCookie) {
  const decrypted = savedCookie.isEncrypted
    ? encryptionHelpers.decryptCookieValues(savedCookie)
    : savedCookie;

  const cookieDomain = decrypted.domain;
  const cookiePath = decrypted.path || "/";
  let urlDomain = cookieDomain;
  if (cookieDomain.startsWith(".")) {
    urlDomain = cookieDomain.substring(1);
  }
  const url = `https://${urlDomain}${cookiePath}`;

  chrome.cookies.get({ url, name: decrypted.name }, function (result) {
    if (chrome.runtime.lastError) {
      debugLog(
        `Cross-domain check error for ${decrypted.name}: ${chrome.runtime.lastError.message}`,
        "error"
      );
      updateToggleButtonState(savedCookie.id, false, false);
      return;
    }
    updateToggleButtonState(savedCookie.id, !!result, false);
  });
}

export function updateToggleButtonState(cookieId, exists, disabled = false) {
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
    toggleBtn.disabled = true;
    toggleBtn.textContent = "Domain Mismatch";
    toggleBtn.classList.add("disabled");
    toggleBtn.classList.remove("cookie-exists", "cookie-missing");
    toggleBtn.title = "Cannot apply this cookie to current domain";
  } else if (exists) {
    toggleBtn.disabled = false;
    toggleBtn.textContent = "Remove";
    toggleBtn.classList.add("cookie-exists");
    toggleBtn.classList.remove("cookie-missing", "disabled");
    toggleBtn.title = "Remove cookie from current site";
  } else {
    toggleBtn.disabled = false;
    toggleBtn.textContent = "Add";
    toggleBtn.classList.add("cookie-missing");
    toggleBtn.classList.remove("cookie-exists", "disabled");
    toggleBtn.title = "Add cookie to current site";
  }
}

export function canApplyCookieToCurrentDomain(cookie, currentDomain) {
  if (cookie.isGlobal) {
    return true;
  }

  if (cookie.domain === currentDomain) {
    return true;
  }

  if (
    cookie.domain.startsWith(".") &&
    currentDomain.endsWith(cookie.domain.substring(1))
  ) {
    return true;
  }

  return false;
}

export function updateToggleButtonWithDomainCheck(cookieId) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs[0] || !tabs[0].url) {
      return;
    }

    try {
      const urlObj = new URL(tabs[0].url);
      const currentDomain = urlObj.hostname;

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

        const canApply = canApplyCookieToCurrentDomain(cookie, currentDomain);

        if (!canApply) {
          toggleBtn.disabled = true;
          toggleBtn.textContent = "Domain Mismatch";
          toggleBtn.classList.add("disabled");
          toggleBtn.classList.remove("cookie-exists", "cookie-missing");
          toggleBtn.title = `Cannot apply this cookie to ${currentDomain}. Cookie is for ${cookie.domain}.`;
        } else {
          toggleBtn.disabled = false;
          toggleBtn.classList.remove("disabled");
          autoSyncCookieStates();
        }
      });
    } catch (e) {
      debugLog(`Error in domain check: ${e.message}`, "error");
    }
  });
}

export function editCookieValue(cookieId) {
  chrome.storage.local.get(["savedCookies"], function (result) {
    let savedCookies = result.savedCookies || [];

    const cookieIndex = savedCookies.findIndex(
      (cookie) => cookie.id === cookieId
    );
    if (cookieIndex === -1) {
      showToast("Cookie not found", "error");
      return;
    }

    const cookie = savedCookies[cookieIndex];

    const decryptedCookie = cookie.isEncrypted
      ? encryptionHelpers.decryptCookieValues(cookie)
      : cookie;

    const currentSameSite = decryptedCookie.sameSite || "unspecified";
    const currentSecure = decryptedCookie.secure || false;
    const currentHttpOnly = decryptedCookie.httpOnly || false;

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
          <div class="form-row">
            <div class="form-group form-group-inline">
              <label for="edit-cookie-samesite"><strong>SameSite:</strong></label>
              <select id="edit-cookie-samesite">
                <option value="unspecified">Unspecified</option>
                <option value="lax">Lax</option>
                <option value="strict">Strict</option>
                <option value="no_restriction">None</option>
              </select>
            </div>
            <div class="form-group form-group-inline checkbox-group">
              <input type="checkbox" id="edit-cookie-secure">
              <label for="edit-cookie-secure">Secure</label>
            </div>
            <div class="form-group form-group-inline checkbox-group">
              <input type="checkbox" id="edit-cookie-httponly">
              <label for="edit-cookie-httponly">HttpOnly</label>
            </div>
          </div>
        </div>
        <div class="edit-modal-footer">
          <button id="save-cookie-edit" class="edit-save-btn">Save</button>
          <button id="cancel-cookie-edit" class="edit-cancel-btn">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const nameInput = modal.querySelector("#edit-cookie-name");
    const textarea = modal.querySelector("#edit-cookie-value");
    const sameSiteSelect = modal.querySelector("#edit-cookie-samesite");
    const secureCheckbox = modal.querySelector("#edit-cookie-secure");
    const httpOnlyCheckbox = modal.querySelector("#edit-cookie-httponly");

    nameInput.value = decryptedCookie.name;
    textarea.value = decryptedCookie.value;
    sameSiteSelect.value = currentSameSite;
    secureCheckbox.checked = currentSecure;
    httpOnlyCheckbox.checked = currentHttpOnly;
    textarea.focus();
    textarea.select();

    sameSiteSelect.addEventListener("change", function () {
      if (this.value === "no_restriction") {
        secureCheckbox.checked = true;
      }
    });

    const closeModal = () => {
      document.body.removeChild(modal);
    };

    modal
      .querySelector(".edit-modal-close")
      .addEventListener("click", closeModal);
    modal
      .querySelector("#cancel-cookie-edit")
      .addEventListener("click", closeModal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    modal.querySelector("#save-cookie-edit").addEventListener("click", () => {
      const newName = nameInput.value.trim();
      const newValue = textarea.value.trim();

      if (newName === "") {
        showToast("Cookie name cannot be empty", "error");
        nameInput.focus();
        return;
      }

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

      const valueValidation = validateCookieValue(newValue);
      if (!valueValidation.valid) {
        showToast(valueValidation.message, "error");
        textarea.focus();
        return;
      }

      const newSameSite = sameSiteSelect.value;
      const newSecure = secureCheckbox.checked;
      const newHttpOnly = httpOnlyCheckbox.checked;

      if (newSameSite === "no_restriction" && !newSecure) {
        showToast("SameSite=None requires Secure to be enabled", "error");
        return;
      }

      debugLog(`Before update: original=${decryptedCookie.name}, new=${newName}`, "info");

      const originalBrowserName = decryptedCookie.name;

      let updatedCookie = savedCookies[cookieIndex].isEncrypted
        ? encryptionHelpers.decryptCookieValues(savedCookies[cookieIndex])
        : { ...savedCookies[cookieIndex] };

      updatedCookie.name = newName;
      updatedCookie.value = newValue;
      updatedCookie.sameSite = newSameSite;
      updatedCookie.secure = newSecure;
      updatedCookie.httpOnly = newHttpOnly;

      debugLog(`After decryption and update: name=${updatedCookie.name}`, "info");

      if (savedCookies[cookieIndex].isEncrypted) {
        updatedCookie = encryptionHelpers.encryptCookieValues(updatedCookie);
        debugLog(`After re-encryption: name=${updatedCookie.name}`, "info");
      }

      savedCookies[cookieIndex] = updatedCookie;

      chrome.storage.local.set({ savedCookies }, () => {
        if (chrome.runtime.lastError) {
          showToast("Failed to save cookie", "error");
          return;
        }
        const nameChanged = newName !== decryptedCookie.name;

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const finalCookie = savedCookies[cookieIndex];
          const currentDomain = tabs[0]
            ? new URL(tabs[0].url).hostname
            : null;
          const cookieDomain = finalCookie.isGlobal
            ? currentDomain
            : finalCookie.domain;

          if (!cookieDomain) return;

          const cookieDomainClean = cookieDomain.startsWith(".")
            ? cookieDomain.substring(1)
            : cookieDomain;
          const checkUrl = `https://${cookieDomainClean}${finalCookie.path || "/"}`;

          debugLog(`Checking for existing cookie: ${originalBrowserName} at ${checkUrl}`, "info");

          chrome.cookies.get(
            { name: originalBrowserName, url: checkUrl },
            (existingCookie) => {
              debugLog(`Existing cookie found: ${!!existingCookie}`, "info");
              if (existingCookie) {
                chrome.cookies.remove(
                  { name: originalBrowserName, url: checkUrl },
                  () => {
                    debugLog("Removed old cookie, creating new one", "info");
                    const cookieDetails = {
                      name: newName,
                      value: newValue,
                      domain: cookieDomain.startsWith(".") ? cookieDomain : null,
                      path: finalCookie.path || "/",
                      url: checkUrl,
                      sameSite: newSameSite,
                      secure: newSecure,
                      httpOnly: newHttpOnly,
                    };

                    if (finalCookie.expirationDays) {
                      cookieDetails.expirationDate =
                        Math.floor(Date.now() / 1000) +
                        finalCookie.expirationDays * 24 * 60 * 60;
                    }

                    chrome.cookies.set(cookieDetails, (result) => {
                      debugLog(`New cookie created: ${result?.name}`, "info");
                    });
                  }
                );
              }
            }
          );
        });

        if (nameChanged) {
          showToast(
            `Cookie renamed to "${newName}" and updated successfully`,
            "success"
          );
        } else {
          showToast("Cookie updated successfully", "success");
        }

        loadSavedCookies();

        closeModal();
      });
    });

    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.ctrlKey) {
        modal.querySelector("#save-cookie-edit").click();
      }
    });
  });
}
