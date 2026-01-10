import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  // Your existing config options here
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);