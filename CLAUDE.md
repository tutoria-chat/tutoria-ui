# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` (runs on http://localhost:3000)
- **Build for production**: `npm run build`
- **Start production server**: `npm start`
- **Lint code**: `npm run lint`

## Architecture Overview

This is a Next.js 15 application with App Router using TypeScript and Tailwind CSS. The project follows modern React patterns with shadcn/ui components.

### Key Dependencies
- **UI Framework**: Next.js 15 with App Router and React 19
- **Styling**: Tailwind CSS 4 with shadcn/ui components (New York style)
- **Component Library**: Radix UI primitives with custom styling
- **State Management**: Built-in React hooks with custom utilities
- **API Client**: Custom fetch wrapper with timeout and error handling

### Project Structure
- `app/` - Next.js App Router pages and layouts
- `components/ui/` - Reusable shadcn/ui components 
- `components/examples/` - Demo/example components showing usage patterns
- `lib/` - Utility functions, API client, constants, and custom hooks
- `public/` - Static assets

### Component Patterns
- Uses shadcn/ui configuration with "New York" style and CSS variables
- Components follow Radix UI + class-variance-authority pattern
- Utility-first CSS with Tailwind and custom utility functions
- Path aliases configured: `@/` maps to project root

### Loading States
**IMPORTANT**: Always use the custom `LoadingSpinner` component for loading states in pages.

```typescript
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// For full-page loading states
if (loading) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoadingSpinner size="xl" className="text-primary" />
    </div>
  );
}
```

Available sizes: `sm`, `md`, `lg`, `xl`
- Use `xl` for full-page loading states (no text)
- Use smaller sizes for inline loading indicators

### API Architecture
- Custom `ApiClient` class in `lib/api.ts` with timeout, error handling, and standard HTTP methods
- Environment-based API URL configuration (`NEXT_PUBLIC_API_URL`)
- Custom hooks for data fetching (`useFetch`, `usePost`) in `lib/hooks.ts`
- Centralized constants and endpoints in `lib/constants.ts`

### Utility Functions
The `lib/utils.ts` file contains essential utilities including:
- `cn()` for class name merging with clsx and tailwind-merge
- Date formatting, text manipulation, and validation helpers
- Debounce utility and ID generation functions

### TypeScript Configuration
- Strict mode enabled with modern ES2017 target
- Path mapping configured for `@/*` imports
- Next.js plugin integration for optimal bundling

## CRITICAL Rules

### TypeScript Type Safety
**ALWAYS check types before making changes**:
1. Read backend schema files in `D:\Users\Steve\code\tutoria-api\app\schemas\` to verify data structures
2. Ensure frontend TypeScript interfaces match backend Pydantic schemas exactly
3. Never assume field names or types - always verify with backend code first
4. Run TypeScript compiler (`npx tsc --noEmit`) to check for errors before committing

### User Management Endpoints
**CRITICAL**: The application uses a unified Users table. For ANY user-related operations (professors, super_admins, students):

1. **Use the `/auth/users/` endpoints** - NOT legacy endpoints like `/super-admin/super-admins/` or `/professors/`
2. **Available user endpoints**:
   - `POST /auth/users/create` - Create any user type (professor, super_admin, student)
   - `GET /auth/users/` - Get all users (filtered by type if needed)
   - `GET /auth/users/{id}` - Get specific user
   - `PUT /auth/users/{id}` - Update user basic info (first_name, last_name, email, username)
   - `PATCH /auth/users/{id}/activate` - Activate user
   - `PATCH /auth/users/{id}/deactivate` - Deactivate user
   - `DELETE /auth/users/{id}` - Permanently delete user
   - `POST /auth/reset-password-request` - Generate password reset link (requires username and user_type)

3. **Legacy endpoints are deprecated** - only use for backward compatibility when necessary

### Development Server
**NEVER start the dev server without asking permission first**:
- User may already have it running in another terminal
- Running multiple dev servers causes conflicts and instability
- Always ask: "Would you like me to start the dev server?" before running `npm run dev`

## Security TODOs

### Authentication & Authorization
1. **TODO: Implement client_id/secret authentication for login endpoint**
   - Currently `/auth/login` is public but should have proper client authentication
   - Add client_id/client_secret validation to prevent unauthorized access
   - Consider implementing OAuth 2.0 client credentials flow

2. **TODO: Review and secure public registration endpoints**
   - `/auth/student/register` - Currently public, may need additional security (CAPTCHA, email verification)
   - `/auth/professor/register` - Currently public, should require admin approval or invitation token
   - Consider implementing invitation-only registration for professors
   - Add rate limiting to prevent abuse

## Internationalization (i18n)

This application uses `next-intl` for internationalization with support for English, Spanish, and Portuguese (Brazil).

### Translation Files
- Located in `i18n/messages/` directory
- `en.json` - English translations
- `es.json` - Spanish translations
- `pt-br.json` - Portuguese (Brazil) translations

### Translation Rules
**CRITICAL**: Always use translations for user-facing text. Never hardcode labels, messages, or descriptions.

1. **Always create translations** for any user-facing text:
   - Button labels, form labels, descriptions, messages, errors, etc.
   - Add the translation key to ALL three language files (en.json, es.json, pt-br.json)
   - Use the `useTranslations` hook: `const t = useTranslations('namespace')`

2. **Fix hardcoded text** when you encounter it:
   - Replace hardcoded strings with translation keys
   - Only exception: If there's a comment saying "Hardcoded for X reason"
   - Example: Change `"Loading..."` to `{t('loading')}`

3. **Translation key structure**:
   - Organize by page/feature namespace (e.g., `courses`, `modules`, `common`)
   - Use descriptive, hierarchical keys (e.g., `courses.form.nameLabel`, `common.pagination.rowsPerPage`)
   - Common translations go in `common` namespace for reuse

4. **Adding new translations**:
   ```typescript
   // In component
   import { useTranslations } from 'next-intl';
   const t = useTranslations('courses');

   // Use translation
   <span>{t('createButton')}</span>
   ```

5. **Translation with variables**:
   ```typescript
   // In JSON
   "showing": "Showing {from} to {to} of {total} records"

   // In code
   {t('pagination.showing', { from: 1, to: 10, total: 100 })}
   ```