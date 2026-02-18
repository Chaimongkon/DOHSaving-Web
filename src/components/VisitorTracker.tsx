"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Skip admin pages
    if (pathname.startsWith("/admin")) return;

    // Debounce: don't track the same page twice within 5 seconds
    const key = `vt_${pathname}`;
    const last = sessionStorage.getItem(key);
    if (last && Date.now() - Number(last) < 5000) return;
    sessionStorage.setItem(key, String(Date.now()));

    fetch("/api/visitor-track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageUrl: pathname }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
