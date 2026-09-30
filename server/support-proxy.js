const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

if(!GEMINI_KEY){
  console.warn('⚠️  GEMINI_API_KEY not set. Set it in .env before running the server.');
}

const ai = GEMINI_KEY ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;

// Danh sách model theo thứ tự ưu tiên — nếu model chính bị quá tải (503), tự động thử model tiếp theo
const MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-2.5-flash'];
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

app.post('/api/support', async (req, res) => {
  try {
    const { messages, systemInstruction } = req.body;
    if (!messages) return res.status(400).json({ error: 'Missing messages in request body' });
    if (!ai) return res.status(500).json({ error: 'Server missing GEMINI_API_KEY' });

    // Chuẩn bị history cho Gemini SDK
    const chatHistory = [];
    for (let i = 0; i < messages.length - 1; i++) {
      const m = messages[i];
      chatHistory.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      });
    }
    const lastMessage = messages[messages.length - 1];

    const config = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    // Thử từng model, mỗi model retry tối đa MAX_RETRIES lần
    let lastError = null;
    for (const model of MODELS) {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`Trying ${model} (attempt ${attempt}/${MAX_RETRIES})...`);
          const chat = ai.chats.create({
            model: model,
            history: chatHistory,
            config: config
          });
          const response = await chat.sendMessage({ message: lastMessage.content });
          const reply = response.text;
          console.log(`✅ Success with ${model}`);
          return res.json({ result: reply || 'Không nhận được phản hồi từ AI.' });
        } catch (err) {
          lastError = err;
          const status = err.status || 0;
          console.warn(`❌ ${model} attempt ${attempt} failed: ${status} - ${err.message.substring(0, 100)}`);

          // Nếu lỗi 503 (quá tải) hoặc 429 (rate limit) → retry hoặc thử model khác
          if (status === 503 || status === 429) {
            if (attempt < MAX_RETRIES) {
              await sleep(RETRY_DELAY_MS * attempt); // backoff
              continue; // retry cùng model
            }
            break; // chuyển sang model tiếp theo
          }
          // Lỗi khác (400, 401, 404...) → không retry, thử model khác
          break;
        }
      }
    }

    // Tất cả model đều thất bại
    const errMsg = lastError ? lastError.message : 'All models failed';
    console.error('All models failed:', errMsg.substring(0, 200));
    return res.status(500).json({ error: errMsg });

  } catch (err) {
    console.error('Proxy error:', err.message);
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', models: MODELS, env: { port: PORT, gemini_key_set: !!GEMINI_KEY } });
});

app.listen(PORT, () => console.log(`✅ Support proxy listening on http://localhost:${PORT} | Models: ${MODELS.join(', ')}`));
