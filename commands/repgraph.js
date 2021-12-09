//@ts-check

const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { CommandInteraction, MessageAttachment } = require("discord.js");
const { Chart } = require("chart.js");
const seedrandom = require("seedrandom");
const fs = require("fs");
const canvas = require("canvas");
require("moment");
require("chartjs-adapter-moment");



// const userHistory = new SlashCommandSubcommandBuilder().setName("user").setDescription("History of a user")
// .addUserOption(option => option.setName("username").setDescription("The username").setRequired(true));

const baseCommand = new SlashCommandBuilder().setName("rephistory").setDescription("The history of rep")
    .addUserOption(option => option.setName("user").setDescription("An optional specified user"));


// these sizes get doubled because of devicePixelRatio = 2
const width = 800;
const height = 600;
const fontFamily = "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
const fontSize = 16;
// const backgroundColour = 'rgb(238, 251, 251)';
const backgroundColour = 'rgba(238, 251, 251, 0)';
const backgroundPlugin = {
    id: 'custom_canvas_background_color',
    beforeDraw: (chart) => {
        const ctx = chart.canvas.getContext('2d');
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = backgroundColour;
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
    }
};
const graphConfig = {
    type: 'scatter',
    options: {
        plugins: {
            legend: {
                display: true,
                labels: {
                    font: {size: fontSize},
                    boxWidth: fontSize,
                    boxHeight: fontSize,
                }
            }
        },
        scales: {
            x: {
                type: 'time', 
                time: {parser: "YYYY-MM-DD"},
                ticks: {
                    autoSkip: true,
                    maxTicksLimit: 10,
                    font: {size: fontSize},
                }
            }, 
            y: {
                beginAtZero: true,
                ticks: {
                    font: {size: fontSize},
                }
            }
        }, 
        elements: {
            point: {radius: 0}, 
            line: {tension: 0.2}
        },
        responsive: false,
        animation: false,
        devicePixelRatio: 2, // makes it so crisp, 1.5 might be better if it is too slow
    },
    plugins: [backgroundPlugin],
}





/** @param {CommandInteraction} interaction */
async function handle(interaction) {
    // check whether a user was given
    const user = interaction.options.getUser("user", false);
    let attachment = null;
    if (user != null) {
        // user was given
        attachment = await userBoard(user.id, interaction);
        // console.log(attachment);
        if (attachment == null) {
            return interaction.reply("Please give a valid user!");
        }
        await interaction.reply({ files: [attachment] });
    } else {
        // user wasnt given
        // defer the reply
        await interaction.deferReply();
        attachment = await overallBoard(interaction);
        if (attachment == null) {
            return interaction.editReply("Something went wrong!");
        }
        await interaction.editReply({ files: [attachment] });
    }
    
}


/** 
 * Generates a board for a specific user
 * @param {String} id
 * @param {CommandInteraction} interaction
 */
async function userBoard(id, interaction) {
    const user = await interaction.client.users.fetch(id);
    const userColor = snowflakeToRandRGB(id);

    // read the file
    let file;
    try {
        file = fs.readFileSync(`./data/rep_history/users/${id}.json`, "utf8");
    } catch {
        return null;
    }
    
    // user file was found, extract data
    const rawData = JSON.parse(file);
    const formattedData = [];
    for (const date in rawData) {
        formattedData.push({x: date, y: rawData[date]});
    }
    const data = {datasets: [{
        label: user.username, showLine: true, backgroundColor: userColor, borderColor: userColor, data: formattedData
    }]};

    // create graph
    const graphCanvas = canvas.createCanvas(width, height);
    const graphContext = graphCanvas.getContext('2d'); 
    const graph = new Chart(graphContext, {...graphConfig, data: data});

    // create background background
    const BGCanvas = canvas.createCanvas(graphCanvas.width + 150, graphCanvas.height + 150);
    const BGContext = BGCanvas.getContext('2d');
    const BG = await canvas.loadImage("./data/rep_history/singlebg.png");
    BGContext.drawImage(BG, 0, 0);

    // draw the graph onto the bg
    BGContext.drawImage(graphCanvas, 0, 150);

    const attachment = BGCanvas.toBuffer();    
    return attachment;
}

/** 
 * Generates a board for the top 10 over the past 30 days
 * @param {CommandInteraction} interaction
 */
async function overallBoard(interaction) {
    const currDate = new Date("2021-08-26");
    const thirtyDaysAgo = new Date(currDate);
    thirtyDaysAgo.setDate(currDate.getDate() - 30);
    console.log(currDate, thirtyDaysAgo);

    // read the file
    let file;
    try {
        file = fs.readFileSync(`./data/rep_history/years/${currDate.getFullYear()}.json`, "utf8");
    } catch {
        return null;
    }
    
    // year file was found, get the last 30 days of data
    const unfilteredData = JSON.parse(file);
    const rawData = [];
    for (let entry = 1; entry <= unfilteredData.length; entry++) {
        const currEntry = unfilteredData[unfilteredData.length - entry];
        const currEntryDate = new Date(Object.keys(currEntry)[0]);
        if (currEntryDate < thirtyDaysAgo) {
            // if its too old
            break;
        }

        // not too old, add it
        rawData.push(currEntry)
    }
    const firstPlace = Object.keys(Object.values(rawData[0])[0][0])[0]; // i hate this
    rawData.reverse();

    // setup the dataset for each user
    const usersData = {};
    for (const dataEntry of rawData) {
        // go through each top 10 entry
        const date = Object.keys(dataEntry)[0];
        const topTen = Object.values(dataEntry)[0];

        for (const userEntry of topTen) {
            // go through each user
            const userID = Object.keys(userEntry)[0];
            if (!(userID in usersData)) {
                // setup user dataset
                usersData[userID] = [];
            }

            // add the entry to the user
            usersData[userID].push({x: date, y: Object.values(userEntry)[0]});
        }
    }
    
    // transform this transformed data into the charts required format
    const datasets = [];
    for (const userID of Object.keys(usersData)) {
        let userObj = await interaction.client.users.fetch(userID);
        let userColor = String(userObj.hexAccentColor);
        if (userColor == "undefined") {
            userObj = await userObj.fetch(true);
            userColor = userObj.hexAccentColor;
        } else if (userColor == "null") {
            // const randomNum = seedrandom.xor4096(userID)(); // ok
            // const randomNum = seedrandom.xor128(userID)(); // better
            const randomNum = seedrandom.xorshift7(userID)(); // really good
            let hex = Math.floor(randomNum * 16777215).toString(16);
            hex = hex.padStart(6, "0")
            userColor = "#" + hex;
            // userColor = snowflakeToRandRGB(userID);
        }
        console.log(userObj.username, userID, userColor);

        datasets.push({
            label: userObj.username,
            showLine: true, 
            backgroundColor: userColor, 
            borderColor: userColor, 
            data: usersData[userID]
        });
    }

    // create graph
    const graphCanvas = canvas.createCanvas(width, height);
    const graphContext = graphCanvas.getContext('2d'); 
    const graph = new Chart(graphContext, {...graphConfig, data: {datasets: datasets}});

    // create background background
    const BGCanvas = canvas.createCanvas(graphCanvas.width + 150, graphCanvas.height + 150);
    const BGContext = BGCanvas.getContext('2d');
    const BG = await canvas.loadImage("./data/rep_history/singlebg.png");
    BGContext.drawImage(BG, 0, 0);

    // draw the graph onto the bg
    BGContext.drawImage(graphCanvas, 0, 150);

    // // paint the avatar of the leader on and their name
    // const firstPlaceUser = await interaction.client.users.fetch(firstPlace);
    // const avatarURL = firstPlaceUser.avatarURL({format: "png", size: 256});
    // const avatar = await canvas.loadImage(avatarURL);
    // context2.drawImage(avatar, canvasEle.width + 22 - 14, canvasEle.height / 2, 256, 256);

    // // write name
    // context2.font = `48px ${fontFamily}`
    // context2.fillStyle = "#666666";
    // context2.textAlign = "center";
    // context2.fillText(firstPlaceUser.username, canvasEle.width + 22 - 14 + 128, (canvasEle.height / 2) - 24, 256);

    const attachment = BGCanvas.toBuffer();
    return attachment;
}

function snowflakeToRandRGB(snowflake) {
    let binStr = (BigInt(snowflake) / BigInt(0xFFF)).toString(2); // mayb use 0xFF

    if (binStr.length < 24) {
        binStr = (Math.random() * 0xFFFFFF).toString(2);
    }

    const r = parseInt(binStr.slice(-25, -17), 2);
    const g = parseInt(binStr.slice(-17, -9), 2);
    const b = parseInt(binStr.slice(-9, -1), 2);

    return `rgb(${String(r)}, ${String(g)}, ${String(b)})`;
}


module.exports = {
    data: baseCommand,

    async execute(interaction) {
        await handle(interaction);
    },
};
