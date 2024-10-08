import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { type Department, type Role } from "@prisma/client";

export async function POST(request:NextRequest) {
    const data = await request.json() as Array<{
        name: string;
        discord_id: string;
        department: Department;
        role: Role;
      }>;
    const members = await db.member.createMany({
        data:data
    })
    return NextResponse.json(members);
}