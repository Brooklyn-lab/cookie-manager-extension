import { describe, it, expect, vi, beforeEach } from "vitest";
import { seedStorage, getStorageData } from "./chrome-mock.js";
import { exportSavedCookies, importSavedCookies } from "../src/modules/import-export.js";

const origCreateElement = document.createElement.bind(document);

function getToasts() {
  return [...document.getElementById("toast-container").children].map((el) => ({
    text: el.textContent,
    type: el.className.replace("toast ", "").replace(" show", "").trim(),
  }));
}

function lastToast() {
  const toasts = getToasts();
  return toasts[toasts.length - 1];
}

function makeFile(data, name = "cookies.json") {
  const json = typeof data === "string" ? data : JSON.stringify(data);
  return new File([json], name, { type: "application/json" });
}

function validCookie(overrides = {}) {
  return {
    id: "c1",
    name: "session",
    value: "abc123",
    domain: ".example.com",
    path: "/",
    isEncrypted: false,
    isGlobal: true,
    expirationDays: 30,
    ...overrides,
  };
}

function validExportData(cookies) {
  return {
    version: "1.0",
    timestamp: new Date().toISOString(),
    cookieCount: cookies.length,
    cookies,
  };
}

function mockDownloadLink() {
  URL.createObjectURL = vi.fn(() => "blob:mock-url");
  URL.revokeObjectURL = vi.fn();

  const clickedLinks = [];
  vi.spyOn(document, "createElement").mockImplementation((tag) => {
    const el = origCreateElement(tag);
    if (tag === "a") {
      vi.spyOn(el, "click").mockImplementation(() => clickedLinks.push(el));
    }
    return el;
  });
  return clickedLinks;
}

beforeEach(() => {
  document.body.innerHTML = `
    <input id="importFileInput" />
    <div id="toast-container"></div>
    <div id="status-message"></div>
    <div class="accordion"><div class="add-cookie-form"></div></div>
  `;
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

// --------------- exportSavedCookies ---------------

describe("exportSavedCookies", () => {
  it("shows info toast when storage has no saved cookies", () => {
    exportSavedCookies();
    expect(lastToast()).toEqual({ text: "No saved cookies to export", type: "info" });
  });

  it("shows error toast when chrome.runtime.lastError is set", () => {
    chrome.runtime.lastError = { message: "quota exceeded" };
    exportSavedCookies();
    expect(lastToast().text).toContain("quota exceeded");
    expect(lastToast().type).toBe("error");
    chrome.runtime.lastError = null;
  });

  it("creates correct JSON export structure", () => {
    const cookie = validCookie();
    seedStorage({ savedCookies: [cookie] });

    let blobContent;
    URL.createObjectURL = vi.fn((blob) => {
      blobContent = blob;
      return "blob:mock";
    });
    URL.revokeObjectURL = vi.fn();

    const clickedLinks = [];
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      const el = origCreateElement(tag);
      if (tag === "a") {
        vi.spyOn(el, "click").mockImplementation(() => clickedLinks.push(el));
      }
      return el;
    });

    exportSavedCookies();

    expect(blobContent).toBeInstanceOf(Blob);
    return blobContent.text().then((text) => {
      const data = JSON.parse(text);
      expect(data.version).toBe("1.0");
      expect(data.timestamp).toBeDefined();
      expect(data.cookieCount).toBe(1);
      expect(data.cookies).toHaveLength(1);
      expect(data.cookies[0].name).toBe("session");
    });
  });

  it("decrypts encrypted cookies before export", () => {
    const encrypted = {
      ...validCookie(),
      value: btoa("secret-value"),
      isEncrypted: true,
    };
    seedStorage({ savedCookies: [encrypted] });

    let blobContent;
    URL.createObjectURL = vi.fn((blob) => {
      blobContent = blob;
      return "blob:mock";
    });
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      const el = origCreateElement(tag);
      if (tag === "a") vi.spyOn(el, "click").mockImplementation(() => {});
      return el;
    });

    exportSavedCookies();

    return blobContent.text().then((text) => {
      const data = JSON.parse(text);
      expect(data.cookies[0].value).toBe("secret-value");
      expect(data.cookies[0].isEncrypted).toBe(false);
    });
  });

  it("creates and clicks a download link", () => {
    seedStorage({ savedCookies: [validCookie()] });

    const clickedLinks = mockDownloadLink();

    exportSavedCookies();

    expect(clickedLinks).toHaveLength(1);
    expect(clickedLinks[0].href).toBe("blob:mock-url");
    expect(clickedLinks[0].download).toMatch(/^cookies-export-\d{4}-\d{2}-\d{2}\.json$/);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("handles decrypt failure gracefully — exports cookie with isEncrypted: false", () => {
    const badEncrypted = {
      ...validCookie(),
      value: "not-valid-base64!!!",
      isEncrypted: true,
    };
    seedStorage({ savedCookies: [badEncrypted] });

    let blobContent;
    URL.createObjectURL = vi.fn((blob) => {
      blobContent = blob;
      return "blob:mock";
    });
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      const el = origCreateElement(tag);
      if (tag === "a") vi.spyOn(el, "click").mockImplementation(() => {});
      return el;
    });

    exportSavedCookies();

    expect(lastToast().text).toContain("Exported 1 cookies");
    return blobContent.text().then((text) => {
      const data = JSON.parse(text);
      expect(data.cookies[0].isEncrypted).toBe(false);
    });
  });

  it("shows success toast with correct count", () => {
    seedStorage({ savedCookies: [validCookie(), validCookie({ id: "c2", name: "token" })] });
    mockDownloadLink();

    exportSavedCookies();
    expect(lastToast()).toEqual({ text: "Exported 2 cookies", type: "success" });
  });
});

// --------------- importSavedCookies ---------------

describe("importSavedCookies", () => {
  it("shows error for null file", () => {
    importSavedCookies(null, { onComplete: vi.fn() });
    expect(lastToast()).toEqual({ text: "No file selected", type: "error" });
  });

  it("shows error for non-JSON file", () => {
    const file = new File(["data"], "cookies.txt", { type: "text/plain" });
    importSavedCookies(file, { onComplete: vi.fn() });
    expect(lastToast()).toEqual({ text: "Please select a JSON file", type: "error" });
  });

  it("shows error for invalid JSON content", async () => {
    const file = new File(["not json{{{"], "cookies.json", { type: "application/json" });
    importSavedCookies(file, { onComplete: vi.fn() });

    await vi.waitFor(() => {
      expect(lastToast().type).toBe("error");
      expect(lastToast().text).toContain("Error reading file");
    });
  });

  it("shows error for missing cookies array", async () => {
    const file = makeFile({ version: "1.0" });
    importSavedCookies(file, { onComplete: vi.fn() });

    await vi.waitFor(() => {
      expect(lastToast().text).toContain("No valid cookies array found");
    });
  });

  it("shows info toast for empty cookies array", async () => {
    const file = makeFile(validExportData([]));
    importSavedCookies(file, { onComplete: vi.fn() });

    await vi.waitFor(() => {
      expect(lastToast()).toEqual({ text: "No cookies found in file", type: "info" });
    });
  });

  it("rejects cookie with missing id", async () => {
    const cookie = validCookie();
    delete cookie.id;
    const file = makeFile(validExportData([cookie]));
    importSavedCookies(file, { onComplete: vi.fn() });

    await vi.waitFor(() => {
      expect(lastToast().text).toContain("missing or invalid id");
    });
  });

  it("rejects cookie with missing name", async () => {
    const cookie = validCookie({ name: "" });
    const file = makeFile(validExportData([cookie]));
    importSavedCookies(file, { onComplete: vi.fn() });

    await vi.waitFor(() => {
      expect(lastToast().text).toContain("missing or invalid name");
    });
  });

  it("rejects cookie with missing value", async () => {
    const cookie = validCookie();
    delete cookie.value;
    const file = makeFile(validExportData([cookie]));
    importSavedCookies(file, { onComplete: vi.fn() });

    await vi.waitFor(() => {
      expect(lastToast().text).toContain("missing or invalid value");
    });
  });

  it("rejects cookie with URL in path", async () => {
    const cookie = validCookie({ path: "https://example.com/path" });
    const file = makeFile(validExportData([cookie]));
    importSavedCookies(file, { onComplete: vi.fn() });

    await vi.waitFor(() => {
      expect(lastToast().text).toContain("invalid path format");
    });
  });

  it("rejects cookie with URL in domain", async () => {
    const cookie = validCookie({ domain: "https://example.com" });
    const file = makeFile(validExportData([cookie]));
    importSavedCookies(file, { onComplete: vi.fn() });

    await vi.waitFor(() => {
      expect(lastToast().text).toContain("invalid domain format");
    });
  });

  it("skips duplicate cookies and shows skip count", async () => {
    const existing = validCookie({ name: "existing" });
    seedStorage({ savedCookies: [existing] });

    const cookies = [
      validCookie({ id: "new1", name: "existing" }),
      validCookie({ id: "new2", name: "fresh" }),
    ];
    const file = makeFile(validExportData(cookies));
    const onComplete = vi.fn();
    importSavedCookies(file, { onComplete });

    await vi.waitFor(() => {
      expect(lastToast().text).toContain("Imported 1 cookies");
      expect(lastToast().text).toContain("1 skipped");
      expect(lastToast().text).toContain("existing");
    });
  });

  it("shows message when all cookies are duplicates", async () => {
    seedStorage({ savedCookies: [validCookie({ name: "dup" })] });
    const file = makeFile(validExportData([validCookie({ id: "x", name: "dup" })]));
    importSavedCookies(file, { onComplete: vi.fn() });

    await vi.waitFor(() => {
      expect(lastToast().text).toContain("All cookies already exist");
      expect(lastToast().type).toBe("info");
    });
  });

  it("imports only new cookies and merges with existing", async () => {
    const existing = validCookie({ name: "old" });
    seedStorage({ savedCookies: [existing] });

    const file = makeFile(validExportData([validCookie({ id: "n1", name: "new_cookie" })]));
    const onComplete = vi.fn();
    importSavedCookies(file, { onComplete });

    await vi.waitFor(() => {
      const data = getStorageData();
      expect(data.savedCookies).toHaveLength(2);
      expect(data.savedCookies[0].name).toBe("old");
      expect(data.savedCookies[1].name).toBe("new_cookie");
    });
  });

  it("encrypts cookies before saving", async () => {
    const file = makeFile(validExportData([validCookie({ value: "plain-text" })]));
    importSavedCookies(file, { onComplete: vi.fn() });

    await vi.waitFor(() => {
      const data = getStorageData();
      expect(data.savedCookies).toHaveLength(1);
      expect(data.savedCookies[0].isEncrypted).toBe(true);
      expect(data.savedCookies[0].value).toBe(btoa("plain-text"));
    });
  });

  it("calls onComplete callback after successful import", async () => {
    const file = makeFile(validExportData([validCookie()]));
    const onComplete = vi.fn();
    importSavedCookies(file, { onComplete });

    await vi.waitFor(() => {
      expect(onComplete).toHaveBeenCalledOnce();
    });
  });

  it("sets default values for missing optional fields", async () => {
    const minimal = { id: "m1", name: "minimal", value: "v" };
    const file = makeFile(validExportData([minimal]));
    importSavedCookies(file, { onComplete: vi.fn() });

    await vi.waitFor(() => {
      const data = getStorageData();
      const saved = data.savedCookies[0];
      expect(saved.expirationDays).toBe(30);
      expect(saved.path).toBe("/");
      expect(saved.isGlobal).toBe(true);
    });
  });

  it("resets file input after successful import", async () => {
    const input = document.getElementById("importFileInput");
    input.value = "C:\\fakepath\\cookies.json";

    const file = makeFile(validExportData([validCookie()]));
    importSavedCookies(file, { onComplete: vi.fn() });

    await vi.waitFor(() => {
      expect(input.value).toBe("");
    });
  });
});
