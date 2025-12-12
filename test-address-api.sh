#!/bin/bash

# Address API Test Script
# This script tests all the address management endpoints

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:5000/api/v1"

# You need to replace this with a valid JWT token
# Get token by logging in first: POST /api/v1/auth/login
TOKEN="YOUR_JWT_TOKEN_HERE"

echo -e "${YELLOW}=== Address API Test Suite ===${NC}\n"

# Test 1: Create First Address
echo -e "${YELLOW}Test 1: Create First Address (Home)${NC}"
curl -X POST "${BASE_URL}/addresses" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "home",
    "name": "Test User",
    "phone": "+919876543210",
    "address_line1": "123 Main Street",
    "address_line2": "Apartment 4B",
    "landmark": "Near City Mall",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postal_code": "400001",
    "country": "India",
    "latitude": 19.0760,
    "longitude": 72.8777,
    "is_default": true
  }' | jq '.'
echo -e "\n"

# Test 2: Create Second Address
echo -e "${YELLOW}Test 2: Create Second Address (Work)${NC}"
curl -X POST "${BASE_URL}/addresses" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "work",
    "name": "Test User",
    "phone": "+919876543210",
    "address_line1": "456 Business Park",
    "address_line2": "Floor 5",
    "landmark": "Opposite Metro Station",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postal_code": "400002",
    "country": "India",
    "is_default": false
  }' | jq '.'
echo -e "\n"

# Test 3: Get All Addresses
echo -e "${YELLOW}Test 3: Get All Addresses${NC}"
curl -X GET "${BASE_URL}/addresses" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.'
echo -e "\n"

# Test 4: Get Default Address
echo -e "${YELLOW}Test 4: Get Default Address${NC}"
curl -X GET "${BASE_URL}/addresses/default" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.'
echo -e "\n"

# Test 5: Update Address (you need to replace ADDRESS_ID with actual ID from previous responses)
echo -e "${YELLOW}Test 5: Update Address${NC}"
echo "Note: Replace ADDRESS_ID in the script with actual address ID"
# curl -X PUT "${BASE_URL}/addresses/ADDRESS_ID" \
#   -H "Authorization: Bearer ${TOKEN}" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "landmark": "Near New Shopping Complex"
#   }' | jq '.'
echo -e "\n"

# Test 6: Set Default Address
echo -e "${YELLOW}Test 6: Set Default Address${NC}"
echo "Note: Replace ADDRESS_ID in the script with actual address ID"
# curl -X PATCH "${BASE_URL}/addresses/ADDRESS_ID/set-default" \
#   -H "Authorization: Bearer ${TOKEN}" | jq '.'
echo -e "\n"

# Test 7: Get Single Address
echo -e "${YELLOW}Test 7: Get Single Address${NC}"
echo "Note: Replace ADDRESS_ID in the script with actual address ID"
# curl -X GET "${BASE_URL}/addresses/ADDRESS_ID" \
#   -H "Authorization: Bearer ${TOKEN}" | jq '.'
echo -e "\n"

# Test 8: Delete Address (Soft Delete)
echo -e "${YELLOW}Test 8: Delete Address (Soft Delete)${NC}"
echo "Note: Replace ADDRESS_ID in the script with actual address ID"
# curl -X DELETE "${BASE_URL}/addresses/ADDRESS_ID" \
#   -H "Authorization: Bearer ${TOKEN}" | jq '.'
echo -e "\n"

echo -e "${GREEN}=== Test Suite Complete ===${NC}"
echo -e "${YELLOW}Note: Remember to replace YOUR_JWT_TOKEN_HERE with a valid token${NC}"
echo -e "${YELLOW}Note: Uncomment and update ADDRESS_ID in tests 5-8 to run them${NC}"
