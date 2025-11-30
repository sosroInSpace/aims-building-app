/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    env: {
        apiBaseUrl: process.env.API_BASE_URL,
        NAME: process.env.NAME
    },
    // Disable font optimization to fix Inter font loading issues on Vercel
    optimizeFonts: false,
    // Configure external image domains
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "picsum.photos",
                port: "",
                pathname: "/**"
            },
            {
                protocol: "https",
                hostname: "fastly.picsum.photos",
                port: "",
                pathname: "/**"
            },
            {
                protocol: "https",
                hostname: "inspection-report-pdf-bucket.s3.ap-southeast-2.amazonaws.com",
                port: "",
                pathname: "/**"
            },
            {
                protocol: "https",
                hostname: "aimsreporting.s3.ap-southeast-2.amazonaws.com",
                port: "",
                pathname: "/**"
            }
        ]
    },
    // Optimize for serverless deployment
    experimental: {
        serverComponentsExternalPackages: ["@sparticuz/chromium", "puppeteer-core"]
    },
    // Handle root URL redirection to customer page
    async redirects() {
        return [
            {
                source: "/",
                destination: "/customer",
                permanent: false
            }
        ];
    },
    // PWA Configuration
    async headers() {
        return [
            {
                source: "/sw.js",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=0, must-revalidate"
                    },
                    {
                        key: "Service-Worker-Allowed",
                        value: "/"
                    }
                ]
            },
            {
                source: "/manifest.json",
                headers: [
                    {
                        key: "Content-Type",
                        value: "application/manifest+json"
                    }
                ]
            },
            // Add security headers for incognito mode compatibility
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "X-Frame-Options",
                        value: "DENY"
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff"
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin"
                    },
                    // Allow cookies in incognito mode
                    {
                        key: "Cross-Origin-Embedder-Policy",
                        value: "unsafe-none"
                    }
                ]
            }
        ];
    }
};

export default nextConfig;
