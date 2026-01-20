# HealthDoc Query Assistant

> 🏥 AI-powered medical document intelligence platform for processing clinical reports using OCR, NLP, and RAG.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)
![Python](https://img.shields.io/badge/Python-3.11-green?logo=python)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-darkgreen?logo=supabase)

## ✨ Features

### Phase 1 (MVP)
- 📄 Upload medical reports (PDF/Image/Text)
- 🔍 OCR text extraction
- 📊 Key metric identification (Hemoglobin, Glucose, etc.)
- 🚦 Abnormality detection (Normal/High/Low/Critical)
- 📝 Basic report summaries

### Phase 2 (Advanced)
- 🧠 Medical Named Entity Recognition (NER)
- 💬 Natural Language Q&A (RAG)
- 📈 Historical trend analysis
- 🎯 Multi-level summaries (Patient/Clinical/Technical)

### Phase 3 (Pro)
- ⚠️ Risk indicators (Cardiovascular, Diabetes)
- 🔐 Role-based access control
- 📋 Audit logging
- 🐳 Production-ready deployment

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Shadcn/UI |
| **API Gateway** | Node.js, Fastify, Prisma, BullMQ |
| **AI Service** | Python, FastAPI, spaCy, LangChain |
| **Database** | Supabase (PostgreSQL), Redis, Qdrant |
| **Infrastructure** | Docker, Vercel, Railway |

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm 8+
- Python 3.11+
- Docker & Docker Compose
- Supabase account

### 1. Clone & Install

```bash
cd healthdoc

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### 2. Start Development Services

```bash
# Start Redis and Qdrant
docker compose -f docker/docker-compose.yml up redis qdrant -d

# Run database migrations
pnpm db:push

# Start all services
pnpm dev
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:3001
- **AI Service**: http://localhost:8000
- **Qdrant Dashboard**: http://localhost:6333/dashboard

## 📁 Project Structure

```
healthdoc/
├── apps/
│   ├── web/              # Next.js Frontend
│   ├── api/              # Node.js API Gateway
│   └── ai-service/       # Python AI/NLP Service
├── packages/
│   └── shared/           # Shared TypeScript types
├── docker/               # Docker configurations
└── docs/                 # Documentation
```

## 🔧 Configuration

### Supabase Setup

1. Create a new Supabase project
2. Enable Row-Level Security (RLS)
3. Create a storage bucket called `medical-reports`
4. Copy your project URL and keys to `.env.local`

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
DATABASE_URL=postgresql://...

# AI/LLM
OPENAI_API_KEY=sk-...

# Services
REDIS_URL=redis://localhost:6379
QDRANT_URL=http://localhost:6333
```

## 📝 Available Scripts

```bash
# Development
pnpm dev              # Start all services
pnpm build            # Build all apps
pnpm lint             # Lint all apps

# Database
pnpm db:migrate       # Run Prisma migrations
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Prisma Studio
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with ❤️ for better healthcare understanding
