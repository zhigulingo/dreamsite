import { sql } from '@vercel/postgres';

// API для получения списка всех подписок
// Доступ защищён API ключом
export default async function handler(req, res) {
    // Простая защита API ключом
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.ADMIN_API_KEY;

    if (!validApiKey || apiKey !== validApiKey) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { format = 'json', limit = 100, offset = 0 } = req.query;

        // Получаем подписки из базы
        const result = await sql`
            SELECT 
                id,
                email,
                subscribed_at,
                ip,
                referrer,
                status
            FROM subscriptions
            WHERE status = 'active'
            ORDER BY subscribed_at DESC
            LIMIT ${parseInt(limit)}
            OFFSET ${parseInt(offset)}
        `;

        // Получаем общую статистику
        const stats = await sql`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN DATE(subscribed_at) = CURRENT_DATE THEN 1 END) as today,
                COUNT(CASE WHEN subscribed_at >= NOW() - INTERVAL '7 days' THEN 1 END) as week,
                COUNT(CASE WHEN subscribed_at >= NOW() - INTERVAL '30 days' THEN 1 END) as month
            FROM subscriptions
            WHERE status = 'active'
        `;

        const subscriptions = result.rows;
        const statistics = stats.rows[0];

        // Формат CSV для экспорта
        if (format === 'csv') {
            const csv = [
                'ID,Email,Subscribed At,IP,Referrer,Status',
                ...subscriptions.map(sub =>
                    `${sub.id},${sub.email},${sub.subscribed_at},${sub.ip || ''},${sub.referrer || ''},${sub.status}`
                )
            ].join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=subscriptions.csv');
            return res.status(200).send(csv);
        }

        // Формат JSON (по умолчанию)
        return res.status(200).json({
            success: true,
            statistics: {
                total: parseInt(statistics.total),
                today: parseInt(statistics.today),
                week: parseInt(statistics.week),
                month: parseInt(statistics.month)
            },
            subscriptions: subscriptions,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                count: subscriptions.length
            }
        });

    } catch (error) {
        console.error('Export error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
