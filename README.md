# Aldi Prices

Aldi Prices is a modern Angular web application for tracking and visualizing product prices at Aldi stores over time. It loads price data from a CSV file and provides:

- A responsive, styled table of all raw price entries
- A summary table of products with price statistics and annualized increase
- Product-specific pages with price history and a line chart (Chart.js)
- Navigation between products and views
- Mobile-friendly design and custom branding

## Features
- Loads data from `public/prices.csv`
- Responsive tables and navigation
- Product price history chart with tooltips and labels
- Custom favicon and branding
- Utility service for slug generation

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Install dependencies
```sh
npm install
```

### Run locally (development server)
```sh
npm start
```
- Open [http://localhost:4200](http://localhost:4200) in your browser.
- The app will reload if you make changes to the source files.

### Build for production
```sh
npm run build
```
- The output will be in the `dist/` directory.

### Deploy
1. Copy the contents of the `dist/` directory to your web server or static hosting provider (e.g., Netlify, Vercel, GitHub Pages, S3, etc).
2. Ensure the `public/prices.csv` file is included and accessible.
3. Set your server to serve `index.html` for all routes (for Angular routing).

## Project Structure
- `src/` - Angular source code
- `public/` - Static assets (CSV, favicon, etc)
- `prices.csv` - Product price data

## Customization
- Update `public/prices.csv` to add or edit product prices.
- Edit styles in `src/styles.css` for branding.
- Update favicon in `public/favicon.svg`.

## License
MIT
