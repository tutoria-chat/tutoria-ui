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