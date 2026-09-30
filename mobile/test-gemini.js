const API_KEY = "YOUR_GEMINI_API_KEY_HERE";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${API_KEY}`;

async function test() {
    const reqBody = {
        systemInstruction: { parts: [{ text: "You are a helpful assistant." }] },
        contents: [
            { role: "model", parts: [{ text: "Hello there" }] },
            { role: "user", parts: [{ text: "Hi" }] }
        ]
    };

    console.log("Testing with role: model first...");
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqBody)
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

test();
