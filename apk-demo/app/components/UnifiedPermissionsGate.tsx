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
      // Uses environment variable for flexibility across environments
      const productionUrl = process.env.NEXT_PUBLIC_PRODUCTION_URL || 'https://bestbazaar.in';
      window.location.href = productionUrl;
    }
  }, []);

  return null;
}
