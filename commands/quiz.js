const fs = require("fs");
const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require("@discordjs/builders");

let quizzes = [];

//////////////////////////////////////////////
////////// SETTING UP THE COMMANDS ///////////
//////////////////////////////////////////////

const commandCreateQuiz = new SlashCommandSubcommandBuilder()
    .setName("create-quiz")
    .setDescription("Create a new quiz")
    .addStringOption(option => option.setName("title").setDescription("Quiz title").setRequired(true));

const commandCreateQuestion = new SlashCommandSubcommandBuilder()
    .setName("create-question")
    .setDescription("Create a new question for a quiz")
    .addStringOption(option => option.setName("quiz-title").setDescription("Quiz title").setRequired(true))
    .addStringOption(option => option.setName("question").setDescription("The question").setRequired(true));

// base command
const baseCommand = new SlashCommandBuilder()
    .setName("quiz")
    .setDescription("Setup a quiz!")
    .addSubcommand(commandCreateQuiz)
    .addSubcommand(commandCreateQuestion);

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
        case "create-quiz":
            handleCreateQuiz(interaction);
            break;
        case "create-question":
            handleCreateQuestion(interaction);
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
    const title = interaction.options.get("title").value;

    for (const quiz of quizzes) {
        if (quiz.title === title) {
            await interaction.reply({content: "ERROR: Quiz already exists", ephemeral: true});
            return;
        }
    }

    quizzes.push({title: title, questions: []});
    await interaction.reply({content: `Sucessfully created quiz with title ${title}`, ephemeral: true});

    return;
}

/** 
 * @param {CommandInteraction} interaction
 */
 async function handleCreateQuestion(interaction) {
    // get title
    const title = interaction.options.get("quiz-title").value;
    const question = interaction.options.get("question").value;

    let quizFound = false; 
    for (const quiz of quizzes) {
        if (quiz.title === title) {
            quizFound = true;
            quiz.questions.push({
                "question": question,
                "answers" : []
            });
            break;
        }
    }

    if (!quizFound) {
        await interaction.reply({content: `Quiz with title ${title} does not exist`, ephemeral: true});
    } else {
        await interaction.reply({content: `Sucessfully added question to ${title}.`, ephemeral: true});
    }

    return;
}



module.exports = {
    data: baseCommand,
    execute: handleInteraction,
};