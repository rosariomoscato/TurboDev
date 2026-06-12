---
name: api-endpoint
description: Create REST API endpoints with proper error handling and validation. Use when building API routes, creating CRUD endpoints, or when the user asks to add a backend API endpoint.
---

# API Endpoint Skill

## Overview

This skill guides the creation of REST API endpoints that are consistent, secure, and follow the conventions already established in the project.

---

## Step 1: Read Framework Conventions

Before writing any endpoint, **always** examine the existing codebase to understand the project's patterns.

### What to look for

1. **Framework**: Express, Fastify, FastAPI, Next.js Route Handlers, Hono, or another framework? The choice determines the entire endpoint structure.
2. **Directory structure**: Are routes in `routes/`, `api/`, `server/routers/`, or `app/api/`? Follow the existing layout.
3. **File naming**: Does the project name route files by resource (`users.ts`), by path (`route.ts`), or by another convention?
4. **Middleware pattern**: How is authentication, logging, and validation applied? Look at existing routes.
5. **Response format**: Do endpoints return `{ data, error }`, `{ success, result }`, or something else? Check 3–5 existing endpoints.
6. **Error handling**: Are errors thrown, returned, or handled by a global error handler?
7. **Validation library**: Zod, Joi, express-validator, Pydantic, or manual checks?
8. **Status codes**: Does the project use specific status codes consistently? (200, 201, 204, 400, 401, 403, 404, 409, 422, 500)

### Where to look

- `src/routes/`, `api/`, `server/routers/`, or `app/api/` for existing route files
- `package.json` or `requirements.txt` for framework and validation dependencies
- Any middleware or interceptor files
- Error handler utilities or custom error classes

---

## Step 2: Endpoint Creation Checklist

Follow this checklist for every endpoint:

### 2.1 Input Validation

- **Always validate inputs at the system boundary** — never trust client data.
- Use the project's validation library (Zod, Pydantic, etc.) to define schemas.
- Validate all incoming fields: body, query parameters, path parameters, and headers.
- Return a `400 Bad Request` or `422 Unprocessable Entity` with specific error messages when validation fails.

```typescript
// Example with Zod (TypeScript)
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'user', 'viewer']).default('user'),
});

// In the handler:
const parsed = createUserSchema.safeParse(request.body);
if (!parsed.success) {
  return response.status(422).json({
    error: 'Validation failed',
    details: parsed.error.flatten().fieldErrors,
  });
}
```

### 2.2 Authentication and Authorization

- Check whether the endpoint requires authentication. If unsure, default to requiring it.
- Verify the user's identity before processing the request.
- Check authorization: does the authenticated user have permission to perform this action?
- Return `401 Unauthorized` when authentication is missing or invalid.
- Return `403 Forbidden` when the user is authenticated but lacks permission.

### 2.3 Response Format

- Use the project's standard response envelope consistently.
- Return the appropriate HTTP status code (see Section 3 below).
- Include only necessary data in responses — never expose internal IDs, secrets, or implementation details.
- For collection endpoints, support pagination. Return `{ data, pagination: { page, pageSize, total } }` or the project's convention.

### 2.4 Error Handling

- Never expose stack traces or internal error details to clients in production.
- Use the project's error handling mechanism (custom error classes, global handler, try/catch).
- Log errors server-side for debugging.
- Return structured error responses the client can parse.

```typescript
// Standard error response shape
{
  "error": "Not Found",
  "message": "User with id 'abc123' does not exist.",
  "statusCode": 404
}
```

### 2.5 Database Operations

- Use parameterized queries or the project's ORM. Never concatenate user input into queries.
- Handle unique constraint violations gracefully — return `409 Conflict` with a descriptive message.
- Use transactions for operations that modify multiple tables.
- Consider connection pooling and query performance for endpoints expecting high traffic.

### 2.6 Idempotency

- `GET`, `HEAD`, and `OPTIONS` should be safe and idempotent.
- `PUT` should be idempotent — repeated calls produce the same result.
- `DELETE` should be idempotent — deleting a resource that's already deleted should return `204` or `404`, not `500`.
- `POST` is not idempotent by design, but consider idempotency keys for critical operations (e.g., payment processing).

---

## Step 3: HTTP Status Codes Reference

Use the correct status code for each situation:

### Success Responses

| Code | Meaning | When to Use |
|------|---------|-------------|
| `200 OK` | Successful request | `GET` a resource, successful `PUT`/`PATCH` update |
| `201 Created` | Resource created | Successful `POST` that creates a new resource |
| `204 No Content` | Success, no body | Successful `DELETE`, or `PUT`/`PATCH` when no body is returned |

### Client Error Responses

| Code | Meaning | When to Use |
|------|---------|-------------|
| `400 Bad Request` | Malformed request syntax | Missing required fields, invalid JSON |
| `401 Unauthorized` | Authentication required | Missing or invalid auth token |
| `403 Forbidden` | Insufficient permissions | User is authenticated but not allowed to perform this action |
| `404 Not Found` | Resource does not exist | Requested entity is not found |
| `409 Conflict` | State conflict | Duplicate resource, version conflict |
| `422 Unprocessable Entity` | Validation failure | Well-formed request but semantic errors |
| `429 Too Many Requests` | Rate limited | Client exceeded rate limits |

### Server Error Responses

| Code | Meaning | When to Use |
|------|---------|-------------|
| `500 Internal Server Error` | Unexpected server failure | Unhandled exceptions, database failures |

---

## Step 4: Common Patterns

### 4.1 CRUD Endpoint Structure

Organize CRUD operations consistently. Follow the project's routing convention:

```
GET    /api/resources         → List resources
GET    /api/resources/:id     → Get single resource
POST   /api/resources         → Create resource
PUT    /api/resources/:id     → Replace resource (full update)
PATCH  /api/resources/:id     → Partial update
DELETE /api/resources/:id     → Delete resource
```

### 4.2 List Endpoint with Pagination

```typescript
// GET /api/users?page=1&pageSize=20&role=admin
async function listUsers(request: Request, response: Response) {
  const { page = 1, pageSize = 20, role } = request.query;

  // Validate pagination parameters
  const validPage = Math.max(1, Number(page));
  const validPageSize = Math.min(100, Math.max(1, Number(pageSize)));

  const { data, total } = await userRepository.findAll({
    page: validPage,
    pageSize: validPageSize,
    filters: { role },
  });

  return response.json({
    data,
    pagination: {
      page: validPage,
      pageSize: validPageSize,
      total,
      totalPages: Math.ceil(total / validPageSize),
    },
  });
}
```

### 4.3 Create Endpoint with Validation

```typescript
// POST /api/users
async function createUser(request: Request, response: Response) {
  // 1. Validate input
  const parsed = createUserSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(422).json({
      error: 'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  // 2. Check for duplicates
  const existing = await userRepository.findByEmail(parsed.data.email);
  if (existing) {
    return response.status(409).json({
      error: 'Conflict',
      message: 'A user with this email already exists.',
    });
  }

  // 3. Create the resource
  const user = await userRepository.create(parsed.data);

  // 4. Return the created resource
  return response.status(201).json({ data: sanitizeUser(user) });
}
```

### 4.4 Delete Endpoint

```typescript
// DELETE /api/users/:id
async function deleteUser(request: Request, response: Response) {
  const { id } = request.params;

  const user = await userRepository.findById(id);
  if (!user) {
    return response.status(404).json({
      error: 'Not Found',
      message: `User with id '${id}' does not exist.`,
    });
  }

  await userRepository.delete(id);

  // 204 No Content — successful deletion with no response body
  return response.status(204).send();
}
```

---

## Step 5: Security Checklist

Every endpoint must address these security concerns:

1. **Input validation**: All inputs are validated and sanitized before use.
2. **Authentication**: Endpoints that require login verify the user's identity.
3. **Authorization**: The authenticated user has permission to perform the requested action.
4. **SQL Injection**: Use parameterized queries or ORM methods. Never interpolate user input into queries.
5. **Rate limiting**: Sensitive endpoints (login, registration, password reset) should be rate-limited.
6. **CORS**: Configure appropriate CORS policies. Do not use `*` in production.
7. **Response sanitization**: Never expose passwords, tokens, internal IDs, or stack traces in responses.
8. **Request size limits**: Enforce maximum request body size to prevent denial-of-service attacks.
9. **Logging**: Log endpoint access and errors. Do not log sensitive data (passwords, tokens, PII).

---

## Step 6: Verification

After creating an endpoint, verify:

1. **Type checking compiles**: Run the project's type-check command.
2. **Linting passes**: Run the project's linter.
3. **Manual test**: Call the endpoint with valid and invalid inputs using `curl` or an HTTP client.
4. **Edge cases tested**: Test with missing fields, empty strings, extremely long values, and boundary conditions.
5. **Error responses are structured**: All error paths return consistent JSON, not HTML error pages.
6. **Route is registered**: Ensure the route is imported and registered in the application's router or middleware chain.

---

## Anti-Patterns to Avoid

- **Catching and swallowing errors silently**: Always handle errors — log them and return an appropriate response.
- **Returning 200 for everything**: Use the correct HTTP status code. A validation error is not `200 OK`.
- **Exposing internal errors to clients**: Stack traces, database error messages, and file paths must never reach the client.
- **N+1 queries**: When returning a list of items with related data, batch the queries instead of one per item.
- **Mutations via GET**: Never modify data on `GET` requests. Use `POST`, `PUT`, `PATCH`, or `DELETE`.
- **Inconsistent response shapes**: Every endpoint should return the same envelope structure. Pick one and stick to it.
