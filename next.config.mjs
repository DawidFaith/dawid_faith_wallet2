/** @type {import('next').NextConfig} */
const nextConfig = {
  // fixes wallet connect dependency issue https://docs.walletconnect.com/web3modal/nextjs/about#extra-configuration
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    
    // Uniswap SDK fixes für Browser-Kompatibilität
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
    };
    
    return config;
  },
  
  // Experimentelle Features für bessere Bundle-Optimierung
  experimental: {
    esmExternals: true,
  },
  
  // Optimiere Bundle Size
  transpilePackages: ['@uniswap/sdk-core', '@uniswap/v3-sdk', '@uniswap/smart-order-router'],
};

export default nextConfig;
