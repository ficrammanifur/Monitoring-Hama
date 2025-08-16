class MonkeyDetectionMonitor {
  constructor() {
    this.baseURL = "http://localhost:5000"; // Ganti dengan URL ngrok saat deploy
    this.initializeBaseURL();

    this.endpoints = {
      videoFeed: `${this.baseURL}/video_feed`,
      history: `${this.baseURL}/api/history`,
      status: `${this.baseURL}/api/status`,
      clearHistory: `${this.baseURL}/api/clear_history`
    };

    this.lastDetectionCount = 0;
    this.refreshInterval = null;
    this.isConnected = false;
    this.videoRetryAttempts = 0;
    this.maxVideoRetries = 10;
    this.retryDelay = 10000;

    this.initializeElements();
    this.setupEventListeners();
    this.startMonitoring();
  }

  initializeBaseURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const customBaseURL = urlParams.get('baseURL');
    if (customBaseURL) {
      this.baseURL = customBaseURL.replace(/\/$/, '');
      console.log(`Base URL set from query parameter: ${this.baseURL}`);
    }
  }

  initializeElements() {
    this.videoCanvas = document.getElementById("videoCanvas"); // Ganti ke canvas
    this.videoOverlay = document.getElementById("videoOverlay");
    this.systemStatus = document.getElementById("systemStatus");
    this.systemStatusText = document.getElementById("systemStatusText");
    this.monkeyCount = document.getElementById("monkeyCount");
    this.lastDetection = document.getElementById("lastDetection");
    this.historyTableBody = document.getElementById("historyTableBody");
    this.refreshBtn = document.getElementById("refreshBtn");
    this.toastContainer = document.getElementById("toastContainer");

    this.statusDot = this.systemStatus.querySelector(".status-dot");
    this.statusText = this.systemStatus.querySelector(".status-text");

    this.ctx = this.videoCanvas.getContext('2d'); // Context untuk canvas
  }

  setupEventListeners() {
    this.refreshBtn.addEventListener("click", () => {
      this.refreshData();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.stopMonitoring();
      } else {
        this.startMonitoring();
      }
    });

    window.monitor = this;
  }

  startMonitoring() {
    this.initializeVideoFeed();
    this.loadStatusData();
    this.loadHistoryData();
    this.refreshInterval = setInterval(() => {
      this.loadStatusData();
      this.loadHistoryData();
    }, 5000);
    console.log("Monitoring dimulai");
  }

  stopMonitoring() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    console.log("Monitoring dihentikan");
  }

  initializeVideoFeed() {
    const videoUrl = `${this.endpoints.videoFeed}?t=${Date.now()}`;
    console.log(`Mencoba memuat feed video dari: ${videoUrl}`);
    this.loadMjpegStream(videoUrl);
  }

  // Fungsi baru untuk load MJPEG dengan fetch dan display di canvas
  async loadMjpegStream(url) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'ngrok-skip-browser-warning': 'true' // Bypass warning ngrok
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const reader = response.body.getReader();
      let buffer = new Uint8Array();
      const boundary = '--frame'; // Boundary dari mimetype Flask

      this.videoOverlay.classList.add("hidden"); // Sembunyikan overlay jika berhasil

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer = this.appendBuffer(buffer, value);

        let boundaryIndex;
        while ((boundaryIndex = this.findBoundary(buffer, boundary)) !== -1) {
          const frameStart = boundaryIndex + boundary.length + 4; // Skip boundary dan header
          const frameEnd = this.findNextBoundary(buffer, frameStart, boundary);

          if (frameEnd === -1) break;

          const frameData = buffer.slice(frameStart, frameEnd);
          const blob = new Blob([frameData], { type: 'image/jpeg' });
          const imgUrl = URL.createObjectURL(blob);

          const img = new Image();
          img.onload = () => {
            this.ctx.drawImage(img, 0, 0, this.videoCanvas.width, this.videoCanvas.height);
            URL.revokeObjectURL(imgUrl); // Bersihkan memory
          };
          img.src = imgUrl;

          buffer = buffer.slice(frameEnd);
        }
      }
    } catch (error) {
      console.error("Error memuat MJPEG stream:", error);
      this.videoOverlay.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Koneksi kamera gagal: ${error.message}. <button onclick="window.monitor.retryVideoFeed()">Coba Lagi</button></p>
      `;
      this.retryVideoFeed();
    }
  }

  // Helper functions untuk parse MJPEG
  appendBuffer(buffer1, buffer2) {
    const tmp = new Uint8Array(buffer1.length + buffer2.length);
    tmp.set(buffer1, 0);
    tmp.set(buffer2, buffer1.length);
    return tmp;
  }

  findBoundary(buffer, boundary) {
    const boundaryBytes = new TextEncoder().encode(boundary);
    for (let i = 0; i < buffer.length - boundaryBytes.length; i++) {
      let match = true;
      for (let j = 0; j < boundaryBytes.length; j++) {
        if (buffer[i + j] !== boundaryBytes[j]) {
          match = false;
          break;
        }
      }
      if (match) return i;
    }
    return -1;
  }

  findNextBoundary(buffer, start, boundary) {
    const boundaryBytes = new TextEncoder().encode('\r\n' + boundary);
    for (let i = start; i < buffer.length - boundaryBytes.length; i++) {
      let match = true;
      for (let j = 0; j < boundaryBytes.length; j++) {
        if (buffer[i + j] !== boundaryBytes[j]) {
          match = false;
          break;
        }
      }
      if (match) return i;
    }
    return -1;
  }

  retryVideoFeed() {
    if (this.videoRetryAttempts < this.maxVideoRetries) {
      this.videoRetryAttempts++;
      console.log(`Mencoba ulang feed video, percobaan ${this.videoRetryAttempts}/${this.maxVideoRetries}`);
      setTimeout(() => {
        this.initializeVideoFeed();
      }, this.retryDelay);
    } else {
      console.error("Batas maksimum percobaan feed video tercapai");
      this.videoOverlay.innerHTML = `
        <p style="color: #ef4444;">Gagal terhubung ke feed webcam. Pastikan server backend berjalan dan URL benar.</p>
        <button onclick="window.monitor.retryVideoFeed()">Coba Lagi</button>
      `;
      this.showNotification("❌ Gagal terhubung ke feed webcam. Pastikan server backend berjalan dan URL aktif.", "error");
      this.videoRetryAttempts = 0;
    }
  }

  async apiCall(endpoint, method = "GET") {
    try {
      const config = {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        }
      };

      console.log(`Membuat panggilan API: ${method} ${this.baseURL}${endpoint}`);
      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Data respons untuk ${endpoint}:`, data);
      return data;
    } catch (error) {
      console.error(`Error API (${method} ${endpoint}):`, error);
      this.showNotification(`❌ Gagal terhubung ke server: ${error.message}. Pastikan server backend aktif.`, "error");
      throw error;
    }
  }

  // ... (kode loadStatusData, loadHistoryData, updateDashboard, updateHistoryTable, updateSystemStatus, showLoadingState, hideLoadingState, handleAPIError, refreshData, formatTime, showNotification tetap sama)
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("Memuat aplikasi...");
  new MonkeyDetectionMonitor();
  console.log("Aplikasi berhasil dimuat");
});

window.addEventListener("error", (event) => {
  console.error("Error global:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Penolakan promise yang tidak ditangani:", event.reason);
});
