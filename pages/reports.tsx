import Layout from "../components/Layout";
import SeoHead from "../components/SeoHead";
import InstitutionalHeader from "../components/InstitutionalHeader";
import Link from "next/link";
import { useTranslation } from "../lib/useTranslationStub";

export default function Reports() {
  const { t } = useTranslation("common");
  return (
    <>
      <SeoHead
        title="Reports & Documentation — GTIXT"
        description="Phase 1 and Phase 2 reports, compliance documentation, and technical specifications."
      />
      <InstitutionalHeader breadcrumbs={[{ label: "Reports", href: "/reports" }]} />
      <Layout>
        <div className="page-header">
          <p className="eyebrow">RESEARCH & ANALYSIS</p>
          <h1>Reports & Documentation</h1>
          <p className="lead">
            Phase 1 validation framework and Phase 2 bot agent system documentation, reports, and specifications.
          </p>
        </div>

        <div className="content">
          {/* Phase 2 Section */}
          <section className="card">
            <h2>🤖 Phase 2 Bot Framework (NEW)</h2>
            <p style={{ fontSize: '16px', marginBottom: '24px', lineHeight: 1.6 }}>
              Phase 2 introduces 7 specialized bot agents for automated compliance verification. All agents are complete, tested, and production-ready.
            </p>

            <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '24px', marginBottom: '12px' }}>Latest Phase 2 Reports</h3>
            <div className="reports-list">
              <div className="report-item">
                <h3>Phase 2 Delivery Report</h3>
                <p>Executive summary of Phase 2 completion with metrics, testing results, and production readiness assessment.</p>
                <a href="/downloads/PHASE_2_DELIVERY_REPORT.md" className="btn btn-secondary">📄 Download Report</a>
              </div>

              <div className="report-item">
                <h3>Phase 2 Final Status</h3>
                <p>Complete status report including all 7 agents, performance metrics, quality standards, and Phase 3 roadmap.</p>
                <a href="/downloads/PHASE_2_FINAL_STATUS.md" className="btn btn-secondary">📄 View Status</a>
              </div>

              <div className="report-item">
                <h3>Phase 2 Implementation Summary</h3>
                <p>Detailed technical breakdown of the bot framework implementation, code statistics, and testing results.</p>
                <a href="/downloads/PHASE_2_IMPLEMENTATION_SUMMARY.md" className="btn btn-secondary">📄 Read Summary</a>
              </div>

              <div className="report-item">
                <h3>Phase 2 Quick Start Guide</h3>
                <p>Quick reference guide for running Phase 2 agents, understanding the architecture, and exploring the system.</p>
                <a href="/downloads/PHASE_2_QUICKSTART.md" className="btn btn-secondary">🚀 Quick Start</a>
              </div>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '24px', marginBottom: '12px' }}>Phase 2 Weekly Completion Reports</h3>
            <div className="reports-list">
              <div className="report-item">
                <h3>Week 1: RVI + SSS Agents</h3>
                <p>Foundation agents - Registry verification and sanctions screening. 2 agents, 1,827 lines, 16/16 tests passing.</p>
                <a href="/downloads/PHASE_2_WEEK_1_COMPLETE.md" className="btn btn-secondary">📊 Week 1 Report</a>
              </div>

              <div className="report-item">
                <h3>Week 2: REM + IRS Agents</h3>
                <p>Regulatory monitoring and submission reviews. 4 agents total, 769 lines, evidence pipeline complete.</p>
                <a href="/downloads/PHASE_2_WEEK_2_COMPLETE.md" className="btn btn-secondary">📊 Week 2 Report</a>
              </div>

              <div className="report-item">
                <h3>Week 3: FRP + MIS Agents</h3>
                <p>Reputation analysis and investigation system. 6 agents total, 1,216 lines, full orchestration tested.</p>
                <a href="/downloads/PHASE_2_WEEK_3_COMPLETE.md" className="btn btn-secondary">📊 Week 3 Report</a>
              </div>

              <div className="report-item">
                <h3>Week 4: IIP Agent & Completion</h3>
                <p>IOSCO compliance reporting. All 7 agents complete, 4,524 lines total, production-ready, 0 critical issues.</p>
                <a href="/downloads/PHASE_2_WEEK_4_COMPLETE.md" className="btn btn-secondary">📊 Week 4 Report</a>
              </div>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '24px', marginBottom: '12px' }}>Phase 2 Documentation</h3>
            <div className="reports-list">
              <div className="report-item">
                <h3>Phase 2 Complete Plan</h3>
                <p>Original 4-week implementation plan with detailed specifications for all 7 agents.</p>
                <a href="/downloads/PHASE_2_PLAN.md" className="btn btn-secondary">📋 View Plan</a>
              </div>

              <div className="report-item">
                <h3>Phase 2 Documentation Index</h3>
                <p>Complete index of all Phase 2 documentation with quick navigation and references.</p>
                <a href="/downloads/PHASE_2_DOCUMENTATION_INDEX.md" className="btn btn-secondary">📚 Documentation Index</a>
              </div>
            </div>
          </section>

          {/* Phase 1 Section */}
          <section className="card">
            <h2>📋 Phase 1 Validation Framework</h2>
            <p style={{ fontSize: '16px', marginBottom: '24px', lineHeight: 1.6 }}>
              Phase 1 validation framework with compliance infrastructure, validation tests, and ground truth alignment.
            </p>

            <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '24px', marginBottom: '12px' }}>Latest Reports</h3>
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

            <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '24px', marginBottom: '12px' }}>Phase 1 Documentation</h3>
            <div className="reports-list">
              <div className="report-item">
                <h3>VERIFIED_FEED_SPEC_v1.1</h3>
                <p>Partner API specification for verified data feeds and evidence integration.</p>
                <a href="#" className="btn btn-secondary">📄 View Spec</a>
              </div>

              <div className="report-item">
                <h3>IOSCO_COMPLIANCE_v1.1</h3>
                <p>IOSCO compliance evidence and regulatory certification documentation.</p>
                <a href="#" className="btn btn-secondary">📄 View Compliance</a>
              </div>

              <div className="report-item">
                <h3>RELEASE_NOTES_v1.1</h3>
                <p>Complete changelog and migration guide for Phase 1 updates.</p>
                <a href="#" className="btn btn-secondary">📄 Release Notes</a>
              </div>
            </div>
          </section>

          {/* Quick Access */}
          <section className="card">
            <h2>Quick Access</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px' }}>
              <Link href="/phase2" style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '6px', textDecoration: 'none', color: 'inherit', border: '1px solid #e0e0e0' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700 }}>📄 Phase 2 Overview</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Complete interactive page</p>
              </Link>
              <Link href="/agents-dashboard" style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '6px', textDecoration: 'none', color: 'inherit', border: '1px solid #e0e0e0' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700 }}>🤖 Agent Dashboard</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Real-time monitoring</p>
              </Link>
              <Link href="/docs" style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '6px', textDecoration: 'none', color: 'inherit', border: '1px solid #e0e0e0' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700 }}>📚 Full Documentation</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Phase 1 & 2 docs</p>
              </Link>
              <Link href="/validation" style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '6px', textDecoration: 'none', color: 'inherit', border: '1px solid #e0e0e0' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700 }}>✅ Validation Tests</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Phase 1 metrics</p>
              </Link>
            </div>
          </section>

          <section className="card">
            <h2>Report Archive</h2>
            <p>Access historical reports and trend analysis from previous periods.</p>
            <a href="#" className="btn btn-primary">Browse Archive</a>
          </section>
        </div>
      </Layout>
    </>
  );
}
