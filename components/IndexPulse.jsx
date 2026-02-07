// components/IndexPulse.jsx
export default function IndexPulse() {
  // Purely decorative: a subtle animated stroke (disabled by prefers-reduced-motion in CSS)
  return (
    <svg className="pulse" viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true">
      <path
        className="pulsePath"
        d="M0,80 C80,55 120,95 180,70 C240,45 280,85 340,62 C400,39 440,78 500,55 C540,43 570,50 600,46"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.55"
      />
    </svg>
  );
}