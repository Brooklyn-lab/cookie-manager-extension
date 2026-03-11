import { DEBUG_MODE, state } from "./state.js";

export function showToast(message, type = "info", duration = 3000) {
  const toastContainer = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, duration);
}

export function debugLog(message, type = "info") {
  if (DEBUG_MODE) {
    console.log(`[DEBUG] ${message}`);
  }

  const suppressPatterns = [
    "Is global cookie:", "Current domain:", "Cookie domain:",
    "Exact domain match", "Subdomain match",
    "Using domain for cookie operation:", "Checking cookie existence:",
    "Found cookie", "Value:", "Path:", "Domain:", "Expires:",
    "Cookie set successfully:", "Setting cookie with details:",
    "Removing cookie with details:", "Checking cookie with URL:",
    "Toggling cookie:", "Check before toggle:", "Found existing cookie:",
    "Saving cookie:", "Current saved cookies:", "Updating existing cookie",
    "Adding new cookie to the list", "Cookies saved to storage",
    "Found cookie at index", "Deleted cookie from list", "Deleting cookie:",
    "Set domain for global cookie", "Tab domain:", "Domain allowed check:",
    "Cookie successfully removed from page:", "Cookie for removal not found on page",
    "Set domain for global cookie removal to",
    "Updating button state for cookie", "Auto-synced",
    "cookies with", "API call", "Updated draggable state for",
    "Loading cookies...", "Clearing all site data...",
    "Manual storage clear:", "Clearing cookies...", "Cleared all data for",
  ];

  if (suppressPatterns.some((p) => message.includes(p))) return;
  if (
    (message.includes("Loaded") && message.includes("cookies from storage")) ||
    (message.includes("Found") && message.includes("cookies accessible to")) ||
    (message.includes("Trying to remove") && message.includes("with URL:"))
  ) return;

  if (
    type === "error" &&
    (message.includes("domain") || message.includes("Domain mismatch") ||
     message.includes("specific to") || message.includes("doesn't match"))
  ) return;

  showStatus(message, type || "error");
}

export function showStatus(message, type) {
  const statusMessage = document.getElementById("status-message");
  const accordion = document.querySelector(".accordion");

  if (
    message.includes("Cookie") &&
    (message.includes("not found") || message.includes("domain") ||
     message.includes("Domain") || message.includes("match") ||
     message.includes("specific to") || message.includes("added to site") ||
     message.includes("removed from site") || message.includes("already set on") ||
     message.includes("set successfully"))
  ) return;

  if (state.hideStatusTimer) {
    clearTimeout(state.hideStatusTimer);
    state.hideStatusTimer = null;
  }

  if (type === "info" && message.includes("Site cookies for")) return;
  if (message.includes("Current domain:")) return;

  statusMessage.textContent = message;
  state.siteCookiesDisplayed = false;
  statusMessage.className = type;
  statusMessage.style.display = "block";

  if (type === "error" && message.includes("Please specify")) {
    if (!accordion.classList.contains("active")) {
      accordion.classList.add("active");
      const form = accordion.querySelector(".add-cookie-form");
      form.style.opacity = "0";
      setTimeout(function () {
        form.style.opacity = "1";
        const nameInput = form.querySelector("#cookieName");
        if (nameInput) nameInput.focus();
      }, 50);
      scrollAddCookieAccordionIntoView();
    }
  }

  if (type === "success" || type === "removed") {
    state.hideStatusTimer = setTimeout(function () {
      statusMessage.style.display = "none";
      state.hideStatusTimer = null;
    }, 3000);
  }
}

export function clearStatusMessage() {
  const statusMessage = document.getElementById("status-message");
  if (
    state.siteCookiesDisplayed &&
    statusMessage.querySelector(".site-cookies-container")
  ) {
    statusMessage.className = "info";
    if (state.hideStatusTimer) {
      clearTimeout(state.hideStatusTimer);
      state.hideStatusTimer = null;
    }
    return;
  }
  statusMessage.innerHTML = "";
  statusMessage.className = "";
  statusMessage.style.display = "none";
  state.siteCookiesDisplayed = false;
  if (state.hideStatusTimer) {
    clearTimeout(state.hideStatusTimer);
    state.hideStatusTimer = null;
  }
}

export function scrollAccordionIntoView(accordionElement) {
  setTimeout(() => {
    const container = document.querySelector(".container");
    if (container) container.style.scrollBehavior = "";
    accordionElement.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 100);
}

export function scrollAddCookieAccordionIntoView() {
  const accordion = document.querySelector(".accordion");
  setTimeout(() => {
    accordion.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
  }, 100);
}

export function closeSavedCookiesAccordion() {
  const savedCookiesAccordion = document.querySelector(".saved-cookies-accordion");
  if (savedCookiesAccordion.classList.contains("active")) {
    savedCookiesAccordion.classList.remove("active");
    const content = savedCookiesAccordion.querySelector(".accordion-content");
    if (content) {
      content.style.maxHeight = "";
      content.style.padding = "";
    }
  }
}

export function closeAllAccordions() {
  const statusMessage = document.getElementById("status-message");
  const accordion = document.querySelector(".accordion");
  const savedCookiesAccordion = document.querySelector(".saved-cookies-accordion");

  if (!state.siteCookiesDisplayed || !statusMessage.querySelector(".site-cookies-container")) {
    clearStatusMessage();
  }

  if (accordion.classList.contains("active")) {
    accordion.classList.remove("active");
    const content = accordion.querySelector(".accordion-content");
    if (content) {
      const form = content.querySelector(".add-cookie-form");
      if (form) form.style.opacity = "";
    }
  }

  if (savedCookiesAccordion.classList.contains("active")) {
    savedCookiesAccordion.classList.remove("active");
    const content = savedCookiesAccordion.querySelector(".accordion-content");
    if (content) {
      content.style.maxHeight = "";
      content.style.padding = "";
      const savedContent = content.querySelector(".saved-cookies-content");
      if (savedContent) savedContent.style.opacity = "";
    }
  }
}

export function highlightInvalidField(fieldElement, isInvalid) {
  if (isInvalid) {
    fieldElement.classList.add("invalid-field");
  } else {
    fieldElement.classList.remove("invalid-field");
  }
}

export function clearFieldHighlights() {
  const fields = ["cookieName", "cookieValue", "cookieDomain", "cookiePath", "cookieExpiration"];
  fields.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("invalid-field");
  });
}

export function showFormValidation(message, type, invalidField = null) {
  const formValidationMessage = document.getElementById("form-validation-message");
  formValidationMessage.textContent = message;
  formValidationMessage.className = `validation-message ${type}`;
  if (invalidField) highlightInvalidField(invalidField, true);
}

export function clearFormValidation() {
  const formValidationMessage = document.getElementById("form-validation-message");
  formValidationMessage.textContent = "";
  formValidationMessage.className = "validation-message";
  clearFieldHighlights();
}

export function breakLongString(str, maxLength = 35) {
  if (!str || str.length <= maxLength) return str;
  let result = "";
  for (let i = 0; i < str.length; i += maxLength) {
    result += str.slice(i, i + maxLength);
    if (i + maxLength < str.length) result += "\u200B";
  }
  return result;
}

export function formatCookieValue(value) {
  if (!value) return "";
  if (value.length <= 50) return value;
  return value.substring(0, 50) + "...";
}

export function updateCurrentDomain() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0] && tabs[0].url) {
      try {
        const urlObj = new URL(tabs[0].url);
        document.getElementById("currentDomain").textContent =
          `Current domain: ${urlObj.hostname}`;
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

export function copyToClipboard(text, successMessage, errorMessage, cookieItem) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showToast(successMessage, "success");
        if (cookieItem) {
          cookieItem.classList.add("copied");
          setTimeout(() => cookieItem.classList.remove("copied"), 500);
        }
      })
      .catch(() => fallbackCopy(text, successMessage, errorMessage, cookieItem));
  } else {
    fallbackCopy(text, successMessage, errorMessage, cookieItem);
  }
}

function fallbackCopy(text, successMessage, errorMessage, cookieItem) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    showToast(successMessage, "success");
    if (cookieItem) {
      cookieItem.classList.add("copied");
      setTimeout(() => cookieItem.classList.remove("copied"), 500);
    }
  } catch (err) {
    showToast(errorMessage || "Failed to copy", "error");
  }
  document.body.removeChild(textarea);
}
