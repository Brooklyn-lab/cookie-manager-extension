import {
  validateCookieName,
  validateCookieValue,
  validateCookieDomain,
  validateCookiePath,
  validateExpirationDays,
} from "./utils.js";

import { state } from "./modules/state.js";
import {
  showToast,
  showStatus,
  clearStatusMessage,
  scrollAddCookieAccordionIntoView,
  closeAllAccordions,
  highlightInvalidField,
  clearFormValidation,
  showFormValidation,
  updateCurrentDomain,
  breakLongString,
} from "./modules/ui.js";
import {
  saveCookie,
  loadSavedCookies,
} from "./modules/cookies.js";
import {
  searchCookieOnCurrentSite,
  clearSearchResult,
  copyCookieValueToClipboard,
  editSearchedCookie,
  deleteSearchedCookie,
  saveSearchedCookie,
} from "./modules/search.js";
import { exportSavedCookies, importSavedCookies } from "./modules/import-export.js";
import {
  initDefaultGroups,
  createGroup,
  deleteGroup,
  enableGroupCookies,
  disableGroupCookies,
  renderGroupsUI,
  updateGroupBadges,
  showGroupAssignMenu,
} from "./modules/groups.js";
import {
  showSiteCookiesInfo,
  clearAllSiteCookies,
  clearAllSiteData,
  deleteSiteCookie,
  copySiteCookieNameToClipboard,
  copySiteCookieValueToClipboard,
} from "./modules/site-cookies.js";

document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const cookieNameInput = document.getElementById("cookieName");
  const cookieValueInput = document.getElementById("cookieValue");
  const cookieDomainInput = document.getElementById("cookieDomain");
  const cookiePathInput = document.getElementById("cookiePath");
  const cookieExpirationInput = document.getElementById("cookieExpiration");
  const isGlobalCookieCheckbox = document.getElementById("isGlobalCookie");
  const addCookieBtn = document.getElementById("addCookieBtn");
  const accordion = document.querySelector(".accordion");
  const accordionHeader = document.querySelector(".accordion-header");
  const savedCookiesAccordion = document.querySelector(".saved-cookies-accordion");
  const savedCookiesHeader = savedCookiesAccordion.querySelector(".accordion-header");
  const openDevToolsBtn = document.getElementById("openDevToolsBtn");
  const clearAllCookiesBtn = document.getElementById("clearAllCookiesBtn");
  const clearAllDataBtn = document.getElementById("clearAllDataBtn");
  const searchCookieBtn = document.getElementById("searchCookieBtn");
  const cookieSearchInput = document.getElementById("cookieSearchInput");
  const exportCookiesBtn = document.getElementById("exportCookiesBtn");
  const importCookiesBtn = document.getElementById("importCookiesBtn");
  const importFileInput = document.getElementById("importFileInput");

  // ── Accordion: Add new cookie ──
  accordionHeader.addEventListener("click", function () {
    if (state.siteCookiesDisplayed) {
      state.siteCookiesDisplayed = false;
      clearStatusMessage();
    }
    clearSearchResult();

    const content = accordion.querySelector(".accordion-content");
    const isActive = accordion.classList.contains("active");

    if (isActive) {
      accordion.classList.remove("active");
      const form = content.querySelector(".add-cookie-form");
      if (form) form.style.opacity = "";
    } else {
      if (savedCookiesAccordion.classList.contains("active")) {
        savedCookiesAccordion.classList.remove("active");
        const otherContent = savedCookiesAccordion.querySelector(".accordion-content");
        const otherSavedContent = otherContent.querySelector(".saved-cookies-content");
        otherSavedContent.style.opacity = "0";
        otherContent.style.maxHeight = "0";
        otherContent.style.padding = "0 15px";
      }

      accordion.classList.add("active");
      cookieNameInput.value = "";
      cookieValueInput.value = "";
      cookieDomainInput.value = "";
      cookiePathInput.value = "/";
      cookieExpirationInput.value = "30";
      isGlobalCookieCheckbox.checked = true;
      cookieDomainInput.disabled = true;
      cookieDomainInput.placeholder = "Global cookie (any domain)";
      clearFormValidation();

      const form = content.querySelector(".add-cookie-form");
      form.style.opacity = "0";
      setTimeout(function () {
        form.style.opacity = "1";
        const nameInput = form.querySelector("#cookieName");
        if (nameInput) nameInput.focus();
      }, 50);
      scrollAddCookieAccordionIntoView();
    }
  });

  // ── Accordion: Saved cookies ──
  savedCookiesHeader.addEventListener("click", function () {
    if (state.siteCookiesDisplayed) {
      state.siteCookiesDisplayed = false;
      clearStatusMessage();
    }
    clearSearchResult();

    const content = savedCookiesAccordion.querySelector(".accordion-content");
    const isActive = savedCookiesAccordion.classList.contains("active");
    const savedContent = content.querySelector(".saved-cookies-content");

    if (isActive) {
      savedCookiesAccordion.classList.remove("active");
      content.style.maxHeight = "";
      content.style.padding = "";
      savedContent.style.opacity = "";
      const container = document.querySelector(".container");
      if (container) container.style.scrollBehavior = "";
      clearStatusMessage();
    } else {
      if (accordion.classList.contains("active")) {
        accordion.classList.remove("active");
        const otherContent = accordion.querySelector(".accordion-content");
        const otherForm = otherContent.querySelector(".add-cookie-form");
        otherForm.style.opacity = "0";
      }

      savedCookiesAccordion.classList.add("active");
      savedContent.style.opacity = "0";
      content.style.maxHeight = "300px";
      content.style.padding = "15px";
      setTimeout(function () {
        savedContent.style.opacity = "1";
      }, 100);

      setTimeout(() => {
        const accordionTop = savedCookiesAccordion.offsetTop;
        const offset = Math.max(0, accordionTop - 50);
        window.scrollTo({ top: offset, behavior: "smooth" });
      }, 200);
    }
  });

  // ── Global cookie checkbox ──
  isGlobalCookieCheckbox.addEventListener("change", function () {
    if (this.checked) {
      cookieDomainInput.disabled = true;
      cookieDomainInput.placeholder = "Global cookie (any domain)";
      cookieDomainInput.value = "";
    } else {
      cookieDomainInput.disabled = false;
      cookieDomainInput.placeholder = "example.com";
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const urlObj = new URL(tabs[0].url);
        cookieDomainInput.placeholder = urlObj.hostname;
      });
    }
  });

  // ── Add cookie button ──
  addCookieBtn.addEventListener("click", function () {
    clearFormValidation();
    clearSearchResult();

    const name = cookieNameInput.value.trim();
    const value = cookieValueInput.value.trim();
    let domain = cookieDomainInput.value.trim();
    const path = cookiePathInput.value.trim();
    const expirationDays = cookieExpirationInput.value.trim();
    const isGlobal = isGlobalCookieCheckbox.checked;

    const nameValidation = validateCookieName(name);
    if (!nameValidation.valid) {
      showFormValidation(nameValidation.message, "error", cookieNameInput);
      cookieNameInput.focus();
      return;
    }

    const valueValidation = validateCookieValue(value);
    if (!valueValidation.valid) {
      showFormValidation(valueValidation.message, "error", cookieValueInput);
      cookieValueInput.focus();
      return;
    }

    const domainValidation = validateCookieDomain(domain, isGlobal);
    if (!domainValidation.valid) {
      showFormValidation(domainValidation.message, "error", cookieDomainInput);
      cookieDomainInput.focus();
      return;
    }

    const pathValidation = validateCookiePath(path);
    if (!pathValidation.valid) {
      showFormValidation(pathValidation.message, "error", cookiePathInput);
      cookiePathInput.focus();
      return;
    }

    const expirationValidation = validateExpirationDays(expirationDays);
    if (!expirationValidation.valid) {
      showFormValidation(expirationValidation.message, "error", cookieExpirationInput);
      cookieExpirationInput.focus();
      return;
    }

    if (!isGlobal && domain && !domain.startsWith(".")) {
      domain = "." + domain;
    }

    saveCookie(name, value, domain, path, expirationValidation.value, isGlobal);
  });

  // ── Form field input validation clearing ──
  [cookieNameInput, cookieValueInput, cookieDomainInput, cookiePathInput, cookieExpirationInput].forEach((field) => {
    field.addEventListener("input", function () {
      highlightInvalidField(this, false);
    });
  });

  // ── Search ──
  function handleSearch(cookieName) {
    closeAllAccordions();
    if (cookieName) {
      const searchResultEl = document.getElementById("search-result");
      const hasVisibleResults = searchResultEl.innerHTML.trim() !== "";

      if (cookieName === state.lastSearchTerm && hasVisibleResults) return;

      if (cookieName === state.lastNotFoundTerm) {
        showToast(
          `Cookies containing "${breakLongString(cookieName)}" not found on current site or related domains`,
          "error"
        );
        return;
      }

      cookieSearchInput.classList.remove("search-input-error");
      state.lastSearchTerm = cookieName;
      searchCookieOnCurrentSite(cookieName);
    } else {
      cookieSearchInput.classList.add("search-input-error");
      cookieSearchInput.focus();
      showToast("Please enter a cookie name to search", "error");
      clearSearchResult();
      state.lastSearchQuery = null;
      state.lastSearchDomain = null;
      state.lastSearchResult = null;
      setTimeout(() => cookieSearchInput.classList.remove("search-input-error"), 3000);
    }
  }

  searchCookieBtn.addEventListener("click", function () {
    handleSearch(cookieSearchInput.value.trim());
  });

  cookieSearchInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      handleSearch(event.target.value.trim());
    }
  });

  cookieSearchInput.addEventListener("input", function () {
    if (cookieSearchInput.classList.contains("search-input-error")) {
      cookieSearchInput.classList.remove("search-input-error");
    }
    state.lastSearchQuery = null;
    state.lastSearchDomain = null;
    state.lastSearchResult = null;
  });

  // ── Search result event delegation ──
  document.getElementById("search-result").addEventListener("click", function (event) {
    if (event.target.classList.contains("clickable-name")) {
      const cookieName = event.target.getAttribute("data-cookie-name");
      if (cookieName) {
        navigator.clipboard.writeText(cookieName)
          .then(() => showToast("Cookie name copied!", "success"))
          .catch(() => showToast("Failed to copy cookie name", "error"));
      }
    } else if (event.target.classList.contains("clickable-value")) {
      const fullValue = event.target.getAttribute("data-full-value");
      if (fullValue) copyCookieValueToClipboard(fullValue);
    } else if (event.target.classList.contains("search-cookie-edit-btn") || event.target.closest(".search-cookie-edit-btn")) {
      const editBtn = event.target.classList.contains("search-cookie-edit-btn") ? event.target : event.target.closest(".search-cookie-edit-btn");
      const name = editBtn.getAttribute("data-cookie-name");
      const domain = editBtn.getAttribute("data-cookie-domain");
      const path = editBtn.getAttribute("data-cookie-path");
      const value = editBtn.getAttribute("data-cookie-value");
      if (name && domain && path) editSearchedCookie(name, domain, path, value);
    } else if (event.target.classList.contains("search-cookie-save-btn") || event.target.closest(".search-cookie-save-btn")) {
      const saveBtn = event.target.classList.contains("search-cookie-save-btn") ? event.target : event.target.closest(".search-cookie-save-btn");
      const name = saveBtn.getAttribute("data-cookie-name");
      const domain = saveBtn.getAttribute("data-cookie-domain");
      const path = saveBtn.getAttribute("data-cookie-path");
      const value = saveBtn.getAttribute("data-cookie-value");
      if (name && domain) saveSearchedCookie(name, domain, path, value);
    } else if (event.target.classList.contains("search-cookie-delete-btn") || event.target.closest(".search-cookie-delete-btn")) {
      const deleteBtn = event.target.classList.contains("search-cookie-delete-btn") ? event.target : event.target.closest(".search-cookie-delete-btn");
      const name = deleteBtn.getAttribute("data-cookie-name");
      const domain = deleteBtn.getAttribute("data-cookie-domain");
      const path = deleteBtn.getAttribute("data-cookie-path");
      if (name && domain && path) deleteSearchedCookie(name, domain, path);
    }
  });

  // ── Site cookies event delegation ──
  document.getElementById("status-message").addEventListener("click", function (event) {
    if (event.target.classList.contains("clickable-site-cookie-name")) {
      const cookieName = event.target.getAttribute("data-cookie-name");
      const cookieItem = event.target.closest(".site-cookie-item");
      if (cookieName && cookieItem) copySiteCookieNameToClipboard(cookieName, cookieItem);
    } else if (event.target.classList.contains("clickable-site-cookie-value")) {
      const cookieValue = event.target.getAttribute("data-cookie-value");
      const cookieItem = event.target.closest(".site-cookie-item");
      if (cookieValue && cookieItem) copySiteCookieValueToClipboard(cookieValue, cookieItem);
    } else if (event.target.classList.contains("search-cookie-edit-btn") || event.target.closest(".search-cookie-edit-btn")) {
      const editBtn = event.target.classList.contains("search-cookie-edit-btn") ? event.target : event.target.closest(".search-cookie-edit-btn");
      const name = editBtn.getAttribute("data-cookie-name");
      const domain = editBtn.getAttribute("data-cookie-domain");
      const path = editBtn.getAttribute("data-cookie-path");
      const value = editBtn.getAttribute("data-cookie-value");
      if (name && domain && path) editSearchedCookie(name, domain, path, value);
    } else if (event.target.classList.contains("search-cookie-save-btn") || event.target.closest(".search-cookie-save-btn")) {
      const saveBtn = event.target.classList.contains("search-cookie-save-btn") ? event.target : event.target.closest(".search-cookie-save-btn");
      const name = saveBtn.getAttribute("data-cookie-name");
      const domain = saveBtn.getAttribute("data-cookie-domain");
      const path = saveBtn.getAttribute("data-cookie-path");
      const value = saveBtn.getAttribute("data-cookie-value");
      if (name && domain) saveSearchedCookie(name, domain, path, value);
    } else if (event.target.classList.contains("site-cookie-delete-btn") || event.target.closest(".site-cookie-delete-btn")) {
      const deleteBtn = event.target.classList.contains("site-cookie-delete-btn") ? event.target : event.target.closest(".site-cookie-delete-btn");
      const name = deleteBtn.getAttribute("data-cookie-name");
      const domain = deleteBtn.getAttribute("data-cookie-domain");
      const path = deleteBtn.getAttribute("data-cookie-path");
      if (name && domain && path) deleteSiteCookie(name, domain, path);
    }
  });

  // ── Site cookies button ──
  openDevToolsBtn.addEventListener("click", function () {
    if (state.siteCookiesDisplayed) {
      state.siteCookiesDisplayed = false;
      clearStatusMessage();
      clearSearchResult();
      return;
    }
    clearSearchResult();
    closeAllAccordions();
    updateCurrentDomain();
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0]) { showStatus("No active tab found", "error"); return; }
      try {
        const urlObj = new URL(tabs[0].url);
        showSiteCookiesInfo(urlObj.hostname);
      } catch (e) { showStatus(`Error: ${e.message}`, "error"); }
    });
  });

  // ── Clear cookies button ──
  clearAllCookiesBtn.addEventListener("click", function () {
    clearSearchResult();
    closeAllAccordions();
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0]) { showStatus("No active tab found", "error"); return; }
      try {
        const urlObj = new URL(tabs[0].url);
        clearAllSiteCookies(urlObj.hostname);
      } catch (e) { showStatus(`Error: ${e.message}`, "error"); }
    });
  });

  // ── Clear all data button ──
  clearAllDataBtn.addEventListener("click", function () {
    clearSearchResult();
    closeAllAccordions();
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0]) { showStatus("No active tab found", "error"); return; }
      try {
        const urlObj = new URL(tabs[0].url);
        clearAllSiteData(urlObj.hostname, tabs[0].url);
      } catch (e) { showStatus(`Error: ${e.message}`, "error"); }
    });
  });

  // ── Export/Import ──
  exportCookiesBtn.addEventListener("click", exportSavedCookies);
  importCookiesBtn.addEventListener("click", () => importFileInput.click());
  importFileInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) importSavedCookies(file, { onComplete: loadSavedCookies });
  });

  // ── Groups accordion ──
  const groupsAccordion = document.querySelector(".groups-accordion");
  const groupsHeader = groupsAccordion.querySelector(".accordion-header");
  const groupsList = document.getElementById("groupsList");
  const addGroupBtn = document.getElementById("addGroupBtn");
  const newGroupNameInput = document.getElementById("newGroupName");
  const newGroupColorInput = document.getElementById("newGroupColor");

  groupsHeader.addEventListener("click", function () {
    if (state.siteCookiesDisplayed) {
      state.siteCookiesDisplayed = false;
      clearStatusMessage();
    }
    clearSearchResult();

    const content = groupsAccordion.querySelector(".accordion-content");
    const isActive = groupsAccordion.classList.contains("active");

    if (isActive) {
      groupsAccordion.classList.remove("active");
    } else {
      if (accordion.classList.contains("active")) {
        accordion.classList.remove("active");
      }
      if (savedCookiesAccordion.classList.contains("active")) {
        savedCookiesAccordion.classList.remove("active");
      }
      groupsAccordion.classList.add("active");
      renderGroupsUI(groupsList);
    }
  });

  addGroupBtn.addEventListener("click", function () {
    const name = newGroupNameInput.value.trim();
    if (!name) {
      showToast("Enter a group name", "error");
      return;
    }
    const color = newGroupColorInput.value;
    createGroup(name, color, function () {
      newGroupNameInput.value = "";
      renderGroupsUI(groupsList);
    });
  });

  newGroupNameInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") addGroupBtn.click();
  });

  groupsList.addEventListener("click", function (event) {
    const enableBtn = event.target.closest(".group-enable-btn");
    if (enableBtn) {
      enableGroupCookies(enableBtn.dataset.groupId);
      return;
    }
    const disableBtn = event.target.closest(".group-disable-btn");
    if (disableBtn) {
      disableGroupCookies(disableBtn.dataset.groupId);
      return;
    }
    const deleteBtn = event.target.closest(".group-delete-btn");
    if (deleteBtn) {
      deleteGroup(deleteBtn.dataset.groupId, function () {
        renderGroupsUI(groupsList);
        updateGroupBadges();
      });
    }
  });

  // ── Group badge clicks on cookie items ──
  document.getElementById("cookiesList").addEventListener("click", function (event) {
    const badge = event.target.closest(".cookie-group-badge");
    if (badge) {
      event.stopPropagation();
      showGroupAssignMenu(badge.dataset.cookieId, badge);
    }
  });

  // ── Initialization ──
  cookieDomainInput.disabled = isGlobalCookieCheckbox.checked;
  cookieDomainInput.placeholder = isGlobalCookieCheckbox.checked
    ? "Global cookie (any domain)"
    : "example.com";

  document.addEventListener("cookies-rendered", function () {
    updateGroupBadges();
  });

  initDefaultGroups(function () {
    loadSavedCookies();
  });
  updateCurrentDomain();

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs[0] || !tabs[0].url) return;
    const urlObj = new URL(tabs[0].url);
    if (!isGlobalCookieCheckbox.checked) {
      cookieDomainInput.placeholder = urlObj.hostname;
    }
  });
});
