# API Migration: Python → C# API

This document outlines the migration from Python FastAPI to C# .NET API for the Tutoria frontend.

## Environment Configuration

### Old Configuration
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v2
```

### New Configuration
```env
# C# API (Management & Auth endpoints)
NEXT_PUBLIC_API_URL=http://localhost:5001/api

# Python API (AI/Tutor endpoints - improve-prompt only)
NEXT_PUBLIC_AI_API_URL=http://localhost:8000/api/v2
```

## Endpoint Mappings

### Authentication Endpoints
| Frontend Method | Old (Python) | New (C#) | Notes |
|----------------|--------------|----------|-------|
| `login()` | `POST /api/v2/auth/login` | `POST /api/auth/login` | ✅ Migrated |
| `refreshToken()` | `POST /api/v2/auth/refresh` | `POST /api/auth/refresh` | ✅ Migrated |
| `getCurrentUser()` | `GET /api/v2/auth/me` | `GET /api/auth/me` | ✅ Migrated |
| `requestPasswordReset()` | `POST /api/v2/auth/reset-password-request` | `POST /api/auth/password-reset-request` | ✅ Migrated |
| `resetPassword()` | `POST /api/v2/auth/reset-password` | `POST /api/auth/password-reset` | ✅ Migrated |
| `changePassword()` | `PUT /api/v2/auth/password` | `PUT /api/auth/me/password` | ✅ Migrated |

### University Endpoints
| Frontend Method | Old (Python) | New (C#) | Notes |
|----------------|--------------|----------|-------|
| `getUniversities()` | `GET /api/v2/universities/` | `GET /api/universities/` | ✅ Migrated |
| `createUniversity()` | `POST /api/v2/universities/` | `POST /api/universities/` | ✅ Migrated |
| `getUniversity()` | `GET /api/v2/universities/{id}` | `GET /api/universities/{id}` | ✅ Migrated |
| `updateUniversity()` | `PUT /api/v2/universities/{id}` | `PUT /api/universities/{id}` | ✅ Migrated |
| `deleteUniversity()` | `DELETE /api/v2/universities/{id}` | `DELETE /api/universities/{id}` | ✅ Migrated |

### Course Endpoints
| Frontend Method | Old (Python) | New (C#) | Notes |
|----------------|--------------|----------|-------|
| `getCourses()` | `GET /api/v2/courses/` | `GET /api/courses/` | ✅ Migrated |
| `createCourse()` | `POST /api/v2/courses/` | `POST /api/courses/` | ✅ Migrated |
| `getCourse()` | `GET /api/v2/courses/{id}` | `GET /api/courses/{id}` | ✅ Migrated |
| `updateCourse()` | `PUT /api/v2/courses/{id}` | `PUT /api/courses/{id}` | ✅ Migrated |
| `deleteCourse()` | `DELETE /api/v2/courses/{id}` | `DELETE /api/courses/{id}` | ✅ Migrated |
| `assignProfessorToCourse()` | `POST /api/v2/courses/{id}/professors/{professorId}` | `POST /api/courses/{id}/professors/{professorId}` | ✅ Migrated |
| `unassignProfessorFromCourse()` | `DELETE /api/v2/courses/{id}/professors/{professorId}` | `DELETE /api/courses/{id}/professors/{professorId}` | ✅ Migrated |

### Module Endpoints
| Frontend Method | Old (Python) | New (C#) | Notes |
|----------------|--------------|----------|-------|
| `getModules()` | `GET /api/v2/modules/` | `GET /api/modules/` | ✅ Migrated |
| `createModule()` | `POST /api/v2/modules/` | `POST /api/modules/` | ✅ Migrated |
| `getModule()` | `GET /api/v2/modules/{id}` | `GET /api/modules/{id}` | ✅ Migrated |
| `updateModule()` | `PUT /api/v2/modules/{id}` | `PUT /api/modules/{id}` | ✅ Migrated |
| `deleteModule()` | `DELETE /api/v2/modules/{id}` | `DELETE /api/modules/{id}` | ✅ Migrated |
| `improveSystemPrompt()` | `POST /api/v2/modules/{id}/improve-prompt` | ⚠️ **PYTHON API** | Uses Python API |

### File Endpoints
| Frontend Method | Old (Python) | New (C#) | Notes |
|----------------|--------------|----------|-------|
| `getFiles()` | `GET /api/v2/files/` | `GET /api/files/` | ✅ Migrated |
| `uploadFile()` | `POST /api/v2/files/` | `POST /api/files/` | ✅ Migrated |
| `getFile()` | `GET /api/v2/files/{id}` | `GET /api/files/{id}` | ✅ Migrated |
| `updateFile()` | `PUT /api/v2/files/{id}` | `PUT /api/files/{id}` | ✅ Migrated |
| `deleteFile()` | `DELETE /api/v2/files/{id}` | `DELETE /api/files/{id}` | ✅ Migrated |
| `getFileDownloadUrl()` | `GET /api/v2/files/{id}/download` | `GET /api/files/{id}/download` | ✅ Migrated |

### Professor Endpoints
| Frontend Method | Old (Python) | New (C#) | Notes |
|----------------|--------------|----------|-------|
| `getProfessors()` | `GET /api/v2/professors/` | `GET /api/professors/` | ✅ Migrated |
| `createProfessor()` | `POST /api/v2/auth/users/create` | `POST /api/auth/users/create` | ✅ Migrated |
| `getProfessor()` | `GET /api/v2/professors/{id}` | `GET /api/professors/{id}` | ✅ Migrated |
| `updateProfessor()` | `PUT /api/v2/professors/{id}` | `PUT /api/professors/{id}` | ✅ Migrated |
| `updateProfessorPassword()` | `PUT /api/v2/professors/{id}/password` | `PUT /api/professors/{id}/password` | ✅ Migrated |
| `getProfessorCourses()` | `GET /api/v2/professors/{id}/courses` | `GET /api/professors/{id}/courses` | ✅ Migrated |
| `deleteProfessor()` | `DELETE /api/v2/professors/{id}` | `DELETE /api/professors/{id}` | ✅ Migrated |

### Student Endpoints
| Frontend Method | Old (Python) | New (C#) | Notes |
|----------------|--------------|----------|-------|
| `getStudents()` | `GET /api/v2/students/` | `GET /api/students/` | ✅ Migrated |
| `createStudent()` | `POST /api/v2/students/` | `POST /api/students/` | ✅ Migrated |
| `getStudent()` | `GET /api/v2/students/{id}` | `GET /api/students/{id}` | ✅ Migrated |
| `updateStudent()` | `PUT /api/v2/students/{id}` | `PUT /api/students/{id}` | ✅ Migrated |
| `deleteStudent()` | `DELETE /api/v2/students/{id}` | `DELETE /api/students/{id}` | ✅ Migrated |

### Module Token Endpoints
| Frontend Method | Old (Python) | New (C#) | Notes |
|----------------|--------------|----------|-------|
| `getModuleTokens()` | `GET /api/v2/module-tokens/` | `GET /api/module-tokens/` | ✅ Migrated |
| `createModuleToken()` | `POST /api/v2/module-tokens/` | `POST /api/module-tokens/` | ✅ Migrated |
| `getModuleToken()` | `GET /api/v2/module-tokens/{id}` | `GET /api/module-tokens/{id}` | ✅ Migrated |
| `updateModuleToken()` | `PUT /api/v2/module-tokens/{id}` | `PUT /api/module-tokens/{id}` | ✅ Migrated |
| `deleteModuleToken()` | `DELETE /api/v2/module-tokens/{id}` | `DELETE /api/module-tokens/{id}` | ✅ Migrated |

### AI Model Endpoints
| Frontend Method | Old (Python) | New (C#) | Notes |
|----------------|--------------|----------|-------|
| `getAIModels()` | `GET /api/v2/ai-models/` | `GET /api/ai-models/` | ✅ Migrated |
| `getAIModel()` | `GET /api/v2/ai-models/{id}` | `GET /api/ai-models/{id}` | ✅ Migrated |

### User Management Endpoints
| Frontend Method | Old (Python) | New (C#) | Notes |
|----------------|--------------|----------|-------|
| `getUsersByType()` | `GET /api/v2/auth/users/` | `GET /api/auth/users/` | ✅ Migrated |
| `getUser()` | `GET /api/v2/auth/users/{id}` | `GET /api/auth/users/{id}` | ✅ Migrated |
| `updateUser()` | `PUT /api/v2/auth/users/{id}` | `PUT /api/auth/users/{id}` | ✅ Migrated |
| `activateUser()` | `PATCH /api/v2/auth/users/{id}/activate` | `PATCH /api/auth/users/{id}/activate` | ✅ Migrated |
| `deactivateUser()` | `PATCH /api/v2/auth/users/{id}/deactivate` | `PATCH /api/auth/users/{id}/deactivate` | ✅ Migrated |
| `deleteUserPermanently()` | `DELETE /api/v2/auth/users/{id}` | `DELETE /api/auth/users/{id}` | ✅ Migrated |

## Property Naming Convention

### Response Property Names
- **Python API**: Uses `snake_case` (e.g., `first_name`, `created_at`)
- **C# API**: Uses `PascalCase` in C# code, but serialized to `camelCase` in JSON (e.g., `firstName`, `createdAt`)
- **Frontend**: Expects `camelCase` from both APIs (ASP.NET Core auto-converts)

### Key Differences
Both APIs return `camelCase` in JSON responses, so no frontend type changes needed!

## Dual-API Implementation

The API client now supports calling both APIs:

```typescript
// C# API (default)
await apiClient.getModules();

// Python API (explicit flag)
await apiClient.improveSystemPrompt(moduleId, prompt); // Uses Python API internally
```

### Implementation Details
```typescript
class TutoriaAPIClient {
  private baseURL: string;        // C# API
  private pythonBaseURL: string;  // Python API

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    usePythonAPI: boolean = false  // Flag to switch APIs
  ): Promise<T>
}
```

## Migration Status

### ✅ Completed
1. Environment variables configured for dual APIs
2. API client updated with dual-API support
3. All management endpoints migrated to C# API
4. Improve-prompt endpoint continues using Python API
5. Module-form component updated to use new method

### ⏳ Pending
1. Integration testing with actual C# API
2. Error handling verification
3. Response type validation
4. Performance testing

### 🔍 To Verify
1. C# API running on `http://localhost:5001`
2. All authorization policies working correctly
3. File upload endpoint compatibility
4. Token refresh flow

## Testing Checklist

- [ ] Login flow with C# API
- [ ] University CRUD operations
- [ ] Course CRUD operations
- [ ] Module CRUD operations
- [ ] File upload and download
- [ ] Professor management
- [ ] Student management
- [ ] Module token generation
- [ ] Improve system prompt (Python API)
- [ ] User preference updates

## Rollback Plan

If issues arise, revert `.env` to:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v2
```

And remove the `improveSystemPrompt()` method from `lib/api.ts`, reverting to direct `post()` calls.
