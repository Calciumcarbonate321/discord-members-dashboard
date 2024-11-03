import { NextResponse } from "next/server";
import { NextAuthRequest } from "node_modules/next-auth/lib";
import { addRole, deleteRole } from "~/lib/discord";
import type { Member } from "~/lib/types/member";
import { auth } from "~/server/auth";

const TECHNICAL = "1292540786759700623"; 
const DESIGN = "1292540869433491466";
const MARKETING = "1292540932054585384";
const MANAGEMENT = "1292540937653715088";

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
}

interface DiscordMember {
  user: DiscordUser;
  nick?: string;
  roles: string[];
}

export const POST = auth(async function POST(request:NextAuthRequest) {
  console.log(request.auth)
  const guildId=process.env.DISCORD_GUILD_ID as string;
  const res = await fetch(`${process.env.INTERNAL_API_BASE_URL}/api/members`);
  const db_members = (await res.json()) as Member[];

  // Map roles
  const roleMap: Record<string, string> = {
    TECHNICAL,
    DESIGN,
    MARKETING,
    MANAGEMENT,
  };

  // Fetch Discord members
  const discord_members = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`,
    {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      },
    }
  );
  
  const discord_members_json: DiscordMember[] = (await discord_members.json()) as DiscordMember[];

  for (const member of db_members) {
    const discordMember: DiscordMember | undefined = discord_members_json.find(
      (m: DiscordMember) => m.user.id === member.discord_id
    );

    if (!discordMember) {
      console.log(`Discord member not found for user ID: ${member.discord_id}`);
      continue; 
    }

    const memberRoles: string[] = discordMember.roles;
    console.log(member.department.toUpperCase());
    const requiredRoleId = roleMap[member.department.toUpperCase()];

    if (!requiredRoleId) {
      console.log(`Invalid role for member: ${member.discord_id}`);
      continue; 
    }

    const hasAppropriateRole = memberRoles.includes(requiredRoleId);

    if (!hasAppropriateRole) {
      try {
        for (const role of memberRoles) {
          if (Object.values(roleMap).includes(role) && role !== requiredRoleId) {
            await deleteRole(guildId, member.discord_id, role);
          }
        }
        await addRole(guildId, member.discord_id, requiredRoleId);
      } catch (error) {
        console.log(`Error updating role for member ${member.discord_id}:`, error);
      }
    }
  }

  return new NextResponse("Roles updated", { status: 200 });
})

export const dynamic = "force-dynamic";