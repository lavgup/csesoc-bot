import discord
from discord.ext import commands
from datetime import datetime
import random
from apscheduler.schedulers import asyncio
import json
import sys


class voicechannels(commands.Cog):
    def __init__(self, bot):
        
        self.bot = bot
        self.scheduled_deletes = asyncio.AsyncIOScheduler()
        self.scheduled_deletes.start()

        # Load this from a saved file
        self.category_name = "Temporary VCs"
        self.limit_channels = 100
        self.current_channel = 0
        self.channel_data = []
        self.user_data = []
        self.channel_ids_avail = list(range(1,self.limit_channels+1))
        self.time_limit = .01666 # in hours
        self.user_limit = 2 # Number of channels user can make every 24hrs
        
        self.category = None
        self.deletes_loaded = False
        self.startup()
    

    async def delete_vc(self, channel):
        try:
            channel_delete = await self.bot.fetch_channel(channel['channel_id'])
        
            if len(channel_delete.members) != 0:
                for i in self.channel_data:
                    if i['channel_id'] == channel['channel_id']:
                        i['unix_time'] = datetime.timestamp(datetime.now()) + self.time_limit * 3600
                        self.schedule_delete(i)
                        self.save_data()
            else:
                channel_id = int(channel_delete.name.split("_")[-1])
                self.channel_ids_avail.append(channel_id)
                await channel_delete.delete()
                self.channel_data.remove(channel)
                self.save_data()
        except:
            if len(self.channel_ids_avail) == 0 and self.current_channel < self.limit_channels:
                self.channel_ids_avail = list(range(1,self.limit_channels+1))
    
    def schedule_delete(self, channel):
        self.scheduled_deletes.add_job(self.delete_vc, args = [channel],trigger = "date",\
        run_date = datetime.fromtimestamp(channel['unix_time']), coalesce= True)

    async def load_deletes(self):
        for a in self.channel_data:
            if a['unix_time'] <  datetime.timestamp(datetime.now()):
                a['unix_time'] = datetime.timestamp(datetime.now()) + self.time_limit * 3600
                print(f"{a} IF")
                
                self.schedule_delete(a)
            else:
                print(f"{a} else")
                self.schedule_delete(a)
        self.save_data()
        self.deletes_loaded = True
        print("Done")

    async def get_category(self):
        guild = self.bot.guilds[0]

        for i in guild.categories:
            if i.name == self.category_name:
                self.category = i
                return
        self.category = await guild.create_category(name = self.category_name)

    def startup(self):
        try:
            with open("extensions/data_vc.json", 'r') as f:
                data = json.load(f)
                self.current_channel = data['current_channel']
                self.channel_data = data['channel_data']
                self.user_data = data['user_data']
                self.channel_ids_avail = data['channel_ids_avail']
                self.limit_channels = data['limit_channels']
                self.time_limit = data['time_limit']
                self.user_limit = data['user_limit']
                self.category_name = data['category_name']
        except:
            self.save_data()
        

    def save_data(self):
        with open("extensions/data_vc.json", 'w') as f:
            data = {
                'current_channel':self.current_channel,
                'channel_data':self.channel_data,
                'user_data':self.user_data,
                'channel_ids_avail':self.channel_ids_avail,
                'limit_channels':self.limit_channels,
                'time_limit':self.time_limit,
                'user_limit':self.user_limit,
                'category_name':self.category_name
            }
            json.dump(data, f, indent=2)
    

    @commands.command()
    async def breakoutvc(self, ctx):

        if len(self.channel_ids_avail) == 0 and self.current_channel < self.limit_channels:
                self.channel_ids_avail = list(range(1,self.limit_channels+1))
            
        if self.category is None:
            await self.get_category()

        if self.deletes_loaded is False:
            await self.load_deletes()
        
        # Check the channel limit
        if self.current_channel >= self.limit_channels:
            await ctx.send("Daily channel limit reached, please try again later")
            return
        
        elif self.user_data.count(ctx.author.id) == self.user_limit:
            await ctx.send("You have reached your daily limit for creating breakout voice channels")
            return
        else:
            
            self.user_data.append(ctx.author.id)
            self.current_channel += 1
            guild = ctx.guild
            channel_id = random.choice(self.channel_ids_avail)
            self.channel_ids_avail.remove(channel_id)
            channel_name = f'VC_{channel_id}'

            new_channel = await guild.create_voice_channel(channel_name, category = self.category)
            
            # Delete this channel in time_limit hrs
            temp_data = {
                'channel_id':new_channel.id,
                'time_created':datetime.timestamp(datetime.now()),
                'time_limit':self.time_limit,
                'unix_time':datetime.timestamp(datetime.now()) + self.time_limit * 3600,
            }
            self.channel_data.append(temp_data)
            
            await ctx.send(f"A new voice channel has been created -{channel_name} and will be deleted after {self.time_limit} hours if inactive")

            # await ctx.author.move_to(new_channel)
            self.schedule_delete(temp_data)
            self.save_data()



def setup(bot):
    bot.add_cog(voicechannels(bot))
