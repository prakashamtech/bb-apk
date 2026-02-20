"use client";
import { useEffect } from "react";

export default function UnifiedPermissionsGate() {
  useEffect(() => {
    // Check if we've already redirected
    const hasRedirected = typeof window !== "undefined" && localStorage.getItem("hasRedirected");
    
    if (!hasRedirected) {
      // Mark as redirected
      try {
        localStorage.setItem("hasRedirected", "1");
      } catch (_) {}
      
      // Redirect to production website immediately
      window.location.href = 'https://bestbazaar.in';
    }
  }, []);

  return null;
}
