const { Permissions } = require("discord.js");
const fs = require('fs');

module.exports = {
    name: "messageCreate",
    async execute(message) {
        if (message.content.startsWith("$configMemeGenerator")) {
            const messageContent = String(message.content);
            const data = messageContent.split('\n');
            
            if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
                return await message.reply("You do not have permission to execute this command.");
            }
            if (data.length != 3) {
                return await message.reply("Usage:\n$configMemeGenerator\nusername\npassword")
            }

            fs.writeFileSync("./config/memegenerator.json", JSON.stringify({ username: data[1], password: data[2] }, null, 4));
        }
    }
}
