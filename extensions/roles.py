import discord
from discord.ext import commands
from ruamel.yaml import YAML

import yaml
import asyncio

# Load settings file and set variables
with open('./config/roles.yml') as file:
    settings = yaml.full_load(file)

yaml = YAML()

class Roles(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

        self.bot.role_channel_id = settings['role_channel_id']
        self.bot.role_log_channel_id = settings['role_log_channel_id']
        self.bot.allowed_roles = settings['allowed_roles']


    @commands.command()
    @commands.has_permissions(administrator=True)
    async def setrole(self, ctx):
        self.bot.role_channel_id = ctx.channel.id
        await ctx.send(f"Set <#{self.bot.role_channel_id}> as role channel.")
        print(f'Set {self.bot.role_channel_id} as default role channel')
        
        with open('./config/roles.yml') as file:
            data = yaml.load(file)

        data['role_channel_id'] = ctx.channel.id

        with open('./config/roles.yml', 'w') as file:
            yaml.dump(data, file)

    @commands.command()
    @commands.has_permissions(administrator=True)
    async def setrolelog(self, ctx):
        self.bot.role_log_channel_id = ctx.channel.id
        await ctx.send(f"Set <#{self.bot.role_log_channel_id}> as default role log channel.")
        print(f'Set {self.bot.role_log_channel_id} as default role log channel')

        with open('./config/roles.yml') as file:
            data = yaml.load(file)

        data['role_log_channel_id'] = ctx.channel.id

        with open('./config/roles.yml', 'w') as file:
            yaml.dump(data, file)


    @commands.command()
    async def give(self, ctx, *role_names):
        if ctx.message.channel.id != self.bot.role_channel_id:
            return

        user = ctx.message.author
        log_channel = self.bot.get_channel(self.bot.role_log_channel_id)
        success = True

        for role_name in role_names:
            try:
                if role_name.lower() not in (role.lower() for role in self.bot.allowed_roles):
                    raise PermissionError
                role = discord.utils.find(lambda r: role_name.lower() == r.name.lower(), ctx.guild.roles)
                await user.add_roles(role)
                await ctx.send(f'✅ Gave {role_name} to {user}', delete_after=2)
                await log_channel.send(f'✅ Gave {role_name} to {user}')
            except PermissionError:
                await ctx.send(f'❌ Failed to give {role_name} to {user}. You do not have permission to give yourself this role', delete_after=2)
                await log_channel.send(f'❌ Failed to give {role_name} to {user} (role not on whitelist)')
                success = False
            except:
                await ctx.send(f'❌ Failed to give {role_name} to {user}. Please make sure your course code matches exactly e.g. `COMP1511` not `COMP 1511`', delete_after=2)
                await log_channel.send(f'❌ Failed to give {role_name} to {user} (role missing or invalid)')
                success = False

        if success:
            await ctx.message.add_reaction("👍")

        await asyncio.sleep(2.5)
        await ctx.message.delete()


    @commands.command()
    async def remove(self, ctx, *role_names):
        if ctx.message.channel.id != self.bot.role_channel_id:
            return

        user = ctx.message.author
        log_channel = self.bot.get_channel(self.bot.role_log_channel_id)
        success = True

        for role_name in role_names:
            try:
                role = discord.utils.find(lambda r: role_name.lower() == r.name.lower(), ctx.guild.roles)
                await user.remove_roles(role)
                await ctx.send(f'✅ Removed {role_name} from {user}', delete_after=2)
                await log_channel.send(f'✅ Removed {role_name} from {user}')
            except:
                await ctx.send(f'❌ Failed to remove {role_name} from {user}. Please make sure your course code matches exactly e.g. `COMP1511` not `COMP 1511`', delete_after=2)
                await log_channel.send(f'❌ Failed to remove {role_name} from {user}')
                success = False

        if success:
            await ctx.message.add_reaction("👍")

        await asyncio.sleep(2.5)
        await ctx.message.delete()

    @commands.command()
    @commands.has_permissions(administrator=True)
    async def countmembers(self, ctx, *, role_name):
        role = discord.utils.find(lambda r: role_name.lower() == r.name.lower(), ctx.guild.roles)

        try:
            await ctx.send(f"`{role_name}` has {len(role.members)} members")
        except:
            await ctx.send(f"`{role_name}` was not found. Please make sure the spelling is correct")

    @commands.command()
    @commands.has_permissions(administrator=True)
    async def whitelist(self, ctx, *role_names):
        if ctx.message.channel.id != self.bot.role_channel_id:
            return

        log_channel = self.bot.get_channel(self.bot.role_log_channel_id)
        success = True

        for role_name in role_names:
            if role_name.lower() in (role.lower() for role in self.bot.allowed_roles):
                await ctx.send(f'❌ {role_name} is already on the whitelist.', delete_after=2)
                await log_channel.send(f'❌ {role_name} is already on the whitelist.')
                success = False
            else:
                self.bot.allowed_roles.append(role_name)
                with open('./config/roles.yml') as file:
                    role_data = yaml.load(file)

                role_data['allowed_roles'].append(role_name)

                with open('./config/roles.yml', 'w') as file:
                    yaml.dump(role_data, file)

                await ctx.send(f'✅ Added {role_name} to the whitelist', delete_after=2)
                await log_channel.send(f'✅ Added {role_name} to the whitelist')

        if success:
            await ctx.message.add_reaction("👍")
            
        await asyncio.sleep(2.5)
        await ctx.message.delete()

    @commands.command()
    @commands.has_permissions(administrator=True)
    async def blacklist(self, ctx, *role_names):
        if ctx.message.channel.id != self.bot.role_channel_id:
            return

        log_channel = self.bot.get_channel(self.bot.role_log_channel_id)
        success = True

        for role_name in role_names:
            if role_name.lower() not in (role.lower() for role in self.bot.allowed_roles):
                await ctx.send(f'❌ {role_name} is not currently on the whitelist.', delete_after=2)
                await log_channel.send(f'❌ {role_name} is not currently on the whitelist.')
                success = False
            else:
                self.bot.allowed_roles.remove(role_name)
                with open('./config/roles.yml') as file:
                    role_data = yaml.load(file)

                role_data['allowed_roles'].remove(role_name)

                with open('./config/roles.yml', 'w') as file:
                    yaml.dump(role_data, file)

                await ctx.send(f'✅ Removed {role_name} from whitelist', delete_after=2)
                await log_channel.send(f'✅ Removed {role_name} from whitelist')

        if success:
            await ctx.message.add_reaction("👍")
            
        await asyncio.sleep(2.5)
        await ctx.message.delete()

def setup(bot):
    bot.add_cog(Roles(bot))
