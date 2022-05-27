const { SlashCommandBuilder } = require("@discordjs/builders");
const paginationEmbed = require("discordjs-button-pagination");
const { MessageEmbed, MessageButton } = require("discord.js");
const { fetch, request } = require("undici");

const username = 'SOME-USERNAME-HERE';
const password = 'SOME-PASSWORD-HERE';

module.exports = {
    data: new SlashCommandBuilder()
        .setName("memegenerate")
        .setDescription("Create your own meme using templates from Imgflip")
        .addSubcommand(subcommand =>
            subcommand
                .setName("list")
                .setDescription("Lists the top 100 most popular memes from Imgflip and their ID"))
        .addSubcommand(subcommand =>
            subcommand
                .setName("check")
                .setDescription("Check the format of a meme")
                .addIntegerOption(option => option.setName("id").setDescription("Enter the ID of the meme you want to check").setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName("create")
                .setDescription("Create your own meme using an Imgflip ID")
                .addIntegerOption(option => option.setName("id").setDescription("Enter the ID of the meme you want to create").setRequired(true))
                .addStringOption(option => option.setName("text1").setDescription("Text box 1"))
                .addStringOption(option => option.setName("text2").setDescription("Text box 2"))
                .addStringOption(option => option.setName("text3").setDescription("Text box 3"))
                .addStringOption(option => option.setName("text4").setDescription("Text box 4"))
                .addStringOption(option => option.setName("text5").setDescription("Text box 5")))
        ,
    
    async execute(interaction) {

        // Helper function to convert returned JSON string to an object in GET request
        async function getJSONResponse(body) {
            let fullBody = '';

            for await (const data of body) {
                fullBody += data.toString();
            }
            
            const returnObject = JSON.parse(fullBody);
            return returnObject.data.memes;
        }

        if (interaction.options.getSubcommand() === "list") {

            // Send API request to get the list of memes
            const url = "https://api.imgflip.com/get_memes"
            const memeListResult = await request(url);
            const memeList = await getJSONResponse(memeListResult.body);

            const totalMemes = memeList.length; // should be 100
            const memesPerPage = 10;
            
            // List all the memes in embeds
            const embedList = [];
            for (let i = 0; i < totalMemes; i += memesPerPage) {
                const curPage = [];
                curPageMemes = memeList.slice(i, i + memesPerPage);

                for (const curMeme of curPageMemes) {
                    const id = curMeme.id;
                    const name = curMeme.name;
                    const box_count = curMeme.box_count;

                    // Should probably put them in columns or something
                    curPage.push(`${name}, ID: ${id}, Box Count: ${box_count}`);
                }

                embedList.push(
                    new MessageEmbed()
                        .setTitle("Imgflip memes")
                        .setDescription(curPage.join("\n")),
                );
            }
            
            // Set the Next and Previous buttons
            const buttonList = [
                new MessageButton()
                    .setCustomId("previousbtn")
                    .setLabel("Previous")
                    .setStyle("DANGER"),
                new MessageButton()
                    .setCustomId("nextbtn")
                    .setLabel("Next")
                    .setStyle("SUCCESS"),
            ];

            return paginationEmbed(interaction, embedList, buttonList);

        } else if (interaction.options.getSubcommand() === "check") {
            const id = await interaction.options.getInteger("id");

            // Find the number of boxes in the meme
            const url1 = "https://api.imgflip.com/get_memes"
            const memeListResult = await request(url1);
            const memeList = await getJSONResponse(memeListResult.body);
            for (const meme of memeList) {
                if (meme.id == id) {
                    var box_count = meme.box_count;
                    break;
                }
            }
            
            // Label the positions of the boxes if they exist
            const query = new URLSearchParams({ 
                template_id: id,
                username: username,
                password: password,
                'boxes[0][text]': 1,
                'boxes[1][text]': 2 <= box_count ? 2 : ' ',
                'boxes[2][text]': 3 <= box_count ? 3 : ' ',
                'boxes[3][text]': 4 <= box_count ? 4 : ' ',
                'boxes[4][text]': 5 <= box_count ? 5 : ' ',
            })

            // Settings for the request
            const url2 = `https://api.imgflip.com/caption_image?${query}`;
            const config = {
                method: "POST",
                headers: {
                    'content-type': 'application/json'
                },
            }

            // Send a POST request to generate the meme
            const rsp = await fetch(url2, config);
            const json = await rsp.json();
            console.log(rsp.status, json);
            
            // Error checking for not success
            if (!json.success) {
                error = json.error_message;
                console.log(json.error_message);
                return await interaction.reply( { content: 'Error: ' + error, ephemeral: true } );
            }

            memeLink = json.data.url;
            return await interaction.reply(memeLink);

        } else if (interaction.options.getSubcommand() === "create") {

            // Get all the input from the user
            const id = await interaction.options.getInteger("id");
            let text0 = await interaction.options.getString("text1");
            let text1 = await interaction.options.getString("text2");
            let text2 = await interaction.options.getString("text3");
            let text3 = await interaction.options.getString("text4");
            let text4 = await interaction.options.getString("text5");

            // Convert to empty strings if nothing was entered
            text0 = text0 ? text0 : ' ';
            text1 = text1 ? text1 : ' ';
            text2 = text2 ? text2 : ' ';
            text3 = text3 ? text3 : ' ';
            text4 = text4 ? text4 : ' ';

            const query = new URLSearchParams({ 
                template_id: id,
                username: username,
                password: password,
                'boxes[0][text]': text0,
                'boxes[1][text]': text1,
                'boxes[2][text]': text2,
                'boxes[3][text]': text3,
                'boxes[4][text]': text4,
            })
            
            // Settings for the request
            const url = `https://api.imgflip.com/caption_image?${query}`;
            const config = {
                method: "POST",
                headers: {
                    'content-type': 'application/json'
                },
            }
            
            // Send the POST request
            const rsp = await fetch(url, config);
            const json = await rsp.json();
            console.log(rsp.status, json);
            
            // Error checking for not success
            if (!json.success) {
                error = json.error_message;
                console.log(json.error_message);
                return await interaction.reply( { content: 'Error: ' + error, ephemeral: true } );
            }

            memeLink = json.data.url;
            return await interaction.reply(memeLink);
        }
    }
}