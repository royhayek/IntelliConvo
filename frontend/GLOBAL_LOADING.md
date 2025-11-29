# GlobalLoading Component

A beautiful, theme-aware loading component with multiple animation styles.

## Features

✨ **Three Animation Styles**:
- **Pulse**: Waves emanating from the logo (default)
- **Spin**: Rotating rings around the logo
- **Ripple**: Expanding circles effect

🎨 **Theme Support**:
- Automatically respects light/dark theme
- Uses `next-themes` for theme detection
- Smooth color transitions

📱 **Two Variants**:
- **Page**: Full-screen centered loading
- **Inline**: Compact loading for sections

🎯 **Customizable**:
- Custom messages
- Custom logo component
- Animation selection

## Installation

The component is already installed at `components/ui/global-loading.tsx`

## Usage

### Basic Usage (Full Page)

```tsx
import { GlobalLoading } from "@/components/ui/global-loading";

export default function MyPage() {
  const { isLoading } = useMyData();

  if (isLoading) {
    return <GlobalLoading />;
  }

  return <div>Your content</div>;
}
```

### With Custom Message

```tsx
<GlobalLoading message="Loading your workspace..." />
```

### Different Animations

```tsx
// Pulse animation (default)
<GlobalLoading animation="pulse" />

// Spinning rings
<GlobalLoading animation="spin" />

// Ripple effect
<GlobalLoading animation="ripple" />
```

### Inline Variant

```tsx
// For sections within a page
<GlobalLoading
  variant="inline"
  message="Loading conversations..."
  animation="spin"
/>
```

### Custom Logo

```tsx
import { Sparkles } from "lucide-react";

<GlobalLoading
  logo={<Sparkles className="h-12 w-12 text-indigo-600" />}
  message="Generating magic..."
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"page" \| "inline"` | `"page"` | Layout style |
| `message` | `string` | `"Loading..."` | Message below animation |
| `animation` | `"pulse" \| "spin" \| "ripple"` | `"pulse"` | Animation style |
| `logo` | `React.ReactNode` | `<MessageSquare />` | Custom logo component |

## Animation Styles

### Pulse (Default)
```tsx
<GlobalLoading animation="pulse" />
```
- Waves emanate from center
- 3 pulsing circles
- Smooth, calming effect
- Best for: General loading, authentication

### Spin
```tsx
<GlobalLoading animation="spin" />
```
- Two counter-rotating rings
- Continuous motion
- Dynamic feel
- Best for: Data processing, API calls

### Ripple
```tsx
<GlobalLoading animation="ripple" />
```
- Expanding circles
- Water ripple effect
- Elegant motion
- Best for: Smooth transitions, uploads

## Theme Colors

The component automatically adapts colors based on theme:

**Light Theme**:
- Primary: `indigo-600`
- Secondary: `purple-600`
- Background: `gray-50` to `gray-100` gradient

**Dark Theme**:
- Primary: `indigo-400`
- Secondary: `purple-500`
- Background: `gray-900` to `gray-800` gradient

## Migration from AuthLoading

The old `AuthLoading` component now uses `GlobalLoading` internally. You can:

### Keep Using AuthLoading (Backward Compatible)
```tsx
import { AuthLoading } from "@/components/auth/auth-loading";

<AuthLoading message="Loading..." />
```

### Or Migrate to GlobalLoading
```tsx
// Before
<AuthLoading message="Loading..." />

// After
<GlobalLoading message="Loading..." animation="pulse" />
```

## Complete Examples

### Dashboard Loading

```tsx
"use client";

import { GlobalLoading } from "@/components/ui/global-loading";
import { useGetSites } from "@/lib/api/generated/queries/sites/sites";

export default function DashboardPage() {
  const { data: sites, isLoading } = useGetSites();

  if (isLoading) {
    return <GlobalLoading message="Loading your dashboard..." />;
  }

  return <div>{/* Dashboard content */}</div>;
}
```

### Section Loading (Inline)

```tsx
function ConversationsList() {
  const { data, isLoading } = useConversations();

  if (isLoading) {
    return (
      <GlobalLoading
        variant="inline"
        message="Loading conversations..."
        animation="spin"
      />
    );
  }

  return <div>{/* Conversations list */}</div>;
}
```

### Custom Branding

```tsx
import { GlobalLoading } from "@/components/ui/global-loading";
import { Zap } from "lucide-react";

function CustomLoading() {
  return (
    <GlobalLoading
      logo={
        <div className="relative">
          <Zap className="h-12 w-12 text-yellow-500 fill-yellow-500" />
        </div>
      }
      message="Powering up..."
      animation="ripple"
    />
  );
}
```

### Multiple States

```tsx
function DataPage() {
  const [loadingState, setLoadingState] = useState<'initial' | 'processing' | 'finalizing'>('initial');

  const messages = {
    initial: 'Loading data...',
    processing: 'Processing records...',
    finalizing: 'Finalizing...',
  };

  const animations: Record<string, 'pulse' | 'spin' | 'ripple'> = {
    initial: 'pulse',
    processing: 'spin',
    finalizing: 'ripple',
  };

  return (
    <GlobalLoading
      message={messages[loadingState]}
      animation={animations[loadingState]}
    />
  );
}
```

## Styling

The component uses Tailwind CSS and respects your theme configuration.

### Custom Styling Example

If you need custom colors, you can pass a custom logo with your own classes:

```tsx
<GlobalLoading
  logo={
    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
      <span className="text-2xl">🚀</span>
    </div>
  }
  message="Launching..."
/>
```

## Performance

- Uses CSS animations (GPU accelerated)
- No JavaScript animation loops
- Minimal re-renders
- Optimized for React 18+

## Accessibility

- Provides visual feedback for loading states
- Animated elements use `will-change` for performance
- Messages are readable by screen readers
- Respects `prefers-reduced-motion` (can be enhanced)

## Best Practices

### ✅ Do:
```tsx
// Use meaningful messages
<GlobalLoading message="Analyzing your data..." />

// Choose appropriate animations
<GlobalLoading animation="spin" /> // For processing
<GlobalLoading animation="ripple" /> // For uploads

// Use inline variant in sections
<GlobalLoading variant="inline" />
```

### ❌ Don't:
```tsx
// Avoid generic messages when you can be specific
<GlobalLoading message="Please wait..." />

// Don't nest loading components
<GlobalLoading>
  <GlobalLoading /> {/* ❌ */}
</GlobalLoading>
```

## Browser Support

- Modern browsers with CSS animations support
- Fallbacks for older browsers (static display)
- Works with SSR (Next.js)

## Future Enhancements

Potential improvements:
- [ ] More animation styles (bounce, fade, slide)
- [ ] Progress indicator option
- [ ] Skeleton screen integration
- [ ] Sound effects (optional)
- [ ] Custom duration control
- [ ] Stagger animation for multiple items

---

**Last Updated**: 2025-11-26
**Version**: 1.0
**Status**: ✅ Production Ready
