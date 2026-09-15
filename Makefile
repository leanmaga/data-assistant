.PHONY: help install dev build start stop restart logs clean setup test

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

help: ## Show this help message
	@echo '$(GREEN)Data Assistant - Available Commands:$(NC)'
	@echo ''
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

# Setup
setup: ## Initial setup (copy config files)
	@echo '$(GREEN)Setting up project...$(NC)'
	@if [ ! -f .env ]; then cp .env.example .env; echo "Created .env file"; fi
	@echo '$(YELLOW)Remember to add your GOOGLE_API_KEY to .env$(NC)'

install: ## Install all dependencies
	@echo '$(GREEN)Installing dependencies...$(NC)'
	cd frontend && npm install
	cd backend && pip install -r requirements.txt

# Docker commands
up: ## Start all services with Docker Compose
	@echo '$(GREEN)Starting services...$(NC)'
	docker-compose up -d
	@echo '$(GREEN)Services started!$(NC)'
	@echo 'Frontend: http://localhost:3000'
	@echo 'Backend: http://localhost:8000'
	@echo 'API Docs: http://localhost:8000/docs'

build: ## Build Docker images
	@echo '$(GREEN)Building images...$(NC)'
	docker-compose build

down: ## Stop all services
	@echo '$(YELLOW)Stopping services...$(NC)'
	docker-compose down

restart: ## Restart all services
	@echo '$(YELLOW)Restarting services...$(NC)'
	docker-compose restart

logs: ## Show logs from all services
	docker-compose logs -f

logs-frontend: ## Show logs from frontend only
	docker-compose logs -f frontend

logs-backend: ## Show logs from backend only
	docker-compose logs -f backend

logs-db: ## Show logs from PostgreSQL only
	docker-compose logs -f postgres

ps: ## Show running containers
	docker-compose ps

# Local development
dev-frontend: ## Run frontend locally
	cd frontend && npm run dev

dev-backend: ## Run backend locally
	cd backend && uvicorn main:app --reload

dev-all: ## Run both frontend and backend locally
	@echo '$(GREEN)Starting local development...$(NC)'
	@make -j2 dev-frontend dev-backend

# Build and production
build-frontend: ## Build frontend for production
	cd frontend && npm run build

build-backend: ## Build backend Docker image
	docker build -t data-assistant-backend ./backend

start-prod: ## Start production build
	cd frontend && npm run start

# Testing
test-frontend: ## Run frontend tests
	cd frontend && npm test

test-backend: ## Run backend tests
	cd backend && pytest

test: ## Run all tests
	@make test-frontend
	@make test-backend

# Database
db-shell: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U postgres -d synthetic_data

db-reset: ## Reset database (WARNING: deletes all data)
	@echo '$(YELLOW)WARNING: This will delete all data!$(NC)'
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	docker-compose down -v
	docker-compose up -d postgres

# Cleaning
clean: ## Remove containers, volumes, and images
	@echo '$(YELLOW)Cleaning up...$(NC)'
	docker-compose down -v --rmi all
	rm -rf frontend/.next frontend/node_modules
	find backend -type d -name "__pycache__" -exec rm -r {} +

clean-cache: ## Clean only cache files
	rm -rf frontend/.next
	find backend -type d -name "__pycache__" -exec rm -r {} +

# Utilities
shell-frontend: ## Open shell in frontend container
	docker-compose exec frontend /bin/sh

shell-backend: ## Open shell in backend container
	docker-compose exec backend /bin/bash

health: ## Check health of all services
	@echo '$(GREEN)Checking service health...$(NC)'
	@curl -s http://localhost:8000/health || echo '$(YELLOW)Backend not responding$(NC)'
	@curl -s http://localhost:3000 > /dev/null && echo '$(GREEN)Frontend: OK$(NC)' || echo '$(YELLOW)Frontend not responding$(NC)'

# Quick commands
dev: setup up ## Setup and start development environment
	@echo '$(GREEN)Development environment ready!$(NC)'
	@echo 'Frontend: http://localhost:3000'
	@echo 'Backend: http://localhost:8000/docs'

quick: ## Quick start (assumes setup is done)
	docker-compose up -d

# Format code
format-frontend: ## Format frontend code
	cd frontend && npm run lint --fix

format-backend: ## Format backend code
	cd backend && black . && isort .

format: format-frontend format-backend ## Format all code

# Generate API client (future)
generate-api: ## Generate TypeScript API client from OpenAPI spec
	@echo '$(GREEN)Generating API client...$(NC)'
	curl http://localhost:8000/openapi.json -o frontend/src/lib/openapi.json
	@echo '$(YELLOW)TODO: Add openapi-generator-cli$(NC)'