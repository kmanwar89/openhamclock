# Docker Build & Push Pipeline

This repository uses GitHub Actions to automatically build, test, and push Docker images.

## Workflow Overview

### 1. **Test Job** (Always runs)
- Tests on Node.js 20.x
- Installs dependencies
- Builds frontend with Vite
- Runs tests
- Verifies health endpoint

### 2. **Docker Build Job** (After test passes)
- Builds Docker image locally
- Tests the container
- Verifies all endpoints work

### 3. **Push to GitHub Container Registry** (On main/tags only)
- Builds and pushes to `ghcr.io/kmanwar89/openhamclock`
- Automatically tagged by branch/version
- Latest tag for main branch

### 4. **Push to Docker Hub** (Optional, on main/tags only)
- Requires `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets

## Local Testing

### Build Locally
```bash
docker build -t openhamclock:local .
```

### Build Locally
This pipeline was constructed with Microsoft Copilot purely as a time-savings measure; I have been using Docker for several years, exclusively
managing containers, networks, images, volumes, and stacks using the command line (CLI). I have personally reviewed & tested all code, and attest
to an understanding of the code created using Copilot AI and the Claude Haiku 4.5 model.