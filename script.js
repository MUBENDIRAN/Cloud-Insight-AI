// --- CONFIGURATION ---
const S3_REPORT_URL = 'https://ci-ai-reports.s3.ap-south-1.amazonaws.com/final_report.json';
const CONFIG_URL = 'https://ci-ai-reports.s3.ap-south-1.amazonaws.com/config.json';
const REFRESH_INTERVAL_MS = 30000; // 30 seconds

// --- DOM ELEMENT REFERENCES ---
const elements = {
    loadingOverlay: document.getElementById('loading-overlay'),
    lastUpdated: document.getElementById('last-updated'),
    refreshBtn: document.getElementById('refresh-btn'),
    downloadReportBtn: document.getElementById('download-report-btn'),
    autoRefreshToggle: document.getElementById('auto-refresh'),
    statusIndicators: document.getElementById('status-indicators'),
    executiveSummaryMetrics: document.getElementById('executive-summary-metrics'),
    costSummary: document.getElementById('cost-summary'),
    logSummary: document.getElementById('log-summary'),
    aiInsightsList: document.getElementById('ai-insights-list'),
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
    costTrendChart: document.getElementById('costTrendChart'),
};

let autoRefreshInterval;
let costChart;

// --- DATA FETCHING ---
async function fetchDashboardData() {
    showLoadingOverlay();
    try {
        setLoadingState(true);
        const response = await fetch(S3_REPORT_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        updateDashboard(data);
        hideError();
    } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        showError(`Failed to fetch report data: ${error.message}. Please check the console for details.`);
    } finally {
        setLoadingState(false);
        hideLoadingOverlay();
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
        elements.configDetails.innerHTML = '<p>Failed to load configuration.</p>';
    }
}

// --- UI UPDATES ---
function updateDashboard(data) {
    const criticalCount = data.log_levels?.critical || 0;
    const warningCount = data.log_levels?.warning || 0;
    const errorCount = data.log_levels?.error || 0;

    updateTimestamp(data.timestamp);
    updateStatusIndicators(data.cost_health, criticalCount, warningCount);
    updateExecutiveSummary(data);
    
    elements.costSummary.textContent = data.cost_summary || 'Not available';
    elements.logSummary.textContent = data.log_summary || 'Not available';
    
    updateAiInsights(data.ai_insights);
    updateLogHealth(data.log_health_status);
    updateLogLevels(data.log_levels);
    updateTrend(data.trend);
    updateRecommendations(data.recommendations);
    updateCostChart(data.cost_trend);
    
    removeLoadingPlaceholders();
}

function updateTimestamp(timestamp) {
    if (!timestamp) {
        elements.lastUpdated.innerHTML = 'Last updated: N/A';
        return;
    }
    const date = new Date(timestamp);
    const timeAgo = getTimeAgo(date);
    elements.lastUpdated.innerHTML = `Last updated: <strong>${timeAgo}</strong> <span class="text-gray-400">(${date.toLocaleString()})</span>`;
}

function updateStatusIndicators(costHealth, criticals, warnings) {
    let indicators = '';
    
    // Cost Status
    let costStatus = 'green';
    if (costHealth === 'warning') costStatus = 'yellow';
    if (costHealth === 'critical') costStatus = 'red';
    indicators += `<div class="status-item"><span class="status-dot ${costStatus}"></span><span>Costs: Monitored</span></div>`;

    // Log Status
    let logStatus = 'green';
    if (warnings > 0) logStatus = 'yellow';
    if (criticals > 0) logStatus = 'red';
    const logLabel = criticals > 0 ? `${criticals} Critical` : (warnings > 0 ? `${warnings} Warnings` : 'Nominal');
    indicators += `<div class="status-item"><span class="status-dot ${logStatus}"></span><span>Logs: ${logLabel}</span></div>`;

    elements.statusIndicators.innerHTML = indicators;
}

function updateExecutiveSummary(data) {
    const totalCost = data.cost_trend?.total_cost || 0;
    const costChange = data.cost_trend?.change_percentage || 0;
    const totalLogs = Object.values(data.log_levels || {}).reduce((a, b) => a + b, 0);
    const errorCount = (data.log_levels?.critical || 0) + (data.log_levels?.error || 0);

    const trendClass = costChange > 0 ? 'up' : 'down';
    const trendSign = costChange > 0 ? '+' : '';

    const metricsHTML = `
        <div class="metric">
            <span class="metric-value">$${totalCost.toFixed(2)}</span>
            <span class="metric-label">Total Costs</span>
            <span class="metric-trend ${trendClass}">${trendSign}${costChange.toFixed(1)}%</span>
        </div>
        <div class="metric">
            <span class="metric-value">${totalLogs}</span>
            <span class="metric-label">Total Log Entries</span>
            <span class="metric-trend">${errorCount} errors</span>
        </div>
    `;
    elements.executiveSummaryMetrics.innerHTML = metricsHTML;
}

function updateAiInsights(insights) {
    elements.aiInsightsList.innerHTML = '';
    if (insights && insights.length > 0) {
        insights.forEach(insight => {
            const div = document.createElement('div');
            div.className = 'insight';
            div.innerHTML = `<strong>${insight.title}:</strong> ${insight.finding}`;
            elements.aiInsightsList.appendChild(div);
        });
    } else {
        const div = document.createElement('div');
        div.className = 'insight';
        div.textContent = 'No AI-powered insights available at this time.';
        elements.aiInsightsList.appendChild(div);
    }
}

function updateLogHealth(status) {
    const statusText = status || 'Stable';
    let emoji = '😐';
    let meterWidth = '50%';
    let meterColor = 'var(--primary-color)';
    let meterValue = 50;

    switch (statusText.toLowerCase()) {
        case 'healthy':
            emoji = '😊';
            meterWidth = '100%';
            meterColor = 'var(--success-color)';
            meterValue = 100;
            break;
        case 'degraded':
            emoji = '😡';
            meterWidth = '10%';
            meterColor = 'var(--error-color)';
            meterValue = 10;
            break;
    }

    elements.healthStatus.textContent = statusText;
    elements.healthEmoji.textContent = emoji;
    elements.healthMeterBar.style.width = meterWidth;
    elements.healthMeterBar.style.background = meterColor;
    
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
    if (trend === 'up') trendSymbol = '▲'; // Up
    if (trend === 'down') trendSymbol = '▼'; // Down
    elements.trendIndicator.textContent = trendSymbol;
}

function updateRecommendations(recommendations) {
    elements.recommendationsList.innerHTML = '';
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

function updateCostChart(costTrend) {
    if (!costTrend || !costTrend.history) return;

    const labels = costTrend.history.map(item => new Date(item.date).toLocaleDateString());
    const data = costTrend.history.map(item => item.cost);

    const chartData = {
        labels: labels,
        datasets: [{
            label: 'Cost Over Time',
            data: data,
            borderColor: 'rgba(99, 102, 241, 1)',
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            fill: true,
            tension: 0.4,
        }]
    };

    if (costChart) {
        costChart.data = chartData;
        costChart.update();
    } else {
        const ctx = elements.costTrendChart.getContext('2d');
        costChart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

// --- UTILITY FUNCTIONS ---
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

function downloadReport() {
    window.open(S3_REPORT_URL.replace('.json', '.txt'), '_blank');
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
function showLoadingOverlay() {
    elements.loadingOverlay.classList.remove('hidden');
}

function hideLoadingOverlay() {
    elements.loadingOverlay.classList.add('hidden');
}

function setLoadingState(isLoading) {
    elements.refreshBtn.classList.toggle('loading', isLoading);
    elements.refreshBtn.disabled = isLoading;
}

function removeLoadingPlaceholders() {
    document.querySelectorAll('.loading').forEach(el => el.classList.remove('loading'));
}

// --- INITIALIZATION ---
function initialize() {
    elements.refreshBtn.addEventListener('click', fetchDashboardData);
    elements.downloadReportBtn.addEventListener('click', downloadReport);
    elements.autoRefreshToggle.addEventListener('change', () => {
        if (elements.autoRefreshToggle.checked) {
            startAutoRefresh();
        } else {
            stopAutoRefresh();
        }
    });

    // Initial data fetch
    fetchDashboardData();
    fetchConfigData();
    startAutoRefresh();
    
    // Set initial loading state
    showLoadingOverlay();
}

function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(fetchDashboardData, REFRESH_INTERVAL_MS);
}

function stopAutoRefresh() {
    clearInterval(autoRefreshInterval);
}

// Start the application
document.addEventListener('DOMContentLoaded', initialize);
