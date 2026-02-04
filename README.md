# ThemeGrab

A free web tool that extracts Tailwind/shadcn CSS theme variables from any website URL or uploaded screenshot. Outputs ready-to-paste CSS variables for Lovable.dev, v0.dev, and more.

## Features

- **URL Extraction**: Paste any website URL and extract the color palette from its CSS
- **Screenshot Analysis**: Upload a screenshot and extract dominant colors using color quantization
- **Ready-to-Use CSS**: Get shadcn/ui compatible CSS variables that work with Lovable.dev, v0.dev, and more
- **Live Preview**: See how your extracted theme looks in real-time with light/dark mode toggle
- **One-Click Copy**: Copy CSS variables directly to your clipboard

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Deployment**: Cloudflare Pages

## Getting Started

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be available at http://localhost:5173

### Build

```bash
npm run build
```

### Deploy to Cloudflare Pages

1. Connect your repository to Cloudflare Pages
2. Set the build command to `npm run build`
3. Set the output directory to `dist`
4. Deploy!

Or deploy manually:

```bash
npm run deploy
```

## Project Structure

```
theme-extractor/
├── src/
│   ├── components/
│   │   ├── url-input.tsx        # URL input form
│   │   ├── screenshot-upload.tsx # Screenshot upload with drag-drop
│   │   ├── theme-output.tsx     # CSS output with copy button
│   │   ├── theme-preview.tsx    # Live theme preview
│   │   └── ui/                  # shadcn components
│   ├── lib/
│   │   ├── color-utils.ts       # Color conversion/manipulation
│   │   ├── theme-generator.ts   # Theme variable mapping logic
│   │   └── utils.ts             # Utility functions
│   ├── App.tsx
│   └── main.tsx
├── functions/
│   └── api/
│       └── extract.ts           # Cloudflare Pages Function
├── public/
├── index.html
├── vite.config.ts
└── package.json
```

## How It Works

### URL-based Extraction
1. User pastes a URL
2. The API fetches the page's HTML and linked stylesheets
3. All color values are extracted (hex, rgb, hsl, named colors)
4. Colors are mapped to semantic roles (background, foreground, primary, etc.)
5. Light and dark theme variables are generated

### Screenshot-based Extraction
1. User uploads a screenshot
2. Image is processed using median cut color quantization
3. Dominant colors are extracted and deduplicated
4. Colors are mapped to theme variables

## License

MIT
