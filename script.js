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
    sentiment: document.getElementById('sentiment'),
    sentimentEmoji: document.getElementById('sentiment-emoji'),
    sentimentMeterBar: document.getElementById('sentiment-meter-bar'),
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
        const response = await fetch(S3_REPORT_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        updateDashboard(data);
        hideError();
    } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        showError('Failed to fetch or parse report data. Please check the console for details.');
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
    const errorCount = data.log_levels?.critical || 0;
    updateTimestamp(data.timestamp);
    updateStatus(data.sentiment, errorCount);
    
    elements.costSummary.textContent = data.cost_summary || 'Not available';
    elements.logSummary.textContent = data.log_summary || 'Not available';
    
    updateSentiment(data.sentiment);
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

function updateStatus(sentiment, criticalCount) {
    let statusText = 'Healthy';
    let statusColorClass = 'sentiment-positive';

    if (sentiment === 'Negative' || criticalCount > 0) {
        statusText = 'Degraded';
        statusColorClass = 'sentiment-negative';
    }
    if (criticalCount > 5) { // Example threshold for critical
        statusText = 'Critical';
    }
    
    elements.statusIndicator.textContent = statusText;
    elements.statusIndicator.className = statusColorClass;
}

function updateSentiment(sentiment) {
    const sentimentText = sentiment || 'Neutral';
    let emoji = '😐';
    let colorClass = 'sentiment-neutral';
    let meterWidth = '50%';
    let meterColor = '#3498db'; // Blue for Neutral

    switch (sentimentText.toLowerCase()) {
        case 'positive':
            emoji = '😊';
            colorClass = 'sentiment-positive';
            meterWidth = '100%';
            meterColor = '#2ecc71'; // Green
            break;
        case 'negative':
            emoji = '😡';
            colorClass = 'sentiment-negative';
            meterWidth = '10%';
            meterColor = '#e74c3c'; // Red
            break;
    }

    elements.sentiment.textContent = sentimentText;
    elements.sentiment.className = colorClass;
    elements.sentimentEmoji.textContent = emoji;
    elements.sentimentMeterBar.style.width = meterWidth;
    elements.sentimentMeterBar.style.backgroundColor = meterColor;
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

// --- INITIALIZATION ---
function initialize() {
    // Event listener for the refresh button
    elements.refreshBtn.addEventListener('click', fetchDashboardData);

    // Initial data fetch
    fetchDashboardData();
    fetchConfigData();

    // Set up auto-refresh
    setInterval(fetchDashboardData, REFRESH_INTERVAL_MS);
}

// Start the application
document.addEventListener('DOMContentLoaded', initialize);
