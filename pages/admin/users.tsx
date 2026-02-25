import { useEffect, useState, FormEvent } from "react";
import Head from "next/head";
import type { GetServerSideProps, NextPage } from "next";
import Layout from "../../components/Layout";
import PageNavigation from "../../components/PageNavigation";
import { useAdminAuth, adminFetch, adminLogout } from "../../lib/admin-auth-guard";

export const getServerSideProps: GetServerSideProps = async (context) => {
  // This forces server-side rendering instead of static generation
  return { props: {} };
};

interface AdminUser {
  id: number;
  username: string;
  email: string | null;
  role: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  last_password_change: string | null;
}

const roleOptions = ["reviewer", "lead_reviewer", "auditor", "admin"];

export default function AdminUsersPage() {
  const auth = useAdminAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("reviewer");
  const [newPassword, setNewPassword] = useState("");

  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch("/api/internal/users/");
      if (!res.ok) throw new Error("Failed to load users");
      const payload = await res.json();
      setUsers(payload.data || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auth.loading && auth.authenticated) {
      loadUsers();
    }
  }, [auth.loading, auth.authenticated]);

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await adminFetch("/api/internal/users/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          email: newEmail || null,
          role: newRole,
          password: newPassword,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        const details = Array.isArray(payload?.details) ? payload.details.join(" ") : "";
        throw new Error(payload?.error || details || "Failed to create user");
      }

      setNewUsername("");
      setNewEmail("");
      setNewRole("reviewer");
      setNewPassword("");
      await loadUsers();
    } catch (err: any) {
      setError(err?.message || "Failed to create user");
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!resetUserId) return;

    setError(null);
    try {
      const res = await adminFetch(`/api/internal/users/${resetUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: resetPassword }),
      });

      const payload = await res.json();
      if (!res.ok) {
        const details = Array.isArray(payload?.details) ? payload.details.join(" ") : "";
        throw new Error(payload?.error || details || "Failed to reset password");
      }

      setResetUserId(null);
      setResetPassword("");
      await loadUsers();
    } catch (err: any) {
      setError(err?.message || "Failed to reset password");
    }
  };

  const handleToggleActive = async (target: AdminUser) => {
    setError(null);
    try {
      const res = await adminFetch(`/api/internal/users/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !target.active }),
      });
      if (!res.ok) throw new Error("Failed to update user");
      await loadUsers();
    } catch (err: any) {
      setError(err?.message || "Failed to update user");
    }
  };

  const handleRoleChange = async (target: AdminUser, role: string) => {
    setError(null);
    try {
      const res = await adminFetch(`/api/internal/users/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      await loadUsers();
    } catch (err: any) {
      setError(err?.message || "Failed to update role");
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

  if (auth.user?.role !== "admin") {
    return (
      <Layout breadcrumbs={[{ label: "Admin", href: "/admin/review-queue" }]}>
        <Head>
          <title>User Management - Admin Console</title>
        </Head>
        <div style={styles.forbidden}>Access denied. Admin role required.</div>
      </Layout>
    );
  }

  return (
    <Layout
      breadcrumbs={[
        { label: "Admin", href: "/admin/review-queue" },
        { label: "User Management", href: "/admin/users" },
      ]}
    >
      <Head>
        <title>User Management - Admin Console</title>
      </Head>

      <PageNavigation
        currentPage="/admin/users"
        customButtons={[
          { href: "/admin/review-queue", label: "Review Queue" },
          { href: "/admin/change-password", label: "Change Password" },
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
          <h1 style={styles.title}>User Management</h1>
          <p style={styles.subtitle}>Create users, reset passwords, and manage roles.</p>

          {error && <div style={styles.error}>\u26a0\ufe0f {error}</div>}

          <form onSubmit={handleCreateUser} style={styles.form}>
            <div style={styles.formRow}>
              <input
                style={styles.input}
                placeholder="Username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
              />
              <input
                style={styles.input}
                placeholder="Email (optional)"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div style={styles.formRow}>
              <select
                style={styles.select}
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <input
                style={styles.input}
                placeholder="Temp password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                type="password"
              />
              <button style={styles.button} type="submit">
                Create User
              </button>
            </div>
          </form>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Password Change</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5}>Loading users...</td>
                  </tr>
                )}
                {!loading && users.length === 0 && (
                  <tr>
                    <td colSpan={5}>No users found.</td>
                  </tr>
                )}
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div>{u.username}</div>
                      <div style={styles.subtext}>{u.email || "-"}</div>
                    </td>
                    <td>
                      <select
                        style={styles.select}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                      >
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button style={styles.linkBtn} onClick={() => handleToggleActive(u)}>
                        {u.active ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td>{u.last_password_change ? new Date(u.last_password_change).toLocaleDateString("en-GB") : "-"}</td>
                    <td>
                      <button
                        style={styles.linkBtn}
                        onClick={() => {
                          setResetUserId(u.id);
                          setResetPassword("");
                        }}
                      >
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {resetUserId && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Reset Password</h3>
            <form onSubmit={handleResetPassword} style={styles.form}>
              <input
                style={styles.input}
                placeholder="New temporary password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                required
                type="password"
              />
              <div style={styles.modalActions}>
                <button type="button" style={styles.linkBtn} onClick={() => setResetUserId(null)}>
                  Cancel
                </button>
                <button type="submit" style={styles.button}>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

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
  forbidden: {
    padding: "40px",
    color: "#f87171",
    fontSize: "16px",
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
    padding: "32px 20px 60px",
  },
  card: {
    background: "#161b33",
    borderRadius: "12px",
    padding: "28px",
    border: "1px solid rgba(255, 255, 255, 0.05)",
  },
  title: {
    fontSize: "22px",
    color: "#e0e0e0",
    marginBottom: "6px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#888",
    marginBottom: "18px",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
    marginBottom: "18px",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  input: {
    padding: "10px 12px",
    background: "#0f1423",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "6px",
    color: "#e0e0e0",
  },
  select: {
    padding: "10px 12px",
    background: "#0f1423",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "6px",
    color: "#e0e0e0",
  },
  button: {
    padding: "10px 12px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontWeight: 600,
    cursor: "pointer",
  },
  linkBtn: {
    background: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#c0c0c0",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
  tableWrap: {
    overflowX: "auto" as const,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "13px",
  },
  subtext: {
    color: "#888",
    fontSize: "12px",
  },
  error: {
    background: "rgba(220, 38, 38, 0.1)",
    border: "1px solid rgba(220, 38, 38, 0.3)",
    color: "#f87171",
    padding: "10px",
    borderRadius: "6px",
    fontSize: "13px",
    marginBottom: "12px",
  },
  modalOverlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  modal: {
    background: "#161b33",
    borderRadius: "10px",
    padding: "20px",
    width: "100%",
    maxWidth: "420px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    color: "#e0e0e0",
    marginBottom: "12px",
  },
  modalActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
};
