const fs = require('fs');

const Discord = require('discord.js');
const bot = new Discord.Client({ disableEveryone: true });

const credentials = require("./credentials");
const prefix = credentials.prefix;

bot.commands = new Discord.Collection();

bot.muted = require('./muted.json');

fs.readdir('./cmds/', (err, files) => {
    if (err) console.error(err);
    const jsFiles = files.filter(f => f.split('.').pop() === 'js');
    if (jsFiles.length <= 0) return console.log('No command files found!');
    jsFiles.forEach((f, i) => {
        const props = require(`./cmds/${f}`);
        console.log(`${i + 1}: ${f} loaded!`);
        bot.commands.set(props.help.name, props);
    });
})

bot.on('ready', async () => {
    console.log(`${bot.user.username} is ready!`);

    // Every 5 seconds check the "muted.json" file to see when a users mute is up
    bot.setInterval(() => {
        for (const i in bot.muted) {
            const time = bot.muted[i].time;
            const guildId = bot.muted[i].guild;
            const guild = bot.guilds.get(guildId);
            const member = guild.members.get(i);
            const mutedRole = guild.roles.find(mR => mR.name === 'Muted');
            if (!mutedRole) continue;

            if (Date.now() > time) {
                member.removeRole(mutedRole);
                delete bot.muted[i];
                fs.writeFile('./muted.json', JSON.stringify(bot.muted), err => {
                    if(err) throw err;
                });
            }
        }
    }, 5000);
});

bot.on('message', async message => {
    // Validate that the user can only message the bot within a channel on the server
    if (message.author.bot) return;
    if (message.channel.type === 'dm') return;

    const messageArray = message.content.split(' ');
    const command = messageArray[0];
    const args = messageArray.slice(1);

    if (!command.startsWith(prefix)) return;

    const cmd = bot.commands.get(command.slice(prefix.length));
    if (cmd) cmd.run(bot, message, args);
});

// Login the bot in and verify that the user has entered a Token
if(credentials.token === '') return console.log('Token is empty!');
bot.login(credentials.token);                         