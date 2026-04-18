# Rollback Strategy Documentation

This document explains the automated and manual rollback strategies implemented for the MyMovieList production deployment.

## Table of Contents

- [Overview](#overview)
- [Rollback Triggers](#rollback-triggers)
- [Automated Rollback](#automated-rollback)
- [Manual Rollback](#manual-rollback)
- [Rollback to Specific Revision](#rollback-to-specific-revision)
- [How It Works](#how-it-works)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## Overview

Our rollback strategy follows industry best practices:

| Principle | Implementation |
|-----------|----------------|
| **Fast** | Traffic switching only - no rebuild needed |
| **Safe** | Previous revisions always preserved |
| **Automated** | Health checks trigger automatic rollback |
| **No manual rebuild** | Uses existing Cloud Run revisions |
| **No manual env config** | Cloud Run maintains environment variables |

---

## Rollback Triggers

Automatic rollback is triggered by:

| Trigger | Threshold | Example |
|---------|-----------|---------|
| **HTTP Failures** | Non-200 status codes | 500 Internal Server Error |
| **Performance Degradation** | Response time > 3000ms | Slow database queries |
| **Error Rate** | > 10% of health checks fail | Multiple failures |

---

## Automated Rollback

### How It Works

```
┌─────────────────┐
│  deploy_canary  │  (Manual trigger - deploys with 10% traffic)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│validate_canary  │  (AUTOMATIC - runs health checks)
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
 PASS       FAIL
    │         │
    ▼         ▼
┌────────┐  ┌─────────────────────┐
│promote │  │ AUTOMATIC ROLLBACK  │
│canary  │  │ (No human needed)   │
│(manual)│  └─────────────────────┘
└────────┘
```

### The `validate_canary` Job

This job runs **automatically** after canary deployment and performs:

1. **Gets canary URL** from Cloud Run
2. **Stores previous revision** for potential rollback
3. **Runs 10 health checks** (configurable)
4. **Measures response time** for each check
5. **Calculates error rate**
6. **Decision**:
   - If error rate ≥ 10% → **AUTOMATIC ROLLBACK**
   - If error rate < 10% → **Ready for promotion**

### What Happens During Automatic Rollback

```bash
# Traffic is instantly switched to the previous stable revision
gcloud run services update-traffic my-web-app \
  --region=$GCP_REGION \
  --to-revisions=$PREVIOUS_REVISION=100
```

- ⚡ **Instant** - No rebuild, no redeployment
- 🔄 **Traffic switch only** - Previous revision is already running
- 📊 **100% traffic** - All users immediately on stable version

---

## Manual Rollback

### When to Use

Use manual rollback when:
- Issues discovered **after** full promotion
- Automated rollback didn't catch an edge case
- Need immediate emergency rollback

### How to Trigger

1. Go to **GitLab CI/CD → Pipelines**
2. Find the latest `main` branch pipeline
3. Click **"rollback_production"** job
4. Click **"Run"** (play button)

### What It Does

```bash
# Gets the second most recent revision (before current)
PREVIOUS_REVISION=$(gcloud run revisions list ... | tail -1)

# Routes 100% traffic to previous revision
gcloud run services update-traffic my-web-app \
  --to-revisions=$PREVIOUS_REVISION=100
```

---

## Rollback to Specific Revision

### When to Use

Use this when:
- Need to rollback more than one version
- Want to restore a specific known-good revision
- Testing a particular revision

### How to Trigger

1. Go to **GitLab CI/CD → Pipelines**
2. Find the latest `main` branch pipeline
3. Click **"rollback_to_specific_revision"** job
4. Click **Variables** and set:
   ```
   ROLLBACK_REVISION = my-web-app-00042-abc
   ```
5. Click **"Run"**

### Finding Revision Names

```bash
# List recent revisions
gcloud run revisions list \
  --service=my-web-app \
  --region=europe-west1 \
  --limit=10
```

Or check the job output - it lists available revisions if `ROLLBACK_REVISION` is not set.

---

## How It Works

### Cloud Run Revision System

Google Cloud Run keeps all deployed revisions:

```
┌──────────────────────────────────────────────────────────┐
│                    Cloud Run Service                      │
│                      (my-web-app)                         │
├──────────────────────────────────────────────────────────┤
│  Revision: my-web-app-00045  ← Current (100% traffic)    │
│  Revision: my-web-app-00044  ← Previous (0% traffic)     │
│  Revision: my-web-app-00043  ← Older                     │
│  Revision: my-web-app-00042  ← Older                     │
└──────────────────────────────────────────────────────────┘
```

### Rollback = Traffic Switch

```
BEFORE ROLLBACK:
┌─────────┐     100%      ┌─────────────────┐
│  Users  │ ────────────▶ │ Revision 00045  │ (broken)
└─────────┘               └─────────────────┘

AFTER ROLLBACK:
┌─────────┐     100%      ┌─────────────────┐
│  Users  │ ────────────▶ │ Revision 00044  │ (stable)
└─────────┘               └─────────────────┘
```

**Key insight**: Both revisions are already deployed and running. Rollback simply changes which one receives traffic.

---

## Configuration

### Health Check Thresholds

Edit these variables in `validate_canary` job:

```yaml
variables:
  MAX_RESPONSE_TIME_MS: "3000"      # Rollback if response > 3 seconds
  ERROR_THRESHOLD_PERCENT: "10"      # Rollback if > 10% checks fail
  TOTAL_CHECKS: "10"                 # Number of health checks
  CHECK_INTERVAL_SECONDS: "3"        # Time between checks
```

### Adjusting Sensitivity

| Scenario | Configuration |
|----------|---------------|
| **More sensitive** | Lower `ERROR_THRESHOLD_PERCENT` to 5% |
| **Less sensitive** | Raise `ERROR_THRESHOLD_PERCENT` to 20% |
| **Faster validation** | Reduce `TOTAL_CHECKS` to 5 |
| **Stricter performance** | Lower `MAX_RESPONSE_TIME_MS` to 2000 |

---

## Troubleshooting

### Rollback Failed - No Previous Revision

**Error**: `PREVIOUS_REVISION is empty`

**Cause**: Only one revision exists (first deployment)

**Solution**: Manual intervention required - fix and redeploy

---

### Rollback Didn't Trigger Automatically

**Possible causes**:
1. Error rate was below threshold
2. Health check URL is wrong
3. `validate_canary` job was skipped

**Solution**: Use manual `rollback_production` job

---

### Need to Rollback After Promotion

**Problem**: Issues discovered after `promote_canary` ran

**Solution**: Run `rollback_production` manual job

---

### Check Current Traffic Distribution

```bash
gcloud run services describe my-web-app \
  --region=europe-west1 \
  --format="table(status.traffic[].percent,status.traffic[].revisionName)"
```

---

## Summary

| Rollback Type | Trigger | Speed | Use Case |
|---------------|---------|-------|----------|
| **Automated** | Health check failure | ~30 seconds | Canary validation |
| **Manual** | Human trigger | ~10 seconds | Emergency |
| **Specific Revision** | Human trigger + variable | ~10 seconds | Advanced |

All rollbacks are:
- ✅ **Fast** - Traffic switch only
- ✅ **Safe** - No data loss
- ✅ **Reversible** - Can re-promote anytime
- ✅ **No rebuild** - Uses existing revisions
