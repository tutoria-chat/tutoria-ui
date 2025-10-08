# Tutoria Backend Analysis for TODOs 3, 5, 6, 7

**Date**: 2025-10-07
**Analyzed**: tutoria-api codebase at `D:\Users\Steve\Code\tutoria-api`

---

## Executive Summary

Comprehensive analysis of backend requirements for dark mode, dashboard statistics, multi-model AI, and super admin features. **Total estimated effort: 52-76 hours backend + 42-56 hours frontend = 94-132 hours total.**

---

## TODO 3: Dark Mode Setup 🌙

### Frontend Requirements
- Theme toggle component (header/settings)
- Theme context provider with localStorage sync
- Sync theme preference with backend API

### Backend Requirements

#### Database Changes
```sql
-- Option A: Add to each user table (RECOMMENDED)
ALTER TABLE [dbo].[Professors]
ADD [ThemePreference] NVARCHAR(20) NULL DEFAULT 'light'
    CONSTRAINT [CK_Professors_ThemePreference]
    CHECK ([ThemePreference] IN ('light', 'dark', 'system'));

ALTER TABLE [dbo].[Students]
ADD [ThemePreference] NVARCHAR(20) NULL DEFAULT 'light'
    CONSTRAINT [CK_Students_ThemePreference]
    CHECK ([ThemePreference] IN ('light', 'dark', 'system'));

ALTER TABLE [dbo].[SuperAdmins]
ADD [ThemePreference] NVARCHAR(20) NULL DEFAULT 'light'
    CONSTRAINT [CK_SuperAdmins_ThemePreference]
    CHECK ([ThemePreference] IN ('light', 'dark', 'system'));
```

#### New Endpoints
- `GET /api/v2/profile/me` - Get current user profile
- `PUT /api/v2/profile/preferences` - Update user preferences
- `GET /api/v2/profile/preferences` - Get just preferences

#### Schemas
```python
class PreferencesUpdate(BaseModel):
    theme_preference: Optional[Literal["light", "dark", "system"]] = None
    language: Optional[str] = None

class ProfileResponse(BaseModel):
    id: int
    username: str
    email: str
    theme_preference: str
    # ... other fields
```

**Effort**: 4-6 hours
**Complexity**: Low
**Risk**: Low
**Breaking Changes**: None

---

## TODO 5: Main Dashboard Statistics 📊

### Frontend Requirements
- Dashboard redesign with real statistics
- Chart components (recharts/victory)
- Role-specific views (professor, admin, super admin)
- Time-range selector
- Recent activity feed
- Module analytics page

### Backend Requirements

#### New Endpoints (6-8 endpoints)

```python
# Professor Dashboard
GET /api/v2/dashboard/professor
Response: {
    courses_count: int
    modules_count: int
    students_count: int
    files_count: int
    recent_interactions_7d: int
    top_modules: List[ModuleUsageStats]
    active_tokens_count: int
}

# Admin Professor Dashboard (extends professor)
GET /api/v2/dashboard/admin-professor
Response: {
    ...professor_stats,
    professors_in_university: int
    university_ai_usage: int
}

# Super Admin Dashboard
GET /api/v2/dashboard/super-admin
Response: {
    ...existing_stats,
    total_students: int
    total_modules: int
    total_files: int
    ai_usage_system_wide: int
    storage_usage_mb: float
}

# Module Analytics
GET /api/v2/dashboard/module/{id}/analytics?time_range=7d
Response: {
    total_interactions: int
    unique_students: int
    time_series: List[{date, count}]
    common_topics: List[str]
}
```

#### Key Queries
```python
# Uses existing tables: Modules, Courses, Files, Logs, Students, Professors
# No schema changes needed

# Example: Top modules by usage
SELECT
    m.Id, m.Name,
    COUNT(l.Id) as interaction_count,
    COUNT(DISTINCT l.StudentId) as unique_students
FROM Modules m
LEFT JOIN Logs l ON m.Id = l.ModuleId
WHERE l.CreatedAt >= DATEADD(day, -7, GETUTCDATE())
GROUP BY m.Id, m.Name
ORDER BY interaction_count DESC
```

#### Performance Considerations
- Add indexes on `Logs.CreatedAt`, `Logs.ModuleId`, `Logs.StudentId`
- Consider caching for expensive aggregations
- Implement pagination for large datasets

**Effort**: 12-16 hours
**Complexity**: Medium
**Risk**: Medium (query performance)
**Breaking Changes**: None

---

## TODO 6: Multi-Model AI Configuration 🤖

### Frontend Requirements
- AI configuration panel in module form
- Provider selector (OpenAI, Anthropic, Azure OpenAI)
- Model dropdown (dynamic based on provider)
- Advanced settings: temperature, max tokens, top-p, etc.
- Model info display in module details

### Backend Requirements

#### Database Changes
```sql
ALTER TABLE [dbo].[Modules]
ADD
    [AiProvider] NVARCHAR(50) NULL DEFAULT 'openai',
    [AiModel] NVARCHAR(100) NULL DEFAULT 'gpt-4o-mini',
    [Temperature] FLOAT NULL DEFAULT 0.7,
    [MaxTokens] INT NULL DEFAULT 1000,
    [TopP] FLOAT NULL DEFAULT 1.0,
    [FrequencyPenalty] FLOAT NULL DEFAULT 0.0,
    [PresencePenalty] FLOAT NULL DEFAULT 0.0,

CONSTRAINT [CK_Modules_AiProvider]
    CHECK ([AiProvider] IN ('openai', 'anthropic', 'azure_openai', 'google', 'cohere')),
CONSTRAINT [CK_Modules_Temperature]
    CHECK ([Temperature] >= 0.0 AND [Temperature] <= 2.0);
```

#### New Architecture

**Provider Abstraction**
```python
# app/services/ai_providers/base.py
class AIProviderBase(ABC):
    @abstractmethod
    async def generate_completion(...) -> str: pass

# app/services/ai_providers/openai_provider.py
class OpenAIProvider(AIProviderBase):
    # Existing OpenAI implementation

# app/services/ai_providers/anthropic_provider.py
class AnthropicProvider(AIProviderBase):
    # New Anthropic Claude implementation

# app/services/ai_providers/factory.py
class AIProviderFactory:
    def create_provider(provider_name, api_key): ...
```

**Enhanced AI Service**
```python
class MultiModelAIService:
    def __init__(self, module: Module):
        self.provider = AIProviderFactory.create_provider(
            provider_name=module.ai_provider,
            api_key=self._get_api_key(module.ai_provider)
        )
        self.temperature = module.temperature
        self.max_tokens = module.max_tokens
        # ... other settings

    async def answer_question(self, question: str) -> str:
        return await self.provider.generate_completion(
            messages=self._prepare_messages(question),
            temperature=self.temperature,
            max_tokens=self.max_tokens
        )
```

#### Configuration
```python
# app/core/config.py
class Settings(BaseSettings):
    OPENAI_API_KEY: str
    ANTHROPIC_API_KEY: Optional[str] = None
    AZURE_OPENAI_API_KEY: Optional[str] = None
    AZURE_OPENAI_ENDPOINT: Optional[str] = None
```

#### Dependencies
```txt
anthropic>=0.45.0
# Optional:
# azure-openai>=1.0.0
# google-generativeai>=0.3.0
# cohere>=4.0.0
```

#### Migration Strategy
1. Add database columns with defaults
2. All existing modules default to OpenAI/gpt-4o-mini
3. Gradual rollout with feature flag
4. Test each provider thoroughly

**Effort**: 20-30 hours
**Complexity**: High
**Risk**: High (breaking changes, testing required)
**Breaking Changes**: Potentially (requires migration)

---

## TODO 7: Super Admin UI Pages 👑

### Frontend Requirements
- System health dashboard
- Audit logs viewer (filterable table)
- Recent activity feed
- Performance monitoring charts
- Storage analytics
- Active users monitor
- Error logs viewer

### Backend Requirements

#### Database Changes
```sql
-- Audit Logs Table
CREATE TABLE [dbo].[AuditLogs] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [UserId] INT NOT NULL,
    [UserType] NVARCHAR(20) NOT NULL,
    [Action] NVARCHAR(100) NOT NULL,
    [EntityType] NVARCHAR(50) NOT NULL,
    [EntityId] INT NULL,
    [Changes] NVARCHAR(MAX) NULL, -- JSON
    [IpAddress] NVARCHAR(45) NULL,
    [UserAgent] NVARCHAR(500) NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id])
);

CREATE INDEX [IX_AuditLogs_CreatedAt] ON [AuditLogs] ([CreatedAt] DESC);
CREATE INDEX [IX_AuditLogs_UserId_UserType] ON [AuditLogs] ([UserId], [UserType]);
```

#### New Endpoints (8-10 endpoints)

```python
# System Health
GET /api/v2/super-admin/health/detailed
Response: {
    timestamp: datetime
    status: "healthy" | "degraded" | "unhealthy"
    components: {
        database: {status, response_time_ms}
        blob_storage: {status}
        openai: {status}
        system: {cpu_percent, memory_percent, disk_percent}
    }
}

# Audit Logs
GET /api/v2/super-admin/audit-logs?page=1&size=50&action=CREATE
Response: PaginatedResponse<AuditLog>

# Recent Activity
GET /api/v2/super-admin/activity/recent?limit=50
Response: List<ActivityItem>

# Performance Metrics
GET /api/v2/super-admin/performance/api?time_range=24h
Response: {
    endpoints: List<{path, avg_response_time, request_count, error_rate}>
}

# Storage Analytics
GET /api/v2/super-admin/storage/analytics
Response: {
    total_mb: float
    by_university: List<{university_id, name, storage_mb}>
    by_file_type: Dict[str, float]
}

# Active Users
GET /api/v2/super-admin/users/active?time_range=24h
Response: {
    total_active: int
    by_role: Dict[str, int]
    sessions: List<UserSession>
}

# Error Logs
GET /api/v2/super-admin/errors/recent?limit=50&severity=ERROR
Response: List<ErrorLog>
```

#### Audit Logging Middleware
```python
class AuditMiddleware(BaseHTTPMiddleware):
    """Auto-log all admin actions"""

    async def dispatch(self, request, call_next):
        if self._should_audit(request):
            # Log action to AuditLogs table
            await self._create_audit_entry(...)
        return await call_next(request)
```

#### Health Check Implementation
- Test DB connectivity
- Test Azure Blob Storage
- Test OpenAI API
- Monitor system resources (psutil)

#### Dependencies
```txt
psutil>=5.9.0  # System monitoring
aiohttp>=3.9.0  # Health checks
```

#### Performance Considerations
- Audit logs will grow rapidly
- Implement log rotation (archive after 90 days)
- Index critical columns
- Make audit middleware optional/configurable

**Effort**: 16-24 hours
**Complexity**: Medium-High
**Risk**: Medium (log growth)
**Breaking Changes**: None

---

## Summary Table

| TODO | Backend Effort | Frontend Effort | Total | Complexity | Risk | Breaking |
|------|---------------|-----------------|-------|------------|------|----------|
| 3. Dark Mode | 4-6h | 4-6h | 8-12h | Low | Low | No |
| 5. Dashboard | 12-16h | 8-12h | 20-28h | Medium | Medium | No |
| 6. Multi-Model | 20-30h | 8-12h | 28-42h | High | High | Yes |
| 7. Super Admin | 16-24h | 12-16h | 28-40h | Medium-High | Medium | No |
| **TOTAL** | **52-76h** | **32-46h** | **84-122h** | - | - | - |

---

## Recommended Implementation Order

1. **TODO 3: Dark Mode** (8-12h)
   - Low risk, immediate value
   - No dependencies

2. **TODO 5: Dashboard Statistics** (20-28h)
   - High value for users
   - Uses existing data
   - No schema changes

3. **TODO 7: Super Admin UI** (28-40h)
   - Essential for production monitoring
   - Independent feature

4. **TODO 6: Multi-Model AI** (28-42h)
   - Most complex
   - Requires extensive testing
   - Breaking changes
   - Do last with proper migration

---

## Key Technical Decisions

### Dark Mode
**Decision**: Add columns to each user table (not shared preferences table)
**Rationale**: Simpler, faster queries, no JOINs needed

### Dashboard Stats
**Decision**: Real-time queries with caching layer
**Rationale**: More flexible than materialized views, easier to maintain

### Multi-Model AI
**Decision**: Use adapter pattern with provider factory
**Rationale**: Clean architecture, easy to add new providers, testable

### Super Admin
**Decision**: Separate AuditLogs table with archiving strategy
**Rationale**: Audit trail is critical, but needs management to prevent growth issues

---

## Migration Scripts Location

All SQL migration scripts should be created in:
```
tutoria-api/migrations/
├── 001_add_theme_preferences.sql
├── 002_add_dashboard_indexes.sql
├── 003_add_ai_config_to_modules.sql
├── 004_add_audit_logs.sql
└── README.md
```

---

## Testing Requirements

### Unit Tests
- Theme preference CRUD
- Dashboard query functions
- AI provider adapters
- Audit log creation

### Integration Tests
- End-to-end dashboard data flow
- Multi-provider AI responses
- Health check accuracy

### Load Tests
- Dashboard with large datasets
- Multiple AI providers simultaneously
- Audit log write performance

---

## Dependencies to Install

```txt
# TODO 6: Multi-Model AI
anthropic>=0.45.0

# TODO 7: Super Admin
psutil>=5.9.0
aiohttp>=3.9.0

# Optional (for future providers)
# azure-openai>=1.0.0
# google-generativeai>=0.3.0
# cohere>=4.0.0
```

---

## Environment Variables Needed

```env
# Existing
OPENAI_API_KEY=sk-proj-...

# TODO 6: Multi-Model AI
ANTHROPIC_API_KEY=sk-ant-...
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=https://...

# TODO 7: System Monitoring (optional)
ENABLE_AUDIT_LOGGING=true
AUDIT_LOG_RETENTION_DAYS=90
```

---

## Conclusion

All four TODOs are implementable without major architectural rewrites. The tutoria-api codebase is well-structured with clear separation of concerns.

**Highest Priority**: TODO 3 (Dark Mode) and TODO 5 (Dashboard Stats) provide immediate user value with manageable complexity.

**Highest Risk**: TODO 6 (Multi-Model AI) requires careful planning, testing, and migration strategy. Should be implemented last.

**Production Ready**: TODO 7 (Super Admin monitoring) is essential before production deployment but can be done incrementally.
