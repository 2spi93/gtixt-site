import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import type { GetServerSideProps, NextPage } from "next";
import Layout from "../../components/Layout";
import PageNavigation from "../../components/PageNavigation";
import { useAdminAuth, adminFetch, adminLogout } from "../../lib/admin-auth-guard";

export const getServerSideProps: GetServerSideProps = async (context) => {
  // This forces server-side rendering instead of static generation
  return { props: {} };
};

const ChangePasswordPage: NextPage = () => {
  const auth = useAdminAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth.loading && !auth.authenticated) {
      router.push("/admin/login");
    }
  }, [auth.loading, auth.authenticated, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await adminFetch("/api/internal/auth/change-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const payload = await res.json();

      if (!res.ok) {
        const details = Array.isArray(payload?.details) ? payload.details.join(" ") : "";
        throw new Error(payload?.error || details || "Password change failed");
      }

      if (payload?.token) {
        sessionStorage.setItem("admin_token", payload.token);
      }
      if (payload?.user) {
        sessionStorage.setItem("admin_user", JSON.stringify(payload.user));
      }
      sessionStorage.removeItem("admin_token_refreshed");

      setSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      const returnTo = (router.query.returnTo as string) || "/admin/review-queue/";
      setTimeout(() => router.push(returnTo), 600);
    } catch (err: any) {
      setError(err?.message || "Password change failed");
    } finally {
      setLoading(false);
    }
  };

  if (auth.loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingIcon}>\ud83d\udd10</div>
          <p>Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout
      breadcrumbs={[
        { label: "Admin", href: "/admin/review-queue" },
        { label: "Change Password", href: "/admin/change-password" },
      ]}
    >
      <Head>
        <title>Change Password - Admin Console</title>
      </Head>

      <PageNavigation
        currentPage="/admin/change-password"
        customButtons={[
          { href: "/admin/review-queue", label: "Review Queue" },
          { href: "/admin/users", label: "User Management" },
          { href: "/admin/setup-2fa", label: "Setup 2FA" },
          { href: "/audit-trails", label: "Audit Trails" },
        ]}
      />

      <div style={styles.userBar}>
        <span style={styles.userText}>
          \ud83d\udc64 {auth.user?.username} ({auth.user?.role})
        </span>
        <button onClick={() => adminLogout()} style={styles.logoutBtn}>
          Logout
        </button>
      </div>

      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Change Password</h1>
          <p style={styles.subtitle}>Update your admin password.</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            {error && <div style={styles.error}>\u26a0\ufe0f {error}</div>}
            {success && <div style={styles.success}>\u2705 {success}</div>}

            <div style={styles.field}>
              <label style={styles.label}>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={loading}
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                style={styles.input}
              />
            </div>

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ChangePasswordPage;

const styles = {
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0a0e27",
  },
  loadingCard: {
    textAlign: "center" as const,
    color: "#888",
  },
  loadingIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  userBar: {
    background: "#0f1423",
    padding: "8px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userText: {
    color: "#888",
    fontSize: "13px",
  },
  logoutBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#888",
    padding: "4px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "13px",
  },
  container: {
    minHeight: "70vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
  },
  card: {
    background: "#161b33",
    borderRadius: "12px",
    padding: "32px",
    width: "100%",
    maxWidth: "460px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
  },
  title: {
    fontSize: "22px",
    color: "#e0e0e0",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#888",
    marginBottom: "24px",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  },
  label: {
    color: "#c0c0c0",
    fontSize: "13px",
  },
  input: {
    padding: "10px 12px",
    background: "#0f1423",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "6px",
    color: "#e0e0e0",
    outline: "none",
  },
  button: {
    padding: "12px",
    fontSize: "14px",
    fontWeight: 600,
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  error: {
    background: "rgba(220, 38, 38, 0.1)",
    border: "1px solid rgba(220, 38, 38, 0.3)",
    color: "#f87171",
    padding: "10px",
    borderRadius: "6px",
    fontSize: "13px",
  },
  success: {
    background: "rgba(34, 197, 94, 0.1)",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    color: "#4ade80",
    padding: "10px",
    borderRadius: "6px",
    fontSize: "13px",
  },
};
