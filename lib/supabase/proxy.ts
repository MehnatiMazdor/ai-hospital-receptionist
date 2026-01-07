import { createClient } from './server';
import { NextResponse, type NextRequest } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  let supabaseResponse = NextResponse.next({ request });
  console.log("✅Request pathname is:", pathname)

  const supabase = await createClient();

  // 1. GET AUTH STATE (Crucial for all protected checks)
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (user) {
    console.log("✅User is present inside proxy:", user)
  }

  // 2. DEFINE ROUTE GROUPS
  const isChatApiRoute = pathname.startsWith('/api/chat');
  const isChatRoute = pathname.startsWith('/chat')
  const isDashboardRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/api/dashboard');
  const isLoginPage = pathname === '/login';

  console.log("isChatRoute is:", isChatRoute);
  console.log("✅isDashboardRoute is:", isDashboardRoute);
  
  

  // ========================================================================
  // ALLOWED BY DEFAULT: If it's not a Chat or Dashboard route, let it pass.
  // This covers /, /about, /contact, /login, and any random 404 paths.
  // ========================================================================
  if (!isChatApiRoute && !isDashboardRoute) {
    return supabaseResponse;
  }

  // ========================================================================
  // PROTECTED: From here down, we only care about /chat and /dashboard
  // ========================================================================

  // A. NO USER PRESENT: Redirect to home
  if (authError || !user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // B. CLIENT ROUTES (/chat)
  if (isChatApiRoute) {
    console.log("I am inside isChatRoute");
    
    // Check Rate Limit for all chat users (Anonymous or Registered)
    const { success } = await rateLimit.limit(user.id);
    if (!success) {
      return new NextResponse('Too many requests. Please slow down.', { status: 429 });
    }
    console.log("I have not hit too many requests");
    
    return supabaseResponse;
  }

  // C. ADMIN ROUTES (/dashboard)
  if (isDashboardRoute) {
    console.log("✅I am inside isDashboardRoute");
    
    // 1. Block Anonymous
    if (user.is_anonymous) {
        console.log("I am anonymous inside isDashboardRoute rejected to /chat while pathname is:", pathname);
        
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 2. Verify Admin Role in Profile Table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log("😂Profile data is:", profile);
    console.log("😢Profile error is:", error);
    
    

    if (!profile || profile.role !== 'admin') {
      // Not an admin: Send to their chat app
      console.log("I have authentic, non-anon, but have no profile or profile.role is user");
      
      return NextResponse.redirect(new URL('/login', request.url));
    }
    console.log("✅I have profile where profile user_id is equal to user.id", profile.user_id === user.id);
    
    return supabaseResponse;
  }

  return supabaseResponse;
}