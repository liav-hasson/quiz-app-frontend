# Backend API Requirements - Profile Page Optimization

## Overview
The frontend Profile page needs 3 optimized API endpoints to minimize redundant calls and improve performance. Each endpoint serves a specific purpose.

---

## 1. User Profile API - `/api/user/profile`

### Purpose
Return authenticated user's profile information combined with their quiz statistics in a single call.

### Method
`GET`

### Authentication
Required - JWT Bearer token in `Authorization` header

### Response Structure
```json
{
  "XP": 1250,
  "streak": 12,
  "bestCategory": "DevOps",
  "totalAnswers": 47,
  "averageScore": 7.5,
  "lastActivity": "2025-11-24T15:30:00Z",
  "joiningDate":  "2025-10-05T12:30:00Z",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "picture": "https://example.com/avatar.jpg",
  "role": "Lifelong Learner"
}
```

### Field Descriptions

| Field | Type | Description | Calculation |
|-------|------|-------------|-------------|
| `XP` | number | Total experience points earned | Sum of all XP from completed answers |
| `streak` | number | Numbers of days in a row with site activity | alculated in acticity
| `bestCategory` | string | Category with highest average score | Category name where user has best performance (avg score) |
| `totalAnswers` | number | Total number of answers submitted | Count of all answer records |
| `averageScore` | number | Average score across all answers | `SUM(scores) / COUNT(answers)` rounded to 1 decimal |
| `lastActivity` | string (ISO 8601) | Most recent answer timestamp | MAX(created_at) from answers table |
| `joiningDate` | string (ISO 8601) | User creation timestamp | From user profile
| `name` | string | User's display name | From user profile |
| `email` | string | User's email address | From user profile |
| `picture` | string | User's avatar URL | From user profile |
| `role` | string | User's role/title | From user profile or default to "Lifelong Learner" |

### Business Logic
- **XP Calculation**: Sum all XP earned from quiz answers (each answer awards XP based on score/difficulty)
- **Best Category**: 
  - Group answers by category
  - Calculate average score per category
  - Return category with highest average (minimum 3 answers to qualify)
  - Return `null` if user has no answers or insufficient data
- **Average Score**: Calculate mean score across all answers (0-10 scale)
- **Total Answers**: Count all submitted answers regardless of score

### Error Responses
```json
// 401 Unauthorized - No valid JWT token
{
  "error": "Authentication required"
}

// 404 Not Found - User doesn't exist
{
  "error": "User not found"
}
```

### Notes
- Cache this endpoint for 5 minutes per user to reduce DB load
- All calculations should be done on backend (don't rely on frontend)
- Return `null` for stats fields if user has no quiz history

---

## 2. User History API - `/api/user/history`

### Purpose
Return the user's most recent answer history with **full details** for display in the history list.

### Method
`GET`

### Authentication
Required - JWT Bearer token in `Authorization` header

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 20 | Max entries to return (max: 100) |
| `before` | string (ISO 8601) | null | Fetch entries before this timestamp (pagination) |

### Example Request
```
GET /api/user/history?limit=20
GET /api/user/history?limit=20&before=2025-11-20T00:00:00Z
```

### Response Structure
```json
{
  "history": [
    {
      "id": "ans_123456",
      "summary": {
        "category": "DevOps",
        "subject": "Kubernetes",
        "difficulty": 2,
        "score": 8,
        "keyword": "Pod Lifecycle",
        "created_at": "2025-11-24T15:30:00Z"
      },
      "details": {
        "question": "Explain how Kubernetes handles pod lifecycle management...",
        "answer": "Kubernetes manages pod lifecycle through...",
        "evaluation": {
          "feedback": "Great answer! You correctly explained..."
        },
        "metadata": {
          "submitted_at": "2025-11-24T15:30:00Z",
          "source": "quiz-app"
        }
      }
    }
  ]
}
```

### Field Descriptions

**Summary** (displayed in collapsed card):
- `category`: Quiz category name
- `subject`: Quiz subject name  
- `difficulty`: 1 (Easy), 2 (Medium), 3 (Hard)
- `score`: AI evaluation score (0-10)
- `keyword`: Main topic keyword
- `created_at`: When answer was submitted

**Details** (shown when card is expanded):
- `question`: Full question text
- `answer`: User's full answer text
- `evaluation.feedback`: AI-generated feedback text
- `metadata`: Additional tracking info

### Sorting
- **Must be sorted** by `created_at` DESC (newest first)
- Frontend displays most recent answer first

### Error Responses
```json
// 401 Unauthorized
{
  "error": "Authentication required"
}

// 400 Bad Request - Invalid parameters
{
  "error": "Invalid limit parameter. Max is 100."
}
```

### Notes
- This endpoint returns **complete answer data** (question + answer + feedback)
- Limit default is 20 to balance data size and UX
- Support pagination via `before` parameter for "load more" functionality
- Do NOT include aggregated stats here (use `/api/user/profile` for that)

---

## 3. User Performance API - `/api/user/performance`

### Purpose
Return **aggregated** performance data optimized for chart rendering. Should include time-based aggregation and top category breakdowns.

### Method
`GET`

### Authentication
Required - JWT Bearer token in `Authorization` header

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | `30d` | Time period: `7d`, `30d`, `90d`, `all` |
| `granularity` | string | `day` | Aggregation level: `day`, `week`, `month` |

### Example Request
```
GET /api/user/performance?period=30d&granularity=day
```

### Response Structure
```json
{
  "performance": [
    {
      "date": "2025-11-24T00:00:00Z",
      "overall": 7.5,
      "categories": {
        "DevOps": 8.2,
        "Programming": 7.1,
        "Cloud": 6.8,
        "Networking": 7.9,
        "Security": 8.5
      }
    },
    {
      "date": "2025-11-23T00:00:00Z",
      "overall": 6.9,
      "categories": {
        "DevOps": 7.5,
        "Programming": 6.2,
        "Cloud": 7.1
      }
    }
  ]
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `date` | string (ISO 8601) | Start of time bucket (day/week/month) |
| `overall` | number | Average score across all categories for this period |
| `categories` | object | Map of category name → average score for top 5 categories |

### Business Logic

**Time-based aggregation:**
- Group answers by date based on `granularity` parameter
- `day`: Group by calendar day (00:00:00 - 23:59:59)
- `week`: Group by week starting Monday
- `month`: Group by calendar month

**Overall score:**
- Average of all answer scores within the time bucket
- Rounded to 1 decimal place

**Categories breakdown:**
- Calculate average score per category within each time bucket
- Return **top 5 categories** by total answer count (most active categories)
- If user has <5 categories, return all available
- Category scores are averages for that category in that time period

**Period filtering:**
- `7d`: Last 7 days from today
- `30d`: Last 30 days from today (default)
- `90d`: Last 90 days from today
- `all`: All time data

### Example Use Case
Frontend charts display:
- Line chart: Overall performance trend over time
- Multi-line chart: Top 5 category performance trends
- X-axis: Date/time buckets
- Y-axis: Average score (0-10)

### Error Responses
```json
// 401 Unauthorized
{
  "error": "Authentication required"
}

// 400 Bad Request - Invalid parameters
{
  "error": "Invalid period parameter. Must be: 7d, 30d, 90d, or all"
}
```

### Notes
- This is **aggregated data only** - no individual answers
- Optimize for chart rendering (limit data points for performance)
- For `day` granularity with `30d` period, return max 30 data points
- Empty categories object if user has no answers in that time bucket
- Cache this endpoint for 10 minutes per user to reduce computation

---

## Implementation Priorities

### High Priority
1. **`/api/user/profile`** - Most critical, needed for all stats display
2. **`/api/user/history`** - Needed for history list functionality

### Medium Priority
3. **`/api/user/performance`** - Needed for chart, but chart can show "No data" placeholder initially

---

## Database Optimization Recommendations

### Indexes Needed
```sql
-- For profile stats calculation
CREATE INDEX idx_answers_user_created ON answers(user_id, created_at DESC);
CREATE INDEX idx_answers_user_category ON answers(user_id, category);

-- For performance aggregation
CREATE INDEX idx_answers_user_date_category ON answers(user_id, created_at, category);
```

### Caching Strategy
- **User Profile**: Cache 5 minutes (stats don't change frequently)
- **User History**: Cache 2 minutes (users expect fresh data)
- **User Performance**: Cache 10 minutes (chart data doesn't need real-time updates)

---

## Testing Checklist

### For each endpoint:
- [ ] Returns correct data for authenticated user
- [ ] Returns 401 for unauthenticated requests
- [ ] Returns 404 for non-existent users
- [ ] Handles users with no quiz history gracefully (empty arrays, null values)
- [ ] Respects query parameters correctly
- [ ] Returns data in correct format matching schema above
- [ ] Performance is acceptable (< 500ms response time)
- [ ] Handles edge cases (new user, deleted answers, etc.)

---

## Migration from Old Endpoints

### Deprecated Endpoints (can be removed after frontend deploys)
- `/api/user/best-category` - Replaced by `/api/user/profile`
- Any separate stats endpoints - Consolidated into `/api/user/profile`

### Frontend Changes Complete
Frontend has been updated to use these 3 new endpoints. Once backend implements them, the integration will work seamlessly.

---

## Questions or Clarifications?

Contact frontend team if:
- Response format needs adjustment
- Additional fields are needed
- Performance constraints require different approach
- Caching strategy needs modification
