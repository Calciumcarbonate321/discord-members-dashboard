// Define interfaces for Discord data
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

// Function to add a role to a member
export async function addRole(guildId: string, userId: string, roleId: string) {
  if (!guildId || !userId || !roleId) {
    throw new Error('Guild ID, User ID, and Role ID are required');
  }

  const url = `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`;
  const token = process.env.DISCORD_TOKEN;

  if (!token) {
    throw new Error('Discord token is not configured');
  }

  try {
    // Get the current roles
    const getResponse = await fetch(url, {
      headers: {
        Authorization: `Bot ${token}`,
      },
    });

    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      console.error('Error fetching member:', errorText);
      throw new Error(`Failed to fetch member: ${getResponse.status} ${getResponse.statusText}`);
    }

    const memberData = (await getResponse.json()) as DiscordMember;
    console.log(memberData);

    const currentRoles = memberData.roles ?? [];
    const updatedRoles = Array.from(new Set([...currentRoles, roleId]));

    // Update the roles
    const patchResponse = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${token}`,
      },
      body: JSON.stringify({ roles: updatedRoles }),
    });
    console.log(patchResponse);

    if (!patchResponse.ok) {
      const errorText = await patchResponse.text();
      console.error('Error updating roles:', errorText);
      throw new Error(`Failed to update roles: ${patchResponse.status} ${patchResponse.statusText}`);
    }

    const updatedMember = (await patchResponse.json()) as DiscordMember;
    return updatedMember;
  } catch (error) {
    console.error('Error in addRole:', error);
    throw error;
  }
}

// Function to delete a role from a member
export async function deleteRole(guildId: string, userId: string, roleId: string) {
  if (!guildId || !userId || !roleId) {
    throw new Error('Guild ID, User ID, and Role ID are required');
  }

  const url = `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`;
  const token = process.env.DISCORD_TOKEN;

  if (!token) {
    throw new Error('Discord token is not configured');
  }

  try {
    // Get the current roles
    const getResponse = await fetch(url, {
      headers: {
        Authorization: `Bot ${token}`,
      },
    });

    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      console.error('Error fetching member:', errorText);
      throw new Error(`Failed to fetch member: ${getResponse.status} ${getResponse.statusText}`);
    }

    const memberData = (await getResponse.json()) as DiscordMember;
    const currentRoles = memberData.roles ?? [];
    const updatedRoles = currentRoles.filter((role) => role !== roleId);

    // Update the roles
    const patchResponse = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${token}`,
      },
      body: JSON.stringify({ roles: updatedRoles }),
    });

    if (!patchResponse.ok) {
      const errorText = await patchResponse.text();
      console.error('Error updating roles:', errorText);
      throw new Error(`Failed to update roles: ${patchResponse.status} ${patchResponse.statusText}`);
    }

    const updatedMember = (await patchResponse.json()) as DiscordMember;
    console.log('Role deleted successfully');
    return updatedMember;
  } catch (error) {
    console.error('Error in deleteRole:', error);
    throw error;
  }
}