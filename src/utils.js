// Encryption helpers for cookie values
export const encryptionHelpers = {
  encryptCookieValues: function (cookie) {
    if (cookie.isEncrypted) {
      return cookie;
    }

    const encryptedCookie = { ...cookie };
    encryptedCookie.value = btoa(cookie.value);
    encryptedCookie.isEncrypted = true;
    return encryptedCookie;
  },

  decryptCookieValues: function (cookie) {
    if (!cookie.isEncrypted) {
      return cookie;
    }

    const decryptedCookie = { ...cookie };
    try {
      if (typeof cookie.value !== "string" || !cookie.value) {
        throw new Error("Invalid cookie value for decryption");
      }

      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(cookie.value)) {
        throw new Error("Cookie value is not properly base64 encoded");
      }

      decryptedCookie.value = atob(cookie.value);
      decryptedCookie.isEncrypted = false;
    } catch (e) {
      decryptedCookie.value = cookie.value;
      decryptedCookie.isEncrypted = false;
    }
    return decryptedCookie;
  },
};

export function validateCookieName(name) {
  if (!name) {
    return { valid: false, message: "Please specify cookie name" };
  }

  if (name.length > 150) {
    return {
      valid: false,
      message: "Cookie name is too long (max 150 characters)",
    };
  }

  const invalidCharsRegex =
    /[^\u0021\u0023-\u002B\u002D-\u003A\u003C-\u005B\u005D-\u007E]/;
  if (invalidCharsRegex.test(name)) {
    return { valid: false, message: "Cookie name contains invalid characters" };
  }

  if (name.includes("<") || name.includes(">")) {
    return {
      valid: false,
      message: "Cookie name cannot contain HTML tags (< or > characters)",
    };
  }

  if (name.includes('"') || name.includes("'") || name.includes("&")) {
    return {
      valid: false,
      message: "Cookie name cannot contain quotes or special HTML characters",
    };
  }

  return { valid: true };
}

export function validateCookieValue(value) {
  if (value === undefined || value === null || value === "") {
    return { valid: false, message: "Please specify cookie value" };
  }

  if (value.length > 4000) {
    return {
      valid: false,
      message: "Cookie value is too long (max 4000 characters)",
    };
  }

  if (value.includes("<script") || value.includes("</script>")) {
    return {
      valid: false,
      message: "Cookie value cannot contain script tags for security reasons",
    };
  }

  return { valid: true };
}

export function validateCookieDomain(domain, isGlobal) {
  if (isGlobal) {
    return { valid: true };
  }

  if (!domain) {
    return { valid: true };
  }

  const domainRegex =
    /^(\.)?[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])+$/;
  if (!domainRegex.test(domain)) {
    return {
      valid: false,
      message: "Invalid domain format. Example: example.com or .example.com",
    };
  }

  return { valid: true };
}

export function validateCookiePath(path) {
  if (!path) {
    return { valid: false, message: "Please specify cookie path" };
  }

  if (!path.startsWith("/")) {
    return { valid: false, message: "Path must start with /" };
  }

  return { valid: true };
}

export function validateExpirationDays(days) {
  if (!days || isNaN(days)) {
    return { valid: true, value: 30 };
  }

  const daysNum = Number(days);

  if (daysNum < 0) {
    return { valid: false, message: "Expiration days cannot be negative" };
  }

  return { valid: true, value: daysNum };
}

export function showSensitiveDomainWarning(domain, action) {
  return new Promise((resolve, reject) => {
    const SENSITIVE_KEYWORDS = [
      "bank", "banking", "payment", "paypal",
      "google", "facebook", "twitter", "amazon",
      "apple", "microsoft", "login", "auth",
      "secure", "account", "gov", "health", "medical",
    ];

    const isSensitive =
      domain &&
      typeof domain === "string" &&
      SENSITIVE_KEYWORDS.some((kw) => domain.toLowerCase().includes(kw));

    if (!isSensitive) {
      resolve();
      return;
    }

    const overlay = document.createElement("div");
    overlay.className = "edit-modal";

    overlay.innerHTML = `
      <div class="edit-modal-content sensitive-domain-modal">
        <div class="edit-modal-header sensitive-domain-header">
          <h3>⚠ Sensitive Domain</h3>
          <button class="edit-modal-close">&times;</button>
        </div>
        <div class="edit-modal-body">
          <p class="sensitive-domain-text">
            <strong>${domain}</strong> looks like a sensitive domain.
          </p>
          <p class="sensitive-domain-subtext">
            Modifying cookies on this domain may affect authentication or security.
            Are you sure you want to <strong>${action}</strong> this cookie?
          </p>
        </div>
        <div class="edit-modal-footer">
          <button class="edit-save-btn warning-proceed-btn">Proceed</button>
          <button class="edit-cancel-btn warning-cancel-btn">Cancel</button>
        </div>
      </div>
    `;

    const cleanup = () => overlay.remove();

    overlay.querySelector(".warning-proceed-btn").addEventListener("click", () => {
      cleanup();
      resolve();
    });

    overlay.querySelector(".warning-cancel-btn").addEventListener("click", () => {
      cleanup();
      reject(new Error("User cancelled operation on sensitive domain"));
    });

    overlay.querySelector(".edit-modal-close").addEventListener("click", () => {
      cleanup();
      reject(new Error("User cancelled operation on sensitive domain"));
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        cleanup();
        reject(new Error("User cancelled operation on sensitive domain"));
      }
    });

    document.body.appendChild(overlay);
  });
}
