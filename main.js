// ===== KONFIGURASI API =====
// Ganti URL ini dengan ngrok URL Anda (TANPA trailing slash)
const API_BASE_URL = "https://0e4f14596aef.ngrok-free.app"; // Update with your active ngrok URL
// Contoh: const API_BASE_URL = "https://new-url.ngrok-free.app";
// PENTING: Pastikan tidak ada "/" di akhir URL

class MonkeyDetectionMonitor {
  constructor() {
    // Centralized base URL, overridden by query parameter if provided
    this.baseURL = API_BASE_URL;
    this.initializeBaseURL();

    // Define endpoints derived from baseURL
    this.endpoints = this.getEndpoints();

    this.lastDetectionCount = 0;
    this.refreshInterval = null;
    this.isConnected = false;
    this.videoRetryAttempts = 0;
    this.maxVideoRetries = 3;

    this.initializeElements();
    this.setupEventListeners();
    this.startMonitoring();
  }

  initializeBaseURL() {
    // Check for baseURL in query parameter (e.g., ?baseURL=https://new-url.ngrok-free.app)
    const urlParams = new URLSearchParams(window.location.search);
    const customBaseURL = urlParams.get('baseURL');
    if (customBaseURL) {
      this.baseURL = customBaseURL;
      console.log(`Base URL set from query parameter: ${this.baseURL}`);
    }
  }

  getEndpoints() {
    return {
      videoFeed: `${this.baseURL}/video_feed`,
      history: `${this.baseURL}/api/history`,
      status: `${this.baseURL}/api/status`,
      clearHistory: `${this.baseURL}/api/clear_history`
    };
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
        <p>Camera connection failed</p>
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
  }

  startMonitoring() {
    this.initializeVideoFeed();
    this.loadHistoryData();
    this.refreshInterval = setInterval(() => {
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
      }, 2000);
    } else {
      console.error("Max video feed retries reached");
      this.showNotification("❌ Gagal terhubung ke feed webcam setelah beberapa percobaan. Pastikan backend berjalan.", "error");
    }
  }

  async apiCall(endpoint, method = "GET") {
    try {
      const config = {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true" // Skip ngrok browser warning
        }
      };

      console.log(`Making API call: ${method} ${this.baseURL}${endpoint}`);
      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      // Check if response is HTML (error page)
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        const errorText = await response.text();
        throw new Error(`Server returned HTML instead of JSON: ${errorText.slice(0, 100)}... Check if API is running and ngrok URL is correct.`);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${method} ${endpoint}):`, error);
      this.showNotification(`❌ Gagal terhubung ke server: ${error.message}. Pastikan backend dan ngrok berjalan.`, "error");
      throw error;
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
    const totalDetections = history.reduce((sum, record) => sum + record.count, 0);
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
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      max-width: 300px;
      word-wrap: break-word;
    `;

    switch (type) {
      case "success":
        notification.style.backgroundColor = "#22c55e";
        break;
      case "error":
        notification.style.backgroundColor = "#ef4444";
        break;
      case "warning":
        notification.style.backgroundColor = "#f59e0b";
        break;
      default:
        notification.style.backgroundColor = "#3b82f6";
    }

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
