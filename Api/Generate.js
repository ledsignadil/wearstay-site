export default async function handler(req, res) {
    // Sirf POST requests allow karenge
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { promptText, imageBase64, mode } = req.body;
    
    // Vercel se API Key uthayega (kisi ko dikhegi nahi)
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Admin has not set the API Key on the server.' });
    }

    try {
        let apiUrl = "https://api.openai.com/v1/chat/completions";
        let apiBody = {};

        if (mode === "image" && !imageBase64) {
            apiUrl = "https://api.openai.com/v1/images/generations";
            apiBody = { model: "dall-e-3", prompt: promptText, n: 1, size: "1024x1024" };
        } else {
            let messageContent = [];
            if (promptText) messageContent.push({ type: "text", text: promptText });
            if (imageBase64) messageContent.push({ type: "image_url", image_url: { url: imageBase64 } });
            if (messageContent.length === 0) messageContent.push({ type: "text", text: "Analyze this image." });

            apiBody = { 
                model: "gpt-4o", 
                messages: [
                    {
                        role: "system", 
                        content: "You are the Wearstay AI Studio. CRITICAL: ALWAYS reply in the EXACT same language the user uses. You can write HTML code, generate YouTube thumbnail ideas, write business plans, analyze images, and read text from photos."
                    }, 
                    { role: "user", content: messageContent }
                ] 
            };
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(apiBody)
        });

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: 'Server connection failed.' });
    }
}
