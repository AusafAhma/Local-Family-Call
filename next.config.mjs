/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable SWC minification for better compatibility with Socket.IO
  swcMinify: true,
};

export default nextConfig;
