<div align="center">

# 🏥 HealthDoc Query Assistant

### AI-Powered Medical Report Intelligence Platform

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-healthdocliv.app-00b894?style=for-the-badge)](https://healthdocliv.app/)
[![Documentation](https://img.shields.io/badge/📚_Documentation-Notion-000000?style=for-the-badge&logo=notion)](https://healthdocliv.notion.site/PROJECT_DOCUMENTATION-2f5c54ff4fff80618cf9e61f78690a71)

<br/>

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=flat-square&logo=openai)

<br/>

*Transform how you understand medical reports with AI-powered analysis, OCR extraction, and natural language Q&A*

[🚀 Live Demo](https://healthdocliv.app/) • [📖 Documentation](https://healthdocliv.notion.site/PROJECT_DOCUMENTATION-2f5c54ff4fff80618cf9e61f78690a71) • [🐛 Report Bug](../../issues) • [💡 Request Feature](../../issues)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 📄 Smart Document Processing
- Upload PDF, Image, or Text files
- Automatic OCR text extraction
- Support for scanned documents

### 🧠 AI-Powered Analysis
- GPT-4o-mini powered insights
- Key health metric extraction
- Abnormality detection (Normal/High/Low/Critical)

### 💬 Natural Language Q&A
- Ask questions about your reports
- RAG-based intelligent responses
- Context-aware answers

</td>
<td width="50%">

### 📊 Health Insights
- Dual summaries (Patient-friendly + Clinical)
- Health trend analysis over time
- Risk indicators (Cardiovascular, Diabetes)

### 👨‍👩‍👧‍👦 Family Management
- Manage reports for family members
- Individual health profiles
- Organized report history

### 🔐 Enterprise Security
- Two-Factor Authentication (TOTP + Email OTP)
- Secure report sharing with expiring links
- Comprehensive audit logging

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

<table>
<tr>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=nextjs" width="48" height="48" alt="Next.js" />
<br>Next.js 14
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=typescript" width="48" height="48" alt="TypeScript" />
<br>TypeScript
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=tailwind" width="48" height="48" alt="Tailwind" />
<br>Tailwind CSS
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=python" width="48" height="48" alt="Python" />
<br>Python
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=fastapi" width="48" height="48" alt="FastAPI" />
<br>FastAPI
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=nodejs" width="48" height="48" alt="Node.js" />
<br>Node.js
</td>
</tr>
<tr>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=postgres" width="48" height="48" alt="PostgreSQL" />
<br>PostgreSQL
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=redis" width="48" height="48" alt="Redis" />
<br>Redis
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=supabase" width="48" height="48" alt="Supabase" />
<br>Supabase
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=docker" width="48" height="48" alt="Docker" />
<br>Docker
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=vercel" width="48" height="48" alt="Vercel" />
<br>Vercel
</td>
<td align="center" width="96">
<img src="https://avatars.githubusercontent.com/u/105939618" width="48" height="48" alt="OpenAI" />
<br>OpenAI
</td>
</tr>
</table>

### Architecture Overview

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Shadcn/UI |
| **API Gateway** | Node.js, Fastify, Prisma ORM, BullMQ |
| **AI Service** | Python, FastAPI, OpenAI GPT-4o-mini, PyPDF2 |
| **Database** | Supabase (PostgreSQL), Redis, Qdrant Vector DB |
| **Deployment** | Vercel, Railway, Hugging Face Spaces |

---

## 🏗️ Project Structure

```
healthdoc/
├── 📁 apps/
│   ├── 🌐 web/              # Next.js 14 Frontend
│   │   ├── src/app/         # App Router Pages
│   │   ├── src/components/  # React Components
│   │   └── src/hooks/       # Custom Hooks
│   │
│   ├── ⚙️ api/              # Node.js API Gateway
│   │   ├── src/modules/     # Feature Modules (auth, reports, family)
│   │   ├── src/workers/     # Background Job Workers
│   │   └── prisma/          # Database Schema
│   │
│   └── 🤖 ai-service/       # Python AI/NLP Service
│       └── app/api/routes/  # Analysis, Query, Embeddings
│
├── 🐳 docker/               # Docker Configurations
└── 📚 docs/                 # Documentation
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Python 3.11+
- Docker & Docker Compose
- Supabase account
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/healthdoc.git
cd healthdoc

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials
```

### Development

```bash
# Start supporting services (Redis, Qdrant)
docker compose -f docker/docker-compose.yml up redis qdrant -d

# Push database schema
pnpm db:push

# Start all services in development mode
pnpm dev
```

### Access Points

| Service | URL |
|---------|-----|
| 🌐 Frontend | http://localhost:3000 |
| ⚙️ API Gateway | http://localhost:3001 |
| 🤖 AI Service | http://localhost:8000 |
| 📊 Qdrant Dashboard | http://localhost:6333/dashboard |

---

## 📝 Available Scripts

```bash
# Development
pnpm dev              # Start all services concurrently
pnpm build            # Build all applications
pnpm lint             # Run ESLint on all apps

# Database
pnpm db:push          # Push Prisma schema to database
pnpm db:migrate       # Run database migrations
pnpm db:studio        # Open Prisma Studio (Database GUI)
```

---

## 🔐 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
DATABASE_URL=postgresql://...

# AI Services
OPENAI_API_KEY=sk-...
QDRANT_URL=http://localhost:6333

# Backend
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:3000
AI_SERVICE_URL=http://localhost:8000
```

---

## 🌐 Deployment

| Service | Platform | Status |
|---------|----------|--------|
| Frontend | Vercel | [![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)](https://healthdocliv.app/) |
| API Gateway | Railway | [![Railway](https://img.shields.io/badge/Railway-Deployed-purple?logo=railway)](https://railway.app/) |
| AI Service | Hugging Face Spaces | [![HuggingFace](https://img.shields.io/badge/🤗_HuggingFace-Deployed-yellow)](https://huggingface.co/spaces) |

---

## 📖 Documentation

For comprehensive documentation including architecture diagrams, API reference, and development guides:

<div align="center">

### 📚 [View Full Documentation on Notion](https://healthdocliv.notion.site/PROJECT_DOCUMENTATION-2f5c54ff4fff80618cf9e61f78690a71)

</div>

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

### 🌟 Star this repo if you find it helpful!

[![GitHub stars](https://img.shields.io/github/stars/yourusername/healthdoc?style=social)](../../stargazers)

<br/>

**Built with ❤️ for better healthcare understanding**

[🌐 Live Demo](https://healthdocliv.app/) • [📖 Documentation](https://healthdocliv.notion.site/PROJECT_DOCUMENTATION-2f5c54ff4fff80618cf9e61f78690a71)

</div>
