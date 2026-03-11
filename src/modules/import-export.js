import { encryptionHelpers } from "../utils.js";
import { showToast, debugLog } from "./ui.js";

export function exportSavedCookies() {
  chrome.storage.local.get(["savedCookies"], function (result) {
    if (chrome.runtime.lastError) {
      showToast(`Error reading cookies: ${chrome.runtime.lastError.message}`, "error");
      return;
    }

    const savedCookies = result.savedCookies || [];
    if (savedCookies.length === 0) {
      showToast("No saved cookies to export", "info");
      return;
    }

    const decryptedCookies = savedCookies.map((cookie) => {
      try {
        return cookie.isEncrypted
          ? encryptionHelpers.decryptCookieValues(cookie)
          : cookie;
      } catch (error) {
        debugLog(`Failed to decrypt cookie for export: ${error.message}`, "error");
        return { ...cookie, isEncrypted: false };
      }
    });

    const exportData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      cookieCount: decryptedCookies.length,
      cookies: decryptedCookies,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cookies-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Exported ${savedCookies.length} cookies`, "success");
    debugLog(`Exported ${savedCookies.length} cookies to file`, "info");
  });
}

export function importSavedCookies(file, { onComplete }) {
  if (!file) {
    showToast("No file selected", "error");
    return;
  }

  if (!file.name.toLowerCase().endsWith(".json")) {
    showToast("Please select a JSON file", "error");
    return;
  }

  const importFileInput = document.getElementById("importFileInput");
  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const importData = JSON.parse(e.target.result);

      if (!importData || typeof importData !== "object") {
        throw new Error("Invalid file structure");
      }
      if (!importData.cookies || !Array.isArray(importData.cookies)) {
        throw new Error("No valid cookies array found");
      }

      const importedCookies = importData.cookies;
      if (importedCookies.length === 0) {
        showToast("No cookies found in file", "info");
        return;
      }

      const invalidCookies = [];
      for (let i = 0; i < importedCookies.length; i++) {
        const cookie = importedCookies[i];
        const errors = [];

        if (!cookie.id || typeof cookie.id !== "string") errors.push("missing or invalid id");
        if (!cookie.name || typeof cookie.name !== "string" || cookie.name.trim() === "") {
          errors.push("missing or invalid name");
        }
        if (cookie.value === undefined || typeof cookie.value !== "string") {
          errors.push("missing or invalid value");
        }
        if (cookie.path && typeof cookie.path === "string") {
          if (cookie.path.includes("://") || (!cookie.path.startsWith("/") && cookie.path !== "")) {
            errors.push(`invalid path format: "${cookie.path}"`);
          }
        }
        if (cookie.domain && typeof cookie.domain === "string") {
          if (cookie.domain.includes("://")) {
            errors.push(`invalid domain format: "${cookie.domain}"`);
          }
        }
        if (errors.length > 0) {
          invalidCookies.push(`Cookie ${i + 1} (${cookie.name || "unnamed"}): ${errors.join(", ")}`);
        }
      }

      if (invalidCookies.length > 0) {
        throw new Error(`Invalid cookie data found:\n${invalidCookies.join("\n")}`);
      }

      chrome.storage.local.get(["savedCookies"], function (result) {
        if (chrome.runtime.lastError) {
          showToast(`Error reading existing cookies: ${chrome.runtime.lastError.message}`, "error");
          importFileInput.value = "";
          return;
        }

        const existingCookies = result.savedCookies || [];
        const existingNames = new Set(existingCookies.map((c) => c.name));

        const duplicates = importedCookies.filter((cookie) => existingNames.has(cookie.name));
        const newCookies = importedCookies.filter((cookie) => !existingNames.has(cookie.name));

        if (newCookies.length === 0) {
          const duplicateNames = duplicates.map((c) => c.name).join(", ");
          showToast(`All cookies already exist: ${duplicateNames}`, "info");
          importFileInput.value = "";
          return;
        }

        const cookiesWithNewIds = newCookies.map((cookie) => {
          const cookieWithId = {
            ...cookie,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            isEncrypted: false,
            expirationDays: cookie.expirationDays || 30,
            domain: cookie.domain || null,
            path: cookie.path || "/",
            isGlobal: cookie.isGlobal !== undefined ? cookie.isGlobal : true,
          };
          try {
            return encryptionHelpers.encryptCookieValues(cookieWithId);
          } catch (error) {
            debugLog(`Failed to encrypt imported cookie: ${error.message}`, "error");
            return cookieWithId;
          }
        });

        const mergedCookies = [...existingCookies, ...cookiesWithNewIds];

        chrome.storage.local.set({ savedCookies: mergedCookies }, function () {
          if (chrome.runtime.lastError) {
            showToast(`Error saving cookies: ${chrome.runtime.lastError.message}`, "error");
            return;
          }

          importFileInput.value = "";
          if (onComplete) onComplete();

          const skippedCount = importedCookies.length - newCookies.length;
          let message = `Imported ${newCookies.length} cookies`;
          if (skippedCount > 0) {
            const skippedNames = duplicates.map((c) => c.name).join(", ");
            message += ` (${skippedCount} skipped: ${skippedNames})`;
          }
          showToast(message, "success");
          debugLog(`Imported ${newCookies.length} new cookies, skipped ${skippedCount}`, "info");
        });
      });
    } catch (error) {
      showToast(`Error reading file: ${error.message}`, "error");
      debugLog(`Import error: ${error.message}`, "error");
    }
  };

  reader.onerror = function () {
    showToast("Error reading file", "error");
  };

  reader.readAsText(file);
}
