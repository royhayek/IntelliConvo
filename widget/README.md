# IntelliConvo Widget

A production-ready, accessible chat widget that integrates seamlessly with any website. Built with TypeScript, Socket.IO, and modern web standards.

## Features

- 🔌 **Easy Integration**: Single-script embed with customizable configuration
- 🎯 **Real-time Chat**: WebSocket-powered live conversation with AI
- 🔊 **Voice Support**: Built-in speech recognition and voice input
- ♿ **Accessibility**: WCAG 2.1 AA compliant with screen reader support
- 📱 **Responsive Design**: Mobile-first design with touch support
- 🌙 **Dark Mode**: Automatic theme detection and support
- 🛡️ **Error Handling**: Comprehensive error handling and recovery
- 🔄 **Auto-reconnect**: Intelligent connection management
- 🎨 **Customizable**: Themeable with custom CSS and configuration
- ⚡ **Optimized**: Code splitting and lazy loading for performance

## Quick Start

### 1. Setup Environment

```bash
# Install dependencies
npm install

# Configure environment variables (optional)
# Copy and edit the environment files:
cp .env.example .env.development
cp .env.example .env.production

# Edit .env.production with your production API URL
# WIDGET_API_URL=https://api.yourdomain.com
```

### 2. Build the Widget

```bash
# Development build with hot reload
npm run dev

# Production build (optimized and minified)
npm run build

# Build and preview production bundle
npm run preview
```

### 3. Basic Implementation

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <h1>Welcome to My Website</h1>

    <!-- Load the widget -->
    <script src="path/to/widget.js"></script>
    <script>
        // Initialize the widget
        intelliconvo('init', {
            siteId: 'your-site-id-here',
            apiUrl: 'https://your-api-endpoint.com'
        });
    </script>
</body>
</html>
```

## Configuration Options

```typescript
interface WidgetConfig {
    siteId: string;                    // Required: Your site identifier
    mode?: 'button' | 'widget';       // Widget display mode
    position?: 'bottom-right' |       // Button position (button mode only)
               'bottom-left' |
               'top-right' |
               'top-left';
    apiUrl?: string;                   // API endpoint URL
    theme?: 'light' | 'dark' | 'auto'; // Theme preference
    language?: string;                 // Language code (default: 'en')
    customStyles?: Partial<CSSStyleDeclaration>; // Custom styling

    // Event callbacks
    onMessage?: (message: Message) => void;
    onError?: (error: Error) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
}
```

## Usage Examples

### Floating Button Mode (Default)

```javascript
intelliconvo('init', {
    siteId: 'site_123',
    mode: 'button',
    position: 'bottom-right',
    apiUrl: 'https://api.intelliconvo.com'
});
```

### Embedded Widget Mode

```html
<div id="intelliconvo-container"></div>

<script>
intelliconvo('init', {
    siteId: 'site_123',
    mode: 'widget',
    apiUrl: 'https://api.intelliconvo.com'
});
</script>
```

### With Event Callbacks

```javascript
intelliconvo('init', {
    siteId: 'site_123',
    apiUrl: 'https://api.intelliconvo.com',
    onMessage: (message) => {
        console.log('New message:', message);
        // Analytics tracking
        gtag('event', 'chat_message', {
            'message_type': message.role
        });
    },
    onError: (error) => {
        console.error('Chat error:', error);
        // Error reporting
    },
    onConnect: () => {
        console.log('Chat connected');
    },
    onDisconnect: () => {
        console.log('Chat disconnected');
    }
});
```

### Custom Styling

```javascript
intelliconvo('init', {
    siteId: 'site_123',
    apiUrl: 'https://api.intelliconvo.com',
    theme: 'dark',
    customStyles: {
        '--widget-primary-color': '#6366f1',
        '--widget-border-radius': '16px'
    }
});
```

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+
- Mobile Safari iOS 12+
- Chrome Mobile 60+

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support with proper focus management
- **Screen Reader Support**: ARIA labels and semantic HTML structure
- **High Contrast Mode**: Automatic detection and enhanced contrast
- **Reduced Motion**: Respects user's motion preferences
- **Focus Management**: Proper focus trapping in modal mode

## Security Features

- **XSS Protection**: Input sanitization and safe HTML rendering
- **CSP Compliant**: Compatible with Content Security Policy
- **HTTPS Only**: Secure communication channels
- **Input Validation**: Server-side validation and rate limiting

## Performance

### Bundle Size
- Main bundle: ~31 KB (gzipped)
- Vendor bundle: ~72 KB (gzipped, cached separately)
- CSS: ~2 KB (gzipped)

### Optimization Features
- Code splitting for vendor dependencies
- Lazy loading of non-critical features
- Automatic reconnection with exponential backoff
- Local storage for session management
- Optimized for mobile performance

## Development

### Project Structure

```
widget/
├── src/
│   ├── index.ts              # Main widget code
│   ├── styles.css            # Widget styles
│   ├── constants/            # Configuration constants
│   ├── managers/             # Feature managers
│   ├── handlers/             # Event handlers
│   ├── renderers/            # UI renderers
│   ├── utils/                # Utility functions
│   └── types/                # TypeScript types
├── public/
│   └── demo.html             # Development demo
├── dist/                     # Built files
├── .env.development          # Development environment variables
├── .env.production           # Production environment variables
├── .env.example              # Environment template
├── webpack.config.js         # Build configuration
├── tsconfig.json             # TypeScript config
└── postcss.config.js         # PostCSS config
```

### Development Commands

```bash
# Start development build with watch mode
npm run dev

# Build for production with minification
npm run build

# Build and preview production bundle locally
npm run preview

# Start webpack dev server (development only)
npm run serve

# Run TypeScript type checking
npm run type-check

# Run linter
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Run all validation (lint + type-check)
npm run validate

# Analyze bundle size
npm run build -- --env analyze
```

### Environment Configuration

The widget supports environment-specific configuration through `.env` files:

#### `.env.development`
```bash
# Development environment
WIDGET_API_URL=http://localhost:5001
```

#### `.env.production`
```bash
# Production environment
WIDGET_API_URL=https://api.intelliconvo.com
```

**How it works:**
- During development (`npm run dev`), the widget uses `.env.development`
- During production build (`npm run build`), the widget uses `.env.production`
- The `WIDGET_API_URL` is baked into the bundle at build time
- Website owners can still override it via the `apiUrl` config parameter

**Verify environment variables:**
```bash
# Check production build
npm run build
grep -o "https://api.intelliconvo.com" dist/widget.*.js

# Check development build
rm -rf dist && webpack --mode development
grep -o "http://localhost:5001" dist/widget.js
```

### API Integration

The widget communicates with your backend API through:

1. **REST API**: For initial configuration and conversation starters
2. **WebSocket**: For real-time message streaming via Socket.IO

Required API endpoints:

```
GET /api/widget/{siteId}/starters - Conversation starters
WS  /socket.io                    - Real-time messaging
```

## Troubleshooting

### Common Issues

**Widget not appearing:**
- Check console for errors
- Verify `siteId` is correct
- Ensure API endpoint is accessible

**Connection failures:**
- Check network connectivity
- Verify WebSocket support
- Check CORS configuration

**Styling issues:**
- Check for CSS conflicts
- Verify CSP allows inline styles
- Test in different browsers

### Debug Mode

Enable debug logging:

```javascript
// Set before widget initialization
window.INTELLICONVO_DEBUG = true;

intelliconvo('init', { /* config */ });
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run the build and verify
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For technical support or questions:
- Documentation: https://docs.intelliconvo.com
- Email: support@intelliconvo.com
- Issues: https://github.com/intelliconvo/widget/issues