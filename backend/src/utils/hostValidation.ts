/**
 * Host Validation Utilities
 * Provides functions for validating and matching origins against allowed hosts
 */

/**
 * Normalize a hostname by removing protocol, trailing slashes, and normalizing case
 * Preserves ports for localhost and development environments
 *
 * @param hostname - The hostname to normalize
 * @returns Normalized hostname
 *
 * @example
 * normalizeHostname('https://example.com/') // 'example.com'
 * normalizeHostname('www.example.com') // 'example.com'
 * normalizeHostname('localhost:3000') // 'localhost:3000'
 * normalizeHostname('http://localhost:8080/') // 'localhost:8080'
 */
export function normalizeHostname(hostname: string): string {
  let normalized = hostname.toLowerCase().trim();

  // Remove protocol
  normalized = normalized.replace(/^https?:\/\//, '');

  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '');

  // Remove www. prefix ONLY if not localhost or contains port
  // This preserves localhost:3000, 127.0.0.1:8080, etc.
  if (!normalized.startsWith('localhost') &&
      !normalized.match(/^\d+\.\d+\.\d+\.\d+/) &&
      !normalized.includes(':')) {
    normalized = normalized.replace(/^www\./, '');
  }

  return normalized;
}

/**
 * Check if an origin matches an allowed host pattern
 * Supports:
 * - Exact matches: example.com
 * - www prefix variations: www.example.com
 * - Wildcard subdomains: *.example.com
 * - Localhost with ports: localhost:3000
 * - IP addresses with ports: 127.0.0.1:8080
 *
 * @param originHost - The origin hostname to check (already normalized)
 * @param allowedHost - The allowed host pattern (already normalized)
 * @returns True if origin matches the allowed host pattern
 *
 * @example
 * matchesHostPattern('example.com', 'example.com') // true
 * matchesHostPattern('www.example.com', 'example.com') // true
 * matchesHostPattern('sub.example.com', '*.example.com') // true
 * matchesHostPattern('localhost:3000', 'localhost:3000') // true
 * matchesHostPattern('sub.example.com', 'example.com') // false
 */
export function matchesHostPattern(originHost: string, allowedHost: string): boolean {
  // Normalize both for comparison
  const normalizedOrigin = normalizeHostname(originHost);
  const normalizedAllowed = normalizeHostname(allowedHost);

  // Exact match
  if (normalizedOrigin === normalizedAllowed) {
    return true;
  }

  // Wildcard pattern matching (*.example.com)
  if (normalizedAllowed.startsWith('*.')) {
    const domain = normalizedAllowed.slice(2); // Remove '*.'

    // Match if origin ends with the domain
    // e.g., sub.example.com matches *.example.com
    if (normalizedOrigin.endsWith(`.${domain}`) || normalizedOrigin === domain) {
      return true;
    }
  }

  // Handle www prefix variations (only for non-localhost, non-IP addresses)
  if (!normalizedOrigin.startsWith('localhost') &&
      !normalizedOrigin.match(/^\d+\.\d+\.\d+\.\d+/) &&
      !normalizedAllowed.startsWith('localhost') &&
      !normalizedAllowed.match(/^\d+\.\d+\.\d+\.\d+/)) {

    // Check www.origin against host
    if (normalizedOrigin === `www.${normalizedAllowed}`) {
      return true;
    }

    // Check origin against www.host
    if (`www.${normalizedOrigin}` === normalizedAllowed) {
      return true;
    }
  }

  return false;
}

/**
 * Check if an origin is allowed based on a list of allowed host patterns
 *
 * @param origin - The full origin URL (e.g., 'https://example.com' or 'http://localhost:3000')
 * @param allowedHosts - Array of allowed host patterns (can include wildcards)
 * @returns True if origin matches any allowed host pattern
 *
 * @example
 * isOriginAllowed('https://sub.example.com', ['*.example.com', 'localhost:3000']) // true
 * isOriginAllowed('http://localhost:3000', ['localhost:3000']) // true
 * isOriginAllowed('https://evil.com', ['example.com']) // false
 */
export function isOriginAllowed(origin: string, allowedHosts: string[]): boolean {
  if (!origin || allowedHosts.length === 0) {
    return false;
  }

  try {
    // Extract hostname from origin URL
    const url = new URL(origin);
    const originHost = url.hostname + (url.port ? `:${url.port}` : '');

    // Check against all allowed patterns
    return allowedHosts.some((allowedHost) =>
      matchesHostPattern(originHost, allowedHost)
    );
  } catch (error) {
    // Invalid URL format
    return false;
  }
}

/**
 * Validate hostname format
 * Supports:
 * - Regular domains: example.com, sub.example.com
 * - Wildcard patterns: *.example.com
 * - Localhost with optional port: localhost, localhost:3000
 * - IP addresses with optional port: 127.0.0.1, 192.168.1.1:8080
 *
 * @param hostname - The hostname to validate
 * @returns True if hostname format is valid
 */
export function isValidHostname(hostname: string): boolean {
  if (!hostname || hostname.trim().length === 0) {
    return false;
  }

  const normalized = normalizeHostname(hostname);

  // Wildcard pattern
  if (normalized.startsWith('*.')) {
    const domain = normalized.slice(2);
    // Validate the domain part after wildcard
    return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(domain);
  }

  // Localhost with optional port
  if (normalized.startsWith('localhost')) {
    if (normalized === 'localhost') return true;
    // localhost:port format
    const portMatch = normalized.match(/^localhost:(\d+)$/);
    if (portMatch) {
      const port = parseInt(portMatch[1], 10);
      return port > 0 && port <= 65535;
    }
    return false;
  }

  // IP address with optional port
  const ipPortMatch = normalized.match(/^(\d+\.\d+\.\d+\.\d+)(?::(\d+))?$/);
  if (ipPortMatch) {
    const [, ip, port] = ipPortMatch;
    const parts = ip.split('.');
    const validIp = parts.every((part) => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });

    if (!validIp) return false;

    if (port) {
      const portNum = parseInt(port, 10);
      return portNum > 0 && portNum <= 65535;
    }

    return true;
  }

  // Regular hostname with optional port
  const hostPortMatch = normalized.match(/^([^:]+)(?::(\d+))?$/);
  if (hostPortMatch) {
    const [, host, port] = hostPortMatch;

    // Validate hostname part
    const validHost = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(host);

    if (!validHost) return false;

    // Validate port if present
    if (port) {
      const portNum = parseInt(port, 10);
      return portNum > 0 && portNum <= 65535;
    }

    return true;
  }

  return false;
}
