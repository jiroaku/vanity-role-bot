require("dotenv").config();

module.exports = {

    Client: {

        bot_token: process.env.BOT_TOKEN || "", // Bot's token (load from .env)
        bot_status: process.env.BOT_STATUS || "", // Bot's status
        bot_client_id: process.env.BOT_CLIENT_ID || "", // Bot's ID

    },

    System: {

        vanity_role_system: true, // System status: true (on) / false (off)
        vanity_role_system_role_id: process.env.VANITY_ROLE_ID || "", // Role to be given/taken when writing the text in the status
        vanity_role_system_guild_id: process.env.VANITY_GUILD_ID || "", // Server where the system will work
        vanity_role_system_channel_id: process.env.VANITY_CHANNEL_ID || "", // Channel where the system message will be sent
        vanity_role_system_status_text: process.env.VANITY_KEYWORD || "" // Text to be written in the status

    }

}