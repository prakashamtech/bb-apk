/**
 * Capacitor Session Header Interceptor
 * 
 * Adds NextAuth session token to request headers for Capacitor WebView
 * to bypass cookie transmission issues in Android WebView.
 */

/**
 * Get the NextAuth session token from cookies
 */
function getSessionToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookieName = process.env.NODE_ENV === 'production' 
    ? '__Secure-next-auth.session-token' 
    : 'next-auth.session-token';
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === cookieName) {
      return value;
    }
  }
  
  return null;
}

/**
 * Check if running in Capacitor
 */
function isCapacitor(): boolean {
  return typeof window !== 'undefined' && 
    !!(window as any).Capacitor?.isNativePlatform?.();
}

/**
 * Intercept fetch requests and add session token header for Capacitor
 */
export function initializeSessionHeaderInterceptor(): void {
  if (!isCapacitor()) {
    console.log('[SessionInterceptor] Not running in Capacitor, skipping');
    return;
  }
  
  console.log('[SessionInterceptor] Initializing for Capacitor');
  
  // Store original fetch
  const originalFetch = window.fetch;
  
  // Override fetch to add session token header
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    
    // Only intercept requests to the remote server
    if (url.includes('dev.bestbazaar.in') || url.includes('bestbazaar.in')) {
      const token = getSessionToken();
      
      if (token) {
        console.log('[SessionInterceptor] Adding session token to request:', url);
        
        // Add custom header with session token
        const headers = new Headers(init?.headers || {});
        headers.set('x-capacitor-session-token', token);
        
        init = {
          ...init,
          headers,
        };
      }
    }
    
    return originalFetch(input, init);
  };
  
  console.log('[SessionInterceptor] Initialized successfully');
}
