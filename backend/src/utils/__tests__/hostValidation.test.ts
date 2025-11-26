/**
 * Host Validation Utilities - Test Suite
 * Tests for origin matching, hostname validation, and wildcard patterns
 */

import {
  normalizeHostname,
  matchesHostPattern,
  isOriginAllowed,
  isValidHostname,
} from '../hostValidation';

describe('normalizeHostname', () => {
  test('should normalize regular domains', () => {
    expect(normalizeHostname('https://example.com/')).toBe('example.com');
    expect(normalizeHostname('http://www.example.com')).toBe('example.com');
    expect(normalizeHostname('EXAMPLE.COM')).toBe('example.com');
  });

  test('should preserve localhost with ports', () => {
    expect(normalizeHostname('http://localhost:3000')).toBe('localhost:3000');
    expect(normalizeHostname('localhost:8080')).toBe('localhost:8080');
    expect(normalizeHostname('localhost')).toBe('localhost');
  });

  test('should preserve IP addresses with ports', () => {
    expect(normalizeHostname('http://127.0.0.1:3000')).toBe('127.0.0.1:3000');
    expect(normalizeHostname('192.168.1.1:8080')).toBe('192.168.1.1:8080');
    expect(normalizeHostname('192.168.1.1')).toBe('192.168.1.1');
  });

  test('should normalize wildcards', () => {
    expect(normalizeHostname('*.example.com')).toBe('*.example.com');
    expect(normalizeHostname('*.EXAMPLE.COM')).toBe('*.example.com');
  });
});

describe('matchesHostPattern', () => {
  test('should match exact domains', () => {
    expect(matchesHostPattern('example.com', 'example.com')).toBe(true);
    expect(matchesHostPattern('sub.example.com', 'sub.example.com')).toBe(true);
  });

  test('should match www variations', () => {
    expect(matchesHostPattern('www.example.com', 'example.com')).toBe(true);
    expect(matchesHostPattern('example.com', 'www.example.com')).toBe(true);
  });

  test('should match wildcard patterns', () => {
    expect(matchesHostPattern('sub.example.com', '*.example.com')).toBe(true);
    expect(matchesHostPattern('api.example.com', '*.example.com')).toBe(true);
    expect(matchesHostPattern('deep.sub.example.com', '*.example.com')).toBe(false);
    expect(matchesHostPattern('example.com', '*.example.com')).toBe(true); // Wildcard matches root too
  });

  test('should match localhost with ports', () => {
    expect(matchesHostPattern('localhost:3000', 'localhost:3000')).toBe(true);
    expect(matchesHostPattern('localhost:3000', 'localhost:8080')).toBe(false);
    expect(matchesHostPattern('localhost', 'localhost')).toBe(true);
  });

  test('should match IP addresses with ports', () => {
    expect(matchesHostPattern('127.0.0.1:3000', '127.0.0.1:3000')).toBe(true);
    expect(matchesHostPattern('192.168.1.1', '192.168.1.1')).toBe(true);
  });

  test('should not match different domains', () => {
    expect(matchesHostPattern('evil.com', 'example.com')).toBe(false);
    expect(matchesHostPattern('example.org', 'example.com')).toBe(false);
  });
});

describe('isOriginAllowed', () => {
  test('should allow matching origins', () => {
    expect(isOriginAllowed('https://example.com', ['example.com'])).toBe(true);
    expect(isOriginAllowed('http://www.example.com', ['example.com'])).toBe(true);
    expect(isOriginAllowed('http://localhost:3000', ['localhost:3000'])).toBe(true);
  });

  test('should allow wildcard patterns', () => {
    expect(isOriginAllowed('https://api.example.com', ['*.example.com'])).toBe(true);
    expect(isOriginAllowed('https://shop.example.com', ['*.example.com'])).toBe(true);
  });

  test('should block non-matching origins', () => {
    expect(isOriginAllowed('https://evil.com', ['example.com'])).toBe(false);
    expect(isOriginAllowed('http://localhost:8080', ['localhost:3000'])).toBe(false);
  });

  test('should handle multiple allowed hosts', () => {
    const allowedHosts = ['example.com', '*.test.com', 'localhost:3000'];
    expect(isOriginAllowed('https://example.com', allowedHosts)).toBe(true);
    expect(isOriginAllowed('https://api.test.com', allowedHosts)).toBe(true);
    expect(isOriginAllowed('http://localhost:3000', allowedHosts)).toBe(true);
    expect(isOriginAllowed('https://evil.com', allowedHosts)).toBe(false);
  });

  test('should handle empty allowed hosts list', () => {
    expect(isOriginAllowed('https://example.com', [])).toBe(false);
  });

  test('should handle invalid URLs', () => {
    expect(isOriginAllowed('not-a-url', ['example.com'])).toBe(false);
  });
});

describe('isValidHostname', () => {
  test('should validate regular domains', () => {
    expect(isValidHostname('example.com')).toBe(true);
    expect(isValidHostname('sub.example.com')).toBe(true);
    expect(isValidHostname('deep.sub.example.com')).toBe(true);
  });

  test('should validate wildcard patterns', () => {
    expect(isValidHostname('*.example.com')).toBe(true);
    expect(isValidHostname('*.sub.example.com')).toBe(true);
  });

  test('should validate localhost with ports', () => {
    expect(isValidHostname('localhost')).toBe(true);
    expect(isValidHostname('localhost:3000')).toBe(true);
    expect(isValidHostname('localhost:8080')).toBe(true);
    expect(isValidHostname('localhost:99999')).toBe(false); // Invalid port
  });

  test('should validate IP addresses with ports', () => {
    expect(isValidHostname('127.0.0.1')).toBe(true);
    expect(isValidHostname('192.168.1.1')).toBe(true);
    expect(isValidHostname('127.0.0.1:3000')).toBe(true);
    expect(isValidHostname('192.168.1.1:8080')).toBe(true);
    expect(isValidHostname('999.999.999.999')).toBe(false); // Invalid IP
  });

  test('should validate domains with ports', () => {
    expect(isValidHostname('example.com:3000')).toBe(true);
    expect(isValidHostname('sub.example.com:8080')).toBe(true);
  });

  test('should reject invalid hostnames', () => {
    expect(isValidHostname('')).toBe(false);
    expect(isValidHostname('   ')).toBe(false);
    expect(isValidHostname('invalid..domain')).toBe(false);
    expect(isValidHostname('-invalid.com')).toBe(false);
    expect(isValidHostname('invalid-.com')).toBe(false);
  });

  test('should handle protocol removal', () => {
    expect(isValidHostname('https://example.com')).toBe(true);
    expect(isValidHostname('http://localhost:3000')).toBe(true);
  });
});
