const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN || '8781741638:AAHk6rBlW7r3k3zD7U0QdyissyKD6YDBYII';
const ADMIN_ID = 1444520038;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🤖 Бот с админкой запущен');

// ===================== АДМИН-ПАНЕЛЬ =====================
const adminKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [{ text: '👤 Пользователи', callback_data: 'admin_users' }],
      [{ text: '📈 Цены', callback_data: 'admin_prices' }],
      [{ text: '🎟️ Промокоды', callback_data: 'admin_promos' }],
      [{ text: '📢 Рассылка', callback_data: 'admin_broadcast' }],
      [{ text: '⚙️ Настройки', callback_data: 'admin_settings' }],
      [{ text: '📊 Статистика', callback_data: 'admin_stats' }]
    ]
  }
};

// /start — только для админа
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  if (msg.from.id === ADMIN_ID) {
    bot.sendMessage(chatId, '🔐 *Админ-панель*', { parse_mode: 'Markdown', ...adminKeyboard });
  } else {
    bot.sendMessage(chatId, '👋 Добро пожаловать! Используйте /help для связи.');
  }
});

// /help
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Опишите проблему, и администратор свяжется с вами.');
});

// Обработка кнопок админки
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (query.from.id !== ADMIN_ID) {
    bot.answerCallbackQuery(query.id, { text: '⛔ Доступ запрещён.', show_alert: true });
    return;
  }

  switch (data) {
    case 'admin_users':
      bot.sendMessage(chatId, '👤 *Пользователи*\n\nВ разработке. Здесь будет список пользователей и управление ими.', { parse_mode: 'Markdown' });
      break;
    case 'admin_prices':
      bot.sendMessage(chatId, '📈 *Цены*\n\nТекущий курс: 1⭐ = 1.64₽ (СБП) / 0.015 TON', { parse_mode: 'Markdown' });
      break;
    case 'admin_promos':
      bot.sendMessage(chatId, '🎟️ *Промокоды*\n\nВ разработке. Здесь будет создание и управление промокодами.', { parse_mode: 'Markdown' });
      break;
    case 'admin_broadcast':
      bot.sendMessage(chatId, '📢 *Рассылка*\n\nОтправьте сообщение для рассылки всем пользователям.', { parse_mode: 'Markdown' });
      break;
    case 'admin_settings':
      bot.sendMessage(chatId, '⚙️ *Настройки*\n\nВ разработке. Здесь будут настройки бота.', { parse_mode: 'Markdown' });
      break;
    case 'admin_stats':
      bot.sendMessage(chatId, '📊 *Статистика*\n\nЗаказов сегодня: 0\nЗвёзд продано: 0\nДоход: 0₽', { parse_mode: 'Markdown' });
      break;
  }

  bot.answerCallbackQuery(query.id);
});

// Обработка обычных сообщений (для рассылки и ответов)
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const userId = msg.from.id;

  // Игнорируем команды
  if (!text || text.startsWith('/')) return;

  // Если админ — игнорируем (админка через кнопки)
  if (userId === ADMIN_ID) return;

  // Обычный пользователь — пересылаем админу
  const from = msg.from.username ? `@${msg.from.username}` : userId;
  bot.sendMessage(ADMIN_ID, `📩 Сообщение от ${from} (${userId}):\n\n${text}`);
  bot.sendMessage(chatId, '✅ Ваше сообщение отправлено. Мы ответим в ближайшее время.');
});
