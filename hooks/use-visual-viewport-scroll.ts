"use client";

import { useEffect } from "react";

export function useVisualViewportScroll() {
  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || !("scrollIntoView" in target)) return;
      if (!["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      window.setTimeout(() => {
        if (window.visualViewport) {
          const rect = target.getBoundingClientRect();
          const vv = window.visualViewport;
          if (rect.bottom > vv.height || rect.top < 0) {
            target.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        } else {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
    };

    window.addEventListener("focusin", handleFocusIn);
    return () => window.removeEventListener("focusin", handleFocusIn);
  }, []);
}
