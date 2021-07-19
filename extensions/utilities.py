from discord.ext import commands

class Utilities(commands.Cog):
    """Provides utility commands for server management."""

    def __init__(self,bot):
        self.bot = bot


    @commands.command(brief = "Sends a message to a specified channel")
    @commands.has_permissions(administrator=True)
    async def sendmsg(self,ctx, channel, *, message_data = None):
        
        if message_data is None:
            await ctx.send(f"Usage: `{self.bot.command_prefix}sendmsg [#channel] [message]`")
            
            return


        try:
            channel_mentions = ctx.message.channel_mentions
            
            send_channel = channel_mentions[0]
            await send_channel.send(message_data)
        except:
            await ctx.send("Invalid channel.")

def setup(bot):
    bot.add_cog(Utilities(bot))