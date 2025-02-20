# Deployment Configuration Checklist

Use this checklist to ensure all your services are correctly connected after the URL changes.

## 1. Frontend (Vercel)
Go to: **Settings > Environment Variables**

- [ ] **NEXT_PUBLIC_API_URL**
    -   *Value*: `https://<your-railway-backend-url>.up.railway.app` (The URL of your Railway API service)
    -   *Note*: Do NOT add a trailing slash `/`.
- [ ] **NEXT_PUBLIC_APP_URL**
    -   *Value*: `https://<your-vercel-project>.vercel.app` (The URL of your Vercel frontend)

## 2. Backend API (Railway)
Go to: **Variables**

- [ ] **CORS_ORIGIN**
    -   *Value*: `https://<your-vercel-project>.vercel.app` (The URL of your Vercel frontend)
    -   *Note*: This Must match the frontend URL exactly to allow requests.
- [ ] **AI_SERVICE_URL**
    -   *Value*: `https://<your-huggingface-space>.hf.space` (The URL of your Hugging Face Space)
    -   *Note*: Ensure it is the "Direct URL" to the space, usually ending in `.hf.space`.

## 3. AI Service (Hugging Face Spaces)
Go to: **Settings > Variables and secrets**

- [ ] **CORS_ORIGINS**
    -   *Value*: `https://<your-railway-backend-url>.up.railway.app,http://localhost:3000,http://localhost:3001`
    -   *Note*: This allows the Backend (on Railway) to call the AI Service. The Frontend does NOT call the AI service directly, so the Vercel URL is technically not required here, but adding it doesn't hurt.

## 4. Verification Steps
After updating these variables, **Redeploy** each service for changes to take effect.

1.  **Redeploy Backend (Railway)** first.
2.  **Redeploy AI Service (HF Spaces)**.
3.  **Redeploy Frontend (Vercel)** last.
