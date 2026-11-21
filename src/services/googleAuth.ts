/**
 * Real Google Identity Services & OAuth 2.0 Client for Agridirect
 * Uses official Google GIS SDK (https://accounts.google.com/gsi/client)
 */

export interface GoogleUserProfile {
  sub: string;
  name: string;
  email: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

const STORAGE_KEY = 'agridirect_google_client_id';
const DEFAULT_CLIENT_ID = '164502476414-2nvvdlo0bg8687jjf3rcqcu1lvte2a8j.apps.googleusercontent.com';

/**
 * Get active Google Client ID from localStorage or Vite environment variable
 */
export function getStoredGoogleClientId(): string {
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local && local.trim()) return local.trim();
  } catch {
    // Ignore localStorage errors
  }
  const envKey = (((import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string) || '').trim();
  if (envKey) return envKey;
  return DEFAULT_CLIENT_ID;
}

/**
 * Save Google Client ID in localStorage
 */
export function setStoredGoogleClientId(clientId: string): void {
  try {
    if (!clientId.trim()) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, clientId.trim());
    }
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Decode standard Google JWT credential token returned by GIS
 */
export function decodeGoogleJwt(token: string): GoogleUserProfile {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    return {
      sub: parsed.sub || String(Date.now()),
      name: parsed.name || parsed.given_name || 'Google User',
      email: parsed.email || 'user@gmail.com',
      picture: parsed.picture,
      given_name: parsed.given_name,
      family_name: parsed.family_name,
    };
  } catch (err) {
    console.error('Failed to parse Google JWT credential:', err);
    throw new Error('Invalid Google credential format');
  }
}

/**
 * Wait for Google GSI script to load on window
 */
export function waitForGoogleScript(timeoutMs = 4000): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && (window as any).google?.accounts) {
      resolve((window as any).google);
      return;
    }

    const start = Date.now();
    const interval = setInterval(() => {
      if ((window as any).google?.accounts) {
        clearInterval(interval);
        resolve((window as any).google);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        reject(new Error('Google Identity Services SDK script timed out.'));
      }
    }, 100);
  });
}

/**
 * Trigger Real Google OAuth 2.0 Popup Flow
 * Opens Google's official accounts.google.com authentication window
 * and fetches verified user info from Google's userinfo API.
 */
export async function triggerRealGoogleOAuth(
  clientId: string,
  onSuccess: (profile: GoogleUserProfile) => void,
  onError: (err: any) => void
): Promise<void> {
  try {
    const google = await waitForGoogleScript();

    if (!google?.accounts?.oauth2) {
      throw new Error('Google OAuth2 SDK is not ready.');
    }

    // Initialize official Google OAuth2 Token Client
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId.trim(),
      scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid',
      callback: async (tokenResponse: any) => {
        if (tokenResponse.error) {
          onError(new Error(tokenResponse.error_description || tokenResponse.error));
          return;
        }

        if (!tokenResponse.access_token) {
          onError(new Error('No access token returned by Google.'));
          return;
        }

        try {
          // Fetch authenticated user profile directly from Google
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          });

          if (!res.ok) {
            throw new Error(`Google userinfo returned status ${res.status}`);
          }

          const profileData = await res.json();
          onSuccess({
            sub: profileData.sub,
            name: profileData.name || 'Google User',
            email: profileData.email,
            picture: profileData.picture,
            given_name: profileData.given_name,
            family_name: profileData.family_name,
          });
        } catch (fetchErr: any) {
          onError(fetchErr);
        }
      },
    });

    // Request access token - opens official Google popup
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } catch (err) {
    onError(err);
  }
}

/**
 * Render Official Google Sign-In Button into a DOM container
 */
export async function renderOfficialGoogleButton(
  container: HTMLElement,
  clientId: string,
  onSuccess: (profile: GoogleUserProfile) => void,
  onError: (err: any) => void
): Promise<void> {
  try {
    const google = await waitForGoogleScript();

    google.accounts.id.initialize({
      client_id: clientId.trim(),
      callback: (response: { credential?: string }) => {
        if (response.credential) {
          try {
            const profile = decodeGoogleJwt(response.credential);
            onSuccess(profile);
          } catch (jwtErr) {
            onError(jwtErr);
          }
        } else {
          onError(new Error('No Google credential received'));
        }
      },
    });

    google.accounts.id.renderButton(container, {
      theme: 'outline',
      size: 'large',
      type: 'standard',
      text: 'continue_with',
      shape: 'pill',
      logo_alignment: 'left',
      width: container.clientWidth || 320,
    });
  } catch (err) {
    onError(err);
  }
}

