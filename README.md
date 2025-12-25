# 🔍 Comparator

**AI-Powered Universal Comparison Tool** - Compare anything with real-time web data and intelligent analysis.

![Comparator Screenshot](screenshot.png)

## ✨ Features

- **🤖 AI-Powered Comparisons** - Uses Perplexity AI for real-time web search and Groq LLM for intelligent analysis
- **📊 Table & Chart Views** - Toggle between detailed table view and visual radar/spider charts
- **✨ Auto Spell Correction** - Automatically corrects typos in item names
- **🏆 Winner Indicators** - Shows which item is best for each metric with visual badges
- **💡 Metric Tooltips** - Hover over metrics to see explanations
- **⚙️ Custom Parameters** - Add your own comparison metrics
- **🎯 Custom Only Mode** - Compare using only your specified parameters
- **🖼️ Product Images** - Auto-fetches and displays images when available
- **📚 Source Citations** - All data comes with clickable source links

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/comparator.git
cd comparator
```

### 2. Configure API Keys

Copy the example config file and add your API keys:

```bash
cp config.example.js config.js
```

Edit `config.js` with your API keys:

```javascript
const CONFIG = {
    PERPLEXITY_API_KEY: 'your_perplexity_key_here',
    GROQ_API_KEY: 'your_groq_key_here',
    // ... other settings
};
```

### 3. Get API Keys

- **Perplexity API**: Sign up at [perplexity.ai](https://www.perplexity.ai/) and get your key from [API Settings](https://www.perplexity.ai/settings/api)
- **Groq API**: Sign up at [groq.com](https://groq.com/) and get your key from [Console](https://console.groq.com/keys)

### 4. Run the Application

Simply open `index.html` in a browser, or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve
```

Then open http://localhost:8000

## 📁 Project Structure

```
comparator/
├── index.html          # Main HTML file
├── style.css           # Styles with teal theme
├── script.js           # Main application logic
├── config.js           # Your API keys (gitignored)
├── config.example.js   # Template for config
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## 🛠️ How It Works

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Input    │────▶│  Perplexity API  │────▶│   Groq LLM      │
│  (Items to      │     │  (Web Search)    │     │  (Analysis &    │
│   compare)      │     │                  │     │   Comparison)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                        ┌──────────────────────────────────────────┐
                        │              Results Display             │
                        │  ┌─────────┐  ┌─────────┐  ┌──────────┐ │
                        │  │  Table  │  │  Chart  │  │  Sources │ │
                        │  └─────────┘  └─────────┘  └──────────┘ │
                        └──────────────────────────────────────────┘
```

### Flow

1. **Input**: User enters 2-5 items to compare
2. **Spell Check**: LLM corrects any spelling mistakes
3. **Research**: Perplexity searches for each item's details
4. **Analysis**: Groq LLM generates structured comparison with:
   - Relevant metrics with descriptions
   - Values with proper units
   - Winner determination per metric
5. **Display**: Results shown in table/chart with sources

## ⚙️ Configuration

| Option | Description | Default |
|--------|-------------|---------|
| `PERPLEXITY_API_KEY` | Your Perplexity API key | Required |
| `GROQ_API_KEY` | Your Groq API key | Required |
| `GROQ_MODEL` | Groq model to use | `llama-3.3-70b-versatile` |
| `PERPLEXITY_MODEL` | Perplexity model | `sonar` |
| `MAX_ITEMS` | Maximum items to compare | `5` |
| `MIN_ITEMS` | Minimum items required | `2` |
| `MAX_ADDITIONAL_SEARCHES` | Cap for follow-up searches | `2` |

## 🎨 Customization

### Changing Colors

Edit the CSS variables in `style.css`:

```css
:root {
    --primary-color: #14b8a6;       /* Main teal color */
    --primary-dark: #0d9488;        /* Darker teal */
    --primary-light: #2dd4bf;       /* Lighter teal */
    --bg-dark: #021a19;             /* Background */
}
```

### Adding Example Categories

Edit the example chips in `index.html`:

```html
<button class="example-chip" data-example="Item1, Item2, Item3">
    🏷️ Category Name
</button>
```

## 🔒 Security Notes

- **Never commit `config.js`** - It contains your API keys
- The `.gitignore` is configured to exclude it
- For production, use a backend server to protect API keys

## 📝 License

MIT License - Feel free to use, modify, and distribute.

## 🙏 Credits

- [Perplexity AI](https://perplexity.ai) - Real-time web search API
- [Groq](https://groq.com) - Fast LLM inference
- [Chart.js](https://chartjs.org) - Radar chart visualization
- [Google Fonts](https://fonts.google.com) - Inter & Outfit fonts

---

Made with ❤️ using AI
