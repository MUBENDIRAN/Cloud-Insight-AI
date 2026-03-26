# ☁️ Cloud Insight AI

**AI-powered AWS cost and log analysis - Use as a Python library OR web dashboard**

[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![GitHub Stars](https://img.shields.io/github/stars/MUBENDIRAN/Cloud-Insight-AI?style=social)](https://github.com/MUBENDIRAN/Cloud-Insight-AI/stargazers)

---

## 🎯 Two Ways to Use

### 1️⃣ **Python Library** (Pip Install)
Use Cloud Insight AI in your Python code for programmatic analysis.

### 2️⃣ **Web Dashboard** (Cloud-Based)
Run the interactive web interface for visual analysis and insights.

---

## 📦 Library Mode (Pip Package)

### Installation

```bash
pip install cloud-insight-ai
```

### Usage

```python
from cloud_insight_ai import CloudAnalyzer

# Analyze your data
analyzer = CloudAnalyzer()
results = analyzer.run(cost_data, logs)
cost_data = [
    {'service': 'EC2', 'date': '2025-01-01', 'cost': 150.25},
    {'service': 'S3', 'date': '2025-01-01', 'cost': 45.50},
]

logs = [
    '2025-01-01 10:00:00 [INFO] Application started',
    '2025-01-01 10:05:30 [ERROR] Connection timeout',
]

# Analyze
analyzer = CloudAnalyzer()
result = analyzer.run(cost_data, logs)

# Results
print(f"Total cost: ${result['summary']['total_cost']:.2f}")
print(f"Errors: {result['summary']['error_count']}")
print(f"Alerts: {result['summary']['alert_count']}")
```

---

## 📚 Documentation

### Basic Usage

```python
# Full analysis
analyzer = CloudAnalyzer()
result = analyzer.run(cost_data, logs)
```

### Cost Analysis Only

```python
from cloud_insight_ai import analyze_cost

cost_result = analyze_cost(cost_data)
print(f"Total: ${cost_result['total_cost']:.2f}")
print(f"Top service: {cost_result['highest_cost_service']}")
```

### Log Analysis Only

```python
from cloud_insight_ai import analyze_logs

log_result = analyze_logs(logs)
print(f"Errors: {log_result['error_count']}")
print(f"Warnings: {log_result['warning_count']}")
```

### With Configuration

```python
config = {
    'cost_thresholds': {
        'high_cost_service_percent': 30.0
    },
    'log_thresholds': {
        'max_error_count': 15,
        'max_warning_count': 25
    },
    'error_patterns': [
        {'name': 'Connection Issues', 'keywords': ['connection', 'timeout']},
        {'name': 'Permission Errors', 'keywords': ['AccessDenied', 'unauthorized']}
    ]
}

analyzer = CloudAnalyzer(config=config)
result = analyzer.run(cost_data, logs)

# Check alerts
for alert in result['alerts']:
    print(f"[{alert['severity'].upper()}] {alert['message']}")
```

---

## 📊 Result Structure

```python
{
    'cost': {
        'total_cost': 280.75,
        'service_totals': {'EC2': 150.25, 'S3': 45.50, 'RDS': 85.00},
        'daily_costs': {'2025-01-01': 280.75},
        'highest_cost_service': 'EC2',
        'highest_cost': 150.25
    },
    'logs': {
        'total_entries': 100,
        'error_count': 5,
        'warning_count': 10,
        'log_levels': {'INFO': 85, 'ERROR': 5, 'WARNING': 10},
        'recommendations': '...'
    },
    'alerts': [
        {'severity': 'high', 'category': 'cost', 'message': '...'}
    ],
    'summary': {
        'total_cost': 280.75,
        'total_services': 3,
        'total_log_entries': 100,
        'error_count': 5,
        'warning_count': 10,
        'alert_count': 1
    }
}
```

---

## 🧪 Testing

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Run with coverage
pytest --cov=cloud_insight_ai
```

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**MUBENDIRAN**
- GitHub: [@MUBENDIRAN](https://github.com/MUBENDIRAN)
- Email: mubiii7722@gmail.com

---


## ⭐ Show Your Support

If this project helped you, please consider giving it a ⭐ on [GitHub](https://github.com/MUBENDIRAN/Cloud-Insight-AI)!

---

<p align="center">Made with ❤️ by MUBENDIRAN</p>
