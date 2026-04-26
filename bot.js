const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = '8781741638:AAHk6rBlW7r3k3zD7U0QdyissyKD6YDBYII';
const ADMIN_ID = 1444520038;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🤖 Бот запущен');

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  // Отвечаем только админу
  if (userId === ADMIN_ID) {
    bot.sendMessage(chatId, 'ярик дурак, а вадик мой повелитель');
  } else {
    bot.sendMessage(chatId, 'Ты не админ. Доступ запрещён.');
  }
});
