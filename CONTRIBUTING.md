# Contributing Guide

Thank you for your interest in contributing to the **Kubernetes Observability & Monitoring System**! 🎉

---

## 📋 Table of Contents
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/Kubernetes-Observability-Monitoring-System.git
   cd Kubernetes-Observability-Monitoring-System
   ```
3. **Add upstream** remote:
   ```bash
   git remote add upstream https://github.com/soujanya-7/Kubernetes-Observability-Monitoring-System.git
   ```

---

## Development Setup

### Prerequisites
- Docker Desktop ≥ 24
- kind ≥ 0.20
- kubectl ≥ 1.27
- Node.js ≥ 18

### Quick start (local)
```bash
# Start the full local stack (no Kubernetes needed)
make compose-up
```

### Full Kubernetes setup
```bash
make cluster-up        # Create kind cluster
make load              # Build + load Docker images
make deploy            # Deploy all services
make deploy-monitoring # Deploy Prometheus + Grafana
make status            # Verify everything is running
make port-forward      # Access UI at http://localhost:9000
```

---

## Making Changes

1. **Sync with upstream** before starting:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a feature branch:**
   ```bash
   git checkout -b feat/your-feature-name
   ```

3. Make your changes, then:
   ```bash
   git add .
   git commit -m "feat: describe what you added"
   git push origin feat/your-feature-name
   ```

4. Open a **Pull Request** on GitHub against `main`.

---

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | When to use |
|---|---|
| `feat:` | New feature or functionality |
| `fix:` | Bug fix |
| `docs:` | Documentation only changes |
| `chore:` | Maintenance (CI, Makefile, gitignore) |
| `refactor:` | Code change that neither fixes a bug nor adds a feature |
| `ci:` | GitHub Actions workflow changes |
| `perf:` | Performance improvement |

**Examples:**
```
feat(k8s): add HPA for pinger-v2
fix(ci): resolve npm audit lockfile mismatch
docs: add monitoring setup to README
```

---

## Pull Request Process

1. Make sure the **CI pipeline passes** (Docker build + manifest validation)
2. Update **README.md** if your change affects the usage or architecture
3. Add a clear description of **what** changed and **why**
4. Reference any related issues with `Closes #<issue>`

---

## Code Style

### Node.js
- Use `async/await` over callbacks
- Always handle errors in `.catch()` blocks with a `return`
- Add `console.log` timestamps using the pattern in `details.js`

### Kubernetes YAML
- Always set `resources.requests` and `resources.limits`
- Always define `livenessProbe` and `readinessProbe`
- Use `namespace: default` explicitly
- Add `prometheus.io/scrape: "true"` annotations to pods that expose `/metrics`

### Docker
- Use `node:alpine` as base image to keep images small
- Always `COPY package*.json ./` before `RUN npm install`
- Set `WORKDIR /usr/src/app`

---

## Reporting Issues

Please open a GitHub Issue with:
- Description of the problem
- Steps to reproduce
- Expected vs actual behaviour
- Kubernetes/Docker version info
