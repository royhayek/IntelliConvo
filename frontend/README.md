# IntelliConvo Frontend

Next.js 14 admin dashboard for the IntelliConvo platform. Provides user interface for site management, widget configuration, billing, and platform administration.

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Components**: Radix UI
- **Styling**: Tailwind CSS
- **State Management**: Zustand (client), TanStack Query (server)
- **Forms**: React Hook Form + Zod
- **Real-time**: Socket.io Client
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Payments**: Stripe React

## Project Structure

```
frontend/
├── app/                      # Next.js App Router
│   ├── (auth)/               # Auth pages (login, signup, etc.)
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   └── callback/         # OAuth callback
│   ├── (dashboard)/          # Protected dashboard pages
│   │   ├── dashboard/        # Main dashboard
│   │   ├── sites/            # Site management
│   │   │   └── [siteId]/     # Individual site config
│   │   ├── account/          # User profile
│   │   └── billing/          # Subscription management
│   ├── (admin)/              # Admin-only pages
│   │   └── admin/
│   │       ├── users/
│   │       ├── sites/
│   │       ├── subscriptions/
│   │       ├── billing/
│   │       ├── conversations/
│   │       ├── messages/
│   │       ├── urls/
│   │       ├── files/
│   │       ├── embeddings/
│   │       ├── emails/
│   │       ├── sessions/
│   │       ├── audit/
│   │       ├── widgets/
│   │       └── settings/
│   ├── (marketing)/          # Public pages
│   │   ├── privacy/
│   │   └── terms/
│   ├── playground/           # Widget testing
│   └── layout.tsx            # Root layout
├── components/               # React components
│   ├── ui/                   # Base UI components (Radix-based)
│   ├── account/              # Account management
│   ├── admin/                # Admin-specific components
│   ├── auth/                 # Login/signup forms
│   ├── billing/              # Payment UI
│   ├── dashboard/            # Dashboard components
│   ├── form/                 # Reusable form fields
│   ├── layout/               # Navigation, sidebar
│   ├── marketing/            # Landing pages
│   ├── site/                 # Site configuration
│   ├── subscriptions/        # Plan selection
│   └── icons/                # Icon components
├── lib/                      # Core libraries
│   ├── api/                  # API client (Orval-generated)
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.ts        # Authentication
│   │   ├── useAdminSocket.ts # Admin real-time updates
│   │   ├── useSiteSocket.ts  # Site updates
│   │   └── useNotificationSocket.ts
│   ├── store.ts              # Zustand store
│   └── utils.ts              # Utilities
├── styles/                   # Global CSS
└── public/                   # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+
- Running backend server

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at http://localhost:3000.

### Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript type checking |
| `npm run generate:api` | Generate API client from backend |

## Pages

### Public Pages
- `/` - Landing page (if implemented)
- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/playground` - Widget preview/testing

### Authentication
- `/login` - User login
- `/signup` - User registration
- `/forgot-password` - Password reset request
- `/callback` - OAuth callback handler

### Dashboard (Protected)
- `/dashboard` - Overview with stats
- `/sites` - List user's sites
- `/sites/[siteId]` - Site configuration
  - General settings
  - URL selection and crawling
  - File uploads
  - Widget customization
  - Conversation starters
  - Active hosts
- `/account` - User profile
- `/billing` - Subscription management

### Admin Panel (Admin only)
- `/admin/users` - User management
- `/admin/sites` - All sites
- `/admin/subscriptions` - Subscription tracking
- `/admin/billing` - Payment records
- `/admin/conversations` - All conversations
- `/admin/messages` - Message analysis
- `/admin/urls` - URL management
- `/admin/files` - File uploads
- `/admin/embeddings` - Embedding status
- `/admin/emails` - Email delivery log
- `/admin/sessions` - Active sessions
- `/admin/audit` - Audit trail
- `/admin/widgets` - Widget configurations
- `/admin/settings` - Platform settings

## State Management

### Client State (Zustand)

```typescript
// lib/store.ts
interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  notifications: Notification[];
  // UI state
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
}
```

### Server State (TanStack Query)

API calls use TanStack Query for caching, refetching, and optimistic updates:

```typescript
// Example usage
const { data: sites, isLoading } = useQuery({
  queryKey: ['sites'],
  queryFn: () => api.sites.list(),
});
```

## API Client

The API client is auto-generated using Orval from the backend's OpenAPI spec:

```bash
# Regenerate API client after backend changes
npm run generate:api
```

Generated files are in `lib/api/`.

## Real-time Updates

Socket.io is used for real-time updates:

### Admin Socket (`useAdminSocket`)
- Platform-wide statistics
- User activity
- Crawl progress across all sites

### Site Socket (`useSiteSocket`)
- Crawl progress for specific site
- New conversations
- Message updates

### Notification Socket (`useNotificationSocket`)
- User notifications
- System alerts

## UI Components

Built on Radix UI primitives with Tailwind CSS styling:

- Alert Dialog
- Avatar
- Checkbox
- Dialog
- Dropdown Menu
- Hover Card
- Label
- Popover
- Progress
- Radio Group
- Scroll Area
- Select
- Separator
- Switch
- Tabs
- Toast

## Environment Variables

Create a `.env.local` file:

```bash
# API URL for client-side requests
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1

# Widget URL for preview
NEXT_PUBLIC_WIDGET_URL=http://localhost:8080
```

For production builds (Docker), these are passed as build arguments:

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_WIDGET_URL=https://cdn.yourdomain.com
```

## Authentication Flow

1. User submits credentials via login form
2. Backend validates and returns JWT access token + refresh token
3. Access token stored in memory (Zustand)
4. Refresh token stored in HTTP-only cookie
5. API client automatically refreshes token on 401 responses
6. OAuth flows redirect through `/callback` page

## Styling

### Tailwind CSS

Configuration in `tailwind.config.js`:
- Custom color palette
- Typography plugin
- Animation utilities

### Theming

Supports light/dark mode via `next-themes`:
- System preference detection
- User preference persistence
- CSS custom properties for colors

## Building for Production

```bash
# Build
npm run build

# Start production server
npm run start
```

The build output is in `.next/` directory.

## Type Checking

```bash
# Run TypeScript compiler
npm run type-check
```

Strict TypeScript configuration ensures type safety across the codebase.
