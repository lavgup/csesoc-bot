const { MessageEmbed, InteractionCollector } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { Player } = require("discord-music-player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Song guessing")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("snippet")
        .setDescription("Play a snippet of a song")
        .addStringOption((option) =>
          option
            .setName("link")
            .setDescription("Link to a Spotify song or playlist")
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
      const link = await interaction.options.getString("link");
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
          await queue.playlist(link);
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

        setTimeout(function () {
          queue.setPaused(true);
          text_channel.send({
            embeds: [
              new MessageEmbed()
                .setColor("#C492B1")
                .setDescription("Guess the song!"),
            ],
          });
        }, 1000 * 12);
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
