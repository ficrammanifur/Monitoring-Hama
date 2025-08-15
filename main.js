class MonkeyDetectionMonitor {
  constructor() {
    // Centralized base URL configuration (update this for new ngrok or production URL)
    this.baseURL = "https://866dea127727.ngrok-free.app -> http://localhost:5000"; // Default ngrok HTTPS URL

    // Dynamically set baseURL from a query parameter (if provided)
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
    // Centralize all endpoint URLs, derived from baseURL
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
      this.videoRetryAttempts = 0; // Reset retries on success
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
      this.showToast("Failed to connect to webcam feed after retries", "error");
    }
  }

  async loadHistoryData() {
    try {
      this.showLoadingState();
      console.log(`Fetching history from: ${this.endpoints.history}`);
      const response = await fetch(this.endpoints.history, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
      }

      const data = await response.json();

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
        this.showToast(`New detection: ${lastRecord.count} monkey(s) spotted!`, "success");
        this.lastDetectionCount = lastRecord.count;
      }
    } else {
      this.lastDetection.textContent = "Never";
    }

    const hasRecentDetection = history.some((record) => {
      const recordTime = new Date(record.time);
      const now = new Date();
      return now - recordTime < 30000;
    });

    this.systemStatusText.textContent = hasRecentDetection ? "Active" : "Idle";
    this.updateHistoryTable(history);
  }

  updateHistoryTable(history) {
    if (!history || history.length === 0) {
      this.historyTableBody.innerHTML = `
        <tr class="no-data">
          <td colspan="3">No detection history available</td>
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
      this.statusText.textContent = "Connected";
    } else {
      this.statusDot.classList.add("inactive");
      this.statusText.textContent = "Disconnected";
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
          <span style="color: #ef4444;">Failed to load data: ${error.message}</span>
        </td>
      </tr>
    `;
    this.showToast(`Failed to connect to backend server: ${error.message}`, "error");
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

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  }

  showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 4000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new MonkeyDetectionMonitor();
});

window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});
