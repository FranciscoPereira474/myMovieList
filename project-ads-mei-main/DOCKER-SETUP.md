# Docker Setup Documentation

This document explains the Docker configuration for the **MyMovieList** project, including local development and CI/CD deployment workflows.

---

## 📁 Project Structure

```
project-ads-mei/
├── Dockerfile                    # 🚀 CI/CD Dockerfile (root level)
├── .gitlab-ci.yml               # GitLab CI/CD pipeline config
├── .gitlab-ci-with-canary.yml   # Pipeline with Canary deployment (optional)
├── DEV/
│   └── mymovielist/
│       ├── Dockerfile           # 💻 Local Development Dockerfile
│       ├── compose.yaml         # Docker Compose for local dev
│       ├── .env.local           # Local environment variables
│       ├── package.json
│       ├── next.config.mjs
│       └── app/
└── DOC/
    └── Deployment-Strategy.md   # Canary & Rollback documentation
```

---

## 🔄 Two Dockerfiles Explained

### 1️⃣ Root Dockerfile (`/Dockerfile`) - CI/CD

| Property | Value |
|----------|-------|
| **Purpose** | GitLab CI/CD pipeline builds |
| **Build Context** | Project root (`/project-ads-mei/`) |
| **Used By** | `dev`, `staging`, `main` branch pipelines |
| **Registry** | Docker Hub (dev/staging) or GCP Artifact Registry (production) |

**Key Characteristics**:
- File paths prefixed with `DEV/mymovielist/`
- Compatible with Docker 20.10.16 (no BuildKit required)
- Multi-stage build for minimal final image

**Usage**:
```bash
# From project root
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx \
  --build-arg SUPABASE_URL=https://xxx.supabase.co \
  --build-arg SUPABASE_SERVICE_ROLE_KEY=xxx \
  -t mymovielist:latest .
```

---

### 2️⃣ Local Dockerfile (`/DEV/mymovielist/Dockerfile`) - Development

| Property | Value |
|----------|-------|
| **Purpose** | Local development with Docker Compose |
| **Build Context** | `/DEV/mymovielist/` |
| **Used By** | Developers running locally |

**Usage**:
```bash
# From DEV/mymovielist directory
cd DEV/mymovielist
docker compose up --build

# Access the app
open http://localhost:3000
```

---

## 🏗️ Multi-Stage Build Process

Both Dockerfiles use the same **3-stage build** pattern:

```
┌─────────────────────────────────────────────────────────┐
│  Stage 1: deps (Production Dependencies)                │
│  - Copy package.json & package-lock.json                │
│  - Run: npm ci --omit=dev                               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Stage 2: build (Build Application)                     │
│  - Inherit from deps stage                              │
│  - Install ALL dependencies: npm ci                     │
│  - Accept build-time env vars (Supabase)                │
│  - Copy source code                                     │
│  - Run: npm run build                                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Stage 3: final (Production Runtime)                    │
│  - Copy node_modules from deps (prod only)              │
│  - Copy .next/, public/, config from build              │
│  - Set runtime env vars                                 │
│  - Expose port 3000                                     │
│  - Run: npm start                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 CI/CD Pipeline Flow

The pipeline deploys to different registries based on the branch:

```
┌─────────────────────────────────────────────────────────┐
│  dev branch                                             │
│  └─→ Build → Test → Push to Docker Hub (:dev tag)      │
│      └─→ Auto-merge to staging                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  staging branch                                         │
│  └─→ Build → Test → Smoke Test → Push to Docker Hub    │
│      └─→ Auto-merge to main                            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  main branch                                            │
│  └─→ Build → Test → Smoke Test → Push to GCP           │
│      └─→ Deploy to Cloud Run (Manual)                  │
└─────────────────────────────────────────────────────────┘
```

### Registry Destinations

| Branch | Registry | Image Tag |
|--------|----------|-----------|
| `dev` | Docker Hub | `username/mymovielist:dev` |
| `staging` | Docker Hub | `username/mymovielist:staging` |
| `main` | GCP Artifact Registry | `region-docker.pkg.dev/project/repo:production` |

---

## 🔧 When to Use Which Dockerfile

| Scenario | Dockerfile | Command |
|----------|------------|---------|
| **Local Development** | `DEV/mymovielist/Dockerfile` | `docker compose up --build` |
| **CI/CD Pipeline** | `/Dockerfile` (root) | Automatic (GitLab) |
| **Manual Production Build** | `/Dockerfile` (root) | `docker build -t app .` (from root) |
| **Testing CI Build Locally** | `/Dockerfile` (root) | See below |

### Testing CI/CD Build Locally

```bash
# From project root - simulates what CI/CD does
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
  --build-arg SUPABASE_URL=$SUPABASE_URL \
  --build-arg SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
  -t mymovielist:test .

# Run the built image
docker run -p 3000:3000 mymovielist:test
```

---

## ⚙️ Environment Variables in Docker

### Build-Time Variables (ARG)
These are baked into the image during build:

```dockerfile
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG SUPABASE_URL
ARG SUPABASE_SERVICE_ROLE_KEY
```

### Runtime Variables (ENV)
These are available when the container runs:

```dockerfile
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
```

### Cloud Run Override
Cloud Run can override ENV vars at deploy time:

```bash
gcloud run deploy my-web-app \
  --set-env-vars SUPABASE_URL=$SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find package.json"
**Cause**: Wrong build context or Dockerfile

**Solution**: Check you're using the correct Dockerfile:
- Root Dockerfile needs `DEV/mymovielist/` prefix
- Local Dockerfile uses relative paths

### Issue: "Missing environment variables"
**Cause**: Build args not passed

**Solution**: Pass all 4 Supabase variables:
```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=xxx \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx \
  --build-arg SUPABASE_URL=xxx \
  --build-arg SUPABASE_SERVICE_ROLE_KEY=xxx \
  -t app .
```

### Issue: "Local compose doesn't work"
**Solution**: Run from the correct directory:
```bash
cd DEV/mymovielist
docker compose up --build
```

### Issue: "the --mount option requires BuildKit"
**Solution**: Already fixed - root Dockerfile uses traditional `COPY` commands.

---

## 📊 Image Size Optimization

The multi-stage build produces minimal images:

| Stage | Contents | Included in Final |
|-------|----------|-------------------|
| deps | Production node_modules | ✅ Yes |
| build | Dev dependencies + source + .next | Only .next output |
| final | Runtime only | ✅ Final image |

**Result**: ~200-300MB final image instead of ~1GB+

---

## 🔗 Related Files

| File | Purpose |
|------|---------|
| [`/Dockerfile`](./Dockerfile) | CI/CD production build |
| [`/DEV/mymovielist/Dockerfile`](./DEV/mymovielist/Dockerfile) | Local development |
| [`/.gitlab-ci.yml`](./.gitlab-ci.yml) | CI/CD pipeline |
| [`/DEV/mymovielist/compose.yaml`](./DEV/mymovielist/compose.yaml) | Local Docker Compose |
| [`/ENV-SETUP.md`](./ENV-SETUP.md) | Environment variables guide |
| [`/GITLAB-VARS.md`](./GITLAB-VARS.md) | GitLab CI/CD variables |

---

## 📝 Summary

| Aspect | Local Dev | CI/CD |
|--------|-----------|-------|
| **Dockerfile** | `DEV/mymovielist/Dockerfile` | `/Dockerfile` |
| **Command** | `docker compose up --build` | Automatic |
| **Context** | `DEV/mymovielist/` | Project root |
| **Env Vars** | `.env.local` file | GitLab CI/CD Variables |
| **Registry** | Local only | Docker Hub / GCP |
