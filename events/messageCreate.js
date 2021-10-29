const { thanksList } = require("../config/reputation.json");

module.exports = {
    name: "messageCreate",
    execute(message) {
        const messageWords = message.content.replace(/[^\w\s]/gi, "").toLowerCase().split(" ");

        if (!thanksList.some(thanks => messageWords.some(word => word.includes(thanks)))) {
            // If the message doesn't contain a thanks, don't do anything
            return;
        }

        message.mentions.users.forEach(user => {
            if (user !== message.author && !user.bot) {
                // TODO: Give rep to user

                message.channel.send({ content: `Gave +1 Rep to ${user.toString()}`, allowedMentions: { users: false } });
            }

        });
    },
};
