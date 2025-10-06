# Tutoria UI - Educational Platform Management System

A Next.js 15 educational platform with role-based access control for universities, courses, modules, and AI tutoring.

## 🚀 Quick Start

```bash
npm install
cp .env.example .env.local  # Configure NEXT_PUBLIC_API_URL
npm run dev                  # Visit http://localhost:3000
```

## 🛠 Tech Stack

- **Framework**: Next.js 15.4.6 (App Router) + TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York style)
- **Backend**: Python FastAPI with JWT authentication
- **Storage**: Azure Blob Storage for files

## 🔐 Role-Based Access Control

### User Roles

```typescript
type UserRole = 'super_admin' | 'professor' | 'student';
```

#### 1. Super Admin (`super_admin`)
- **Global access** to all universities
- Create/manage universities, courses, professors, students
- System-wide analytics

#### 2. Professor (`professor`) - Two Subtypes

**Admin Professor** (`role: 'professor'`, `is_admin: true`)
- **University-scoped** access
- Create/edit/delete **courses** in their university
- Manage **professors** in their university
- Full module/file/token management

**Regular Professor** (`role: 'professor'`, `is_admin: false`)
- **Course-scoped** access (only assigned courses)
- Create/edit/delete **modules** in assigned courses only
- Manage files/tokens for their modules

#### 3. Student (`student`)
- View courses, modules, files
- Interact with AI tutor

### Permission Checks

```typescript
// Check if admin professor
if (user?.role === 'professor' && user?.is_admin === true) {
  // Can create courses
}

// Check if regular professor
if (user?.role === 'professor' && user?.is_admin === false) {
  // Can only create modules in assigned courses
}
```

### Role Guard Components

```typescript
// Admin Professors only
<AdminProfessorOnly>
  <Button>Create Course</Button>
</AdminProfessorOnly>

// All Professors
<ProfessorOnly>
  <Button>Create Module</Button>
</ProfessorOnly>
```

## 🏗 Architecture

### Data Hierarchy

```
Universities
    ├── Professors (Admin & Regular)
    ├── Courses
    │   ├── Professor Assignments (Many-to-Many)
    │   └── Modules
    │       ├── Files (Azure Blob)
    │       └── Access Tokens
    └── Students
```

### Course Assignment System

**Regular professors** can only work with **assigned courses**:

1. **API Filtering**: `/courses` endpoint returns only assigned courses for regular professors
2. **UI**: Module forms show only available courses from API
3. **Validation**: Server validates permissions on all operations

### Multi-Tenant Isolation

- All data filtered by `university_id`
- API enforces university boundaries
- UI components use conditional rendering

## 📁 Project Structure

```
tutoria-ui/
├── app/(dashboard)/         # All protected pages
│   ├── courses/            # Course CRUD (admin profs only)
│   ├── modules/            # Module CRUD (all profs, filtered)
│   ├── professors/         # Professor management
│   ├── students/           # Student management
│   ├── tokens/             # Module access tokens
│   └── universities/       # University management
├── components/
│   ├── auth/               # Auth provider & role guards
│   ├── forms/              # Reusable form components
│   ├── layout/             # Sidebar, header, etc.
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── api.ts              # API client with timeout
│   ├── auth.ts             # Auth utilities
│   ├── hooks.ts            # useFetch, usePost
│   ├── permissions.ts      # Permission checking
│   ├── types.ts            # TypeScript types
│   └── utils.ts            # Utility functions
└── CLAUDE.md               # Claude Code instructions
```

## ✨ Features

### Error Handling
- Custom error pages (`error.tsx`, `not-found.tsx`)
- Toast notifications (Sonner)
- Safe router navigation
- Form validation

### File Upload
- Drag-and-drop interface
- 50MB max file size
- Type validation (PDF, DOC, DOCX, TXT, PPT, PPTX)
- Azure Blob Storage integration

### Navigation

**Super Admins**: Universities → Courses/Professors → Modules

**Admin Professors**: My University → Courses/Professors → Modules

**Regular Professors**: My University → Assigned Courses → Modules

## 🔑 Key Components

### API Client (`lib/api.ts`)

```typescript
import { apiClient } from '@/lib/api';

const courses = await apiClient.getCourses({ university_id: 1 });
await apiClient.post('/courses/', courseData);
await apiClient.uploadFile(formData, moduleId, fileName);
```

### Custom Hooks (`lib/hooks.ts`)

```typescript
const { data, loading, error, refetch } = useFetch<Course[]>('/courses/');
const { post, loading } = usePost('/courses/');
```

### Authentication

```typescript
import { useAuth } from '@/components/auth/auth-provider';

const { user, login, logout } = useAuth();
```

## 🌐 API Integration

### Environment Variables

```.env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### JWT Structure

```json
{
  "sub": "123",           # User ID
  "type": "professor",    # Role type
  "exp": 1234567890       # Expiration
}
```

**Note**: JWT contains minimal data. Fetch full user info from `/professors/me` after login.

## 💻 Development

### Adding a New Page

1. Create in `app/(dashboard)/your-page/page.tsx`
2. Add role guard
3. Update sidebar (`components/layout/sidebar.tsx`)
4. Add permissions (`lib/permissions.ts`)

### Creating Forms

1. Use shadcn/ui components
2. Add validation
3. Use `apiClient` for submissions
4. Add toast notifications

## 🚀 Deployment

```bash
npm run build
npm start
```

**Platforms**: Vercel, Azure Static Web Apps, AWS Amplify, Netlify

## 📊 Permission Matrix

| Resource | Super Admin | Admin Professor | Regular Professor |
|----------|-------------|-----------------|-------------------|
| Universities | Full CRUD | View Own | View Own |
| Courses | Full CRUD | CRUD (University) | View (Assigned) |
| Professors | Full CRUD | CRUD (University) | View Only |
| Modules | Full CRUD | CRUD (University) | CRUD (Assigned Courses) |
| Files | Full CRUD | CRUD (University) | CRUD (Their Modules) |
| Tokens | Full CRUD | CRUD (University) | CRUD (Their Modules) |
| Students | Full CRUD | CRUD (University) | View (Their Courses) |

## 🔧 Utility Functions

```typescript
// Class name merging
import { cn } from '@/lib/utils';
const className = cn('base', isActive && 'active');

// Date formatting
import { formatDate, formatDateShort } from '@/lib/utils';
formatDate(date);       // "15 de Jan de 2024, 14:30"
formatDateShort(date);  // "15/01/2024"
```

## 📝 Recent Changes

### Role System Refactor
- Updated `UserRole` type to match API (`super_admin`, `professor`, `student`)
- Professors differentiated by `is_admin` boolean field
- Removed deprecated `admin_professor` and `regular_professor` roles

### Course Permissions
- Only admin professors can create/edit/delete courses
- Regular professors have view-only access to courses

### Module Permissions
- All professors can create modules
- Regular professors restricted to assigned courses
- API handles course filtering automatically

### UI Improvements
- Hierarchical navigation (Universities → Courses → Modules)
- Drag-drop file upload with validation
- Toast notifications for all operations
- Safe router for error handling

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Tutoria API](../tutoria-api/API_DOCUMENTATION.md)

---

**Built with ❤️ using Next.js 15 + TypeScript + Tailwind CSS**
