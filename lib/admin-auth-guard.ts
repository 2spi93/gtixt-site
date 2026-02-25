/**
 * Admin Authentication Guard
 * Protects admin pages by verifying session token
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/router";

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
  token: string | null;
}

/**
 * Hook to protect admin pages
 * Redirects to login if not authenticated
 */
export function useAdminAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    loading: true,
    authenticated: false,
    user: null,
    token: null,
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = sessionStorage.getItem("admin_token");
      const userJson = sessionStorage.getItem("admin_user");

      if (!token || !userJson) {
        // Not logged in, redirect to login
        setAuthState({ loading: false, authenticated: false, user: null, token: null });
        router.push(`/admin/login?returnTo=${encodeURIComponent(router.asPath)}`);
        return;
      }

      // Parse user first (for quick display)
      const localUser = JSON.parse(userJson);
      
      // Verify token is still valid
      const res = await fetch("/api/internal/auth/me/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        // Token invalid or expired
        sessionStorage.removeItem("admin_token");
        sessionStorage.removeItem("admin_user");
        setAuthState({ loading: false, authenticated: false, user: null, token: null });
        router.push(`/admin/login?returnTo=${encodeURIComponent(router.asPath)}`);
        return;
      }
      
      const payload = await res.json();
      const user = payload.user || localUser;

      if (payload.password_expired) {
        setAuthState({ loading: false, authenticated: false, user: null, token: null });
        router.push(`/admin/change-password?returnTo=${encodeURIComponent(router.asPath)}`);
        return;
      }

      // Update stored user info
      sessionStorage.setItem("admin_user", JSON.stringify(user));
      
      // Set authenticated state BEFORE refresh attempt
      setAuthState({
        loading: false,
        authenticated: true,
        user,
        token,
      });
      
      // Refresh session in background (don't await)
      maybeRefreshSession(token).catch(err => console.warn("Session refresh failed:", err));
      
    } catch (error) {
      console.error("Auth check failed:", error);
      setAuthState({ loading: false, authenticated: false, user: null, token: null });
      router.push("/admin/login");
    }
  };

  return authState;
}

/**
 * Logout helper
 */
export async function adminLogout() {
  try {
    const token = sessionStorage.getItem("admin_token");
    if (token) {
      await fetch("/api/internal/auth/logout/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_user");
    window.location.href = "/admin/login";
  }
}

async function maybeRefreshSession(token: string) {
  const refreshed = sessionStorage.getItem("admin_token_refreshed");
  if (refreshed) return;

  try {
    const res = await fetch("/api/internal/auth/refresh/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return;
    const data = await res.json();
    if (data?.token) {
      sessionStorage.setItem("admin_token", data.token);
      sessionStorage.setItem("admin_user", JSON.stringify(data.user));
      sessionStorage.setItem("admin_token_refreshed", "1");
    }
  } catch (error) {
    console.error("Session refresh failed:", error);
  }
}

/**
 * Get current admin token for API calls
 */
export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("admin_token");
}

/**
 * Fetch with admin auth headers
 */
export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAdminToken();
  
  if (!token) {
    throw new Error("Not authenticated");
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}
