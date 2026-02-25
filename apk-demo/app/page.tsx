"use client";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Best Bazaar</h1>
        <p className="text-gray-600 mb-4">
          Your marketplace for everything!
        </p>
        <div className="text-sm text-gray-500">
          Loading...
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <h3>Debug Info</h3>
        <ul style={{ fontSize: 14 }}>
          <li>Platform: {Capacitor.getPlatform()}</li>
          <li>Is Native: {Capacitor.isNativePlatform() ? "Yes" : "No"}</li>
          <li>Supported: {isSupported ? "Yes" : "No"}</li>
          <li>Permission Granted: {isPermissionGranted ? "Yes" : "No"}</li>
          <li>Subscribed: {isSubscribed ? "Yes" : "No"}</li>
          <li>Loading: {isLoading ? "Yes" : "No"}</li>
        </ul>
      </div>
    </div>
  );
}
