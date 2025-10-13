# API Contract: Frontend ↔ Backend Integration

This document defines the exact API contract between the lovable.dev frontend and the Strategic Clarity Engine backend.

## Base URL

**Development**: `http://localhost:3000`  
**Production**: `https://your-api.vercel.app`

---

## Endpoints

### 1. POST /api/intake

Submit founder quiz/task data for strategic plan generation.

#### Request

**Headers**:
```
Content-Type: application/json
```

**Body** (JSON):
```typescript
{
  // Required: Founder Profile
  "founderName": string,              // e.g. "Jane Doe"
  "founderEmail": string,             // e.g. "jane@example.com" (must be valid email)
  "tier": "free" | "paid",            // User subscription tier
  
  // Optional: Company Context
  "companyName"?: string,             // e.g. "Acme Inc"
  "companyStage"?: "idea" | "mvp" | "early-revenue" | "scaling",
  "founderRole"?: string,             // e.g. "CEO", "CTO", "Founder"
  "founderSkills"?: string[],         // e.g. ["engineering", "product", "sales"]
  
  // Required: Tasks (minimum 1)
  "tasks": [
    {
      "id": string,                   // Unique task ID (e.g. "t1", "task-001")
      "title": string,                // Task title (required, min 1 char)
      "description"?: string,         // Detailed description
      "urgencyLevel"?: "low" | "medium" | "high",
      "category"?: string,            // e.g. "product", "marketing", "sales"
      "estimatedEffort"?: "low" | "medium" | "high",
      "dependencies"?: string[],      // Array of task IDs this task depends on
      "owner"?: string                // Who should do this (e.g. "Jane", "CTO")
    }
    // ... more tasks
  ],
  
  // Optional: Additional Context
  "contextNotes"?: string,            // Free-form notes about company/situation
  
  // Optional: Uploaded Documents
  "uploadedDocs"?: [
    {
      "filename": string,             // e.g. "business-plan.pdf"
      "contentType": string,          // e.g. "application/pdf", "text/plain"
      "base64Content": string,        // Base64-encoded file content
      "sizeBytes": number             // File size in bytes
    }
    // ... more documents
  ],
  
  // Optional: OAuth Tokens
  "googleCalendarToken"?: string      // Google OAuth access token for calendar creation
}
```

**Example**:
```json
{
  "founderName": "Alex Chen",
  "founderEmail": "alex@taskflow.ai",
  "companyName": "TaskFlow AI",
  "companyStage": "mvp",
  "founderRole": "Solo Founder",
  "founderSkills": ["engineering", "product design"],
  "tier": "free",
  "tasks": [
    {
      "id": "t1",
      "title": "Add Stripe billing integration",
      "description": "Implement payment processing to enable monetization",
      "urgencyLevel": "high",
      "estimatedEffort": "medium",
      "category": "product"
    },
    {
      "id": "t2",
      "title": "Fix onboarding bugs",
      "description": "Users are dropping off during signup",
      "urgencyLevel": "high",
      "estimatedEffort": "low",
      "category": "product"
    },
    {
      "id": "t3",
      "title": "Launch on Product Hunt",
      "description": "Create PH launch strategy and assets",
      "urgencyLevel": "medium",
      "estimatedEffort": "medium",
      "category": "marketing",
      "dependencies": ["t1", "t2"]
    }
  ],
  "contextNotes": "2 months of runway left. Need revenue urgently."
}
```

#### Response

**Success (202 Accepted)**:
```json
{
  "success": true,
  "jobId": "job_abc123xyz456",
  "message": "Submission received. Your strategic plan is being generated.",
  "estimatedCompletionTime": 45
}
```

**Error (400 Bad Request)**:
```json
{
  "success": false,
  "message": "Validation error: founderEmail: Valid email required; tasks: At least one task required"
}
```

**Error (429 Too Many Requests)**:
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

**Error (500 Internal Server Error)**:
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

### 2. GET /api/status/:jobId

Poll job status and retrieve results when completed.

#### Request

**URL Parameters**:
- `jobId`: The job ID returned from POST /api/intake

**Example**:
```
GET /api/status/job_abc123xyz456
```

#### Response

**Pending (200 OK)**:
```json
{
  "jobId": "job_abc123xyz456",
  "status": "pending",
  "progress": 5,
  "createdAt": "2024-10-13T10:00:00.000Z"
}
```

**Processing (200 OK)**:
```json
{
  "jobId": "job_abc123xyz456",
  "status": "processing",
  "progress": 50,
  "createdAt": "2024-10-13T10:00:00.000Z"
}
```

**Completed (200 OK)**:
```json
{
  "jobId": "job_abc123xyz456",
  "status": "completed",
  "progress": 100,
  "createdAt": "2024-10-13T10:00:00.000Z",
  "completedAt": "2024-10-13T10:01:30.000Z",
  "processingDurationMs": 90000,
  
  // Results
  "notionUrl": "https://www.notion.so/workspace/Strategic-Plan-Alex-Chen-abc123",
  "calendarEvents": [
    {
      "title": "🚀 Strategic Plan Kickoff",
      "description": "Review your strategic plan and align on priorities...",
      "startDate": "2024-10-16T09:00:00.000Z",
      "endDate": "2024-10-16T10:00:00.000Z"
    },
    {
      "title": "🔄 Strategic Plan Mid-Point Review",
      "description": "Check progress on top priorities...",
      "startDate": "2024-11-03T14:00:00.000Z",
      "endDate": "2024-11-03T15:00:00.000Z"
    },
    {
      "title": "✅ Strategic Plan Final Review",
      "description": "Celebrate wins and plan next phase!",
      "startDate": "2024-11-24T10:00:00.000Z",
      "endDate": "2024-11-24T11:30:00.000Z"
    }
  ],
  "icsDownloadUrls": [
    "/api/calendar/job_abc123xyz456/0.ics",
    "/api/calendar/job_abc123xyz456/1.ics",
    "/api/calendar/job_abc123xyz456/2.ics"
  ]
}
```

**Failed (200 OK)**:
```json
{
  "jobId": "job_abc123xyz456",
  "status": "failed",
  "progress": 0,
  "createdAt": "2024-10-13T10:00:00.000Z",
  "errorMessage": "LLM API error: Rate limit exceeded"
}
```

**Not Found (404 Not Found)**:
```json
{
  "success": false,
  "message": "Job job_nonexistent not found"
}
```

---

### 3. GET /api/health

Health check endpoint for monitoring.

#### Response

**Success (200 OK)**:
```json
{
  "status": "healthy",
  "timestamp": "2024-10-13T10:00:00.000Z",
  "uptime": 123456
}
```

---

## Frontend Implementation Example

### TypeScript/React

```typescript
import { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

interface IntakePayload {
  founderName: string;
  founderEmail: string;
  tier: 'free' | 'paid';
  tasks: Task[];
  companyName?: string;
  companyStage?: string;
  founderRole?: string;
  founderSkills?: string[];
  contextNotes?: string;
  uploadedDocs?: UploadedDocument[];
}

interface Task {
  id: string;
  title: string;
  description?: string;
  urgencyLevel?: 'low' | 'medium' | 'high';
  estimatedEffort?: 'low' | 'medium' | 'high';
}

interface StatusResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  notionUrl?: string;
  calendarEvents?: CalendarEvent[];
  errorMessage?: string;
}

export function StrategicPlanForm() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Submit intake form
  const handleSubmit = async (formData: IntakePayload) => {
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      const result = await response.json();
      setJobId(result.jobId);
      
      // Start polling for status
      pollStatus(result.jobId);
      
    } catch (error) {
      console.error('Submission failed:', error);
      alert(`Error: ${error.message}`);
      setLoading(false);
    }
  };

  // Poll job status every 3 seconds
  const pollStatus = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/status/${id}`);
      const statusData = await response.json();
      
      setStatus(statusData);
      
      if (statusData.status === 'completed') {
        setLoading(false);
        // Redirect to Notion page
        window.open(statusData.notionUrl, '_blank');
      } else if (statusData.status === 'failed') {
        setLoading(false);
        alert(`Processing failed: ${statusData.errorMessage}`);
      } else {
        // Still processing, poll again
        setTimeout(() => pollStatus(id), 3000);
      }
      
    } catch (error) {
      console.error('Status check failed:', error);
      setLoading(false);
    }
  };

  return (
    <div>
      {loading ? (
        <div>
          <p>Generating your strategic plan...</p>
          <p>Progress: {status?.progress || 0}%</p>
          <p>Status: {status?.status || 'pending'}</p>
        </div>
      ) : (
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = buildFormData(e.target);
          handleSubmit(formData);
        }}>
          {/* Form fields */}
        </form>
      )}
      
      {status?.status === 'completed' && (
        <div>
          <h2>✅ Your Strategic Plan is Ready!</h2>
          <a href={status.notionUrl} target="_blank">
            View in Notion
          </a>
          <h3>Calendar Events:</h3>
          <ul>
            {status.calendarEvents?.map((event, i) => (
              <li key={i}>
                {event.title} - {new Date(event.startDate).toLocaleDateString()}
                <a href={status.icsDownloadUrls?.[i]} download>
                  Download .ics
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

## Validation Rules

### founderEmail
- Must be valid email format
- Example: `user@example.com`

### tasks
- Array must contain at least 1 task
- Each task must have:
  - `id` (string, unique)
  - `title` (string, min 1 character)

### tier
- Must be exactly `"free"` or `"paid"`

### companyStage
- If provided, must be one of: `"idea"`, `"mvp"`, `"early-revenue"`, `"scaling"`

### urgencyLevel
- If provided, must be one of: `"low"`, `"medium"`, `"high"`

### estimatedEffort
- If provided, must be one of: `"low"`, `"medium"`, `"high"`

### uploadedDocs.base64Content
- Must be valid Base64 string
- Recommended max size: 5MB per file

---

## Rate Limiting

- **Window**: 15 minutes
- **Max requests per IP**: 100
- **Response**: 429 Too Many Requests

Adjust in `api/.env`:
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## CORS Configuration

Only your frontend domain is allowed. Configure in `api/.env`:
```env
FRONTEND_URL=https://your-lovable-app.lovable.app
```

For local development, set to `*` or `http://localhost:3000`.

---

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 202 | Accepted | Job created successfully, poll status |
| 400 | Bad Request | Check validation errors in response |
| 404 | Not Found | Job ID doesn't exist |
| 429 | Too Many Requests | Retry after rate limit window |
| 500 | Internal Server Error | Retry or contact support |

---

## Polling Best Practices

1. **Interval**: Poll every 3-5 seconds
2. **Timeout**: Stop polling after 5 minutes (job may have failed)
3. **Backoff**: Increase interval if processing takes long
4. **UX**: Show progress bar and estimated time

Example with exponential backoff:
```typescript
let pollInterval = 3000; // Start at 3 seconds
let attempts = 0;
const maxAttempts = 60; // 5 minutes max

const pollWithBackoff = async () => {
  if (attempts >= maxAttempts) {
    alert('Processing is taking longer than expected. Please check back later.');
    return;
  }
  
  const status = await fetchStatus(jobId);
  attempts++;
  
  if (status.status === 'completed' || status.status === 'failed') {
    handleComplete(status);
  } else {
    // Exponential backoff: 3s, 3s, 6s, 9s, 12s, 15s...
    setTimeout(pollWithBackoff, Math.min(pollInterval * Math.log2(attempts + 1), 15000));
  }
};
```

---

## Testing

### cURL Examples

**Submit intake**:
```bash
curl -X POST http://localhost:3000/api/intake \
  -H "Content-Type: application/json" \
  -d '{
    "founderName": "Test User",
    "founderEmail": "test@example.com",
    "tier": "free",
    "tasks": [
      {
        "id": "t1",
        "title": "Launch MVP",
        "description": "Get product to market",
        "urgencyLevel": "high"
      }
    ]
  }'
```

**Check status**:
```bash
curl http://localhost:3000/api/status/job_abc123xyz456
```

**Health check**:
```bash
curl http://localhost:3000/api/health
```

---

## Support

For issues or questions:
1. Check API response error messages
2. Verify payload matches schema
3. Check rate limiting headers
4. Review backend logs (Vercel/Render dashboard)

---

**Last Updated**: October 13, 2024  
**API Version**: 1.0.0

