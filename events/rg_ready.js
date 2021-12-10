const { RepGraphStorage } = require("../lib/repgraph");

module.exports = {
    name: "ready",
    once: true,
    async execute(client) {
        const rgStorage = new RepGraphStorage(client);
        global.rgStorage = rgStorage;
        await rgStorage.db.setup_table();

        // setup the schedule
        // await rgStorage.updateHistory();
        // schedule
    },
};