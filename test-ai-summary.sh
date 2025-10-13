#!/bin/bash

# Test AI Summary Generation for Snack Lists
# Usage: ./test-ai-summary.sh <list-id>

echo "🤖 Testing AI Summary Generation"
echo "================================"
echo ""

# Check if list ID provided
if [ -z "$1" ]; then
  echo "❌ Error: Please provide a list ID"
  echo "Usage: ./test-ai-summary.sh <list-id>"
  echo ""
  echo "Example: ./test-ai-summary.sh f6915e1d-fb0e-463e-ab19-128225b10aa8"
  exit 1
fi

LIST_ID=$1
BASE_URL="http://localhost:3000"

echo "📋 List ID: $LIST_ID"
echo "🌐 Base URL: $BASE_URL"
echo ""

# Step 1: Generate AI Summary
echo "Step 1: Generating AI summary..."
echo "POST $BASE_URL/api/lists/$LIST_ID/summary"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/api/lists/$LIST_ID/summary" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Step 2: Retrieve the summary
echo "Step 2: Retrieving AI summary..."
echo "GET $BASE_URL/api/lists/$LIST_ID/summary"
echo ""

SUMMARY_RESPONSE=$(curl -s "$BASE_URL/api/lists/$LIST_ID/summary")

echo "Summary Response:"
echo "$SUMMARY_RESPONSE" | jq '.' 2>/dev/null || echo "$SUMMARY_RESPONSE"
echo ""

# Step 3: Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ AI Summary generated successfully!"
  echo ""
  echo "Summary:"
  echo "$SUMMARY_RESPONSE" | jq -r '.data.summary' 2>/dev/null
  echo ""
  echo "Themes:"
  echo "$SUMMARY_RESPONSE" | jq -r '.data.themes[]' 2>/dev/null
else
  echo "❌ Failed to generate AI summary"
  echo "Check the error message above"
fi

echo ""
echo "Done!"
