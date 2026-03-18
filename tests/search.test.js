import { describe, it, expect, vi, beforeEach } from "vitest";
import { seedCookies } from "./chrome-mock.js";

vi.mock("../src/utils.js", async () => {
  const actual = await vi.importActual("../src/utils.js");
  return {
    ...actual,
    showSensitiveDomainWarning: vi.fn(() => Promise.resolve()),
  };
});

import {
  createSearchResultsContainer,
  clearSearchResult,
  hasSearchResults,
  showSearchResult,
  copyCookieValueToClipboard,
  searchCookieOnCurrentSite,
  deleteSearchedCookie,
  removeSearchResultItem,
  performNewSearch,
  editSearchedCookie,
  updateSearchResultCookieValue,
  saveSearchedCookie,
} from "../src/modules/search.js";
import { state } from "../src/modules/state.js";

const SAMPLE_COOKIES = [
  { name: "session", value: "abc123", domain: "example.com", path: "/", secure: true, httpOnly: false },
  { name: "theme", value: "dark", domain: "example.com", path: "/", secure: false, httpOnly: false },
];

function setupDOM() {
  document.body.innerHTML = `
    <div id="search-result" class="search-result"></div>
    <input id="cookieSearchInput" value="" />
    <div id="toast-container"></div>
    <div id="status-message"></div>
    <div id="currentDomain"></div>
    <div id="cookiesList"></div>
  `;
}

function resetState() {
  state.lastSearchTerm = "";
  state.lastNotFoundTerm = "";
  state.lastSearchQuery = null;
  state.lastSearchDomain = null;
  state.lastSearchResult = null;
}

beforeEach(() => {
  setupDOM();
  resetState();
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn(() => Promise.resolve()) },
    writable: true,
    configurable: true,
  });
});

// --- createSearchResultsContainer ---

describe("createSearchResultsContainer", () => {
  it("returns a container with header and cookie items", () => {
    const container = createSearchResultsContainer(SAMPLE_COOKIES, "Found 2 cookie(s):");
    expect(container.tagName).toBe("DIV");

    const header = container.querySelector(".search-cookie-header strong");
    expect(header.textContent).toBe("Found 2 cookie(s):");

    const items = container.querySelectorAll(".search-result-item");
    expect(items.length).toBe(2);
  });

  it("renders cookie name in clickable span with data attribute", () => {
    const container = createSearchResultsContainer([SAMPLE_COOKIES[0]], "Header");
    const nameSpan = container.querySelector(".clickable-name");
    expect(nameSpan.getAttribute("data-cookie-name")).toBe("session");
    expect(nameSpan.title).toBe("Click to copy name");
  });

  it("renders cookie value in clickable span with full value in data attr", () => {
    const container = createSearchResultsContainer([SAMPLE_COOKIES[0]], "Header");
    const valueSpan = container.querySelector(".clickable-value");
    expect(valueSpan.getAttribute("data-full-value")).toBe("abc123");
    expect(valueSpan.title).toBe("Click to copy value");
  });

  it("truncates values longer than 50 chars and appends ellipsis", () => {
    const longValue = "x".repeat(80);
    const cookies = [{ name: "long", value: longValue, domain: "d.com", path: "/", secure: false, httpOnly: false }];
    const container = createSearchResultsContainer(cookies, "Header");
    const valueSpan = container.querySelector(".clickable-value");

    expect(valueSpan.getAttribute("data-full-value")).toBe(longValue);
    expect(valueSpan.textContent).toContain("...");
    expect(valueSpan.textContent.replace(/\u200B/g, "").length).toBeLessThanOrEqual(54);
  });

  it("does not truncate values of 50 chars or less", () => {
    const shortValue = "a".repeat(50);
    const cookies = [{ name: "short", value: shortValue, domain: "d.com", path: "/", secure: false, httpOnly: false }];
    const container = createSearchResultsContainer(cookies, "Header");
    const valueSpan = container.querySelector(".clickable-value");
    expect(valueSpan.textContent).not.toContain("...");
  });

  it("renders edit and delete buttons with correct data attributes", () => {
    const container = createSearchResultsContainer([SAMPLE_COOKIES[0]], "Header");
    const editBtn = container.querySelector(".search-cookie-edit-btn");
    const deleteBtn = container.querySelector(".search-cookie-delete-btn");

    expect(editBtn.getAttribute("data-cookie-name")).toBe("session");
    expect(editBtn.getAttribute("data-cookie-domain")).toBe("example.com");
    expect(editBtn.getAttribute("data-cookie-path")).toBe("/");

    expect(deleteBtn.getAttribute("data-cookie-name")).toBe("session");
    expect(deleteBtn.getAttribute("data-cookie-domain")).toBe("example.com");
  });

  it("renders domain, path, secure, httpOnly details", () => {
    const cookies = [{ name: "c", value: "v", domain: "d.com", path: "/api", secure: true, httpOnly: true }];
    const container = createSearchResultsContainer(cookies, "H");
    const details = container.querySelector(".cookie-details-search");
    const text = details.textContent;

    expect(text).toContain("d.com");
    expect(text).toContain("/api");
    expect(text).toContain("Yes"); // secure
    expect(text).toMatch(/HttpOnly:.*Yes/);
  });

  it("returns empty container for empty cookies array", () => {
    const container = createSearchResultsContainer([], "Nothing");
    expect(container.querySelectorAll(".search-result-item").length).toBe(0);
    expect(container.querySelector(".search-cookie-header strong").textContent).toBe("Nothing");
  });
});

// --- clearSearchResult ---

describe("clearSearchResult", () => {
  it("clears innerHTML and resets className", () => {
    const el = document.getElementById("search-result");
    el.innerHTML = "<p>Old content</p>";
    el.className = "search-result found";

    clearSearchResult();

    expect(el.innerHTML).toBe("");
    expect(el.className).toBe("search-result");
  });

  it("clears existing hide timer", () => {
    const el = document.getElementById("search-result");
    el.hideTimer = setTimeout(() => {}, 10000);

    clearSearchResult();
    expect(el.hideTimer).toBeNull();
  });
});

// --- hasSearchResults ---

describe("hasSearchResults", () => {
  it("returns false when search-result is empty", () => {
    expect(hasSearchResults()).toBe(false);
  });

  it("returns true when search-result contains .search-result-item elements", () => {
    const el = document.getElementById("search-result");
    const container = createSearchResultsContainer(SAMPLE_COOKIES, "Found");
    el.innerHTML = container.outerHTML;
    expect(hasSearchResults()).toBe(true);
  });

  it("returns false when search-result has children but no .search-result-item", () => {
    const el = document.getElementById("search-result");
    el.innerHTML = "<div>some text</div>";
    expect(hasSearchResults()).toBe(false);
  });
});

// --- showSearchResult ---

describe("showSearchResult", () => {
  it("sets innerHTML and className with type suffix", () => {
    showSearchResult("Cookie found!", "found");
    const el = document.getElementById("search-result");
    expect(el.innerHTML).toBe("Cookie found!");
    expect(el.className).toBe("search-result found");
  });

  it("sets className for not-found type", () => {
    showSearchResult("Not found", "not-found");
    const el = document.getElementById("search-result");
    expect(el.className).toBe("search-result not-found");
  });

  it("skips DOM update when content and class are identical", () => {
    showSearchResult("Same", "found");
    const el = document.getElementById("search-result");

    const spy = vi.spyOn(el, "className", "set");
    showSearchResult("Same", "found");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("sets a fallback timeout for 'searching' type", () => {
    vi.useFakeTimers();
    showSearchResult("Searching...", "searching");
    const el = document.getElementById("search-result");
    expect(el.hideTimer).not.toBeNull();
    vi.useRealTimers();
  });
});

// --- copyCookieValueToClipboard ---

describe("copyCookieValueToClipboard", () => {
  it("calls navigator.clipboard.writeText with the value", async () => {
    copyCookieValueToClipboard("my-token-value");
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("my-token-value");
  });

  it("shows success toast after clipboard write", async () => {
    await copyCookieValueToClipboard("val");
    await vi.waitFor(() => {
      const toasts = document.querySelectorAll("#toast-container .toast");
      expect(toasts.length).toBeGreaterThan(0);
    });
  });

  it("falls back when clipboard API is missing", () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    document.execCommand = vi.fn(() => true);
    copyCookieValueToClipboard("fallback-value");
    expect(document.execCommand).toHaveBeenCalledWith("copy");
  });
});

// --- removeSearchResultItem ---

describe("removeSearchResultItem", () => {
  function seedSearchResultsDOM() {
    const container = createSearchResultsContainer(SAMPLE_COOKIES, "Found 2:");
    const el = document.getElementById("search-result");
    el.innerHTML = `<div class="search-result-header"></div>${container.outerHTML}`;
  }

  it("removes the matching cookie item from DOM", () => {
    seedSearchResultsDOM();
    expect(document.querySelectorAll(".search-result-item").length).toBe(2);
    removeSearchResultItem("session", "example.com", "/");
    expect(document.querySelectorAll(".search-result-item").length).toBe(1);
  });

  it("clears search result when last item is removed", () => {
    const singleCookie = [SAMPLE_COOKIES[0]];
    const container = createSearchResultsContainer(singleCookie, "Found 1:");
    const el = document.getElementById("search-result");
    el.innerHTML = `<div class="search-result-header"></div>${container.outerHTML}`;

    removeSearchResultItem("session", "example.com", "/");
    expect(el.innerHTML).toBe("");
  });

  it("does nothing when cookie is not found in results", () => {
    seedSearchResultsDOM();
    removeSearchResultItem("nonexistent", "other.com", "/path");
    expect(document.querySelectorAll(".search-result-item").length).toBe(2);
  });
});

// --- searchCookieOnCurrentSite ---

describe("searchCookieOnCurrentSite", () => {
  it("shows error toast and clears results for empty input", () => {
    searchCookieOnCurrentSite("");
    const toasts = document.querySelectorAll("#toast-container .toast");
    expect(toasts.length).toBeGreaterThan(0);
    expect(toasts[0].textContent).toContain("enter a cookie name");
  });

  it("shows error toast for whitespace-only input", () => {
    searchCookieOnCurrentSite("   ");
    const toasts = document.querySelectorAll("#toast-container .toast");
    expect(toasts[0].textContent).toContain("enter a cookie name");
  });

  it("resets cache state on empty input", () => {
    state.lastSearchQuery = "old";
    state.lastSearchDomain = "old.com";
    state.lastSearchResult = { content: "x", type: "found" };

    searchCookieOnCurrentSite("");
    expect(state.lastSearchQuery).toBeNull();
    expect(state.lastSearchDomain).toBeNull();
    expect(state.lastSearchResult).toBeNull();
  });

  it("calls chrome.tabs.query and chrome.cookies.getAll for valid input", () => {
    seedCookies([
      { name: "session", value: "abc", domain: "example.com", path: "/" },
    ]);

    searchCookieOnCurrentSite("session");

    expect(chrome.tabs.query).toHaveBeenCalled();
    expect(chrome.cookies.getAll).toHaveBeenCalled();
  });

  it("shows found results when matching cookies exist", () => {
    seedCookies([
      { name: "session", value: "abc", domain: "example.com", path: "/", secure: false, httpOnly: false },
    ]);

    searchCookieOnCurrentSite("session");

    const el = document.getElementById("search-result");
    expect(el.className).toContain("found");
    expect(el.innerHTML).toContain("session");
  });

  it("performs case-insensitive search", () => {
    seedCookies([
      { name: "SessionToken", value: "xyz", domain: "example.com", path: "/", secure: false, httpOnly: false },
    ]);

    searchCookieOnCurrentSite("sessiontoken");

    const el = document.getElementById("search-result");
    expect(el.innerHTML).toContain("SessionToken");
  });
});

// --- performNewSearch ---

describe("performNewSearch", () => {
  it("caches successful result in state", () => {
    seedCookies([
      { name: "auth", value: "token", domain: "example.com", path: "/", secure: false, httpOnly: false },
    ]);

    performNewSearch("auth", "auth", "example.com", "https://example.com/path");

    expect(state.lastSearchQuery).toBe("auth");
    expect(state.lastSearchDomain).toBe("example.com");
    expect(state.lastSearchResult).not.toBeNull();
    expect(state.lastSearchResult.type).toBe("found");
  });

  it("shows searching status initially", () => {
    vi.useFakeTimers();
    seedCookies([]);

    chrome.cookies.getAll.mockImplementation(() => {});
    performNewSearch("test", "test", "example.com", "https://example.com/");

    const el = document.getElementById("search-result");
    expect(el.className).toContain("searching");
    vi.useRealTimers();
  });
});

// --- deleteSearchedCookie ---

describe("deleteSearchedCookie", () => {
  it("calls chrome.cookies.remove with both https and http URLs", () => {
    deleteSearchedCookie("session", "example.com", "/");

    const calls = chrome.cookies.remove.mock.calls;
    expect(calls.length).toBe(2);

    const urls = calls.map((c) => c[0].url);
    expect(urls).toContain("https://example.com/");
    expect(urls).toContain("http://example.com/");
  });

  it("strips leading dot from domain when building URL", () => {
    deleteSearchedCookie("sid", ".example.com", "/api");

    const firstUrl = chrome.cookies.remove.mock.calls[0][0].url;
    expect(firstUrl).toContain("example.com/api");
    expect(firstUrl).not.toContain("..example.com");
  });

  it("shows success toast and clears cache on removal", () => {
    state.lastSearchQuery = "session";
    state.lastSearchDomain = "example.com";
    state.lastSearchResult = { content: "x", type: "found" };

    deleteSearchedCookie("session", "example.com", "/");

    const toasts = document.querySelectorAll("#toast-container .toast");
    expect(toasts.length).toBeGreaterThan(0);
    expect(toasts[0].textContent).toContain("deleted successfully");

    expect(state.lastSearchQuery).toBeNull();
  });
});

// --- editSearchedCookie ---

describe("editSearchedCookie", () => {
  it("creates an edit modal with correct name and value", () => {
    editSearchedCookie("myCookie", ".example.com", "/", "oldValue");

    const modal = document.querySelector(".edit-modal");
    expect(modal).not.toBeNull();

    const nameInput = modal.querySelector("#edit-search-cookie-name");
    const valueArea = modal.querySelector("#edit-search-cookie-value");
    expect(nameInput.value).toBe("myCookie");
    expect(valueArea.value).toBe("oldValue");
  });

  it("closes modal on cancel button click", () => {
    editSearchedCookie("c", ".d.com", "/", "v");
    const cancelBtn = document.querySelector("#cancel-search-cookie-edit");
    cancelBtn.click();
    expect(document.querySelector(".edit-modal")).toBeNull();
  });

  it("closes modal on close (x) button click", () => {
    editSearchedCookie("c", ".d.com", "/", "v");
    document.querySelector(".edit-modal-close").click();
    expect(document.querySelector(".edit-modal")).toBeNull();
  });
});

// --- updateSearchResultCookieValue ---

describe("updateSearchResultCookieValue", () => {
  it("updates displayed value and data attribute for matching cookie", () => {
    const container = createSearchResultsContainer([SAMPLE_COOKIES[0]], "Found 1:");
    const el = document.getElementById("search-result");
    el.innerHTML = container.outerHTML;

    updateSearchResultCookieValue("session", "example.com", "/", "newVal");

    const editBtn = el.querySelector(".search-cookie-edit-btn");
    expect(editBtn.getAttribute("data-cookie-value")).toBe("newVal");

    const valueSpan = el.querySelector(".clickable-value");
    expect(valueSpan.getAttribute("data-full-value")).toBe("newVal");
    expect(valueSpan.textContent).toContain("newVal");
  });
});

describe("saveSearchedCookie", () => {
  beforeEach(() => {
    setupDOM();
    document.body.innerHTML += `
      <div id="savedCookiesList"></div>
      <div class="saved-cookies-accordion">
        <div class="accordion-content">
          <div class="saved-cookies-content"></div>
        </div>
      </div>
      <div class="accordion"><div class="add-cookie-form"></div></div>
    `;
  });

  it("saves a new cookie to chrome.storage", () => {
    saveSearchedCookie("session", "example.com", "/", "abc123");

    expect(chrome.storage.local.get).toHaveBeenCalledWith(
      ["savedCookies"],
      expect.any(Function)
    );
    expect(chrome.storage.local.set).toHaveBeenCalled();

    const savedArg = chrome.storage.local.set.mock.calls[0][0];
    expect(savedArg.savedCookies).toHaveLength(1);
    expect(savedArg.savedCookies[0].name).toBe("session");
    expect(savedArg.savedCookies[0].domain).toBe("example.com");
    expect(savedArg.savedCookies[0].path).toBe("/");
    expect(savedArg.savedCookies[0].isEncrypted).toBe(true);
    expect(savedArg.savedCookies[0].isGlobal).toBe(false);
  });

  it("encrypts value before saving", () => {
    saveSearchedCookie("token", "example.com", "/", "secret");

    const savedArg = chrome.storage.local.set.mock.calls[0][0];
    expect(savedArg.savedCookies[0].value).toBe(btoa("secret"));
    expect(savedArg.savedCookies[0].isEncrypted).toBe(true);
  });

  it("sets default expirationDays to 30", () => {
    saveSearchedCookie("token", "example.com", "/", "val");

    const savedArg = chrome.storage.local.set.mock.calls[0][0];
    expect(savedArg.savedCookies[0].expirationDays).toBe(30);
  });

  it("skips saving if cookie with same name and domain already exists", () => {
    const existing = {
      id: "old",
      name: "session",
      value: btoa("old-val"),
      domain: "example.com",
      path: "/",
      isEncrypted: true,
      isGlobal: false,
    };
    chrome.storage.local.set({ savedCookies: [existing] }, () => {});
    chrome.storage.local.set.mockClear();

    saveSearchedCookie("session", "example.com", "/", "new-val");

    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });

  it("allows saving cookie with same name but different domain", () => {
    const existing = {
      id: "old",
      name: "session",
      value: btoa("val"),
      domain: "other.com",
      path: "/",
      isEncrypted: true,
      isGlobal: false,
    };
    chrome.storage.local.set({ savedCookies: [existing] }, () => {});
    chrome.storage.local.set.mockClear();

    saveSearchedCookie("session", "example.com", "/", "val");

    expect(chrome.storage.local.set).toHaveBeenCalled();
    const savedArg = chrome.storage.local.set.mock.calls[0][0];
    expect(savedArg.savedCookies).toHaveLength(2);
  });

  it("generates unique id for saved cookie", () => {
    saveSearchedCookie("a", "example.com", "/", "v1");

    const savedArg = chrome.storage.local.set.mock.calls[0][0];
    expect(savedArg.savedCookies[0].id).toBeTruthy();
    expect(savedArg.savedCookies[0].id.length).toBeGreaterThan(5);
  });

  it("uses default path '/' when path is empty", () => {
    saveSearchedCookie("test", "example.com", "", "val");

    const savedArg = chrome.storage.local.set.mock.calls[0][0];
    expect(savedArg.savedCookies[0].path).toBe("/");
  });
});

describe("createSearchResultsContainer — save button", () => {
  it("renders a save button for each cookie", () => {
    const container = createSearchResultsContainer(SAMPLE_COOKIES, "Results");
    const saveBtns = container.querySelectorAll(".search-cookie-save-btn");
    expect(saveBtns).toHaveLength(2);
  });

  it("save button has correct data attributes", () => {
    const container = createSearchResultsContainer(SAMPLE_COOKIES, "Results");
    const saveBtn = container.querySelector(".search-cookie-save-btn");
    expect(saveBtn.getAttribute("data-cookie-name")).toBe("session");
    expect(saveBtn.getAttribute("data-cookie-domain")).toBe("example.com");
    expect(saveBtn.getAttribute("data-cookie-path")).toBe("/");
    expect(saveBtn.getAttribute("data-cookie-value")).toBe("abc123");
  });

  it("save button appears before edit button", () => {
    const container = createSearchResultsContainer(SAMPLE_COOKIES, "Results");
    const buttons = container.querySelector(".search-cookie-buttons");
    const children = [...buttons.children];
    const saveIdx = children.findIndex((el) => el.classList.contains("search-cookie-save-btn"));
    const editIdx = children.findIndex((el) => el.classList.contains("search-cookie-edit-btn"));
    expect(saveIdx).toBeLessThan(editIdx);
  });
});
