import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js API Route for secure authentication
 *
 * This server-side route acts as a proxy between the browser and the Auth API.
 *
 * Security Benefits:
 * - Client credentials (client_id/client_secret) are stored server-side only
 * - Credentials NEVER exposed to the browser or network tab
 * - Implements server-to-server authentication with the Auth API
 *
 * Flow:
 * 1. Browser sends username + password to this Next.js API route (no client creds)
 * 2. This route adds client_id + client_secret from server environment variables
 * 3. Route calls Auth API with complete credentials (server-to-server)
 * 4. Route returns tokens to browser
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body from browser (username + password only)
    const body = await request.json();
    const { username, password } = body;

    if (process.env.NODE_ENV === 'development') {
      console.log('[Next.js API Route] Login request received for username:', username);
    }

    // Validate required fields
    if (!username || !password) {
      console.error('[Next.js API Route] Missing username or password');
      return NextResponse.json(
        { detail: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Get server-side client credentials from environment variables
    // These are NEVER exposed to the browser
    const clientId = process.env.TUTORIA_CLIENT_ID;
    const clientSecret = process.env.TUTORIA_CLIENT_SECRET;
    const authApiUrl = process.env.TUTORIA_AUTH_API_URL || process.env.NEXT_PUBLIC_AUTH_API_URL;

    if (process.env.NODE_ENV === 'development') {
      console.log('[Next.js API Route] Environment variables:');
      console.log('  TUTORIA_CLIENT_ID:', clientId ? '✓ Set' : '✗ Missing');
      console.log('  TUTORIA_CLIENT_SECRET:', clientSecret ? '✓ Set' : '✗ Missing');
      console.log('  TUTORIA_AUTH_API_URL:', authApiUrl || 'Not set, using NEXT_PUBLIC_AUTH_API_URL');
      console.log('  Final Auth API URL:', authApiUrl);
    }

    // Validate environment variables are configured
    if (!clientId || !clientSecret) {
      console.error('[Next.js API Route] Missing TUTORIA_CLIENT_ID or TUTORIA_CLIENT_SECRET environment variables');
      return NextResponse.json(
        { detail: 'Server configuration error: Client credentials not configured' },
        { status: 500 }
      );
    }

    if (!authApiUrl) {
      console.error('[Next.js API Route] Missing TUTORIA_AUTH_API_URL or NEXT_PUBLIC_AUTH_API_URL environment variable');
      return NextResponse.json(
        { detail: 'Server configuration error: Auth API URL not configured' },
        { status: 500 }
      );
    }

    // Call Auth API with user credentials + client credentials
    const authApiEndpoint = `${authApiUrl}/auth/login`;

    if (process.env.NODE_ENV === 'development') {
      console.log('[Next.js API Route] Calling Auth API:', authApiEndpoint);
    }

    const authResponse = await fetch(authApiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
        clientId,      // Server-side only - never exposed to browser
        clientSecret,  // Server-side only - never exposed to browser
      }),
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('[Next.js API Route] Auth API response status:', authResponse.status);
    }

    // Parse response
    const data = await authResponse.json();

    if (process.env.NODE_ENV === 'development') {
      console.log('[Next.js API Route] Auth API response data:', JSON.stringify(data, null, 2));
    }

    // If authentication failed, return error
    if (!authResponse.ok) {
      console.error('[Next.js API Route] Auth API returned error:', authResponse.status, data);
      return NextResponse.json(
        data,
        { status: authResponse.status }
      );
    }

    // Success - return tokens and user info to browser
    if (process.env.NODE_ENV === 'development') {
      console.log('[Next.js API Route] Login successful, returning tokens to browser');
    }
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('[Next.js API Route] Login error:', error);
    console.error('[Next.js API Route] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { detail: 'Internal server error during login' },
      { status: 500 }
    );
  }
}
