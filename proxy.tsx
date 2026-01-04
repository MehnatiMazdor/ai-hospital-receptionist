import { clerkMiddleware, ClerkMiddlewareAuth,} from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { getRouteType } from "@/lib/proxyutils";
import { handleRouteByType } from "@/lib/proxyutils";


export default clerkMiddleware(async (auth: ClerkMiddlewareAuth, req: NextRequest) => {
  const pathname = req.nextUrl.pathname;

  // Skip middleware for static files, Next.js internals, and auth pages
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/_next') ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/clerk') ||
    pathname.includes('/favicon.ico') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js)$/)
  ) {
    return NextResponse.next()
  }

  const routeType = getRouteType(pathname);

  return await handleRouteByType(routeType, req, auth);
  
});

  
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}