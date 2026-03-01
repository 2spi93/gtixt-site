import Layout from "../components/Layout";
import SeoHead from "../components/SeoHead";
import InstitutionalHeader from "../components/InstitutionalHeader";

export default function Governance() {
  return (
    <>
      <SeoHead
        title="GTIXT Governance"
        description="Governance principles, advisory framework, and change management for GTIXT."
      />
      <InstitutionalHeader
        breadcrumbs={[{ label: "Governance", href: "/governance" }]}
      />
      <Layout>
        <div className="page-header">
          <p className="eyebrow">Governance</p>
          <h1>Governance & Methodological Oversight</h1>
          <p className="lead">Institutional-grade governance designed for neutrality, transparency, and reproducibility.</p>
        </div>

        <div className="content">
          <section className="card">
            <h2>Governance Principles</h2>
            <ul>
              <li><strong>Independence:</strong> No paid rankings, no commercial influence on scores.</li>
              <li><strong>Transparency:</strong> Public methodologies and versioned changes.</li>
              <li><strong>Reproducibility:</strong> Deterministic scoring with auditable outputs.</li>
              <li><strong>Separation of roles:</strong> Data collection, scoring, and publication are isolated.</li>
            </ul>
          </section>

          <section className="card">
            <h2>Advisory Board (Framework)</h2>
            <p>
              The advisory board does not participate in scoring decisions. Its role is limited to methodological review and long-term oversight.
            </p>
            <ul>
              <li>Former regulators</li>
              <li>Quantitative risk experts</li>
              <li>Fintech infrastructure leaders</li>
              <li>Compliance specialists</li>
            </ul>
          </section>

          <section className="card">
            <h2>Change Management</h2>
            <ul>
              <li>Proposal</li>
              <li>Methodology review</li>
              <li>Public publication</li>
              <li>Effective date (versioned)</li>
            </ul>
            <p>No score can be altered retroactively.</p>
          </section>

          <section className="card">
            <h2>Governance Scope</h2>
            <p>
              Governance covers methodology versioning, audit trails, data contract integrity, and public transparency policies.
            </p>
          </section>
        </div>
      </Layout>
    </>
  );
}
