import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Track cookies set during auth operations
  const cookiesToForward: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
            cookiesToForward.push({ name, value, options: options as Record<string, unknown> });
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Auto-sign in if no session and credentials are configured
  if (!user && process.env.AUTO_LOGIN_EMAIL && process.env.AUTO_LOGIN_PASSWORD) {
    const { error } = await supabase.auth.signInWithPassword({
      email: process.env.AUTO_LOGIN_EMAIL,
      password: process.env.AUTO_LOGIN_PASSWORD,
    });

    if (!error) {
      // Redirect to the same page so the browser makes a new request
      // with the session cookies, allowing server components to read them.
      const redirect = NextResponse.redirect(request.nextUrl.clone());
      cookiesToForward.forEach(({ name, value, options }) => {
        redirect.cookies.set(name, value, options);
      });
      return redirect;
    }
  }

  // If still no user and no auto-login, redirect to login page
  if (!user && !process.env.AUTO_LOGIN_EMAIL) {
    const isAuthPage =
      request.nextUrl.pathname.startsWith("/login") ||
      request.nextUrl.pathname.startsWith("/signup");

    if (!isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // Redirect auth pages to dashboard (already signed in)
  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup");

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
