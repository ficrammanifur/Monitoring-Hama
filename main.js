class MonkeyDetectionMonitor {
  constructor() {
    // Replace with your active ngrok or cloud URL
    this.baseURL = "https://47a5ba6475f9.ngrok-free.app"; // Update with your ngrok URL
    this.initializeBaseURL();

    // Define endpoints
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
    this.maxVideoRetries = 5;
    this.retryDelay = 5000;

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
    this.videoFeed = document.getElementById("videoFeed");
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
  }

  setupEventListeners() {
    this.videoFeed.addEventListener("load", () => {
      this.videoFeed.classList.add("loaded");
      this.videoOverlay.classList.add("hidden");
      this.updateSystemStatus(true);
      this.videoRetryAttempts = 0;
      console.log("Video feed loaded successfully");
    });

    this.videoFeed.addEventListener("error", () => {
      this.videoFeed.classList.remove("loaded");
      this.videoOverlay.classList.remove("hidden");
      this.videoOverlay.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Camera connection failed. <button onclick="window.monitor.retryVideoFeed()">Retry</button></p>
      `;
      this.updateSystemStatus(false);
      this.retryVideoFeed();
    });

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
    this.videoFeed.src = `${this.endpoints.videoFeed}?t=${Date.now()}`;
    console.log(`Attempting to load video feed from: ${this.videoFeed.src}`);
  }

  retryVideoFeed() {
    if (this.videoRetryAttempts < this.maxVideoRetries) {
      this.videoRetryAttempts++;
      console.log(`Retrying video feed, attempt ${this.videoRetryAttempts}/${this.maxVideoRetries}`);
      setTimeout(() => {
        this.initializeVideoFeed();
      }, this.retryDelay);
    } else {
      console.error("Max video feed retries reached");
      this.videoOverlay.innerHTML = `
        <p style="color: #ef4444;">Failed to connect to webcam feed. Please ensure the backend server is running and the ngrok URL is active.</p>
        <button onclick="window.monitor.retryVideoFeed()">Retry</button>
      `;
      this.showNotification("❌ Gagal terhubung ke feed webcam. Pastikan server backend berjalan dan URL ngrok aktif.", "error");
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

      console.log(`Making API call: ${method} ${this.baseURL}${endpoint}`);
      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${method} ${endpoint}):`, error);
      this.showNotification(`❌ Gagal terhubung ke server: ${error.message}. Pastikan server backend aktif.`, "error");
      throw error;
    }
  }

  async loadStatusData() {
    try {
      const data = await this.apiCall("/api/status");
      this.updateSystemStatus(data.system_status === "Active");
      this.monkeyCount.textContent = data.current_detections;
      this.lastDetection.textContent = data.last_detection === "Belum ada deteksi" ? "Never" : this.formatTime(data.last_detection);
      this.systemStatusText.textContent = data.system_status;
    } catch (error) {
      this.updateSystemStatus(false);
      this.systemStatusText.textContent = "Error";
    }
  }

  async loadHistoryData() {
    try {
      this.showLoadingState();
      const data = await this.apiCall("/api/history");

      if (!data || typeof data !== "object" || !Array.isArray(data.history)) {
        throw new Error("Invalid response format: 'history' must be an array");
      }

      this.updateDashboard(data);
      this.updateSystemStatus(true);
    } catch (error) {
      console.error("Failed to load history data:", error);
      this.handleAPIError(error);
      this.updateSystemStatus(false);
    } finally {
      this.hideLoadingState();
    }
  }

  updateDashboard(data) {
    const history = Array.isArray(data.history) ? data.history : [];
    const totalDetections = history.reduce((sum, record) => sum + (record.count || 0), 0);
    this.monkeyCount.textContent = totalDetections;

    if (history.length > 0) {
      const lastRecord = history[0];
      this.lastDetection.textContent = this.formatTime(lastRecord.time);

      if (lastRecord.count > this.lastDetectionCount) {
        this.showNotification(`🐒 Deteksi baru: ${lastRecord.count} monyet terdeteksi!`, "success");
        this.lastDetectionCount = lastRecord.count;
      }
    } else {
      this.lastDetection.textContent = "Belum pernah";
    }

    const hasRecentDetection = history.some((record) => {
      const recordTime = new Date(record.time);
      const now = new Date();
      return now - recordTime < 30000;
    });

    this.systemStatusText.textContent = hasRecentDetection ? "Aktif" : "Idle";
    this.updateHistoryTable(history);
  }

  updateHistoryTable(history) {
    if (!history || history.length === 0) {
      this.historyTableBody.innerHTML = `
        <tr class="no-data">
          <td colspan="3">Tidak ada riwayat deteksi tersedia</td>
        </tr>
      `;
      return;
    }

    const rows = history
      .map(
        (record) => `
          <tr>
            <td>${this.formatTime(record.time)}</td>
            <td>${record.count}</td>
            <td>${record.location || "Webcam"}</td>
          </tr>
        `
      )
      .join("");

    this.historyTableBody.innerHTML = rows;
  }

  updateSystemStatus(connected) {
    this.isConnected = connected;
    if (connected) {
      this.statusDot.classList.remove("inactive");
      this.statusText.textContent = "Terhubung";
    } else {
      this.statusDot.classList.add("inactive");
      this.statusText.textContent = "Terputus";
    }
  }

  showLoadingState() {
    this.refreshBtn.classList.add("loading");
  }

  hideLoadingState() {
    this.refreshBtn.classList.remove("loading");
  }

  handleAPIError(error) {
    this.historyTableBody.innerHTML = `
      <tr class="no-data">
        <td colspan="3">
          <span style="color: #ef4444;">Gagal memuat data: ${error.message}</span>
        </td>
      </tr>
    `;
    this.showNotification(`❌ Gagal terhubung ke server: ${error.message}`, "error");
  }

  refreshData() {
    this.loadHistoryData();
    this.loadStatusData();
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;

    return (
      date.toLocaleDateString("id-ID") +
      " " +
      date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `toast toast-${type}`;
    notification.textContent = message;
    this.toastContainer.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("fade-out");
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("Loading application...");
  new MonkeyDetectionMonitor();
  console.log("Application loaded successfully");
});

window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});
