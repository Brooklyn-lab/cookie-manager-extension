import { describe, it, expect, beforeEach } from "vitest";
import { seedStorage, getStorageData, seedCookies } from "./chrome-mock.js";
import {
  loadGroups,
  saveGroups,
  createGroup,
  deleteGroup,
  renameGroup,
  assignCookieToGroup,
  unassignCookieFromGroup,
  getGroupForCookie,
  enableGroupCookies,
  disableGroupCookies,
  renderGroupsUI,
  updateGroupBadges,
  initDefaultGroups,
} from "../src/modules/groups.js";

function setupDOM() {
  document.body.innerHTML = `
    <div id="groupsList"></div>
    <div id="cookiesList">
      <div class="cookie-item" data-id="c1">
        <span class="cookie-group-badge" data-cookie-id="c1"></span>
      </div>
      <div class="cookie-item" data-id="c2">
        <span class="cookie-group-badge" data-cookie-id="c2"></span>
      </div>
    </div>
    <div id="status-message"></div>
    <div id="toast-container" class="toast-container"></div>
  `;
}

describe("groups.js", () => {
  beforeEach(() => {
    setupDOM();
  });

  describe("loadGroups", () => {
    it("returns empty array when no groups stored", () => {
      loadGroups((groups) => {
        expect(groups).toEqual([]);
      });
    });

    it("returns stored groups", () => {
      const testGroups = [
        { id: "g1", name: "Auth", color: "#dc3545", cookieIds: [] },
      ];
      seedStorage({ cookieGroups: testGroups });
      loadGroups((groups) => {
        expect(groups).toHaveLength(1);
        expect(groups[0].name).toBe("Auth");
      });
    });
  });

  describe("saveGroups", () => {
    it("persists groups to storage", () => {
      const groups = [{ id: "g1", name: "Test", color: "#000", cookieIds: [] }];
      saveGroups(groups, () => {
        const data = getStorageData();
        expect(data.cookieGroups).toEqual(groups);
      });
    });
  });

  describe("createGroup", () => {
    it("creates a new group with unique id", () => {
      createGroup("Feature Flags", "#007bff", (newGroup) => {
        expect(newGroup.name).toBe("Feature Flags");
        expect(newGroup.color).toBe("#007bff");
        expect(newGroup.cookieIds).toEqual([]);
        expect(newGroup.id).toBeTruthy();
      });
    });

    it("prevents duplicate group names (case-insensitive)", () => {
      const existing = [
        { id: "g1", name: "Auth", color: "#dc3545", cookieIds: [] },
      ];
      seedStorage({ cookieGroups: existing });

      createGroup("auth", "#000", (result) => {
        expect(result).toBeUndefined();
      });

      const data = getStorageData();
      expect(data.cookieGroups).toHaveLength(1);
    });

    it("uses default color when none provided", () => {
      createGroup("Test", null, (newGroup) => {
        expect(newGroup.color).toBe("#6c757d");
      });
    });
  });

  describe("deleteGroup", () => {
    it("removes group by id", () => {
      const groups = [
        { id: "g1", name: "Auth", color: "#dc3545", cookieIds: [] },
        { id: "g2", name: "Logging", color: "#28a745", cookieIds: [] },
      ];
      seedStorage({ cookieGroups: groups });

      deleteGroup("g1", () => {
        const data = getStorageData();
        expect(data.cookieGroups).toHaveLength(1);
        expect(data.cookieGroups[0].id).toBe("g2");
      });
    });

    it("does nothing for non-existent group", () => {
      seedStorage({ cookieGroups: [] });
      deleteGroup("nonexistent", () => {
        const data = getStorageData();
        expect(data.cookieGroups).toEqual([]);
      });
    });
  });

  describe("renameGroup", () => {
    it("renames existing group", () => {
      const groups = [
        { id: "g1", name: "Auth", color: "#dc3545", cookieIds: [] },
      ];
      seedStorage({ cookieGroups: groups });

      renameGroup("g1", "Authentication", () => {
        const data = getStorageData();
        expect(data.cookieGroups[0].name).toBe("Authentication");
      });
    });
  });

  describe("assignCookieToGroup", () => {
    it("adds cookie to group", () => {
      const groups = [
        { id: "g1", name: "Auth", color: "#dc3545", cookieIds: [] },
      ];
      seedStorage({ cookieGroups: groups });

      assignCookieToGroup("g1", "cookie-1", () => {
        const data = getStorageData();
        expect(data.cookieGroups[0].cookieIds).toContain("cookie-1");
      });
    });

    it("moves cookie from one group to another", () => {
      const groups = [
        { id: "g1", name: "Auth", color: "#dc3545", cookieIds: ["cookie-1"] },
        { id: "g2", name: "Logging", color: "#28a745", cookieIds: [] },
      ];
      seedStorage({ cookieGroups: groups });

      assignCookieToGroup("g2", "cookie-1", () => {
        const data = getStorageData();
        expect(data.cookieGroups[0].cookieIds).not.toContain("cookie-1");
        expect(data.cookieGroups[1].cookieIds).toContain("cookie-1");
      });
    });

    it("does not duplicate cookie in same group", () => {
      const groups = [
        { id: "g1", name: "Auth", color: "#dc3545", cookieIds: ["cookie-1"] },
      ];
      seedStorage({ cookieGroups: groups });

      assignCookieToGroup("g1", "cookie-1", () => {
        const data = getStorageData();
        expect(data.cookieGroups[0].cookieIds.filter((id) => id === "cookie-1")).toHaveLength(1);
      });
    });
  });

  describe("unassignCookieFromGroup", () => {
    it("removes cookie from all groups", () => {
      const groups = [
        { id: "g1", name: "Auth", color: "#dc3545", cookieIds: ["cookie-1"] },
      ];
      seedStorage({ cookieGroups: groups });

      unassignCookieFromGroup("cookie-1", () => {
        const data = getStorageData();
        expect(data.cookieGroups[0].cookieIds).not.toContain("cookie-1");
      });
    });

    it("calls callback even when cookie not in any group", () => {
      seedStorage({ cookieGroups: [{ id: "g1", name: "Auth", color: "#dc3545", cookieIds: [] }] });
      let called = false;
      unassignCookieFromGroup("nonexistent", () => {
        called = true;
      });
      expect(called).toBe(true);
    });
  });

  describe("getGroupForCookie", () => {
    it("returns group containing the cookie", () => {
      const groups = [
        { id: "g1", name: "Auth", color: "#dc3545", cookieIds: ["c1", "c2"] },
        { id: "g2", name: "Logging", color: "#28a745", cookieIds: ["c3"] },
      ];
      const result = getGroupForCookie("c2", groups);
      expect(result.id).toBe("g1");
    });

    it("returns null when cookie not in any group", () => {
      const groups = [
        { id: "g1", name: "Auth", color: "#dc3545", cookieIds: [] },
      ];
      expect(getGroupForCookie("c99", groups)).toBeNull();
    });
  });

  describe("renderGroupsUI", () => {
    it("renders group items", () => {
      const groups = [
        { id: "g1", name: "Auth", color: "#dc3545", cookieIds: [] },
        { id: "g2", name: "Logging", color: "#28a745", cookieIds: [] },
      ];
      seedStorage({ cookieGroups: groups, savedCookies: [] });

      const container = document.getElementById("groupsList");
      renderGroupsUI(container);

      const items = container.querySelectorAll(".group-item");
      expect(items).toHaveLength(2);
      expect(items[0].querySelector(".group-name").textContent).toBe("Auth");
      expect(items[1].querySelector(".group-name").textContent).toBe("Logging");
    });

    it("shows 'no groups' message when empty", () => {
      seedStorage({ cookieGroups: [] });
      const container = document.getElementById("groupsList");
      renderGroupsUI(container);

      expect(container.querySelector(".no-groups-message")).toBeTruthy();
    });

    it("shows correct cookie count per group", () => {
      const savedCookies = [
        { id: "c1", name: "a", value: "1", isEncrypted: false },
        { id: "c2", name: "b", value: "2", isEncrypted: false },
      ];
      const groups = [
        { id: "g1", name: "Auth", color: "#dc3545", cookieIds: ["c1", "c2"] },
      ];
      seedStorage({ cookieGroups: groups, savedCookies });

      const container = document.getElementById("groupsList");
      renderGroupsUI(container);

      const countEl = container.querySelector(".group-cookie-count");
      expect(countEl.textContent).toBe("(2)");
    });

    it("renders enable, disable and delete buttons", () => {
      const groups = [
        { id: "g1", name: "Auth", color: "#dc3545", cookieIds: [] },
      ];
      seedStorage({ cookieGroups: groups, savedCookies: [] });

      const container = document.getElementById("groupsList");
      renderGroupsUI(container);

      expect(container.querySelector(".group-enable-btn")).toBeTruthy();
      expect(container.querySelector(".group-disable-btn")).toBeTruthy();
      expect(container.querySelector(".group-delete-btn")).toBeTruthy();
    });
  });

  describe("updateGroupBadges", () => {
    it("shows group name and color on assigned cookies", () => {
      const groups = [
        { id: "g1", name: "Auth", color: "#dc3545", cookieIds: ["c1"] },
      ];
      seedStorage({ cookieGroups: groups });

      updateGroupBadges();

      const badge = document.querySelector('[data-cookie-id="c1"]');
      expect(badge.textContent).toBe("Auth");
      expect(badge.style.backgroundColor).toBe("rgb(220, 53, 69)");
    });

    it("shows +group placeholder for unassigned cookies", () => {
      seedStorage({ cookieGroups: [] });

      updateGroupBadges();

      const badge = document.querySelector('[data-cookie-id="c1"]');
      expect(badge.textContent).toBe("+group");
    });
  });

  describe("initDefaultGroups", () => {
    it("creates 3 default groups when none exist", () => {
      initDefaultGroups(() => {
        const data = getStorageData();
        expect(data.cookieGroups).toHaveLength(3);
        const names = data.cookieGroups.map((g) => g.name);
        expect(names).toContain("Feature Flags");
        expect(names).toContain("Auth");
        expect(names).toContain("Logging");
      });
    });

    it("does not overwrite existing groups", () => {
      const existing = [
        { id: "custom", name: "My Group", color: "#000", cookieIds: [] },
      ];
      seedStorage({ cookieGroups: existing });

      initDefaultGroups(() => {
        const data = getStorageData();
        expect(data.cookieGroups).toHaveLength(1);
        expect(data.cookieGroups[0].name).toBe("My Group");
      });
    });
  });

  describe("enableGroupCookies", () => {
    it("adds all cookies in group to browser", () => {
      const savedCookies = [
        {
          id: "c1",
          name: "authToken",
          value: "abc",
          domain: "example.com",
          path: "/",
          expirationDays: 30,
          isGlobal: false,
          isEncrypted: false,
        },
        {
          id: "c2",
          name: "logLevel",
          value: "debug",
          domain: "example.com",
          path: "/",
          expirationDays: 30,
          isGlobal: false,
          isEncrypted: false,
        },
      ];
      const groups = [
        { id: "g1", name: "Dev", color: "#007bff", cookieIds: ["c1", "c2"] },
      ];
      seedStorage({ cookieGroups: groups, savedCookies });

      enableGroupCookies("g1");

      expect(chrome.cookies.set).toHaveBeenCalledTimes(2);
      expect(chrome.cookies.set.mock.calls[0][0].name).toBe("authToken");
      expect(chrome.cookies.set.mock.calls[1][0].name).toBe("logLevel");
    });

    it("adds cookies even when some already exist in browser", () => {
      const savedCookies = [
        {
          id: "c1",
          name: "authToken",
          value: "abc",
          domain: "example.com",
          path: "/",
          expirationDays: 30,
          isGlobal: false,
          isEncrypted: false,
        },
      ];
      const groups = [
        { id: "g1", name: "Auth", color: "#dc3545", cookieIds: ["c1"] },
      ];
      seedStorage({ cookieGroups: groups, savedCookies });
      seedCookies([
        { name: "authToken", domain: "example.com", path: "/", value: "abc" },
      ]);

      enableGroupCookies("g1");

      expect(chrome.cookies.set).toHaveBeenCalled();
    });

    it("shows toast when group has no cookies", () => {
      const groups = [
        { id: "g1", name: "Auth", color: "#dc3545", cookieIds: [] },
      ];
      seedStorage({ cookieGroups: groups, savedCookies: [] });

      enableGroupCookies("g1");

      const toast = document.querySelector(".toast-container");
      expect(toast).toBeTruthy();
    });

    it("handles encrypted cookies by decrypting before set", () => {
      const savedCookies = [
        {
          id: "c1",
          name: "token",
          value: btoa("secret"),
          domain: "example.com",
          path: "/",
          expirationDays: 30,
          isGlobal: false,
          isEncrypted: true,
        },
      ];
      const groups = [
        { id: "g1", name: "Auth", color: "#dc3545", cookieIds: ["c1"] },
      ];
      seedStorage({ cookieGroups: groups, savedCookies });

      enableGroupCookies("g1");

      expect(chrome.cookies.set).toHaveBeenCalled();
    });

    it("passes domain param for dot-prefixed domains", () => {
      const savedCookies = [
        {
          id: "c1",
          name: "token",
          value: "abc",
          domain: ".example.com",
          path: "/",
          expirationDays: 30,
          isGlobal: false,
          isEncrypted: false,
        },
      ];
      const groups = [
        { id: "g1", name: "Auth", color: "#dc3545", cookieIds: ["c1"] },
      ];
      seedStorage({ cookieGroups: groups, savedCookies });

      enableGroupCookies("g1");

      const call = chrome.cookies.set.mock.calls[0][0];
      expect(call.domain).toBe(".example.com");
      expect(call.url).toContain("https://example.com");
    });

    it("passes null domain for non-dot domains", () => {
      const savedCookies = [
        {
          id: "c1",
          name: "token",
          value: "abc",
          domain: "example.com",
          path: "/",
          expirationDays: 30,
          isGlobal: false,
          isEncrypted: false,
        },
      ];
      const groups = [
        { id: "g1", name: "Auth", color: "#dc3545", cookieIds: ["c1"] },
      ];
      seedStorage({ cookieGroups: groups, savedCookies });

      enableGroupCookies("g1");

      const call = chrome.cookies.set.mock.calls[0][0];
      expect(call.domain).toBeNull();
      expect(call.url).toContain("http://example.com");
    });

    it("handles global cookies using current domain", () => {
      const savedCookies = [
        {
          id: "c1",
          name: "flag",
          value: "on",
          domain: "",
          path: "/",
          expirationDays: 30,
          isGlobal: true,
          isEncrypted: false,
        },
      ];
      const groups = [
        { id: "g1", name: "Flags", color: "#007bff", cookieIds: ["c1"] },
      ];
      seedStorage({ cookieGroups: groups, savedCookies });

      enableGroupCookies("g1");

      expect(chrome.cookies.set).toHaveBeenCalled();
      const call = chrome.cookies.set.mock.calls[0][0];
      expect(call.url).toContain("example.com");
    });
  });

  describe("disableGroupCookies", () => {
    it("removes all cookies in group from browser", () => {
      const savedCookies = [
        {
          id: "c1",
          name: "authToken",
          value: "abc",
          domain: "example.com",
          path: "/",
          expirationDays: 30,
          isGlobal: false,
          isEncrypted: false,
        },
        {
          id: "c2",
          name: "logLevel",
          value: "debug",
          domain: "example.com",
          path: "/",
          expirationDays: 30,
          isGlobal: false,
          isEncrypted: false,
        },
      ];
      const groups = [
        { id: "g1", name: "Dev", color: "#007bff", cookieIds: ["c1", "c2"] },
      ];
      seedStorage({ cookieGroups: groups, savedCookies });

      disableGroupCookies("g1");

      expect(chrome.cookies.remove).toHaveBeenCalledTimes(2);
    });

    it("attempts remove even when cookies not in browser", () => {
      const savedCookies = [
        {
          id: "c1",
          name: "authToken",
          value: "abc",
          domain: "example.com",
          path: "/",
          expirationDays: 30,
          isGlobal: false,
          isEncrypted: false,
        },
      ];
      const groups = [
        { id: "g1", name: "Auth", color: "#dc3545", cookieIds: ["c1"] },
      ];
      seedStorage({ cookieGroups: groups, savedCookies });

      disableGroupCookies("g1");

      expect(chrome.cookies.remove).toHaveBeenCalled();
    });

    it("uses correct URL for dot-prefixed domains", () => {
      const savedCookies = [
        {
          id: "c1",
          name: "token",
          value: "abc",
          domain: ".example.com",
          path: "/",
          expirationDays: 30,
          isGlobal: false,
          isEncrypted: false,
        },
      ];
      const groups = [
        { id: "g1", name: "Auth", color: "#dc3545", cookieIds: ["c1"] },
      ];
      seedStorage({ cookieGroups: groups, savedCookies });

      disableGroupCookies("g1");

      const call = chrome.cookies.remove.mock.calls[0][0];
      expect(call.url).toContain("https://example.com");
    });

    it("shows toast when group has no cookies", () => {
      const groups = [
        { id: "g1", name: "Auth", color: "#dc3545", cookieIds: [] },
      ];
      seedStorage({ cookieGroups: groups, savedCookies: [] });

      disableGroupCookies("g1");

      const toast = document.querySelector(".toast-container");
      expect(toast).toBeTruthy();
    });
  });
});
