const { SlashCommandBuilder } = require("@discordjs/builders");


//////////////////////////////////////////////
////////// SETTING UP THE COMMANDS ///////////
//////////////////////////////////////////////

const commandCreateQuiz = new SlashCommandSubcommandBuilder()
    .setName("help")
    .setDescription("Get some information about the help command")
    .addStringOption(option => option.setName("title").setDescription("Quiz title").setRequired(true));

// base command
const baseCommand = new SlashCommandBuilder()
    .setName("quiz")
    .setDescription("Setup a quiz!");

//////////////////////////////////////////////
/////////// HANDLING THE COMMANDS ////////////
//////////////////////////////////////////////

// handle the command
/** @param {CommandInteraction} interaction */
async function handleInteraction(interaction) {
    // /** @type {DBFaq} */
    // const faqStorage = global.faqStorage;

    // figure out which command was called
    const subcommand = interaction.options.getSubcommand(false);
    switch (subcommand) {
        case "get":
            handleCreateQuiz(interaction);
            break;
        default:
            await interaction.reply("Internal Error AHHHHHHH! CONTACT ME PLEASE!");
    }
}


//////////////////////////////////////////////
/////////// HANDLING THE COMMANDS ////////////
//////////////////////////////////////////////

/** 
 * @param {CommandInteraction} interaction
 */
async function handleCreateQuiz(interaction) {
    // TODO: implement
    return;
}


module.exports = {
    data: baseCommand,
    execute: handleInteraction,
};