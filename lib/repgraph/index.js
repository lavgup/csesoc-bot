//@ts-check
const { DBRep } = require("../database/rep");
const seedrandom = require("seedrandom");
const fs = require("fs");
const { User } = require("discord.js");
const moment = require("moment");

class RepGraphStorage {
    constructor() {
        this.db = new DBRep();
        this.currDateStr = moment(new Date()).format("YYYY-MM-DD");
    }

    // updates the stored data
    async updateHistory() {
        const now = new Date();
        this.currDateStr = moment(now).format("YYYY-MM-DD");
        const rows = await this.db.get_rep_all();

        // first update each user
        for (const row of rows) {
            let data;
            try {
                const file = fs.readFileSync(`./data/rep_history/users/${row["userid"]}.json`, {encoding: "utf-8"});
                data = JSON.parse(file);
            } catch {
                data = {};
            }
            data[this.currDateStr] = row["rep"];
            fs.writeFileSync(`./data/rep_history/users/${row["userid"]}.json`, JSON.stringify(data), {encoding: "utf-8"});
        }

        // now update the top 10 file
        let data;
        const year = now.getFullYear();
        try {
            const file = fs.readFileSync(`./data/rep_history/years/${year}.json`, {encoding: "utf-8"});
            data = JSON.parse(file);
        } catch {
            data = [];
        }
        
        let entry = {}
        entry[this.currDateStr] = [];
        for (const row of rows.slice(0, 10)) {
            let user = {}
            user[row["userid"]] = row["rep"];
            entry[this.currDateStr].push(user);
        }
        data.push(entry);

        // save
        fs.writeFileSync(`./data/rep_history/years/${year}.json`, JSON.stringify(data, null, 1), {encoding: "utf-8"})
        
    }

    /** @param {User} userObj */
    async getUserGraphData(userObj) {
        const userID = userObj.id;
        const userColor = await this.userToRGB(userObj);
        const thirtyDaysAgo = new Date("2021-08-26");
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // read the file
        let file;
        try {
            file = fs.readFileSync(`./data/rep_history/users/${userID}.json`, {encoding: "utf-8"});
        } catch {
            return null;
        }
        const rawData = JSON.parse(file);
        const entries = Object.entries(rawData);
        entries.sort((a, b) => (new Date(b[0]).getTime()) - (new Date(a[0]).getTime())); // sort descending
        
        // user file was found, extract data
        const formattedData = [];
        for (const entry of entries) {
            const date = entry[0];
            const rep = entry[1];
            const dateObj = new Date(date);
            if (dateObj < thirtyDaysAgo) {
                break;
            }

            formattedData.push({x: date, y: rep});
        }

        // setup the dataset
        const datasets = [{
            label: userObj.username, showLine: true, backgroundColor: userColor, borderColor: userColor, data: formattedData
        }]

        return datasets;
    }

    async getTopGraphData(interaction) {
        const currDate = new Date("2021-08-26");
        const thirtyDaysAgo = new Date(currDate);
        thirtyDaysAgo.setDate(currDate.getDate() - 30);

        // read the file
        let file;
        try {
            file = fs.readFileSync(`./data/rep_history/years/${currDate.getFullYear()}.json`, {encoding: "utf-8"});
        } catch {
            return null;
        }
        const unfilteredData = JSON.parse(file);
        
        // year file was found, get the last 30 days of data, and amalgamate the users data
        const usersData = {};
        for (let i = 1; i <= unfilteredData.length; i++) {
            const entry = unfilteredData[unfilteredData.length - i];
            const entryDateStr = Object.keys(entry)[0];
            const entryDateObj = new Date(entryDateStr);
            const entryTopTen = entry[entryDateStr];
            if (entryDateObj < thirtyDaysAgo) {
                // if its too old
                break;
            }

            // not too old, add it to the users
            for (const user of entryTopTen) {
                const userID = Object.keys(user)[0];
                const userRep = user[userID];
                if (!(userID in usersData)) {
                    usersData[userID] = []
                }
                usersData[userID].push({x: entryDateStr, y: userRep})
            }
        }
        
        // transform this transformed data into the charts required format
        const datasets = [];
        for (const userID in usersData) {
            let userObj = await interaction.client.users.fetch(userID);
            const userColor = await this.userToRGB(userObj);

            datasets.push({
                label: userObj.username, showLine: true, backgroundColor: userColor, borderColor: userColor, data: usersData[userID]
            });
        }

        return datasets;
    }

    // gets rgb value for a user
    async userToRGB(userObj) {
        // console.log(userObj);
        let userColor = String(userObj.hexAccentColor);
        if (userColor == "undefined") {
            userObj = await userObj.fetch(true);
            userColor = userObj.hexAccentColor;
        } else if (userColor == "null") {
            // const randomNum = seedrandom.xor4096(userID)(); // ok
            // const randomNum = seedrandom.xor128(userID)(); // better
            const randomNum = seedrandom.xorshift7(userObj.id)(); // really good
            let hex = Math.floor(randomNum * 16777215).toString(16);
            hex = hex.padStart(6, "0")
            userColor = "#" + hex;
        }
        return userColor;
    }
}

module.exports = {
    RepGraphStorage
}