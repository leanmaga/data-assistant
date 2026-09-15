# Deployment Guide - Data Assistant

Esta guía cubre diferentes opciones de deployment para el Data Assistant.

## 🚀 Opciones de Deployment

### 1. Docker (Self-Hosted)

### 2. Vercel + Railway (Recomendado para producción)

### 3. AWS (EC2 + RDS)

### 4. Google Cloud Platform

### 5. DigitalOcean

---

## 1. Docker (Self-Hosted)

### Requisitos

- Servidor con Docker y Docker Compose
- Dominio (opcional)
- Certificado SSL (recomendado)

### Pasos

```bash
# 1. Clonar repositorio en servidor
git clone <repository-url>
cd data-assistant

# 2. Configurar variables de entorno
cp .env.example .env
nano .env  # Añadir GOOGLE_API_KEY y otras vars

# 3. Build y start
docker-compose up -d --build

# 4. Verificar que todo está corriendo
docker-compose ps
docker-compose logs -f
```

### Configurar Nginx como Reverse Proxy

```nginx
# /etc/nginx/sites-available/data-assistant
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/data-assistant /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL with Let's Encrypt
sudo certbot --nginx -d your-domain.com
```

---

## 2. Vercel + Railway (Recomendado)

Esta es la opción más fácil y rápida para producción.

### A. Deploy Backend en Railway

1. Ve a [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Selecciona tu repositorio
4. Railway detectará automáticamente el Dockerfile del backend

#### Configuración en Railway:

```bash
# Root Directory
backend

# Start Command (si no usa Dockerfile)
uvicorn main:app --host 0.0.0.0 --port $PORT

# Environment Variables
GOOGLE_API_KEY=your_key_here
POSTGRES_HOST=${{Postgres.PGHOST}}
POSTGRES_USER=${{Postgres.PGUSER}}
POSTGRES_PASSWORD=${{Postgres.PGPASSWORD}}
POSTGRES_DB=${{Postgres.PGDATABASE}}
```

5. Añadir PostgreSQL:
   - Click "+ New" → "Database" → "Add PostgreSQL"
   - Railway conectará automáticamente las variables

6. Obtener URL del backend:
   - Settings → Domains → Generate Domain
   - Guarda esta URL (ej: `backend-production-xxxx.up.railway.app`)

### B. Deploy Frontend en Vercel

1. Ve a [Vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Importa tu repositorio de GitHub
4. Configuración:

```bash
# Framework Preset
Next.js

# Root Directory
frontend

# Build Command
npm run build

# Output Directory
.next

# Install Command
npm install
```

5. Environment Variables en Vercel:

```bash
NEXT_PUBLIC_API_URL=https://backend-production-xxxx.up.railway.app
```

6. Deploy!

### C. Conectar Frontend y Backend

1. En Railway, actualiza CORS:

```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend.vercel.app",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

2. Push cambios y Railway se redespleagará automáticamente

---

## 3. AWS Deployment

### Arquitectura AWS

```
┌─────────────────────┐
│   Route 53 (DNS)    │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  CloudFront (CDN)   │
└──────────┬──────────┘
           │
    ┌──────▼──────┐
    │   ALB       │
    └─────┬───────┘
          │
    ┌─────▼─────────┐
    │  EC2/ECS      │
    │  - Frontend   │
    │  - Backend    │
    └─────┬─────────┘
          │
    ┌─────▼─────┐
    │  RDS      │
    │ (Postgres)│
    └───────────┘
```

### Opción A: EC2 con Docker

```bash
# 1. Lanzar EC2 instance
# - Ubuntu 22.04 LTS
# - t3.medium o superior
# - Security Group: 80, 443, 22

# 2. Conectar via SSH
ssh -i your-key.pem ubuntu@ec2-xx-xx-xx-xx.compute.amazonaws.com

# 3. Instalar Docker
sudo apt update
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker ubuntu

# 4. Clonar y configurar
git clone <repo>
cd data-assistant
cp .env.example .env
# Editar .env con tus credenciales

# 5. Deploy
docker-compose up -d
```

### Opción B: ECS (Elastic Container Service)

1. Push imágenes a ECR:

```bash
# Build y tag
docker build -t data-assistant-frontend ./frontend
docker build -t data-assistant-backend ./backend

# Login a ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag y push
docker tag data-assistant-frontend:latest <ecr-repo>/frontend:latest
docker push <ecr-repo>/frontend:latest

docker tag data-assistant-backend:latest <ecr-repo>/backend:latest
docker push <ecr-repo>/backend:latest
```

2. Crear Task Definitions en ECS
3. Crear ECS Service
4. Configurar Load Balancer
5. Setup RDS PostgreSQL

### Configurar RDS

```bash
# En AWS Console:
# 1. RDS → Create Database
# 2. PostgreSQL 15
# 3. Free tier / Production según necesidad
# 4. Guardar endpoint y credenciales

# Actualizar .env
POSTGRES_HOST=database-1.xxxxx.us-east-1.rds.amazonaws.com
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=synthetic_data
```

---

## 4. Google Cloud Platform (GCP)

### Cloud Run (Serverless)

```bash
# 1. Instalar gcloud CLI
curl https://sdk.cloud.google.com | bash
gcloud init

# 2. Build con Cloud Build
gcloud builds submit --tag gcr.io/PROJECT_ID/backend ./backend
gcloud builds submit --tag gcr.io/PROJECT_ID/frontend ./frontend

# 3. Deploy backend a Cloud Run
gcloud run deploy backend \
  --image gcr.io/PROJECT_ID/backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_API_KEY=your_key

# 4. Deploy frontend
gcloud run deploy frontend \
  --image gcr.io/PROJECT_ID/frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NEXT_PUBLIC_API_URL=https://backend-xxx.run.app
```

### Cloud SQL (PostgreSQL)

```bash
# Crear instancia
gcloud sql instances create data-assistant-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Crear database
gcloud sql databases create synthetic_data \
  --instance=data-assistant-db

# Obtener connection string
gcloud sql instances describe data-assistant-db
```

---

## 5. DigitalOcean

### App Platform (PaaS)

1. Ve a DigitalOcean → App Platform
2. Create App → GitHub repo
3. Configurar componentes:

#### Backend Component

```yaml
name: backend
source_dir: /backend
dockerfile_path: backend/Dockerfile
http_port: 8000
envs:
  - key: GOOGLE_API_KEY
    value: your_key_here
```

#### Frontend Component

```yaml
name: frontend
source_dir: /frontend
build_command: npm run build
run_command: npm start
envs:
  - key: NEXT_PUBLIC_API_URL
    value: ${backend.PUBLIC_URL}
```

#### Database

- Add Managed PostgreSQL Database
- DigitalOcean conectará automáticamente

---

## 🔒 Seguridad en Producción

### Environment Variables

**NUNCA** commitees las siguientes variables:

```bash
GOOGLE_API_KEY
POSTGRES_PASSWORD
LANGFUSE_SECRET_KEY
JWT_SECRET  # Si implementas auth
```

### Best Practices

1. **Usa HTTPS**: Siempre en producción
2. **Rate Limiting**: Implementa límites de API
3. **CORS**: Restringe origins permitidos
4. **Input Validation**: Valida todos los inputs
5. **Secrets Management**: Usa AWS Secrets Manager, Railway Variables, etc.

### Rate Limiting (FastAPI)

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/api/data/generate")
@limiter.limit("10/minute")
async def generate_data(request: Request, ...):
    pass
```

---

## 📊 Monitoring & Observability

### Langfuse (Recomendado)

```bash
# Ya integrado en el código
LANGFUSE_PUBLIC_KEY=pk_xxx
LANGFUSE_SECRET_KEY=sk_xxx
LANGFUSE_HOST=https://cloud.langfuse.com
```

### Vercel Analytics

```bash
npm install @vercel/analytics
```

```tsx
// app/layout.tsx
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Sentry Error Tracking

```bash
npm install @sentry/nextjs
pip install sentry-sdk
```

---

## 🧪 Testing antes de Deploy

### Pre-deployment Checklist

- [ ] Todas las variables de entorno configuradas
- [ ] Build local exitoso (`npm run build`, `docker-compose build`)
- [ ] Tests pasando
- [ ] CORS configurado correctamente
- [ ] Base de datos migrations aplicadas
- [ ] Health check endpoints funcionando
- [ ] Rate limiting configurado
- [ ] Monitoring setup (Langfuse, Sentry)
- [ ] Backups de base de datos configurados

### Test Local de Producción

```bash
# Frontend
cd frontend
npm run build
npm start

# Backend
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000

# Verificar
curl http://localhost:8000/health
curl http://localhost:3000
```

---

## 🔄 CI/CD

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          # Railway CLI commands

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 📝 Notas Finales

### Costos Estimados (mensual)

| Plataforma       | Free Tier     | Production |
| ---------------- | ------------- | ---------- |
| Vercel + Railway | $0-5          | $20-50     |
| AWS              | $0 (12 meses) | $50-200    |
| GCP              | $300 crédito  | $30-100    |
| DigitalOcean     | -             | $25-100    |
| Self-hosted      | VPS costo     | $5-20      |

### Recomendación

Para **desarrollo/MVP**: Vercel + Railway (Free tier)
Para **producción pequeña**: Vercel + Railway ($20-30/mes)
Para **producción enterprise**: AWS/GCP con autoscaling

---

¿Necesitas ayuda con alguna plataforma específica? Revisa la documentación oficial o abre un issue!
