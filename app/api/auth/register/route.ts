import connectDB from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/user.model";


import bcrypt from "bcryptjs";

export async function POST(request: NextRequest){
    try{
        await connectDB()
const { name, email, password } = await request.json()

        


// 2. Password validation
if (password.length < 6) {
    return NextResponse.json(
        { message: "Password must be at least 6 characters!" },
        { status: 400 }
    );
}

// 3. Existing user check
let existUser = await User.findOne({ email }).select("+password");

if (existUser) {
    return NextResponse.json(
        { message: "User with this email already exists!" },
        { status: 400 }
    );
}
        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await User.create({
            name: name, email: email, password: hashedPassword
        })

        return NextResponse.json(
    {
        message: "User registered successfully",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            reputationScore: user.reputationScore
        }
    },
    { status: 201 }
)


    }catch(error){
        return NextResponse.json(
            {message: `register error ${error}`},
            {status: 500}
        )
    }
}

// signup/ register api

// 1. check for existing user
// 2. check if password is valid for characters
// 3. hash password using bcrypt.js
// 4. create user
