const path = require("path");
const fs = require('fs');


module.exports = {
    name: "ready",
    once: true,
    execute(client) {
        let timer = setInterval(function() {
            fs.readFile(path.join(__dirname, '../data/reminders.json'), (err, jsonString) => {
                if (err) {
                    console.log("Error reading file from disk:", err)
                    return
                }
                else {
                    const to_send = JSON.parse(jsonString);
                    to_send.forEach(function (item, index) {
                        send_time = new Date(item[3]);
                        var today = new Date();
                        now_time = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours(), today.getMinutes(), 0);
                        
                        
                        if (now_time - send_time == 0) {
                            var reactors = new Set();

                            text = item[0];
                            message_id = item[1];
                            channel_id = item[2];
                            send_channel = client.channels.cache.get(channel_id);

                            send_channel.messages.fetch(message_id).then(message => {
                                message.reactions.cache.forEach(
                                    reaction => {reaction.users.fetch().then(
                                        user_list => {
                                            user_list.forEach(
                                                user => {
                                                    if (!reactors.has(user.id)) {
                                                        client.users.cache.get(user.id).send(text);
                                                        reactors.add(user.id);
                                                    }
                                                }
                                            )
                                        }
                                    )}
                                )}
                             );
                        };
                    });

                }
            });
            
        }, 1000 * 60)
    },
};
