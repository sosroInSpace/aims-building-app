import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    // Clone the request headers and set the x-pathname header
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", request.nextUrl.pathname);
    requestHeaders.set("x-url", request.url);

    // Return a response with the modified headers
    return NextResponse.next({
        request: {
            headers: requestHeaders
        }
    });
}

// Configure which paths the middleware should run on
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)"
    ]
};
