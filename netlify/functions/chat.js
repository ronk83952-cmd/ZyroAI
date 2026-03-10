const fetch = require('node-fetch');

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    const { prompt, model, instructions } = JSON.parse(event.body);
    
    // MISTRAL_API_KEY must be set in your Netlify Environment Variables
    const MISTRAL_KEY = process.env.MISTRAL_API_KEY;

    try {
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MISTRAL_KEY}`
            },
            body: JSON.stringify({
                model: model || "open-mistral-7b",
                messages: [
                    { role: "system", content: `You are ZyroAI. User info: ${instructions || 'None'}` },
                    { role: "user", content: prompt }
                ]
            })
        });

        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify({ reply: data.choices[0].message.content })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: "Mistral API Error" }) };
    }
};
