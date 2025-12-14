// --- CONFIGURATION ---
// IMPORTANT: Replace this with the actual public URL of your final_report.json file in S3.
const S3_REPORT_URL = 'https://my-bucket.s3.amazonaws.com/final_report.json';
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
    errorCount: document.getElementById('error-count'),
    warningCount: document.getElementById('warning-count'),
    trendIndicator: document.getElementById('trend-indicator'),
    recommendationsList: document.getElementById('recommendations'),
    errorMessage: document.getElementById('error-message'),
};

// --- DATA FETCHING ---
async function fetchDashboardData() {
    try {
        // For local testing, you can point to the local file.
        // const response = await fetch('final_report.json');
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

// --- UI UPDATES ---
function updateDashboard(data) {
    updateTimestamp(data.timestamp);
    updateStatus(data.sentiment, data.error_count);
    
    elements.costSummary.textContent = data.cost_summary || 'Not available';
    elements.logSummary.textContent = data.log_summary || 'Not available';
    
    updateSentiment(data.sentiment);
    updateCounts(data.error_count, data.warning_count);
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

function updateStatus(sentiment, errorCount) {
    let statusText = 'Healthy';
    let statusColorClass = 'sentiment-positive';

    if (sentiment === 'Negative' || errorCount > 0) {
        statusText = 'Degraded';
        statusColorClass = 'sentiment-negative';
    }
    if (errorCount > 5) { // Example threshold for critical
        statusText = 'Critical';
    }
    
    elements.statusIndicator.textContent = statusText;
    elements.statusIndicator.className = statusColorClass;
}

function updateSentiment(sentiment) {
    const sentimentText = sentiment || 'Neutral';
    let emoji = '😐';
    let colorClass = 'sentiment-neutral';

    switch (sentimentText.toLowerCase()) {
        case 'positive':
            emoji = '😊';
            colorClass = 'sentiment-positive';
            break;
        case 'negative':
            emoji = '😡';
            colorClass = 'sentiment-negative';
            break;
    }

    elements.sentiment.textContent = sentimentText;
    elements.sentiment.className = colorClass;
    elements.sentimentEmoji.textContent = emoji;
}

function updateCounts(errors, warnings) {
    elements.errorCount.textContent = errors || 0;
    elements.warningCount.textContent = warnings || 0;
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

    // Set up auto-refresh
    setInterval(fetchDashboardData, REFRESH_INTERVAL_MS);
}

// Start the application
document.addEventListener('DOMContentLoaded', initialize);
