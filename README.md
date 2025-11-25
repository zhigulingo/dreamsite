# 🌙 DreamsTalk - AI Dream Analysis Landing Page

Красивый лендинг для Telegram бота анализа снов с встроенной системой сбора email подписок.

## ✨ Возможности

- 🎨 Современный дизайн с glassmorphism эффектами
- 🌌 Интерактивный звёздный фон на Canvas
- 📱 Полностью адаптивный (mobile-first)
- ✉️ Рабочая форма подписки с сохранением в Postgres
- 📊 API для экспорта подписок и статистики
- 📲 Telegram уведомления о новых подписках
- 🚀 Готов к деплою на Vercel

## 🚀 Быстрый старт

### Локальная разработка

```bash
# Склонируйте репозиторий
git clone https://github.com/zhigulingo/dreamsite.git
cd dreamsite

# Запустите локальный сервер
python3 -m http.server 8000

# Или используйте npm
npm run dev

# Откройте в браузере
open http://localhost:8000
```

### Деплой на Vercel

1. **Установите Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Подключите Neon Postgres**
   - Откройте [Vercel Dashboard](https://vercel.com/dashboard)
   - Создайте проект
   - Storage → Create Database → Neon (Postgres)
   - Подключите к проекту

3. **Задеплойте проект**
   ```bash
   vercel
   ```

4. **Настройте переменные окружения** (опционально)
   ```bash
   # Telegram уведомления
   vercel env add TELEGRAM_BOT_TOKEN
   vercel env add TELEGRAM_CHAT_ID
   
   # API ключ для /api/subscriptions
   vercel env add ADMIN_API_KEY
   ```

5. **Передеплойте**
   ```bash
   vercel --prod
   ```

**Готово!** 🎉

## 📁 Структура проекта

```
dreamsite/
├── index.html              # Главная страница
├── style.css              # Стили
├── script.js              # Frontend логика
├── background.js          # Canvas анимация
├── api/
│   ├── subscribe.js       # API подписки (Postgres)
│   └── subscriptions.js   # API статистики/экспорта
├── image/                 # Изображения
│   ├── logo.png
│   ├── screen1-3.png
│   └── icons/*.png
├── package.json           # Зависимости
├── vercel.json           # Конфигурация Vercel
└── *.md                  # Документация
```

## 🔌 API Endpoints

### POST /api/subscribe
Добавить email в подписку

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription successful",
  "data": {
    "id": 42,
    "email": "user@example.com",
    "subscribed_at": "2025-11-25T18:30:00.000Z"
  }
}
```

### GET /api/subscriptions
Получить список подписок и статистику (требует API ключ)

**Headers:**
```
X-Api-Key: ваш_api_ключ
```

**Response:**
```json
{
  "success": true,
  "statistics": {
    "total": 127,
    "today": 5,
    "week": 23,
    "month": 89
  },
  "subscriptions": [...]
}
```

**Экспорт в CSV:**
```bash
curl -H "X-Api-Key: ключ" \
  "https://site.vercel.app/api/subscriptions?format=csv" \
  -o emails.csv
```

## 🗄️ База данных

Таблица `subscriptions`:

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL | Уникальный ID |
| email | VARCHAR(255) | Email (unique) |
| subscribed_at | TIMESTAMP | Время подписки |
| ip | VARCHAR(100) | IP адрес |
| user_agent | TEXT | User Agent |
| referrer | TEXT | Источник трафика |
| status | VARCHAR(50) | active/inactive |

## 📱 Telegram уведомления

При настройке получаете сообщения:

```
🆕 Новая подписка на DreamsTalk!

📧 Email: user@example.com
🆔 ID: #42
🕐 Время: 25.11.2025, 21:30
🌐 IP: 123.45.67.89
📱 Referrer: google.com
```

## 🎨 Технологии

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Vercel Serverless Functions (Node.js)
- **Database:** Neon Postgres (Vercel Storage)
- **Notifications:** Telegram Bot API
- **Hosting:** Vercel

## 📚 Документация

- [VERCEL_POSTGRES_SETUP.md](./VERCEL_POSTGRES_SETUP.md) - Полная инструкция по настройке
- [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) - Быстрый деплой
- [BACKEND_SETUP.md](./BACKEND_SETUP.md) - Альтернативные варианты

## 🔧 Разработка

### Требования
- Node.js 18+ (для API функций)
- Python 3 (для локального сервера)

### Локальная разработка API
```bash
# Установите зависимости
npm install

# Используйте Vercel Dev для тестирования API
vercel dev
```

## 🤝 Вклад

Пулл-реквесты приветствуются! Для больших изменений, пожалуйста, сначала откройте issue.

## 📄 Лицензия

MIT

## 🔗 Ссылки

- [Telegram бот](https://t.me/dreamstalkbot)
- [Сообщество](https://t.me/thedreamshub)
- [Vercel Documentation](https://vercel.com/docs)
- [Neon Postgres](https://neon.tech/)

---

Сделано с 💜 командой DreamsTalk
