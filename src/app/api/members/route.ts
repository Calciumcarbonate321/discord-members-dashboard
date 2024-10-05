import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import {type Department,type Role } from "@prisma/client";

export async function GET() {
    const members = await db.member.findMany();
    return NextResponse.json(members);
}

export async function POST(request: NextRequest) {
    const { name, discord_id, department, role } = (await request.json() as {
        name: string;
        discord_id: string;
        department: Department;
        role: Role;
    })
    const member = await db.member.upsert({
        where: {
            discord_id:discord_id,
        },
        update: {
            name:name,
            department:department,
            role:role,
        },
        create: {
            name:name,
            discord_id:discord_id,
            department:department,
            role:role,
        }
    });
    return NextResponse.json(member);
}

export async function DELETE(request: NextRequest) {
    const { discord_id } = await request.json() as { discord_id: string };
    const member = await db.member.delete({
        where: {
            discord_id: discord_id,
        }
    });
    return NextResponse.json(member);
}