# ProjectSphere API Documentation

**Base URL:** `http://localhost:5000/api`  
**Version:** 1.0.0  
**Author:** Vindya 

---

## Table of Contents
- [Authentication](#authentication)
- [Project Endpoints](#project-endpoints)
  - [Get All Projects](#1-get-all-projects)
  - [Get Project by ID](#2-get-project-by-id)
  - [Create Project](#3-create-project)
  - [Update Project](#4-update-project)
  - [Delete Project](#5-delete-project)
  - [Get My Projects](#6-get-my-projects)
- [Response Format](#response-format)
- [Error Codes](#error-codes)

---

## Authentication

All protected routes require a valid JWT token in the request header:

```
Authorization: Bearer <your_jwt_token>
```

> **Note:** Authentication is handled by Member 4. Protected routes are marked with 🔒.

---

## Project Endpoints

### 1. Get All Projects

Returns all publicly approved projects. Supports search and filter.

```
GET /api/projects
```

**Access:** Public

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| search | String | No | Search projects by title |
| category | String | No | Filter by category |

**Example Request:**
```
GET /api/projects?search=health&category=Healthcare
```

**Example Response (200 OK):**
```json
{
  "success": true,
  "projects": [
    {
      "_id": "6a424f6c402fb1566e9b9f89",
      "title": "Ayubo Care - Patient Portal",
      "description": "A localized doctor appointment application",
      "technologies": ["MongoDB", "Express", "React", "Node.js"],
      "thumbnail": "uploads/thumbnail-123456.jpg",
      "diagrams": [],
      "dbSchemaUrl": null,
      "category": "Healthcare",
      "githubUrl": "https://github.com/username/ayubo-care",
      "owner": {
        "_id": "64b5f8e91234567890abcdef",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "status": "Approved",
      "comments": [],
      "createdAt": "2026-06-29T10:56:44.727Z",
      "updatedAt": "2026-06-29T10:56:44.727Z"
    }
  ]
}
```

---

### 2. Get Project by ID

Returns a single project by its ID.

```
GET /api/projects/:id
```

**Access:** Public

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | String | Yes | MongoDB ObjectId of the project |

**Example Request:**
```
GET /api/projects/6a424f6c402fb1566e9b9f89
```

**Example Response (200 OK):**
```json
{
  "success": true,
  "project": {
    "_id": "6a424f6c402fb1566e9b9f89",
    "title": "Ayubo Care - Patient Portal",
    "description": "A localized doctor appointment application",
    "technologies": ["MongoDB", "Express", "React", "Node.js"],
    "thumbnail": "uploads/thumbnail-123456.jpg",
    "diagrams": ["uploads/diagrams-123456.png"],
    "dbSchemaUrl": "uploads/dbSchema-123456.png",
    "category": "Healthcare",
    "githubUrl": "https://github.com/username/ayubo-care",
    "owner": {
      "_id": "64b5f8e91234567890abcdef",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "status": "Approved",
    "comments": [],
    "createdAt": "2026-06-29T10:56:44.727Z",
    "updatedAt": "2026-06-29T10:56:44.727Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Project not found"
}
```

---

### 3. Create Project

Creates a new project. Status is automatically set to `Pending`.

```
POST /api/projects
```

**Access:** 🔒 Protected (Students only)

**Request Body:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | String | Yes | Project title |
| description | String | Yes | Project description |
| technologies | String | Yes | Comma-separated list e.g. `React,Node.js` |
| category | String | Yes | Project category |
| githubUrl | String | No | GitHub repository URL |
| thumbnail | File | No | Project thumbnail image (jpg, png, gif — max 5MB) |
| diagrams | File(s) | No | Architecture diagrams (max 10 files) |
| dbSchema | File | No | Database schema diagram |

**Example Request (Postman):**
```
POST /api/projects
Content-Type: multipart/form-data

title: Ayubo Care
description: A healthcare app
technologies: React,Node.js,MongoDB
category: Healthcare
githubUrl: https://github.com/username/ayubo-care
thumbnail: [file]
```

**Example Response (201 Created):**
```json
{
  "success": true,
  "project": {
    "_id": "6a424f6c402fb1566e9b9f89",
    "title": "Ayubo Care",
    "description": "A healthcare app",
    "technologies": ["React", "Node.js", "MongoDB"],
    "thumbnail": "uploads/thumbnail-123456.jpg",
    "diagrams": [],
    "dbSchemaUrl": null,
    "category": "Healthcare",
    "githubUrl": "https://github.com/username/ayubo-care",
    "owner": "64b5f8e91234567890abcdef",
    "status": "Pending",
    "comments": [],
    "createdAt": "2026-06-29T10:56:44.727Z",
    "updatedAt": "2026-06-29T10:56:44.727Z"
  }
}
```

---

### 4. Update Project

Updates an existing project. Only the project owner can update. Status resets to `Pending` after every edit.

```
PUT /api/projects/:id
```

**Access:** 🔒 Protected (Project owner only)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | String | Yes | MongoDB ObjectId of the project |

**Request Body:** `multipart/form-data` (same fields as Create Project)

**Example Response (200 OK):**
```json
{
  "success": true,
  "project": {
    "_id": "6a424f6c402fb1566e9b9f89",
    "title": "Ayubo Care - Updated",
    "status": "Pending",
    "updatedAt": "2026-06-29T12:00:00.000Z"
  }
}
```

**Error Response (403 Forbidden):**
```json
{
  "success": false,
  "error": "Not authorized"
}
```

---

### 5. Delete Project

Deletes a project permanently. Only the project owner can delete.

```
DELETE /api/projects/:id
```

**Access:** 🔒 Protected (Project owner only)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | String | Yes | MongoDB ObjectId of the project |

**Example Response (200 OK):**
```json
{
  "success": true,
  "message": "Project deleted"
}
```

**Error Response (403 Forbidden):**
```json
{
  "success": false,
  "error": "Not authorized"
}
```

---

### 6. Get My Projects

Returns all projects created by the currently logged-in student. Includes all statuses (Pending, Approved, Rejected).

```
GET /api/projects/my-projects
```

**Access:** 🔒 Protected (Students only)

**Example Response (200 OK):**
```json
{
  "success": true,
  "projects": [
    {
      "_id": "6a424f6c402fb1566e9b9f89",
      "title": "Ayubo Care",
      "status": "Pending",
      "createdAt": "2026-06-29T10:56:44.727Z"
    },
    {
      "_id": "6a424f6c402fb1566e9b9f90",
      "title": "ProjectSphere",
      "status": "Approved",
      "createdAt": "2026-06-28T10:56:44.727Z"
    }
  ]
}
```

---

## Project Status Flow

```
Student creates project
        ↓
   status: Pending
        ↓
Lecturer reviews project
        ↓
   ┌────┴────┐
Approved   Rejected
        ↓
Student edits project
        ↓
   status: Pending  (resets automatically)
```

---

## Response Format

All API responses follow this consistent format:

**Success:**
```json
{
  "success": true,
  "data": {}
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## Error Codes

| Status Code | Meaning |
|-------------|---------|
| 200 | OK — Request successful |
| 201 | Created — Resource created successfully |
| 400 | Bad Request — Invalid input |
| 401 | Unauthorized — No token provided |
| 403 | Forbidden — Not authorized to perform action |
| 404 | Not Found — Resource not found |
| 500 | Internal Server Error — Server side error |

---

## Database Schema

### Project Collection

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| title | String | Yes | — | Project title |
| description | String | Yes | — | Project description |
| technologies | [String] | No | [] | List of technologies used |
| thumbnail | String | No | null | Path to thumbnail image |
| diagrams | [String] | No | [] | Paths to diagram images |
| dbSchemaUrl | String | No | null | Path to DB schema image |
| category | String | No | — | Project category |
| githubUrl | String | No | null | GitHub repository URL |
| owner | ObjectId | Yes | — | Reference to User |
| status | String | Yes | Pending | Pending / Approved / Rejected |
| comments | [Object] | No | [] | Embedded comment objects |
| createdAt | Date | Auto | — | Creation timestamp |
| updatedAt | Date | Auto | — | Last update timestamp |

---

*Documentation maintained by Vindya — ProjectSphere Team*