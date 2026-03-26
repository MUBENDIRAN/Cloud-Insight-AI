# 🤝 Contributing to Cloud Insight AI

Thank you for your interest in contributing to Cloud Insight AI! We're excited to have you as part of our GitHub student community. 🎓

This project is open to contributions from developers of all skill levels. Whether you're fixing a bug, adding a feature, improving documentation, or suggesting ideas, your contributions are welcome!

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing](#testing)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Reporting Issues](#reporting-issues)
- [Feature Requests](#feature-requests)
- [Community](#community)

---

## 📜 Code of Conduct

This project follows the [GitHub Community Guidelines](https://docs.github.com/en/site-policy/github-terms/github-community-guidelines). By participating, you are expected to uphold this code. Please report unacceptable behavior to [mubiii7722@gmail.com](mailto:mubiii7722@gmail.com).

**TL;DR**: Be respectful, inclusive, and constructive. We're all here to learn and grow together! 🌱

---

## 🎯 How Can I Contribute?

### 🐛 Reporting Bugs
Found a bug? Help us fix it!
- Check if the bug has already been reported in [Issues](https://github.com/MUBENDIRAN/Cloud-Insight-AI/issues)
- If not, create a new issue with a clear title and description
- Include steps to reproduce, expected behavior, and actual behavior
- Add relevant logs, screenshots, or error messages

### ✨ Suggesting Features
Have an idea to improve the project?
- Check existing [Feature Requests](https://github.com/MUBENDIRAN/Cloud-Insight-AI/issues?q=is%3Aissue+label%3Aenhancement)
- Open a new issue with the `enhancement` label
- Describe the feature, its use case, and why it would be valuable

### 📝 Improving Documentation
Documentation is just as important as code!
- Fix typos or clarify confusing sections
- Add examples or tutorials
- Update outdated information
- Improve README, docstrings, or comments

### 💻 Writing Code
Ready to code? Here's what we need:
- Bug fixes
- New features
- Performance improvements
- Test coverage improvements
- Code refactoring

---

## 🚀 Getting Started

### Prerequisites

- **Python**: 3.8 or higher
- **Git**: For version control
- **AWS Account** (optional): For testing AWS integrations
- **pip**: Python package installer

### Fork and Clone

1. **Fork** the repository by clicking the "Fork" button at the top right
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/Cloud-Insight-AI.git
   cd Cloud-Insight-AI
   ```
3. **Add upstream** remote:
   ```bash
   git remote add upstream https://github.com/MUBENDIRAN/Cloud-Insight-AI.git
   ```

---

## 🛠️ Development Setup

### 1. Create a Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
# Install the package in editable mode with dev dependencies
pip install -e ".[dev]"
```

This installs:
- Core dependencies: `boto3`, `pyyaml`, `requests`, `python-dotenv`
- Dev tools: `pytest`, `black`, `flake8`, `mypy`

### 3. Verify Installation

```bash
# Run tests to ensure everything works
pytest

# Check code formatting
black --check src/

# Run linter
flake8 src/
```

---

## 🔨 Making Changes

### 1. Create a Branch

Always create a new branch for your changes:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests

### 2. Make Your Changes

- Write clean, readable code
- Follow the [Code Style Guidelines](#code-style-guidelines)
- Add tests for new functionality
- Update documentation as needed
- Keep commits focused and atomic

### 3. Commit Your Changes

Write clear, descriptive commit messages:

```bash
git add .
git commit -m "feat: add cost anomaly detection feature"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Adding/updating tests
- `refactor:` - Code refactoring
- `style:` - Code style changes (formatting, etc.)
- `chore:` - Maintenance tasks

---

## 🎨 Code Style Guidelines

We follow **PEP 8** with some customizations:

### Formatting

- **Line length**: 100 characters
- **Indentation**: 4 spaces (no tabs)
- **Quotes**: Double quotes for strings
- **Use Black** for automatic formatting:
  ```bash
  black src/
  ```

### Python Best Practices

```python
# Good: Clear function names and docstrings
def analyze_cost_data(cost_records: list) -> dict:
    """
    Analyze AWS cost records and return insights.
    
    Args:
        cost_records: List of cost record dictionaries
        
    Returns:
        Dictionary containing analysis results
    """
    pass

# Good: Type hints
from typing import List, Dict, Optional

def process_logs(logs: List[str], filter_level: Optional[str] = None) -> Dict[str, any]:
    pass

# Good: Descriptive variable names
total_cost = sum(record['cost'] for record in cost_records)

# Bad: Single letter variables (except in loops)
t = sum(r['cost'] for r in c)
```

### Imports

```python
# Standard library imports
import os
import sys
from typing import List, Dict

# Third-party imports
import boto3
import yaml

# Local imports
from cloud_insight_ai.core import CloudAnalyzer
from cloud_insight_ai.providers import AWSProvider
```

### Documentation

- Add docstrings to all public functions, classes, and modules
- Use Google-style or NumPy-style docstrings
- Include examples in docstrings when helpful

---

## 🧪 Testing

We use **pytest** for testing. All new features should include tests.

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage report
pytest --cov=src/cloud_insight_ai --cov-report=html

# Run specific test file
pytest tests/test_analyzer.py

# Run specific test function
pytest tests/test_analyzer.py::test_cost_analysis
```

### Writing Tests

Place tests in the `tests/` directory:

```python
# tests/test_analyzer.py
import pytest
from cloud_insight_ai import CloudAnalyzer

def test_analyze_cost_data():
    """Test cost data analysis returns correct format."""
    analyzer = CloudAnalyzer()
    cost_data = [{'service': 'EC2', 'cost': 100.0}]
    
    result = analyzer.analyze_costs(cost_data)
    
    assert 'total_cost' in result
    assert result['total_cost'] == 100.0

def test_analyze_empty_data():
    """Test analyzer handles empty data gracefully."""
    analyzer = CloudAnalyzer()
    result = analyzer.analyze_costs([])
    
    assert result['total_cost'] == 0.0
```

---

## 📤 Submitting a Pull Request

### Before Submitting

1. **Update your branch** with the latest upstream changes:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks**:
   ```bash
   # Format code
   black src/ tests/
   
   # Run linter
   flake8 src/ tests/
   
   # Run tests
   pytest
   ```

3. **Update documentation** if needed:
   - README.md for user-facing changes
   - Docstrings for API changes
   - CHANGELOG.md for notable changes

### Submit PR

1. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**:
   - Go to your fork on GitHub
   - Click "Compare & pull request"
   - Fill out the PR template with:
     - Clear description of changes
     - Related issue number (if applicable)
     - Testing performed
     - Screenshots (if UI changes)

3. **PR Title Format**:
   ```
   feat: add cost anomaly detection
   fix: resolve S3 connection timeout
   docs: update installation instructions
   ```

### Review Process

- A maintainer will review your PR
- Address any feedback or requested changes
- Once approved, your PR will be merged! 🎉
- Your contribution will be credited in the CHANGELOG

---

## 🐞 Reporting Issues

### Bug Reports

Use the [Bug Report template](https://github.com/MUBENDIRAN/Cloud-Insight-AI/issues/new) and include:

- **Clear title**: Summarize the issue in one line
- **Description**: What happened vs. what you expected
- **Steps to reproduce**: Numbered steps to trigger the bug
- **Environment**:
  - OS (Windows/Linux/Mac)
  - Python version
  - Package version
- **Logs/Screenshots**: Any relevant error messages or visuals

### Good Example

```
Title: Cost analyzer fails with empty date field

Description:
When processing cost records with missing date fields, the analyzer 
throws a KeyError instead of handling it gracefully.

Steps to Reproduce:
1. Create cost record: {'service': 'EC2', 'cost': 100.0}
2. Call analyzer.analyze_costs([record])
3. KeyError: 'date' is raised

Environment:
- OS: Windows 11
- Python: 3.10.5
- cloud-insight-ai: 1.0.0

Error:
KeyError: 'date' at line 45 in analyzer.py
```

---

## 💡 Feature Requests

Have an idea? We'd love to hear it!

**Open an issue** with:
- **Clear title**: Brief description of the feature
- **Problem**: What problem does this solve?
- **Proposed solution**: How should it work?
- **Alternatives**: Any other approaches you considered?
- **Use case**: Real-world scenario where this helps

---

## 👥 Community

### Get Help

- 💬 **Discussions**: Use [GitHub Discussions](https://github.com/MUBENDIRAN/Cloud-Insight-AI/discussions) for questions
- 🐛 **Issues**: Report bugs and request features
- 📧 **Email**: Reach out to [mubiii7722@gmail.com](mailto:mubiii7722@gmail.com)

### Recognition

All contributors will be:
- Listed in CHANGELOG.md
- Credited in release notes
- Added to the Contributors section (if applicable)

### First-Time Contributors

New to open source? Welcome! 🌟

Look for issues labeled:
- `good first issue` - Great for beginners
- `help wanted` - We'd love assistance
- `documentation` - Improve docs (no coding required)

---

## 📚 Resources

- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)
- [Python PEP 8 Style Guide](https://pep8.org/)
- [Writing Good Commit Messages](https://chris.beams.io/posts/git-commit/)
- [Pytest Documentation](https://docs.pytest.org/)

---

## 🙏 Thank You!

Your contributions make this project better for everyone. Whether it's a typo fix or a major feature, every contribution matters!

Happy coding! 💻✨

---

**Questions?** Don't hesitate to ask in [Discussions](https://github.com/MUBENDIRAN/Cloud-Insight-AI/discussions) or reach out to the maintainers.

**License**: By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
