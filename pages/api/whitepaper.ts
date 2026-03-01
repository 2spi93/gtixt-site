import type { NextApiRequest, NextApiResponse } from 'next';
import PDFDocument from 'pdfkit';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    });

    // Set response headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="GTIXT_Whitepaper_v1.1.pdf"');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Pipe PDF to response
    doc.pipe(res);

    // Title Page
    doc.fontSize(28).font('Helvetica-Bold').text('GTIXT', { align: 'center' });
    doc.fontSize(14).font('Helvetica').text('Global Prop Trading Index', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(20).font('Helvetica-Bold').text('Whitepaper v1.1', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(11).font('Helvetica').text(
      'An Institutional Benchmark for the Global Proprietary Trading Market',
      { align: 'center', width: 400 }
    );

    // Metadata
    doc.moveDown(2);
    doc.fontSize(10).font('Helvetica');
    doc.text('Version: 1.1', { align: 'center' });
    doc.text('Published: February 2026', { align: 'center' });
    doc.text('SHA-256: a3f2e1c9...7d4b5a8f', { align: 'center' });
    doc.moveDown(3);

    // Executive Summary
    doc.addPage();
    doc.fontSize(18).font('Helvetica-Bold').text('1. Executive Summary');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').text(
      'GTIXT is an institutional benchmark for the global proprietary trading market. It converts fragmented, public information into a deterministic, auditable index designed for institutions, regulators, data partners, and market participants.',
      { align: 'justify' }
    );
    doc.moveDown(0.5);
    doc.text(
      'This whitepaper specifies the complete GTIXT system: the five-pillar methodology, cryptographic integrity model, evidence-based extraction, versioning policy, and governance framework.',
      { align: 'justify' }
    );

    // Section 1
    doc.moveDown(1);
    doc.fontSize(18).font('Helvetica-Bold').text('2. Introduction');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').text(
      'The proprietary trading market has experienced rapid growth but remains fragmented and opaque. Firms operate without standardized disclosures, consistent rule structures, or comparable risk models. GTIXT exists to bridge this gap.',
      { align: 'justify' }
    );
    doc.moveDown(0.5);
    doc.text(
      'By converting publicly observable information into structured, deterministic signals, GTIXT provides institutional-grade transparency and accountability.',
      { align: 'justify' }
    );

    // Section 2
    doc.moveDown(1);
    doc.fontSize(18).font('Helvetica-Bold').text('3. Methodology');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').text(
      'GTIXT v1.0 measures operational quality across five pillars:',
      { align: 'justify' }
    );
    doc.moveDown(0.5);

    const pillars = [
      '1. Transparency - Clarity of rules, pricing, and terms',
      '2. Payout Reliability - Structural consistency of payout logic',
      '3. Risk Model - Quality of loss limits and drawdown logic',
      '4. Legal Compliance - Jurisdiction risk and regulatory exposure',
      '5. Reputation & Support - External signals and support quality'
    ];

    pillars.forEach(pillar => {
      doc.text(`• ${pillar}`, { width: 450 });
    });

    // Section 3
    doc.moveDown(1);
    doc.fontSize(18).font('Helvetica-Bold').text('4. Data Collection');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').text(
      'GTIXT operates 8 specialized agents that collect evidence and compute metrics:',
      { align: 'justify' }
    );
    doc.moveDown(0.5);

    const agents = [
      'Agent A - Crawler: Fetches firm website HTML',
      'Agent B - Extractor: Parses HTML for structured data',
      'RVI - Registry Verification: License verification',
      'SSS - Sanctions Screening: Watchlist screening',
      'REM - Regulatory Events: Monitors regulatory actions',
      'IRS - Review System: Processes manual submissions',
      'FRP - Reputation & Payout: Analyzes reviews and reliability',
      'MIS - Investigation System: WHOIS and company verification'
    ];

    agents.forEach(agent => {
      doc.text(`• ${agent}`, { width: 450 });
    });

    // Section 4
    doc.moveDown(1);
    doc.fontSize(18).font('Helvetica-Bold').text('5. Integrity & Verification');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').text(
      'Every snapshot is cryptographically signed with SHA-256 hashes. The integrity beacon allows independent verification of data immutability and publication provenance.',
      { align: 'justify' }
    );

    // Section 5
    doc.moveDown(1);
    doc.fontSize(18).font('Helvetica-Bold').text('6. Versioning & Evolution');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').text(
      'GTIXT methodology evolves through explicit semantic versions. Each version is immutable for historical reproducibility:',
      { align: 'justify' }
    );
    doc.moveDown(0.5);
    doc.text('• v1.0 (Current) - Q1 2026: Core 5-pillar system with 8 agents', { width: 450 });
    doc.text('• v1.1 (Planned) - Q2-Q3 2026: Agent C integration (Integrity Gate)', { width: 450 });
    doc.text('• v2.0 (Future) - 2027: Strategic planning phase', { width: 450 });

    // Section 6
    doc.moveDown(1);
    doc.fontSize(18).font('Helvetica-Bold').text('7. API & Access');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').text(
      'The GTIXT API provides programmatic access to:',
      { align: 'justify' }
    );
    doc.moveDown(0.5);
    doc.text('• /api/snapshots - Latest universe snapshots', { width: 450 });
    doc.text('• /api/firms - Firm-level scores and metrics', { width: 450 });
    doc.text('• /api/firm/{id} - Individual firm details', { width: 450 });
    doc.text('• /api/integrity - Cryptographic verification', { width: 450 });

    // Section 7
    doc.moveDown(1);
    doc.fontSize(18).font('Helvetica-Bold').text('8. Governance');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').text(
      'GTIXT operates under a neutral, multi-stakeholder governance model with clear processes for specification updates, agent modifications, and methodology evolution.',
      { align: 'justify' }
    );

    // Section 8
    doc.moveDown(1);
    doc.fontSize(18).font('Helvetica-Bold').text('9. Conclusion');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').text(
      'GTIXT transforms fragmented market information into institutional-grade transparency. By combining deterministic methodology, cryptographic verification, and open governance, it establishes a standard for accountability in proprietary trading.',
      { align: 'justify' }
    );

    // Footer
    doc.moveDown(2);
    doc.fontSize(9).font('Helvetica').text(
      'This whitepaper is published under CC-BY-4.0. For updates and corrections, visit https://gpti.example.com',
      { align: 'center' }
    );

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
}
