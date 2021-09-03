import discord
from discord.ext import commands

from ruamel.yaml import YAML

yaml = YAML()


class Reputation(commands.Cog):
    """Handles giving, removing and displaying reputation."""

    def __init__(self, bot):
        self.bot = bot

        self.settings_file = "./data/config/reputation.yml"

        # Load settings file and set variables
        with open(self.settings_file) as file:
            settings = yaml.load(file)

        self.thanks_list = settings["thanks_list"]

    @commands.Cog.listener()
    async def on_message(self, message):
        ctx = await self.bot.get_context(message)

        message_lower_words = message.content.lower().split(" ")

        if any(thanks in message_lower_words for thanks in self.thanks_list):
            if message.reference:
                thanked_message = await ctx.fetch_message(message.reference.message_id)
                thanked_user = thanked_message.author

                if thanked_user is not ctx.message.author:
                    await ctx.invoke(self.bot.get_command("giverep"), user=thanked_user)

            elif message.mentions:
                for thanked_user in message.mentions:
                    if thanked_user is not ctx.message.author:
                        await ctx.invoke(
                            self.bot.get_command("giverep"), user=thanked_user
                        )

    @commands.has_permissions(administrator=True)
    @commands.command(brief="Gives reputation to a user")
    async def giverep(self, ctx, user: discord.User, amount=1):
        # TODO: Save to database
        await ctx.send(
            f"Gave +{amount} Rep to {user.mention}",
            allowed_mentions=discord.AllowedMentions.none(),
        )

    @commands.has_permissions(administrator=True)
    @commands.command(brief="Takes reputation from a user")
    async def takerep(self, ctx, user: discord.User, amount=1):
        # TODO: Save to database
        await ctx.send(
            f"Took -{amount} Rep from {user.mention}",
            allowed_mentions=discord.AllowedMentions.none(),
        )

    # TODO: Write function after saving to database
    @commands.command(brief="Displays a leaderboard of users with the most reputation")
    async def toprep(self, ctx):
        pass


def setup(bot):
    bot.add_cog(Reputation(bot))
