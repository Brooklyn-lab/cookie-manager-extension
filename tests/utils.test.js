import { describe, it, expect } from "vitest";
import {
  encryptionHelpers,
  validateCookieName,
  validateCookieValue,
  validateCookieDomain,
  validateCookiePath,
  validateExpirationDays,
  showSensitiveDomainWarning,
} from "../src/utils.js";

// --- encryptionHelpers ---

describe("encryptionHelpers", () => {
  describe("encryptCookieValues", () => {
    it("encrypts a plain cookie value with base64", () => {
      const cookie = { name: "test", value: "hello", isEncrypted: false };
      const result = encryptionHelpers.encryptCookieValues(cookie);
      expect(result.value).toBe(btoa("hello"));
      expect(result.isEncrypted).toBe(true);
    });

    it("does not double-encrypt an already encrypted cookie", () => {
      const cookie = { name: "test", value: btoa("hello"), isEncrypted: true };
      const result = encryptionHelpers.encryptCookieValues(cookie);
      expect(result.value).toBe(btoa("hello"));
      expect(result.isEncrypted).toBe(true);
    });

    it("does not mutate the original cookie object", () => {
      const cookie = { name: "test", value: "hello", isEncrypted: false };
      const result = encryptionHelpers.encryptCookieValues(cookie);
      expect(cookie.value).toBe("hello");
      expect(cookie.isEncrypted).toBe(false);
      expect(result).not.toBe(cookie);
    });

    it("handles special characters", () => {
      const cookie = { name: "test", value: "héllo wörld <>&", isEncrypted: false };
      const result = encryptionHelpers.encryptCookieValues(cookie);
      expect(result.isEncrypted).toBe(true);
      const decrypted = encryptionHelpers.decryptCookieValues(result);
      expect(decrypted.value).toBe("héllo wörld <>&");
    });

    it("handles empty string value", () => {
      const cookie = { name: "test", value: "", isEncrypted: false };
      const result = encryptionHelpers.encryptCookieValues(cookie);
      expect(result.value).toBe(btoa(""));
      expect(result.isEncrypted).toBe(true);
    });
  });

  describe("decryptCookieValues", () => {
    it("decrypts a base64-encoded cookie value", () => {
      const cookie = { name: "test", value: btoa("secret"), isEncrypted: true };
      const result = encryptionHelpers.decryptCookieValues(cookie);
      expect(result.value).toBe("secret");
      expect(result.isEncrypted).toBe(false);
    });

    it("returns cookie as-is if not encrypted", () => {
      const cookie = { name: "test", value: "plain", isEncrypted: false };
      const result = encryptionHelpers.decryptCookieValues(cookie);
      expect(result.value).toBe("plain");
      expect(result.isEncrypted).toBe(false);
    });

    it("handles invalid base64 gracefully", () => {
      const cookie = { name: "test", value: "not-valid-base64!!!", isEncrypted: true };
      const result = encryptionHelpers.decryptCookieValues(cookie);
      expect(result.value).toBe("not-valid-base64!!!");
      expect(result.isEncrypted).toBe(false);
    });

    it("handles empty string value when encrypted", () => {
      const cookie = { name: "test", value: "", isEncrypted: true };
      const result = encryptionHelpers.decryptCookieValues(cookie);
      expect(result.value).toBe("");
      expect(result.isEncrypted).toBe(false);
    });

    it("handles null value gracefully", () => {
      const cookie = { name: "test", value: null, isEncrypted: true };
      const result = encryptionHelpers.decryptCookieValues(cookie);
      expect(result.value).toBe(null);
      expect(result.isEncrypted).toBe(false);
    });

    it("does not mutate the original cookie object", () => {
      const cookie = { name: "test", value: btoa("secret"), isEncrypted: true };
      encryptionHelpers.decryptCookieValues(cookie);
      expect(cookie.isEncrypted).toBe(true);
    });
  });

  describe("encrypt/decrypt roundtrip", () => {
    it("preserves value through encrypt → decrypt cycle", () => {
      const original = { name: "sess", value: "abc123!@#", isEncrypted: false };
      const encrypted = encryptionHelpers.encryptCookieValues(original);
      const decrypted = encryptionHelpers.decryptCookieValues(encrypted);
      expect(decrypted.value).toBe("abc123!@#");
      expect(decrypted.isEncrypted).toBe(false);
    });

    it("preserves JSON value through roundtrip", () => {
      const jsonValue = JSON.stringify({ token: "abc", role: "admin" });
      const original = { name: "data", value: jsonValue, isEncrypted: false };
      const encrypted = encryptionHelpers.encryptCookieValues(original);
      const decrypted = encryptionHelpers.decryptCookieValues(encrypted);
      expect(JSON.parse(decrypted.value)).toEqual({ token: "abc", role: "admin" });
    });
  });
});

// --- validateCookieName ---

describe("validateCookieName", () => {
  it("rejects empty name", () => {
    expect(validateCookieName("")).toEqual({
      valid: false,
      message: "Please specify cookie name",
    });
  });

  it("rejects null/undefined", () => {
    expect(validateCookieName(null).valid).toBe(false);
    expect(validateCookieName(undefined).valid).toBe(false);
  });

  it("accepts valid ASCII name", () => {
    expect(validateCookieName("session_id")).toEqual({ valid: true });
  });

  it("accepts hyphens and underscores", () => {
    expect(validateCookieName("my-cookie_v2").valid).toBe(true);
  });

  it("rejects name longer than 150 chars", () => {
    const longName = "a".repeat(151);
    const result = validateCookieName(longName);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("too long");
  });

  it("accepts name exactly 150 chars", () => {
    expect(validateCookieName("a".repeat(150)).valid).toBe(true);
  });

  it("rejects name with HTML angle brackets", () => {
    expect(validateCookieName("test<script>").valid).toBe(false);
    expect(validateCookieName("test>value").valid).toBe(false);
  });

  it("rejects name with quotes", () => {
    expect(validateCookieName('test"name').valid).toBe(false);
    expect(validateCookieName("test'name").valid).toBe(false);
  });

  it("rejects name with ampersand", () => {
    expect(validateCookieName("test&name").valid).toBe(false);
  });

  it("rejects name with spaces", () => {
    expect(validateCookieName("cookie name").valid).toBe(false);
  });

  it("allows equals sign in name (current behavior)", () => {
    expect(validateCookieName("key=value").valid).toBe(true);
  });
});

// --- validateCookieValue ---

describe("validateCookieValue", () => {
  it("rejects empty string", () => {
    expect(validateCookieValue("").valid).toBe(false);
  });

  it("rejects null and undefined", () => {
    expect(validateCookieValue(null).valid).toBe(false);
    expect(validateCookieValue(undefined).valid).toBe(false);
  });

  it("accepts valid value", () => {
    expect(validateCookieValue("abc123")).toEqual({ valid: true });
  });

  it("rejects value longer than 4000 chars", () => {
    const result = validateCookieValue("x".repeat(4001));
    expect(result.valid).toBe(false);
    expect(result.message).toContain("too long");
  });

  it("accepts value exactly 4000 chars", () => {
    expect(validateCookieValue("x".repeat(4000)).valid).toBe(true);
  });

  it("rejects value with script tags", () => {
    expect(validateCookieValue('<script>alert("xss")</script>').valid).toBe(false);
    expect(validateCookieValue("test</script>end").valid).toBe(false);
  });

  it("accepts value with regular HTML (non-script)", () => {
    expect(validateCookieValue("<div>content</div>").valid).toBe(true);
  });

  it("accepts JSON value", () => {
    expect(validateCookieValue('{"key":"value"}').valid).toBe(true);
  });
});

// --- validateCookieDomain ---

describe("validateCookieDomain", () => {
  it("accepts any domain when isGlobal is true", () => {
    expect(validateCookieDomain("anything", true)).toEqual({ valid: true });
    expect(validateCookieDomain("", true)).toEqual({ valid: true });
  });

  it("accepts empty domain (uses current tab)", () => {
    expect(validateCookieDomain("", false)).toEqual({ valid: true });
    expect(validateCookieDomain(null, false)).toEqual({ valid: true });
    expect(validateCookieDomain(undefined, false)).toEqual({ valid: true });
  });

  it("accepts valid domain", () => {
    expect(validateCookieDomain("example.com", false).valid).toBe(true);
  });

  it("accepts domain with leading dot", () => {
    expect(validateCookieDomain(".example.com", false).valid).toBe(true);
  });

  it("accepts subdomain", () => {
    expect(validateCookieDomain("sub.example.com", false).valid).toBe(true);
  });

  it("rejects single-label domain", () => {
    expect(validateCookieDomain("localhost", false).valid).toBe(false);
  });

  it("rejects domain with spaces", () => {
    expect(validateCookieDomain("example .com", false).valid).toBe(false);
  });

  it("rejects domain with protocol", () => {
    expect(validateCookieDomain("https://example.com", false).valid).toBe(false);
  });
});

// --- validateCookiePath ---

describe("validateCookiePath", () => {
  it("rejects empty path", () => {
    expect(validateCookiePath("").valid).toBe(false);
  });

  it("rejects null/undefined", () => {
    expect(validateCookiePath(null).valid).toBe(false);
    expect(validateCookiePath(undefined).valid).toBe(false);
  });

  it("accepts root path", () => {
    expect(validateCookiePath("/")).toEqual({ valid: true });
  });

  it("accepts nested path", () => {
    expect(validateCookiePath("/api/v2/users").valid).toBe(true);
  });

  it("rejects path not starting with /", () => {
    const result = validateCookiePath("api/v2");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("start with /");
  });
});

// --- validateExpirationDays ---

describe("validateExpirationDays", () => {
  it("returns default 30 for empty/null/undefined", () => {
    expect(validateExpirationDays("")).toEqual({ valid: true, value: 30 });
    expect(validateExpirationDays(null)).toEqual({ valid: true, value: 30 });
    expect(validateExpirationDays(undefined)).toEqual({ valid: true, value: 30 });
  });

  it("returns default 30 for NaN", () => {
    expect(validateExpirationDays("abc")).toEqual({ valid: true, value: 30 });
  });

  it("accepts valid positive number", () => {
    expect(validateExpirationDays("90")).toEqual({ valid: true, value: 90 });
    expect(validateExpirationDays(365)).toEqual({ valid: true, value: 365 });
  });

  it("accepts zero", () => {
    expect(validateExpirationDays(0)).toEqual({ valid: true, value: 30 });
  });

  it("rejects negative number", () => {
    const result = validateExpirationDays(-5);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("negative");
  });

  it("accepts decimal", () => {
    expect(validateExpirationDays("1.5")).toEqual({ valid: true, value: 1.5 });
  });
});

// --- showSensitiveDomainWarning ---

describe("showSensitiveDomainWarning", () => {
  it("resolves immediately for non-sensitive domain", async () => {
    await expect(showSensitiveDomainWarning("example.com", "delete")).resolves.toBeUndefined();
  });

  it("resolves immediately for empty domain", async () => {
    await expect(showSensitiveDomainWarning("", "delete")).resolves.toBeUndefined();
    await expect(showSensitiveDomainWarning(null, "delete")).resolves.toBeUndefined();
  });

  it("shows modal for sensitive domain and resolves on Proceed", async () => {
    const promise = showSensitiveDomainWarning("google.com", "delete");
    const overlay = document.querySelector(".edit-modal");
    expect(overlay).not.toBeNull();
    expect(overlay.textContent).toContain("google.com");
    expect(overlay.textContent).toContain("delete");

    overlay.querySelector(".warning-proceed-btn").click();
    await expect(promise).resolves.toBeUndefined();
    expect(document.querySelector(".edit-modal")).toBeNull();
  });

  it("shows modal for sensitive domain and rejects on Cancel", async () => {
    const promise = showSensitiveDomainWarning("banking.example.com", "toggle");
    const overlay = document.querySelector(".edit-modal");

    overlay.querySelector(".warning-cancel-btn").click();
    await expect(promise).rejects.toThrow("User cancelled");
    expect(document.querySelector(".edit-modal")).toBeNull();
  });

  it("rejects when clicking close button", async () => {
    const promise = showSensitiveDomainWarning("paypal.com", "edit");
    const overlay = document.querySelector(".edit-modal");

    overlay.querySelector(".edit-modal-close").click();
    await expect(promise).rejects.toThrow("User cancelled");
  });

  it("detects various sensitive keywords", async () => {
    const sensitiveKeywords = ["bank", "payment", "login", "auth", "secure", "gov"];
    for (const kw of sensitiveKeywords) {
      const promise = showSensitiveDomainWarning(`${kw}.example.com`, "test");
      const overlay = document.querySelector(".edit-modal");
      expect(overlay).not.toBeNull();
      overlay.querySelector(".warning-proceed-btn").click();
      await promise;
    }
  });
});
