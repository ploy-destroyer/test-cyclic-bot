
// const { clientId, guildId, token, publicKey } = require('./config.json');
require('dotenv').config();

const APPLICATION_ID = process.env.APPLICATION_ID
const TOKEN = process.env.TOKEN
const PUBLIC_KEY = process.env.PUBLIC_KEY || 'not set'
const GUILD_ID = process.env.GUILD_ID


const axios = require('axios');
const express = require('express');
const { InteractionType, InteractionResponseType, verifyKeyMiddleware } = require('discord-interactions');

const line = require('@line/bot-sdk');
const middleware = require('@line/bot-sdk').middleware;
const lineConfig = {
  channelAccessToken: process.env.CHANNELACCESSTOKEN,
  channelSecret: process.env.CHANNELSECRET
}

const app = express();
// app.use(bodyParser.json());

const discord_api = axios.create({
  baseURL: 'https://discord.com/api/',
  timeout: 3000,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
    "Access-Control-Allow-Headers": "Authorization",
    "Authorization": `Bot ${TOKEN}`
  }
});




app.post('/interactions', verifyKeyMiddleware(PUBLIC_KEY), async (req, res) => {
  const interaction = req.body;

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    console.log(interaction.data.name)
    if (interaction.data.name == 'yo') {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `Yo ${interaction.member.user.username}!`,
        },
      });
    }

    if (interaction.data.name == 'dm') {
      // https://discord.com/developers/docs/resources/user#create-dm
      let c = (await discord_api.post(`/users/@me/channels`, {
        recipient_id: interaction.member.user.id
      })).data
      try {
        // https://discord.com/developers/docs/resources/channel#create-message
        let res = await discord_api.post(`/channels/${c.id}/messages`, {
          content: 'Yo! I got your slash command. I am not able to respond to DMs just slash commands.',
        })
        console.log(res.data)
      } catch (e) {
        console.log(e)
      }

      return res.send({
        // https://discord.com/developers/docs/interactions/receiving-and-responding#responding-to-an-interaction
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '👍'
        }
      });
    }
  }

});



app.get('/register_commands', async (req, res) => {
  let slash_commands = [
    {
      "name": "yo",
      "description": "replies with Yo!",
      "options": []
    },
    {
      "name": "dm",
      "description": "sends user a DM",
      "options": []
    }
  ]
  try {
    // api docs - https://discord.com/developers/docs/interactions/application-commands#create-global-application-command
    let discord_response = await discord_api.put(
      `/applications/${APPLICATION_ID}/guilds/${GUILD_ID}/commands`,
      slash_commands
    )
    console.log(discord_response.data)
    return res.send('commands have been registered')
  } catch (e) {
    console.error(e.code)
    console.error(e.response?.data)
    return res.send(`${e.code} error from discord`)
  }
})


app.get('/', async (req, res) => {
  return res.send('Follow documentation ')
})

app.get('/sendtest', async (req, res) => {
  //Line channel
  let r = await discord_api.post(`/channels/1072008053420986398/messages`, {
    content: 'Yo! I got your slash command. I am not able to respond to DMs just slash commands.',
  });
  console.log(r.data);
  return res.send('seems ok');
});

const client = new line.Client(lineConfig);
function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: event.message.text
  });
};
app.post('/webhook', middleware(lineConfig), (req, res) => {
  console.log(req.body.events); // webhook event objects
  console.log(req.body.destination); // user ID of the bot (optional)

  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result));

  // return res.json({});
});



app.use((err, req, res, next) => {
  if (err instanceof SignatureValidationFailed) {
    res.status(401).send(err.signature)
    return
  } else if (err instanceof JSONParseError) {
    res.status(400).send(err.raw)
    return
  }
  next(err) // will throw default 500
});

// app.listen(8999, () => {
// })
app.listen(1420, () => {
  console.log('hardcode port: 1420');
});
