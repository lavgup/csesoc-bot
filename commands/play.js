const { MessageEmbed } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { Player } = require("discord-music-player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Song guessing game!")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("snippet")
        .setDescription("Play a snippet of a song")
        .addStringOption((option) =>
          option
            .setName("link")
            .setDescription("Link to a Spotify song or playlist")
        )
        .addStringOption((option) =>
          option
            .setName("difficulty")
            .setDescription("Easy, Medium, Hard; default = Medium")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("guess")
        .setDescription("Guess the song snippet that was played")
        .addStringOption((option) =>
          option
            .setName("songname")
            .setDescription(
              "What is the name of the song that was just played?"
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("next").setDescription("Play the next snippet.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("repeat")
        .setDescription("Repeat the previous snippet.")
    ),
  async execute(interaction) {
    if (interaction.options.getSubcommand() === "snippet") {
      const vc_channel = interaction.member.voice.channel;
      let link = await interaction.options.getString("link");
      let difficulty = await interaction.options.getString("difficulty");
      const text_channel_id = interaction.channelId;
      const text_channel =
        interaction.client.channels.cache.get(text_channel_id);

      if (vc_channel) {
        const client = interaction.client;

        const player = new Player(client, {
          deafenOnJoin: true,
        });

        client.player = player;

        let queue = client.player.createQueue(interaction.guild.id);
        await queue.join(vc_channel);

        if (!link) {
          link =
            "https://open.spotify.com/playlist/37i9dQZF1DWUa8ZRTfalHk?si=c986438d36a245ff";
        }

        if (link.includes("track")) {
          queue.play(link).then(() =>
            text_channel.send({
              embeds: [
                new MessageEmbed()
                  .setColor("#C492B1")
                  .setDescription("Playing a snippet..."),
              ],
            })
          );
        } else if (link.includes("playlist")) {
          queue.playlist(link);
          interaction.reply({
            embeds: [
              new MessageEmbed()
                .setColor("#C492B1")
                .setDescription("Playing a snippet..."),
            ],
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            embeds: [
              new MessageEmbed()
                .setColor("#C492B1")
                .setDescription(
                  ":x: You must provide a Spotify song or playlist!"
                ),
            ],
          });
        }

        var playtime = 1000;

        // Default difficulty
        if (!difficulty) {
          difficulty = "medium";
        }

        difficulty = difficulty.toLowerCase();
        if (difficulty === "easy") {
          playtime = playtime * 32;
        } else if (difficulty === "medium") {
          playtime = playtime * 22;
        } else if (difficulty === "hard") {
          playtime = playtime * 12;
        } else {
          await interaction.reply({
            embeds: [
              new MessageEmbed()
                .setColor("#C492B1")
                .setDescription(
                  ":x: Please enter a valid difficulty - easy, medium or hard."
                ),
            ],
          });
        }

        setTimeout(function () {
          queue.setPaused(true);
          text_channel.send({
            embeds: [
              new MessageEmbed()
                .setColor("#C492B1")
                .setDescription("Guess the song!"),
            ],
          });
        }, playtime);
      } else {
        await interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor("#C492B1")
              .setDescription(":x: You must be in a voice channel first!"),
          ],
        });
      }
    } else if (interaction.options.getSubcommand() === "guess") {
      if (!interaction.client.player) {
        await interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor("#C492B1")
              .setDescription(
                ":x: Play a snippet first using /play snippet [link] in order to guess the song!"
              ),
          ],
        });
      } else if (
        !interaction.client.player.getQueue(interaction.guild.id).paused
      ) {
        await interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor("#C492B1")
              .setDescription(
                ":x: Please wait until the snippet has finished playing."
              ),
          ],
        });
      } else {
        const nowPlaying = interaction.client.player.getQueue(
          interaction.guild.id
        ).nowPlaying;

        if (!nowPlaying) {
          await interaction.reply({
            embeds: [
              new MessageEmbed()
                .setColor("#C492B1")
                .setDescription(
                  ":x: Play a snippet first using /play snippet [link] in order to guess the song!"
                ),
            ],
          });
        }

        const name = nowPlaying.name.toLowerCase();

        const guess = await interaction.options.getString("songname");

        let res = "";
        name.includes(guess.toLowerCase())
          ? (res = res.concat("Correct!\n"))
          : (res = res.concat("Incorrect :(\n"));

        await interaction.reply({
          embeds: [new MessageEmbed().setColor("#C492B1").setDescription(res)],
        });
      }
    } else if (interaction.options.getSubcommand() === "next") {
      if (!interaction.client.player) {
        interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor("#C492B1")
              .setDescription(
                ":x: Use /play snippet [link] to add songs to the queue."
              ),
          ],
        });
      } else {
        const queue = interaction.client.player.getQueue(interaction.guild.id);
        if (queue.songs.length >= 1) {
          queue.skip();
          queue.setPaused(false);

          setTimeout(function () {
            queue.setPaused(true);
          }, 1000 * 10);
        } else {
          await interaction.reply({
            embeds: [
              new MessageEmbed()
                .setColor("#C492B1")
                .setDescription(
                  ":x: There are no more songs queued, use /play snippet [link] to add another!"
                ),
            ],
          });
        }
      }
    } else if (interaction.options.getSubcommand() === "repeat") {
      if (!interaction.client.player) {
        interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor("#C492B1")
              .setDescription(
                ":x: Use /play snippet [link] to add songs to the queue."
              ),
          ],
        });
      } else {
        const queue = interaction.client.player.getQueue(interaction.guild.id);
        if (queue.paused) {
          queue.seek(0);
          queue.setPaused(false);
          setTimeout(function () {
            queue.setPaused(true);
          }, 1000 * 10);
        } else {
          await interaction.reply({
            embeds: [
              new MessageEmbed()
                .setColor("#C492B1")
                .setDescription(
                  ":x: You must wait until the snippet is finished before repeating it."
                ),
            ],
          });
        }
      }
    }
  },
};
