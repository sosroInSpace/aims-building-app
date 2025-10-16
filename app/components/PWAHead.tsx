export default function PWAHead() {
    return (
        <>
            {/* PWA Meta Tags */}
            <meta name="application-name" content="AIMS Inspections" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            <meta name="apple-mobile-web-app-title" content="AIMS Inspections" />
            <meta name="description" content="Building Inspection site for AIMS Engineering" />
            <meta name="format-detection" content="telephone=no" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="msapplication-config" content="/icons/browserconfig.xml" />
            <meta name="msapplication-TileColor" content="#031363" />
            <meta name="msapplication-tap-highlight" content="no" />
            <meta name="theme-color" content="#031363" />

            {/* Apple Touch Icons */}
            <link rel="apple-touch-icon" href="/logos/Main [Simple].webp" />
            <link rel="apple-touch-icon" sizes="152x152" href="/logos/Main [Simple].webp" />
            <link rel="apple-touch-icon" sizes="180x180" href="/logos/Main [Simple].webp" />
            <link rel="apple-touch-icon" sizes="167x167" href="/logos/Main [Simple].webp" />

            {/* Favicon */}
            <link rel="icon" type="image/webp" sizes="32x32" href="/logos/Main [Simple].webp" />
            <link rel="icon" type="image/webp" sizes="16x16" href="/logos/Main [Simple].webp" />
            <link rel="manifest" href="/manifest.json" />
            <link rel="mask-icon" href="/logos/Main [Simple].webp" color="#031363" />
            <link rel="shortcut icon" href="/logos/Main [Simple].webp" />

            {/* Microsoft */}
            <meta name="msapplication-TileImage" content="/logos/Main [Simple].webp" />

            {/* Splash screens for iOS */}
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

            {/* Responsive viewport */}
            <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        </>
    );
}
