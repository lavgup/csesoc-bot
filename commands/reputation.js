const { SlashCommandBuilder } = require("@discordjs/builders");
const { Permissions } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reputation")
        .setDescription("Manages user reputation.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("give")
                .setDescription("[ADMIN] Gives reputation to a user.")
                .addUserOption(option => option.setName("user").setDescription("User to give reputation to").setRequired(true))
                .addIntegerOption(option => option.setName("amount").setDescription("Amount of reputation to give")))
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("[ADMIN] Removes reputation from a user.")
                .addUserOption(option => option.setName("user").setDescription("User to remove reputation from").setRequired(true))
                .addIntegerOption(option => option.setName("amount").setDescription("Amount of reputation to remove"))),
    async execute(interaction) {
        // Admin permission check
        if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            return await interaction.reply({ content: "You do not have permission to execute this command.", ephemeral: true });
        }

        if (interaction.options.getSubcommand() === "give") {
            const user = interaction.options.getUser("user");
            const amount = interaction.options.getInteger("amount") ?? 1;

            // TODO: Give rep to user

            await interaction.reply({ content: `Gave +${amount} Rep to ${user.toString()}`, allowedMentions: { users: false } });
        } else if (interaction.options.getSubcommand() === "remove") {
            const user = interaction.options.getUser("user");
            const amount = interaction.options.getInteger("amount") ?? 1;

            // TODO: Remove rep from user

            await interaction.reply({ content: `Removed +${amount} Rep from ${user.toString()}`, allowedMentions: { users: false } });
        }
    },
};
