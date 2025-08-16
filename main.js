class MonkeyDetectionMonitor {
  constructor() {
    this.baseURL = "https://7a5475a4a6ea.ngrok-free.app"; // Ganti dengan URL ngrok yang aktif
    this.initializeBaseURL();

    // Build endpoints dengan benar - hindari duplikasi URL
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
      this.baseURL = customBaseURL.replace(/\/$/, ''); // Hapus trailing slash
      console.log(`Base URL set from query parameter: ${this.baseURL}`);
    }
  }

  initializeElements() {
    // Video elements
    this.videoCanvas = document.getElementById("videoCanvas");
    this.videoOverlay = document.getElementById("videoOverlay");
    
    // Status elements
    this.systemStatus = document.getElementById("systemStatus");
    this.systemStatusText = document.getElementById("systemStatusText");
    this.systemStatusDot = document.getElementById("systemStatusDot");
    this.connectionStatus = document.getElementById("connectionStatus");
    this.statusIndicator = document.getElementById("statusIndicator");
    
    // Data display elements
    this.monkeyCount = document.getElementById("monkeyCount");
    this.lastDetection = document.getElementById("lastDetection");
    this.totalDetectionsToday = document.getElementById("totalDetectionsToday");
    this.totalDetections = document.getElementById("totalDetections");
    this.avgPerDay = document.getElementById("avgPerDay");
    this.historyCount = document.getElementById("historyCount");
    this.historyTableBody = document.getElementById("historyTableBody");
    
    // Control elements
    this.refreshBtn = document.getElementById("refreshBtn");
    this.clearHistoryBtn = document.getElementById("clearHistoryBtn");
    
    // UI elements
    this.toastContainer = document.getElementById("toastContainer");
    this.loadingOverlay = document.getElementById("loadingOverlay");

    // Validate critical elements
    const criticalElements = [
      { name: 'videoCanvas', element: this.videoCanvas },
      { name: 'videoOverlay', element: this.videoOverlay },
      { name: 'historyTableBody', element: this.historyTableBody }
    ];

    criticalElements.forEach(({ name, element }) => {
      if (!element) {
        console.error(`Critical element '${name}' not found in DOM`);
      }
    });

    // Setup canvas context if available
    if (this.videoCanvas) {
      this.ctx = this.videoCanvas.getContext('2d');
    }
  }

  setupEventListeners() {
    // Refresh button
    if (this.refreshBtn) {
      this.refreshBtn.addEventListener("click", () => {
        this.refreshData();
      });
    }

    // Clear history button
    if (this.clearHistoryBtn) {
      this.clearHistoryBtn.addEventListener("click", () => {
        this.clearHistory();
      });
    }

    // Page visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.stopMonitoring();
      } else {
        this.startMonitoring();
      }
    });

    // Make monitor accessible globally for debugging
    window.monitor = this;
  }

  startMonitoring() {
    console.log("Starting monitoring...");
    this.updateConnectionStatus("connecting", "Menghubungkan ke server...");
    
    this.initializeVideoFeed();
    this.loadStatusData();
    this.loadHistoryData();
    
    // Set up periodic refresh
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    this.refreshInterval = setInterval(() => {
      this.loadStatusData();
      this.loadHistoryData();
    }, 5000);
    
    console.log("Monitoring started");
  }

  stopMonitoring() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    console.log("Monitoring stopped");
  }

  initializeVideoFeed() {
    const videoUrl = `${this.baseURL}${this.endpoints.videoFeed}?t=${Date.now()}`;
    console.log(`Attempting to load video feed from: ${videoUrl}`);
    this.loadMjpegStream(videoUrl);
  }

  async loadMjpegStream(url) {
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

      // Hide overlay if successful
      if (this.videoOverlay) {
        this.videoOverlay.classList.add("hidden");
      }

      this.updateConnectionStatus("active", "Terhubung ke server");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer = this.appendBuffer(buffer, value);

        let boundaryIndex;
        while ((boundaryIndex = this.findBoundary(buffer, boundary)) !== -1) {
          const frameStart = boundaryIndex + boundary.length + 4;
          const frameEnd = this.findNextBoundary(buffer, frameStart, boundary);

          if (frameEnd === -1) break;

          const frameData = buffer.slice(frameStart, frameEnd);
          const blob = new Blob([frameData], { type: 'image/jpeg' });
          const imgUrl = URL.createObjectURL(blob);

          const img = new Image();
          img.onload = () => {
            if (this.ctx && this.videoCanvas) {
              this.ctx.drawImage(img, 0, 0, this.videoCanvas.width, this.videoCanvas.height);
            }
            URL.revokeObjectURL(imgUrl);
          };
          img.src = imgUrl;

          buffer = buffer.slice(frameEnd);
        }
      }
    } catch (error) {
      console.error("Error loading MJPEG stream:", error);
      this.handleVideoError(error);
    }
  }

  handleVideoError(error) {
    if (this.videoOverlay) {
      this.videoOverlay.classList.remove("hidden");
      this.videoOverlay.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Koneksi kamera gagal: ${error.message}</p>
        <button onclick="window.monitor.retryVideoFeed()">Coba Lagi</button>
      `;
    }
    
    this.updateConnectionStatus("error", "Gagal terhubung ke kamera");
    this.retryVideoFeed();
  }

  retryVideoFeed() {
    if (this.videoRetryAttempts < this.maxVideoRetries) {
      this.videoRetryAttempts++;
      console.log(`Retrying video feed, attempt ${this.videoRetryAttempts}/${this.maxVideoRetries}`);
      
      setTimeout(() => {
        this.initializeVideoFeed();
      }, this.retryDelay);
    } else {
      console.error("Maximum video retry attempts reached");
      this.updateConnectionStatus("error", "Gagal terhubung setelah beberapa percobaan");
      this.showNotification("❌ Gagal terhubung ke feed webcam. Pastikan server backend berjalan.", "error");
      this.videoRetryAttempts = 0;
    }
  }

  // Helper functions untuk MJPEG parsing
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

  async apiCall(endpoint, method = "GET") {
    try {
      const config = {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        }
      };

      // Build URL dengan benar - hindari duplikasi
      const fullUrl = `${this.baseURL}${endpoint}`;
      console.log(`Making API call: ${method} ${fullUrl}`);
      
      const response = await fetch(fullUrl, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Response data for ${endpoint}:`, data);
      return data;
    } catch (error) {
      console.error(`API Error (${method} ${endpoint}):`, error);
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        this.updateConnectionStatus("error", "Server tidak dapat dijangkau");
        this.showNotification(`❌ Gagal terhubung ke server. Pastikan backend aktif dan URL benar.`, "error");
      } else {
        this.showNotification(`❌ Error API: ${error.message}`, "error");
      }
      
      throw error;
    }
  }

  async loadStatusData() {
    try {
      const data = await this.apiCall(this.endpoints.status);
      this.updateDashboard(data);
      this.updateConnectionStatus("active", "Terhubung ke server");
    } catch (error) {
      console.error("Error loading status data:", error);
      this.handleAPIError("Status", error);
    }
  }

  async loadHistoryData() {
    try {
      const data = await this.apiCall(this.endpoints.history);
      this.updateHistoryTable(data.history || []);
      this.updateHistoryCount(data.total_count || 0);
    } catch (error) {
      console.error("Error loading history data:", error);
      this.handleAPIError("Riwayat", error);
    }
  }

  async clearHistory() {
    if (!confirm("Yakin ingin menghapus semua riwayat deteksi?")) {
      return;
    }

    try {
      this.showLoadingState();
      await this.apiCall(this.endpoints.clearHistory, "POST");
      this.showNotification("✅ Riwayat berhasil dihapus", "success");
      this.loadHistoryData();
    } catch (error) {
      console.error("Error clearing history:", error);
      this.showNotification("❌ Gagal menghapus riwayat", "error");
    } finally {
      this.hideLoadingState();
    }
  }

  updateDashboard(data) {
    // Update monkey count
    if (this.monkeyCount) {
      this.monkeyCount.textContent = data.current_detections || 0;
    }

    // Update last detection
    if (this.lastDetection) {
      this.lastDetection.textContent = data.last_detection || "Belum ada deteksi";
    }

    // Update today's detections
    if (this.totalDetectionsToday) {
      this.totalDetectionsToday.textContent = data.total_detections_today || 0;
    }

    // Update system status
    this.updateSystemStatus(data.system_status || "Unknown");

    // Update detection indicator if new detections
    const currentCount = data.current_detections || 0;
    if (currentCount > this.lastDetectionCount) {
      this.showNotification(`🐒 Terdeteksi ${currentCount} monyet!`, "warning");
    }
    this.lastDetectionCount = currentCount;
  }

  updateSystemStatus(status) {
    const statusMap = {
      "Active": { class: "active", text: "Sistem Aktif" },
      "Error": { class: "error", text: "Sistem Error" },
      "Initializing": { class: "connecting", text: "Menginisialisasi..." }
    };

    const statusInfo = statusMap[status] || { class: "warning", text: status };

    if (this.systemStatusDot) {
      this.systemStatusDot.className = `status-dot ${statusInfo.class}`;
    }

    if (this.systemStatusText) {
      this.systemStatusText.textContent = statusInfo.text;
    }
  }

  updateConnectionStatus(status, message) {
    if (!this.statusIndicator) return;

    const dot = this.statusIndicator.querySelector('.status-dot');
    const text = this.statusIndicator.querySelector('.status-text');

    if (dot) {
      dot.className = `status-dot ${status}`;
    }

    if (text) {
      text.textContent = message;
    }
  }

  updateHistoryTable(history) {
    if (!this.historyTableBody) return;

    if (!history || history.length === 0) {
      this.historyTableBody.innerHTML = `
        <tr class="no-data">
          <td colspan="3">Belum ada data deteksi</td>
        </tr>
      `;
      return;
    }

    // Sort by time (newest first)
    const sortedHistory = [...history].reverse();
    
    this.historyTableBody.innerHTML = sortedHistory.map(item => `
      <tr>
        <td>${this.formatTime(item.time)}</td>
        <td><strong>${item.count}</strong></td>
        <td>${item.location || 'Webcam'}</td>
      </tr>
    `).join('');

    // Update statistics
    this.updateStatistics(history);
  }

  updateHistoryCount(count) {
    if (this.historyCount) {
      this.historyCount.textContent = `${count} entri`;
    }
  }

  updateStatistics(history) {
    if (!history || history.length === 0) {
      if (this.totalDetections) this.totalDetections.textContent = "0";
      if (this.avgPerDay) this.avgPerDay.textContent = "0";
      return;
    }

    // Total detections
    const totalCount = history.reduce((sum, item) => sum + (item.count || 0), 0);
    if (this.totalDetections) {
      this.totalDetections.textContent = totalCount;
    }

    // Average per day
    const uniqueDays = new Set(history.map(item => item.time.split(' ')[0])).size;
    const avgPerDay = uniqueDays > 0 ? Math.round(totalCount / uniqueDays) : 0;
    if (this.avgPerDay) {
      this.avgPerDay.textContent = avgPerDay;
    }
  }

  formatTime(timeString) {
    try {
      const date = new Date(timeString);
      return date.toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return timeString;
    }
  }

  refreshData() {
    console.log("Refreshing data...");
    this.showNotification("🔄 Memperbarui data...", "info");
    this.loadStatusData();
    this.loadHistoryData();
  }

  handleAPIError(context, error) {
    console.error(`Error loading ${context}:`, error);
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      this.updateConnectionStatus("error", "Koneksi terputus");
    }
  }

  showLoadingState() {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.remove("hidden");
    }
  }

  hideLoadingState() {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.add("hidden");
    }
  }

  showNotification(message, type = "info", duration = 5000) {
    if (!this.toastContainer) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    // Add icon based on type
    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️"
    };

    toast.innerHTML = `
      <span>${icons[type] || "ℹ️"}</span>
      <span>${message}</span>
    `;

    this.toastContainer.appendChild(toast);

    // Auto remove
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, duration);

    // Click to dismiss
    toast.addEventListener("click", () => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    });
  }
}

// Initialize application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("Loading application...");
  try {
    new MonkeyDetectionMonitor();
    console.log("Application successfully loaded");
  } catch (error) {
    console.error("Failed to initialize application:", error);
  }
});

// Global error handlers
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});
