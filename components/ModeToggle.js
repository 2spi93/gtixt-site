import { useEffect, useState } from "react";

export default function ModeToggle() {
  const [mode, setMode] = useState(() => {
    if (typeof window === "undefined") return "institutional";
    return localStorage.getItem("gtix_mode") || "institutional";
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.mode = mode;
  }, [mode]);

  function toggle() {
    const next = mode === "institutional" ? "terminal" : "institutional";
    setMode(next);
    localStorage.setItem("gtix_mode", next);
  }

  return (
    <button className="btn btn-ghost" onClick={toggle} title="Toggle Terminal Mode">
      {mode === "institutional" ? "Terminal" : "Institutional"}
    </button>
  );
}