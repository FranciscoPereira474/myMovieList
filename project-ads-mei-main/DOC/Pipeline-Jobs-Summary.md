# GitLab CI/CD Pipeline Jobs Summary

This document describes all jobs in the MyMovieList CI/CD pipeline.

---

## Pipeline Overview

```
DEV Branch:      build_dev → test_dev → push_dev → auto_merge_to_staging
STAGING Branch:  build_staging → test_staging + smoke_test_staging → push_staging → auto_merge_to_main
MAIN Branch:     build_production → test_production + smoke_test_production → push_production → deploy_canary → validate_canary → promote_canary → tag_latest
```

---

## DEV Environment Jobs

### `build_dev`
| Property | Value |
|----------|-------|
| **Stage** | build |
| **Trigger** | Automatic on `dev` branch |
| **Purpose** | Build Docker image with layer caching and push to Docker Hub |
| **Features** | Uses `--cache-from` for faster builds, pushes immediately for smoke tests |

### `test_dev`
| Property | Value |
|----------|-------|
| **Stage** | test |
| **Trigger** | Automatic after `build_dev` |
| **Purpose** | Run linting on the codebase |
| **Features** | Warnings allowed (non-blocking) |

### `push_dev`
| Property | Value |
|----------|-------|
| **Stage** | push |
| **Trigger** | Automatic after `test_dev` |
| **Purpose** | Verify the image was pushed successfully |
| **Features** | Image already pushed in build stage, just verifies |

### `auto_merge_to_staging`
| Property | Value |
|----------|-------|
| **Stage** | deploy |
| **Trigger** | Automatic after `push_dev` |
| **Purpose** | Auto-merge dev branch into staging |
| **Features** | Uses GitLab API token for authentication |

---

## STAGING Environment Jobs

### `build_staging`
| Property | Value |
|----------|-------|
| **Stage** | build |
| **Trigger** | Automatic on `staging` branch |
| **Purpose** | Build Docker image with layer caching and push to Docker Hub |
| **Features** | Uses `--cache-from` for faster builds |

### `test_staging`
| Property | Value |
|----------|-------|
| **Stage** | test |
| **Trigger** | Automatic after `build_staging` |
| **Purpose** | Run strict linting and TypeScript type checking |
| **Features** | Lint errors are blocking, TypeScript validation |

### `smoke_test_staging`
| Property | Value |
|----------|-------|
| **Stage** | test |
| **Trigger** | Automatic after `build_staging` (parallel with `test_staging`) |
| **Purpose** | Run container and verify it starts and responds to health checks |
| **Features** | Pulls pre-built image (no rebuild), checks HTTP response |

### `push_staging`
| Property | Value |
|----------|-------|
| **Stage** | push |
| **Trigger** | Automatic after `test_staging` AND `smoke_test_staging` |
| **Purpose** | Verify the image was pushed successfully |
| **Features** | Image already pushed in build stage |

### `auto_merge_to_main`
| Property | Value |
|----------|-------|
| **Stage** | deploy |
| **Trigger** | Automatic after `push_staging` |
| **Purpose** | Auto-merge staging branch into main |
| **Features** | Uses GitLab API token for authentication |

---

## PRODUCTION Environment Jobs

### `build_production`
| Property | Value |
|----------|-------|
| **Stage** | build |
| **Trigger** | Automatic on `main` branch |
| **Purpose** | Build Docker image with layer caching and push to GCP Artifact Registry |
| **Features** | Uses `--cache-from` for faster builds, pushes to GCP |

### `test_production`
| Property | Value |
|----------|-------|
| **Stage** | test |
| **Trigger** | Automatic after `build_production` |
| **Purpose** | Run strict linting, TypeScript checking, and security audit |
| **Features** | Security audit is report-only (non-blocking) |

### `smoke_test_production`
| Property | Value |
|----------|-------|
| **Stage** | test |
| **Trigger** | Automatic after `build_production` (parallel with `test_production`) |
| **Purpose** | Run container and verify it starts and responds to health checks |
| **Features** | Pulls pre-built image from GCP |

### `push_production`
| Property | Value |
|----------|-------|
| **Stage** | push |
| **Trigger** | Automatic after `test_production` AND `smoke_test_production` |
| **Purpose** | Verify the image was pushed successfully |
| **Features** | Image already pushed in build stage |

---

## Canary Deployment Jobs

### `deploy_canary`
| Property | Value |
|----------|-------|
| **Stage** | deploy |
| **Trigger** | **MANUAL** - requires click after `push_production` |
| **Purpose** | Deploy new version with 10% traffic (canary) |
| **Features** | First deployment gets 100% traffic, subsequent deployments get 10% |

### `validate_canary`
| Property | Value |
|----------|-------|
| **Stage** | deploy |
| **Trigger** | **Automatic** after `deploy_canary` |
| **Purpose** | Run health checks on canary and auto-rollback if unhealthy |
| **Thresholds** | Max 3000ms response time, 20% error rate triggers rollback |
| **Features** | Performs 10 health checks, rolls back automatically on failure |

### `promote_canary`
| Property | Value |
|----------|-------|
| **Stage** | deploy |
| **Trigger** | **MANUAL** - requires click after `validate_canary` passes |
| **Purpose** | Route 100% traffic to the new version |
| **Features** | Only available if health checks pass |

### `tag_latest`
| Property | Value |
|----------|-------|
| **Stage** | deploy |
| **Trigger** | Automatic after `promote_canary` |
| **Purpose** | Tag the production image as `latest` |
| **Features** | Final step in successful deployment |

---

## Rollback Jobs (from rollback.gitlab-ci.yml)

### `test_health_checks`
| Property | Value |
|----------|-------|
| **Stage** | deploy |
| **Trigger** | **MANUAL** - safe to run anytime |
| **Purpose** | Dry run of health checks without triggering rollback |
| **Features** | Reports what would happen, no actual changes |

### `validate_canary`
| Property | Value |
|----------|-------|
| **Stage** | deploy |
| **Trigger** | **Automatic** after `deploy_canary` |
| **Purpose** | Validate canary health and auto-rollback if needed |
| **Configuration** | |
| - Max Response Time | 3000ms |
| - Error Threshold | 20% |
| - Total Checks | 10 |
| - Check Interval | 3 seconds |

### `rollback_production`
| Property | Value |
|----------|-------|
| **Stage** | deploy |
| **Trigger** | **MANUAL** - emergency rollback |
| **Purpose** | Instantly rollback to previous stable revision |
| **Features** | No dependencies, can run anytime, no rebuild required |

---

## Job Dependencies Diagram

```
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                                    DEV BRANCH                                         ║
╠═══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                       ║
║  ┌─────────────┐    ┌──────────┐    ┌──────────┐    ┌───────────────────────┐         ║
║  │  build_dev  │───▶│ test_dev │───▶│ push_dev │───▶│ auto_merge_to_staging │         ║
║  └─────────────┘    └──────────┘    └──────────┘    └───────────┬───────────┘         ║
║                                                                 │                     ║
╚═════════════════════════════════════════════════════════════════╪═════════════════════╝
                                                                  │
                              ┌───────────────────────────────────┘
                              │  AUTOMATIC MERGE
                              ▼
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                                  STAGING BRANCH                                       ║
╠═══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                       ║
║  ┌───────────────┐    ┌──────────────┐                                                ║
║  │ build_staging │───▶│ test_staging │─-───┐                                          ║
║  └───────────────┘    └──────────────┘     │  ┌──────────────┐   ┌───────────────-──┐ ║
║                   │                        ├─▶│ push_staging │──▶│auto_merge_to_main│ ║
║                   │   ┌─-──────────────────┤  └──────────────┘   └────────┬──────-──┘ ║
║                   └──▶│ smoke_test_staging │                              │           ║
║                       └────────────────────┘                              │           ║
║                                                                           │           ║
╚═══════════════════════════════════════════════════════════════════════════╪═══════════╝
                                                                            │
                              ┌─────────────────────────────────────────────┘
                              │  AUTOMATIC MERGE
                              ▼
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                                   MAIN BRANCH                                         ║
╠═══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                       ║
║  ┌──────────────────┐    ┌─────────────────┐                                          ║
║  │ build_production │───▶│ test_production │──────┐                                   ║
║  └──────────────────┘    └─────────────────┘      │    ┌─────────────────┐            ║
║                      │                            ├───▶│ push_production │            ║
║                      │    ┌───────────────────────┤    └────────┬────────┘            ║
║                      └───▶│ smoke_test_production │             │                     ║
║                           └───────────────────────┘             │                     ║
║                                                                 ▼                     ║
║                                                      ┌───────────────┐  (MANUAL)      ║
║                                                      │ deploy_canary │◀─────────      ║
║                                                      └───────┬───────┘                ║ 
║                                                              │                        ║
║                                                              ▼                        ║
║                                                      ┌─────────────────┐  (AUTO)      ║
║                                                      │ validate_canary │─────────     ║
║                                                      └───────┬─────────┘              ║
║                                                              │                        ║
║                                              ┌───────────────┴───────────────┐        ║
║                                              ▼                               ▼        ║
║                                      ┌───────────────┐               ┌──────────┐     ║
║                                      │ HEALTH PASS   │               │  FAIL    │     ║
║                                      └───────┬───────┘               └────┬─────┘     ║
║                                              │                            │           ║
║                                              ▼ (MANUAL)                   ▼ (AUTO)    ║
║                                      ┌───────────────┐               ┌──────────┐     ║
║                                      │promote_canary │               │ ROLLBACK │     ║
║                                      └───────┬───────┘               └──────────┘     ║
║                                              │                                        ║
║                                              ▼ (AUTO)                                 ║
║                                      ┌───────────────┐                                ║
║                                      │  tag_latest   │                                ║
║                                      └───────────────┘                                ║
║                                                                                       ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝

EMERGENCY (anytime):
┌─────────────────────┐
│ rollback_production │  (MANUAL - no dependencies)
└─────────────────────┘
```

---

## Docker Layer Caching

All build jobs use Docker layer caching for faster builds:

```yaml
# Pull previous image as cache
docker pull $IMAGE:tag || true

# Build with cache
docker build \
  --cache-from $IMAGE:tag \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  ...
```

**Expected time savings:**
- First build: ~4-5 minutes
- Code change only: ~1-2 minutes
- No changes (cache hit): ~30 seconds

---

## Environment Variables Required

| Variable | Description |
|----------|-------------|
| `GCP_SA_KEY` | GCP Service Account key (JSON) |
| `GCP_PROJECT_ID` | GCP Project ID |
| `GCP_REGION` | GCP Region (e.g., europe-southwest1) |
| `GCP_IMAGE_NAME` | Full GCP Artifact Registry image path |
| `DOCKER_HUB_USERNAME` | Docker Hub username |
| `DOCKER_HUB_PASSWORD` | Docker Hub password/token |
| `GITLAB_API_TOKEN` | GitLab API token for auto-merge |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
