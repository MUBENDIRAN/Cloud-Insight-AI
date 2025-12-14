// --- CONFIGURATION ---
// IMPORTANT: Replace this with the actual public URL of your final_report.json file in S3.
const S3_REPORT_URL = 'final_report.json'; // Using local file for demo
const CONFIG_URL = 'config.json'; // URL for the configuration file
const REFRESH_INTERVAL_MS = 30000; // 30 seconds

// --- DOM ELEMENT REFERENCES ---
const elements = {
    lastUpdated: document.getElementById('last-updated'),
    refreshBtn: document.getElementById('refresh-btn'),
    statusIndicator: document.getElementById('status-indicator'),
    costSummary: document.getElementById('cost-summary'),
    logSummary: document.getElementById('log-summary'),
    healthStatus: document.getElementById('health-status'),
    healthEmoji: document.getElementById('health-emoji'),
    healthMeterBar: document.getElementById('health-meter-bar'),
    criticalCount: document.getElementById('critical-count'),
    errorCount: document.getElementById('error-count'),
    warningCount: document.getElementById('warning-count'),
    infoCount: document.getElementById('info-count'),
    trendIndicator: document.getElementById('trend-indicator'),
    recommendationsList: document.getElementById('recommendations'),
    configDetails: document.getElementById('config-details'),
    errorMessage: document.getElementById('error-message'),
};

// --- DATA FETCHING ---
async function fetchDashboardData() {
    try {
        setLoadingState(true);
        const response = await fetch(S3_REPORT_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        updateDashboard(data);
        hideError();
        removeLoadingStates();
    } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        showError('Failed to fetch or parse report data. Please check the console for details.');
        removeLoadingStates();
    } finally {
        setLoadingState(false);
    }
}

async function fetchConfigData() {
    try {
        const response = await fetch(CONFIG_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const config = await response.json();
        updateConfigDisplay(config);
    } catch (error) {
        console.error('Failed to fetch config data:', error);
        elements.configDetails.textContent = 'Failed to load configuration.';
    }
}


// --- UI UPDATES ---
function updateDashboard(data) {
    const criticalCount = data.log_levels?.critical || 0;
    updateTimestamp(data.timestamp);
    updateOverallStatus(data.log_health_status, criticalCount);
    
    elements.costSummary.textContent = data.cost_summary || 'Not available';
    elements.logSummary.textContent = data.log_summary || 'Not available';
    
    updateLogHealth(data.log_health_status);
    updateLogLevels(data.log_levels);
    updateTrend(data.trend);
    updateRecommendations(data.recommendations);
}

function updateTimestamp(timestamp) {
    if (!timestamp) {
        elements.lastUpdated.textContent = 'Last updated: N/A';
        return;
    }
    const date = new Date(timestamp);
    elements.lastUpdated.textContent = `Last updated: ${date.toLocaleString()}`;
}

function updateOverallStatus(status, criticalCount) {
    let statusText = 'Healthy';
    let statusColorClass = 'status-healthy';

    if (status === 'Degraded' || criticalCount > 0) {
        statusText = 'Degraded';
        statusColorClass = 'status-degraded';
    }
    if (criticalCount > 5) { // Example threshold for critical
        statusText = 'Critical';
    }
    
    elements.statusIndicator.textContent = statusText;
    elements.statusIndicator.className = statusColorClass;
}

function updateLogHealth(status) {
    const statusText = status || 'Stable';
    let emoji = '😐';
    let colorClass = 'status-stable';
    let meterWidth = '50%';
    let meterColor = 'linear-gradient(90deg, #6366f1 0%, #818cf8 100%)'; // Blue for Stable
    let meterValue = 50;

    switch (statusText.toLowerCase()) {
        case 'healthy':
            emoji = '😊';
            colorClass = 'status-healthy';
            meterWidth = '100%';
            meterColor = 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'; // Green
            meterValue = 100;
            break;
        case 'degraded':
            emoji = '😡';
            colorClass = 'status-degraded';
            meterWidth = '10%';
            meterColor = 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)'; // Red
            meterValue = 10;
            break;
    }

    elements.healthStatus.textContent = statusText;
    elements.healthStatus.className = colorClass;
    elements.healthEmoji.textContent = emoji;
    elements.healthMeterBar.style.width = meterWidth;
    elements.healthMeterBar.style.background = meterColor;
    
    // Update ARIA attributes
    const healthMeter = document.querySelector('.health-meter');
    if (healthMeter) {
        healthMeter.setAttribute('aria-valuenow', meterValue);
        healthMeter.setAttribute('aria-label', `Health status: ${statusText} (${meterValue}%)`);
    }
}

function updateLogLevels(levels) {
    elements.criticalCount.textContent = levels?.critical || 0;
    elements.errorCount.textContent = levels?.error || 0;
    elements.warningCount.textContent = levels?.warning || 0;
    elements.infoCount.textContent = levels?.info || 0;
}

function updateTrend(trend) {
    let trendSymbol = '→'; // Neutral
    if (trend === 'up') {
        trendSymbol = '▲'; // Up
    } else if (trend === 'down') {
        trendSymbol = '▼'; // Down
    }
    elements.trendIndicator.textContent = trendSymbol;
}

function updateRecommendations(recommendations) {
    elements.recommendationsList.innerHTML = ''; // Clear existing items
    if (recommendations && recommendations.length > 0) {
        recommendations.forEach(rec => {
            const li = document.createElement('li');
            li.textContent = rec;
            elements.recommendationsList.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'No recommendations at this time.';
        elements.recommendationsList.appendChild(li);
    }
}

function updateConfigDisplay(config) {
    const configData = config.analysis_config;
    if (!configData) {
        elements.configDetails.textContent = 'Configuration format is invalid.';
        return;
    }
    
    const html = `Logs Analyzed: ${configData.log_files_to_analyze.join(', ')}
Cost Categories: ${configData.cost_categories_to_watch.join(', ')}
Thresholds: Cost Increase > ${configData.abnormal_thresholds.cost_increase_percentage}%, Critical Logs > ${configData.abnormal_thresholds.critical_log_count}`;
    
    elements.configDetails.textContent = html;
}


// --- ERROR HANDLING ---
function showError(message) {
    elements.errorMessage.querySelector('p').textContent = message;
    elements.errorMessage.classList.remove('error-hidden');
}

function hideError() {
    elements.errorMessage.classList.add('error-hidden');
}

// --- LOADING STATES ---
function setLoadingState(isLoading) {
    if (isLoading) {
        elements.refreshBtn.classList.add('loading');
        elements.refreshBtn.disabled = true;
    } else {
        elements.refreshBtn.classList.remove('loading');
        elements.refreshBtn.disabled = false;
    }
}

function removeLoadingStates() {
    const loadingElements = document.querySelectorAll('.loading');
    loadingElements.forEach(el => {
        el.classList.remove('loading');
    });
}

// --- INITIALIZATION ---
function initialize() {
    // Event listener for the refresh button
    elements.refreshBtn.addEventListener('click', fetchDashboardData);

    // Initial data fetch
    fetchDashboardData();
    fetchConfigData();

    // Set up auto-refresh
    setInterval(() => {
        if (!elements.refreshBtn.disabled) {
            fetchDashboardData();
        }
    }, REFRESH_INTERVAL_MS);
}

// Start the application
document.addEventListener('DOMContentLoaded', initialize);
