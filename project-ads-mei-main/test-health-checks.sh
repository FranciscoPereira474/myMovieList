#!/bin/bash
# =============================================================================
# HEALTH CHECK TEST SCRIPT (Local Dry Run)
# =============================================================================
# 
# Run this script locally to test the health check logic before deploying
# the automated rollback pipeline.
#
# Usage:
#   chmod +x test-health-checks.sh
#   ./test-health-checks.sh
#
# Or with custom URL:
#   ./test-health-checks.sh https://your-service-url.run.app
#
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# CONFIGURATION - Adjust these values to match your pipeline
# =============================================================================
MAX_RESPONSE_TIME_MS=3000      # Max acceptable response time (3 seconds)
ERROR_THRESHOLD_PERCENT=10     # Max acceptable error rate (10%)
TOTAL_CHECKS=5                 # Number of health checks to perform
CHECK_INTERVAL_SECONDS=2       # Time between checks

# Default service URL (can be overridden by command line argument)
SERVICE_URL="${1:-https://my-web-app-wdonytfjaq-oa.a.run.app}"

# =============================================================================
# SCRIPT START
# =============================================================================

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}🧪 HEALTH CHECK TEST (LOCAL DRY RUN)${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${YELLOW}⚠️  This is a TEST ONLY - no rollback will occur${NC}"
echo ""
echo "Configuration:"
echo "   Service URL: $SERVICE_URL"
echo "   Max Response Time: ${MAX_RESPONSE_TIME_MS}ms"
echo "   Error Threshold: ${ERROR_THRESHOLD_PERCENT}%"
echo "   Total Checks: ${TOTAL_CHECKS}"
echo "   Check Interval: ${CHECK_INTERVAL_SECONDS}s"
echo ""

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ ERROR: curl is not installed${NC}"
    exit 1
fi

# Check if the URL is reachable
echo "🔍 Testing URL reachability..."
if ! curl -s --head --max-time 5 "$SERVICE_URL" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Warning: Could not reach $SERVICE_URL${NC}"
    echo "   Make sure the URL is correct and the service is running."
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}🏥 Starting Health Checks...${NC}"
echo "================================================"

# Initialize counters
FAILED_CHECKS=0
TOTAL_RESPONSE_TIME=0
RESULTS=()

# Health Check Loop
for i in $(seq 1 $TOTAL_CHECKS); do
    echo ""
    echo "--- Health Check $i/$TOTAL_CHECKS ---"
    
    # Measure response time and status
    START_TIME=$(date +%s%N)
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$SERVICE_URL" 2>/dev/null || echo "000")
    END_TIME=$(date +%s%N)
    
    # Calculate response time in milliseconds
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS - date +%s%N doesn't work, use alternative
        RESPONSE_TIME=$(( (END_TIME - START_TIME) / 1000000 ))
    else
        RESPONSE_TIME=$(( (END_TIME - START_TIME) / 1000000 ))
    fi
    
    # Handle case where timing fails
    if [ "$RESPONSE_TIME" -lt 0 ] || [ "$RESPONSE_TIME" -gt 60000 ]; then
        # Fallback: use curl's timing
        RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "$SERVICE_URL" 2>/dev/null | awk '{printf "%.0f", $1 * 1000}')
    fi
    
    TOTAL_RESPONSE_TIME=$((TOTAL_RESPONSE_TIME + RESPONSE_TIME))
    
    echo "   HTTP Status: $HTTP_STATUS"
    echo "   Response Time: ${RESPONSE_TIME}ms"
    
    # Check for failures
    if [ "$HTTP_STATUS" != "200" ]; then
        echo -e "   ${RED}❌ FAILED: Non-200 status code${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        RESULTS+=("FAIL")
    elif [ "$RESPONSE_TIME" -gt "$MAX_RESPONSE_TIME_MS" ]; then
        echo -e "   ${YELLOW}⚠️ SLOW: Response time exceeded ${MAX_RESPONSE_TIME_MS}ms${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        RESULTS+=("SLOW")
    else
        echo -e "   ${GREEN}✅ PASSED${NC}"
        RESULTS+=("PASS")
    fi
    
    # Wait before next check (except for last one)
    if [ $i -lt $TOTAL_CHECKS ]; then
        sleep $CHECK_INTERVAL_SECONDS
    fi
done

# Calculate results
AVG_RESPONSE_TIME=$((TOTAL_RESPONSE_TIME / TOTAL_CHECKS))
ERROR_RATE=$((FAILED_CHECKS * 100 / TOTAL_CHECKS))

echo ""
echo "================================================"
echo -e "${BLUE}📊 TEST RESULTS${NC}"
echo "================================================"
echo ""
echo "   Total Checks:      $TOTAL_CHECKS"
echo "   Passed:            $((TOTAL_CHECKS - FAILED_CHECKS))"
echo "   Failed:            $FAILED_CHECKS"
echo "   Error Rate:        ${ERROR_RATE}%"
echo "   Avg Response Time: ${AVG_RESPONSE_TIME}ms"
echo ""

# Show individual results
echo "   Results: ${RESULTS[*]}"
echo ""

# Decision
echo "================================================"
if [ "$ERROR_RATE" -ge "$ERROR_THRESHOLD_PERCENT" ]; then
    echo -e "${RED}🚨 WOULD TRIGGER ROLLBACK${NC}"
    echo "   Error rate (${ERROR_RATE}%) >= threshold (${ERROR_THRESHOLD_PERCENT}%)"
    echo ""
    echo -e "${YELLOW}⚠️  In production, this would automatically rollback!${NC}"
    EXIT_CODE=1
else
    echo -e "${GREEN}✅ WOULD PASS VALIDATION${NC}"
    echo "   Error rate (${ERROR_RATE}%) < threshold (${ERROR_THRESHOLD_PERCENT}%)"
    echo ""
    echo "   Service is healthy - canary would be promoted."
    EXIT_CODE=0
fi

echo ""
echo "================================================"
echo -e "${BLUE}🧪 TEST COMPLETE - No changes made${NC}"
echo "================================================"
echo ""

# Summary table
echo "Quick Reference:"
echo "┌─────────────────────┬─────────────────┐"
echo "│ Metric              │ Value           │"
echo "├─────────────────────┼─────────────────┤"
printf "│ %-19s │ %-15s │\n" "URL" "${SERVICE_URL:0:15}..."
printf "│ %-19s │ %-15s │\n" "HTTP Status" "$([ "$FAILED_CHECKS" -eq 0 ] && echo '200 OK' || echo 'Mixed')"
printf "│ %-19s │ %-15s │\n" "Avg Response" "${AVG_RESPONSE_TIME}ms"
printf "│ %-19s │ %-15s │\n" "Error Rate" "${ERROR_RATE}%"
printf "│ %-19s │ %-15s │\n" "Threshold" "${ERROR_THRESHOLD_PERCENT}%"
printf "│ %-19s │ %-15s │\n" "Result" "$([ "$EXIT_CODE" -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "└─────────────────────┴─────────────────┘"
echo ""

exit $EXIT_CODE
