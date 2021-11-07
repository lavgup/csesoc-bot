const { SlashCommandBuilder } = require("@discordjs/builders");
const { channel } = require("diagnostics_channel");
const path = require("path");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reminder")
        .setDescription("Set a reminder that anyone can opt to receive.")
        .addStringOption(option => option.setName('datetime').setDescription("Enter the time as YYYY-MM-DD HH:MM"))
        .addStringOption(option => option.setName('message').setDescription("Enter the reminder!")),
    async execute(interaction) {
        let re = /^\d{4}-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01]) ([01]\d|2[0-3]):([0-5]\d)$/;
        const datetime = interaction.options.getString('datetime');
        const message = interaction.options.getString('message');
        if (!re.test(datetime)) {
            await interaction.reply( { content: "One or more required fields were missing or incorrect!", ephemeral: true});
            return;
        };

        text = "Add any reaction to this post to receive the following reminder at " + datetime + ":\n\n" + message; 
        await interaction.reply({ content: text});
        const reply = await interaction.fetchReply();
        message_id = reply.id;
        console.log(message_id);
        const channel_id = interaction.channelId;

        var data = [message, message_id, channel_id, datetime];

        var fs = require('fs');
        fs.readFile(path.join(__dirname, '../data/reminders.json'), (err, jsonString) => {
            if (err) {
                console.log("Error reading file from disk:", err)
                return
            }
            else {
                const to_send = JSON.parse(jsonString);
                to_send.push(data);
                jsonData = JSON.stringify(to_send);
                fs.writeFile(path.join(__dirname, '../data/reminders.json'), jsonData, function(err) {
                    if (err) {
                        console.log(err);
                    }
                })
                
            }
        });

    },
};