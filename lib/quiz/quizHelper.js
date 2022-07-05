// TODO: implement
// TODO: docstring
async function handleQuizButton(interaction) {
    if (!interaction.isButton()) return;

    const quizStore = global.quizStore;

    console.log(interaction.customId);
    const buttonInfo = interaction.customId.split(":");
    // confirm that this was a quiz button
    if (buttonInfo[0] !== "quiz") {
        console.log("This was not a quiz button! Returning...")
        return; 
    }

    quizStore.addPlayerAnswer(interaction);

 }

module.exports = {
    handleQuizButton
};