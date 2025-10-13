# Tutoria UI - Future Improvements TODO List

## Priority Items (Mandatory for next work session)

### 1. **Logo Integration** 🎨 ✅ COMPLETED
- [x] Use logo in opening/login screen
- [x] Use logo in sidebar
- [x] Use logo in header/navbar
- [x] Ensure proper sizing and positioning
- [x] Use Next.js Image component for optimal performance
- [ ] Update favicon if needed (optional - can use custom icon)

### 2. **Color Palette Update** 🎨 ✅ COMPLETED
- [x] Apply provided color palette throughout the application
- [x] Update CSS variables with new brand colors
  - Primary: #5e17eb (Purple)
  - Secondary/Accent: #5ce1e6 (Cyan)
  - Background: #ffffff (Pure White)
  - Muted: #f4f4f4 (Light Gray)
- [x] Update both light and dark mode themes
- [x] Ensure consistent theming across all pages

---

## High Priority (Ranked by Customer Value + Implementation Ease)

### 3. **Dark Mode Setup** 🌙
- [ ] Implement dark mode toggle in UI
- [ ] **Backend**: Add user profile field to store theme preference
- [ ] Persist user's theme choice in database
- [ ] Apply theme consistently across all components
- [ ] Test all UI components in both light and dark modes

**Estimated Effort**: Medium (requires backend changes)
**Customer Value**: High (modern UX expectation)

### 4. **Internationalization (i18n)** 🌍
- [ ] Set up i18n framework (next-intl or similar)
- [ ] Extract all Portuguese strings to translation files
- [ ] Create English translations
- [ ] Add language switcher to UI
- [ ] Consider additional languages (Spanish, etc.)

**Estimated Effort**: High (lots of string extraction)
**Customer Value**: Very High (expands market reach)

### 5. **Main Dashboard Statistics** 📊
- [ ] Design dashboard layout with real statistics
- [ ] **Backend**: Create/update endpoints for dashboard stats
- [ ] Display real-time metrics (modules, students, usage, etc.)
- [ ] Add charts/visualizations for better insights
- [ ] Make it role-specific (different stats for professors vs admins)

**Estimated Effort**: Medium (requires backend updates)
**Customer Value**: High (provides actionable insights)

### 6. **Multi-Model Configuration for Modules** 🤖
- [ ] UI for selecting AI model per module (OpenAI, Anthropic, etc.)
- [ ] **Backend**: Support multiple AI providers in module configuration
- [ ] **Backend**: Implement adapter pattern for different AI APIs
- [ ] Add model-specific settings (temperature, max tokens, etc.)
- [ ] Display model info to users

**Estimated Effort**: High (significant backend architecture)
**Customer Value**: Medium-High (flexibility for power users)

### 7. **Super Admin UI Pages** 👑
- [ ] Complete all super admin pages from side menu
- [ ] **Backend**: Verify/create missing admin endpoints
- [ ] Global search improvements
- [ ] System health monitoring
- [ ] User management enhancements
- [ ] Audit logs viewer

**Estimated Effort**: Medium-High (depends on backend needs)
**Customer Value**: Medium (admin tool improvements)

### 8. **Notifications System** 🔔 🚧 IN PROGRESS
- [ ] Implement notifications bell in top-right corner (currently commented out in header)
- [ ] **Backend**: Create notifications API
- [ ] Real-time updates (WebSocket or polling)
- [ ] Notification preferences per user
- [ ] Mark as read functionality
- [ ] Badge showing unread count
- [ ] Dropdown showing recent notifications

**Estimated Effort**: High (real-time infrastructure needed)
**Customer Value**: Medium-High (improves engagement)

**Note**: Notifications bell is currently commented out in `components/layout/header.tsx` until backend API is ready.

### 9. **CI/CD for Frontend** ⚙️ ✅ COMPLETED
- [x] Set up GitHub Actions workflow
- [x] Add TypeScript type checking step
- [x] Add build verification step
- [x] Add linting step
- [ ] Consider adding E2E tests (future)
- [ ] Add deployment automation (future)

**Estimated Effort**: Low-Medium (DevOps setup)
**Customer Value**: Low (internal quality improvement)

### 10. **Remove TypeScript `any` Types** 🔧
- [ ] Audit codebase for all `:any` usages
- [ ] Replace with proper type definitions
- [ ] Use `unknown` where appropriate and add type guards
- [ ] Improve type safety throughout the application
- [ ] Consider enabling `noImplicitAny` in tsconfig if not already enabled

**Estimated Effort**: Medium (requires careful typing)
**Customer Value**: Low (internal code quality improvement)

### 11. **Auth Token Refresh Implementation** 🔐 ⚡ CRITICAL ✅ COMPLETED
- [x] **Implement Refresh Token Flow**
  - [x] Add refresh token endpoint integration
  - [x] Auto-refresh on 401 errors
  - [x] Handle refresh token errors gracefully
- [x] **Token Expiration Handling**
  - [x] Detect token expiration (401 errors)
  - [x] Automatically attempt refresh
  - [x] Logout if refresh fails
- [x] **Interceptor/Middleware**
  - [x] Add response interceptor for 401 handling (in api.ts)
  - [x] Prevent concurrent refresh calls with promise queue
- [x] **Session Management**
  - [x] Persist refresh token securely
  - [x] Clear tokens on logout
  - [x] Handle multiple tabs/windows
- [x] **User Experience**
  - [x] Silent token refresh (no user interruption)
  - [x] Redirect to login if manual login required
  - [x] Retry original request after refresh

**Estimated Effort**: 6-8 hours frontend ✅ COMPLETED
**Customer Value**: CRITICAL (prevents unexpected logouts)
**Complexity**: Medium
**Breaking Changes**: None
**Backend**: `/auth/refresh` endpoint exists and works ✅

### 12. **Module Token Management Improvements** 🔑 ⚡ SUPER HIGH PRIORITY ✅ COMPLETED
- [x] **Convert to Modal Pattern**: Replace token pages with modals
  - [x] Create token modal
  - [x] Edit token modal
  - [x] View token details modal
- [x] **Add Token Actions**
  - [x] View/edit existing tokens (currently only create/list)
  - [x] Copy token to clipboard
  - [ ] Regenerate token (backend endpoint needed)
  - [x] Revoke token
  - [ ] QR code for widget access (future enhancement)
- [x] **Token List Improvements**
  - [x] Show token status (active/expired/revoked)
  - [x] Show usage statistics (when available from backend)
  - [x] Filter by module/status (client-side filtering)
  - [x] Search tokens
- [x] **Refactor Pages**
  - [x] Remove `/tokens/create` page
  - [x] Remove `/tokens/[id]/edit` page
  - [x] Keep `/tokens` as main page with modal actions
  - [x] Reduce routing complexity

**Estimated Effort**: 8-12 hours frontend ✅ COMPLETED
**Customer Value**: Medium (better UX, less navigation)
**Complexity**: Low-Medium
**Breaking Changes**: None (routing cleanup)

---

## Implementation Summary

### Effort Estimates (Hours)

| TODO | Frontend | Backend | Total | Complexity | Risk |
|------|----------|---------|-------|------------|------|
| ~~1. Logo~~ | ~~2~~ | ~~0~~ | ~~2~~ | ~~Low~~ | ~~None~~ |
| ~~2. Colors~~ | ~~2~~ | ~~0~~ | ~~2~~ | ~~Low~~ | ~~None~~ |
| 3. Dark Mode | 4-6 | 4-6 | 8-12 | Low | Low |
| 4. i18n | 20-30 | 0 | 20-30 | Medium | Low |
| 5. Dashboard Stats | 8-12 | 12-16 | 20-28 | Medium | Medium |
| 6. Multi-Model AI | 8-12 | 20-30 | 28-42 | High | High |
| 7. Super Admin UI | 12-16 | 16-24 | 28-40 | Medium-High | Medium |
| 8. Notifications | 8-12 | 12-18 | 20-30 | High | Medium |
| ~~9. CI/CD~~ | ~~2~~ | ~~0~~ | ~~2~~ | ~~Low~~ | ~~None~~ |
| 10. Remove :any | 8-12 | 0 | 8-12 | Low | Low |
| 11. Auth Refresh | 6-8 | 0 | 6-8 | Medium | Medium |
| 12. Token Modals | 8-12 | 0 | 8-12 | Low-Medium | Low |
| **TOTAL** | **84-130** | **64-94** | **148-224** | - | - |

### Prioritization Matrix

Based on **Customer Value** + **Ease of Implementation**:

| Priority | Item | Customer Value | Implementation Ease | Effort | Score |
|----------|------|----------------|---------------------|--------|-------|
| ~~1~~ | ~~**Logo Integration**~~ | ~~Medium~~ | ~~Very High~~ | ~~2h~~ | ~~⭐⭐⭐⭐⭐~~ |
| ~~2~~ | ~~**Color Palette**~~ | ~~Medium~~ | ~~Very High~~ | ~~2h~~ | ~~⭐⭐⭐⭐⭐~~ |
| 3 | **Dark Mode** | High | High | 8-12h | ⭐⭐⭐⭐⭐ |
| 4 | **i18n** | Very High | Medium | 20-30h | ⭐⭐⭐⭐ |
| ~~5~~ | ~~**CI/CD**~~ | ~~Low~~ | ~~Very High~~ | ~~2h~~ | ~~⭐⭐⭐⭐~~ |
| 6 | **Auth Refresh** ⚡ | **CRITICAL** | Medium | 6-8h | ⭐⭐⭐⭐⭐ |
| 7 | **Dashboard Stats** | High | Medium | 20-28h | ⭐⭐⭐⭐ |
| 8 | **Token Modals** ⚡ | **SUPER HIGH** | High | 8-12h | ⭐⭐⭐⭐⭐ |
| 9 | **Remove :any** | Low | High | 8-12h | ⭐⭐⭐ |
| 10 | **Super Admin UI** | Medium | Medium | 28-40h | ⭐⭐⭐ |
| 11 | **Notifications** | Medium-High | Low | 20-30h | ⭐⭐ |
| 12 | **Multi-Model AI** | Medium-High | Very Low | 28-42h | ⭐⭐ |

### Recommended Implementation Order

**Phase 1: Quick Wins** (Completed ✅)
- ✅ Logo Integration
- ✅ Color Palette
- ✅ CI/CD Pipeline

**Phase 2: Foundation & UX Improvements** (30-44 hours)
1. **Auth Token Refresh** (6-8h) ⚡ CRITICAL PRIORITY
2. **Token Management Modals** (8-12h) ⚡ SUPER HIGH PRIORITY
3. Dark Mode Setup (8-12h)
4. Remove TypeScript :any (8-12h)

**Phase 3: High-Value Features** (40-58 hours)
4. Dashboard Statistics (20-28h)
5. i18n Implementation (20-30h)

**Phase 4: Advanced Features** (56-82 hours)
6. Super Admin UI Pages (28-40h)
7. Notifications System (20-30h)
8. Multi-Model AI Config (28-42h)

---

## Phase 5: Widget Chat Enhancements ⭐ HIGH PRIORITY

### 13. **Widget Chat Message Tracking & Conversation History** 💬 🔥 NEW
- [ ] **Backend: Message Storage System**
  - [ ] Create ChatMessage/Conversation database table
  - [ ] Store all /widget/chat messages (question + response + metadata)
  - [ ] Track student_id, module_id, timestamp, tokens used
  - [ ] Add session/conversation grouping
- [ ] **Backend: Conversation Context API**
  - [ ] Modify /widget/chat to load previous messages
  - [ ] Pass conversation history to OpenAI Assistants API
  - [ ] Implement conversation thread management
  - [ ] Set reasonable context window (last 10-20 messages)
- [ ] **Backend: Analytics Endpoints**
  - [ ] GET /widget/analytics/frequent-questions endpoint
  - [ ] Aggregate and rank most common questions
  - [ ] Filter by module, time period, etc.
  - [ ] Export capabilities for professors
- [ ] **AI Enhancement: Contextual Responses**
  - [ ] AI can reference previous conversation
  - [ ] Generate personalized study suggestions
  - [ ] Detect struggling topics and recommend focus areas
  - [ ] Suggest action items based on conversation flow
- [ ] **Frontend: Analytics Dashboard**
  - [ ] Professor view of frequent questions per module
  - [ ] Visualization of topic distribution
  - [ ] Identify knowledge gaps from student questions
  - [ ] Export conversation logs (anonymized)

**Database Schema Needed (PascalCase)**:
```
ChatConversations table:
- Id (Primary Key)
- StudentId (String, nullable - can be anonymous)
- ModuleId (Foreign Key)
- ModuleTokenId (Foreign Key)
- StartedAt (DateTime)
- LastMessageAt (DateTime)
- MessageCount (Integer)
- IsActive (Boolean)

ChatMessages table:
- Id (Primary Key)
- ConversationId (Foreign Key)
- Role (String: 'user' or 'assistant')
- Content (Text)
- TokensUsed (Integer, nullable)
- CreatedAt (DateTime)
- Metadata (JSON, nullable)
```

**Estimated Effort**: 16-24 hours (8-12h backend + 6-8h frontend + 2-4h testing)
**Customer Value**: VERY HIGH (improves learning outcomes + provides insights)
**Complexity**: Medium-High
**Breaking Changes**: None (additive feature)
**Priority**: HIGH - Directly improves AI tutor quality

**Benefits**:
- 📊 Analytics on student struggles and common questions
- 💡 AI provides better, contextual responses
- 🎯 Personalized study recommendations
- 📈 Identify course content gaps
- 🔍 Track learning patterns

---

## Phase 6: Student Management & Identification

### 14. **Student Import & Identity Management** 👥 🎓 NEW
- [ ] **Backend: Student Import System**
  - [ ] Create Students database table (if not exists)
  - [ ] POST /students/import-excel endpoint
  - [ ] Parse Excel file (name, email, student_id, enrollment_number, etc.)
  - [ ] Bulk insert/update students
  - [ ] Associate students with courses/modules
  - [ ] Validate and deduplicate entries
- [ ] **Backend: Student Lookup API**
  - [ ] GET /students/lookup/{student_id} endpoint
  - [ ] Quick lookup by student_id or email
  - [ ] Return student info for widget authentication
- [ ] **Widget Integration**
  - [ ] Widget accepts student_id parameter
  - [ ] Pass student_id to /widget/chat endpoint
  - [ ] Link conversations to actual students (not anonymous)
  - [ ] Show "Logged in as [Student Name]" in widget
- [ ] **Frontend: Student Management UI**
  - [ ] Professor page: Upload Excel of students
  - [ ] Download Excel template
  - [ ] View imported students per course/module
  - [ ] Manual student add/edit/remove
  - [ ] Bulk operations (delete, export)
- [ ] **Excel Import Features**
  - [ ] Support .xlsx and .csv formats
  - [ ] Required columns: student_id, name, email
  - [ ] Optional columns: enrollment_number, phone, course_id
  - [ ] Validation preview before import
  - [ ] Error reporting (which rows failed, why)
  - [ ] Import history/logs

**Database Schema Needed (PascalCase)**:
```
Students table (if not exists):
- Id (Primary Key)
- StudentId (String, unique) - External student ID from university
- EnrollmentNumber (String, nullable)
- FirstName (String)
- LastName (String)
- Email (String, unique)
- PhoneNumber (String, nullable)
- UniversityId (Foreign Key)
- CreatedAt (DateTime)
- UpdatedAt (DateTime)
- IsActive (Boolean, default true)

StudentCourseEnrollments table:
- Id (Primary Key)
- StudentId (Foreign Key to Students)
- CourseId (Foreign Key to Courses)
- EnrolledAt (DateTime)
- Status (String: 'active', 'completed', 'dropped')

StudentImportLogs table:
- Id (Primary Key)
- UploadedBy (Foreign Key to Professors)
- FileName (String)
- TotalRows (Integer)
- SuccessfulRows (Integer)
- FailedRows (Integer)
- ErrorDetails (JSON)
- UploadedAt (DateTime)
```

**Excel Template Format**:
```
| StudentId | FirstName | LastName | Email              | EnrollmentNumber | CourseId (optional) |
|-----------|-----------|----------|--------------------|------------------|---------------------|
| S123456   | João      | Silva    | joao@email.com     | 2024001          | 1                   |
| S123457   | Maria     | Santos   | maria@email.com    | 2024002          | 1                   |
```

**Widget URL with Student ID**:
```
https://widget.tutoria.com/?module_token={TOKEN}&student_id=S123456
```

**Estimated Effort**: 12-18 hours (8-12h backend + 4-6h frontend)
**Customer Value**: VERY HIGH (enables personalized learning + real analytics)
**Complexity**: Medium
**Breaking Changes**: None (additive feature)
**Priority**: HIGH - Required for conversation tracking (#13)

**Benefits**:
- 🎯 Track individual student progress
- 📊 Real analytics (not anonymous)
- 💡 Personalized AI responses per student
- 📈 Identify struggling students early
- 🔍 Full conversation history per student
- 📧 Enable email notifications to students
- 🎓 Grade/assessment integration (future)

**Implementation Flow**:
1. Professor uploads Excel with student list
2. System validates and imports students
3. Students are associated with courses
4. Module tokens are shared with students (via LMS or email)
5. Widget URL includes student_id: `?module_token=XYZ&student_id=S123456`
6. Widget chat sends student_id with every message
7. Backend stores conversations linked to real students
8. Professors see analytics per student

**Security Considerations**:
- Validate student_id belongs to module's course
- Rate limit imports (prevent spam)
- Sanitize Excel input (prevent injection)
- GDPR compliance for student data
- Allow students to opt-out of tracking
- Anonymize data in exports (professor-facing)

---

---

## Phase 7: System Overview Dashboard

### 15. **System Overview Page** 📊 🔥 HIGH PRIORITY
- [ ] **Implement System Overview Dashboard (/admin route)**
  - [ ] Backend: Create GET /super-admin/stats endpoint with real data
    - Total universities count
    - Total courses count
    - Total modules count
    - Total professors count
    - Total students count
    - Total files count
    - Total module tokens count
    - Storage used (MB/GB)
    - API calls today/week/month
  - [ ] Backend: System health monitoring endpoints
    - Database status & response time
    - API server status & metrics
    - Storage status & usage percentage
    - AI service status & performance
  - [ ] Frontend: Re-enable System Overview page (currently commented out)
    - Display real-time system statistics
    - Show system health indicators
    - Recent activity feed
    - Quick action buttons
  - [ ] Frontend: Re-enable sidebar link (currently commented in components/layout/sidebar.tsx)

**Current Status**: Page and sidebar link are commented out until backend endpoints are ready

**Files to update**:
- `app/(dashboard)/admin/page.tsx` - System Overview page (has TODO comment)
- `components/layout/sidebar.tsx` - Sidebar navigation (has TODO comment on lines 71-77)

**Estimated Effort**: 12-18 hours (8-12h backend + 4-6h frontend)
**Customer Value**: HIGH (provides system insights for super admins)
**Complexity**: Medium
**Priority**: HIGH - Essential admin dashboard

---

## Phase 8: Super Admin Page Improvements

### 16. **Super Admin Statistics & Activity Tracking** 📊 NEW
- [ ] **Implement Real-Time Statistics**
  - [ ] Active Today: Calculate from last_login_at (last 24h)
  - [ ] Recent Actions: Track from audit logs/activity table
  - [ ] Security Status: Monitor system health indicators
  - [ ] Uncomment stats cards in super-admins page (lines 213-250)
- [ ] **Implement Activity Tracking**
  - [ ] Backend: Create AdminActivityLog table
  - [ ] Track super admin actions (create user, update settings, etc.)
  - [ ] API endpoint: GET /api/super-admins/activity
  - [ ] Frontend: Display recent activity (currently commented lines 290-326)
- [ ] **Backend Requirements**
  - [ ] Add activity logging middleware
  - [ ] Create activity aggregation endpoints
  - [ ] Implement real-time activity counters

**Database Schema Needed**:
```sql
AdminActivityLog table:
- Id (PK)
- SuperAdminId (FK)
- ActionType (created_user, updated_settings, etc.)
- EntityType (user, course, module, etc.)
- EntityId (nullable)
- Description (text)
- CreatedAt (DateTime)
```

**Estimated Effort**: 8-12 hours (6-8h backend + 2-4h frontend)
**Customer Value**: Medium (admin insights)
**Complexity**: Medium
**Priority**: LOW - Nice-to-have for admin dashboard

---

## Notes

- Items 1-2 are **mandatory** for the next work session
- Items marked with "**Backend**" require API changes
- Consider breaking larger items into smaller incremental updates
- Re-evaluate priorities based on customer feedback and business needs
