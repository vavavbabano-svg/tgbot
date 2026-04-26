import asyncio
import logging
import random
import string
import re
from datetime import datetime, timedelta
from aiogram import Bot, Dispatcher, F, Router, types
from aiogram.fsm.context import FSMContext
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

logging.basicConfig(level=logging.INFO)

BOT_TOKEN = "8781741638:AAHk6rBlW7r3k3zD7U0QdyissyKD6YDBYII"
ADMIN_ID = 1444520038

# ===================== ЗАГЛУШКИ =====================
class Config:
    pass

class Repository:
    async def get_setting(self, key): return None
    async def get_multiple_settings(self, keys): return {}
    async def update_setting(self, key, val): pass
    async def get_user(self, uid): return None
    async def get_total_top_up(self, uid): return 0
    async def get_total_stars_bought(self, uid): return 0
    async def update_user_block_status(self, uid, status): pass
    async def update_user_balance(self, uid, amount, op): pass
    async def get_user_by_id_or_username(self, q): return None
    async def count_user_payments(self, uid): return 0
    async def get_user_payments_page(self, uid, page, size): return []
    async def get_all_users_for_broadcast(self): return []
    async def get_promo_by_code(self, code): return None
    async def create_promo_code(self, *args, **kwargs): pass
    async def get_active_promo_codes(self): return []
    async def get_all_promo_codes(self): return []
    async def delete_promo_code(self, code): pass

# ===================== АДМИН-ПАНЕЛЬ =====================
router = Router()

def admin_only(func):
    async def wrapper(message_or_call, *args, **kwargs):
        user_id = message_or_call.from_user.id
        if user_id != ADMIN_ID:
            if hasattr(message_or_call, "answer"):
                await message_or_call.answer("⛔ Доступ запрещён.", show_alert=True)
            else:
                await message_or_call.answer("⛔ Доступ запрещён.")
            return
        return await func(message_or_call, *args, **kwargs)
    return wrapper

@router.message(F.text == "/start")
@admin_only
async def admin_panel(message: types.Message, state: FSMContext):
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="👤 Пользователи", callback_data="admin_users")],
        [InlineKeyboardButton(text="📈 Цены", callback_data="admin_prices")],
        [InlineKeyboardButton(text="🎟️ Промокоды", callback_data="admin_promos")],
        [InlineKeyboardButton(text="📢 Рассылка", callback_data="admin_broadcast")],
        [InlineKeyboardButton(text="⚙️ Настройки", callback_data="admin_settings")],
        [InlineKeyboardButton(text="📊 Fragment", callback_data="admin_fragment_status")],
    ])
    await message.answer("🔐 **Админ-панель**", reply_markup=kb)

# ===================== ЗАПУСК =====================
async def main():
    bot = Bot(token=BOT_TOKEN)
    dp = Dispatcher(storage=MemoryStorage())
    dp.include_router(router)
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
