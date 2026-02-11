'use client';

import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

export default function Login() {

  const handleGoogleSignIn = async () => {
    console.log('Is Native:', Capacitor.isNativePlatform());
    console.log('Platform:', Capacitor.getPlatform());

    if (!Capacitor.isNativePlatform()) {
      alert('Google Sign-In works only in the mobile app');
      return;
    }

    try {
      // 1️⃣ Native Google login
      const user = await GoogleAuth.signIn();
      console.log('Native sign-in result:', user);

      // 2️⃣ SEND GOOGLE ID TOKEN TO BACKEND (THIS IS THE MISSING PART)
      const response = await fetch(
        'https://stage.bestbazaar.in/api/auth/google/native',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idToken: user.idToken, // 👈 THIS IS THE KEY
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Backend login failed');
      }

      const data = await response.json();
      console.log('Backend login success:', data);

      // 3️⃣ TODO: save session / redirect user

    } catch (error) {
      console.error('Sign-in error:', error);
      alert('Google Sign-In failed');
    }
  };

  return (
    <button onClick={handleGoogleSignIn}>
      Continue with Google
    </button>
  );
}
