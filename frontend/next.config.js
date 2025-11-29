/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['http://172.20.10.2:3000'],
  // Enable standalone output for Docker deployment
  // This creates a minimal production build with only necessary files
  output: 'standalone',
};

module.exports = nextConfig;
