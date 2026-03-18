import { showToast, debugLog } from "./ui.js";
import { autoSyncCookieStates, updateToggleButtonState } from "./cookies.js";
import { encryptionHelpers } from "../utils.js";

const DEFAULT_GROUPS = [
  { id: "feature-flags", name: "Feature Flags", color: "#007bff" },
  { id: "auth", name: "Auth", color: "#dc3545" },
  { id: "logging", name: "Logging", color: "#28a745" },
];

export function loadGroups(callback) {
  chrome.storage.local.get(["cookieGroups"], function (result) {
    const groups = result.cookieGroups || [];
    callback(groups);
  });
}

export function saveGroups(groups, callback) {
  chrome.storage.local.set({ cookieGroups: groups }, function () {
    if (chrome.runtime.lastError) {
      showToast(`Error saving groups: ${chrome.runtime.lastError.message}`, "error");
      return;
    }
    if (callback) callback();
  });
}

export function createGroup(name, color, callback) {
  loadGroups(function (groups) {
    const duplicate = groups.find(
      (g) => g.name.toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      showToast(`Group "${name}" already exists`, "info");
      return;
    }

    const newGroup = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      name: name,
      color: color || "#6c757d",
      cookieIds: [],
    };

    groups.push(newGroup);
    saveGroups(groups, function () {
      showToast(`Group "${name}" created`, "success");
      debugLog(`Created group: ${name}`, "info");
      if (callback) callback(newGroup);
    });
  });
}

export function deleteGroup(groupId, callback) {
  loadGroups(function (groups) {
    const index = groups.findIndex((g) => g.id === groupId);
    if (index === -1) return;

    const name = groups[index].name;
    groups.splice(index, 1);
    saveGroups(groups, function () {
      showToast(`Group "${name}" deleted`, "success");
      if (callback) callback();
    });
  });
}

export function renameGroup(groupId, newName, callback) {
  loadGroups(function (groups) {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    group.name = newName;
    saveGroups(groups, function () {
      if (callback) callback();
    });
  });
}

export function assignCookieToGroup(groupId, cookieId, callback) {
  loadGroups(function (groups) {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    if (groups.some((g) => g.cookieIds.includes(cookieId))) {
      groups.forEach((g) => {
        g.cookieIds = g.cookieIds.filter((id) => id !== cookieId);
      });
    }

    if (!group.cookieIds.includes(cookieId)) {
      group.cookieIds.push(cookieId);
    }

    saveGroups(groups, function () {
      debugLog(`Assigned cookie ${cookieId} to group ${group.name}`, "info");
      if (callback) callback();
    });
  });
}

export function unassignCookieFromGroup(cookieId, callback) {
  loadGroups(function (groups) {
    let changed = false;
    groups.forEach((g) => {
      const idx = g.cookieIds.indexOf(cookieId);
      if (idx !== -1) {
        g.cookieIds.splice(idx, 1);
        changed = true;
      }
    });

    if (changed) {
      saveGroups(groups, callback);
    } else if (callback) {
      callback();
    }
  });
}

export function getGroupForCookie(cookieId, groups) {
  return groups.find((g) => g.cookieIds.includes(cookieId)) || null;
}

function getGroupCookiesContext(groupId, callback) {
  loadGroups(function (groups) {
    const group = groups.find((g) => g.id === groupId);
    if (!group || group.cookieIds.length === 0) {
      showToast("No cookies in this group", "info");
      return;
    }

    chrome.storage.local.get(["savedCookies"], function (result) {
      const savedCookies = result.savedCookies || [];

      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs[0] || !tabs[0].url) {
          showToast("No active tab", "error");
          return;
        }

        const tabUrl = tabs[0].url;
        const urlObj = new URL(tabUrl);
        const currentDomain = urlObj.hostname;

        const groupCookies = savedCookies.filter((c) =>
          group.cookieIds.includes(c.id)
        );

        if (groupCookies.length === 0) {
          showToast("No cookies in this group", "info");
          return;
        }

        callback({ group, groupCookies, urlObj, currentDomain, tabUrl });
      });
    });
  });
}

function buildCookieUrl(domain, path) {
  const protocol = domain.startsWith(".") ? "https" : "http";
  const urlDomain = domain.startsWith(".") ? domain.substring(1) : domain;
  return `${protocol}://${urlDomain}${path}`;
}

export function enableGroupCookies(groupId) {
  getGroupCookiesContext(groupId, function (ctx) {
    const { group, groupCookies, currentDomain } = ctx;
    let processed = 0;
    const total = groupCookies.length;

    groupCookies.forEach(function (saved) {
      const decrypted = saved.isEncrypted
        ? encryptionHelpers.decryptCookieValues(saved)
        : saved;
      const domain = decrypted.isGlobal ? currentDomain : decrypted.domain;
      const path = decrypted.path || "/";
      const cookieUrl = buildCookieUrl(domain, path);
      const expirationDate =
        Date.now() / 1000 + (decrypted.expirationDays || 30) * 86400;

      const sameSite = decrypted.sameSite || "unspecified";
      const isSecure = decrypted.secure || sameSite === "no_restriction" || false;
      const finalUrl = isSecure ? cookieUrl.replace(/^http:/, "https:") : cookieUrl;

      chrome.cookies.set(
        {
          url: finalUrl,
          name: decrypted.name,
          value: decrypted.value,
          path: path,
          domain: domain.startsWith(".") ? domain : null,
          secure: isSecure,
          httpOnly: decrypted.httpOnly || false,
          sameSite: sameSite,
          expirationDate: expirationDate,
        },
        function (result) {
          processed++;
          if (chrome.runtime.lastError) {
            debugLog(`Failed to set cookie ${decrypted.name}: ${chrome.runtime.lastError.message}`, "error");
          } else {
            updateToggleButtonState(saved.id, true, false);
          }
          if (processed === total) {
            showToast(
              `Group "${group.name}": enabled ${total} cookies`,
              "success"
            );
            setTimeout(() => autoSyncCookieStates(), 300);
          }
        }
      );
    });
  });
}

export function disableGroupCookies(groupId) {
  getGroupCookiesContext(groupId, function (ctx) {
    const { group, groupCookies, currentDomain } = ctx;
    let processed = 0;
    const total = groupCookies.length;

    groupCookies.forEach(function (saved) {
      const decrypted = saved.isEncrypted
        ? encryptionHelpers.decryptCookieValues(saved)
        : saved;
      const domain = decrypted.isGlobal ? currentDomain : decrypted.domain;
      const path = decrypted.path || "/";
      const cookieUrl = buildCookieUrl(domain, path);

      chrome.cookies.remove(
        { url: cookieUrl, name: decrypted.name },
        function () {
          processed++;
          if (chrome.runtime.lastError) {
            debugLog(`Failed to remove cookie ${decrypted.name}: ${chrome.runtime.lastError.message}`, "error");
          } else {
            updateToggleButtonState(saved.id, false, false);
          }
          if (processed === total) {
            showToast(
              `Group "${group.name}": disabled ${total} cookies`,
              "error"
            );
            setTimeout(() => autoSyncCookieStates(), 300);
          }
        }
      );
    });
  });
}

export function renderGroupsUI(container) {
  loadGroups(function (groups) {
    container.innerHTML = "";

    if (groups.length === 0) {
      container.innerHTML =
        '<div class="no-groups-message">No groups yet. Create one to organize your cookies.</div>';
      return;
    }

    chrome.storage.local.get(["savedCookies"], function (result) {
      const savedCookies = result.savedCookies || [];

      groups.forEach(function (group) {
        const el = document.createElement("div");
        el.className = "group-item";
        el.dataset.groupId = group.id;

        const badge = document.createElement("span");
        badge.className = "group-color-badge";
        badge.style.backgroundColor = group.color || "#6c757d";

        const nameSpan = document.createElement("span");
        nameSpan.className = "group-name";
        nameSpan.textContent = group.name;

        const count = group.cookieIds.filter((id) =>
          savedCookies.some((c) => c.id === id)
        ).length;
        const countSpan = document.createElement("span");
        countSpan.className = "group-cookie-count";
        countSpan.textContent = `(${count})`;

        const buttonsDiv = document.createElement("div");
        buttonsDiv.className = "group-buttons";

        const enableBtn = document.createElement("button");
        enableBtn.className = "group-enable-btn";
        enableBtn.dataset.groupId = group.id;
        enableBtn.textContent = "Enable";
        enableBtn.title = "Add all group cookies to current site";

        const disableBtn = document.createElement("button");
        disableBtn.className = "group-disable-btn";
        disableBtn.dataset.groupId = group.id;
        disableBtn.textContent = "Disable";
        disableBtn.title = "Remove all group cookies from current site";

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "group-delete-btn";
        deleteBtn.dataset.groupId = group.id;
        deleteBtn.title = "Delete this group";
        deleteBtn.textContent = "×";

        buttonsDiv.appendChild(enableBtn);
        buttonsDiv.appendChild(disableBtn);
        buttonsDiv.appendChild(deleteBtn);

        el.appendChild(badge);
        el.appendChild(nameSpan);
        el.appendChild(countSpan);
        el.appendChild(buttonsDiv);
        container.appendChild(el);
      });
    });
  });
}

export function updateGroupBadges() {
  loadGroups(function (groups) {
    const badges = document.querySelectorAll(".cookie-group-badge");
    badges.forEach(function (badge) {
      const cookieId = badge.dataset.cookieId;
      const group = getGroupForCookie(cookieId, groups);
      if (group) {
        badge.textContent = group.name;
        badge.style.backgroundColor = group.color;
        badge.style.display = "inline-block";
      } else {
        badge.textContent = "+group";
        badge.style.backgroundColor = "transparent";
        badge.style.display = "inline-block";
      }
    });
  });
}

export function showGroupAssignMenu(cookieId, anchorElement) {
  const existing = document.querySelector(".group-assign-dropdown");
  if (existing) existing.remove();

  loadGroups(function (groups) {
    const dropdown = document.createElement("div");
    dropdown.className = "group-assign-dropdown";

    const currentGroup = getGroupForCookie(cookieId, groups);

    if (currentGroup) {
      const unassignItem = document.createElement("div");
      unassignItem.className = "group-assign-item";
      unassignItem.textContent = "Remove from group";
      unassignItem.style.color = "#dc3545";
      unassignItem.addEventListener("click", function () {
        unassignCookieFromGroup(cookieId, function () {
          updateGroupBadges();
          renderGroupsUI(document.getElementById("groupsList"));
        });
        dropdown.remove();
      });
      dropdown.appendChild(unassignItem);
    }

    groups.forEach(function (group) {
      const item = document.createElement("div");
      item.className = "group-assign-item";
      if (currentGroup && currentGroup.id === group.id) {
        item.classList.add("active");
      }

      const colorDot = document.createElement("span");
      colorDot.className = "group-color-dot";
      colorDot.style.backgroundColor = group.color || "#6c757d";

      const nameSpan = document.createElement("span");
      nameSpan.textContent = group.name;

      item.appendChild(colorDot);
      item.appendChild(nameSpan);

      item.addEventListener("click", function () {
        assignCookieToGroup(group.id, cookieId, function () {
          updateGroupBadges();
          renderGroupsUI(document.getElementById("groupsList"));
        });
        dropdown.remove();
      });

      dropdown.appendChild(item);
    });

    if (groups.length === 0) {
      const empty = document.createElement("div");
      empty.className = "group-assign-item";
      empty.textContent = "No groups yet";
      empty.style.color = "#999";
      dropdown.appendChild(empty);
    }

    const rect = anchorElement.getBoundingClientRect();
    dropdown.style.position = "fixed";
    dropdown.style.top = rect.bottom + 2 + "px";
    dropdown.style.left = rect.left + "px";
    dropdown.style.zIndex = "1000";

    document.body.appendChild(dropdown);

    setTimeout(function () {
      function closeDropdown(e) {
        if (!dropdown.contains(e.target)) {
          dropdown.remove();
          document.removeEventListener("click", closeDropdown);
        }
      }
      document.addEventListener("click", closeDropdown);
    }, 10);
  });
}

export function initDefaultGroups(callback) {
  loadGroups(function (groups) {
    if (groups.length > 0) {
      if (callback) callback();
      return;
    }

    const defaults = DEFAULT_GROUPS.map((g) => ({ ...g, cookieIds: [] }));
    saveGroups(defaults, function () {
      debugLog("Initialized default groups", "info");
      if (callback) callback();
    });
  });
}
