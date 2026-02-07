# GTIXT — The Global Prop Trading Index

**Benchmark Authority + Future Finance**

Institutional-grade benchmark for proprietary trading firms with complete transparency, rules-based methodology, and developer-first API access.

## 🌟 Unique Value Proposition

GTIXT is the world's first institutional benchmark specifically designed for the proprietary trading industry, combining:

- **Rules-based methodology** with zero human intervention
- **Complete transparency** through detailed methodology documentation
- **Accountability** via SHA256 integrity proofs and audit trails
- **Developer-first access** with comprehensive API documentation
- **Quality assurance** through automated Oversight Gate verification gates

## 📊 Live Index

Access the latest benchmark data:
- **Live Index**: [View Current Rankings](https://gtixt.com)
- **API Endpoint**: `https://gtixt.com/gpti-snapshots/universe_v0.1_public/_public/latest.json`
- **Methodology**: [Complete Documentation](/methodology)
- **API Docs**: [Developer Access](/api)

## 🏗️ Architecture

### Data Pipeline

**Production Mode**:
```
Public Sources → Crawling → Scoring (5 Pillars) → Oversight Gate → MinIO Storage → API Publication
```

**Development Mode**:
```
Test Data Generator → Local JSON File → API (Fallback) → Frontend
```

### Data Sources

| Environment | Data Source | Location | Purpose |
|---|---|---|---|
| **Production** | Bot-generated snapshots | MinIO: `universe_v0.1_public/latest.json` | Live index data |
| **Development** | Test data generator | `/data/test-snapshot.json` | Frontend development |

**Key Documentation**:
- Bot architecture and agent roles: [`gpti-data-bot/docs/BOT_ARCHITECTURE.md`](/opt/gpti/gpti-data-bot/docs/BOT_ARCHITECTURE.md)
- Test data generator: [`docs/TEST_DATA_GENERATOR.md`](docs/TEST_DATA_GENERATOR.md)

**Separation of Concerns**:
- **gpti-data-bot**: Crawls, scores, validates, publishes production data
- **gpti-site**: Displays data, provides user interface
- **Test generator**: Development tool only (not used in production)

### Scoring Framework (v1.0)
1. **Regulatory Compliance** - Jurisdiction quality and oversight
2. **Operational Excellence** - Technology and risk management
3. **Financial Strength** - Capital adequacy and stability
4. **Transparency & Governance** - Disclosure and accountability
5. **Market Impact** - Ecosystem contribution

### Quality Assurance
- **Oversight Gate**: Automated quality gates with deterministic rules
- **Confidence Scoring**: High/Medium/Low based on data completeness
- **NA Rate Tracking**: Transparency on missing data
- **SHA256 Integrity**: Cryptographic proof of data authenticity

## 🚀 Features

### Core Functionality
- **Live Index Table**: Sortable, filterable rankings with institutional metrics
- **Dual Theme Modes**: Institutional (Light) and Terminal (Dark) interfaces
- **Index Tape**: Real-time metrics ticker (count, median score, pass rate, SHA256)
- **Firm Profiles**: Detailed scoring breakdown with evidence links

### Unique Differentiators
- **Proof-of-Index**: SHA256 hashes and immutable audit trails
- **Confidence Layer**: Anti-bias scoring with data sufficiency metrics
- **Regulatory Radar**: Jurisdiction monitoring and compliance tracking
- **Terminal Mode**: Bloomberg-style interface for power users
- **Methodology Explorer**: Interactive framework documentation

### Developer Experience
- **RESTful API**: JSON-first with comprehensive schema documentation
- **Rate Limits**: Anonymous (100/hr) and API key tiers (10k/hr)
- **SDK Examples**: JavaScript, Python, and curl implementations
- **Webhook Support**: Real-time notifications for index updates

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 with server runtime and API routes
- **Styling**: Styled JSX with institutional design system
- **API**: RESTful JSON endpoints with CORS support
- **Storage**: MinIO S3-compatible object storage
- **Deployment**: Netlify with automatic builds
- **Security**: HTTPS with security headers and rate limiting

## 📈 Roadmap

### Phase 1 (Current)
- ✅ Rules-based scoring framework
- ✅ Oversight Gate quality verification
- ✅ Public API with integrity proofs
- ✅ Institutional UI/UX

### Phase 2 (Q2 2026)
- 🔄 Historical snapshots and time-series
- 🔄 Regulatory alerts and monitoring
- 🔄 Advanced filtering and search
- 🔄 API key management

### Phase 3 (Q3 2026)
- 📋 Token integration and DeFi compatibility
- 📋 Real-time scoring updates
- 📋 Institutional API with SLA guarantees
- 📋 Multi-language SDKs

## 🤝 Governance & Transparency

### Methodology Versioning
- **v1.0**: Initial framework with 5-pillar scoring
- **Change Logs**: Complete audit trail of methodology updates
- **Community Review**: Open feedback process for improvements

### Data Quality Standards
- **IOSCO Compliance**: Alignment with international standards
- **Audit Trails**: Complete record of scoring decisions
- **Data Hierarchy**: Structured approach to information quality
- **Restatement Policy**: Clear rules for data corrections

## 📚 Documentation

- **[Methodology v1.0](/methodology)**: Complete scoring framework
- **[API Documentation](/api)**: Developer integration guide
- **[Governance](/governance)**: Policies and procedures
- **[Transparency Reports](/reports)**: Quarterly data quality assessments

## 🏢 Institutional Adoption

GTIXT is designed for:
- **Asset Managers**: Benchmark for prop trading allocation
- **Regulators**: Industry monitoring and oversight
- **Investment Banks**: Due diligence and risk assessment
- **Prop Firms**: Performance benchmarking and transparency
- **Investors**: Data-driven investment decisions

## 📞 Contact & Support

- **Email**: team@center.gtixt.com
- **API Status**: [Uptime Monitoring](https://status.gtixt.com)
- **Documentation**: [Developer Portal](https://docs.gtixt.com)
- **Community**: [Discord Server](https://discord.gg/gtixt)

---

**GTIXT** — Where institutional standards meet proprietary trading excellence.
