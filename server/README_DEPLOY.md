# Support Proxy Deployment Guide

This guide shows how to safely deploy the `support-proxy` server (used by the site chat widget) to a public hosting provider (Render, Heroku, Cloud Run, etc.) so the secret API key remains on the server and is not exposed to the client.

This repository contains `support-proxy.js` (Express) which expects an environment variable `OPENAI_API_KEY`.

Important safety notes
- DO NOT put secret API keys into client-side files (JS/HTML). Keep them as environment variables on the server.
- Revoke any leaked keys immediately (Google Cloud Console / OpenAI dashboard).
- Do not commit `.env` files to the repository.

Quick local test
1. Install dependencies (in `server/`):

```bash
cd server
npm install
```

2. Create a local `.env` (DO NOT commit):

```
OPENAI_API_KEY=sk-....
PORT=3000
```

3. Run locally:

```bash
npm start
```

4. Check health:

```
curl http://localhost:3000/health
```

You should see a JSON response like `{ "status": "ok", "env": {...} }`.

Deploying to Render (recommended quick path)
1. Create a Render account and connect your GitHub repo.
2. Create a new Web Service (Environment: `Node`), point to this repo path `server/` and choose branch.
3. Build command: `npm install`
   Start command: `npm start`
4. In Render dashboard add Environment Variables (Settings -> Environment):
   - `OPENAI_API_KEY` = <your-secret-key>
   - `PORT` = 3000 (optional)
5. Deploy. After deploy, verify `https://<your-service>.onrender.com/health` returns `status: ok`.

Deploying to Heroku (alternative)
1. Create Heroku app.
2. Set config var `OPENAI_API_KEY` in the dashboard.
3. `git push heroku main` (or use GitHub integration).

Deploying to Google Cloud Run
1. Build a Docker image and push to Container Registry or Artifact Registry.
2. Deploy to Cloud Run with the environment variable `OPENAI_API_KEY` set.

Using the proxy from the frontend
- The frontend `chat.js` calls `/api/support` by default (relative path). If you deploy the proxy to a different domain you have two options:
  1. Configure a reverse-proxy /rewrites on your hosting (e.g., Firebase Hosting) to forward `/api/support` to `https://<your-proxy>/api/support`.
  2. Edit `chat.js` and replace `/api/support` with your proxy absolute URL (e.g., `https://<your-proxy>.onrender.com/api/support`).

To configure Firebase Hosting rewrite (example `firebase.json`):

```json
"rewrites": [
  {
    "source": "/api/support/**",
    "destination": "https://your-proxy.onrender.com/api/support"
  }
]
```

(If using Firebase Hosting, you may need to set up a Cloud Function or a proper reverse proxy; check Firebase docs.)

Rotating/revoking leaked keys
- If you suspect a key in this repo was leaked, revoke it immediately from your provider dashboard and generate a new one.
- Update the server environment variable to the new key and redeploy.

Troubleshooting
- If chat shows error `Chat không khả dụng: server proxy chưa cấu hình`, verify the proxy is reachable from the browser and CORS allows your domain.
- Check server logs for errors (`console.error` lines in `support-proxy.js` will show provider responses).

If you want, I can prepare a `render.yaml` manifest and a small `deploy-proxy.sh` script to automate deploy to Render or produce a Dockerfile for Cloud Run.

---

If you want me to proceed: tell me which hosting provider you prefer (Render, Heroku, Cloud Run, or others) and I will create the deployment manifest and a safe small script to help you deploy without changing other parts of the project.