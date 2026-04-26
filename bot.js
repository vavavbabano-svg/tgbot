const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN || '8781741638:AAHk6rBlW7r3k3zD7U0QdyissyKD6YDBYII';
const ADMIN_ID = 1444520038;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🤖 Бот с админкой запущен');

// Список пользователей (заглушка — потом заменим на Supabase)
const USERS = [
    { telegram_id: 1444520038, username: 'vavavbabano' },
    { telegram_id: 123456789, username: 'testuser1' },
];

// Проверка на админа
function isAdmin(userId) {
    return userId === ADMIN_ID;
}

// Главное меню
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!isAdmin(userId)) {
        return bot.sendMessage(chatId, '⛔ Доступ запрещён.');
    }

    bot.sendMessage(chatId, '👤 Управление пользователями\n\nВыберите действие:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: '👤 Поиск пользователя', callback_data: 'user_search' }],
                [{ text: '📋 Все пользователи', callback_data: 'user_list' }],
                [{ text: '🚫 Заблокированные', callback_data: 'user_blocked' }],
                [{ text: '📢 Рассылка', callback_data: 'broadcast_menu' }],
            ]
        }
    });
});

// Мгновенная рассылка
bot.onText(/\/broadcast/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!isAdmin(userId)) return;

    const text = 'ярик дурак, вадик повелитель всего, легенда';
    let success = 0, fail = 0;

    const statusMsg = await bot.sendMessage(chatId, `📢 Начинаю рассылку...\nПользователей: ${USERS.length}`);

    for (const user of USERS) {
        try {
            await bot.sendMessage(user.telegram_id, text);
            success++;
        } catch (e) {
            fail++;
        }
        await new Promise(r => setTimeout(r, 50));
    }

    await bot.editMessageText(
        `📢 Рассылка завершена!\n\n✅ Успешно: ${success}\n❌ Ошибок: ${fail}\n\nСообщение: ${text}`,
        { chat_id: chatId, message_id: statusMsg.message_id }
    );
});

// Обработка callback'ов
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;

    if (!isAdmin(userId)) {
        return bot.answerCallbackQuery(query.id, { text: '⛔ Доступ запрещён.', show_alert: true });
    }

    const action = query.data;

    if (action === 'user_list') {
        let text = '📋 Список пользователей:\n\n';
        USERS.forEach(u => text += `• @${u.username} (ID: ${u.telegram_id})\n`);
        
        bot.editMessageText(text, {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: {
                inline_keyboard: [[{ text: '⬅️ Назад', callback_data: 'main_menu' }]]
            }
        });
    }

    else if (action === 'user_search') {
        bot.editMessageText('🔍 Введите username (с @) или ID пользователя:', {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: {
                inline_keyboard: [[{ text: '⬅️ Назад', callback_data: 'main_menu' }]]
            }
        });

        // Ждём ответ от админа
        bot.once('message', (msg) => {
            if (msg.from.id !== ADMIN_ID) return;
            
            const query_text = msg.text.trim().replace('@', '');
            const found = USERS.find(u => 
                String(u.telegram_id) === query_text || u.username === query_text
            );

            if (found) {
                bot.sendMessage(chatId, `✅ Найден: @${found.username} (ID: ${found.telegram_id})`, {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '🔍 Искать ещё', callback_data: 'user_search' }],
                            [{ text: '⬅️ Главное меню', callback_data: 'main_menu' }],
                        ]
                    }
                });
            } else {
                bot.sendMessage(chatId, `🔍 По запросу ${query_text} ничего не найдено.`, {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '🔍 Искать ещё', callback_data: 'user_search' }],
                            [{ text: '⬅️ Главное меню', callback_data: 'main_menu' }],
                        ]
                    }
                });
            }
        });
    }

    else if (action === 'user_blocked') {
        bot.editMessageText('🚫 Список заблокированных пуст.', {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: {
                inline_keyboard: [[{ text: '⬅️ Назад', callback_data: 'main_menu' }]]
            }
        });
    }

    else if (action === 'broadcast_menu') {
        bot.editMessageText('📢 Рассылка\n\nИспользуйте команду /broadcast для мгновенной рассылки сообщения всем пользователям.', {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: {
                inline_keyboard: [[{ text: '⬅️ Назад', callback_data: 'main_menu' }]]
            }
        });
    }

    else if (action === 'main_menu') {
        bot.editMessageText('👤 Управление пользователями\n\nВыберите действие:', {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: {
                inline_keyboard: [
                    [{ text: '👤 Поиск пользователя', callback_data: 'user_search' }],
                    [{ text: '📋 Все пользователи', callback_data: 'user_list' }],
                    [{ text: '🚫 Заблокированные', callback_data: 'user_blocked' }],
                    [{ text: '📢 Рассылка', callback_data: 'broadcast_menu' }],
                ]
            }
        });
    }

    bot.answerCallbackQuery(query.id);
});
