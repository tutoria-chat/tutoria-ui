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
- 10MB max file size
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

## 👨‍💻 Developer Guide

### Getting Started with Development

<details>
<summary><b>🔧 Setting Up Your Environment</b></summary>

```bash
# Clone the repository
git clone <repository-url>
cd tutoria-ui

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Edit .env.local with your API URL
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Start development server
npm run dev

# Open http://localhost:3000
```

**Pro Tips**:
- Use `npm run dev` for hot reload during development
- TypeScript errors will show in terminal and browser
- API calls will fail until backend is running on port 8000

</details>

<details>
<summary><b>🎨 Adding a New Feature (Complete Walkthrough)</b></summary>

Let's say you want to add a "Assignments" feature. Here's the complete process:

#### 1. Create the Page

```typescript
// app/(dashboard)/assignments/page.tsx
'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/auth/auth-provider';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { useFetch } from '@/lib/hooks';
import type { Assignment } from '@/lib/types';

export default function AssignmentsPage() {
  const { user } = useAuth();
  const t = useTranslations('assignments');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Fetch data with custom hook
  const { data, loading, error } = useFetch<Assignment[]>(
    `/assignments/?page=${page}&limit=${limit}`
  );

  const columns = [
    { key: 'title', label: t('columns.title'), sortable: true },
    { key: 'due_date', label: t('columns.dueDate'), sortable: true },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button asChild>
            <Link href="/assignments/create">
              <Plus className="mr-2 h-4 w-4" />
              {t('createButton')}
            </Link>
          </Button>
        }
      />

      <DataTable
        data={data || []}
        columns={columns}
        loading={loading}
        pagination={{ page, limit, total: data?.length || 0, onPageChange: setPage, onLimitChange: setLimit }}
      />
    </div>
  );
}
```

#### 2. Add to Sidebar

```typescript
// components/layout/sidebar.tsx
const navigationItems: NavigationItem[] = [
  // ... existing items
  {
    label: t('assignments'),
    href: '/assignments',
    icon: FileText,
    roles: ['professor'],
  },
];
```

#### 3. Add Translations

```json
// i18n/messages/en.json
{
  "assignments": {
    "title": "Assignments",
    "description": "Manage student assignments",
    "createButton": "Create Assignment",
    "columns": {
      "title": "Title",
      "dueDate": "Due Date"
    }
  }
}
```

#### 4. Add Type Definition

```typescript
// lib/types.ts
export interface Assignment {
  id: number;
  title: string;
  description: string;
  due_date: string;
  course_id: number;
  created_at: string;
}
```

#### 5. Add API Methods

```typescript
// lib/api.ts
class ApiClient {
  // ... existing methods

  async getAssignments(params?: { course_id?: number }) {
    return this.get<Assignment[]>('/assignments/', params);
  }

  async createAssignment(data: Partial<Assignment>) {
    return this.post<Assignment>('/assignments/', data);
  }
}
```

#### 6. Test It!

```bash
# Visit http://localhost:3000/assignments
# Should see your new page with data from API
```

</details>

<details>
<summary><b>🔐 Working with Authentication & Permissions</b></summary>

#### Using Auth Context

```typescript
import { useAuth } from '@/components/auth/auth-provider';

function MyComponent() {
  const { user, login, logout, loading } = useAuth();

  // Check if user is logged in
  if (!user) return <LoginPrompt />;

  // Check user role
  if (user.role === 'super_admin') {
    return <AdminDashboard />;
  }

  // Check if admin professor
  if (user.role === 'professor' && user.is_admin) {
    return <AdminProfessorDashboard />;
  }

  // Regular professor
  return <ProfessorDashboard />;
}
```

#### Using Role Guards

```typescript
import { AdminProfessorOnly, ProfessorOnly, SuperAdminOnly } from '@/components/auth/role-guard';

// Render only for super admins
<SuperAdminOnly>
  <Button>Delete University</Button>
</SuperAdminOnly>

// Render only for admin professors
<AdminProfessorOnly>
  <Button>Create Course</Button>
</AdminProfessorOnly>

// Render for all professors
<ProfessorOnly>
  <Button>Create Module</Button>
</ProfessorOnly>

// Render with fallback
<AdminProfessorOnly fallback={<p>Access Denied</p>}>
  <SecretContent />
</AdminProfessorOnly>
```

#### Custom Permission Checks

```typescript
import { canCreateCourse, canEditModule } from '@/lib/permissions';

const canCreate = canCreateCourse(user);
const canEdit = canEditModule(user, moduleId);

if (canCreate) {
  // Show create button
}
```

</details>

<details>
<summary><b>📡 Making API Calls</b></summary>

#### Using Custom Hooks (Recommended)

```typescript
import { useFetch, usePost } from '@/lib/hooks';

// GET request with automatic loading state
function CoursesList() {
  const { data, loading, error, refetch } = useFetch<Course[]>('/courses/');

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {data?.map(course => <CourseCard key={course.id} course={course} />)}
      <Button onClick={refetch}>Refresh</Button>
    </div>
  );
}

// POST request with form handling
function CreateCourseForm() {
  const { post, loading, error } = usePost('/courses/');

  const handleSubmit = async (formData: CourseFormData) => {
    const result = await post(formData);
    if (result) {
      toast.success('Course created!');
      router.push('/courses');
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

#### Using API Client Directly

```typescript
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

// GET with params
const courses = await apiClient.getCourses({ university_id: 1 });

// POST
const newCourse = await apiClient.post('/courses/', {
  name: 'Introduction to AI',
  description: 'Learn AI basics',
});

// PUT
const updated = await apiClient.put(`/courses/${id}`, updatedData);

// DELETE
await apiClient.delete(`/courses/${id}`);

// File upload
const formData = new FormData();
formData.append('file', file);
await apiClient.uploadFile(formData, moduleId, fileName);

// Error handling
try {
  await apiClient.post('/courses/', data);
} catch (error) {
  if (error instanceof Error) {
    toast.error(error.message);
  }
}
```

#### Adding New API Endpoints

```typescript
// lib/api.ts
class ApiClient {
  // Add your new method
  async getAssignments(courseId: number) {
    return this.get<Assignment[]>(`/courses/${courseId}/assignments/`);
  }

  async submitAssignment(assignmentId: number, data: FormData) {
    return this.post(`/assignments/${assignmentId}/submit/`, data);
  }
}
```

</details>

<details>
<summary><b>🎨 Using shadcn/ui Components</b></summary>

#### Installing New Components

```bash
# Add a new shadcn component
npx shadcn@latest add [component-name]

# Examples:
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add tabs
```

#### Common Patterns

**Dialog/Modal**:
```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create New Course</DialogTitle>
    </DialogHeader>
    <CourseForm onSuccess={() => setOpen(false)} />
  </DialogContent>
</Dialog>
```

**Dropdown Menu**:
```typescript
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost">Actions</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => handleEdit()}>Edit</DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleDelete()}>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Tabs**:
```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="modules">Modules</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Course overview content</TabsContent>
  <TabsContent value="modules">Modules list</TabsContent>
</Tabs>
```

</details>

<details>
<summary><b>🌍 Adding Translations</b></summary>

#### Translation Workflow

1. **Add to all language files**:

```json
// i18n/messages/en.json
{
  "myFeature": {
    "title": "My Feature",
    "description": "This is my feature",
    "button": "Click me"
  }
}

// i18n/messages/es.json
{
  "myFeature": {
    "title": "Mi Característica",
    "description": "Esta es mi característica",
    "button": "Haz clic en mí"
  }
}

// i18n/messages/pt-br.json
{
  "myFeature": {
    "title": "Minha Funcionalidade",
    "description": "Esta é minha funcionalidade",
    "button": "Clique em mim"
  }
}
```

2. **Use in component**:

```typescript
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('myFeature');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      <Button>{t('button')}</Button>
    </div>
  );
}
```

3. **With variables**:

```json
// Translation
{
  "welcome": "Welcome, {name}!"
}
```

```typescript
// Usage
{t('welcome', { name: user.first_name })}
```

**IMPORTANT**: Never hardcode user-facing text. Always use translations!

</details>

<details>
<summary><b>🎯 Common Development Tasks</b></summary>

#### Add a New Table Column

```typescript
const columns: TableColumn<Course>[] = [
  // ... existing columns
  {
    key: 'new_field',
    label: t('columns.newField'),
    sortable: true,
    render: (value, row) => (
      <Badge variant="secondary">{value}</Badge>
    )
  }
];
```

#### Add Form Validation

```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
});

const form = useForm({
  resolver: zodResolver(formSchema),
  defaultValues: { name: '', email: '' }
});
```

#### Add Loading State

```typescript
import { LoadingSpinner } from '@/components/ui/loading-spinner';

if (loading) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoadingSpinner size="xl" className="text-primary" />
    </div>
  );
}
```

#### Add Toast Notification

```typescript
import { toast } from 'sonner';

// Success
toast.success('Course created successfully!');

// Error
toast.error('Failed to create course');

// Info
toast.info('Processing your request...');

// With action
toast.success('Course created!', {
  action: {
    label: 'View',
    onClick: () => router.push(`/courses/${id}`)
  }
});
```

#### Navigate Programmatically

```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();

// Navigate to page
router.push('/courses');

// Navigate with query params
router.push(`/courses/${courseId}/modules?tab=files`);

// Replace (no history entry)
router.replace('/dashboard');

// Go back
router.back();
```

</details>

<details>
<summary><b>🐛 Debugging Tips</b></summary>

#### Check API Responses

```typescript
// Add console logs to API client
const { data, loading, error } = useFetch('/courses/');

console.log('Data:', data);
console.log('Loading:', loading);
console.log('Error:', error);
```

#### Check User State

```typescript
const { user } = useAuth();
console.log('Current user:', user);
console.log('User role:', user?.role);
console.log('Is admin?', user?.is_admin);
```

#### Check Browser Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Check request/response for API calls

#### TypeScript Errors

```bash
# Check all TypeScript errors
npx tsc --noEmit

# Watch mode
npx tsc --noEmit --watch
```

#### Common Issues

**"Cannot read property of undefined"**:
```typescript
// Bad
const name = user.first_name;

// Good
const name = user?.first_name;
const name = user?.first_name ?? 'Guest';
```

**"Headers already sent"**:
- Usually caused by multiple redirects or setting headers after response
- Check for duplicate `redirect()` calls

**"Module not found"**:
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

</details>

<details>
<summary><b>⚡ Performance Tips</b></summary>

#### Optimize Images

```typescript
import Image from 'next/image';

// Use Next.js Image component
<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={100}
  priority // For above-the-fold images
/>
```

#### Lazy Load Components

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <LoadingSpinner />
});
```

#### Memoize Expensive Calculations

```typescript
import { useMemo } from 'react';

const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

#### Debounce Search

```typescript
import { debounce } from '@/lib/utils';

const debouncedSearch = useMemo(
  () => debounce((term: string) => {
    // Search logic
  }, 300),
  []
);
```

</details>

### 🧪 Testing

```bash
# Run linter
npm run lint

# Type check
npx tsc --noEmit

# Build (catches production issues)
npm run build
```

### 📦 Project Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

### 🔍 Useful Utilities

```typescript
// Class name merging
import { cn } from '@/lib/utils';
const className = cn('base-class', isActive && 'active-class', 'another-class');

// Date formatting
import { formatDate, formatDateShort } from '@/lib/utils';
formatDate('2024-01-15T14:30:00');      // "15 de Jan de 2024, 14:30"
formatDateShort('2024-01-15T14:30:00'); // "15/01/2024"

// Debounce
import { debounce } from '@/lib/utils';
const debouncedFn = debounce(() => console.log('Called!'), 300);

// Generate ID
import { generateId } from '@/lib/utils';
const uniqueId = generateId(); // "abc123xyz"
```

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Tutoria API](../tutoria-api/API_DOCUMENTATION.md)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Run linter: `npm run lint`
4. Test build: `npm run build`
5. Commit: `git commit -m "Add my feature"`
6. Push: `git push origin feature/my-feature`
7. Create Pull Request

---

**Built with ❤️ using Next.js 15 + TypeScript + Tailwind CSS**
