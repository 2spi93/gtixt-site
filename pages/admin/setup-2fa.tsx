import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import type { NextPage, GetServerSideProps } from "next";
import Layout from "../../components/Layout";
import PageNavigation from "../../components/PageNavigation";
import { useAdminAuth, adminFetch, adminLogout } from "../../lib/admin-auth-guard";

export const getServerSideProps: GetServerSideProps = async (context) => {
  // This forces server-side rendering instead of static generation
  return { props: {} };
};

const Setup2FAPage: NextPage = () => {
  const auth = useAdminAuth();
  const router = useRouter();

  const [step, setStep] = useState<"not-started" | "setup" | "verify">("not-started");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [totp2faEnabled, setTotp2faEnabled] = useState(false);

  useEffect(() => {
    if (!auth.loading && !auth.authenticated) {
      router.push("/admin/login");
    }
  }, [auth.loading, auth.authenticated, router]);

  useEffect(() => {
    if (auth.user) {
      checkTotpStatus();
    }
  }, [auth.user]);

  const checkTotpStatus = async () => {
    try {
      const res = await adminFetch("/api/internal/auth/me/");
      const data = await res.json();
      setTotp2faEnabled(data.user?.totp_enabled || false);
    } catch (err: any) {
      console.error("Failed to check TOTP status:", err);
    }
  };

  const handleStartSetup = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await adminFetch("/api/internal/auth/setup-2fa/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || "Failed to setup 2FA");

      setQrCode(payload.data.qrCode);
      setSecret(payload.data.secret);
      setStep("setup");
    } catch (err: any) {
      setError(err?.message || "Failed to start 2FA setup");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!code || code.length !== 6) {
      setError("Code must be 6 digits");
      setLoading(false);
      return;
    }

    try {
      const res = await adminFetch("/api/internal/auth/enable-2fa/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || "Invalid TOTP code");

      setSuccess("✅ 2FA enabled successfully!");
      setTotp2faEnabled(true);
      setCode("");
      setStep("not-started");
      setTimeout(() => {
        router.push("/admin/change-password");
      }, 2000);
    } catch (err: any) {
      setError(err?.message || "Failed to verify code");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2fa = async () => {
    if (!window.confirm("Are you sure you want to disable 2FA?")) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await adminFetch("/api/internal/auth/disable-2fa/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || "Failed to disable 2FA");

      setSuccess("✅ 2FA disabled");
      setTotp2faEnabled(false);
    } catch (err: any) {
      setError(err?.message || "Failed to disable 2FA");
    } finally {
      setLoading(false);
    }
  };

  if (auth.loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingIcon}>🔐</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout breadcrumbs={[{ label: "Admin", href: "/admin/review-queue" }]}>
      <Head>
        <title>Setup 2FA - Admin Console</title>
      </Head>

      <PageNavigation
        currentPage="/admin/setup-2fa"
        customButtons={[
          { href: "/admin/review-queue", label: "Review Queue" },
          { href: "/admin/users", label: "User Management" },
          { href: "/admin/change-password", label: "Change Password" },
          { href: "/admin/setup-2fa", label: "Setup 2FA" },
        ]}
      />

      <div style={styles.userBar}>
        <span style={styles.userText}>
          👤 {auth.user?.username} ({auth.user?.role})
        </span>
        <button onClick={() => adminLogout()} style={styles.logoutBtn}>
          Logout
        </button>
      </div>

      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Setup Two-Factor Authentication</h1>
          <p style={styles.subtitle}>
            Protect your account with TOTP (Time-based One-Time Password)
          </p>

          {error && <div style={styles.error}>⚠️ {error}</div>}
          {success && <div style={styles.success}>✅ {success}</div>}

          {totp2faEnabled ? (
            <div style={styles.status}>
              <p>✅ <strong>2FA is enabled on your account</strong></p>
              <p style={{ fontSize: "14px", color: "#888" }}>
                Use your authenticator app to generate codes when logging in.
              </p>
              <button
                onClick={handleDisable2fa}
                disabled={loading}
                style={{ ...styles.button, ...styles.dangerButton }}
              >
                {loading ? "⏳ Disabling..." : "❌ Disable 2FA"}
              </button>
            </div>
          ) : (
            <>
              {step === "not-started" && (
                <button
                  onClick={handleStartSetup}
                  disabled={loading}
                  style={styles.button}
                >
                  {loading ? "⏳ Starting..." : "🔐 Start 2FA Setup"}
                </button>
              )}

              {step === "setup" && (
                <div style={styles.setupArea}>
                  <div style={styles.qrContainer}>
                    {qrCode && (
                      <>
                        <p style={styles.setupText}>1. Scan this QR code with your authenticator app:</p>
                        <img src={qrCode} alt="TOTP QR Code" style={styles.qrCode} />
                        <p style={styles.setupText}>
                          Or enter manually: <code style={styles.code}>{secret}</code>
                        </p>
                      </>
                    )}
                  </div>

                  <form onSubmit={handleVerifyCode} style={styles.form}>
                    <div style={styles.field}>
                      <label style={styles.label}>2. Enter 6-digit code from your app:</label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="000000"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                        style={styles.input}
                        disabled={loading}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || code.length !== 6}
                      style={styles.button}
                    >
                      {loading ? "⏳ Verifying..." : "✅ Verify & Enable 2FA"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("not-started");
                        setCode("");
                      }}
                      style={{ ...styles.button, ...styles.secondaryButton }}
                      disabled={loading}
                    >
                      ← Cancel
                    </button>
                  </form>
                </div>
              )}
            </>
          )}

          <div style={styles.infoBox}>
            <h3>What is 2FA?</h3>
            <p>
              Two-factor authentication adds an extra layer of security by requiring a code from your phone when
              logging in.
            </p>
            <p>
              <strong>Supported apps:</strong> Google Authenticator, Microsoft Authenticator, Authy, 1Password, etc.
            </p>
          </div>
        </div>
      </div>
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
  userBar: {
    background: "#0f1423",
    padding: "8px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userText: {
    color: "#aaa",
    fontSize: "14px",
  },
  logoutBtn: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
  },
  container: {
    maxWidth: "600px",
    margin: "40px auto",
    padding: "20px",
  },
  card: {
    background: "#0f1423",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "30px",
    color: "#fff",
  },
  title: {
    fontSize: "24px",
    fontWeight: "600",
    margin: "0 0 8px 0",
  },
  subtitle: {
    color: "#888",
    margin: "0 0 20px 0",
  },
  error: {
    background: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444",
    padding: "12px",
    borderRadius: "4px",
    marginBottom: "16px",
    fontSize: "14px",
  },
  success: {
    background: "rgba(34, 197, 94, 0.1)",
    color: "#22c55e",
    padding: "12px",
    borderRadius: "4px",
    marginBottom: "16px",
    fontSize: "14px",
  },
  status: {
    background: "rgba(34, 197, 94, 0.1)",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    padding: "16px",
    borderRadius: "4px",
    marginBottom: "16px",
  },
  button: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    marginRight: "8px",
    marginBottom: "0px",
  },
  dangerButton: {
    background: "#dc2626",
  },
  secondaryButton: {
    background: "#475569",
  },
  setupArea: {
    marginBottom: "20px",
  },
  qrContainer: {
    textAlign: "center" as const,
    marginBottom: "20px",
    padding: "20px",
    background: "#1e293b",
    borderRadius: "4px",
  },
  qrCode: {
    maxWidth: "300px",
    margin: "16px 0",
    border: "2px solid rgba(255,255,255,0.1)",
    padding: "10px",
    background: "#fff",
  },
  setupText: {
    color: "#aaa",
    fontSize: "14px",
    margin: "8px 0",
  },
  form: {
    marginTop: "20px",
  },
  field: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "6px",
    color: "#ddd",
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    background: "#1e293b",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "4px",
    color: "#fff",
    fontSize: "14px",
    letterSpacing: "2px",
    textAlign: "center" as const,
  },
  code: {
    background: "#1e293b",
    padding: "4px 8px",
    borderRadius: "3px",
    fontFamily: "monospace",
  },
  infoBox: {
    background: "rgba(59, 130, 246, 0.1)",
    border: "1px solid rgba(59, 130, 246, 0.3)",
    padding: "16px",
    borderRadius: "4px",
    marginTop: "20px",
    fontSize: "13px",
    color: "#aaa",
  },
};

export default Setup2FAPage;
