import type { NextConfig } from 'next';
import type { Configuration as WebpackConfiguration, WebpackPluginInstance } from 'webpack'; // Import Webpack types

const nextConfig: NextConfig = {
  // Produces a standalone folder with only necessary files for deployment.
  output: 'standalone',

  // Includes .node files in the standalone output.
  // This was moved out of the 'experimental' block.
  outputFileTracingIncludes: {
    '/': ['./node_modules/**/*.node'],
  },

  // Webpack configuration modifications.
  webpack: (
    config: WebpackConfiguration,
    { isServer, webpack }: { isServer: boolean; webpack: any } // Added webpack to access its DefinePlugin if needed later
  ): WebpackConfiguration => {
    // Modify webpack config here

    // Don't resolve Node.js core modules on the client-side.
    // This prevents errors when libraries try to import them in a browser environment.
    if (!isServer) {
      config.resolve = {
        ...config.resolve, // Preserve existing resolve options
        fallback: {
          ...(config.resolve?.fallback || {}), // Preserve existing fallbacks
          fs: false,
          path: false,
          os: false,
          // You might need to add more here depending on your dependencies
          // e.g., crypto: false, stream: false, etc.
        },
      };
    }

    // Example: If you ever need to add a DefinePlugin
    // config.plugins = config.plugins || [];
    // config.plugins.push(
    //   new webpack.DefinePlugin({
    //     'process.env.SOME_CUSTOM_VAR': JSON.stringify('some_value'),
    //   })
    // );

    return config;
  },

  // ESLint configuration.
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors. It's recommended to fix these errors.
    ignoreDuringBuilds: true,
  },

  // TypeScript configuration.
  // Uncomment the block below if you still have TypeScript errors from your
  // application code (not from this config file itself) blocking the build.
  // It's highly recommended to fix these type errors instead of ignoring them.
  /*
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  */

  // If you had other experimental flags, they would go here,
  // but outputFileTracingIncludes is no longer experimental.
  // experimental: {
  //   // otherExperimentalFlags: true,
  // },
};

export default nextConfig;