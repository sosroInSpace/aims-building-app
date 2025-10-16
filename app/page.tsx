// This page should not be reached due to server-side redirect in next.config.mjs
// The redirect from "/" to "/customer" is handled at the Next.js config level
export default function Page_Home() {
    // This component should never render due to the redirect
    return null;
}
