# 🐳 Docker Setup Guide

Complete guide for containerizing and deploying the AI Friend frontend application.

## Table of Contents

- [Quick Start](#quick-start)
- [Dockerfile Explanation](#dockerfile-explanation)
- [Docker Compose](#docker-compose)
- [Environment Variables](#environment-variables)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Build and Run with Docker

```bash
# Build the image
docker build -t ai-friend-ui .

# Run the container
docker run -d \
  --name ai-friend-ui \
  -p 3000:80 \
  -e VITE_API_BASE=http://your-backend-url/api \
  ai-friend-ui
```

### Using Docker Compose

```bash
# Start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

## Dockerfile Explanation

### Multi-Stage Build

The Dockerfile uses a multi-stage build process for optimization:

#### Stage 1: Builder
```dockerfile
FROM node:18-alpine AS builder
```
- Uses Alpine Linux for smaller image size
- Node.js 18 for building the application
- Installs all dependencies (including dev dependencies)
- Builds the production bundle

#### Stage 2: Production
```dockerfile
FROM nginx:alpine
```
- Uses Nginx Alpine for serving static files
- Only includes built files (no Node.js needed)
- Minimal image size (~20MB vs ~300MB)

### Build Arguments

```dockerfile
ARG VITE_API_BASE=http://127.0.0.1:8000/api
ARG VITE_BYPASS_AUTH=false
```

These are set during build time to configure the application.

### Build Process

1. **Copy package files** - Only package.json and package-lock.json
2. **Install dependencies** - `npm ci` for reproducible builds
3. **Copy source code** - All application files
4. **Set environment variables** - For build-time configuration
5. **Build application** - `npm run build` creates optimized bundle
6. **Copy to Nginx** - Only dist/ folder to production image

## Docker Compose

### Basic Configuration

```yaml
services:
  ai-friend-ui:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    environment:
      - VITE_API_BASE=http://backend:8000/api
    restart: unless-stopped
```

### With Backend Integration

```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - app-network

  backend:
    image: your-backend-image
    ports:
      - "8000:8000"
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

## Environment Variables

### Build-Time Variables

Set during `docker build`:

```bash
docker build \
  --build-arg VITE_API_BASE=http://api.example.com/api \
  --build-arg VITE_BYPASS_AUTH=false \
  -t ai-friend-ui .
```

### Runtime Variables

Set when running the container:

```bash
docker run -e VITE_API_BASE=http://api.example.com/api ai-friend-ui
```

### Using .env File

Create a `.env` file:

```env
VITE_API_BASE=http://api.example.com/api
VITE_BYPASS_AUTH=false
PORT=3000
```

Then use with docker-compose:

```bash
docker-compose --env-file .env up
```

## Production Deployment

### Docker Hub

1. **Build and tag**
```bash
docker build -t yourusername/ai-friend-ui:latest .
```

2. **Push to Docker Hub**
```bash
docker push yourusername/ai-friend-ui:latest
```

3. **Pull and run**
```bash
docker pull yourusername/ai-friend-ui:latest
docker run -p 3000:80 yourusername/ai-friend-ui:latest
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-friend-ui
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-friend-ui
  template:
    metadata:
      labels:
        app: ai-friend-ui
    spec:
      containers:
      - name: ai-friend-ui
        image: yourusername/ai-friend-ui:latest
        ports:
        - containerPort: 80
        env:
        - name: VITE_API_BASE
          value: "http://backend-service:8000/api"
---
apiVersion: v1
kind: Service
metadata:
  name: ai-friend-ui-service
spec:
  selector:
    app: ai-friend-ui
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

### AWS ECS / Fargate

1. **Build and push to ECR**
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker build -t ai-friend-ui .
docker tag ai-friend-ui:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-friend-ui:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-friend-ui:latest
```

2. **Create ECS Task Definition**
```json
{
  "family": "ai-friend-ui",
  "containerDefinitions": [{
    "name": "ai-friend-ui",
    "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-friend-ui:latest",
    "portMappings": [{
      "containerPort": 80
    }],
    "environment": [{
      "name": "VITE_API_BASE",
      "value": "http://backend:8000/api"
    }]
  }]
}
```

## Health Checks

The Dockerfile includes a health check:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
```

Check container health:

```bash
docker ps  # Shows health status
docker inspect --format='{{.State.Health.Status}}' ai-friend-ui
```

## Volume Mounts

### Development with Hot Reload

```yaml
services:
  ai-friend-ui:
    build: .
    volumes:
      - ./src:/app/src  # Mount source for development
      - /app/node_modules  # Exclude node_modules
```

### Logs

```yaml
volumes:
  - ./logs:/var/log/nginx
```

## Networking

### Bridge Network (Default)

```bash
docker network create ai-friend-network
docker run --network ai-friend-network ai-friend-ui
```

### Host Network (Linux only)

```bash
docker run --network host ai-friend-ui
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs ai-friend-ui

# Check if port is in use
lsof -i :3000

# Run interactively
docker run -it ai-friend-ui sh
```

### Build Fails

```bash
# Clear build cache
docker builder prune

# Build without cache
docker build --no-cache -t ai-friend-ui .
```

### Environment Variables Not Working

Remember: Vite environment variables must be set at **build time**, not runtime.

For runtime configuration, use a config file or API endpoint.

### Nginx Configuration Issues

```bash
# Test nginx config
docker exec ai-friend-ui nginx -t

# Reload nginx
docker exec ai-friend-ui nginx -s reload
```

### Permission Issues

```bash
# Run as specific user
docker run --user 1000:1000 ai-friend-ui

# Fix permissions
docker exec -u root ai-friend-ui chown -R nginx:nginx /usr/share/nginx/html
```

## Best Practices

1. **Use Multi-Stage Builds** - Smaller images
2. **Layer Caching** - Order commands by change frequency
3. **.dockerignore** - Exclude unnecessary files
4. **Health Checks** - Monitor container health
5. **Non-Root User** - Security best practice
6. **Resource Limits** - Set memory/CPU limits
7. **Secrets Management** - Use Docker secrets or env files
8. **Image Tagging** - Use semantic versioning

## Image Size Optimization

### Current Size
- Builder stage: ~300MB
- Production stage: ~25MB

### Optimization Tips

1. **Use Alpine Linux** - Already using
2. **Multi-stage builds** - Already using
3. **Remove dev dependencies** - Already done
4. **Minimize layers** - Combine RUN commands
5. **Use .dockerignore** - Exclude unnecessary files

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t ai-friend-ui .
      
      - name: Push to Docker Hub
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push ai-friend-ui:latest
```

---

**For more information, see the main [README.md](./README.md)**
