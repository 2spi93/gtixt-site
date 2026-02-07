import Layout from "../components/Layout";
import SeoHead from "../components/SeoHead";
import InstitutionalHeader from "../components/InstitutionalHeader";

export default function Reports() {
  return (
    <>
      <SeoHead
        title="Institutional Reports — GTIXT"
        description="Quarterly and annual reports on prop trading industry trends and benchmark analysis."
      />
      <InstitutionalHeader
        breadcrumbs={[{ label: "Reports", href: "/reports" }]}
      />
      <Layout>
        <div className="page-header">
          <p className="eyebrow">RESEARCH & ANALYSIS</p>
          <h1>Institutional Reports</h1>
          <p className="lead">Quarterly and annual analysis of proprietary trading industry trends, regulatory developments, and benchmark performance metrics.</p>
        </div>

        <div className="content">
          <section className="card">
            <h2>Latest Reports</h2>
            <div className="reports-list">
              <div className="report-item">
                <h3>Q4 2025 Industry Report</h3>
                <p>Comprehensive analysis of prop trading trends and regulatory developments.</p>
                <a href="#" className="btn btn-secondary">Download PDF</a>
              </div>

              <div className="report-item">
                <h3>Annual Benchmark Review 2025</h3>
                <p>Year-end review of GTIXT performance and methodology updates.</p>
                <a href="#" className="btn btn-secondary">Download PDF</a>
              </div>

              <div className="report-item">
                <h3>Jurisdictional Analysis</h3>
                <p>Comparative analysis of regulatory frameworks across major jurisdictions.</p>
                <a href="#" className="btn btn-secondary">Download PDF</a>
              </div>
            </div>
          </section>

          <section className="card">
            <h2>Report Archive</h2>
            <p>Access historical reports and trend analysis from previous periods.</p>
            <a href="#" className="btn btn-primary">Browse Archive</a>
          </section>

          <section className="card">
            <h2>Custom Analytics</h2>
            <p>
              Enterprise clients can request custom reports and analytics based on specific
              criteria and time periods.
            </p>
            <a href="#" className="btn btn-primary">Request Custom Report</a>
          </section>
        </div>
      </Layout>
    </>
  );
}

