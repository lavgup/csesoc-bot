const {QuizStore} = require("../lib/quiz/QuizStore");

module.exports = {
    name: "ready",
    once: true,
    async execute(client) {
        const quizStore = new QuizStore();
        global.quizStore = quizStore;
    },
};