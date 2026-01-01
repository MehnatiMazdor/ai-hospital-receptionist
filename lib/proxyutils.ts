import { NextRequest, NextResponse } from "next/server";
import { createClient } from "./supabase/server";
import { rateLimit } from "./rateLimit";


// Route type identifier
export function getRouteType(pathname: string): 'chat' | 'chat-api' | 'dashboard' | 'dashboard-api'| 'public' {
  if (pathname.startsWith('/api/chat')) return 'chat-api';
  if (pathname.startsWith('/chat')) return 'chat';
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  if (pathname.startsWith('/api/dashboard')) return 'dashboard-api';
  return 'public';
}


export async function handleRouteByType(
  routeType: 'chat' | 'chat-api' | 'dashboard' | 'dashboard-api'| 'public', 
  req: NextRequest, 
  auth: any
): Promise<NextResponse> {

  switch (routeType) {
    case 'chat':
    case 'chat-api':  
    {
      const supabase = await createClient();
      const { data: { user}, error } = await supabase.auth.getUser();

      if (error || !user) {
        // Prevent redirect loop - don't redirect if already on sign-in
        if (req.nextUrl.pathname.startsWith('/sign-in')) {
          return NextResponse.next();
        }
        
        const signInUrl = new URL('/sign-in', req.url);
        signInUrl.searchParams.set('redirect_url', req.url);
        return NextResponse.redirect(signInUrl);
      }

      const { success, limit, reset, remaining } = await rateLimit.limit(user.id);

      if (!success) {
        return new NextResponse('Too many requests', { status: 429 });
      }

      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Limit', limit.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', reset.toString());
      return response;
    }

    case 'dashboard':
    case 'dashboard-api':  
    {
      const { userId } = await auth();

      if (!userId) {
        // Prevent redirect loop - don't redirect if already on sign-in
        if (req.nextUrl.pathname.startsWith('/sign-in')) {
          return NextResponse.next();
        }
        
        const signInUrl = new URL('/sign-in', req.url);
        signInUrl.searchParams.set('redirect_url', req.url);
        return NextResponse.redirect(signInUrl);
      }
      return NextResponse.next();
    }

    case 'public': {
      return NextResponse.next();
    }
  }
}