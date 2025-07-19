import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const response = NextResponse.json(
            { message: 'Logout successful' },
            { status: 200 }
        );

        // Clear the HTTP-only cookie
        response.cookies.set({
            name: 'token',
            value: '',
            httpOnly: true,
            expires: new Date(0), // Set to a past date
            path: '/',
        });

        return response;
    } catch (error) {
        return NextResponse.json(
            { message: 'Error logging out' },
            { status: 500 }
        );
    }
}
