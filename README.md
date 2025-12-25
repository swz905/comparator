# 🔍 Comparator

**AI-Powered Universal Comparison Tool** - Compare anything with real-time web data and intelligent analysis.

## ✨ Features

- 🤖 **AI-Powered Comparisons** - Perplexity AI + Groq LLM
- 📊 **Table & Chart Views** - Toggle between detailed table and radar charts
- ✨ **Auto Spell Correction** - Fixes typos automatically
- 🏆 **Winner Indicators** - Shows best item per metric
- 💡 **Metric Tooltips** - Hover for explanations
- ⚙️ **Custom Parameters** - Add your own comparison metrics
- 🖼️ **Product Images** - Auto-fetches images when available
- 📚 **Source Citations** - All data with clickable sources

## 🚀 Deploy to Vercel

### 1. Fork/Clone & Import to Vercel
Import this repo at [vercel.com/new](https://vercel.com/new)

### 2. Add Environment Variables in Vercel
Go to **Settings → Environment Variables** and add:

| Key | Value |
|-----|-------|
| `VITE_PERPLEXITY_API_KEY` | Your Perplexity API key |
| `VITE_GROQ_API_KEY` | Your Groq API key |

### 3. Deploy!
Vercel will automatically build and deploy.

## 🔑 Get API Keys

- **Perplexity**: [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
- **Groq**: [console.groq.com/keys](https://console.groq.com/keys)

## 💻 Local Development

### Option 1: With Node.js/npm
```bash
# Clone
git clone https://github.com/swz905/comparator.git
cd comparator

# Install & create .env
npm install
cp .env.example .env
# Edit .env with your API keys

# Run dev server
npm run dev
```

### Option 2: Without Node.js (Simple)
```bash
# Clone
git clone https://github.com/swz905/comparator.git
cd comparator

# Copy and edit config
cp config.example.js config.js
# Edit config.js with your API keys

# Serve
python -m http.server 8000
# Open http://localhost:8000
```

## 📁 Project Structure

```
comparator/
├── index.html          # Main page
├── style.css           # Teal theme styles
├── script.js           # App logic
├── config.js           # Local API keys (gitignored)
├── config.example.js   # Config template
├── .env                # Vite env vars (gitignored)
├── .env.example        # Env template
├── vite.config.js      # Vite configuration
├── package.json        # Dependencies
└── README.md
```

## 🔒 Security

- API keys in `.env` and `config.js` are **gitignored**
- For Vercel: Use Environment Variables (never commit keys)
- For production: Consider a backend proxy

## 📝 License

MIT License

---
Made with ❤️ using AI
