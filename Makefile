# ============================================================
# Makefile — Common commands for the Pinger K8s project
# Usage: make <target>
# ============================================================

.PHONY: help cluster-up cluster-down build load deploy undeploy \
        monitoring status logs port-forward compose-up compose-down clean

# Default target
help:
	@echo ""
	@echo "╔══════════════════════════════════════════════════╗"
	@echo "║   Kubernetes Observability - Pinger Project      ║"
	@echo "╚══════════════════════════════════════════════════╝"
	@echo ""
	@echo "  Cluster:"
	@echo "    make cluster-up       Create the kind cluster"
	@echo "    make cluster-down     Delete the kind cluster"
	@echo ""
	@echo "  Docker:"
	@echo "    make build            Build all Docker images"
	@echo "    make load             Load images into kind cluster"
	@echo ""
	@echo "  Kubernetes:"
	@echo "    make deploy           Deploy all app services"
	@echo "    make deploy-monitoring Deploy Prometheus + Grafana"
	@echo "    make undeploy         Remove all app services"
	@echo "    make status           Show pods, services, deployments"
	@echo "    make logs             Tail logs from all pods"
	@echo "    make port-forward     Forward frontend to localhost:9000"
	@echo ""
	@echo "  Local Dev:"
	@echo "    make compose-up       Start full stack with docker-compose"
	@echo "    make compose-down     Stop docker-compose stack"
	@echo ""
	@echo "  Cleanup:"
	@echo "    make clean            Delete cluster and remove images"
	@echo ""

# ── Cluster ───────────────────────────────────────────────
cluster-up:
	@echo "🚀 Creating kind cluster..."
	kind create cluster --config k8s/cluster/kind-cluster-config.yaml
	@echo "✅ Cluster ready"

cluster-down:
	@echo "🗑️  Deleting kind cluster..."
	kind delete cluster
	@echo "✅ Cluster deleted"

# ── Docker ────────────────────────────────────────────────
build:
	@echo "🔨 Building Docker images..."
	docker build ./app/details   -t localhost/details:v1
	docker build ./app/frontend  -t localhost/frontend:v1
	docker build ./app/pinger/v1 -t localhost/pinger:v1
	docker build ./app/pinger/v2 -t localhost/pinger:v2
	@echo "✅ Images built"

load: build
	@echo "📦 Loading images into kind cluster..."
	kind load docker-image localhost/details:v1
	kind load docker-image localhost/frontend:v1
	kind load docker-image localhost/pinger:v1
	kind load docker-image localhost/pinger:v2
	@echo "✅ Images loaded"

# ── Kubernetes Deploy ─────────────────────────────────────
deploy:
	@echo "⚙️  Deploying app services..."
	kubectl apply -f k8s/namespaces.yaml
	kubectl apply -f k8s/configs/pinger-all-in-one.yaml
	kubectl apply -f k8s/configs/hpa.yaml
	kubectl apply -f k8s/configs/network-policy.yaml
	@echo "✅ Deployed. Run 'make status' to verify"

deploy-monitoring:
	@echo "📊 Deploying monitoring stack..."
	kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
	kubectl apply -f k8s/monitoring/prometheus-rbac.yaml
	kubectl apply -f k8s/monitoring/prometheus-config.yaml
	kubectl apply -f k8s/monitoring/prometheus-alert-rules.yaml
	kubectl apply -f k8s/monitoring/prometheus-deploy.yaml
	kubectl apply -f k8s/monitoring/prometheus-service.yaml
	kubectl apply -f k8s/monitoring/grafana-service.yaml
	@echo "✅ Monitoring deployed. Prometheus: NodePort 30090"

undeploy:
	@echo "🗑️  Removing app services..."
	kubectl delete -f k8s/configs/pinger-all-in-one.yaml --ignore-not-found
	kubectl delete -f k8s/configs/hpa.yaml --ignore-not-found
	kubectl delete -f k8s/configs/network-policy.yaml --ignore-not-found
	@echo "✅ Services removed"

# ── Observability ─────────────────────────────────────────
status:
	@echo "\n📦 Pods:"
	@kubectl get pods -o wide
	@echo "\n🔌 Services:"
	@kubectl get svc
	@echo "\n📈 Deployments:"
	@kubectl get deploy
	@echo "\n⚖️  HPA:"
	@kubectl get hpa

logs:
	@echo "📜 Tailing logs from all pods (Ctrl+C to stop)..."
	kubectl logs -l 'app in (frontend,pinger,details)' -f --max-log-requests=10

port-forward:
	@echo "🌐 Forwarding frontend to http://localhost:9000 ..."
	$(eval POD=$(shell kubectl get po -l app=frontend -o name | head -1))
	kubectl port-forward $(POD) 9000:9000

# ── Local Dev ─────────────────────────────────────────────
compose-up:
	@echo "🐳 Starting local stack with docker-compose..."
	docker-compose up --build

compose-down:
	@echo "🛑 Stopping docker-compose stack..."
	docker-compose down -v

# ── Cleanup ───────────────────────────────────────────────
clean: undeploy cluster-down
	@echo "🧹 Removing Docker images..."
	docker rmi -f localhost/details:v1 localhost/frontend:v1 \
	               localhost/pinger:v1 localhost/pinger:v2 2>/dev/null || true
	@echo "✅ Clean complete"
