// Vercel Serverless Function для обработки подписок
// Этот файл автоматически станет API endpoint: /api/subscribe

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

        // Получаем текущую дату для логирования
        const timestamp = new Date().toISOString();
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        // Формируем данные подписки
        const subscriptionData = {
            email,
            timestamp,
            ip,
            userAgent
        };

        // ВАРИАНТ 1: Отправка в Telegram бот (Рекомендую!)
        // Создайте бот через @BotFather и получите токен
        // Получите ваш chat_id через @userinfobot
        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
            const message = `🆕 Новая подписка на DreamsTalk!\n\n` +
                `📧 Email: ${email}\n` +
                `🕐 Время: ${new Date(timestamp).toLocaleString('ru-RU')}\n` +
                `🌐 IP: ${ip}\n` +
                `📱 User Agent: ${userAgent}`;

            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: message,
                    parse_mode: 'HTML'
                })
            });
        }

        // ВАРИАНТ 2: Отправка на Email через SendGrid (опционально)
        // Установите: npm install @sendgrid/mail
        // const sgMail = require('@sendgrid/mail');
        // const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
        // const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL;

        // if (SENDGRID_API_KEY && NOTIFICATION_EMAIL) {
        //     sgMail.setApiKey(SENDGRID_API_KEY);
        //     await sgMail.send({
        //         to: NOTIFICATION_EMAIL,
        //         from: 'noreply@dreamstalk.app',
        //         subject: '🆕 Новая подписка DreamsTalk',
        //         text: `Новая подписка: ${email}`,
        //         html: `<strong>Email:</strong> ${email}<br><strong>Время:</strong> ${timestamp}`
        //     });
        // }

        // ВАРИАНТ 3: Сохранение в Google Sheets (опционально)
        // Используйте googleapis для интеграции

        // Логируем в консоль Vercel (можно посмотреть в дашборде)
        console.log('New subscription:', subscriptionData);

        // Возвращаем успешный ответ
        return res.status(200).json({
            success: true,
            message: 'Subscription successful',
            data: { email, timestamp }
        });

    } catch (error) {
        console.error('Subscription error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
}
