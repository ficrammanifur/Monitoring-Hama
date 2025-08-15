class MonkeyDetectionMonitor {
  constructor() {
    this.baseURL = "http://localhost:5000"
    this.videoFeedURL = `${this.baseURL}/video_feed`
    this.historyAPI = `${this.baseURL}/api/history`

    this.lastDetectionCount = 0
    this.refreshInterval = null
    this.isConnected = false

    this.initializeElements()
    this.setupEventListeners()
    this.startMonitoring()
  }

  initializeElements() {
    // Main elements
    this.videoFeed = document.getElementById("videoFeed")
    this.videoOverlay = document.getElementById("videoOverlay")
    this.systemStatus = document.getElementById("systemStatus")
    this.systemStatusText = document.getElementById("systemStatusText")
    this.monkeyCount = document.getElementById("monkeyCount")
    this.lastDetection = document.getElementById("lastDetection")
    this.historyTableBody = document.getElementById("historyTableBody")
    this.refreshBtn = document.getElementById("refreshBtn")
    this.toastContainer = document.getElementById("toastContainer")

    // Status elements
    this.statusDot = this.systemStatus.querySelector(".status-dot")
    this.statusText = this.systemStatus.querySelector(".status-text")
  }

  setupEventListeners() {
    // Video feed events
    this.videoFeed.addEventListener("load", () => {
      this.videoFeed.classList.add("loaded")
      this.videoOverlay.classList.add("hidden")
      this.updateSystemStatus(true)
    })

    this.videoFeed.addEventListener("error", () => {
      this.videoFeed.classList.remove("loaded")
      this.videoOverlay.classList.remove("hidden")
      this.videoOverlay.innerHTML = `
                <div class="loading-spinner"></div>
                <p>Camera connection failed</p>
            `
      this.updateSystemStatus(false)
    })

    // Refresh button
    this.refreshBtn.addEventListener("click", () => {
      this.refreshData()
    })

    // Handle page visibility change
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.stopMonitoring()
      } else {
        this.startMonitoring()
      }
    })
  }

  startMonitoring() {
    // Initialize video feed
    this.initializeVideoFeed()

    // Load initial data
    this.loadHistoryData()

    // Start auto-refresh
    this.refreshInterval = setInterval(() => {
      this.loadHistoryData()
    }, 5000)

    console.log("Monitoring started")
  }

  stopMonitoring() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }
    console.log("Monitoring stopped")
  }

  initializeVideoFeed() {
    this.videoFeed.src = this.videoFeedURL

    // Add timestamp to prevent caching
    const updateVideoFeed = () => {
      if (!document.hidden) {
        this.videoFeed.src = `${this.videoFeedURL}?t=${Date.now()}`
      }
    }

    // Refresh video feed every 100ms for live streaming
    setInterval(updateVideoFeed, 100)
  }

  async loadHistoryData() {
    try {
      this.showLoadingState()

      const response = await fetch(this.historyAPI)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      this.updateDashboard(data)
      this.updateSystemStatus(true)
    } catch (error) {
      console.error("Failed to load history data:", error)
      this.handleAPIError()
      this.updateSystemStatus(false)
    }
  }

  updateDashboard(data) {
    // Update stats
    const totalDetections = data.reduce((sum, record) => sum + record.monkey_count, 0)
    this.monkeyCount.textContent = totalDetections

    // Update last detection
    if (data.length > 0) {
      const lastRecord = data[0] // Assuming data is sorted by time desc
      this.lastDetection.textContent = this.formatTime(lastRecord.timestamp)

      // Check for new detections
      if (lastRecord.monkey_count > this.lastDetectionCount) {
        this.showToast(`New detection: ${lastRecord.monkey_count} monkey(s) spotted!`, "success")
        this.lastDetectionCount = lastRecord.monkey_count
      }
    } else {
      this.lastDetection.textContent = "Never"
    }

    // Update system status text
    const hasRecentDetection = data.some((record) => {
      const recordTime = new Date(record.timestamp)
      const now = new Date()
      return now - recordTime < 30000 // Within last 30 seconds
    })

    this.systemStatusText.textContent = hasRecentDetection ? "Active" : "Idle"

    // Update history table
    this.updateHistoryTable(data)
  }

  updateHistoryTable(data) {
    if (data.length === 0) {
      this.historyTableBody.innerHTML = `
                <tr class="no-data">
                    <td colspan="3">No detection history available</td>
                </tr>
            `
      return
    }

    const rows = data
      .map(
        (record) => `
            <tr>
                <td>${this.formatTime(record.timestamp)}</td>
                <td>${record.monkey_count}</td>
                <td>${record.location || "Camera 1"}</td>
            </tr>
        `,
      )
      .join("")

    this.historyTableBody.innerHTML = rows
  }

  updateSystemStatus(connected) {
    this.isConnected = connected

    if (connected) {
      this.statusDot.classList.remove("inactive")
      this.statusText.textContent = "Connected"
    } else {
      this.statusDot.classList.add("inactive")
      this.statusText.textContent = "Disconnected"
    }
  }

  showLoadingState() {
    // Show loading in refresh button
    this.refreshBtn.classList.add("loading")
  }

  hideLoadingState() {
    this.refreshBtn.classList.remove("loading")
  }

  handleAPIError() {
    this.hideLoadingState()

    // Show error in table
    this.historyTableBody.innerHTML = `
            <tr class="no-data">
                <td colspan="3">
                    <span style="color: #ef4444;">Failed to load data. Check backend connection.</span>
                </td>
            </tr>
        `

    this.showToast("Failed to connect to backend server", "error")
  }

  refreshData() {
    this.loadHistoryData()
  }

  formatTime(timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    )
  }

  showToast(message, type = "success") {
    const toast = document.createElement("div")
    toast.className = `toast ${type}`
    toast.textContent = message

    this.toastContainer.appendChild(toast)

    // Auto remove after 4 seconds
    setTimeout(() => {
      toast.classList.add("fade-out")
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
        }
      }, 300)
    }, 4000)
  }
}

// Initialize the monitoring system when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new MonkeyDetectionMonitor()
})

// Handle errors globally
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error)
})

// Handle unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason)
})
