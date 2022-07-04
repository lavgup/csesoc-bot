const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require("@discordjs/builders");

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

const commandCreateAnswer = new SlashCommandSubcommandBuilder()
    .setName("create-answer")
    .setDescription("Create a new answer for a question")
    .addStringOption(option => option.setName("quiz-title").setDescription("Quiz title").setRequired(true))
    .addStringOption(option => option.setName("question").setDescription("The question").setRequired(true))
    .addStringOption(option => option.setName("answer").setDescription("The answer").setRequired(true));

const commandStartQuiz = new SlashCommandSubcommandBuilder()
    .setName("start")
    .setDescription("Create a new answer for a question")
    .addStringOption(option => option.setName("quiz-title").setDescription("Quiz title").setRequired(true));

// base command
const baseCommand = new SlashCommandBuilder()
    .setName("quiz")
    .setDescription("Setup a quiz!")
    .addSubcommand(commandCreateQuiz)
    .addSubcommand(commandCreateQuestion)
    .addSubcommand(commandCreateAnswer)
    .addSubcommand(commandStartQuiz);

//////////////////////////////////////////////
/////////// HANDLING THE COMMANDS ////////////
//////////////////////////////////////////////

// handle the command
/** @param {CommandInteraction} interaction */
async function handleInteraction(interaction) {
    /** @type {QuizStore} */
    const quizStore = global.quizStore;

    // figure out which command was called
    const subcommand = interaction.options.getSubcommand(false);
    switch (subcommand) {
        case "create-quiz":
            handleCreateQuiz(interaction, quizStore);
            break;
        case "create-question":
            handleCreateQuestion(interaction, quizStore);
            break;
        case "create-answer":
            handleCreateAnswer(interaction, quizStore);
            break;
        case "start":
            handleStartQuiz(interaction, quizStore);
            break;
        default:
            await interaction.reply("Internal Error. Please contact Discord Bot team.");
    }
}


//////////////////////////////////////////////
/////////// HANDLING THE COMMANDS ////////////
//////////////////////////////////////////////

/** 
 * @param {CommandInteraction} interaction
 * @param {QuizStore} quizStore
 */
async function handleCreateQuiz(interaction, quizStore) {
    quizStore.createQuiz(interaction);
    return;
}

/** 
 * @param {CommandInteraction} interaction
 * @param {QuizStore} quizStore
 */
 async function handleCreateQuestion(interaction, quizStore) {
    quizStore.createQuestion(interaction);
    return;
}

/** 
 * @param {CommandInteraction} interaction
 * @param {QuizStore} quizStore
 */
 async function handleCreateAnswer(interaction, quizStore) {
    quizStore.createAnswer(interaction);
    return;
}

/** 
 * @param {CommandInteraction} interaction
 * @param {QuizStore} quizStore
 */
 async function handleStartQuiz(interaction, quizStore) {
    quizStore.startQuiz(interaction);
    return;
}

module.exports = {
    data: baseCommand,
    execute: handleInteraction
}