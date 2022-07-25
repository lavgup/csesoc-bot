import { Command } from '@sapphire/framework';
import { SlashCommandBuilder } from '@discordjs/builders';

export class PingCommand extends Command {
	chatInputRun(interaction) {
		return interaction.reply({
			content: 'Pong!'
		});
	}

	registerApplicationCommands(registry) {
		const command = new SlashCommandBuilder()
			.setName('ping')
			.setDescription('Pong!');

		registry.registerChatInputCommand(command, {
			idHints: ['1001057043769208863']
		});
	}
}
