# Contributing to Cloud Insight AI

Thanks for your interest in contributing to **Cloud Insight AI**.

This project focuses on cloud cost/log analysis with a containerized backend and static frontend. Contributions should be **practical, testable, and aligned with the architecture**.

---

## 🚀 How to Contribute

### 1. Fork and Clone

* Fork the repository
* Clone your fork locally:

```bash
git clone https://github.com/<your-username>/cloud-insight-ai.git
cd cloud-insight-ai
```

---

### 2. Create a Branch

Use meaningful branch names:

```bash
git checkout -b feature/log-parser-improvement
git checkout -b fix/cost-anomaly-bug
```

---

### 3. Set Up the Project

#### Backend Setup

```bash
pip install -r requirements.txt
```

Run locally:

```bash
python src/analyzer.py
```

#### Docker Setup (Preferred)

```bash
docker build -t cloud-insight-ai .
docker run cloud-insight-ai
```

---

## 🧠 Contribution Areas

You can contribute in the following areas:

### Backend (Python)

* Improve cost anomaly detection logic
* Enhance log parsing (performance/security logs)
* Optimize analyzer orchestration
* Improve AWS Comprehend integration (or replace with better NLP)

### DevOps / Cloud

* Improve Dockerfile
* Optimize CI/CD (GitHub Actions)
* Suggest alternatives to AWS (since free tier expired)
* Add local-first or mock AWS support

### Frontend

* Improve dashboard UX/UI
* Optimize Chart.js visualizations
* Add fallback for offline/static demo mode

### Data & Config

* Improve `config.yaml` structure
* Add validation for configs
* Extend sample datasets

---

## ⚠️ Important Constraints

* AWS services (S3, ECS) are **not actively running**
* Contributions must **not depend on live AWS infra**
* Prefer:

  * Local simulation
  * Mock services
  * Static demo compatibility

---

## 🧪 Testing Guidelines

Before submitting:

* Ensure `analyzer.py` runs without errors
* Verify `final_report.json` is generated correctly
* Do not break existing file structure
* Test with sample data in `/data`

---

## 📝 Code Guidelines

* Follow clean, readable Python (no overengineering)
* Keep modules focused (single responsibility)
* Avoid unnecessary dependencies
* Add comments only where logic is non-obvious

---

## 📦 Commit Guidelines

Use clear commit messages:

```
feat: add anomaly detection for cost spikes
fix: correct log parsing edge case
refactor: simplify analyzer workflow
```

---

## 🔁 Pull Request Process

1. Push your branch
2. Open a Pull Request
3. Clearly describe:

   * What you changed
   * Why it matters
   * Any limitations

---

## 🚫 What NOT to Do

* Don’t add random features without relevance
* Don’t introduce heavy frameworks
* Don’t depend on paid/cloud-only services
* Don’t break the current architecture

---

## 💡 Suggestions Are Welcome

If you're unsure:

* Open an issue first
* Propose your idea clearly
* Wait for feedback before implementing

---

## 📌 Final Note

This is a **learning + portfolio project**, not a production system.

So focus on:

* clarity over complexity
* usefulness over hype
* working solutions over theoretical ones

---
