// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // appDir: true,
  },
  baseUrl: ".",
  paths: {
    "@/*": ["./*"]
  },
    "resolveJsonModule": true,
    "esModuleInterop": true,
  webpack(config) {
    config.module.rules.push({
      test: /\.less$/,
      use: [
        {
          loader: require.resolve('style-loader'),
        },
        {
          loader: require.resolve('css-loader'),
        },
        {
          loader: require.resolve('less-loader'),
          options: {
            lessOptions: {
              javascriptEnabled: true,
            },
          },
        },
      ],
    });
    return config;
  },
};

 

export default nextConfig;
