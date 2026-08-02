# ShotBuilder

ShotBuilder helps photographers and creators build and generate photo prompts by combining random ingredients across categories. Built with Vite, React, Bootstrap 5, Recharts, and sonner.

## Features

- **Endless prompt ideas** — one click combines random ingredients across 6 categories (Character, Clothing, Pose, Location, Camera Settings, Technique) into a ready-to-use photo prompt.
- **Break out of creative ruts** — frequency-aware randomness favors your least-used ingredients, so you naturally explore your whole catalog.
- **Iterate without starting over** — pin any ingredient to lock it while the rest randomize.
- **Grow your catalog in seconds** — add ingredients inline, edit with a double-click, import a whole list from CSV, and export any category back to CSV anytime.
- **Your work is always safe** — ingredients, history, and stats live in your browser; no accounts, no servers.
- **Know what's working** — a dashboard shows usage per ingredient, your star ingredient in each category, and today/week activity totals.
- **Never lose a great shot** — every copied prompt is logged; revisit, copy, or re-generate it from History.
- **See it before you shoot** — optional AI image preview of any prompt (Hugging Face, your own API key).
- **Built for every workflow** — English/Spanish, responsive on mobile and desktop, works offline.

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
│  Technique                   │
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
7. **Export to CSV**: Click **Export CSV** to download the category's ingredients as `{categoryId}.csv` — the same format Import CSV reads, so you can back up or move a category anytime

### Image preview

The **Preview** button generates an image from the current prompt via the Hugging Face API. Before any request is made, a confirmation explains what will happen. A Hugging Face API key must be configured in **Settings → API Keys**; otherwise Preview shows an error prompting you to configure one.

The model used for previews is configurable in **Settings → API Keys → Preview Model**: **FLUX.1-schnell** (default), **Z-Image-Turbo**, or **Qwen-Image**. If a model is unavailable, Preview shows an error suggesting you try another model or switch back to the default.

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
101-203-304-403-501-601
│    │   │   │   │   └── Technique ingredient
│    │   │   │   └────── Camera Settings ingredient
│    │   │   └────────── Location ingredient
│    │   └────────────── Pose ingredient
│    └────────────────── Clothing ingredient
└─────────────────────── Character ingredient
```

### Import / Export

- **Export CSV (per category)**: The **Export CSV** button on any category page downloads that category's ingredients as `{categoryId}.csv` — the same format Import CSV reads
- **Export all (JSON)**: Click *Download prompts.json* in Settings to save every ingredient as a JSON file
- **Import (JSON)**: Choose a `.json` file in Settings — replaces all existing ingredients; categories missing from the file are imported as empty

### Deleting data

**Settings → Delete data** permanently removes data from this browser (no undo):

- **Delete prompts** — removes all ingredients, prompt history, and usage statistics
- **Delete settings** — removes API keys and resets the language to English
- **Delete everything** — both of the above at once

Each action shows a confirmation dialog before anything is deleted.

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
| **@huggingface/inference** | Image preview generation (model selectable in Settings) |

### Implementation notes

- Data is persisted with localforage (IndexedDB); API keys and the selected preview model are stored separately under their own keys
- Each category uses sequential base IDs (100s–600s), producing composite prompt IDs like `101-201-301-401-501-601`
- Prompt generation is frequency-weighted: least-used ingredients are more likely to be picked, and usage is only registered when you click **Copy**
- The ingredient search is debounced (300ms) to wait until you finish typing
- Timestamps are formatted with Day.js; Bootstrap 5 is served via CDN; stacked bars are colored by category hue (HSL)

## Project structure

```
promptgen/
├── samples/                # Ready-to-import CSV files (one per category, es_en naming)
└── src/
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
    │   └── csv.js              # CSV parser/serializer for the per-category import/export
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
    │   ├── ListView.jsx        # Inline add/edit/delete by id + debounced search + CSV import/export per category
    │   └── Settings.jsx        # API keys + JSON export/import with validation and confirm modal
    └── components/
        ├── Sidebar.jsx         # Navigation via react-router-dom (grouped sections)
        ├── NavItem.jsx         # Sidebar link item
        ├── StatCard.jsx        # Reusable stat card
        ├── StarIngredient.jsx  # Most-used ingredient per category widget (composite prompt ID + modal)
        └── LastPrompts.jsx     # 5 most recent prompts widget
```

## Data model

### IDs

| Category | Internal ID | Base ID | Ingredient IDs |
|---|---|---|---|
| Character | `personaje` | 100 | 101, 102, 103… |
| Clothing | `vestimenta` | 200 | 201, 202, 203… |
| Pose | `pose` | 300 | 301, 302, 303… |
| Location | `escena` | 400 | 401, 402, 403… |
| Camera Settings | `camara` | 500 | 501, 502, 503… |
| Technique | `tecnica` | 600 | 601, 602, 603… |

### localforage schema

```json
{
  "personaje": [{ "id": 101, "text": "a knight" }],
  "vestimenta": [{ "id": 201, "text": "leather armor" }],
  "pose": [{ "id": 301, "text": "standing ready" }],
  "escena": [{ "id": 401, "text": "a dark forest" }],
  "camara": [{ "id": 501, "text": "low angle" }],
  "tecnica": [{ "id": 601, "text": "watercolor splash" }],
  "promptHistory": [
    {
      "id": "101-201-301-401-501-601",
      "usedIds": { "personaje": 101, "vestimenta": 201, "pose": 301, "escena": 401, "camara": 501, "tecnica": 601 },
      "timestamp": 1700000000000
    }
  ],
  "usageStats": {
    "101": 5,
    "201": 3
  }
}
```

API keys and the selected preview model are stored separately under their own localforage keys (`promptgen_api_keys`, `promptgen_preview_model`).

## License

MIT
