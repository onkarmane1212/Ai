import { NextResponse } from 'next/server';
import dbConnect from '.././../../../lib/dbConnect';
import User from '.././../../../models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // In production, use a strong secret key in .env.local

export async function POST(request) {
    try {
        await dbConnect();
        
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: 'Please provide email and password' },
                { status: 400 }
            );
        }

        // Find user
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return NextResponse.json(
                { message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return NextResponse.json(
                { message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Remove password from the output
        const { password: _, ...userWithoutPassword } = user.toObject();

        const response = NextResponse.json({
            user: userWithoutPassword,
            message: 'Login successful'
        }, { status: 200 });

        // Set HTTP-only cookie
        response.cookies.set({
            name: 'token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        return response;

    } catch (error) {
        return NextResponse.json(
            { message: error.message || 'Login failed' },
            { status: 401 }
        );
    }
}
