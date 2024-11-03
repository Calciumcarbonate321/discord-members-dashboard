import { type NextRequest, NextResponse } from "next/server";
import { addRole, deleteRole } from "~/lib/discord";
import { Member } from "~/lib/types/member";

const TECHNICAL = "1292540786759700623"; 
const DESIGN = "1292540869433491466";
const MARKETING = "1292540932054585384";
const MANAGEMENT = "1292540937653715088";

export async function POST(request: NextRequest) {
  const { guildId,  key } = (await request.json()) as {
    guildId: string;
    key: string;
  };
  if (key !== process.env.SECRET_KEY) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const res = await fetch(`${process.env.INTERNAL_API_BASE_URL}/api/members`);
  const db_members = (await res.json()) as Member[];

  // Map roles
  const roleMap: { [key: string]: string } = {
    TECHNICAL: TECHNICAL,
    DESIGN: DESIGN,
    MARKETING: MARKETING,
    MANAGEMENT: MANAGEMENT,
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
  const discord_members_json = await discord_members.json();
  //console.log(discord_members_json);
  //console.log(db_members);

  for (const member of db_members) {
    const discordMember = discord_members_json.find(
      (m: any) => m.user.id === member.discord_id
    );

    if (!discordMember) {
      console.log(`Discord member not found for user ID: ${member.discord_id}`);
      continue; 
    }

    const memberRoles: string[] = discordMember.roles;
    console.log(member.department.toUpperCase())
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
            //console.log(`Removing role ${role} from member ${member.discord_id}`);
            await deleteRole(guildId, member.discord_id, role);
          }
        }
        //console.log(`Adding role ${requiredRoleId} to member ${member.discord_id}`);
        await addRole(guildId, member.discord_id, requiredRoleId);
      } catch (error) {
        console.log(`Error updating role for member ${member.discord_id}:`, error);
      }
    }
  }

  return new NextResponse("Roles updated", { status: 200 });
}