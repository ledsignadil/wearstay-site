export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const apiKey = process.env.GEMINI_API_KEY; 
    if (!apiKey) return res.status(500).json({ error: 'API key is missing in Vercel' });

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are an expert signage and graphic designer. User request: "${req.body.promptText}". Create a completely scalable 2D SVG logo or layout matching the request. Return ONLY the raw SVG code without any markdown or html tags.`
                    }]
                }]
            })
        });

        const data = await response.json();
        if (data.error) return res.status(500).json({ error: data.error.message });
        
        res.status(200).json({ svgCode: data.candidates[0].content.parts[0].text });
    } catch (error) {
        res.status(500).json({ error: 'Failed to connect to Gemini AI' });
    }
}
