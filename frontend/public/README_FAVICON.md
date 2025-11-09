# Favicon Setup

To add your favicon to the ProteinArchitect application:

## Option 1: Single Favicon (Simplest)
1. Place your favicon image file as `favicon.ico` in this directory (`frontend/public/`)
2. The file should be 32x32 or 16x16 pixels in .ico format

## Option 2: Multiple Formats (Recommended)
For best compatibility across all browsers and devices, add these files:
- `favicon.ico` - 32x32 or 16x16 pixels (required)
- `favicon-32x32.png` - 32x32 pixels PNG
- `favicon-16x16.png` - 16x16 pixels PNG  
- `apple-touch-icon.png` - 180x180 pixels PNG (for iOS)

## Converting Your Image
If you have an image file (PNG, JPG, SVG), you can:
1. Use an online converter like https://favicon.io/favicon-converter/
2. Or use ImageMagick: `convert your-image.png -resize 32x32 favicon.ico`

## Current Setup
The `index.html` file is already configured to use these favicon files from the `/public` directory.
Vite automatically serves files from the `public` directory at the root URL.

