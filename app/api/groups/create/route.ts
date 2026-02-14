// Authenticated user creates a group
// Creator is auto-added as member

import connectDB from "@/lib/db";
import Group from "@/models/Group.model";
import {getServerSession} from "next-auth";
import authOptions from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request){
    try{
        const session = await getServerSession(authOptions);

        if(!session?.user){
            return NextResponse.json(
                {
                    message: "Unauthorized"
                },
                {
                    status: 401
                }
            )
        }

        const {name} = await req.json();
        if(!name){
            return NextResponse.json(
                {
                    message: "Group name required",
                },
                {
                    status: 400
                }
            )
        }

        await connectDB();

        const group = await Group.create({
            name,
            createdBy: session.user.id,
            members: [session.user.id]
        })
        return NextResponse.json(
            group, 
            {
                status: 201
            });
    }catch(error){
        return NextResponse.json(
            {
                message: "Group creation failed!!!"
            },
            {
                status: 500
            }
        )
    }
}