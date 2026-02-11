"use client";

import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";

export default function GoogleLoginButton() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);

    try {
      // 🌐 WEB LOGIN (Website only)
      if (!Capacitor.isNativePlatform()) {
        window.location.href = "https://stage.bestbazaar.in/api/auth/google";
        return;
      }

      // 📱 NATIVE LOGIN (Capacitor App)
      const user = await GoogleAuth.signIn();

      console.log("Native Google user:", user);

      // 🔐 Send ID token to backend (native endpoint)
      const response = await fetch(
        "https://stage.bestbazaar.in/api/auth/google/native",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idToken: user.idToken,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Backend authentication failed");
      }

      const data = await response.json();
      console.log("Backend login success:", data);

      // ✅ TODO: save session / token / redirect user
    } catch (error) {
      console.error("Google sign-in failed:", error);
      alert("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={loading}
      style={{
        padding: "12px 20px",
        backgroundColor: "#4285F4",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: loading ? "not-allowed" : "pointer",
        width: "100%",
        fontSize: "16px",
        fontWeight: "600",
      }}
    >
      {loading ? "Signing in..." : "Sign in with Google"}
    </button>
  );
}
