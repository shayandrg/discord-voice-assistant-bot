require('dotenv').config()
const { Client, GatewayIntentBits } = require('discord.js')
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice')
const path = require('path')

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
})

const mp3Path = path.join(__dirname, 's.mp3')

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`)
})

client.on('voiceStateUpdate', (oldState, newState) => {
    const channel = newState.channel

    if (!oldState.channel && channel) {
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator
        })

        const player = createAudioPlayer()
        const resource = createAudioResource(mp3Path)

        connection.subscribe(player)
        player.play(resource)

        player.on('error', error => {
            console.error('Error playing audio:', error)
        })
    }
})

client.login(process.env.DISCORD_TOKEN)
