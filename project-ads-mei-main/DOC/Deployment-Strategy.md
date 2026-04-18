# Deployment Strategy Documentation

This document describes the **Rollback Strategy** and **Deploy Pattern** chosen for the MyMovieList project.

---

## Table of Contents

1. [Deploy Pattern: Canary Deployment](#deploy-pattern-canary-deployment)
2. [Rollback Strategy: Re-deploy Previous Version](#rollback-strategy-re-deploy-previous-version)
3. [Summary](#summary)

---

## Deploy Pattern: Canary Deployment

### What is Canary Deployment?

Canary deployment is a technique where a new version of an application is gradually rolled out to a small subset of users before being deployed to the entire infrastructure. The name comes from the "canary in a coal mine" concept - if something goes wrong, only a small percentage of users are affected.

### Why Canary for This Project?

| Reason | Explanation |
|--------|-------------|
| **Risk Mitigation** | Only 10% of users see the new version initially. If there's a bug, 90% of users are unaffected. |
| **Real-World Testing** | Test with real production traffic and real user behavior, catching issues that staging might miss. |
| **Cloud Run Native Support** | Google Cloud Run has built-in traffic splitting, making canary deployments trivial to implement. |
| **No Extra Infrastructure Cost** | Unlike Blue-Green (which requires 2 full environments), canary uses the same infrastructure. |
| **Gradual Confidence Building** | Increase traffic progressively: 10% → 25% → 50% → 100%, monitoring at each stage. |

### Advantages of Canary Deployment

1. **Risk Mitigation**
   - Only a small percentage of users (e.g., 10%) see the new version initially
   - If there's a bug, only 10% of users are affected, not 100%
   - Reduces blast radius of potential failures

2. **Real-World Testing**
   - Test with real production traffic and real user behavior
   - Catch issues that weren't detected in staging (edge cases, scale issues)
   - More reliable than synthetic tests

3. **Gradual Rollout**
   - Increase traffic progressively: 10% → 25% → 50% → 100%
   - Monitor metrics at each stage before proceeding
   - Build confidence before full deployment

4. **Easy Rollback**
   - If issues are detected, simply route 100% traffic back to the old version
   - No downtime, no redeployment needed
   - Instant recovery

5. **Performance Comparison**
   - Compare response times, error rates between old and new versions side-by-side
   - Data-driven decision to promote or rollback

6. **Zero Downtime**
   - Users experience no interruption during deployment
   - Both versions run simultaneously

### Canary vs Blue-Green Comparison

| Aspect | Canary | Blue-Green |
|--------|--------|------------|
| **Traffic** | Gradual (10% → 100%) | All-or-nothing switch |
| **Risk** | Lower (small % affected) | Higher (100% switch) |
| **Cost** | Same infrastructure | Requires 2 full environments |
| **Feedback** | Gradual, real metrics | Immediate, but all users |
| **Complexity** | Moderate | Simpler concept |

### How Canary Works in Our Pipeline

```
Step 1: Deploy Canary (Manual Trigger)
┌─────────────────────────────────────────┐
│ New Version (Canary)   ← 10% traffic    │
│ Old Version (Stable)   ← 90% traffic    │
└─────────────────────────────────────────┘

Step 2: Monitor & Validate
- Check error rates
- Monitor response times
- Verify functionality

Step 3: Promote Canary (Manual Trigger)
┌─────────────────────────────────────────┐
│ New Version            ← 100% traffic   │
│ Old Version            ← 0% traffic     │
└─────────────────────────────────────────┘
```

---

## Rollback Strategy: Re-deploy Previous Version

### What is Re-deploy Previous Version?

This strategy involves switching traffic back to a previously deployed, stable version of the application when issues are detected in the current version. Cloud Run maintains a history of revisions, allowing instant traffic switching without rebuilding or redeploying.

### Why This Rollback Strategy?

| Alternative | Why NOT for this project |
|-------------|--------------------------|
| **Database Rollback** | We use Supabase (external) - no DB migrations in our app |
| **Feature Flags** | Requires code changes and flag management system (LaunchDarkly, etc.) - overkill for our scale |
| **Git Revert + Redeploy** | Slow - requires new build, tests, push. Takes 10+ minutes |
| **Re-deploy Previous** | ✅ **Instant** - Cloud Run keeps revisions, just switch traffic |

### Is It Automated?

**No, it's MANUAL** - and that's intentional.

#### Why Manual?

1. **Human Judgment Required**
   - Not all issues warrant a rollback
   - Sometimes a quick hotfix is better than rolling back
   - Need to assess: Is it a critical bug? Performance issue? Minor glitch?

2. **Avoid False Positives**
   - Automated rollbacks based on metrics can trigger incorrectly
   - A spike in errors might be from external factors (Supabase issue, network), not your code
   - Human can investigate before making the decision

3. **Coordination Needed**
   - Team should be notified before rollback
   - May need to communicate to users
   - Might need to coordinate with other systems

4. **Irreversible Data Changes**
   - If new version wrote data in a new format, automated rollback could cause issues
   - Human can assess data implications

### How Rollback Works in Cloud Run

```
Before Rollback (Issue Detected):
┌─────────────────────────────────────────┐
│ my-web-app-00005  ← Current (broken)    │  ← 100% traffic
│ my-web-app-00004  ← Previous (stable)   │  ← 0% traffic
│ my-web-app-00003                        │
│ my-web-app-00002                        │
└─────────────────────────────────────────┘

After Rollback (Traffic Switched):
┌─────────────────────────────────────────┐
│ my-web-app-00005  ← Broken              │  ← 0% traffic
│ my-web-app-00004  ← Previous (stable)   │  ← 100% traffic ✅
│ my-web-app-00003                        │
│ my-web-app-00002                        │
└─────────────────────────────────────────┘
```

**Result**: Instant rollback (seconds), no rebuild, no redeployment needed.

### When to Use Rollback?

| Scenario | Action |
|----------|--------|
| ⚠️ New deployment causes 500 errors | **Rollback** |
| ⚠️ Performance degradation after deploy | **Rollback** |
| ⚠️ Critical feature broken in production | **Rollback** |
| ⚠️ Security vulnerability discovered | **Rollback** |
| ℹ️ Minor UI bug | Consider hotfix instead |
| ℹ️ Non-critical issue | Investigate first |

---

## Summary

| Aspect | Choice | Reason |
|--------|--------|--------|
| **Deploy Pattern** | Canary Deployment | Gradual rollout (10% → 100%); native Cloud Run support; catch bugs early with minimal user impact |
| **Rollback Strategy** | Re-deploy Previous Version | Cloud Run keeps revisions; instant traffic switch; no DB to worry about; manual trigger for human judgment |

### Pipeline Flow with Canary + Rollback

```
                    ┌─────────────┐
                    │   dev       │
                    └──────┬──────┘
                           │ auto-merge
                    ┌──────▼──────┐
                    │  staging    │
                    └──────┬──────┘
                           │ auto-merge
                    ┌──────▼──────┐
                    │    main     │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐     │     ┌──────▼──────┐
       │ Deploy      │     │     │ Rollback    │
       │ Canary (10%)│     │     │ (Manual)    │
       │ (Manual)    │     │     └─────────────┘
       └──────┬──────┘     │
              │            │
       ┌──────▼──────┐     │
       │ Promote     │     │
       │ Canary(100%)│     │
       │ (Manual)    │     │
       └──────┬──────┘     │
              │            │
       ┌──────▼──────┐     │
       │ Tag Latest  │     │
       └─────────────┘     │
```

---

## References

- [Google Cloud Run Traffic Management](https://cloud.google.com/run/docs/rollouts-rollbacks-traffic-migration)
- [Canary Deployments - Martin Fowler](https://martinfowler.com/bliki/CanaryRelease.html)
- [GitLab CI/CD Manual Jobs](https://docs.gitlab.com/ee/ci/jobs/job_control.html#create-a-job-that-must-be-run-manually)
