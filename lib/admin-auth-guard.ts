/**
 * Admin Authentication Guard - REFACTORED
 * Protects admin pages by verifying httpOnly cookie authentication
 * ✓ Uses API with automatic cookie handling (credentials: 'include')
 * ✓ No sessionStorage (eliminates XSS vulnerability)
 */

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AdminUser {
  id: number;
  username: string;
  email: string | null;
  role: string;
}

interface AuthState {
  loading: boolean;
  authenticated: boolean;
  user: AdminUser | null;
}

/**
 * Hook to protect admin pages with cookie-based auth
 * Redirects to login if not authenticated
 * 
 * Uses /api/internal/auth/me endpoint which checks auth_token cookie
 */
export function useAdminAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    loading: true,
    authenticated: false,
    user: null,
  });
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Verify authentication via API (uses httpOnly cookie automatically)
      const res = await fetch("/api/internal/auth/me", {
        credentials: 'include', // ✓ Sends auth_token cookie automatically
      });

      if (!res.ok) {
        // Not authenticated, redirect to login
        setAuthState({ loading: false, authenticated: false, user: null });
        // Don't redirect on login page itself to avoid conflicts
        if (!pathname?.includes('/login')) {
          router.push(`/admin/login?returnTo=${encodeURIComponent(pathname || '')}`);
        }
        return;
      }
      
      const payload = await res.json();
      const user = payload.user;

      if (!user) {
        setAuthState({ loading: false, authenticated: false, user: null });
        if (!pathname?.includes('/login')) {
          router.push(`/admin/login?returnTo=${encodeURIComponent(pathname || '')}`);
        }
        return;
      }

      // Check if password expired
      if (payload.password_expired) {
        setAuthState({ loading: false, authenticated: false, user: null });
        router.push(`/admin/security/password?returnTo=${encodeURIComponent(pathname || '')}`);
        return;
      }

      // User authenticated successfully
      setAuthState({
        loading: false,
        authenticated: true,
        user,
      });
      
    } catch (error) {
      console.error("Auth check failed:", error);
      setAuthState({ loading: false, authenticated: false, user: null });
      if (!pathname?.includes('/login')) {
        router.push("/admin/login");
      }
    }
  };

  return authState;
}


/**
 * Logout helper - Uses httpOnly cookie authentication
 * API validates cookie, clears session, and sends Set-Cookie: max-age=0
 */
export async function adminLogout() {
  try {
    await fetch("/api/internal/auth/logout", {
      method: "POST",
      credentials: 'include', // ✓ Sends auth_token cookie automatically
    });
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Clear any cached data and redirect
    // Cookie is cleared by API response
    window.location.href = "/admin/login";
  }
}

/**
 * Fetch with automatic cookie authentication
 * Replaces old Bearer token approach
 * 
 * Usage: const res = await adminFetch("/api/internal/users")
 */
export async function adminFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: 'include', // ✓ Automatically includes auth_token cookie
    headers: {
      ...options.headers,
      'Content-Type': options.headers?.['Content-Type'] || 'application/json',
    },
  });
}

