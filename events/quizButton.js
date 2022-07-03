const { handleQuizButton } = require("../lib/quiz/quizHelper");

module.exports = {
    once: false,
    name: "interactionCreate",
    execute(interaction) {
        if (!interaction.isButton()) return;
        handleQuizButton(interaction);
    }
}