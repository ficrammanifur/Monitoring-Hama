<div align="center">

# 🐒 Monkey Detection Frontend Dashboard

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-222222?style=for-the-badge&logo=github&logoColor=white)](https://pages.github.com/)

</div>

---

## 📋 Daftar Isi

- [🎯 Tentang Proyek](#-tentang-proyek)
- [✨ Fitur Utama](#-fitur-utama)
- [🖼️ Screenshots](#️-screenshots)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Instalasi](#️-instalasi)
- [🔧 Konfigurasi](#-konfigurasi)
- [📡 API Integration](#-api-integration)
- [🔧 Troubleshooting](#-troubleshooting)
- [📊 System Architecture](#-system-architecture)
- [🔄 Data Flow Diagram](#-data-flow-diagram)
- [🎨 UI Components](#-ui-components)
- [🚀 Advanced Features](#-advanced-features)
- [📈 Performance Optimization](#-performance-optimization)
- [🔒 Security Considerations](#-security-considerations)
- [🤝 Contributing](#-contributing)
- [📝 License](#-license)
- [🙏 Acknowledgments](#-acknowledgments)

## 🎯 Tentang Proyek

Monkey Detection Frontend Dashboard adalah antarmuka web modern untuk sistem monitoring deteksi monyet berbasis YOLOv8. Dashboard ini menyediakan visualisasi real-time, statistik deteksi, dan riwayat aktivitas dalam desain yang responsif dan user-friendly.

### 🌟 Highlights

- 🎨 **Modern Dark Theme** dengan aksen hijau yang eye-catching
- 📱 **Fully Responsive** - Perfect di desktop, tablet, dan mobile
- ⚡ **Real-time Updates** setiap 5 detik otomatis
- 🔔 **Smart Notifications** untuk deteksi baru
- 📊 **Interactive Statistics** dengan animasi smooth
- 📋 **Comprehensive History** dengan filtering dan search
- 🚀 **Zero Dependencies** - Pure HTML, CSS, JavaScript
- 🌐 **GitHub Pages Ready** - Deploy dalam hitungan menit

## ✨ Fitur Utama

### 🎥 Live Video Monitoring
- Real-time video feed dari backend YOLOv8
- Adaptive streaming dengan fallback handling
- Full-screen mode untuk monitoring detail
- Connection status indicator dengan auto-reconnect

### 📊 Smart Statistics Dashboard
- Current monkey count dengan real-time updates
- Last detection timestamp dengan relative time
- System status monitoring (Online/Offline/Warning)
- Daily detection summary dengan trend indicators

### 📋 Advanced History Management
- Comprehensive detection log dengan timestamp detail
- Sortable columns untuk analisis data
- Search functionality untuk filter cepat
- Export capabilities ke CSV format
- Pagination support untuk dataset besar

### 🔔 Intelligent Notifications
- Toast notifications untuk deteksi baru
- Sound alerts (optional) untuk high-priority events
- Custom alert thresholds untuk monitoring khusus
- Notification history dengan dismiss functionality

### 🎨 Premium UI/UX
- Smooth animations dan micro-interactions
- Loading states untuk semua async operations
- Error boundaries dengan user-friendly messages
- Accessibility compliant dengan ARIA labels
- Dark mode optimized untuk penggunaan 24/7

## 🖼️ Screenshots

### 🖥️ Desktop View
![Desktop Dashboard](screenshots/desktop-view.png)

### 📱 Mobile View
![Mobile Dashboard](screenshots/mobile-view.png)

### 📊 Statistics Cards
![Statistics](screenshots/statistics-cards.png)

## 🚀 Quick Start

### ⚡ 1-Minute Setup

\`\`\`bash
# Clone repository
git clone https://github.com/yourusername/monkey-detection-frontend.git
cd monkey-detection-frontend

# Open in browser
open index.html
# Atau double-click file index.html
\`\`\`

### 🌐 GitHub Pages Deployment

1. Fork repository ini ke akun GitHub Anda
2. Enable GitHub Pages di Settings → Pages
3. Select source: Deploy from branch `main`
4. Access your dashboard: `https://yourusername.github.io/monkey-detection-frontend`

🎉 **That's it!** Dashboard Anda sudah live dalam 2 menit!

## ⚙️ Instalasi

### 📋 Prerequisites

- Web Browser modern (Chrome 80+, Firefox 75+, Safari 13+)
- Backend API YOLOv8 running di `http://localhost:5000`
- HTTPS connection untuk production deployment

### 🔧 Local Development

\`\`\`bash
# 1. Clone repository
git clone https://github.com/yourusername/monkey-detection-frontend.git
cd monkey-detection-frontend

# 2. Start local server (optional)
python -m http.server 8000
# Atau menggunakan Node.js
npx serve .

# 3. Open browser
open http://localhost:8000
\`\`\`

### 🌍 Production Deployment

#### GitHub Pages (Recommended)

\`\`\`bash
# 1. Push ke GitHub repository
git add .
git commit -m "Deploy frontend dashboard"
git push origin main

# 2. Enable GitHub Pages di repository settings
# 3. Dashboard akan tersedia di: https://yourusername.github.io/repo-name
\`\`\`

#### Netlify Deployment

\`\`\`bash
# 1. Connect GitHub repository ke Netlify
# 2. Set build command: (kosong)
# 3. Set publish directory: /
# 4. Deploy otomatis setiap push ke main branch
\`\`\`

#### Vercel Deployment

\`\`\`bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel --prod

# 3. Follow prompts untuk configuration
\`\`\`

## 🔧 Konfigurasi

### 🔗 API Configuration

Edit `main.js` untuk mengubah endpoint backend:

\`\`\`javascript
// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';  // Development
// const API_BASE_URL = 'https://your-backend.herokuapp.com/api';  // Production

// Video Stream Configuration
const VIDEO_STREAM_URL = 'http://localhost:5000/video_feed';  // Development
// const VIDEO_STREAM_URL = 'https://your-backend.herokuapp.com/video_feed';  // Production

// Update intervals (milliseconds)
const REFRESH_INTERVAL = 5000;  // 5 seconds
const RETRY_INTERVAL = 3000;    // 3 seconds for failed requests
\`\`\`

### 🎨 Theme Customization

Edit `style.css` untuk mengubah tema:

\`\`\`css
:root {
  /* Primary Colors */
  --primary-green: #00ff88;    /* Change to your brand color */
  --dark-bg: #0a0a0a;         /* Main background */
  --card-bg: #1a1a1a;         /* Card backgrounds */
  
  /* Text Colors */
  --text-primary: #ffffff;     /* Main text */
  --text-secondary: #b0b0b0;   /* Secondary text */
  --text-muted: #666666;       /* Muted text */
}
\`\`\`

### 📱 Responsive Breakpoints

\`\`\`css
/* Customize responsive behavior */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;  /* Single column on mobile */
  }
}

@media (min-width: 1200px) {
  .container {
    max-width: 1400px;  /* Wider on large screens */
  }
}
\`\`\`

## 📡 API Integration

### 🔌 Required Endpoints

Dashboard membutuhkan backend API dengan endpoints berikut:

#### 1. Video Stream Endpoint

```http
GET /video_feed
Content-Type: multipart/x-mixed-replace; boundary=frame

Response: MJPEG video stream

<p><a href="#top">⬆ Back to Top</a></p>

</div>
```
#### 2. Detection Statistics Endpoint

```plaintext
GET /api/stats
Content-Type: application/json

Response:
{
  "current_count": 2,
  "last_detection": "2024-01-15T10:30:00Z",
  "system_status": "online",
  "total_detections": 150
}
```

#### 3. Detection History Endpoint

```plaintext
GET /api/history
Content-Type: application/json

Response:
{
  "history": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "count": 3,
      "location": "Camera 1",
      "confidence": 0.85
    }
  ]
}
```

### Error Handling

```javascript
// Automatic retry untuk failed requests
async function fetchWithRetry(url, options = {}, retries = 3) {
for (let i = 0; i < retries; i++) {
try {
const response = await fetch(url, options);
if (response.ok) return response;
} catch (error) {
if (i === retries - 1) throw error;
await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
}
}
}

```plaintext

### 🔐 CORS Configuration

Backend harus mengizinkan CORS untuk frontend:

```python
# Flask backend CORS setup
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=['https://yourusername.github.io'])
```

## Troubleshooting

### Common Issues

#### 1. Video Feed Not Loading

**Symptoms:** Video feed menampilkan loading spinner terus-menerus

**Solutions:**

```bash

# Check backend status

curl [http://localhost:5000/video_feed](http://localhost:5000/video_feed)

# Check CORS headers

curl -H "Origin: [https://yourusername.github.io](https://yourusername.github.io)" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: X-Requested-With" -X OPTIONS [http://localhost:5000/video_feed](http://localhost:5000/video_feed)

```plaintext

#### 2. API Connection Failed

**Symptoms:** Statistics dan history tidak ter-load

**Solutions:**

\`\`\`javascript
// Check network connectivity
fetch('http://localhost:5000/api/stats')
  .then(response => console.log('API Status:', response.status))
  .catch(error => console.error('API Error:', error));

// Enable debug mode
localStorage.setItem('debug', 'true');
```

#### 3. HTTPS Mixed Content Error

**Symptoms:** Error di browser console tentang mixed content

**Solutions:**

```bash

# Use HTTPS untuk backend atau deploy ke HTTPS

# Atau gunakan ngrok untuk testing:

ngrok http 5000

# Kemudian update API_BASE_URL ke [https://xxx.ngrok.io](https://xxx.ngrok.io)

```plaintext

#### 4. GitHub Pages Not Updating

**Symptoms:** Changes tidak muncul di GitHub Pages

**Solutions:**

\`\`\`bash
# Clear browser cache
# Ctrl + F5 (hard refresh)

# Check GitHub Actions
# Repository -> Actions tab -> Check deployment status

# Wait 5-10 minutes untuk propagation
```

#### 5. Mobile Display Issues

**Symptoms:** Layout rusak di mobile device

**Solutions:**

```html
<!-- Pastikan viewport meta tag ada di index.html -->
`<meta name="viewport" content="width=device-width, initial-scale=1.0">`

```plaintext

## 📊 System Architecture

```

┌─────────────────┐    HTTP/API     ┌──────────────────┐    Camera    ┌─────────────────┐
│  Web Dashboard  │◄───────────────►│  Flask Backend   │◄────────────►│   Camera/Video  │
│                 │                 │                  │              │     Input       │
│ - HTML/CSS/JS   │                 │ - YOLOv8 Model   │              │                 │
│ - Real-time UI  │                 │ - Video Stream   │              │ - USB Camera    │
│ - Statistics    │                 │ - Detection API  │              │ - IP Camera     │
│ - History Table │                 │ - Data Storage   │              │ - Video File    │
└─────────────────┘                 └──────────────────┘              └─────────────────┘

```plaintext

## 🔄 Data Flow Diagram

\`\`\`mermaid
flowchart TD
    A[📹 Camera Input] --> B[🤖 YOLOv8 Model]
    B --> C{🔍 Object Detection}
    C -->|Monyet Detected| D[📊 Detection Results]
    C -->|No Detection| E[🔄 Continue Processing]
    
    D --> F[💾 Store in Database]
    D --> G[📡 Video Stream with Annotations]
    
    F --> H[🌐 REST API]
    G --> I[📺 Live Video Feed]
    H --> J[🖥️ Web Dashboard]
    I --> J
    
    J --> K[📊 Update Statistics Cards]
    J --> L[📋 Update History Table]
    J --> M[🔔 Trigger Notifications]
    
    K --> N[🎨 Render Animations]
    L --> O[🔍 Apply Filters/Search]
    M --> P[📣 Show Toast/Sound Alert]
    
    N --> Q[🔄 Refresh UI]
    O --> Q
    P --> Q
    
    Q --> R{User Interaction?}
    R -->|Filter History| S[🔍 Update Table View]
    R -->|Export Data| T[📥 Download CSV]
    R -->|View Fullscreen| U[🖼️ Toggle Fullscreen Mode]
    R -->|No Action| V[⏳ Wait for Next Update]
    
    S --> V
    T --> V
    U --> V
    
    V --> W{API Refresh Interval?}
    W -->|Yes| X[📡 Fetch New Data]
    W -->|No| Y[⏳ Wait 5s]
    
    X --> Z{API Success?}
    Z -->|Yes| J
    Z -->|No| AA[⚠️ Show Error Message]
    AA --> AB[🔄 Retry After 3s]
    AB --> X
    
    E --> B
    
    style A fill:#e1f5fe
    style B fill:#e8f5e8
    style C fill:#fff3e0
    style J fill:#fce4ec
    style Q fill:#f3e5f5
    style R fill:#e0f2f1
```

## UI Components

### Color Scheme

```css
/* Primary Colors */
--primary-green: `#00ff88`;    /* Success, highlights */
--dark-bg: `#0a0a0a`;         /* Main background */
--card-bg: `#1a1a1a`;         /* Card backgrounds */

/* Text Colors */
--text-primary: `#ffffff`;     /* Main text */
--text-secondary: `#b0b0b0`;   /* Secondary text */
--text-muted: `#666666`;       /* Muted text */

/* Status Colors */
--status-online: `#00ff88`;    /* Online status */
--status-offline: `#ff4444`;   /* Offline status */
--status-warning: `#ffaa00`;   /* Warning status */

```plaintext

### Typography

\`\`\`css
/* Font Family */
font-family: 'Poppins', sans-serif;

/* Font Sizes */
--font-xl: 2rem;           /* Headers */
--font-lg: 1.25rem;        /* Subheaders */
--font-md: 1rem;           /* Body text */
--font-sm: 0.875rem;       /* Small text */
```

### Responsive Breakpoints

```css
/* Mobile First Approach */
@media (min-width: 768px)  { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1280px) { /* Large Desktop */ }

```plaintext

## 🚀 Advanced Features

### 1. Real-time Notifications

\`\`\`javascript
// Implementasi WebSocket untuk real-time updates
const ws = new WebSocket('ws://localhost:5000/ws');
ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.type === 'new_detection') {
        showToast('New monkey detected!');
        updateStatistics();
    }
};
```

### 2. Data Export

```javascript
// Export detection history ke CSV
function exportToCSV() {
const data = detectionHistory;
const csv = convertToCSV(data);
downloadCSV(csv, 'monkey_detections.csv');
}

```plaintext

### 3. Custom Alerts

\`\`\`javascript
// Set threshold untuk alert
const ALERT_THRESHOLD = 5; // Alert jika > 5 monyet
if (monkeyCount > ALERT_THRESHOLD) {
    showAlert('High monkey activity detected!');
}
```

### 4. Performance Monitoring

```javascript
// Monitor performance metrics
const performanceMetrics = {
apiResponseTime: 0,
videoStreamLatency: 0,
detectionAccuracy: 0
};

```plaintext

## 📈 Performance Optimization

### Frontend Optimization

\`\`\`javascript
// Debounce API calls
const debouncedRefresh = debounce(refreshData, 1000);

// Lazy loading untuk images
const images = document.querySelectorAll('img[data-src]');
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
        }
    });
});
```

### Memory Management

```javascript
// Limit history table entries
const MAX_HISTORY_ENTRIES = 100;
if (historyData.length > MAX_HISTORY_ENTRIES) {
historyData = historyData.slice(-MAX_HISTORY_ENTRIES);
}

```plaintext

## 🔒 Security Considerations

### Frontend Security

- Sanitize all user inputs
- Validate API responses
- Use HTTPS untuk production
- Implement CSP headers
- Regular dependency updates

### API Security

\`\`\`javascript
// Validate API responses
function validateApiResponse(response) {
    if (!response || typeof response !== 'object') {
        throw new Error('Invalid API response');
    }
    return response;
}
```

## Contributing

Kontribusi sangat diterima! Silakan:

### Fork Repository

```bash
git fork [https://github.com/yourusername/monkey-detection-frontend.git](https://github.com/yourusername/monkey-detection-frontend.git)

```plaintext

### Create Feature Branch

\`\`\`bash
git checkout -b feature/amazing-feature
```

### Make Changes

- Follow existing code style
- Test di multiple browsers
- Update dokumentasi jika perlu


### Commit Changes

```bash
git commit -m 'Add amazing feature'

```plaintext

### Push and Create PR

\`\`\`bash
git push origin feature/amazing-feature
# Create Pull Request di GitHub
```

### Development Guidelines

#### Code Style

```javascript
// Use consistent naming
const API_BASE_URL = '[http://localhost:5000/api](http://localhost:5000/api)';  // UPPER_SNAKE_CASE for constants
let detectionCount = 0;                             // camelCase for variables
function updateStatistics() {}                      // camelCase for functions

```plaintext

#### Testing Checklist

- [ ] Test di Chrome, Firefox, Safari
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test dengan backend offline
- [ ] Test dengan slow network connection
- [ ] Validate HTML/CSS
- [ ] Check console untuk errors

## 📝 License

Project ini menggunakan MIT License. Lihat file [LICENSE](LICENSE) untuk detail lengkap.

```

MIT License

Copyright (c) 2024 Monkey Detection System

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

```plaintext

## 🙏 Acknowledgments

- [YOLOv8 (Ultralytics)](https://github.com/ultralytics/ultralytics) untuk computer vision model
- [Google Fonts](https://fonts.google.com/) untuk typography (Poppins)
- [GitHub Pages](https://pages.github.com/) untuk free hosting
- [Flask Community](https://flask.palletsprojects.com/) untuk backend framework
- [OpenCV Community](https://opencv.org/) untuk computer vision support

## 📞 Support & Contact

### Get Help

- **Issues**: [GitHub Issues](https://github.com/yourusername/monkey-detection-frontend/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/monkey-detection-frontend/discussions)
- **Email**: your-email@example.com

### Useful Resources

- [YOLOv8 Documentation](https://docs.ultralytics.com/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [GitHub Pages Guide](https://docs.github.com/en/pages)
- [Web Development MDN](https://developer.mozilla.org/)

### Community

- Join our Discord: [Invite Link]
- Follow updates: [@YourTwitter](https://twitter.com/YourTwitter)
- Star the repo if helpful! ⭐

## 🔗 Related Projects

- [Backend YOLOv8 API](https://github.com/yourusername/monkey-detection-backend)
- [Mobile App Version](https://github.com/yourusername/monkey-detection-mobile)
- [Desktop Application](https://github.com/yourusername/monkey-detection-desktop)
```
---

<div align="center">
  
## 🐒 Protecting Wildlife with Technology 🌿


**⭐ Star this repository if you found it helpful!**

Made with ❤️ for wildlife conservation

<p><a href="#top">⬆ Back on Top</a></p>

</div>
