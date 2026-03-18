/**
 * Chrome Extension API mock for Vitest.
 * Provides mock implementations for chrome.storage, chrome.cookies,
 * chrome.tabs, chrome.runtime, and chrome.browsingData.
 */

let storageData = {};
let cookiesData = [];
let listeners = {};

function createStorageArea() {
  return {
    get: vi.fn((keys, callback) => {
      if (typeof keys === "string") {
        callback({ [keys]: storageData[keys] });
      } else if (Array.isArray(keys)) {
        const result = {};
        keys.forEach((k) => {
          if (k in storageData) result[k] = storageData[k];
        });
        callback(result);
      } else if (keys === null || keys === undefined) {
        callback({ ...storageData });
      } else {
        const result = {};
        Object.keys(keys).forEach((k) => {
          result[k] = k in storageData ? storageData[k] : keys[k];
        });
        callback(result);
      }
    }),
    set: vi.fn((items, callback) => {
      Object.assign(storageData, items);
      if (callback) callback();
    }),
    remove: vi.fn((keys, callback) => {
      if (typeof keys === "string") {
        delete storageData[keys];
      } else {
        keys.forEach((k) => delete storageData[k]);
      }
      if (callback) callback();
    }),
    clear: vi.fn((callback) => {
      storageData = {};
      if (callback) callback();
    }),
  };
}

export function createChromeMock() {
  storageData = {};
  cookiesData = [];
  listeners = {};

  return {
    storage: {
      local: createStorageArea(),
      sync: createStorageArea(),
    },
    cookies: {
      get: vi.fn((details, callback) => {
        const found = cookiesData.find((c) => {
          if (details.name && c.name !== details.name) return false;
          if (details.url) {
            try {
              const url = new URL(details.url);
              return c.domain === url.hostname || c.domain === `.${url.hostname}`;
            } catch {
              return false;
            }
          }
          return true;
        });
        callback(found || null);
      }),
      getAll: vi.fn((details, callback) => {
        const filtered = cookiesData.filter((c) => {
          if (details.url) {
            try {
              const url = new URL(details.url);
              return c.domain === url.hostname || c.domain === `.${url.hostname}`;
            } catch {
              return false;
            }
          }
          if (details.domain) {
            return c.domain === details.domain || c.domain === `.${details.domain}`;
          }
          return true;
        });
        callback(filtered);
      }),
      set: vi.fn((details, callback) => {
        const existing = cookiesData.findIndex(
          (c) => c.name === details.name && c.domain === details.domain
        );
        const cookie = { ...details };
        if (existing >= 0) {
          cookiesData[existing] = cookie;
        } else {
          cookiesData.push(cookie);
        }
        if (callback) callback(cookie);
      }),
      remove: vi.fn((details, callback) => {
        cookiesData = cookiesData.filter(
          (c) => !(c.name === details.name && c.url === details.url)
        );
        if (callback) callback({ url: details.url, name: details.name });
      }),
    },
    tabs: {
      query: vi.fn((queryInfo, callback) => {
        callback([
          {
            id: 1,
            url: "https://example.com/path",
            title: "Example",
          },
        ]);
      }),
      sendMessage: vi.fn(),
    },
    runtime: {
      lastError: null,
      sendMessage: vi.fn((message, callback) => {
        if (callback) callback();
      }),
      onMessage: {
        addListener: vi.fn((fn) => {
          if (!listeners.onMessage) listeners.onMessage = [];
          listeners.onMessage.push(fn);
        }),
        removeListener: vi.fn(),
      },
      onInstalled: {
        addListener: vi.fn(),
      },
    },
    webNavigation: {
      getAllFrames: vi.fn((details, callback) => {
        callback([
          { frameId: 0, url: "https://example.com/path", parentFrameId: -1 },
        ]);
      }),
    },
    browsingData: {
      remove: vi.fn((options, dataToRemove, callback) => {
        if (callback) callback();
      }),
    },
  };
}

/**
 * Inject test cookies into the mock store.
 */
export function seedCookies(cookies) {
  cookiesData = [...cookies];
}

/**
 * Inject data into the mock chrome.storage.
 */
export function seedStorage(data) {
  Object.assign(storageData, data);
}

/**
 * Get current storage data (for assertions).
 */
export function getStorageData() {
  return { ...storageData };
}

/**
 * Reset all mock state.
 */
export function resetChromeMock() {
  storageData = {};
  cookiesData = [];
  listeners = {};
}
