import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();

        // Simple auth for dashboard admin
        if (username === 'admin' && password === 'tuan16032005') {
            const response = NextResponse.json({ success: true });

            // Set a simple auth cookie (httpOnly: false so client can check it)
            response.cookies.set('auth_token', 'dashboard_secret_token', {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7, // 7 days
                path: '/',
            });

            return response;
        }

        return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
