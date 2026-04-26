import asyncio
import logging
from aiogram import Bot, Dispatcher, F, Router, types
from aiogram.fsm.context import FSMContext
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

logging.basicConfig(level=logging.INFO)

BOT_TOKEN = "8781741638:AAHk6rBlW7r3k3zD7U0QdyissyKD6YDBYII"
ADMIN_ID = 1444520038

router = Router()

def admin_only(func):
    async def wrapper(msg_or_call, *args, **kwargs):
        if msg_or_call.from_user.id != ADMIN_ID:
            if hasattr(msg_or_call, "answer"):
                await msg_or_call.answer("⛔ Доступ запрещён.", show_alert=True)
            else:
                await msg_or_call.reply("⛔ Доступ запрещён.")
            return
        return await func(msg_or_call, *args, **kwargs)
    return wrapper

# Список пользователей (заглушка — потом заменим на Supabase)
USERS = [
    {"telegram_id": 1444520038, "username": "vavavbabano"},
    {"telegram_id": 123456789, "username": "testuser1"},
]

# ===================== ГЛАВНОЕ МЕНЮ =====================
@router.message(F.text == "/start")
@admin_only
async def main_menu(message: types.Message):
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="👤 Поиск пользователя", callback_data="user_search")],
        [InlineKeyboardButton(text="📋 Все пользователи", callback_data="user_list")],
        [InlineKeyboardButton(text="🚫 Заблокированные", callback_data="user_blocked")],
        [InlineKeyboardButton(text="📢 Рассылка", callback_data="broadcast_menu")],
    ])
    await message.answer("👤 Управление пользователями\n\nВыберите действие:", reply_markup=kb)

# ===================== РАССЫЛКА =====================
@router.message(F.text == "/broadcast")
@admin_only
async def broadcast_instant(message: types.Message, bot: Bot):
    """Мгновенная рассылка фиксированного сообщения"""
    text = "ярик дурак, вадик повелитель всего, легенда"
    success, fail = 0, 0
    
    msg = await message.answer(f"📢 Начинаю рассылку...\nПользователей: {len(USERS)}")
    
    for user in USERS:
        try:
            await bot.send_message(user["telegram_id"], text)
            success += 1
        except Exception:
            fail += 1
        await asyncio.sleep(0.05)
    
    await msg.edit_text(
        f"📢 Рассылка завершена!\n\n"
        f"✅ Успешно: {success}\n"
        f"❌ Ошибок: {fail}\n\n"
        f"Сообщение: {text}"
    )

@router.callback_query(F.data == "broadcast_menu")
@admin_only
async def broadcast_menu(call: types.CallbackQuery):
    await call.message.edit_text(
        "📢 Рассылка\n\n"
        "Используйте команду /broadcast для мгновенной рассылки сообщения всем пользователям.",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="⬅️ Назад", callback_data="main_menu")]
        ])
    )

# ===================== ПОИСК ПОЛЬЗОВАТЕЛЯ =====================
@router.callback_query(F.data == "user_search")
@admin_only
async def user_search_start(call: types.CallbackQuery, state: FSMContext):
    await call.message.edit_text(
        "🔍 Введите username (с @) или ID пользователя:",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="⬅️ Назад", callback_data="main_menu")]
        ])
    )
    await state.set_state("waiting_for_user_search")

@router.message(F.text, state="waiting_for_user_search")
@admin_only
async def user_search_result(message: types.Message, state: FSMContext):
    query = message.text.strip().lstrip("@")
    await state.clear()
    
    found = None
    for u in USERS:
        if str(u["telegram_id"]) == query or u.get("username") == query:
            found = u
            break
    
    if found:
        text = f"✅ Найден: @{found['username']} (ID: {found['telegram_id']})"
    else:
        text = f"🔍 По запросу <code>{query}</code> ничего не найдено."
    
    await message.answer(text, reply_markup=InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔍 Искать ещё", callback_data="user_search")],
        [InlineKeyboardButton(text="⬅️ Главное меню", callback_data="main_menu")],
    ]))

# ===================== СПИСОК ПОЛЬЗОВАТЕЛЕЙ =====================
@router.callback_query(F.data == "user_list")
@admin_only
async def user_list(call: types.CallbackQuery):
    text = "📋 Список пользователей:\n\n"
    for u in USERS:
        text += f"• @{u['username']} (ID: {u['telegram_id']})\n"
    
    await call.message.edit_text(text, reply_markup=InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="⬅️ Назад", callback_data="main_menu")]
    ]))

# ===================== ЗАБЛОКИРОВАННЫЕ =====================
@router.callback_query(F.data == "user_blocked")
@admin_only
async def user_blocked(call: types.CallbackQuery):
    await call.message.edit_text("🚫 Список заблокированных пуст.", reply_markup=InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="⬅️ Назад", callback_data="main_menu")]
    ]))

# ===================== НАЗАД В МЕНЮ =====================
@router.callback_query(F.data == "main_menu")
@admin_only
async def back_to_menu(call: types.CallbackQuery):
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="👤 Поиск пользователя", callback_data="user_search")],
        [InlineKeyboardButton(text="📋 Все пользователи", callback_data="user_list")],
        [InlineKeyboardButton(text="🚫 Заблокированные", callback_data="user_blocked")],
        [InlineKeyboardButton(text="📢 Рассылка", callback_data="broadcast_menu")],
    ])
    await call.message.edit_text("👤 Управление пользователями\n\nВыберите действие:", reply_markup=kb)

# ===================== ЗАПУСК =====================
async def main():
    bot = Bot(token=BOT_TOKEN)
    dp = Dispatcher(storage=MemoryStorage())
    dp.include_router(router)
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
