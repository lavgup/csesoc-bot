const { MessageActionRow, MessageButton } = require("discord.js");
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
    if (interaction.isButton()) {
        console.log("We can detect buttons!");
    }
    console.log("its a quiz interaction");

    console.log(interaction);
    console.log(interaction.options);

    // figure out which command was called
    const subcommand = interaction.options.getSubcommand(false);
    switch (subcommand) {
        case "create-quiz":
            handleCreateQuiz(interaction);
            break;
        case "create-question":
            handleCreateQuestion(interaction);
            break;
        case "create-answer":
            handleCreateAnswer(interaction);
            break;
        case "start":
            handleStartQuiz(interaction);
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

    // check if quiz exists, and add question if so
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

/** 
 * @param {CommandInteraction} interaction
 */
 async function handleCreateAnswer(interaction) {
    const title = interaction.options.get("quiz-title").value;
    const question = interaction.options.get("question").value;
    const answer = interaction.options.get("answer").value;

    // check if quiz exists
    let quizFound = false; 
    let quiz = null;
    for (const q of quizzes) {
        if (q.title === title) {
            quizFound = true;
            quiz = q;
            break;
        }
    }

    if (!quizFound) {
        await interaction.reply({content: `Quiz with title ${title} does not exist`, ephemeral: true});
        return;
    }

    // check if question exists, and add answer if so
    let questionFound = false;
    for (const q of quiz.questions) {
        if (q.question === question) {
            // check if max questions reached
            if (q.answers.length >= 4) {
                await interaction.reply({content: `Question has 4 answers already! Can't add more.`, ephemeral: true});
                break;
            }

            // add answer
            q.answers.push(answer);

            questionFound = true;
            break;
        }
    }

    if (!questionFound) {
        await interaction.reply({content: `Question ${question} in quiz ${title} does not exist`, ephemeral: true});
    } else {
        await interaction.reply({content: `Sucessfully added answer to ${question} in quiz ${title}.`, ephemeral: true});
    }

    return;
}

/** 
 * @param {CommandInteraction} interaction
 */
 async function handleStartQuiz(interaction) {
    // get title
    const title = interaction.options.get("quiz-title").value;

    // check if quiz exists, and add question if so
    let quizFound = false; 
    let quiz = null;
    for (const q of quizzes) {
        if (q.title === title) {
            quizFound = true;
            quiz = q;
            break;
        }
    }

    if (!quizFound) {
        await interaction.reply({content: `Quiz with title ${title} does not exist`, ephemeral: true});
        return;
    }

    // TODO: further validation?

    // do quiz 
    const row = new MessageActionRow();
    for (const answer of quiz.questions[0].answers) {
        row.addComponents(
            new MessageButton()
                .setCustomId('1')
                .setLabel(answer)
                .setStyle('PRIMARY'),
        );
    }
    

    await interaction.reply({ content: 'Quiz:', components: [row] });

    return;
}