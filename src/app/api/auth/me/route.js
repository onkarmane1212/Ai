import { NextResponse } from 'next/server';
import dbConnect from '.././../../../lib/dbConnect';
import User from '.././../../../models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request) {
    try {
        await dbConnect();
        
        // Get token from cookies
        const token = request.cookies.get('token')?.value;
        
        if (!token) {
            return NextResponse.json(
                { user: null, message: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Find user by ID from token
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            // Clear invalid token
            const response = NextResponse.json(
                { user: null, message: 'User not found' },
                { status: 404 }
            );
            
            response.cookies.set({
                name: 'token',
                value: '',
                httpOnly: true,
                expires: new Date(0),
                path: '/',
            });
            
            return response;
        }

        return NextResponse.json({ user });
        
    } catch (error) {
        console.error('Auth check error:', error);
        
        // Clear invalid token
        const response = NextResponse.json(
            { user: null, message: 'Invalid token' },
            { status: 401 }
        );
        
        response.cookies.set({
            name: 'token',
            value: '',
            httpOnly: true,
            expires: new Date(0),
            path: '/',
        });
        
        return response;
    }
}
