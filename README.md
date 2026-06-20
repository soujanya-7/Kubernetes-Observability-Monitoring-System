# 🔭 Kubernetes Observability & Monitoring System

![CI](https://github.com/soujanya-7/Kubernetes-Observability-Monitoring-System/actions/workflows/ci.yaml/badge.svg)
![Kubernetes](https://img.shields.io/badge/Kubernetes-1.27-blue?logo=kubernetes)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)
![Prometheus](https://img.shields.io/badge/Prometheus-monitored-E6522C?logo=prometheus)
![Grafana](https://img.shields.io/badge/Grafana-dashboard-F46800?logo=grafana)
![Node.js](https://img.shields.io/badge/Node.js-18-339933?logo=node.js)
![License](https://img.shields.io/badge/license-MIT-green)

A production-grade microservices observability system deployed on Kubernetes, featuring real-time URL uptime monitoring, latency tracking, and full metrics visibility via Prometheus + Grafana.

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        kind Cluster                          │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐  ┌───────────────┐   │
│  │   Frontend   │───▶│  Pinger v1   │  │  Prometheus   │   │
│  │  :9000       │    │  :3000       │  │  :9090        │   │
│  │  (Express)   │───▶│  Pinger v2   │  │               │   │
│  │              │    │  :3000       │  └──────┬────────┘   │
│  │              │───▶│  Details     │         │            │
│  └──────────────┘    │  :4000       │  ┌──────▼────────┐   │
│                      └──────────────┘  │    Grafana    │   │
│                             │          │  :3000        │   │
│                      /metrics exposed  └───────────────┘   │
│                      (prom-client)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Orchestration** | Kubernetes (kind) |
| **Containerization** | Docker |
| **Services** | Node.js + Express.js |
| **Metrics** | Prometheus + prom-client |
| **Dashboards** | Grafana |
| **Proxy** | Envoy |
| **CI/CD** | GitHub Actions |

---

## 📦 Microservices

### `frontend` (port 9000)
- Serves the HTML UI
- Acts as an API gateway, proxying calls to pinger and details
- Exposes `/metrics` endpoint for Prometheus scraping

### `pinger-v1` (port 3000)
- Continuously polls a configurable list of URLs every 5 seconds
- Records latency, HTTP status, success/fail counts
- Tracks state in-memory with SHA-256 URL hashing

### `pinger-v2` (port 3000)
- Improved async version of pinger-v1
- Exposes custom Prometheus counters: `pinger_success_total`, `pinger_fail_total`
- Full `async/await` implementation with proper error handling

### `details` (port 4000)
- Returns metadata for a given URL (content-type, server header, status)

---

## 🚀 Getting Started

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/)
- [kind](https://kind.sigs.k8s.io/) (Kubernetes in Docker)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)

---

### Option 1 — Local Dev with Docker Compose

```bash
# Start all services + Prometheus + Grafana locally
docker-compose up --build

# Access:
# UI         → http://localhost:9000
# Prometheus → http://localhost:9090
# Grafana    → http://localhost:3002  (admin / admin)
```

---

### Option 2 — Full Kubernetes Deployment (kind)

#### 1. Create the cluster
```bash
kind create cluster --config k8s/cluster/kind-cluster-config.yaml
```

#### 2. Build & load Docker images
```bash
./scripts/build-docker.sh
```

#### 3. Deploy all services
```bash
kubectl apply -f k8s/configs/pinger-all-in-one.yaml
```

#### 4. Deploy monitoring stack
```bash
# Create monitoring namespace
kubectl create namespace monitoring

# Apply RBAC, Prometheus and Grafana
kubectl apply -f k8s/monitoring/prometheus-rbac.yaml
kubectl apply -f k8s/monitoring/prometheus-config.yaml
kubectl apply -f k8s/monitoring/prometheus-deploy.yaml
kubectl apply -f k8s/monitoring/prometheus-service.yaml
kubectl apply -f k8s/monitoring/grafana-service.yaml
```

#### 5. Verify everything is running
```bash
kubectl get pods
kubectl get svc
kubectl get deploy
```

#### 6. Access the UI
```bash
# Get the frontend pod name
kubectl get po | grep frontend

# Forward port
kubectl port-forward <frontend-pod-name> 9000:9000

# Open http://localhost:9000
```

---

## 📊 Observability

### Prometheus Metrics
Each service exposes `/metrics` via `prom-client`:

| Metric | Description | Service |
|---|---|---|
| `http_request_duration_ms` | HTTP request latency histogram | pinger-v1 |
| `pinger_success_total` | Counter of successful pings | pinger-v2 |
| `pinger_fail_total` | Counter of failed pings | pinger-v2 |
| `nodejs_heap_size_used_bytes` | Node.js heap memory | all |
| `process_cpu_seconds_total` | CPU usage | all |

### Grafana Dashboard
Import `monitoring/grafana-dashboard.json` into Grafana for:
- 📈 Success vs Failure ping rate (per minute)
- ⏱️ HTTP request duration across all services
- 🧠 Node.js heap memory per pod
- 📉 Failure rate percentage with color thresholds

---

## 🔁 CI/CD Pipeline

GitHub Actions runs on every push and pull request:

| Job | Description |
|---|---|
| `lint-and-validate` | Validates all K8s YAML manifests using kubeval |
| `build-docker-images` | Builds all 4 Docker images in parallel matrix |
| `node-audit` | Runs `npm audit` security check on all services |

---

## 📁 Project Structure

```
.
├── app/
│   ├── frontend/          # Express.js UI + API gateway
│   ├── details/           # URL metadata service
│   └── pinger/
│       ├── v1/            # Basic pinger with histogram metrics
│       └── v2/            # Async pinger with success/fail counters
├── k8s/
│   ├── cluster/           # kind cluster config
│   ├── configs/           # Deployment + Service YAML for all apps
│   └── monitoring/        # Prometheus RBAC, ConfigMap, Deployment
├── monitoring/
│   ├── prometheus-local.yml   # Local Prometheus config (docker-compose)
│   └── grafana-dashboard.json # Grafana dashboard export
├── scripts/
│   └── build-docker.sh    # Build & load images into kind
├── .github/workflows/
│   └── ci.yaml            # GitHub Actions CI pipeline
└── docker-compose.yml     # Local dev stack
```

---

## 🔍 Key Design Decisions

- **Two pinger versions** — v1 uses synchronous-style callbacks, v2 is fully async with richer metrics. This demonstrates API evolution.
- **Pod annotations** — All pods use `prometheus.io/scrape: "true"` so Prometheus auto-discovers them via Kubernetes SD.
- **RBAC** — Prometheus runs with a dedicated ServiceAccount with read-only access to pods, services, and endpoints.
- **Resource limits** — All pods have CPU/memory requests and limits to prevent noisy-neighbour issues in the cluster.
- **Health probes** — Liveness and readiness probes ensure traffic is only routed to healthy pods.

---

## 📄 License

MIT © 2024
