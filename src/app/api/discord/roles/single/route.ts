import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { addRole } from "~/lib/discord";

const TECHNICAL = "1292540786759700623";
const DESIGN = "1292540869433491466";
const MARKETING = "1292540932054585384";
const MANAGEMENT = "1292540937653715088";

export async function POST(request: NextRequest) {
  const { guildId, memberId, interactionToken } = (await request.json()) as {
    guildId: string;
    memberId: string;
    interactionToken: string;
  };

  const members = await db.member.findMany();
  const member = members.find((member) => member.discord_id === memberId);
  if (!member) {
    return;
  }
  const department = member.department;
  const departmentActions = [
    { department: TECHNICAL, add: department === "TECHNICAL" },
    { department: DESIGN, add: department === "DESIGN" },
    { department: MARKETING, add: department === "MARKETING" },
    { department: MANAGEMENT, add: department === "MANAGEMENT" },
  ];
  for (const { department, add } of departmentActions) {
    if (add) {
      await addRole(guildId, memberId, department);
    }
  }
  const res = await fetch(
    `https://discord.com/api/v10/webhooks/${process.env.DISCORD_APPLICATION_ID}/${interactionToken}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      },
      body: JSON.stringify({
        type: 6,
        data: {
          content: "Departments synced!",
        },
      }),
    }
  );

  // Define the expected response type
  interface DiscordWebhookResponse {
    id: string;
    type: number;
    content: string;
    channel_id: string;
    // Include other properties as needed
    [key: string]: unknown;
  }

  // Specify the type when parsing JSON
  const msg = (await res.json()) as DiscordWebhookResponse;

  console.log(msg);
  return NextResponse.json({ success: true, response: msg });
}

export const dynamic = "force-dynamic";