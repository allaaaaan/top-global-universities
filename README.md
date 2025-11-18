# Top Global Universities 2024

A modern, static web application showcasing the top 30 universities worldwide with comprehensive rankings, locations, and program highlights. Built with Next.js and optimized for iPad landscape viewing.

## Features

- **Master-Detail Layout**: Split-view interface with university list (left) and detailed information (right)
- **No Backend Required**: All data stored in structured JSON files
- **iPad Optimized**: Designed for 1024x768 landscape viewing with touch-friendly interactions
- **Smooth Navigation**: Single-page app with instant state-based updates
- **Modern UI**: Clean design with Tailwind CSS, custom scrollbars, and smooth transitions
- **TypeScript**: Fully typed for better development experience

## Tech Stack

- **Framework**: Next.js 16.0.3 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI**: React 19

## Project Structure

```
top-global-universities/
├── app/
│   ├── components/           # React components
│   │   ├── BackToTop.tsx     # Floating scroll-to-top button
│   │   ├── UniversityCard.tsx # Individual university list item
│   │   ├── UniversityDetail.tsx # University detail panel
│   │   └── UniversityList.tsx   # Left sidebar with all universities
│   ├── globals.css           # Global styles and iPad optimizations
│   ├── layout.tsx            # Root layout with metadata
│   └── page.tsx              # Main page with master-detail layout
├── data/
│   ├── types.ts              # TypeScript interfaces
│   ├── universities.json     # University data (30 entries)
│   └── index.ts              # Data exports and helper functions
└── public/                   # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm, yarn, pnpm, or bun package manager

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the app.

### Build for Production

```bash
# Create optimized production build
npm run build

# Start production server
npm run start
```

## Data Structure

Universities are stored in `/data/universities.json` with the following structure:

```typescript
interface University {
  id: string;
  rank: number;
  name: string;
  shortName: string;
  location: {
    city: string;
    country: string;
  };
  description: string;
  majors: string[];
}
```

## Usage

1. **Browse Universities**: Scroll through the left sidebar to view all 30 ranked universities
2. **View Details**: Click any university to see full details in the right panel
3. **Navigation**: The selected university is highlighted with a blue background
4. **Scroll**: Use the floating "Back to Top" button when viewing long content

## Optimization for iPad

- Touch-friendly button sizes (minimum 44x44px)
- Optimized viewport for 1024x768 landscape orientation
- Custom scrollbar styling
- Smooth scroll behavior
- Responsive layout that adapts to different screen sizes

## License

Private project - not licensed for public distribution.

## Development

Built with modern web technologies for optimal performance and user experience. No backend or database required - perfect for static hosting on Vercel, Netlify, or similar platforms.
