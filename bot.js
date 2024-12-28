require('dotenv').config()
const path = require('path')
const { Client, GatewayIntentBits, InteractionType } = require('discord.js')
const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    VoiceConnectionStatus 
} = require('@discordjs/voice')

const db = {
    targetVoiceChannels: {
        '918866779156119552': {

        }
    }
}

const currentConnections = {}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
})

const mp3Path = path.join(__dirname, 'voice.mp3')

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`)
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'ping') {
        const message = await interaction.reply({ content: 'Let me tell you something...', fetchReply: true });
        const messageLatency = message.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = client.ws.ping;

        await interaction.editReply({
            content: null,
            embeds: [
                {
                    title: `${client.user.username} ✨`,
                    color: 0xff0000,
                    fields: [
                        {
                            name: 'Message Latency',
                            value: `\`${messageLatency}ms\``,
                            inline: true
                        },
                        {
                            name: 'API Ping (WebSocket)',
                            value: `\`${apiLatency}ms\``,
                            inline: true
                        }
                    ],
                    footer: {
                        text: `📡 ${interaction.user.username}™`,
                        icon_url: interaction.user.displayAvatarURL()
                    }
                }
            ]
        })
    }
});

client.on('voiceStateUpdate', (oldState, newState) => {
    const channelId = newState.channel?.id
    const targetChannel = db.targetVoiceChannels[channelId]

    if (targetChannel) {
        const guildId = newState.guild.id

        if (!oldState.channel && newState.channel) {    // check if user is "joined" not moved
            if (!currentConnections[guildId]) {
                const connection = joinVoiceChannel({
                    channelId: channelId,
                    guildId: guildId,
                    adapterCreator: newState.guild.voiceAdapterCreator
                })
    
                const player = createAudioPlayer()
                connection.subscribe(player)
    
                currentConnections[guildId] = { connection, player }
    
                console.log(`Connected to guild: ${guildId}, channel: ${channelId}`)
    
                const resource = createAudioResource(mp3Path)
                player.play(resource)

                connection.on(VoiceConnectionStatus.Disconnected, async () => {
                    console.log(`Disconnected from guild: ${guildId}`)
                    currentConnections[guildId] = null
                    delete currentConnections[guildId]
                    connection.destroy()
                })
    
                player.on('error', (error) => {
                    console.error(`Error in guild ${guildId}:`, error)
                })
            } else {
                const { player } = currentConnections[guildId];
                const resource = createAudioResource(mp3Path)
                player.play(resource)
            }
        }
    }
})

if (!process.env.DISCORD_TOKEN) {
    console.error('Error: DISCORD_TOKEN is not defined in the environment variables.')
    process.exit(1)
}

client.login(process.env.DISCORD_TOKEN)
.catch(error => {
    console.error('Failed to log in:', error)
    process.exit(1)
})
process.on('SIGINT', () => {
    console.log('Shutting down...')
    client.destroy()
    process.exit(0)
})