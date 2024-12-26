require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, VoiceConnectionStatus, AudioPlayerStatus } = require('@discordjs/voice');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers
    ]
});

const mp3Path = path.join(__dirname, 'Recording.mp3');
const GUILD_ID = '680708061396336666';
const TARGET_VOICE_CHANNEL_ID = '918866779156119552';
let connection;
let player;

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    try {
        const guild = client.guilds.cache.get(GUILD_ID);
        if (!guild) {
            console.error('Guild not found.');
            return;
        }

        const channel = guild.channels.cache.get(TARGET_VOICE_CHANNEL_ID);
        if (!channel || !channel.isVoiceBased()) {
            console.error('Voice channel not found.');
            return;
        }

        connection = joinVoiceChannel({
            channelId: TARGET_VOICE_CHANNEL_ID,
            guildId: GUILD_ID,
            adapterCreator: guild.voiceAdapterCreator,
        });

        player = createAudioPlayer();
        const resource = createAudioResource(mp3Path);

        connection.subscribe(player);
        player.play(resource);

        player.on('error', error => {
            console.error('Error playing audio:', error);
            connection.destroy();
            connection = undefined;
        });

        player.on(AudioPlayerStatus.Idle, () => {
            console.log('Audio finished playing, replaying');
            player.play(resource)
        });

        try {
            await entersState(connection, VoiceConnectionStatus.Ready, 3000);
            console.log('Successfully connected to voice channel.');
        } catch (error) {
            console.error('Failed to connect to voice channel within 30 seconds:', error);
            connection.destroy();
            connection = undefined;
            return;
        }
    } catch (error) {
        console.error('Error joining voice channel on startup:', error);
    }

    client.on('voiceStateUpdate', async (oldState, newState) => {

        if (newState.guild.id !== GUILD_ID) return;

        if (newState.channelId === TARGET_VOICE_CHANNEL_ID && oldState?.channelId !== TARGET_VOICE_CHANNEL_ID) {
            if (player.state.status === AudioPlayerStatus.Idle) {
                player.play(createAudioResource(mp3Path));
            }
        }
    })
});

client.login(process.env.DISCORD_TOKEN);