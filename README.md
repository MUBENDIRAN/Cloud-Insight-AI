![Cloud Icon](cloud.png)

# Cloud Insight AI

A real-time, compact, and interactive cloud infrastructure monitoring dashboard.

## Features

- Real-time monitoring of cloud infrastructure.
- Interactive dashboard with detailed breakdowns of costs and logs.
- Automated insights and actionable recommendations.

## Architecture

This project uses a rule-based inference layer designed to be replaceable with ML models.

The frontend is built with vanilla HTML, CSS, and JavaScript, and the backend is a Python application that generates a JSON report.

## Architecture Diagram

```
Logs / Cost JSON
      ↓
Python Analyzer (ECS)
      ↓
JSON Report (S3)
      ↓
Static Dashboard (GitHub Pages)
```

## How to Run

_TODO: Add instructions on how to run the project._
