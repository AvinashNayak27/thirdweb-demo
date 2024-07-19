// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
      config.externals.push("pino-pretty", "lokijs", "encoding");
      return config;
    },
    headers:[
      {
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin-allow-popups', // Recommended directive
      },
    ],
    experimental: {
      missingSuspenseWithCSRBailout: false,
    },
  };
  
  export default nextConfig;
  