/**
 * Deep Link Handler for Capacitor Mobile App
 * 
 * Handles OAuth callback deep links (bestbazaar://auth/callback)
 * and exchanges authorization code for session token.
 * 
 * This module should be initialized once when the app starts.
 * 
 * Note: Capacitor imports are dynamic to avoid Next.js build errors.
 */

import { exchangeCodeForSession, setMobileSessionToken, clearOAuthFlowData } from '../auth/mobile-oauth';
import { logger } from '../logger';

const log = logger.scope('DeepLinkHandler');

/**
 * Get Capacitor App module dynamically
 */
async function getApp() {
  if (typeof window === 'undefined') return null;
  try {
    const { App } = await import('@capacitor/app');
    return App;
  } catch {
    return null;
  }
}

/**
 * Get Capacitor Core module dynamically
 */
function getCapacitor() {
  if (typeof window === 'undefined') return null;
  try {
    return (window as any).Capacitor || null;
  } catch {
    return null;
  }
}

let isInitialized = false;
let onAuthSuccessCallback: (() => void) | null = null;
let onAuthErrorCallback: ((error: Error) => void) | null = null;

/**
 * Parse OAuth callback URL and extract parameters
 */
function parseOAuthCallbackUrl(url: string): {
  code: string | null;
  state: string | null;
  error: string | null;
  errorDescription: string | null;
} {
  try {
    const urlObj = new URL(url);
    return {
      code: urlObj.searchParams.get('code'),
      state: urlObj.searchParams.get('state'),
      error: urlObj.searchParams.get('error'),
      errorDescription: urlObj.searchParams.get('error_description'),
    };
  } catch (error) {
    log.error('Failed to parse OAuth callback URL', error);
    return {
      code: null,
      state: null,
      error: 'invalid_url',
      errorDescription: 'Failed to parse callback URL',
    };
  }
}

/**
 * Handle OAuth callback deep link
 */
async function handleOAuthCallback(url: string): Promise<void> {
  log.info('Handling OAuth callback', { url });

  try {
    // Parse callback URL
    const { code, state, error, errorDescription } = parseOAuthCallbackUrl(url);

    // Check for OAuth errors
    if (error) {
      const errorMessage = errorDescription || error;
      log.error('OAuth error received', { error, errorDescription });
      clearOAuthFlowData();
      
      if (onAuthErrorCallback) {
        onAuthErrorCallback(new Error(errorMessage));
      }
      return;
    }

    // Validate required parameters
    if (!code || !state) {
      log.error('Missing required OAuth parameters', { hasCode: !!code, hasState: !!state });
      clearOAuthFlowData();
      
      if (onAuthErrorCallback) {
        onAuthErrorCallback(new Error('Missing authorization code or state'));
      }
      return;
    }

    log.info('OAuth callback parameters validated', { hasCode: true, hasState: true });

    // Exchange authorization code for session token
    const { sessionToken, user } = await exchangeCodeForSession(code, state);

    log.info('Successfully exchanged code for session', { userId: user.id, email: user.email });

    // Set session token in WebView cookies
    setMobileSessionToken(sessionToken);

    log.info('Mobile session established successfully');

    // Trigger auth success callback
    if (onAuthSuccessCallback) {
      onAuthSuccessCallback();
    }

    // Reload page to update session state
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  } catch (error: any) {
    log.error('Failed to handle OAuth callback', error);
    clearOAuthFlowData();
    
    if (onAuthErrorCallback) {
      onAuthErrorCallback(error);
    }
  }
}

/**
 * Handle deep link URL
 */
async function handleDeepLink(url: string): Promise<void> {
  log.info('Deep link received', { url });

  try {
    // Check if this is an OAuth callback
    if (url.startsWith('bestbazaar://auth/callback')) {
      await handleOAuthCallback(url);
    } else {
      log.info('Non-OAuth deep link, ignoring', { url });
    }
  } catch (error) {
    log.error('Failed to handle deep link', error);
  }
}

/**
 * Initialize deep link handler
 * 
 * Should be called once when the app starts.
 * Only works on native platforms (iOS/Android).
 */
export async function initializeDeepLinkHandler(options?: {
  onAuthSuccess?: () => void;
  onAuthError?: (error: Error) => void;
}): Promise<void> {
  // Only initialize on native platforms
  const Capacitor = getCapacitor();
  if (!Capacitor || !Capacitor.isNativePlatform()) {
    log.info('Not on native platform, skipping deep link handler initialization');
    return;
  }

  // Prevent multiple initializations
  if (isInitialized) {
    log.warn('Deep link handler already initialized');
    return;
  }

  log.info('Initializing deep link handler');

  // Store callbacks
  onAuthSuccessCallback = options?.onAuthSuccess || null;
  onAuthErrorCallback = options?.onAuthError || null;

  // Get App module dynamically
  const App = await getApp();
  if (!App) {
    log.error('Capacitor App plugin not available');
    return;
  }

  // Register deep link listener
  App.addListener('appUrlOpen', (event: { url: string }) => {
    handleDeepLink(event.url);
  });

  isInitialized = true;
  log.info('Deep link handler initialized successfully');
}

/**
 * Check if deep link handler is initialized
 */
export function isDeepLinkHandlerInitialized(): boolean {
  return isInitialized;
}

/**
 * Update auth callbacks
 */
export function setAuthCallbacks(options: {
  onAuthSuccess?: () => void;
  onAuthError?: (error: Error) => void;
}): void {
  onAuthSuccessCallback = options.onAuthSuccess || null;
  onAuthErrorCallback = options.onAuthError || null;
}
