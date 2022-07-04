const { MessageActionRow, MessageButton } = require("discord.js");

class QuizStore {
    constructor() {
        this.quizzes = [];
    }
    
    /** 
     * @param {CommandInteraction} interaction
     */
    async createQuiz(interaction) {
        // get title
        const title = interaction.options.get("title").value;

        for (const quiz of this.quizzes) {
            if (quiz.title === title) {
                await interaction.reply({content: "ERROR: Quiz already exists", ephemeral: true});
                return;
            }
        }
    
        this.quizzes.push({title: title, questions: []});
        await interaction.reply({content: `Sucessfully created quiz with title ${title}`, ephemeral: true});
    }

    /** 
     * @param {CommandInteraction} interaction
     */
    async createQuestion(interaction) {
        
        const title = interaction.options.get("quiz-title").value;
        const question = interaction.options.get("question").value;

        // check if quiz exists, and add question if so
        let quizFound = false; 
        for (const quiz of this.quizzes) {
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
    async createAnswer(interaction) {
        const title = interaction.options.get("quiz-title").value;
        const question = interaction.options.get("question").value;
        const answer = interaction.options.get("answer").value;

        // check if quiz exists
        let quizFound = false; 
        let quiz = null;
        for (const q of this.quizzes) {
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
    async startQuiz(interaction) {
        // get title
        const title = interaction.options.get("quiz-title").value;

        // check if quiz exists, and add question if so
        let quizFound = false; 
        let quiz = null;
        for (const q of this.quizzes) {
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

}

module.exports = {QuizStore};