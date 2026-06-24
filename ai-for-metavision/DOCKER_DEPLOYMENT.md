# Docker Deployment Guide - Step 12

Complete Docker setup for production deployment with PostgreSQL, Redis, and NestJS application.

---

## 🚀 Quick Start

### 1. Clone and Setup
```bash
cd "c:\Users\user\Desktop\AI for Metavision"
```

### 2. Configure Environment
```bash
# Create .env.docker file for Docker environment
cat > .env.docker << EOF
# App
NODE_ENV=production
APP_PORT=3000
LOG_LEVEL=info

# Database
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=ai_metavision
DB_PORT=5432

# Redis
REDIS_PASSWORD=your_redis_password
REDIS_PORT=6379
EOF
```

### 3. Build and Run
```bash
# Build images
docker-compose -f docker-compose.yml build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### 4. Verify
```bash
# Check services
docker-compose ps

# Test API
curl http://localhost:3000

# Access Redis
docker exec -it ai_metavision_redis redis-cli

# Access Database
docker exec -it ai_metavision_db psql -U postgres
```

---

## 📋 Services Overview

### PostgreSQL (postgres:16-alpine)
- **Container:** ai_metavision_db
- **Port:** 5432
- **Volume:** postgres_data (persistent)
- **Health Check:** Every 10s
- **Auto Start:** Unless stopped

### Redis (redis:7-alpine)
- **Container:** ai_metavision_redis
- **Port:** 6379
- **Volume:** redis_data (persistent)
- **Persistence:** appendonly yes
- **Health Check:** PING every 10s

### NestJS App (custom build)
- **Container:** ai_metavision_app
- **Port:** 3000
- **Build:** Multi-stage Dockerfile
- **User:** nodejs (non-root)
- **Signal Handling:** dumb-init
- **Health Check:** HTTP GET every 30s

---

## 🔧 Configuration

### Environment Variables

```env
# Application
NODE_ENV=production                # development|production|test
PORT=3000                          # Server port
LOG_LEVEL=info                     # info|debug|warn|error

# Database
DATABASE_URL=postgresql://...      # Full connection string (auto-generated)
DB_USER=postgres                   # PostgreSQL user
DB_PASSWORD=secure_pwd             # PostgreSQL password
DB_NAME=ai_metavision              # Database name
DB_PORT=5432                       # Database port

# Redis
REDIS_URL=redis://...              # Full Redis URL (auto-generated)
REDIS_PASSWORD=redis_pwd           # Redis password
REDIS_PORT=6379                    # Redis port
```

### Load Environment from File
```bash
# Use specific env file
docker-compose --env-file .env.production up -d

# Or export and run
export $(cat .env.production | xargs)
docker-compose up -d
```

---

## 🐳 Docker Images

### Application Image (Multi-Stage Build)

**Stage 1 - Builder:**
- Node 20 Alpine
- Install dependencies
- Build TypeScript
- Prune devDependencies

**Stage 2 - Runtime:**
- Node 20 Alpine (smaller footprint)
- Copy built app
- Non-root user (nodejs)
- dumb-init signal handling
- Health checks enabled

**Image Size:** ~200MB (optimized)

---

## 📊 Volume Management

### Persistent Volumes
```yaml
postgres_data:   # PostgreSQL database files
redis_data:      # Redis database dump
```

### Commands
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect ai_for_metavision_postgres_data

# Clean up unused volumes
docker volume prune

# Backup database
docker run --rm -v ai_for_metavision_postgres_data:/data \
  -v $(pwd):/backup \
  postgres:16-alpine \
  pg_dump -U postgres ai_metavision > backup.sql

# Restore database
docker-compose down
docker volume rm ai_for_metavision_postgres_data
docker-compose up postgres
docker exec -i ai_metavision_db psql -U postgres ai_metavision < backup.sql
```

---

## 🔐 Security Best Practices

### 1. Strong Passwords
```bash
# Generate secure password
openssl rand -base64 32
# Use in .env.production
DB_PASSWORD=generated_password_here
REDIS_PASSWORD=generated_password_here
```

### 2. Non-Root User
✅ Application runs as `nodejs` user (UID 1001)
- No root access
- Limited permissions
- Safer container execution

### 3. Network Isolation
- Internal network: `ai_network`
- Services communicate via service names
- Only app exposed to host

### 4. Environment Variables
```bash
# Use .env.production (not in repo)
.env.production          # Production secrets
.env.staging             # Staging secrets
.gitignore: *.env*       # Never commit
```

### 5. Health Checks
- App: HTTP health check (30s interval)
- DB: pg_isready (10s interval)
- Redis: PING (10s interval)

### 6. Image Security
- Alpine Linux (minimal attack surface)
- Multi-stage build (no dev tools in runtime)
- dumb-init (proper signal handling)
- Non-root user (principle of least privilege)

---

## 📈 Production Deployment

### 1. AWS/Cloud Deployment

**Using Docker Compose on EC2:**
```bash
# SSH into server
ssh ubuntu@your-instance-ip

# Clone repository
git clone your-repo-url
cd AI\ for\ Metavision

# Create production env
cat > .env.production << EOF
NODE_ENV=production
DB_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
EOF

# Build and run
docker-compose -f docker-compose.yml \
  --env-file .env.production \
  up -d
```

### 2. Kubernetes Deployment

**Convert to Kubernetes (Step 13+):**
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-metavision-app
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: app
        image: your-registry/ai-metavision:latest
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
```

### 3. Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml ai_metavision
```

---

## 🛠️ Common Commands

### Service Management
```bash
# Start services
docker-compose up -d

# Stop services (preserve data)
docker-compose stop

# Restart services
docker-compose restart

# Remove containers (keep volumes)
docker-compose down

# Remove everything
docker-compose down -v

# View logs
docker-compose logs -f               # All services
docker-compose logs -f app           # Specific service
docker-compose logs -f --tail=100    # Last 100 lines
```

### Database Operations
```bash
# Run migrations
docker-compose exec app npm run prisma:migrate deploy

# Access database
docker-compose exec postgres psql -U postgres ai_metavision

# Create backup
docker-compose exec postgres pg_dump -U postgres ai_metavision > backup.sql

# Restore from backup
docker-compose exec -T postgres psql -U postgres ai_metavision < backup.sql
```

### Debugging
```bash
# Shell into app
docker-compose exec app sh

# Shell into database
docker-compose exec postgres sh

# View environment
docker-compose exec app env

# Check logs
docker-compose logs app --tail=50

# Inspect container
docker inspect ai_metavision_app
```

### Performance Monitoring
```bash
# View resource usage
docker stats

# Check memory
docker-compose exec app ps aux

# Monitor in real-time
watch docker stats
```

---

## 🐛 Troubleshooting

### Container won't start

**Check logs:**
```bash
docker-compose logs app
```

**Common Issues:**
1. **Port already in use** - Change in docker-compose.yml
2. **Database not ready** - Check depends_on health checks
3. **Redis connection failed** - Verify REDIS_URL format

### Database connection error
```
Error: connect ECONNREFUSED postgres:5432
```

**Solution:**
```bash
# Verify postgres is running
docker-compose ps postgres

# Check health
docker-compose exec postgres pg_isready -U postgres

# Restart postgres
docker-compose restart postgres
```

### Redis connection error
```
Error: connect ECONNREFUSED redis:6379
```

**Solution:**
```bash
# Restart redis
docker-compose restart redis

# Test connection
docker-compose exec redis redis-cli ping
```

### Out of memory
```bash
# Check resource limits
docker stats

# Update docker-compose.yml:
services:
  app:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

### Permission denied
```bash
# Fix volume permissions
docker-compose down
sudo chown -R 1001:1001 ./postgres_data
sudo chown -R 1001:1001 ./redis_data
docker-compose up -d
```

---

## 📦 Building for Different Environments

### Development
```bash
docker-compose -f docker-compose.yml \
  -f docker-compose.dev.yml \
  up -d
```

### Staging
```bash
docker-compose --env-file .env.staging \
  up -d
```

### Production
```bash
docker-compose --env-file .env.production \
  --compatibility \
  up -d
```

---

## 🔄 Continuous Deployment

### GitHub Actions Example
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and push
        run: |
          docker build -t myrepo/ai-metavision:${{ github.sha }} .
          docker push myrepo/ai-metavision:${{ github.sha }}
      - name: Deploy
        run: |
          ssh ubuntu@prod-server \
            "cd /app && \
            docker-compose pull && \
            docker-compose up -d"
```

---

## 📊 Monitoring & Logging

### Docker Logging
```bash
# View logs from inception
docker-compose logs app

# Stream logs (follow)
docker-compose logs -f app

# Last N lines
docker-compose logs --tail=100 app

# Timestamps
docker-compose logs --timestamps app
```

### Application Logging
NestJS logs to stdout (captured by Docker):
- Info: Regular operations
- Debug: Detailed execution flow
- Warn: Potential issues
- Error: Failures and exceptions

### Health Status
```bash
# Check health
docker-compose exec app wget -q -O - http://localhost:3000/health

# View container health
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

## 🧹 Cleanup & Maintenance

### Remove old images
```bash
docker image prune -a
```

### Clean up volumes
```bash
docker volume prune
```

### Full cleanup
```bash
docker system prune -a --volumes
```

### Archive logs
```bash
docker-compose logs app > app.log.$(date +%Y%m%d).gz
```

---

## 📝 File Structure

```
AI for Metavision/
├── Dockerfile                  # Multi-stage build
├── docker-compose.yml          # Service orchestration
├── .dockerignore                # Build context exclusions
├── DOCKER_DEPLOYMENT.md        # This guide
├── .env                        # Development environment
├── .env.production             # (Create for prod)
├── dist/                       # Compiled JavaScript (built in Docker)
├── src/                        # TypeScript source
├── prisma/                     # Database schema
├── node_modules/               # Dependencies (not copied to Docker)
└── package.json
```

---

## ✅ Deployment Checklist

- [ ] Create `.env.production` with secure passwords
- [ ] Build Docker images: `docker-compose build`
- [ ] Test locally: `docker-compose up -d`
- [ ] Verify health checks pass: `docker-compose ps`
- [ ] Test API endpoints: `curl http://localhost:3000`
- [ ] Run database migrations: `docker-compose exec app npm run prisma:migrate deploy`
- [ ] Check logs for errors: `docker-compose logs app`
- [ ] Verify volumes persist: `docker volume ls`
- [ ] Document any custom configurations
- [ ] Set up backups for database
- [ ] Configure monitoring/alerts
- [ ] Deploy to production environment
- [ ] Verify production connectivity
- [ ] Set up log aggregation

---

## 🎯 Next Steps

### After Deployment:
1. Monitor application health (logs, metrics)
2. Set up automated backups
3. Configure CI/CD pipeline
4. Implement scaling (Kubernetes, Docker Swarm)
5. Set up monitoring (Prometheus, Grafana)
6. Configure log aggregation (ELK Stack)

### Optional Enhancements:
- Add nginx reverse proxy
- Configure SSL/TLS certificates
- Implement rate limiting
- Add application metrics
- Set up distributed tracing
- Configure auto-scaling policies

---

## 📚 Reference

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NestJS Docker Guide](https://docs.nestjs.com/deployment)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Redis Docker Hub](https://hub.docker.com/_/redis)

---

**Status:** ✅ Step 12 Complete - Production Docker Configuration Ready

**Full System Stack:**
- ✅ NestJS 10 + TypeScript 5 (Core Framework)
- ✅ PostgreSQL 16 (Database)
- ✅ Redis 7 (Cache & Queue)
- ✅ Bull Queues (Async Processing)
- ✅ Prisma ORM (Data Access)
- ✅ Repository Pattern (Abstraction)
- ✅ Orders, Menu, Analytics Modules (Business Logic)
- ✅ AI Engine with 4 Engines (Intelligence)
- ✅ Docker Production Deployment (Infrastructure)
