const fs = require("fs");
const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require("@discordjs/builders");

let quizzes = [];

//////////////////////////////////////////////
////////// SETTING UP THE COMMANDS ///////////
//////////////////////////////////////////////

const commandCreateQuiz = new SlashCommandSubcommandBuilder()
    .setName("create")
    .setDescription("Create a new quiz")
    .addStringOption(option => option.setName("title").setDescription("Quiz title").setRequired(true));

// base command
const baseCommand = new SlashCommandBuilder()
    .setName("quiz")
    .setDescription("Setup a quiz!")
    .addSubcommand(commandCreateQuiz);

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
        case "create":
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
    // get title
    const title = String(interaction.options.get("title").value).toLowerCase();

    for (const quiz of quizzes) {
        if (quiz.title === title) {
            await interaction.reply({content: "ERROR: Quiz already exists", ephemeral: true});
            return;
        }
    }

    quizzes.push({title: title});
    await interaction.reply({content: `Sucessfully created quiz with title ${title}`, ephemeral: true});

    return;
}


module.exports = {
    data: baseCommand,
    execute: handleInteraction,
};