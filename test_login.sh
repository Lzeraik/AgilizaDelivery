#!/bin/bash

API_URL="http://localhost"
EMAIL="admin@restaurante.com"
PASSWORD="admin123"

echo "Fazendo login em $API_URL..."
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

echo "Resposta bruta:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

echo ""
TOKEN=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)

if [ -n "$TOKEN" ]; then
  echo "Login bem-sucedido!"
  echo "Token JWT: ${TOKEN:0:60}..."
else
  echo "Falha no login."
fi
