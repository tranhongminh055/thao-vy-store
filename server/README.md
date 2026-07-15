# Support Proxy (ThaoVyStore)

This small Express proxy keeps your OpenAI API key on the server and relays chat requests from the client.

1. Install dependencies

```bash
cd server
npm install
```

2. Set your OpenAI API key in environment variable `OPENAI_API_KEY` (example for Windows PowerShell):

```powershell
$env:OPENAI_API_KEY = "sk-..."
npm start
```

Or create a `.env` file in the `server/` folder with:

```
OPENAI_API_KEY=sk-...
```

3. Start the server

```bash
npm start
```

4. Client

The client (`support.js`) calls `POST /api/support` with JSON `{ messages: [...] }`. The proxy will forward to OpenAI and return `{ result: "..." }`.

Security notes:
- Do NOT commit your `.env` or API key to source control.
- In production, restrict CORS to your domain and add authentication if needed.
