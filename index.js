const {
  Client,
  Partials,
  ActivityType,
  Events,
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: 131071,
  partials: Object.values(Partials).filter((x) => typeof x === "string"),
  shards: "auto",
});

const config = require("./config.js");

require("advanced-logs");

// persistent storage (vanity and target channel)
const DATA_PATH = __dirname + "/data.json";
let persistentData = (function loadData() {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return parsed || {};
  } catch (e) {}
  return {};
})();

const vanityPresenceState = new Map();

function saveData() {
  try {
    fs.writeFileSync(
      DATA_PATH,
      JSON.stringify(persistentData, null, 2),
      "utf8"
    );
  } catch (e) {
    console.error("", `[DATA] Failed to write data.json: ${e?.message || e}`);
  }
}

function getCurrentVanity() {
  return (
    persistentData.vanity ||
    config.System.vanity_role_system_status_text ||
    "galaxia"
  ).trim();
}

function saveVanity(vanity) {
  persistentData.vanity = (vanity || "").trim();
  saveData();
}

function getTargetChannelId() {
  return (
    persistentData.channelId || config.System.vanity_role_system_channel_id
  );
}

function saveChannelId(channelId) {
  persistentData.channelId = channelId;
  saveData();
}

function computeTriggers() {
  const v = getCurrentVanity().toLowerCase();
  if (!v) return [];
  return [`discord.gg/${v}`, `.gg/${v}`, `/${v}`, v];
}

client.on(Events.ClientReady, async () => {
  console.success(``, `[CLIENT] Successfully connected to Discord API.`);

  client.user.setActivity({
    name: config.Client.bot_status,
    type: ActivityType.Custom,
    state: config.Client.bot_status,
  });

  // register guild slash commands
  try {
    const guild = client.guilds.cache.get(
      config.System.vanity_role_system_guild_id
    );
    if (guild) {
      await guild.commands.set([
        {
          name: "setvanity",
          description: "Cambiar la palabra vanity para el sistema",
          options: [
            {
              name: "keyword",
              description: "Nueva vanity (ej. galaxia)",
              type: 3,
              required: true,
            },
          ],
        },
        {
          name: "setchannel",
          description:
            "Seleccionar el canal para enviar el mensaje de bienvenida",
          options: [
            {
              name: "channel",
              description: "Canal de destino",
              type: 7,
              required: true,
            },
          ],
        },
      ]);
    }
  } catch (e) {
    console.error(
      "",
      `[COMMANDS] Failed to register commands: ${e?.message || e}`
    );
  }
});
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    if (
      !interaction.memberPermissions?.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      return interaction.reply({
        content: "Necesitas permisos de Administrador para usar este comando.",
        ephemeral: true,
      });
    }

    if (interaction.commandName === "setvanity") {
      const keyword = interaction.options.getString("keyword", true).trim();
      if (!keyword || keyword.length < 2) {
        return interaction.reply({
          content: "La vanity debe tener al menos 2 caracteres.",
          ephemeral: true,
        });
      }
      saveVanity(keyword);
      const variants = computeTriggers()
        .map((v) => `\`${v}\``)
        .join(", ");
      return interaction.reply({
        content: `Vanity actualizada a \`${getCurrentVanity()}\`. Variantes: ${variants}`,
        ephemeral: true,
      });
    }

    if (interaction.commandName === "setchannel") {
      const channel = interaction.options.getChannel("channel", true);
      if (!channel || channel.guildId !== interaction.guildId) {
        return interaction.reply({
          content: "Selecciona un canal válido del servidor.",
          ephemeral: true,
        });
      }
      if (!channel.isTextBased?.() || channel.type === 1) {
        return interaction.reply({
          content: "El canal debe ser de texto.",
          ephemeral: true,
        });
      }
      saveChannelId(channel.id);
      return interaction.reply({
        content: `Canal actualizado a <#${channel.id}>.`,
        ephemeral: true,
      });
    }
  } catch (e) {
    console.error("", `[COMMANDS] interaction failed: ${e?.message || e}`);
    if (!interaction.replied) {
      return interaction.reply({
        content: "Ocurrió un error al procesar el comando.",
        ephemeral: true,
      });
    }
  }
});

client.on(Events.PresenceUpdate, async (oldPresence, newPresence) => {
  const vanity_role_system = config.System.vanity_role_system;
  const vanity_role_system_role_id = config.System.vanity_role_system_role_id;
  const vanity_role_system_guild_id = config.System.vanity_role_system_guild_id;
  const vanity_role_system_channel_id =
    config.System.vanity_role_system_channel_id;
  const vanity_role_system_status_text =
    config.System.vanity_role_system_status_text;

  const vanity_role_system_role = newPresence.guild.roles.cache.get(
    vanity_role_system_role_id
  );
  const vanity_role_system_guild = client.guilds.cache.get(
    vanity_role_system_guild_id
  );
  const vanity_role_system_channel = newPresence.guild.channels.cache.get(
    getTargetChannelId()
  );

  if (vanity_role_system === true) {
    if (
      vanity_role_system_role_id.length <= 0 ||
      vanity_role_system_guild_id.length <= 0 ||
      vanity_role_system_channel_id.length <= 0 ||
      vanity_role_system_status_text.length <= 0
    ) {
      return console.error(
        ``,
        `[VANITY ROLE SYSTEM] Settings are not configured.`
      );
    }

    if (newPresence.guild.id !== vanity_role_system_guild_id) return;
    if (!vanity_role_system_role) return;
    if (!vanity_role_system_channel) return;

    // Helper: check if current custom status contains any trigger variants
    const triggers = computeTriggers(); // case-insensitive contains
    const presence = newPresence.member?.presence;
    const userId = newPresence.member.id;
    const hadVanity = vanityPresenceState.has(userId)
      ? vanityPresenceState.get(userId)
      : newPresence.member.roles.cache.has(vanity_role_system_role_id);

    if (
      !presence ||
      presence.status === "offline" ||
      presence.status === "invisible"
    ) {
      vanityPresenceState.set(userId, hadVanity);
      return;
    }

    const customStatus = presence.activities?.find(
      (a) => a?.type === 4 && typeof a?.state === "string"
    );
    const statusText = customStatus?.state?.toLowerCase?.() || "";
    const hasTrigger = triggers.some((t) => statusText.includes(t));

    if (!customStatus || customStatus.state === "") {
      if (
        hadVanity &&
        newPresence.member.roles.cache.has(vanity_role_system_role_id)
      ) {
        await newPresence.member.roles.remove(vanity_role_system_role);
      }
      vanityPresenceState.set(userId, false);
      return;
    }

    if (hasTrigger) {
      if (!newPresence.member.roles.cache.has(vanity_role_system_role_id)) {
        await newPresence.member.roles.add(vanity_role_system_role);
      }

      if (!hadVanity) {
        const graciasEmoji = vanity_role_system_guild?.emojis?.cache?.find(
          (e) => e?.name?.toLowerCase?.() === "gracias"
        );
        const graciasTag = graciasEmoji
          ? `<${graciasEmoji.animated ? "a" : ""}:${graciasEmoji.name}:${
              graciasEmoji.id
            }>`
          : `:gracias:`;

        const embed = new EmbedBuilder()
          .setColor(0x2b2d31)
          .setTitle(`Gracias por usar nuestra vanity! ${graciasTag}`)
          .setDescription(
            `Haz desbloqueado el rol <@&${vanity_role_system_role_id}> en tu perfil.`
          )
          .setThumbnail(newPresence.member.user.displayAvatarURL({ size: 512 }))
          .setFooter({ text: `Perderás tus beneficios si retiras la vanity` })
          .setTimestamp();

        await vanity_role_system_channel.send({
          content: `<@${newPresence.member.id}>`,
          embeds: [embed],
        });
      }

      vanityPresenceState.set(userId, true);
      return;
    }

    if (
      hadVanity &&
      newPresence.member.roles.cache.has(vanity_role_system_role_id)
    ) {
      await newPresence.member.roles.remove(vanity_role_system_role);
    }
    vanityPresenceState.set(userId, false);
  }
});

client.login(config.Client.bot_token);
