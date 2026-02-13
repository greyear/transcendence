# Auth Service - API Requirements

## Endpoint: POST /auth/validate

### Description
Validates JWT token and returns user information for API Gateway.

### Request
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response (Success - 200 OK)
```json
{
  "id": 123
}
```

**IMPORTANT:** The field must be named exactly `id` (not `userId`, not `user_id`).

### Response (Error - 401 Unauthorized)
```json
{
  "error": "Invalid token"
}
```

---

## Integration Notes
- API Gateway uses this endpoint to validate tokens
- The `id` field from the response is passed to other microservices via the `X-User-Id` header
- If you need to change the field name, also update the code in `api-gateway/src/middleware/auth.js`
