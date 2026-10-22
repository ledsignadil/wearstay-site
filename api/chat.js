import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Only POST allowed" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
        const prompt = req.body.message;
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        res.status(200).json({ reply: response });
    } catch (error) {
        res.status(500).json({ error: "API fetch failed" });
    }
}
