const { SlashCommandBuilder } = require("@discordjs/builders");


const baseCommand = new SlashCommandBuilder()
    .setName("quiz")
    .setDescription("Setup a quiz!");

async function handleInteraction (interaction) {
    await interaction.reply("🏓 Pong!");
}


module.exports = {
    data: baseCommand,
    execute: handleInteraction,
};