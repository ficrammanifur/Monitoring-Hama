class MonkeyDetectionMonitor {
  constructor() {
    this.baseURL = "https://a9397bb5259f.ngrok-free.app -> http://localhost:5000"; // Default lokal
    this.initializeBaseURL();

    this.endpoints = {
      videoFeed: "/video_feed",
      history: "/api/history",
      status: "/api/status",
      clearHistory: "/api/clear_history"
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
    // Validasi baseURL
    try {
      new URL(this.baseURL);
    } catch (e) {
      console.error(`Invalid baseURL: ${this.baseURL}, reverting to default`);
      this.baseURL = "http://localhost:5000";
    }
  }

  initializeElements() {
    this.videoCanvas = document.getElementById("videoCanvas");
    this.videoOverlay = document.getElementById("videoOverlay");
    this.systemStatus = document.getElementById("systemStatus");
    this.systemStatusText = document.getElementById("systemStatusText");
    this.monkeyCount = document.getElementById("monkeyCount");
    this.lastDetection = document.getElementById("lastDetection");
    this.historyTableBody = document.getElementById("historyTableBody");
    this.refreshBtn = document.getElementById("refreshBtn");
    this.toastContainer = document.getElementById("toastContainer");

    // Null checks
    if (!this.videoCanvas) console.warn("videoCanvas element not found in DOM");
    if (!this.videoOverlay) console.warn("videoOverlay element not found in DOM");
    if (!this.systemStatus) console.warn("systemStatus element not found in DOM");
    if (!this.systemStatusText) console.warn("systemStatusText element not found in DOM");
    if (!this.monkeyCount) console.warn("monkeyCount element not found in DOM");
    if (!this.lastDetection) console.warn("lastDetection element not found in DOM");
    if (!this.historyTableBody) console.warn("historyTableBody element not found in DOM");
    if (!this.refreshBtn) console.warn("refreshBtn element not found in DOM");
    if (!this.toastContainer) console.warn("toastContainer element not found in DOM");

    this.statusDot = this.systemStatus ? this.systemStatus.querySelector(".status-dot") : null;
    this.statusText = this.systemStatus ? this.systemStatus.querySelector(".status-text") : null;
    this.ctx = this.videoCanvas ? this.videoCanvas.getContext('2d') : null;
  }

  setupEventListeners() {
    if (this.refreshBtn) {
      this.refreshBtn.addEventListener("click", () => {
        this.refreshData();
      });
    } else {
      console.warn("Cannot set up refreshBtn event listener: element is null");
    }

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
    if (this.videoCanvas && this.ctx) {
      this.initializeVideoFeed();
    } else {
      console.error("Cannot start video feed: videoCanvas or context is missing");
      this.showNotification("❌ Cannot display video: Canvas element is missing", "error");
    }
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
    const videoUrl = `${this.baseURL}${this.endpoints.videoFeed}?t=${Date.now()}`;
    console.log(`Mencoba memuat feed video dari: ${videoUrl}`);
    this.loadMjpegStream(videoUrl);
  }

  async loadMjpegStream(url) {
    if (!this.videoCanvas || !this.ctx) {
      console.error("Cannot load MJPEG stream: Canvas or context is missing");
      this.retryVideoFeed();
      return;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const reader = response.body.getReader();
      let buffer = new Uint8Array();
      const boundary = '--frame';

      if (this.videoOverlay) {
        this.videoOverlay.classList.add("hidden");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("MJPEG stream ended");
          break;
        }

        buffer = this.appendBuffer(buffer, value);

        let boundaryIndex;
        while ((boundaryIndex = this.findBoundary(buffer, boundary)) !== -1) {
          const headerEnd = buffer.indexOf(new Uint8Array([0x0D, 0x0A, 0x0D, 0x0A]), boundaryIndex);
          if (headerEnd === -1) break;

          const frameStart = headerEnd + 4;
          const frameEnd = this.findNextBoundary(buffer, frameStart, boundary);

          if (frameEnd === -1) break;

          const frameData = buffer.slice(frameStart, frameEnd);
          const blob = new Blob([frameData], { type: 'image/jpeg' });
          const imgUrl = URL.createObjectURL(blob);

          const img = new Image();
          img.onload = () => {
            this.ctx.drawImage(img, 0, 0, this.videoCanvas.width, this.videoCanvas.height);
            URL.revokeObjectURL(imgUrl);
          };
          img.onerror = () => {
            console.error("Failed to load image frame");
            URL.revokeObjectURL(imgUrl);
          };
          img.src = imgUrl;

          buffer = buffer.slice(frameEnd);
        }
      }
    } catch (error) {
      console.error("Error memuat MJPEG stream:", error);
      if (this.videoOverlay) {
        this.videoOverlay.innerHTML = `
          <div class="loading-spinner"></div>
          <p>Koneksi kamera gagal: ${error.message}. <button onclick="window.monitor.retryVideoFeed()">Coba Lagi</button></p>
        `;
        this.videoOverlay.classList.remove("hidden");
      }
      this.retryVideoFeed();
    }
  }

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
      if (this.videoOverlay) {
        this.videoOverlay.innerHTML = `
          <p style="color: #ef4444;">Gagal terhubung ke feed webcam. Pastikan server backend berjalan dan URL benar.</p>
          <button onclick="window.monitor.retryVideoFeed()">Coba Lagi</button>
        `;
        this.videoOverlay.classList.remove("hidden");
      }
      this.showNotification("❌ Gagal terhubung ke feed webcam. Pastikan server backend berjalan dan URL aktif.", "error");
      this.videoRetryAttempts = 0;
    }
  }

  async apiCall(endpoint, method = "GET") {
    try {
      const url = `${this.baseURL}${endpoint}`;
      console.log(`Membuat panggilan API: ${method} ${url}`);
      const config = {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        }
      };

      const response = await fetch(url, config);

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

  async loadStatusData() {
    try {
      const data = await this.apiCall(this.endpoints.status);
      this.updateDashboard(data);
    } catch (error) {
      this.handleAPIError(error, "Status");
    }
  }

  async loadHistoryData() {
    try {
      const data = await this.apiCall(this.endpoints.history);
      this.updateHistoryTable(data);
    } catch (error) {
      this.handleAPIError(error, "Riwayat");
    }
  }

  updateDashboard(data) {
    if (this.systemStatusText) {
      this.systemStatusText.textContent = data.system_status || "Unknown";
    }
    if (this.monkeyCount) {
      this.monkeyCount.textContent = data.current_detections || 0;
    }
    if (this.lastDetection) {
      this.lastDetection.textContent = data.last_detection || "Belum ada deteksi";
    }
    this.updateSystemStatus(data.system_status || "Unknown");
  }

  updateHistoryTable(data) {
    if (!this.historyTableBody) return;
    this.historyTableBody.innerHTML = "";
    (data.history || []).forEach(entry => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${this.formatTime(entry.time)}</td>
        <td>${entry.count}</td>
        <td>${entry.location || "Unknown"}</td>
      `;
      this.historyTableBody.appendChild(row);
    });
  }

  updateSystemStatus(status) {
    if (!this.statusDot || !this.statusText) return;
    this.statusDot.className = "status-dot";
    this.statusText.textContent = status;
    if (status === "Active") {
      this.statusDot.classList.add("active");
    } else if (status === "Error") {
      this.statusDot.classList.add("error");
    } else {
      this.statusDot.classList.add("initializing");
    }
  }

  showNotification(message, type) {
    if (!this.toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("show");
      setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }, 100);
  }

  formatTime(timeStr) {
    if (!timeStr || timeStr === "Belum ada deteksi") return timeStr;
    const date = new Date(timeStr);
    return date.toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  }

  handleAPIError(error, context) {
    console.error(`Error loading ${context}:`, error);
    this.showNotification(`❌ Gagal memuat ${context.toLowerCase()}: ${error.message}`, "error");
  }

  async refreshData() {
    this.showNotification("🔄 Memperbarui data...", "info");
    await Promise.all([
      this.loadStatusData(),
      this.loadHistoryData()
    ]);
    this.showNotification("✅ Data berhasil diperbarui", "success");
  }
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
