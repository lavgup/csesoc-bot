// import fs module where writeFile function is defined
const fsLibrary = require('fs')
const Discord = require('discord.js');

module.exports = {

    name: "interactionCreate",
    once: false,
    async execute(interaction) {
        const message = interaction.message
        const user = interaction.options.getUser('target');
        // if it is not a command, log the user command error
        if (!interaction.isCommand()) {
            await fsLibrary.writeFile('command_error_log.txt', "Logs command errors entered in the CSE discord channel", (error) => {
        
                // in case of error throw err exception
                if (error) throw err
            });

            let log = `${Date.now()} - ${user.id} typed incorrect command "${message.content}" in "${message.channelId}"`
            
            // add new logged message into message_log file
            await fsLibrary.appendFile('command_error_log.txt', log)
        }
        else {
            let log = `${Date.now()} - ${user.id} typed command "${message.content}" in "${message.channelId}"`
                
            // add new logged message into message_log file
            await fsLibrary.appendFile('interaction_create_log.txt', log)
        }
    }

};
