import { NextResponse } from 'next/server';
import dbConnect from '.././../../../lib/dbConnect';
import User from '.././../../../models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // In production, use a strong secret key in .env.local

export async function POST(request) {
    try {
        await dbConnect();
        
        const { fullName, email, password } = await request.json();

        // Validate input
        if (!fullName || !email || !password) {
            return NextResponse.json(
                { message: 'Please provide all required fields' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { message: 'Email already in use' },
                { status: 400 }
            );
        }

        // Create new user
        const user = new User({
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            password
        });

        await user.save();

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Remove password from the output
        const { password: _, ...userWithoutPassword } = user.toObject();

        const response = NextResponse.json(
            { 
                user: userWithoutPassword, 
                message: 'User created successfully' 
            },
            { status: 201 }
        );

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
        console.error('Signup error:', error);
        return NextResponse.json(
            { 
                message: 'Error creating user', 
                error: process.env.NODE_ENV === 'development' ? error.message : undefined 
            },
            { status: 500 }
        );
    }
}
