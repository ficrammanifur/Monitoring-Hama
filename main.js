import { Chart } from "@/components/ui/chart"
// API Configuration
const API_BASE_URL = "http://localhost:5000/api"
const VIDEO_STREAM_URL = "http://localhost:5000/video_feed"
const REFRESH_INTERVAL = 5000 // 5 seconds
const RETRY_INTERVAL = 3000 // 3 seconds for failed requests

// Global State
let currentTab = "dashboard"
let monkeyCount = 7
let chartFilter = "day"
let chart = null
const boxPosition = { x: 50, y: 50 }
const boxDirection = { x: 2, y: 1.5 }
let mqttConnected = true
let lastDetectionTime = new Date()
let isDarkMode = false
let isHelpOpen = false
let latestCapture = {
  type: "image",
  timestamp: new Date(),
  filename: "last_monkey_capture.jpg",
  monkeyCount: 3,
  confidence: 94.2,
  hasCapture: true,
}

// Chart Data
const chartData = {
  day: [
    { name: "00:00", monkeys: 2 },
    { name: "04:00", monkeys: 1 },
    { name: "08:00", monkeys: 8 },
    { name: "12:00", monkeys: 12 },
    { name: "16:00", monkeys: 15 },
    { name: "20:00", monkeys: 6 },
  ],
  week: [
    { name: "Sen", monkeys: 45 },
    { name: "Sel", monkeys: 52 },
    { name: "Rab", monkeys: 38 },
    { name: "Kam", monkeys: 61 },
    { name: "Jum", monkeys: 43 },
    { name: "Sab", monkeys: 28 },
    { name: "Min", monkeys: 35 },
  ],
  month: [
    { name: "Jan", monkeys: 320 },
    { name: "Feb", monkeys: 280 },
    { name: "Mar", monkeys: 450 },
    { name: "Apr", monkeys: 380 },
    { name: "Mei", monkeys: 520 },
    { name: "Jun", monkeys: 390 },
  ],
}

// Lucide Icons Library
const lucide = {
  createIcons: () => {
    // Placeholder for Lucide icon creation logic
    console.log("Lucide icons created")
  },
}

// Initialize Dashboard
document.addEventListener("DOMContentLoaded", () => {
  initializeIcons()
  initializeEventListeners()
  initializeChart()
  startAnimations()
  startDataUpdates()
  updateUI()
})

// Initialize Lucide Icons
function initializeIcons() {
  lucide.createIcons()
}

// Initialize Event Listeners
function initializeEventListeners() {
  // Tab Navigation
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.addEventListener("click", function () {
      const tab = this.dataset.tab
      switchTab(tab)
    })
  })

  // Theme Toggle
  document.getElementById("themeToggle").addEventListener("click", toggleTheme)

  // Help Toggle
  document.getElementById("helpToggle").addEventListener("click", toggleHelp)

  // Chart Filter Buttons
  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const filter = this.dataset.filter
      setChartFilter(filter)
    })
  })

  // Download Button
  document.getElementById("downloadBtn").addEventListener("click", downloadCapture)
}

// Tab Switching
function switchTab(tabName) {
  // Update active nav button
  document.querySelectorAll(".nav-button").forEach((btn) => btn.classList.remove("active"))
  document.querySelector(`[data-tab="${tabName}"]`).classList.add("active")

  // Update active tab content
  document.querySelectorAll(".tab-content").forEach((tab) => tab.classList.remove("active"))
  document.getElementById(tabName).classList.add("active")

  currentTab = tabName

  // Reinitialize chart if switching to statistics
  if (tabName === "statistics" && chart) {
    setTimeout(() => {
      chart.resize()
    }, 100)
  }
}

// Theme Toggle
function toggleTheme() {
  isDarkMode = !isDarkMode
  const body = document.body
  const themeIcon = document.querySelector("#themeToggle .icon")
  const themeText = document.querySelector("#themeToggle .nav-text")

  if (isDarkMode) {
    body.setAttribute("data-theme", "light")
    themeIcon.setAttribute("data-lucide", "sun")
    themeText.textContent = "Mode Terang"
  } else {
    body.removeAttribute("data-theme")
    themeIcon.setAttribute("data-lucide", "moon")
    themeText.textContent = "Mode Gelap"
  }

  lucide.createIcons()
}

// Help Toggle
function toggleHelp() {
  isHelpOpen = !isHelpOpen
  const helpHeader = document.getElementById("helpToggle")
  const helpContent = document.getElementById("helpContent")

  if (isHelpOpen) {
    helpHeader.classList.add("open")
    helpContent.classList.add("open")
  } else {
    helpHeader.classList.remove("open")
    helpContent.classList.remove("open")
  }
}

// Chart Filter
function setChartFilter(filter) {
  chartFilter = filter

  // Update active filter button
  document.querySelectorAll(".filter-btn").forEach((btn) => btn.classList.remove("active"))
  document.querySelector(`[data-filter="${filter}"]`).classList.add("active")

  // Update chart
  updateChart()
  updateChartConclusion()
  updateStatsSummary()
}

// Initialize Chart
function initializeChart() {
  const ctx = document.getElementById("monkeyChart").getContext("2d")

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: chartData[chartFilter].map((item) => item.name),
      datasets: [
        {
          label: "Jumlah Monyet",
          data: chartData[chartFilter].map((item) => item.monkeys),
          backgroundColor: "rgba(0, 255, 136, 0.8)",
          borderColor: "rgba(0, 255, 136, 1)",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: getComputedStyle(document.documentElement).getPropertyValue("--text-primary"),
          },
        },
        tooltip: {
          backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--card-bg"),
          titleColor: getComputedStyle(document.documentElement).getPropertyValue("--text-primary"),
          bodyColor: getComputedStyle(document.documentElement).getPropertyValue("--text-primary"),
          borderColor: getComputedStyle(document.documentElement).getPropertyValue("--border-color"),
          borderWidth: 1,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: getComputedStyle(document.documentElement).getPropertyValue("--text-secondary"),
          },
          grid: {
            color: getComputedStyle(document.documentElement).getPropertyValue("--border-color"),
          },
        },
        x: {
          ticks: {
            color: getComputedStyle(document.documentElement).getPropertyValue("--text-secondary"),
          },
          grid: {
            color: getComputedStyle(document.documentElement).getPropertyValue("--border-color"),
          },
        },
      },
    },
  })
}

// Update Chart
function updateChart() {
  if (chart) {
    const data = chartData[chartFilter]
    chart.data.labels = data.map((item) => item.name)
    chart.data.datasets[0].data = data.map((item) => item.monkeys)
    chart.update()
  }
}

// Update Chart Conclusion
function updateChartConclusion() {
  const conclusions = {
    day: "Puncak aktivitas: 16:00 (rata-rata 15 monyet)",
    week: "Hari tersibuk: Kamis (rata-rata 61 monyet)",
    month: "Bulan terbanyak: Mei (520 monyet total)",
  }

  document.getElementById("chartConclusion").textContent = conclusions[chartFilter]
}

// Update Stats Summary
function updateStatsSummary() {
  const data = chartData[chartFilter]
  const total = data.reduce((sum, item) => sum + item.monkeys, 0)
  const average = Math.round(total / data.length)
  const maximum = Math.max(...data.map((item) => item.monkeys))

  document.getElementById("totalDetections").textContent = total
  document.getElementById("averageDetections").textContent = average
  document.getElementById("maxDetections").textContent = maximum
}

// Start Animations
function startAnimations() {
  // Detection box animation
  setInterval(() => {
    const detectionBox = document.getElementById("detectionBox")
    if (!detectionBox) return

    boxPosition.x += boxDirection.x
    boxPosition.y += boxDirection.y

    if (boxPosition.x <= 0 || boxPosition.x >= 85) {
      boxDirection.x = -boxDirection.x
      boxPosition.x = Math.max(0, Math.min(85, boxPosition.x))
    }
    if (boxPosition.y <= 0 || boxPosition.y >= 75) {
      boxDirection.y = -boxDirection.y
      boxPosition.y = Math.max(0, Math.min(75, boxPosition.y))
    }

    detectionBox.style.left = `${boxPosition.x}%`
    detectionBox.style.top = `${boxPosition.y}%`
  }, 50)

  // Update timestamps
  setInterval(updateTimestamps, 1000)
}

// Start Data Updates
function startDataUpdates() {
  // Simulate monkey count changes
  setInterval(() => {
    const change = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0
    if (change !== 0) {
      lastDetectionTime = new Date()
      if (monkeyCount + change >= 0) {
        monkeyCount = Math.max(0, monkeyCount + change)

        // Update latest capture
        if (monkeyCount > 0) {
          latestCapture = {
            type: Math.random() > 0.6 ? "video" : "image",
            timestamp: new Date(),
            filename: Math.random() > 0.6 ? "last_monkey_video.mp4" : "last_monkey_capture.jpg",
            monkeyCount: monkeyCount,
            confidence: 90 + Math.random() * 8,
            hasCapture: true,
          }
          updateCaptureDisplay()
        }
      }
    }
    updateMonkeyCount()
  }, 3000)

  // Simulate MQTT connection status
  setInterval(() => {
    mqttConnected = Math.random() > 0.1 // 90% uptime
    updateMQTTStatus()
  }, 5000)
}

// Update UI
function updateUI() {
  updateMonkeyCount()
  updateMQTTStatus()
  updateTimestamps()
  updateChartConclusion()
  updateStatsSummary()
  updateCaptureDisplay()
}

// Update Monkey Count
function updateMonkeyCount() {
  document.getElementById("monkeyCount").textContent = monkeyCount
  document.getElementById("lastDetection").textContent = `Terakhir: ${lastDetectionTime.toLocaleTimeString("id-ID")}`
}

// Update MQTT Status
function updateMQTTStatus() {
  const mqttIcon = document.getElementById("mqttIcon")
  const mqttStatus = document.getElementById("mqttStatus")
  const mqttBadge = document.getElementById("mqttBadge")
  const mqttStatusBadge = document.getElementById("mqttStatusBadge")

  if (mqttConnected) {
    mqttIcon.setAttribute("data-lucide", "wifi")
    mqttStatus.textContent = "MQTT Terhubung"
    mqttBadge.textContent = "MQTT Aktif"
    mqttBadge.className = "badge success"
    mqttStatusBadge.textContent = "Terhubung"
    mqttStatusBadge.className = "badge success"
  } else {
    mqttIcon.setAttribute("data-lucide", "wifi-off")
    mqttStatus.textContent = "MQTT Terputus"
    mqttBadge.textContent = "MQTT Error"
    mqttBadge.className = "badge error"
    mqttStatusBadge.textContent = "Error"
    mqttStatusBadge.className = "badge error"
  }

  lucide.createIcons()
}

// Update Timestamps
function updateTimestamps() {
  const now = new Date()
  document.getElementById("currentTime").textContent = now.toLocaleString("id-ID")
  document.getElementById("videoTimestamp").textContent =
    `Terakhir update: ${lastDetectionTime.toLocaleTimeString("id-ID")}`
}

// Update Capture Display
function updateCaptureDisplay() {
  const captureIcon = document.getElementById("captureIcon")
  const captureDisplayIcon = document.getElementById("captureDisplayIcon")
  const captureTypeBadge = document.getElementById("captureTypeBadge")
  const captureTitle = document.getElementById("captureTitle")
  const captureFilename = document.getElementById("captureFilename")
  const captureDetails = document.getElementById("captureDetails")
  const captureConfidence = document.getElementById("captureConfidence")
  const captureTimestamp = document.getElementById("captureTimestamp")
  const captureStatus = document.getElementById("captureStatus")
  const fileType = document.getElementById("fileType")
  const fileSize = document.getElementById("fileSize")
  const fileDuration = document.getElementById("fileDuration")
  const downloadBtn = document.getElementById("downloadBtn")

  if (latestCapture.hasCapture) {
    const isVideo = latestCapture.type === "video"

    captureIcon.setAttribute("data-lucide", isVideo ? "play" : "image")
    captureDisplayIcon.setAttribute("data-lucide", isVideo ? "play" : "image")
    captureTypeBadge.textContent = isVideo ? "Video" : "Foto"
    captureTitle.textContent = isVideo ? "Video Terakhir" : "Foto Terakhir"
    captureFilename.textContent = latestCapture.filename
    captureDetails.textContent = `${latestCapture.monkeyCount} monyet terdeteksi`
    captureConfidence.textContent = `Confidence: ${latestCapture.confidence.toFixed(1)}%`
    captureTimestamp.textContent = latestCapture.timestamp.toLocaleString("id-ID")
    captureStatus.textContent = "Capture Tersedia"
    captureStatus.className = "badge success"

    fileType.textContent = isVideo ? "Video MP4" : "Foto JPG"
    fileSize.textContent = isVideo ? "2.4 MB" : "856 KB"
    fileDuration.textContent = isVideo ? "5.2 detik" : "Instant"

    downloadBtn.innerHTML = `
            <i data-lucide="download" class="icon"></i>
            Download ${isVideo ? "Video" : "Foto"}
        `
  } else {
    captureStatus.textContent = "Tidak Ada Capture"
    captureStatus.className = "badge"
    fileType.textContent = "Tidak Ada"
    fileSize.textContent = "-"
    fileDuration.textContent = "-"
  }

  lucide.createIcons()
}

// Download Capture
function downloadCapture() {
  if (latestCapture.hasCapture) {
    // Simulate download
    const link = document.createElement("a")
    link.href = "#"
    link.download = latestCapture.filename
    link.click()

    // Show notification (you can implement a toast notification here)
    alert(`Downloading ${latestCapture.filename}...`)
  }
}

// API Functions (for future backend integration)
async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options)
      if (response.ok) return response
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}

async function fetchStats() {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/stats`)
    const data = await response.json()

    monkeyCount = data.current_count || 0
    lastDetectionTime = new Date(data.last_detection || Date.now())
    mqttConnected = data.system_status === "online"

    updateMonkeyCount()
    updateMQTTStatus()
  } catch (error) {
    console.error("Failed to fetch stats:", error)
  }
}

async function fetchHistory() {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/history`)
    const data = await response.json()

    // Update history data (implement as needed)
    console.log("History data:", data)
  } catch (error) {
    console.error("Failed to fetch history:", error)
  }
}

// Export functions for potential use
window.MonkeyDashboard = {
  switchTab,
  toggleTheme,
  setChartFilter,
  fetchStats,
  fetchHistory,
}
