import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/internal/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store token and user info
      sessionStorage.setItem("admin_token", data.token);
      sessionStorage.setItem("admin_user", JSON.stringify(data.user));

      // Redirect to review queue or requested page
      const returnTo = (router.query.returnTo as string) || "/admin/review-queue/";
      router.push(returnTo);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Login - GTIXT</title>
      </Head>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.logo}>🔐</div>
            <h1 style={styles.title}>GTIXT Admin Console</h1>
            <p style={styles.subtitle}>Internal Review Queue Access</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {error && (
              <div style={styles.error}>
                ⚠️ {error}
              </div>
            )}

            <div style={styles.field}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                disabled={loading}
                style={styles.input}
                placeholder="alice"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                style={styles.input}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                ...(loading ? styles.buttonDisabled : {}),
              }}
            >
              {loading ? "Logging in..." : "Sign In"}
            </button>
          </form>

          <div style={styles.footer}>
            <p style={styles.footerText}>
              Internal use only. Authorized personnel only.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)",
    padding: "20px",
  },
  card: {
    background: "#161b33",
    borderRadius: "12px",
    padding: "40px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
  },
  header: {
    textAlign: "center" as const,
    marginBottom: "32px",
  },
  logo: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  title: {
    fontSize: "24px",
    fontWeight: 600,
    color: "#e0e0e0",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "14px",
    color: "#888",
    margin: 0,
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
  },
  error: {
    background: "rgba(220, 38, 38, 0.1)",
    border: "1px solid rgba(220, 38, 38, 0.3)",
    color: "#f87171",
    padding: "12px",
    borderRadius: "6px",
    fontSize: "14px",
  },
  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#c0c0c0",
  },
  input: {
    padding: "12px 16px",
    fontSize: "15px",
    background: "#0f1423",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "6px",
    color: "#e0e0e0",
    outline: "none",
    transition: "border-color 0.2s",
  },
  button: {
    padding: "14px",
    fontSize: "15px",
    fontWeight: 600,
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  buttonDisabled: {
    background: "#4b5563",
    cursor: "not-allowed",
  },
  footer: {
    marginTop: "24px",
    paddingTop: "24px",
    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
  },
  footerText: {
    fontSize: "12px",
    color: "#666",
    textAlign: "center" as const,
    margin: 0,
  },
};
