const { MessageEmbed } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { Player } = require("discord-music-player");
const path = require("path");
const fs = require("fs");
const fuzzy = require("fuzzy.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("song")
    .setDescription("Song guessing game!")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("snippet")
        .setDescription("Play a snippet of a song")
        .addStringOption((option) =>
          option
            .setName("link")
            .setDescription(
              "Link to a YouTube song or playlist. Leave this empty for a default playlist."
            )
        )
        .addStringOption((option) =>
          option
            .setName("difficulty")
            .setDescription(
              "Choose between easy (30s snippet), medium (20s) and hard (10s); default = medium."
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("guess")
        .setDescription("Guess the name of the song snippet that was played.")
        .addStringOption((option) =>
          option
            .setName("songname")
            .setDescription(
              "What is the name of the song that was just played?"
            )
            .setRequired(true)
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

        // Default playlist
        if (!link) {
          link =
            "https://www.youtube.com/playlist?list=PLDIoUOhQQPlXr63I_vwF9GD8sAKh77dWU";
        }

        if (link.includes("youtube") || link.includes("youtu.be")) {
          if (link.includes("playlist")) {
            queue.playlist(link);
            interaction.reply({
              embeds: [
                new MessageEmbed()
                  .setColor("#C492B1")
                  .setDescription("Playing a snippet"),
              ],
              ephemeral: true,
            });
          } else {
            link.includes("?t=")
              ? queue.play(link, { timecode: true })
              : queue.play(link);

            interaction.reply({
              embeds: [
                new MessageEmbed()
                  .setColor("#C492B1")
                  .setDescription("Playing a snippet"),
              ],
              ephemeral: true,
            });
          }
        } else {
          await interaction.reply({
            embeds: [
              new MessageEmbed()
                .setColor("#C492B1")
                .setDescription(
                  ":x: You must provide a YouTube song or playlist, or leave the `link` field empty for a default playlist."
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
          playtime = playtime * 37;
        } else if (difficulty === "medium") {
          playtime = playtime * 27;
        } else if (difficulty === "hard") {
          playtime = playtime * 17;
        } else {
          await interaction.reply({
            embeds: [
              new MessageEmbed()
                .setColor("#C492B1")
                .setDescription(
                  ":x: Please enter a valid difficulty - easy, medium or hard, or leave the `diffculty` field empty."
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
                .setDescription(
                  "Guess the song using `/song guess [songname]` command!"
                ),
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
                ":x: Play a snippet first using `/song snippet [link]` in order to start guessing songs!"
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
                ":x: Please wait until the snippet has finished playing before guessing."
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
                  ":x: Play a snippet first using `/song snippet [link]` in order to start guessing songs!"
                ),
            ],
          });
        }

        const name = nowPlaying.name.toLowerCase();

        const guess = await interaction.options.getString("songname");

        let res = "";
        fuzzy.analyzeSubTerms = false;
        var match = fuzzy(name, guess.toLowerCase());

        name.includes(guess.toLowerCase()) && match.score > name.length / 3
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
              .setDescription(":x: There are no songs in the queue."),
          ],
        });
      } else {
        const queue = interaction.client.player.getQueue(interaction.guild.id);
        if (queue.songs.length > 1) {
          queue.skip();
          queue.setPaused(false);

          setTimeout(function () {
            queue.setPaused(true);
          }, 1000 * 20);
        } else {
          await interaction.reply({
            embeds: [
              new MessageEmbed()
                .setColor("#C492B1")
                .setDescription(
                  ":x: There are no more songs queued, use `/song snippet [link]` to add more!"
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
              .setDescription(":x: There are no songs in the queue."),
          ],
        });
      } else {
        const queue = interaction.client.player.getQueue(interaction.guild.id);
        if (queue.paused) {
          queue.seek(0);
          queue.setPaused(false);
          setTimeout(function () {
            queue.setPaused(true);
          }, 1000 * 20);
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
