# Domain Configuration Improvements

## Overview

This document describes the improvements made to the "Access & Security" domain configuration feature in the application. The changes enhance security, add wildcard support, enable localhost/IP testing, and improve the overall reliability of origin validation.

## Changes Made

### 1. New Host Validation Utility (`backend/src/utils/hostValidation.ts`)

Created a centralized utility module for all hostname and origin validation logic with the following functions:

#### `normalizeHostname(hostname: string): string`
- Removes protocols (`http://`, `https://`)
- Removes trailing slashes
- Removes `www.` prefix (except for localhost and IPs)
- **Preserves ports** for localhost and IP addresses
- Converts to lowercase for consistent comparison

**Examples:**
```typescript
normalizeHostname('https://example.com/') // 'example.com'
normalizeHostname('http://localhost:3000') // 'localhost:3000'
normalizeHostname('192.168.1.1:8080')     // '192.168.1.1:8080'
```

#### `matchesHostPattern(originHost: string, allowedHost: string): boolean`
- Supports exact domain matching
- Supports `www.` prefix variations
- **NEW: Supports wildcard patterns** (`*.example.com`)
- Supports localhost with ports
- Supports IP addresses with ports

**Examples:**
```typescript
matchesHostPattern('example.com', 'example.com')           // true
matchesHostPattern('www.example.com', 'example.com')       // true
matchesHostPattern('api.example.com', '*.example.com')     // true (NEW)
matchesHostPattern('localhost:3000', 'localhost:3000')     // true (NEW)
```

#### `isOriginAllowed(origin: string, allowedHosts: string[]): boolean`
- Validates a full origin URL against an array of allowed host patterns
- Extracts hostname and port from origin
- Checks against all allowed patterns
- Returns `true` if any pattern matches

**Examples:**
```typescript
isOriginAllowed('https://api.example.com', ['*.example.com'])  // true
isOriginAllowed('http://localhost:3000', ['localhost:3000'])   // true
isOriginAllowed('https://evil.com', ['example.com'])           // false
```

#### `isValidHostname(hostname: string): boolean`
- Validates hostname format before adding to database
- Supports regular domains, wildcards, localhost, and IPs
- Validates port numbers (1-65535)

### 2. Backend Service Updates

#### `WidgetService.ts` (`backend/src/services/widget/WidgetService.ts`)
- Updated `validateSite()` method to use new `isOriginAllowed()` utility
- Simplified origin checking logic (lines 207-216)
- Maintains backward compatibility with existing behavior

**Before:**
```typescript
const isAllowed = allowedHosts.some((host) => {
  return (
    originHost === host ||
    originHost === `www.${host}` ||
    `www.${originHost}` === host
  );
});
```

**After:**
```typescript
if (!isOriginAllowed(origin, allowedHosts)) {
  throw new AppError(403, ErrorCode.FORBIDDEN, 'Origin not allowed');
}
```

#### `SiteService.ts` (`backend/src/services/site/SiteService.ts`)
- Updated `normalizeHostname()` to use shared utility function
- Ensures consistent hostname normalization across the application

### 3. Socket.IO Security Enhancements

#### `index.ts` (`backend/src/index.ts`)
- Updated Socket.IO CORS configuration with detailed comments
- Made CORS more permissive for widget connections
- Documented the multi-layered security approach

#### `socket.ts` (`backend/src/services/socket.ts`)
- Added Socket.IO middleware for connection logging
- **Added origin validation in message handler** (lines 135-158)
- Validates origin against site's `activeHosts` before processing messages
- Emits error and blocks messages from unauthorized origins

**Security Layers:**
1. Widget validates via `/widget/:siteId/validate` endpoint before loading
2. Socket.IO middleware logs connections
3. **Message handler validates origin against site's activeHosts**
4. Business logic validates siteId and permissions

### 4. Frontend Validation Updates

#### `hosts-tab.tsx` (`frontend/components/site/hosts-tab.tsx`)
- Enhanced `handleAddHost()` with comprehensive hostname validation
- Added inline `validateHostname()` function (lines 82-151)
- Updated input placeholder to show supported formats
- Updated help documentation with accurate examples

**Supported Formats:**
- ✅ Regular domains: `example.com`
- ✅ Subdomains: `blog.example.com`
- ✅ **Wildcards: `*.example.com`** (NEW)
- ✅ **Localhost with ports: `localhost:3000`** (NEW)
- ✅ **IP addresses with ports: `192.168.1.1:8080`** (NEW)

**Updated UI Elements:**
- Input placeholder: `"example.com, *.example.com, or localhost:3000"`
- Error messages now mention all supported formats
- Help section includes accurate examples and use cases

## Testing

### Manual Testing Script
Created `backend/test-host-validation.ts` for comprehensive testing:

```bash
npx tsx test-host-validation.ts
```

**Test Coverage:**
- ✅ Hostname normalization (5 test cases)
- ✅ Pattern matching (7 test cases)
- ✅ Origin validation (8 test cases)
- ✅ Hostname format validation (11 test cases)
- ✅ Real-world scenarios (4 scenarios, 12 test cases)

**All 43 test cases pass successfully! ✅**

### Unit Tests
Created Jest test suite at `backend/src/utils/__tests__/hostValidation.test.ts` with comprehensive test coverage.

## Migration Guide

### For Existing Sites
No migration needed! All existing allowed hosts will continue to work exactly as before.

### Adding New Capabilities

#### 1. Enable Wildcard Subdomains
```
1. Go to Site Settings → Access & Security
2. Add: *.yourdomain.com
3. All subdomains (api.yourdomain.com, shop.yourdomain.com, etc.) will now work
```

#### 2. Enable Local Development
```
1. Go to Site Settings → Access & Security
2. Add: localhost:3000 (or your development port)
3. Test widget locally without issues
```

#### 3. Enable IP-Based Testing
```
1. Go to Site Settings → Access & Security
2. Add: 192.168.1.100:8080
3. Test widget on local network devices
```

## Security Considerations

### Multi-Layered Approach
The implementation uses defense in depth:

1. **Widget Load Time**: Origin validated via `/widget/:siteId/validate` endpoint
2. **Socket Connection**: Connection logged with origin information
3. **Message Processing**: Origin validated against `activeHosts` before processing
4. **Business Logic**: SiteId and permissions validated per request

### Why Socket.IO CORS is Permissive
Socket.IO CORS validation happens before we know which site the widget is connecting to. The real security enforcement happens at:
- Widget initialization (validates origin against site's hosts)
- Message processing (validates origin per message with siteId)

This approach is more secure than relying solely on CORS because:
- It's per-site, not global
- It's enforced at the application level, not just browser level
- It handles dynamic host lists (wildcards, etc.)

### Rate Limiting
Existing rate limiting on Socket.IO messages prevents abuse even if origin validation were bypassed.

## Breaking Changes

**None!** All changes are backward compatible. Existing configurations continue to work without modification.

## Performance Impact

- **Minimal**: Added validation checks are O(n) where n = number of allowed hosts per site (typically < 10)
- **Cached**: Site data including `activeHosts` is already loaded for message processing
- **Optimized**: Pattern matching uses efficient string operations, no regex in hot path

## Files Changed

### Backend
- ✅ `src/utils/hostValidation.ts` (NEW) - Core validation utilities
- ✅ `src/services/widget/WidgetService.ts` - Updated origin validation
- ✅ `src/services/site/SiteService.ts` - Updated hostname normalization
- ✅ `src/services/socket.ts` - Added message-level origin validation
- ✅ `src/index.ts` - Updated Socket.IO CORS configuration
- ✅ `src/utils/__tests__/hostValidation.test.ts` (NEW) - Unit tests
- ✅ `test-host-validation.ts` (NEW) - Manual test script

### Frontend
- ✅ `components/site/hosts-tab.tsx` - Enhanced validation & UI

### Documentation
- ✅ `DOMAIN_CONFIGURATION_IMPROVEMENTS.md` (NEW) - This file

## Usage Examples

### Production Website
```javascript
// Allow main domain and www variant
Allowed hosts: ['example.com']

// ✅ Allowed
https://example.com
https://www.example.com

// ❌ Blocked
https://blog.example.com
https://api.example.com
```

### Multi-Subdomain Application
```javascript
// Allow all subdomains
Allowed hosts: ['*.example.com']

// ✅ Allowed
https://api.example.com
https://shop.example.com
https://blog.example.com
https://any.subdomain.example.com

// ❌ Blocked
https://example.com (use separate entry if needed)
https://example.org
```

### Mixed Environment
```javascript
// Production + Staging + Local
Allowed hosts: [
  'example.com',           // Production
  '*.staging.example.com', // All staging subdomains
  'localhost:3000',        // Local development
  '192.168.1.100:8080'    // Testing on LAN
]
```

## Troubleshooting

### Widget Not Loading
1. Check browser console for CORS or origin errors
2. Verify allowed hosts in Access & Security settings
3. Ensure hostname matches exactly (including port for localhost)
4. Try adding wildcard pattern if using many subdomains

### Localhost Not Working
1. Make sure port is included: `localhost:3000` not just `localhost`
2. Check if port matches your development server
3. Try `127.0.0.1:3000` as alternative

### Wildcard Not Working
1. Verify pattern starts with `*.` (e.g., `*.example.com`)
2. Check subdomain depth (wildcards only match one level)
3. Ensure parent domain has no www prefix in pattern

## Future Enhancements

Potential improvements for consideration:
- [ ] Multi-level wildcard support (`**.example.com`)
- [ ] Regular expression patterns for advanced matching
- [ ] Allow/deny lists with priority ordering
- [ ] Analytics on blocked origin attempts
- [ ] Automatic detection and suggestions for common patterns

## Support

For issues or questions about domain configuration:
1. Check this documentation
2. Review the help section in Access & Security
3. Test with manual test script: `npx tsx test-host-validation.ts`
4. Check application logs for specific error messages

---

**Last Updated**: 2025-11-26
**Version**: 1.0
**Status**: ✅ Complete and Tested
