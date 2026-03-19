import Link from 'next/link'

export default function AdminSecurityIndexPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-300">Security Center</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Admin Security Controls</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Centralized access to password rotation and two-factor authentication controls.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/admin/security/password"
          className="rounded-2xl border border-white/10 bg-slate-900/45 p-5 transition-colors hover:border-cyan-400/40 hover:bg-slate-900/70"
        >
          <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Credential Hygiene</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Change Password</h2>
          <p className="mt-2 text-sm text-slate-400">Rotate the current admin password and maintain credential freshness.</p>
        </Link>

        <Link
          href="/admin/security/2fa"
          className="rounded-2xl border border-white/10 bg-slate-900/45 p-5 transition-colors hover:border-cyan-400/40 hover:bg-slate-900/70"
        >
          <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Access Hardening</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Manage Two-Factor Auth</h2>
          <p className="mt-2 text-sm text-slate-400">Enable, verify, or reconfigure TOTP protection for privileged sessions.</p>
        </Link>
      </div>
    </div>
  )
}