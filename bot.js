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

async function connectToVoiceChannel() {
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

        try {
            await entersState(connection, VoiceConnectionStatus.Ready, 3000);
            console.log('Successfully connected to voice channel.');
            return true;
        } catch (error) {
            console.error('Failed to connect to voice channel within 3 seconds:', error);
            connection?.destroy();
            connection = undefined;
            return false;
        }
    } catch (error) {
        console.error('Error joining voice channel:', error);
        return false;
    }
}

async function playAudio() {
    if (!connection) return;

    if (!player) {
        player = createAudioPlayer();
        player.on('error', error => {
            console.error('Error playing audio:', error);
            connection?.destroy();
            connection = undefined;
        });
        player.on(AudioPlayerStatus.Idle, () => {
            console.log('Audio finished playing.');
        });
        connection.subscribe(player);
    }
    const resource = createAudioResource(mp3Path);
    player.play(resource);
}


client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    await connectToVoiceChannel();
    if (connection) {
        playAudio();
    }
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    if (newState.guild.id !== GUILD_ID) return;

    const channel = newState.guild.channels.cache.get(TARGET_VOICE_CHANNEL_ID);
    if (!channel || !channel.isVoiceBased()) return;

    if (newState.channelId === TARGET_VOICE_CHANNEL_ID) {
        if (!connection || connection.state.status === VoiceConnectionStatus.Disconnected) {
            const connected = await connectToVoiceChannel();
            if (!connected) return;
        }
        if (player && player.state.status !== AudioPlayerStatus.Playing) {
            playAudio();
        }
    } else if (oldState?.channelId === TARGET_VOICE_CHANNEL_ID && !newState.channelId) {
        if (channel.members.size === 1 && channel.members.has(client.user.id)) {
            connection?.destroy();
            connection = undefined;
            player = undefined;
            console.log("Bot is alone in the channel, disconnecting.");
        }
    }
});

client.login(process.env.DISCORD_TOKEN);