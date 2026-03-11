import { describe, it, expect } from "vitest";

describe("Test infrastructure", () => {
  it("chrome mock is available", () => {
    expect(global.chrome).toBeDefined();
    expect(global.chrome.storage.local.get).toBeDefined();
    expect(global.chrome.cookies.getAll).toBeDefined();
    expect(global.chrome.tabs.query).toBeDefined();
    expect(global.chrome.runtime.sendMessage).toBeDefined();
  });

  it("chrome.storage.local set/get works", () => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ key: "value" }, () => {
        chrome.storage.local.get("key", (result) => {
          expect(result.key).toBe("value");
          resolve();
        });
      });
    });
  });

  it("chrome.tabs.query returns mock tab", () => {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true }, (tabs) => {
        expect(tabs).toHaveLength(1);
        expect(tabs[0].url).toBe("https://example.com/path");
        resolve();
      });
    });
  });
});
