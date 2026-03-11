import { debugLog, showToast } from "./ui.js";

export function updateDraggableState(cookieCount) {
  const cookiesList = document.getElementById("cookiesList");
  const cookieItems = document.querySelectorAll(".cookie-item");

  cookieItems.forEach((item) => {
    if (cookieCount > 1) {
      item.draggable = true;
      item.classList.add("draggable-enabled");
      item.classList.remove("draggable-disabled");
    } else {
      item.draggable = false;
      item.classList.add("draggable-disabled");
      item.classList.remove("draggable-enabled");
    }
  });

  if (cookieCount > 1) {
    cookiesList.classList.add("multi-cookies");
    cookiesList.classList.remove("single-cookie");
  } else {
    cookiesList.classList.add("single-cookie");
    cookiesList.classList.remove("multi-cookies");
  }

  debugLog(`Updated draggable state for ${cookieCount} cookies: ${cookieCount > 1 ? "enabled" : "disabled"}`, "info");
}

export function initializeDragAndDrop() {
  const cookiesList = document.getElementById("cookiesList");
  let draggedElement = null;
  let dragOverElement = null;
  let originalOrder = null;

  function handleDragStart(e) {
    if (!e.target.classList.contains("cookie-item")) return;
    draggedElement = e.target;
    e.target.classList.add("dragging");
    cookiesList.classList.add("dragging-active");

    const cookieElements = Array.from(cookiesList.querySelectorAll(".cookie-item"));
    originalOrder = cookieElements.map((el) => el.dataset.id);

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target.outerHTML);
    debugLog(`Started dragging cookie: ${e.target.dataset.id}`, "info");
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    const afterElement = getDragAfterElement(cookiesList, e.clientY);
    const dragging = document.querySelector(".dragging");

    if (afterElement == null) {
      cookiesList.appendChild(dragging);
    } else {
      cookiesList.insertBefore(dragging, afterElement);
    }
  }

  function handleDragEnter(e) {
    e.preventDefault();
    if (e.target.classList.contains("cookie-item") && e.target !== draggedElement) {
      document.querySelectorAll(".drag-over, .drag-over-bottom").forEach((el) => {
        el.classList.remove("drag-over", "drag-over-bottom");
      });
      dragOverElement = e.target;
      const rect = e.target.getBoundingClientRect();
      const elementMiddle = rect.top + rect.height / 2;
      if (e.clientY < elementMiddle) {
        e.target.classList.add("drag-over");
      } else {
        e.target.classList.add("drag-over-bottom");
      }
    }
  }

  function handleDragLeave(e) {
    if (e.target.classList.contains("cookie-item")) {
      e.target.classList.remove("drag-over", "drag-over-bottom");
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    if (draggedElement) {
      const cookieElements = Array.from(cookiesList.querySelectorAll(".cookie-item"));
      const newOrder = cookieElements.map((el) => el.dataset.id);

      const orderChanged =
        !originalOrder ||
        originalOrder.length !== newOrder.length ||
        originalOrder.some((id, index) => id !== newOrder[index]);

      if (orderChanged) {
        updateCookieOrder(newOrder);
        debugLog(`Dropped cookie, new order: ${newOrder.join(", ")}`, "info");
        showToast("Cookie order updated", "success");
      }
    }
    document.querySelectorAll(".drag-over, .drag-over-bottom").forEach((el) => {
      el.classList.remove("drag-over", "drag-over-bottom");
    });
  }

  function handleDragEnd(e) {
    e.target.classList.remove("dragging");
    cookiesList.classList.remove("dragging-active");
    document.querySelectorAll(".drag-over, .drag-over-bottom").forEach((el) => {
      el.classList.remove("drag-over", "drag-over-bottom");
    });
    draggedElement = null;
    dragOverElement = null;
    originalOrder = null;
  }

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll(".cookie-item:not(.dragging)")];
    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset, element: child };
        }
        return closest;
      },
      { offset: Number.NEGATIVE_INFINITY }
    ).element;
  }

  if (!cookiesList._dragHandlers) {
    cookiesList._dragHandlers = {};
  }

  Object.entries(cookiesList._dragHandlers).forEach(([event, handler]) => {
    cookiesList.removeEventListener(event, handler);
  });

  cookiesList.addEventListener("dragstart", handleDragStart);
  cookiesList.addEventListener("dragover", handleDragOver);
  cookiesList.addEventListener("dragenter", handleDragEnter);
  cookiesList.addEventListener("dragleave", handleDragLeave);
  cookiesList.addEventListener("drop", handleDrop);
  cookiesList.addEventListener("dragend", handleDragEnd);

  cookiesList._dragHandlers = {
    dragstart: handleDragStart,
    dragover: handleDragOver,
    dragenter: handleDragEnter,
    dragleave: handleDragLeave,
    drop: handleDrop,
    dragend: handleDragEnd,
  };
}

export function updateCookieOrder(newOrder) {
  chrome.storage.local.get(["savedCookies"], function (result) {
    if (chrome.runtime.lastError) {
      debugLog(`Error reading cookies for reorder: ${chrome.runtime.lastError.message}`, "error");
      return;
    }

    const savedCookies = result.savedCookies || [];
    const cookieMap = new Map();
    savedCookies.forEach((cookie) => cookieMap.set(cookie.id, cookie));

    const reorderedCookies = newOrder.map((id) => cookieMap.get(id)).filter((cookie) => cookie);

    chrome.storage.local.set({ savedCookies: reorderedCookies }, function () {
      if (chrome.runtime.lastError) {
        debugLog(`Error saving reordered cookies: ${chrome.runtime.lastError.message}`, "error");
        showToast("Failed to save cookie order", "error");
      } else {
        debugLog(`Successfully reordered ${reorderedCookies.length} cookies`, "info");
      }
    });
  });
}
