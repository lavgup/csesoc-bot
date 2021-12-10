//@ts-check

const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { CommandInteraction, MessageAttachment, User } = require("discord.js");
const { Chart } = require("chart.js");
const seedrandom = require("seedrandom");
const fs = require("fs");
const canvas = require("canvas");
const { RepGraphStorage } = require("../lib/repgraph");
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
                // beginAtZero: true,  // DEBUG MIGHT TURN BACK ON
                ticks: {
                    font: {size: fontSize},
                }
            }
        }, 
        elements: {
            point: {radius: 0}, 
            line: {tension: 0.2}
        },
        aspectRatio: width / height,
        responsive: false,
        animation: false,
        devicePixelRatio: 2, // makes it so crisp, 1.5 might be better if it is too slow
    },
    plugins: [backgroundPlugin],
}





/** @param {CommandInteraction} interaction */
async function handle(interaction) {
    const rgStorage = global.rgStorage

    // check whether a user was given
    const user = interaction.options.getUser("user", false);
    let attachment = null;
    if (user != null) {
        // user was given
        attachment = await userBoard(user, interaction, rgStorage);
        // console.log(attachment);
        if (attachment == null) {
            return interaction.reply("Please give a valid user!");
        }
        await interaction.reply({ files: [attachment] });
    } else {
        // user wasnt given
        // defer the reply
        await interaction.deferReply();
        attachment = await overallBoard(interaction, rgStorage);
        if (attachment == null) {
            return interaction.editReply("Something went wrong!");
        }
        await interaction.editReply({ files: [attachment] });
    }
    
}


/** 
 * Generates a board for a specific user
 * @param {User} user
 * @param {CommandInteraction} interaction
 * @param {RepGraphStorage} rgStorage
 */
async function userBoard(user, interaction, rgStorage) {
    const datasets = await rgStorage.getUserGraphData(user);

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

    const attachment = BGCanvas.toBuffer();    
    return attachment;
}

/** 
 * Generates a board for the top 10 over the past 30 days
 * @param {CommandInteraction} interaction
 * @param {RepGraphStorage} rgStorage
 */
async function overallBoard(interaction, rgStorage) {
    const datasets = await rgStorage.getTopGraphData(interaction);

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


module.exports = {
    data: baseCommand,

    async execute(interaction) {
        await handle(interaction);
    },
};
