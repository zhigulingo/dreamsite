import { sql } from '@vercel/postgres';

// Vercel Serverless Function для обработки подписок
// Использует Vercel Postgres для хранения emails
export default async function handler(req, res) {
    // Разрешаем только POST запросы
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Включаем CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Обрабатываем preflight запросы
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { email } = req.body;

        // Валидация email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email address'
            });
        }

        // Получаем метаданные
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'Unknown';
        const referrer = req.headers['referer'] || req.headers['referrer'] || 'Direct';

        // Создаём таблицу если её нет (автоматически при первом запросе)
        await sql`
            CREATE TABLE IF NOT EXISTS subscriptions (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip VARCHAR(100),
                user_agent TEXT,
                referrer TEXT,
                status VARCHAR(50) DEFAULT 'active'
            )
        `;

        // Проверяем дубликаты
        const existing = await sql`
            SELECT email FROM subscriptions WHERE email = ${email}
        `;

        if (existing.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Email already subscribed'
            });
        }

        // Сохраняем в базу данных
        const result = await sql`
            INSERT INTO subscriptions (email, ip, user_agent, referrer)
            VALUES (${email}, ${ip}, ${userAgent}, ${referrer})
            RETURNING id, email, subscribed_at
        `;

        const subscription = result.rows[0];

        // Отправка уведомления в Telegram (опционально)
        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
            const date = new Date(subscription.subscribed_at);
            const message = `🆕 Новая подписка на DreamsTalk!\n\n` +
                `📧 Email: ${email}\n` +
                `🆔 ID: #${subscription.id}\n` +
                `🕐 Время: ${date.toLocaleString('ru-RU')}\n` +
                `🌐 IP: ${ip}\n` +
                `📱 Referrer: ${referrer}`;

            try {
                await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: TELEGRAM_CHAT_ID,
                        text: message
                    })
                });
            } catch (telegramError) {
                console.error('Telegram notification failed:', telegramError);
                // Не прерываем выполнение, если Telegram недоступен
            }
        }

        // Логируем успех
        console.log('New subscription saved:', {
            id: subscription.id,
            email: email,
            timestamp: subscription.subscribed_at
        });

        // Возвращаем успешный ответ
        return res.status(200).json({
            success: true,
            message: 'Subscription successful',
            data: {
                id: subscription.id,
                email: subscription.email,
                subscribed_at: subscription.subscribed_at
            }
        });

    } catch (error) {
        console.error('Subscription error:', error);

        // Проверяем на ошибку дубликата (на случай race condition)
        if (error.code === '23505') { // PostgreSQL unique violation
            return res.status(409).json({
                success: false,
                error: 'Email already subscribed'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
