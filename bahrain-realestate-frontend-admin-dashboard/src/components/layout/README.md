# Admin Dashboard Layout Components

This folder contains the layout components for the Bahrain Property Hub admin dashboard.

## Components

### AdminLayout
The main layout wrapper that combines sidebar, topbar, and content area.

**Props:**
- `children: React.ReactNode` - The page content to render
- `pageTitle?: string` - The title to display in the topbar (default: "Dashboard")

**Usage:**
```tsx
import { AdminLayout } from '@/components/layout';

export default function MyAdminPage() {
  return (
    <AdminLayout pageTitle="Companies">
      <div>
        {/* Your page content */}
      </div>
    </AdminLayout>
  );
}
```

### Sidebar
A collapsible sidebar with navigation menu.

**Features:**
- Fixed left sidebar with company logo
- Navigation menu with icons (Dashboard, Companies, Properties, Complaints, Settings)
- Active item highlighting
- Hover effects
- Mobile responsive (collapsible)
- Desktop collapse functionality

### Topbar
Header bar with page title and admin controls.

**Features:**
- Page title display
- Mobile menu toggle button
- Search bar (hidden on mobile)
- Notifications with badge
- Admin avatar with dropdown menu
- Profile, Settings, and Logout options

## Design Features

- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **TailwindCSS**: All styling done with TailwindCSS utility classes
- **Modern UI**: Clean, professional design similar to WordPress/Salla/Zid admin panels
- **Accessibility**: Proper ARIA labels and keyboard navigation support
- **TypeScript**: Fully typed components with proper interfaces

## File Structure

```
src/components/layout/
├── AdminLayout.tsx    # Main layout component
├── Sidebar.tsx       # Left navigation sidebar
├── Topbar.tsx        # Top header bar
└── index.ts          # Barrel exports
```

## Menu Items

The sidebar includes the following menu items:
- **Dashboard** (`/admin`) - Overview and statistics
- **Companies** (`/admin/companies`) - Real estate company management
- **Properties** (`/admin/properties`) - Property listings management
- **Complaints** (`/admin/complaints`) - Customer complaint handling
- **Settings** (`/admin/settings`) - System configuration

## Customization

### Adding New Menu Items
Edit the `menuItems` array in `Sidebar.tsx`:

```tsx
const menuItems = [
  // ... existing items
  {
    id: 'new-item',
    label: 'New Item',
    icon: <YourIconComponent />,
    href: '/admin/new-item'
  }
];
```

### Styling Customization
All components use TailwindCSS classes. You can customize:
- Colors by changing color classes (e.g., `bg-blue-600` to `bg-green-600`)
- Spacing using padding/margin classes
- Typography with font and text size classes
- Shadows and borders for depth and separation

### Logo Customization
Update the logo section in `Sidebar.tsx`:

```tsx
<div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
  <span className="text-white font-bold text-sm">BPH</span>
</div>
```

## Integration Notes

- The layout uses Next.js `usePathname()` for active menu highlighting
- Mobile menu state is managed internally with React hooks
- All components are client components (`'use client'`)
- Server Actions are properly named with `Action` suffix for Next.js compatibility
