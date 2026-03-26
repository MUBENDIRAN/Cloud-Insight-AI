# Changelog

All notable changes to Cloud Insight AI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-24

### Added
- Initial release of Cloud Insight AI as a Python library
- `CloudAnalyzer` class for orchestrating cost and log analysis
- Cost analysis with service totals, trends, and anomaly detection
- Log analysis with error detection and pattern matching
- Pluggable provider architecture for AI and storage backends
- AWS Comprehend integration for NLP insights
- S3 storage provider for result persistence
- Threshold-based alerting system
- Standalone `analyze_cost()` and `analyze_logs()` functions
- CLI wrapper for file-based Docker workflows
- Comprehensive documentation and examples
- Type hints throughout codebase
- MIT License

### Features
- **Cost Analysis**
  - Aggregate costs by AWS service
  - Track spending trends over time
  - Identify highest-cost services
  - Configurable cost thresholds

- **Log Analysis**
  - Parse multiple log levels (INFO, WARNING, ERROR, CRITICAL)
  - Custom error pattern matching
  - Log level statistics
  - Smart recommendations

- **AI Insights** (Optional)
  - Key phrase extraction
  - Sentiment analysis
  - Entity recognition
  - Powered by AWS Comprehend

- **Provider System**
  - Abstract provider interfaces
  - AWS Comprehend provider
  - S3 storage provider
  - No-op providers for testing
  - Easy to extend with custom providers

- **Alert System**
  - Automatic alert generation
  - Multiple severity levels (critical, high, medium, low)
  - Cost and log-based alerts
  - Customizable thresholds

### Technical
- Python 3.8+ support
- Proper package structure (`src/cloud_insight_ai/`)
- Comprehensive test suite with pytest
- Type annotations for better IDE support
- Clean separation of concerns
- Well-documented API

### Dependencies
- boto3 >= 1.26.0, < 2.0.0
- pyyaml >= 6.0, < 7.0.0

### Known Limitations
- AWS Comprehend requires AWS credentials
- S3 storage requires appropriate IAM permissions
- Docker CLI requires file-based input (not streaming)

### Future Plans
- Support for more cloud providers (Azure, GCP)
- Interactive CLI with rich formatting
- Real-time log streaming
- Machine learning-based anomaly detection
- Web dashboard improvements

---

## [Unreleased]

### Planned
- GitHub Actions CI/CD pipeline
- Automated PyPI publishing
- Enhanced documentation with Sphinx
- More test coverage (target: 90%+)
- Performance optimizations for large datasets
- Async provider support

---

**Note**: This is the first public release. Previous versions were internal development builds.

[0.1.0]: https://github.com/MUBENDIRAN/Cloud-Insight-AI/releases/tag/v0.1.0
[Unreleased]: https://github.com/MUBENDIRAN/Cloud-Insight-AI/compare/v0.1.0...HEAD
