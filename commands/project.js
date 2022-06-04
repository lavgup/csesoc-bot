const project = require("../config/projects.json");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
    // Add new /projects command
    data: new SlashCommandBuilder()
        .setName("project")
        .setDescription("Displays info about all the cool projects CSESoc has worked on/is working on!"),
    async execute(interaction) {
        const projects = project.projects;
        const projectEmbed = new MessageEmbed()
            .setTitle("Projects")
            .setColor(0x3A76F8)
            .setAuthor("CSESoc Bot", "https://i.imgur.com/EE3Q40V.png");
        for (let i = 0; i < projects.length; i++) {
            const name = i + 1 + ". " + projects[i].name;
            const description = projects[i].description;
            // const link = projects[i].link;
            projectEmbed.addField(name, description, false);
        }
        await interaction.reply({ embeds: [projectEmbed] });
    },
};
