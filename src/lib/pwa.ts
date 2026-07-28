"use client";

export function registerSW() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        console.warn("Service Worker 注册失败");
      });
    });
  }
}
