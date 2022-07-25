import { config } from 'dotenv';
config();

import { SapphireClient } from '@sapphire/framework';

const client = new SapphireClient({
	intents: ['GUILDS']
});

await client.login(process.env.DISCORD_BOT_TOKEN);
