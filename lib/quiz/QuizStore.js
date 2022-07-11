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
    
        this.quizzes.push({title: title, questions: [], currQuestion: 0, playerScores: []});
        await interaction.reply({content: `Sucessfully created quiz with title ${title}`, ephemeral: true});
    }

    /** 
     * @param {CommandInteraction} interaction
     */
    async createQuestion(interaction) {
        
        const title = interaction.options.get("quiz-title").value;
        const question = interaction.options.get("question").value;
        const isMultChoice = interaction.options.get("is-mult-choice").value;

        // check if quiz exists, and add question if so
        let quizFound = false; 
        for (const quiz of this.quizzes) {
            if (quiz.title === title) {
                quizFound = true;
                quiz.questions.push({
                    "question": question,
                    "answers" : [],
                    "isMultChoice": isMultChoice,
                    "playerAnswers": [] 
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
        const isCorrect = interaction.options.get("is-correct").value;

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
                q.answers.push({answer: answer, isCorrect: isCorrect});

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
        let quizId = 0;
        for (const q of this.quizzes) {
            if (q.title === title) {
                quizFound = true;
                quiz = q;
                break;
            }
            quizId++;
        }

        if (!quizFound) {
            await interaction.reply({content: `Quiz with title ${title} does not exist`, ephemeral: true});
            return;
        }

        // TODO: further validation?

        // do quiz 
        const row = new MessageActionRow();
        let i = 0;
        for (const answer of quiz.questions[quiz.currQuestion].answers) {
            row.addComponents(
                new MessageButton()
                    .setCustomId('quiz:'+ quizId + ":" + quiz.currQuestion+':'+i)
                    .setLabel(answer.answer)
                    .setStyle('PRIMARY'),
            );
            i++;
        }

        await interaction.reply({ content: 'Quiz:', components: [row] });

        // 20 sec timeout
        setTimeout(this.displayLeaderboard(quizId), 20000);

        return;
    }

    async addPlayerAnswer(interaction) {
        const buttonInfo = interaction.customId.split(":");

        const quizId = buttonInfo[1];
        const questionId = buttonInfo[2];
        const answerId = buttonInfo[3];
        const userId = interaction.user.id; 
        const username = interaction.user.username;

        // TODO: need to account for multiple-choice questions now...
        let playerHasAnswered = false;
        for (const playerAnswer of this.quizzes[quizId].questions[questionId].playerAnswers) {
            if (playerAnswer.userId == userId) {
                playerHasAnswered = true;
                playerAnswer.answerId = answerId;
            }
        }

        if (!playerHasAnswered) {
            // add player's answer
            this.quizzes[quizId].questions[questionId].playerAnswers.push(
                {answerId: answerId, userId: userId, username: username}
            );
        }

        await interaction.reply({
            content: username + " selected answer " + answerId, 
            ephemeral: true
        });
    }

    async displayLeaderboard(quizId) {
        // re-calc player scores based on answer to current question 
        // to do this, get id(s) of correct question(s) and compare
        // them to the player answer ids 
        const currQuestionId = this.quizzes[quizId].currQuestion;
        const currQuestion = this.quizzes[quizId].questions[currQuestionId];
        let correctAnswerIds = [];
        let i = 0;
        for (const ans of currQuestion.answers) {
            if (ans.isCorrect) {
                correctAnswerIds.push(i);
            }
            i++;
        }

        
        for (const playerAnswer of currQuestion.playerAnswers) {
            // length of answers must be the same
            if (playerAnswer.length != correctAnswerIds.length) continue;

            // assuming length of answers is the same, we only need 
            // one "wrong" answer for the player to be wrong
            let playerWrong = false;
            for (const answerId of correctAnswerIds) {
                if (!correctAnswerIds.includes(playerAnswer.answerId)) {
                    playerWrong = true;
                    break;
                }
            }

            // TODO: make this...look nicer?
            if (!playerWrong) {
                // add points for the question 
                // TODO: stop hardcoding points?
                let playerScoreFound = false; 
                for (let playerScore of this.quizzes[quizId].playerScores) {
                    if (playerAnswer.userId === playerScore.userId) {
                        playerScore.score += 100;
                        playerScoreFound = true; 
                        break;
                    }
                    if (!playerScoreFound) {
                        // create obj
                        this.quizzes[quizId].playerScores.push({
                            userId: playerAnswer.userId, 
                            score: 100
                        });
                    }
                }
            } else {
                for (let playerScore of this.quizzes[quizId].playerScores) {
                    let playerScoreFound = false; 
                    if (playerAnswer.userId === playerScore.userId) {
                        playerScoreFound = true; 
                        break;
                    }
                    if (!playerScoreFound) {
                        // create obj
                        this.quizzes[quizId].playerScores.push({
                            userId: playerAnswer.userId, 
                            score: 0
                        });
                    }
                }
            }
        }

        


        // display leadboard 
        let leaderboard = "";
        for (const playerAnswer of currQuestion.playerScores) {
            leaderboard += playerAnswer.username + " has " + playerAnswer.score + " points.\n";
        }
        await interaction.reply(leaderboard);

        // set timeout to display next question! 
        
    }

}

module.exports = {QuizStore};