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
                            console.log('match');
                            send_channel.messages.fetch(message_id).then(message => {
                                reactors.add(1);
                                message.reactions.cache.forEach(
                                    reaction => {reaction.users.fetch().then(
                                        user_list => {
                                            user_list.forEach(user => {
                                                console.log(user.id);
                                                reactors.add(user.id);
                                            })
                                        }
                                    )}
                                )}
                             );
                            
                            reactors.forEach(user => {
                                console.log(user);
                            })
                            
                            // async fetchMessage(message_id) {
                            //     let message = await send_channel.messages.fetch()
                            // }



                            // const text = message.contents;
                            // console.log(message);
                            // send_channel = client.channels.cache.get(channel_id);
                            // send_channel.send(message);
                        };
                    });

                }
            });
            
        }, 1000 * 5)
    },
};
