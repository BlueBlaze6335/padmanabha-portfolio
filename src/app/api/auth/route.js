import { NextResponse } from 'next/server';

export async function POST(request) {
  const { password } = await request.json();
  const adminPass = process.env.ADMIN_PASSWORD || 'changeme';

  if (password === adminPass) {
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
    });
    return response;
  }

  return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
}
