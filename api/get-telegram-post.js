export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const channelUsername = 'thedreamshub';
        // Fetch the channel preview page
        const response = await fetch(`https://t.me/s/${channelUsername}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch channel: ${response.status}`);
        }

        const html = await response.text();

        // Regex to find all data-post="channel/id"
        // Example: data-post="thedreamshub/123"
        const regex = new RegExp(`data-post="${channelUsername}/(\\d+)"`, 'gi');
        let match;
        let maxId = 0;

        while ((match = regex.exec(html)) !== null) {
            const id = parseInt(match[1], 10);
            if (id > maxId) {
                maxId = id;
            }
        }

        if (maxId > 0) {
            return res.status(200).json({
                success: true,
                postId: maxId,
                fullId: `${channelUsername}/${maxId}`
            });
        } else {
            return res.status(404).json({ success: false, error: 'No posts found' });
        }

    } catch (error) {
        console.error('Telegram fetch error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
