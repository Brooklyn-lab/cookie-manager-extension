import { describe, it, expect, vi, beforeEach } from "vitest";
import { seedStorage, getStorageData, seedCookies } from "./chrome-mock.js";

vi.mock("../src/utils.js", async () => {
  const actual = await vi.importActual("../src/utils.js");
  return {
    ...actual,
    showSensitiveDomainWarning: vi.fn(() => Promise.resolve()),
  };
});

import {
  checkCookieInMap,
  canApplyCookieToCurrentDomain,
  updateToggleButtonState,
  setCookieForCurrentTab,
  removeCookieFromCurrentTab,
  saveCookie,
  deleteCookie,
  loadSavedCookies,
  createCookieElement,
} from "../src/modules/cookies.js";

function setupMinimalDOM() {
  document.body.innerHTML = `
    <div id="toast-container"></div>
    <div id="status-message"></div>
    <div id="form-validation-message"></div>
    <div id="currentDomain"></div>
    <div class="container">
      <div class="accordion">
        <div class="accordion-content">
          <div class="add-cookie-form">
            <input id="cookieName" />
            <input id="cookieValue" />
            <input id="cookieDomain" />
            <input id="cookiePath" value="/" />
            <input id="cookieExpiration" value="30" />
            <input id="isGlobalCookie" type="checkbox" checked />
          </div>
        </div>
      </div>
      <div class="saved-cookies-accordion">
        <div class="accordion-content" style="max-height:0;padding:0 15px;">
          <div class="saved-cookies-content"></div>
        </div>
      </div>
      <div id="cookiesList"></div>
    </div>
  `;
}

beforeEach(() => {
  setupMinimalDOM();
  Element.prototype.scrollIntoView = vi.fn();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// --- checkCookieInMap ---

describe("checkCookieInMap", () => {
  it("finds global cookie by exact domain key", () => {
    const map = new Map([["session:example.com:/", { name: "session" }]]);
    const saved = { name: "session", isGlobal: true, path: "/" };
    expect(checkCookieInMap(saved, map, "example.com")).toBe(true);
  });

  it("finds global cookie with dot-prefix domain key", () => {
    const map = new Map([["session:.example.com:/", { name: "session" }]]);
    const saved = { name: "session", isGlobal: true, path: "/" };
    expect(checkCookieInMap(saved, map, "example.com")).toBe(true);
  });

  it("finds domain-specific cookie by exact key", () => {
    const map = new Map([["token:api.test.com:/", { name: "token" }]]);
    const saved = { name: "token", isGlobal: false, domain: "api.test.com", path: "/" };
    expect(checkCookieInMap(saved, map, "other.com")).toBe(true);
  });

  it("returns false when cookie not in map", () => {
    const map = new Map([["other:example.com:/", { name: "other" }]]);
    const saved = { name: "session", isGlobal: true, path: "/" };
    expect(checkCookieInMap(saved, map, "example.com")).toBe(false);
  });

  it("matches cookie with root path fallback", () => {
    const map = new Map([["sid:example.com:/", { name: "sid" }]]);
    const saved = { name: "sid", isGlobal: true, path: "/app" };
    // path=/app won't match directly, but the fallback keys include :/ variants
    expect(checkCookieInMap(saved, map, "example.com")).toBe(true);
  });

  it("uses cookie path when it exists", () => {
    const map = new Map([["sid:example.com:/app", { name: "sid" }]]);
    const saved = { name: "sid", isGlobal: true, path: "/app" };
    expect(checkCookieInMap(saved, map, "example.com")).toBe(true);
  });

  it("defaults path to / when not specified", () => {
    const map = new Map([["sid:example.com:/", { name: "sid" }]]);
    const saved = { name: "sid", isGlobal: true };
    expect(checkCookieInMap(saved, map, "example.com")).toBe(true);
  });
});

// --- canApplyCookieToCurrentDomain ---

describe("canApplyCookieToCurrentDomain", () => {
  it("returns true for global cookie regardless of domain", () => {
    const cookie = { isGlobal: true, domain: "other.com" };
    expect(canApplyCookieToCurrentDomain(cookie, "anything.org")).toBe(true);
  });

  it("returns true for exact domain match", () => {
    const cookie = { isGlobal: false, domain: "example.com" };
    expect(canApplyCookieToCurrentDomain(cookie, "example.com")).toBe(true);
  });

  it("returns true for subdomain match with dot-prefix", () => {
    const cookie = { isGlobal: false, domain: ".example.com" };
    expect(canApplyCookieToCurrentDomain(cookie, "sub.example.com")).toBe(true);
  });

  it("returns true for deeply nested subdomain with dot-prefix", () => {
    const cookie = { isGlobal: false, domain: ".example.com" };
    expect(canApplyCookieToCurrentDomain(cookie, "a.b.example.com")).toBe(true);
  });

  it("returns false for non-matching domain", () => {
    const cookie = { isGlobal: false, domain: "other.com" };
    expect(canApplyCookieToCurrentDomain(cookie, "example.com")).toBe(false);
  });

  it("matches suffix without dot-boundary (known behavior)", () => {
    // endsWith("example.com") matches "notexample.com" — no dot-boundary check
    const cookie = { isGlobal: false, domain: ".example.com" };
    expect(canApplyCookieToCurrentDomain(cookie, "notexample.com")).toBe(true);
  });

  it("returns false when domain suffix does not match at all", () => {
    const cookie = { isGlobal: false, domain: ".test.com" };
    expect(canApplyCookieToCurrentDomain(cookie, "example.org")).toBe(false);
  });
});

// --- updateToggleButtonState ---

describe("updateToggleButtonState", () => {
  function setupToggleDOM(id) {
    document.body.innerHTML += `
      <div class="cookie-item" data-id="${id}">
        <button class="toggle-btn-full"></button>
      </div>
    `;
  }

  it("sets disabled state with Domain Mismatch text", () => {
    setupToggleDOM("c1");
    updateToggleButtonState("c1", false, true);

    const btn = document.querySelector('.cookie-item[data-id="c1"] .toggle-btn-full');
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toBe("Domain Mismatch");
    expect(btn.classList.contains("disabled")).toBe(true);
    expect(btn.classList.contains("cookie-exists")).toBe(false);
    expect(btn.classList.contains("cookie-missing")).toBe(false);
  });

  it("sets exists state with Remove text", () => {
    setupToggleDOM("c2");
    updateToggleButtonState("c2", true, false);

    const btn = document.querySelector('.cookie-item[data-id="c2"] .toggle-btn-full');
    expect(btn.disabled).toBe(false);
    expect(btn.textContent).toBe("Remove");
    expect(btn.classList.contains("cookie-exists")).toBe(true);
    expect(btn.classList.contains("cookie-missing")).toBe(false);
    expect(btn.classList.contains("disabled")).toBe(false);
  });

  it("sets missing state with Add text", () => {
    setupToggleDOM("c3");
    updateToggleButtonState("c3", false, false);

    const btn = document.querySelector('.cookie-item[data-id="c3"] .toggle-btn-full');
    expect(btn.disabled).toBe(false);
    expect(btn.textContent).toBe("Add");
    expect(btn.classList.contains("cookie-missing")).toBe(true);
    expect(btn.classList.contains("cookie-exists")).toBe(false);
  });

  it("does not throw when cookie item is missing from DOM", () => {
    expect(() => updateToggleButtonState("nonexistent", true, false)).not.toThrow();
  });

  it("transitions from disabled to exists correctly", () => {
    setupToggleDOM("c4");
    updateToggleButtonState("c4", false, true);
    updateToggleButtonState("c4", true, false);

    const btn = document.querySelector('.cookie-item[data-id="c4"] .toggle-btn-full');
    expect(btn.disabled).toBe(false);
    expect(btn.textContent).toBe("Remove");
    expect(btn.classList.contains("disabled")).toBe(false);
    expect(btn.classList.contains("cookie-exists")).toBe(true);
  });
});

// --- setCookieForCurrentTab ---

describe("setCookieForCurrentTab", () => {
  it("sets domain from tab URL for global cookie", () => {
    const cookie = { name: "sess", value: "abc", isGlobal: true, domain: "", path: "/", expirationDays: 30 };
    const tab = { url: "https://mysite.com/page" };

    setCookieForCurrentTab(cookie, tab);

    expect(chrome.cookies.set).toHaveBeenCalled();
    const callArgs = chrome.cookies.set.mock.calls[0][0];
    expect(callArgs.name).toBe("sess");
    expect(callArgs.url).toContain("mysite.com");
  });

  it("preserves original domain for non-global cookie", () => {
    const cookie = { name: "tok", value: "xyz", isGlobal: false, domain: "api.test.com", path: "/", expirationDays: 7 };
    const tab = { url: "https://api.test.com/v1" };

    setCookieForCurrentTab(cookie, tab);

    expect(chrome.cookies.set).toHaveBeenCalled();
    const callArgs = chrome.cookies.set.mock.calls[0][0];
    expect(callArgs.name).toBe("tok");
    expect(callArgs.url).toContain("api.test.com");
  });

  it("does not throw on invalid tab URL", () => {
    const cookie = { name: "x", value: "y", isGlobal: true, path: "/" };
    const tab = { url: "not-a-url" };
    expect(() => setCookieForCurrentTab(cookie, tab)).not.toThrow();
  });
});

// --- removeCookieFromCurrentTab ---

describe("removeCookieFromCurrentTab", () => {
  it("sets domain from tab for global cookie before removing", () => {
    const cookie = { name: "sess", value: "abc", isGlobal: true, domain: "", path: "/" };
    const tab = { url: "https://example.com/path" };

    removeCookieFromCurrentTab(cookie, tab);

    expect(chrome.cookies.remove).toHaveBeenCalled();
    const callArgs = chrome.cookies.remove.mock.calls[0][0];
    expect(callArgs.name).toBe("sess");
    expect(callArgs.url).toContain("example.com");
  });

  it("uses cookie domain for non-global cookie", () => {
    const cookie = { name: "tok", value: "x", isGlobal: false, domain: "specific.com", path: "/" };
    const tab = { url: "https://specific.com/" };

    removeCookieFromCurrentTab(cookie, tab);

    expect(chrome.cookies.remove).toHaveBeenCalled();
    const callArgs = chrome.cookies.remove.mock.calls[0][0];
    expect(callArgs.url).toContain("specific.com");
  });

  it("handles dot-prefix domain in URL construction", () => {
    const cookie = { name: "x", value: "v", isGlobal: false, domain: ".example.com", path: "/" };
    const tab = { url: "https://sub.example.com/" };

    removeCookieFromCurrentTab(cookie, tab);

    const callArgs = chrome.cookies.remove.mock.calls[0][0];
    expect(callArgs.url).toBe("https://example.com/");
  });
});

// --- saveCookie ---

describe("saveCookie", () => {
  it("saves a new global cookie to storage", async () => {
    saveCookie("myCookie", "myValue", "", "/", 30, true);
    await vi.advanceTimersByTimeAsync(0);

    const data = getStorageData();
    expect(data.savedCookies).toHaveLength(1);
    expect(data.savedCookies[0].name).toBe("myCookie");
    expect(data.savedCookies[0].isEncrypted).toBe(true);
    expect(data.savedCookies[0].isGlobal).toBe(true);
  });

  it("saves a domain-specific cookie to storage", async () => {
    saveCookie("token", "abc123", "api.test.com", "/api", 7, false);
    await vi.advanceTimersByTimeAsync(0);

    const data = getStorageData();
    expect(data.savedCookies).toHaveLength(1);
    expect(data.savedCookies[0].domain).toBe("api.test.com");
    expect(data.savedCookies[0].isGlobal).toBe(false);
  });

  it("updates existing cookie with same name (global)", async () => {
    seedStorage({
      savedCookies: [
        { id: "1", name: "myCookie", value: "old", isGlobal: true, path: "/", isEncrypted: false },
      ],
    });

    saveCookie("myCookie", "newValue", "", "/", 30, true);
    await vi.advanceTimersByTimeAsync(0);

    const data = getStorageData();
    expect(data.savedCookies).toHaveLength(1);
    expect(data.savedCookies[0].isEncrypted).toBe(true);
  });

  it("adds second cookie when names differ", async () => {
    seedStorage({
      savedCookies: [
        { id: "1", name: "first", value: "v1", isGlobal: true, path: "/", isEncrypted: false },
      ],
    });

    saveCookie("second", "v2", "", "/", 30, true);
    await vi.advanceTimersByTimeAsync(0);

    const data = getStorageData();
    expect(data.savedCookies).toHaveLength(2);
  });

  it("resets form fields after saving", async () => {
    document.getElementById("cookieName").value = "test";
    document.getElementById("cookieValue").value = "val";

    saveCookie("test", "val", "", "/", 30, true);
    await vi.advanceTimersByTimeAsync(0);

    expect(document.getElementById("cookieName").value).toBe("");
    expect(document.getElementById("cookieValue").value).toBe("");
    expect(document.getElementById("cookiePath").value).toBe("/");
    expect(document.getElementById("cookieExpiration").value).toBe("30");
  });

  it("collapses add-cookie accordion after save", async () => {
    const accordion = document.querySelector(".accordion");
    accordion.classList.add("active");

    saveCookie("test", "val", "", "/", 30, true);
    await vi.advanceTimersByTimeAsync(0);
    vi.advanceTimersByTime(200);

    expect(accordion.classList.contains("active")).toBe(false);
  });
});

// --- deleteCookie ---

describe("deleteCookie", () => {
  it("removes cookie from storage by id", () => {
    seedStorage({
      savedCookies: [
        { id: "abc", name: "sess", value: "v", isGlobal: false, domain: "example.com", path: "/" },
        { id: "def", name: "other", value: "w", isGlobal: true, path: "/" },
      ],
    });

    deleteCookie("abc");

    const data = getStorageData();
    expect(data.savedCookies).toHaveLength(1);
    expect(data.savedCookies[0].id).toBe("def");
  });

  it("calls removeCookie for non-global cookie", () => {
    seedStorage({
      savedCookies: [
        { id: "abc", name: "tok", value: "v", isGlobal: false, domain: "test.com", path: "/" },
      ],
    });

    deleteCookie("abc");

    expect(chrome.cookies.remove).toHaveBeenCalled();
  });

  it("calls removeCookieFromCurrentTab for global cookie via tabs.query", () => {
    seedStorage({
      savedCookies: [
        { id: "g1", name: "glob", value: "v", isGlobal: true, path: "/" },
      ],
    });

    deleteCookie("g1");

    expect(chrome.tabs.query).toHaveBeenCalled();
  });

  it("does nothing when cookie id is not found", () => {
    seedStorage({
      savedCookies: [
        { id: "keep", name: "a", value: "b", isGlobal: true, path: "/" },
      ],
    });

    deleteCookie("nonexistent");

    const data = getStorageData();
    expect(data.savedCookies).toHaveLength(1);
    expect(data.savedCookies[0].id).toBe("keep");
  });
});

// --- loadSavedCookies ---

describe("loadSavedCookies", () => {
  it("renders 'no cookies' message when storage is empty", () => {
    seedStorage({ savedCookies: [] });

    loadSavedCookies();

    const list = document.getElementById("cookiesList");
    expect(list.querySelector(".no-cookies-message")).not.toBeNull();
    expect(list.querySelector(".no-cookies-message").textContent).toBe("No saved cookies yet");
  });

  it("creates cookie elements for each saved cookie", () => {
    seedStorage({
      savedCookies: [
        { id: "1", name: "a", value: "va", isGlobal: true, path: "/", isEncrypted: false },
        { id: "2", name: "b", value: "vb", isGlobal: false, domain: "test.com", path: "/", isEncrypted: false },
      ],
    });

    loadSavedCookies();

    const items = document.querySelectorAll(".cookie-item");
    expect(items).toHaveLength(2);
  });

  it("clears previous items before rendering", () => {
    const list = document.getElementById("cookiesList");
    const old = document.createElement("div");
    old.className = "cookie-item";
    list.appendChild(old);

    seedStorage({
      savedCookies: [
        { id: "1", name: "a", value: "v", isGlobal: true, path: "/", isEncrypted: false },
      ],
    });

    loadSavedCookies();

    expect(document.querySelectorAll(".cookie-item")).toHaveLength(1);
  });

  it("opens saved-cookies-accordion when cookies exist", () => {
    seedStorage({
      savedCookies: [
        { id: "1", name: "a", value: "v", isGlobal: true, path: "/", isEncrypted: false },
      ],
    });

    loadSavedCookies();

    const acc = document.querySelector(".saved-cookies-accordion");
    expect(acc.classList.contains("active")).toBe(true);
  });

  it("opens add-cookie accordion when no cookies and it was closed", () => {
    const accordion = document.querySelector(".accordion");
    accordion.classList.remove("active");
    seedStorage({ savedCookies: [] });

    loadSavedCookies();

    expect(accordion.classList.contains("active")).toBe(true);
  });
});

// --- createCookieElement ---

describe("createCookieElement", () => {
  it("creates element with correct data-id", () => {
    const cookie = { id: "42", name: "test", value: "val", isGlobal: true, path: "/", isEncrypted: false };
    const el = createCookieElement(cookie);
    expect(el.dataset.id).toBe("42");
    expect(el.classList.contains("cookie-item")).toBe(true);
  });

  it("displays 'Global' for global cookies", () => {
    const cookie = { id: "1", name: "g", value: "v", isGlobal: true, path: "/", isEncrypted: false };
    const el = createCookieElement(cookie);
    expect(el.querySelector(".cookie-details").textContent).toContain("Global");
  });

  it("displays domain for non-global cookies", () => {
    const cookie = { id: "2", name: "d", value: "v", isGlobal: false, domain: "my.site.com", path: "/", isEncrypted: false };
    const el = createCookieElement(cookie);
    expect(el.querySelector(".cookie-details").textContent).toContain("my.site.com");
  });

  it("decrypts encrypted cookie for display", () => {
    const cookie = { id: "3", name: "enc", value: btoa("secret"), isGlobal: true, path: "/", isEncrypted: true };
    const el = createCookieElement(cookie);
    const valueSpan = el.querySelector(".clickable-value");
    expect(valueSpan.textContent).toContain("secret");
  });

  it("includes toggle, edit, and delete buttons", () => {
    const cookie = { id: "4", name: "x", value: "y", isGlobal: true, path: "/", isEncrypted: false };
    const el = createCookieElement(cookie);
    expect(el.querySelector(".toggle-btn-full")).not.toBeNull();
    expect(el.querySelector(".cookie-edit-btn-icon")).not.toBeNull();
    expect(el.querySelector(".delete-btn-icon")).not.toBeNull();
  });

  it("includes drag handle", () => {
    const cookie = { id: "5", name: "x", value: "y", isGlobal: true, path: "/", isEncrypted: false };
    const el = createCookieElement(cookie);
    expect(el.querySelector(".drag-handle")).not.toBeNull();
  });
});
