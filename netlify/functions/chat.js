exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { prompt, model } = JSON.parse(event.body);

    // In a real scenario, you would use:
    // const res = await fetch('OPENAI_URL', { ... headers with process.env.API_KEY })
    
    // For now, let's return a success response to test your UI
    const mockReply = `ZyroAI received your prompt for ${model}. You said: "${prompt}"`;

    return {
        statusCode: 200,
        body: JSON.stringify({ reply: mockReply }),
    };
};
