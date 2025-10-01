# 📸 Real Screenshot Setup Guide

This guide will help you enable real screenshot capture for your FastFix analyzer.

## 🚀 Quick Setup

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Start the Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

The backend will run on `http://localhost:3001`

### 3. Update Frontend Configuration

Make sure your frontend is pointing to the correct backend URL. Check `src/services/screenshotService.js`:

```javascript
this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

### 4. Test the Setup

1. Start your frontend: `npm run dev`
2. Start your backend: `cd backend && npm run dev`
3. Run an analysis and click "Show Screenshot"
4. You should see real screenshots instead of mock data!

## 🔧 Configuration Options

### Screenshot Options

You can customize screenshot capture by modifying the options in `screenshotService.js`:

```javascript
const options = {
  width: 1200, // Viewport width
  height: 800, // Viewport height
  fullPage: false, // Capture full page or just viewport
  format: 'png', // 'png' or 'jpeg'
  quality: 90, // JPEG quality (1-100)
  scale: 1, // Device scale factor
  waitFor: 1000, // Additional wait time in ms
};
```

### Puppeteer Configuration

For production deployment, you might need to adjust Puppeteer settings in `backend/services/screenshotService.js`:

```javascript
const browser = await puppeteer.launch({
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    // Add more args for your environment
  ],
});
```

## 🌐 Production Deployment

### Docker Setup

Create a `Dockerfile` for the backend:

```dockerfile
FROM node:18-alpine

# Install Chromium dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=3001
NODE_ENV=production
```

### Cloud Deployment Options

1. **Vercel/Netlify Functions**: Use serverless functions
2. **Railway/Render**: Easy deployment with automatic Puppeteer setup
3. **AWS Lambda**: Use `chrome-aws-lambda` for serverless screenshots
4. **Google Cloud Run**: Container-based deployment
5. **DigitalOcean App Platform**: Simple container deployment

## 🛠️ Alternative Screenshot Services

If you prefer not to run your own backend, you can use these services:

### 1. Screenshot API Services

```javascript
// Using htmlcsstoimage.com
const response = await fetch('https://hcti.io/v1/image', {
  method: 'POST',
  headers: {
    Authorization: 'Basic ' + btoa('user_id:api_key'),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: websiteUrl,
    viewport_width: 1200,
    viewport_height: 800,
  }),
});
```

### 2. Browser Extension Approach

```javascript
// Using Chrome Extension API (requires extension)
chrome.tabs.captureVisibleTab(
  null,
  {
    format: 'png',
    quality: 90,
  },
  (dataUrl) => {
    // Handle screenshot
  }
);
```

### 3. Client-Side Screenshot (Limited)

```javascript
// Using html2canvas (only works for same-origin content)
import html2canvas from 'html2canvas';

const canvas = await html2canvas(document.body);
const screenshot = canvas.toDataURL('image/png');
```

## 🔍 Troubleshooting

### Common Issues

1. **Puppeteer fails to launch**

   - Install missing dependencies: `apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2`
   - Use `--no-sandbox` flag in Docker/production

2. **Screenshots are blank**

   - Increase `waitFor` timeout
   - Check if the website blocks headless browsers
   - Verify the URL is accessible

3. **Memory issues**

   - Close browser pages after use
   - Implement browser instance pooling
   - Set memory limits in Docker

4. **CORS errors**
   - Ensure backend CORS is configured correctly
   - Check frontend API URL configuration

### Performance Tips

1. **Reuse browser instances** instead of creating new ones
2. **Implement caching** for frequently requested screenshots
3. **Use queues** for handling multiple screenshot requests
4. **Optimize viewport sizes** based on your needs

## 📊 Features Included

✅ **Basic Screenshots**: Capture any website  
✅ **Issue Highlighting**: Red outlines around problematic elements  
✅ **Before/After Comparisons**: Show fixes visually  
✅ **Responsive Capture**: Different viewport sizes  
✅ **Full Page Screenshots**: Capture entire page content  
✅ **Error Handling**: Graceful fallbacks to mock data  
✅ **Performance Optimized**: Browser instance reuse

## 🎯 Next Steps

1. **Set up the backend** following the steps above
2. **Test with your website** to ensure screenshots work
3. **Customize highlighting** for your specific use cases
4. **Deploy to production** using your preferred platform
5. **Monitor performance** and optimize as needed

Need help? Check the troubleshooting section or create an issue in the repository!
