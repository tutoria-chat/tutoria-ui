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

---

## Prioritization Matrix

Based on **Customer Value** + **Ease of Implementation**:

| Priority | Item | Customer Value | Implementation Ease | Score |
|----------|------|----------------|---------------------|-------|
| 1 | **Logo Integration** | Medium | Very High | ⭐⭐⭐⭐⭐ |
| 2 | **Color Palette** | Medium | Very High | ⭐⭐⭐⭐⭐ |
| 3 | **Dark Mode** | High | Medium | ⭐⭐⭐⭐ |
| 4 | **i18n** | Very High | Low | ⭐⭐⭐⭐ |
| 5 | **CI/CD** | Low | Medium-High | ⭐⭐⭐⭐ |
| 6 | **Dashboard Stats** | High | Medium | ⭐⭐⭐ |
| 7 | **Notifications** | Medium-High | Low | ⭐⭐⭐ |
| 8 | **Super Admin UI** | Medium | Medium | ⭐⭐ |
| 9 | **Multi-Model Config** | Medium-High | Very Low | ⭐⭐ |

---

## Notes

- Items 1-2 are **mandatory** for the next work session
- Items marked with "**Backend**" require API changes
- Consider breaking larger items into smaller incremental updates
- Re-evaluate priorities based on customer feedback and business needs
