# ShotBuilder

A React application for building and generating photo prompts by combining random ingredients across categories. Built with Vite, Bootstrap 5, Recharts, and sonner.

## Features

- **5 fixed categories**: Character, Clothing, Pose, Location, Camera Settings
- **Ingredient management**: Add, edit (double-click), and delete ingredients per category
- **CSV import**: Bulk-load ingredients into a category from a CSV file (one ingredient per line, quoted fields supported, optional header row)
- **Prompt generation**: Picks a random ingredient from each category with frequency-weighted selection (least-used ingredients are more likely to be picked)
- **Pin to keep**: Click any ingredient ID to pin it — pinned items stay fixed across generations
- **Usage tracking**: Usage is only registered when you click **Copy**, not on every generate
- **Toast notifications**: Sonner-powered feedback for Save, Edit, Delete, Copy, and Import actions
- **Delete confirmation**: Confirms before deleting any ingredient
- **Persistent storage**: Uses localforage (IndexedDB) to save ingredients, prompt history, and usage statistics
- **Usage dashboard**: Stacked bar chart with category-based HSL colors showing how many times each ingredient has been used
- **Star Ingredient**: Dashboard widget that shows the most-used ingredient per category
- **Sequential IDs**: Each ingredient gets a unique categorical ID (100s for Character, 200s for Clothing, etc.)
- **Prompt history**: Every confirmed prompt is logged; browse all history in the History page, view details, copy or re-generate any past prompt
- **Activity summary**: History shows total prompts, prompts used today, and prompts used this week
- **Ingredient search**: Debounced search (300ms) that waits until you finish typing (simulates a network request)
- **Image preview**: Generates an image from the current prompt via the Hugging Face API (FLUX.1-schnell), with confirmation before consuming the API; requires an API key in Settings
- **Reset generator**: Restores the Generate screen to its initial state (clears pins, textarea, and preview)
- **Localization**: Full English / Spanish support via i18next
- **Date formatting**: Timestamps are formatted with Day.js (e.g. `YYYY-MM-DD HH:mm` in History)
- **Import / Export**: Download all ingredients as JSON and restore them later

## Tech Stack

| Tool | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite 5** | Build tool |
| **Bootstrap 5** | CSS framework (CDN) |
| **Recharts** | Stacked bar chart |
| **sonner** | Toast notifications |
| **localforage** | Client-side storage (IndexedDB) |
| **react-router-dom** | Client-side routing (HashRouter) |
| **i18next / react-i18next** | Localization (English / Spanish) |
| **Day.js** | Date formatting |
| **@huggingface/inference** | Image preview generation (FLUX.1-schnell) |

## Getting Started

```sh
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build for production

```sh
npm run build
npm run preview
```

## Usage

### Sidebar navigation

```
┌──────────────────────────────┐
│  ShotBuilder                 │
├──────────────────────────────┤
│  Dashboard                   │
│                              │
│  GENERATION                  │
│  Prompt                      │
│  History                     │
│                              │
│  CATEGORIES                  │
│  Character                   │
│  Clothing                    │
│  Pose                        │
│  Location                    │
│  Camera Settings             │
│                              │
│  CONFIGURATION               │
│  Settings                    │
└──────────────────────────────┘
```

### Adding ingredients

1. Click a category in the sidebar
2. Type the ingredient text in the inline form
3. Click **Save** — stored with a sequential ID (e.g., `101`, `102`, `201`, `202`)
4. **Double-click** any ingredient text to edit it inline
5. **Search**: The search field filters ingredients by text (case-insensitive), debounced 300ms. Empty results show a "no matches" message
6. **Import from CSV**: Click **Import CSV** on a category page, choose a `.csv` file, and confirm — each line becomes a new ingredient (appended to existing ones). Use the "skip header row" option if your file has a header. Fields with commas must be quoted (`"text, with commas"`)

### Image preview

The **Preview** button generates an image from the current prompt via the Hugging Face API. Before any request is made, a confirmation explains what will happen. A Hugging Face API key must be configured in **Settings → API Keys**; otherwise Preview shows an error prompting you to configure one.

### Generating prompts

1. Ensure each category has at least one ingredient
2. Click **Generate** in the sidebar
3. Click **Generate** — a random ingredient is picked from each category
4. **Pin IDs**: Click any generated ID (`Character: 101`) to keep that item fixed on next generate
5. Review the prompt in the textarea
6. **Preview** (optional): Click **Preview** → a confirmation explains that the prompt will be sent to the Hugging Face API to generate an image. Confirm to run it. Requires a Hugging Face API key configured in Settings
7. Click **Copy** — copies to clipboard and registers the usage in statistics
8. **Reset**: Clears the screen back to its initial state (removes pins, clears the textarea and any preview, re-disables Copy/Preview)
9. **Re-generate** from History: click any past prompt → Re-generate opens `/generate` with those ingredients pinned, ready to tweak or copy

### Prompt IDs

Each generated prompt gets a composite ID from the selected ingredient IDs:

```
101-203-304-403-501
│    │   │   │   └── Camera Settings ingredient
│    │   │   └────── Location ingredient
│    │   └────────── Pose ingredient
│    └────────────── Clothing ingredient
└─────────────────── Character ingredient
```

### Import / Export

- **Export**: Click *Download prompts.json* to save all ingredients as a JSON file
- **Import**: Choose a `.json` file with the same structure, confirm when asked — replaces all existing ingredients

## Data model

### IDs

| Category | Internal ID | Base ID | Ingredient IDs |
|---|---|---|---|
| Character | `personaje` | 100 | 101, 102, 103… |
| Clothing | `vestimenta` | 200 | 201, 202, 203… |
| Pose | `pose` | 300 | 301, 302, 303… |
| Location | `escena` | 400 | 401, 402, 403… |
| Camera Settings | `camara` | 500 | 501, 502, 503… |

### localforage schema

```json
{
  "personaje": [{ "id": 101, "text": "a knight" }],
  "vestimenta": [{ "id": 201, "text": "leather armor" }],
  "pose": [{ "id": 301, "text": "standing ready" }],
  "escena": [{ "id": 401, "text": "a dark forest" }],
  "camara": [{ "id": 501, "text": "low angle" }],
  "promptHistory": [
    {
      "id": "101-201-301-401-501",
      "usedIds": { "personaje": 101, "vestimenta": 201, "pose": 301, "escena": 401, "camara": 501 },
      "timestamp": 1700000000000
    }
  ],
  "usageStats": {
    "101": 5,
    "201": 3
  }
}
```

API keys are stored separately under a different localforage key (`promptgen_api_keys`).

## Project structure

```
src/
├── main.jsx                # Entry point
├── App.jsx                 # HashRouter with 5 routes: /, /generate, /history, /list/:categoryId, /settings
├── App.css                 # Global styles (Material 3 palette)
├── i18n.js                 # i18next setup (English / Spanish)
├── data/
│   └── categories.js       # Category definitions with base IDs
├── hooks/
│   ├── useData.js          # localforage CRUD by id, prompt generation (inverse frequency), usage stats, import
│   ├── useApiKeys.js       # Hugging Face API key storage (localforage)
│   └── useDebouncedValue.js# Debounce hook for the ingredient search
├── lib/
│   ├── dayjs.js            # Date formatting helpers (YYYY-MM-DD, YYYY-MM-DD HH:mm)
│   └── csv.js              # CSV parser for the per-category import
├── contexts/
│   ├── DataContext.jsx     # Context provider: data, promptHistory, usageStats, generate/confirm/reset
│   └── ApiKeysContext.jsx  # Context provider: apiKeys, saveApiKey, deleteApiKey
├── locales/
│   ├── en.json             # English translations
│   └── es.json             # Spanish translations
├── views/
│   ├── Dashboard.jsx       # Stat cards, usage chart, Last Prompts and Star Ingredient widgets
│   ├── Generate.jsx        # ID pin toggles, Generate/Preview/Copy/Reset, preview confirmation modal
│   ├── History.jsx         # Activity summary + paginated history, view/copy/re-generate modal
│   ├── ListView.jsx        # Inline add/edit/delete by id + debounced search per category
│   └── Settings.jsx        # API keys + JSON export/import with validation and confirm modal
└── components/
    ├── Sidebar.jsx         # Navigation via react-router-dom (grouped sections)
    ├── NavItem.jsx         # Sidebar link item
    ├── StatCard.jsx        # Reusable stat card
    ├── StarIngredient.jsx  # Most-used ingredient per category widget
    └── LastPrompts.jsx     # 5 most recent prompts widget
```

## License

MIT
