import discord
from discord.ext import commands

from ruamel.yaml import YAML

yaml = YAML()


class Reputation(commands.Cog):
    """Handles giving and removing reputation points."""

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
            elif message.mentions:
                thanked_user = message.mentions[0]
            else:
                return

            if thanked_user is message.author:
                await message.channel.send("Nice try rep farmer!")
            elif thanked_user.bot:
                await message.channel.send("Can't give rep to bots :(")
            else:
                await ctx.invoke(self.bot.get_command("giverep"), user=thanked_user)

    @commands.has_permissions(administrator=True)
    @commands.command(brief="Gives reputation to a user")
    async def giverep(self, ctx, user: discord.User, amount=1):
        await ctx.send(
            f"Gave +{amount} Rep to {user.mention}",
            allowed_mentions=discord.AllowedMentions.none(),
        )

    @commands.has_permissions(administrator=True)
    @commands.command(brief="Takes reputation from a user")
    async def takerep(self, ctx, user: discord.User, amount=1):
        await ctx.send(
            f"Took -{amount} Rep from {user.mention}",
            allowed_mentions=discord.AllowedMentions.none(),
        )


def setup(bot):
    bot.add_cog(Reputation(bot))
