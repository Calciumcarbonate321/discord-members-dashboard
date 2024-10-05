import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import {type Department,type Role } from "@prisma/client";

export async function GET() {
    const members = await db.member.findMany();
    return NextResponse.json(members);
}

export async function POST(request: NextRequest) {
    const { name, email, department, role } = (await request.json() as {
        name: string;
        email: string;
        department: Department;
        role: Role;
    })
    const member = await db.member.upsert({
        where: {
            email:email,
        },
        update: {
            name:name,
            department:department,
            role:role,
        },
        create: {
            name:name,
            email:email,
            department:department,
            role:role,
        }
    });
    return NextResponse.json(member);
}