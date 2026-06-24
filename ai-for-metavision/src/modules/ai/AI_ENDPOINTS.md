# AI Module API Documentation

## Base Path
All endpoints are prefixed with `/api/ai`

---

## 1. POST /ai/chat
**Chat with AI for personalized assistance**

### Request
```json
{
  "userId": "string (required)",
  "message": "string (required)",
  "restaurantId": "string (optional)",
  "context": "object (optional)"
}
```

### Response
```json
{
  "userId": "string",
  "message": "string",
  "response": "string",
  "context": {
    "user": { "id", "email", "name", "role" },
    "history": { "totalOrders", "totalSpent", "averageOrderValue" },
    "timestamp": "ISO8601",
    "season": "spring|summer|fall|winter",
    "timeOfDay": "morning|afternoon|evening|night"
  },
  "conversationId": "string",
  "timestamp": "ISO8601"
}
```

### Example
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "message": "What should I order today?"
  }'
```

---

## 2. POST /ai/insight
**Get AI-powered business insights**

### Request
```json
{
  "restaurantId": "string (required)",
  "dataType": "revenue|menu|orders|trends (required)",
  "timeRange": "daily|weekly|monthly (optional, default: monthly)"
}
```

### Response
```json
{
  "restaurantId": "string",
  "dataType": "string",
  "timeRange": "string",
  "insights": [
    {
      "type": "performance|opportunity|trend",
      "message": "string",
      "confidence": "number (0-1)"
    }
  ],
  "generatedAt": "ISO8601"
}
```

### Example
```bash
curl -X POST http://localhost:3000/api/ai/insight \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "rest456",
    "dataType": "revenue",
    "timeRange": "weekly"
  }'
```

---

## 3. POST /ai/recommend
**Get personalized menu recommendations**

### Request
```json
{
  "userId": "string (required)",
  "restaurantId": "string (required)",
  "limit": "number (optional, default: 5, max: 50)"
}
```

### Response
```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "price": "number",
    "category": "string",
    "recommendationScore": "number (0-1)",
    "reason": "string"
  }
]
```

### Example
```bash
curl -X POST http://localhost:3000/api/ai/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "restaurantId": "rest456",
    "limit": 3
  }'
```

---

## 4. POST /ai/forecast
**Get revenue and order forecasts**

### Request
```json
{
  "restaurantId": "string (required)",
  "days": "number (optional, default: 7, max: 90)"
}
```

### Response
```json
{
  "restaurantId": "string",
  "days": "number",
  "forecast": [
    {
      "date": "YYYY-MM-DD",
      "predictedOrders": "number",
      "predictedRevenue": "number",
      "confidence": "number (0-1)"
    }
  ],
  "generatedAt": "ISO8601",
  "modelVersion": "string"
}
```

### Example
```bash
curl -X POST http://localhost:3000/api/ai/forecast \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "rest456",
    "days": 14
  }'
```

---

## 5. GET /ai/behavior/:userId
**Get behavior analysis for a user**

### Response
```json
{
  "userId": "string",
  "totalOrders": "number",
  "orderFrequencyPerMonth": "number",
  "categoryPreferences": [
    {
      "category": "string",
      "orders": "number"
    }
  ],
  "spendingTrend": "increasing|decreasing|stable",
  "topRestaurants": [
    {
      "restaurantId": "string",
      "orders": "number"
    }
  ],
  "avgOrderValue": "number",
  "lastOrderDaysAgo": "number"
}
```

### Example
```bash
curl http://localhost:3000/api/ai/behavior/user123
```

---

## 6. GET /ai/context/:userId
**Get user context**

### Query Parameters
- `restaurantId` (optional): Get context for specific restaurant

### Response
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "string"
  },
  "restaurant": {
    "id": "string",
    "name": "string",
    "address": "string"
  },
  "history": {
    "totalOrders": "number",
    "totalSpent": "number",
    "averageOrderValue": "number",
    "lastOrderDate": "ISO8601"
  },
  "timestamp": "ISO8601",
  "season": "spring|summer|fall|winter",
  "timeOfDay": "morning|afternoon|evening|night"
}
```

### Example
```bash
curl http://localhost:3000/api/ai/context/user123
```

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "userId and message are required",
  "error": "Bad Request"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## Data Types Reference

### Time of Day
- `morning` (5:00 - 12:00)
- `afternoon` (12:00 - 17:00)
- `evening` (17:00 - 21:00)
- `night` (21:00 - 5:00)

### Seasons
- `spring` (Mar - May)
- `summer` (Jun - Aug)
- `fall` (Sep - Oct)
- `winter` (Nov - Feb)

### Spending Trends
- `increasing` - Recent orders higher by 20%+
- `stable` - Within ±20% of baseline
- `decreasing` - Recent orders lower by 20%+

### Churn Risk
- `low` - Ordered in last 30 days
- `medium` - Ordered 30-90 days ago
- `high` - No orders in 90+ days or new user

---

## Integration Notes

- All timestamps are in ISO8601 format
- All IDs are strings (UUIDs)
- Floating point numbers represent currency (USD)
- Confidence scores range from 0 to 1
- Ready for Redis integration in Step 11 (memory caching)
