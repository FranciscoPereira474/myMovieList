# CI/CD Pipeline Overview

## Pipeline Stages & Steps

### Stage 1: Build

- **build_dev** - Builds Docker image with layer caching, saves to artifact
- **build_staging** - Builds Docker image with layer caching, saves to artifact
- **build_production** - Builds Docker image with layer caching, saves to artifact

### Stage 2: Test (runs in parallel with build)

- **test_dev** - ESLint checks (warnings allowed)
- **test_staging** - ESLint, TypeScript type checks
- **test_production** - ESLint, TypeScript type checks, security audit
- **smoke_test_staging** - Container health check (Docker Hub)
- **smoke_test_production** - Container health check (GCP registry)

### Stage 3: Push (only after tests pass)

- **push_dev** - Loads artifact, re-tags, pushes to Docker Hub (both `:dev` and `:dev-<hash>`)
- **push_staging** - Loads artifact, re-tags, pushes to Docker Hub (both `:staging` and `:staging-<hash>`)
- **push_production** - Loads artifact, re-tags, pushes to GCP (both `:hash` and `:production`), cleanup old images (keep 2)

### Stage 4: Deploy

**Dev Flow:**

- **auto_merge_to_staging** - Auto-merges dev → staging on success

**Staging Flow:**

- **auto_merge_to_main** - Auto-merges staging → main on success

**Production Flow:**

1. **deploy_canary** (MANUAL) - Routes 10% traffic to new version, 90% to stable
2. **promote_canary** (MANUAL) - Promotes canary to 100% traffic
3. **validate_promotion** (AUTO) - Health checks after promotion (10 checks, 15% error threshold)
4. **rollback_production** (MANUAL) - Emergency rollback to previous revision
5. **tag_latest** (AUTO) - Tags production image as `:latest` after promotion succeeds

## Pipeline Conditions

- Runs on: `dev`, `staging`, `main` branches + merge requests
- Build → Test → Push sequence ensures untested code never reaches registry
- Artifacts passed between stages (no registry pulls during CI)
- GCP cleanup keeps 2 images, Docker Hub images persist indefinitely
