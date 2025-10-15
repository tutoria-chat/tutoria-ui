# Translation Gaps Analysis Report

**Date:** 2025-10-15
**Source of Truth:** `en.json` (1,364 total keys)
**Analysis:** Comparison of translation completeness across Spanish and Portuguese (Brazil) locales

---

## Executive Summary

| Language | File | Missing Keys | Completion Rate |
|----------|------|--------------|-----------------|
| Spanish | `es.json` | 342 keys | 74.9% |
| Portuguese (BR) | `pt-br.json` | 390 keys | 71.4% |

---

## Missing Keys by Namespace

### Spanish (es.json) - 342 Missing Keys

| Namespace | Missing Keys | Notes |
|-----------|--------------|-------|
| **tutorials** | 154 keys | Entire tutorials namespace added in recent PR |
| **regularProfessor** | 146 keys | Complete regularProfessor namespace missing |
| **common** | 42 keys | Password setup, profile settings, navigation, search, and tables sections |

### Portuguese (pt-br.json) - 390 Missing Keys

| Namespace | Missing Keys | Notes |
|-----------|--------------|-------|
| **tutorials** | 202 keys | Partial translations exist, but many subsections missing |
| **regularProfessor** | 146 keys | Complete regularProfessor namespace missing |
| **common** | 42 keys | Password setup, profile settings, navigation, search, and tables sections |

---

## Detailed Breakdown

### 1. Common Namespace (42 keys missing in BOTH es.json and pt-br.json)

#### Password Setup Section (5 keys)
- `common.passwordSetup`
- `common.passwordSetup.title`
- `common.passwordSetup.description`
- `common.passwordSetup.steps`
- `common.passwordSetup.note`

#### Profile Settings Section (12 keys)
- `common.profileSettings`
- `common.profileSettings.title`
- `common.profileSettings.description`
- `common.profileSettings.theme`
- `common.profileSettings.theme.title`
- `common.profileSettings.theme.description`
- `common.profileSettings.theme.options`
- `common.profileSettings.language`
- `common.profileSettings.language.title`
- `common.profileSettings.language.description`
- `common.profileSettings.language.options`
- `common.profileSettings.language.note`

#### Navigation Section (13 keys)
- `common.navigation`
- `common.navigation.title`
- `common.navigation.sidebar`
- `common.navigation.sidebar.title`
- `common.navigation.sidebar.description`
- `common.navigation.sidebar.common`
- `common.navigation.sidebar.roleSpecific`
- `common.navigation.breadcrumbs`
- `common.navigation.breadcrumbs.title`
- `common.navigation.breadcrumbs.description`
- `common.navigation.quickLinks`
- `common.navigation.quickLinks.title`
- `common.navigation.quickLinks.description`

#### Search Section (4 keys)
- `common.search`
- `common.search.title`
- `common.search.description`
- `common.search.tips`

#### Tables Section (8 keys)
- `common.tables`
- `common.tables.title`
- `common.tables.features`
- `common.tables.features.search`
- `common.tables.features.sorting`
- `common.tables.features.pagination`
- `common.tables.features.rowsPerPage`
- `common.tables.features.actions`

---

### 2. Tutorials Namespace

#### Spanish (es.json) - 154 Missing Keys

**Complete Missing Sections:**
- `tutorials.superAdmin` - Entire super admin tutorial section (68 keys)
  - Overview, Getting Started, Universities, Super Admins, Professors, Global Search, Module Tokens, Best Practices
- `tutorials.adminProfessor.viewing/editing/deleting` - Admin professor management (10 keys)
- `tutorials.modules` - Module tutorials (24 keys)
  - Creating, AI Tutor, Uploading Files, Preparing Module
- `tutorials.tokens` - Token management tutorials (14 keys)
- `tutorials.professors` - Professor tutorials (11 keys)
- `tutorials.workflow` - Workflow documentation (4 keys)
- `tutorials.bestPractices` - Best practices section (3 keys)

#### Portuguese (pt-br.json) - 202 Missing Keys

**Partial Coverage Issues:**
- `tutorials.superAdmin.gettingStarted` - Missing getting started subsection (8 keys)
- `tutorials.superAdmin.superAdmins` - Missing entire super admins section (11 keys)
- `tutorials.superAdmin.professors` - Missing professors section (11 keys)
- `tutorials.superAdmin.globalSearch` - Missing global search section (11 keys)
- `tutorials.superAdmin.moduleTokens` - Missing module tokens section (7 keys)
- `tutorials.superAdmin.bestPractices` - Missing best practices (3 keys)
- `tutorials.adminProfessor.workflow` - Missing workflow section (5 keys)
- `tutorials.adminProfessor.creatingCourses` - Missing creating courses tutorial (9 keys)
- `tutorials.adminProfessor.creatingModules` - Missing creating modules tutorial (9 keys)
- `tutorials.adminProfessor.uploadingFiles` - Missing uploading files tutorial (9 keys)
- `tutorials.adminProfessor.creatingTokens` - Missing creating tokens tutorial (11 keys)
- `tutorials.adminProfessor.preparingModules` - Missing preparing modules tutorial (16 keys)
- `tutorials.adminProfessor.regularProfessor` - Missing regular professor section (4 keys)
- Plus all the same sections missing in Spanish for viewing/editing/deleting, modules, tokens, professors, workflow, and bestPractices

---

### 3. Regular Professor Namespace (146 keys missing in BOTH)

**Complete Namespace Missing - All Sections:**
- Root level (3 keys): title, subtitle, overview
- Overview (5 keys)
- Getting Started (9 keys)
- Courses (10 keys)
  - Viewing, Limitations
- Modules (65 keys)
  - Creating, AI Tutor (templates, custom prompts, improving, language)
  - Files (uploading, best practices, managing)
  - Preparing (requirements, steps, updating)
  - Editing, Deleting
- Tokens (26 keys)
  - Creating, Permissions (chat, file access)
  - Using, Managing (viewing, editing, revoking)
  - Best Practices
- Workflow (4 keys)
- Troubleshooting (24 keys)
  - Module Preparation, File Uploads, Token Issues, Permissions
- Tips (2 keys)

---

## Recommendations

### Priority 1: High Impact (User-Facing Features)
1. **regularProfessor namespace** - Complete namespace used by regular professors (146 keys)
2. **tutorials.adminProfessor** - Critical tutorials for admin professors
3. **common.passwordSetup** - User onboarding experience

### Priority 2: Medium Impact (Documentation & Help)
1. **tutorials.superAdmin** - Super admin documentation
2. **tutorials.modules** - Module creation guidance
3. **tutorials.tokens** - Token management help
4. **common.navigation** - Navigation help text

### Priority 3: Lower Impact (Supplementary Content)
1. **tutorials.professors** - Professor management documentation
2. **tutorials.workflow** - Workflow documentation
3. **tutorials.bestPractices** - Best practices guidance
4. **common.search** and **common.tables** - UI help text

---

## Action Items

### For Spanish Translations (es.json)
- [ ] Add complete `regularProfessor` namespace (146 keys)
- [ ] Add complete `tutorials` namespace (154 keys)
  - Focus on: superAdmin, modules, tokens, professors sections
- [ ] Add `common` missing keys (42 keys)
  - Focus on: passwordSetup, navigation, profileSettings

### For Portuguese Translations (pt-br.json)
- [ ] Add complete `regularProfessor` namespace (146 keys)
- [ ] Complete `tutorials` namespace (202 keys)
  - Many subsections partially translated - need completion
  - Focus on: adminProfessor workflows, superAdmin sections
- [ ] Add `common` missing keys (42 keys)
  - Same as Spanish

---

## Files Reference

- **Source of Truth:** `D:\Users\Steve\Code\tutoria-ui\i18n\messages\en.json`
- **Spanish Translations:** `D:\Users\Steve\Code\tutoria-ui\i18n\messages\es.json`
- **Portuguese Translations:** `D:\Users\Steve\Code\tutoria-ui\i18n\messages\pt-br.json`
- **Detailed Report:** `D:\Users\Steve\Code\tutoria-ui\missing-translations-report.json`

---

## Notes

1. The `tutorials` namespace was added in a recent PR (commit: ed36adb - "tutorials"), which introduced the majority of missing keys
2. The `regularProfessor` namespace is completely absent from both translation files
3. Portuguese (pt-br.json) has better baseline coverage but is missing more tutorial subsections than Spanish
4. Spanish (es.json) has less baseline coverage but is missing fewer tutorial subsections (though completely missing major sections)
5. Both files are missing identical `common` namespace keys, suggesting these were added after the last translation sync
