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

### 8. **Notifications System** 🔔
- [ ] Implement notifications bell in top-right corner
- [ ] Fix header alignment (profile + notifications to right edge)
- [ ] **Backend**: Create notifications API
- [ ] Real-time updates (WebSocket or polling)
- [ ] Notification preferences per user
- [ ] Mark as read functionality

**Estimated Effort**: High (real-time infrastructure needed)
**Customer Value**: Medium-High (improves engagement)

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

### 11. **Auth Token Refresh Implementation** 🔐 ⚡ CRITICAL
- [ ] **Implement Refresh Token Flow**
  - Add refresh token endpoint integration
  - Auto-refresh before token expiration
  - Handle refresh token errors gracefully
- [ ] **Token Expiration Handling**
  - Detect token expiration (401 errors)
  - Automatically attempt refresh
  - Logout if refresh fails
- [ ] **Interceptor/Middleware**
  - Add request interceptor to check token expiry
  - Add response interceptor for 401 handling
  - Queue requests during token refresh
- [ ] **Session Management**
  - Persist refresh token securely
  - Clear tokens on logout
  - Handle multiple tabs/windows
- [ ] **User Experience**
  - Silent token refresh (no user interruption)
  - Show notification if manual login required
  - Prevent data loss during refresh

**Estimated Effort**: 6-8 hours frontend
**Customer Value**: CRITICAL (prevents unexpected logouts)
**Complexity**: Medium
**Breaking Changes**: None
**Backend**: Verify `/auth/refresh` endpoint exists and works

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

## Notes

- Items 1-2 are **mandatory** for the next work session
- Items marked with "**Backend**" require API changes
- Consider breaking larger items into smaller incremental updates
- Re-evaluate priorities based on customer feedback and business needs
