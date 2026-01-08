# 🚀 Quick Start Guide

Get up and running with AI Friend in minutes!

## Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://127.0.0.1:8000`
- Modern browser (Chrome, Firefox, Edge, Safari)

## Option 1: Local Development (Recommended for Development)

### Step 1: Install Dependencies

```bash
cd ai-friend-ui
npm install
```

### Step 2: Configure Environment

Create a `.env` file in the root directory:

```env
VITE_API_BASE=http://127.0.0.1:8000/api
VITE_BYPASS_AUTH=false
```

### Step 3: Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Option 2: Docker (Recommended for Production)

### Step 1: Build Docker Image

```bash
docker build -t ai-friend-ui .
```

### Step 2: Run Container

```bash
docker run -d \
  --name ai-friend-ui \
  -p 3000:80 \
  -e VITE_API_BASE=http://your-backend-url/api \
  ai-friend-ui
```

Access at [http://localhost:3000](http://localhost:3000)

### Or Use Docker Compose

```bash
docker-compose up -d
```

## Option 3: Production Build

### Step 1: Build for Production

```bash
npm run build
```

### Step 2: Preview Production Build

```bash
npm run preview
```

### Step 3: Deploy

Deploy the `dist/` folder to your hosting provider:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Azure Static Web Apps
- GitHub Pages

## First Time Setup

1. **Start Backend API**
   ```bash
   # Make sure your backend is running on port 8000
   # Check: http://127.0.0.1:8000/api/health
   ```

2. **Register Account**
   - Navigate to `/register`
   - Fill in your details
   - Click "Sign Up"

3. **Login**
   - Use your credentials
   - You'll be redirected to Dashboard

4. **Start Chatting**
   - Click "Start Chatting" or navigate to `/chat`
   - Type a message and press Enter
   - Watch the AI respond!

## Common Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Docker
docker build -t ai-friend-ui .           # Build image
docker run -p 3000:80 ai-friend-ui      # Run container
docker-compose up -d                     # Start with compose
docker-compose down                      # Stop containers
docker-compose logs -f                   # View logs
```

## Troubleshooting

### Port Already in Use

```bash
# Change port in vite.config.js or use:
npm run dev -- --port 3001
```

### API Connection Failed

1. Check backend is running: `curl http://127.0.0.1:8000/api/health`
2. Verify `VITE_API_BASE` in `.env`
3. Check CORS settings on backend

### Docker Build Fails

```bash
# Clear Docker cache
docker builder prune

# Rebuild without cache
docker build --no-cache -t ai-friend-ui .
```

### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

- Read [README.md](./README.md) for full documentation
- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- See [FEATURES.md](./FEATURES.md) for feature details
- Review [DOCKER.md](./DOCKER.md) for containerization

## Getting Help

- Check the [Documentation_api](./Documentation_api) for API details
- Review browser console for errors
- Check Docker logs: `docker logs ai-friend-ui`
- Verify environment variables are set correctly

---

**Happy Coding! 🎉**
