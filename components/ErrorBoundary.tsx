import React, { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error) {
    console.error("Error caught by boundary:", error);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <h1 style={styles.title}>⚠️ Something went wrong</h1>
            <p style={styles.message}>{this.state.error?.message || "An unexpected error occurred"}</p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={styles.button}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #070B12 0%, #0F1620 100%)",
    padding: "2rem",
  },
  content: {
    textAlign: "center",
    padding: "3rem",
    background: "rgba(0, 209, 193, 0.05)",
    borderRadius: "12px",
    border: "1px solid rgba(0, 209, 193, 0.2)",
    maxWidth: "500px",
  },
  title: {
    fontSize: "1.5rem",
    color: "#FF6B6B",
    marginBottom: "1rem",
  },
  message: {
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: "2rem",
    lineHeight: 1.6,
  },
  button: {
    padding: "0.75rem 1.5rem",
    background: "#00D1C1",
    color: "#070B12",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.875rem",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s",
  },
};
