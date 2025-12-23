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
    recommendationDisplay: document.getElementById('recommendation-display'),
    configDetails: document.getElementById('config-details'),
    errorMessage: document.getElementById('error-message'),
    costTrendChart: document.getElementById('costTrendChart'),
    logLevelChart: document.getElementById('logLevelChart'),
};

let autoRefreshInterval;
let costChart;
let logLevelPieChart;
let recommendations = [];
let currentRecommendationIndex = 0;
let recommendationInterval;

// --- DATA FETCHING ---
async function fetchDashboardData() {
    showLoadingOverlay(true);
    try {
        const response = await fetch(S3_REPORT_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        updateDashboard(data);
        hideError();
    } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        showError(`Failed to fetch report data: ${error.message}.`);
    } finally {
        showLoadingOverlay(false);
    }
}

async function fetchConfigData() {
    try {
        const response = await fetch(CONFIG_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const config = await response.json();
        updateConfigDisplay(config);
    } catch (error) {
        console.error('Failed to fetch config data:', error);
        elements.configDetails.innerHTML = '<p>Failed to load configuration.</p>';
    }
}

// --- UI UPDATES ---
function displayChanges(changes) {
    if (!Array.isArray(changes) || changes.length === 0) return;

    const changesHTML = `
        <div style="font-size: 0.8rem; margin-top: 0.5rem; color: var(--text-tertiary);">
            <strong>Changes since last run:</strong>
            ${changes.map(c => `<div>• ${c}</div>`).join('')}
        </div>
    `;

    if (elements.executiveSummaryMetrics) {
        elements.executiveSummaryMetrics.insertAdjacentHTML(
            'afterend',
            changesHTML
        );
    }
}

function updateDashboard(data) {
    window.dashboardData = data; // <-- ADD THIS LINE (important)

    updateTimestamp(data.timestamp);
    updateStatusIndicators(data.cost_health, data.log_levels);
    updateExecutiveSummary(data);

    elements.costSummary.textContent = data.cost_summary || 'Not available';
    elements.logSummary.textContent = data.log_summary || 'Not available';

    updateAiInsights(data.ai_insights);
    updateLogHealth(data.log_health_status);
    updateLogLevels(data.log_levels);
    updateLogLevelChart(data.log_levels);
    updateRecommendations(data.recommendations);
    updateCostChart(data.cost_trend);

    // NEW
    displayChanges(data.changes_since_last);

    if (data.run_mode && elements.lastUpdated) {
        elements.lastUpdated.innerHTML +=
            `<br><small>${data.run_mode}</small>`;
    }

    document.querySelectorAll('.loading')
        .forEach(el => el.classList.remove('loading'));
}

function updateTimestamp(timestamp) {
    if (!timestamp) {
        elements.lastUpdated.textContent = 'Last updated: N/A';
        return;
    }
    const date = new Date(timestamp);
    elements.lastUpdated.textContent = `Last updated: ${date.toLocaleTimeString()}`;
}

function updateStatusIndicators(costHealth, logLevels) {
    const criticals = logLevels?.critical || 0;
    const warnings = logLevels?.warning || 0;
    let indicators = '';
    
    let costStatus = 'green';
    if (costHealth === 'warning') costStatus = 'yellow';
    if (costHealth === 'critical') costStatus = 'red';
    indicators += `<div class="status-item"><span class="status-dot ${costStatus}"></span>Costs</div>`;

    let logStatus = 'green';
    if (warnings > 0) logStatus = 'yellow';
    if (criticals > 0) logStatus = 'red';
    indicators += `<div class="status-item"><span class="status-dot ${logStatus}"></span>Logs</div>`;

    elements.statusIndicators.innerHTML = indicators;
}

function updateExecutiveSummary(data) {
    const totalCost = data.cost_trend?.total_cost || 0;
    const costChange = data.cost_trend?.change_percentage || 0;
    const totalLogs = Object.values(data.log_levels || {}).reduce((a, b) => a + b, 0);
    const errorCount = (data.log_levels?.critical || 0) + (data.log_levels?.error || 0);

    const metricsHTML = `
        <div class="metric">
            <span class="metric-value">$${totalCost.toFixed(2)}</span>
            <span class="metric-label">Total Costs (${costChange > 0 ? '+' : ''}${costChange.toFixed(1)}%)</span>
        </div>
        <div class="metric">
            <span class="metric-value">${totalLogs}</span>
            <span class="metric-label">Total Logs (${errorCount} errors)</span>
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
        elements.aiInsightsList.innerHTML = '<div class="insight">No AI insights available.</div>';
    }
}

function updateLogHealth(status) {
    const statusText = status || 'Stable';

    const healthScore = window.dashboardData?.health_score ?? 50;
    const healthReason = window.dashboardData?.health_reason ?? 'No data available';

    let emoji = '😐';
    let meterColor = 'var(--warning-color)';

    if (healthScore >= 80) {
        emoji = '😊';
        meterColor = 'var(--success-color)';
    } else if (healthScore < 50) {
        emoji = '😡';
        meterColor = 'var(--error-color)';
    }

    elements.healthStatus.textContent = statusText;
    elements.healthEmoji.textContent = emoji;
    elements.healthMeterBar.style.width = `${healthScore}%`;
    elements.healthMeterBar.style.backgroundColor = meterColor;

    // Tooltip = explainability (VERY GOOD for interviews)
    elements.healthStatus.title =
        `Health Score: ${healthScore}/100\nReason: ${healthReason}`;
}

function updateLogLevels(levels) {
    const criticalCount = levels?.critical || 0;
    const errorCount = levels?.error || 0;
    const warningCount = levels?.warning || 0;
    const infoCount = levels?.info || 0;
    
    elements.criticalCount.textContent = criticalCount;
    elements.errorCount.textContent = errorCount;
    elements.warningCount.textContent = warningCount;
    elements.infoCount.textContent = infoCount;
    
    // 🔴 ADD CLICK HANDLERS FOR INTERACTIVITY
    elements.errorCount.style.cursor = 'pointer';
    elements.errorCount.onclick = () => showErrorDetails(errorCount);
    
    elements.warningCount.style.cursor = 'pointer';
    elements.warningCount.onclick = () => showWarningDetails(warningCount);
    
    elements.criticalCount.style.cursor = 'pointer';
    elements.criticalCount.onclick = () => showErrorDetails(criticalCount);
}

function showErrorDetails(count) {
    if (!window.dashboardData?.error_details) {
        alert(`${count} errors detected. Detailed error tracking is being implemented.`);
        return;
    }
    
    const errors = window.dashboardData.error_details.slice(0, 5);
    const details = errors.map(e => 
        `🔴 ${e.id}: ${e.type}\n${e.message}\n💡 ${e.recommendation}\n`
    ).join('\n');
    
    alert(`Top ${errors.length} Errors:\n\n${details}`);
}

function showWarningDetails(count) {
    if (!window.dashboardData?.warning_details) {
        alert(`${count} warnings detected. Enable detailed logging in backend.`);
        return;
    }
    
    const warnings = window.dashboardData.warning_details.slice(0, 5);
    const details = warnings.map(w => 
        `⚠️ ${w.id}: ${w.type}\n${w.message}\n`
    ).join('\n');
    
    alert(`Top ${warnings.length} Warnings:\n\n${details}`);
}

function updateRecommendations(newRecommendations) {
    recommendations = newRecommendations || [];
    
    if (recommendations.length === 0) {
        elements.recommendationDisplay.innerHTML = '<p>✅ All systems optimal</p>';
        return;
    }
    
    // 🔴 SHOW ALL RECOMMENDATIONS AT ONCE (NO CYCLING)
    const html = recommendations.map((rec, i) => 
        `<div style="text-align: left; padding: 0.5rem; border-left: 3px solid var(--primary-color); margin: 0.5rem 0; background: var(--bg-secondary); border-radius: 4px; font-size: 0.85rem;">
            <strong>${i + 1}.</strong> ${rec}
        </div>`
    ).join('');
    
    elements.recommendationDisplay.innerHTML = html;
    elements.recommendationDisplay.style.textAlign = 'left';
    elements.recommendationDisplay.style.overflowY = 'auto';
    elements.recommendationDisplay.style.maxHeight = '100%';
}

function updateConfigDisplay(config) {
    const configData = config.analysis_config;
    if (!configData) {
        elements.configDetails.textContent = 'Invalid config format.';
        return;
    }
    const html = `Logs: ${configData.log_files_to_analyze.join(', ')}
Cost Cats: ${configData.cost_categories_to_watch.join(', ')}
Thresholds: Cost > ${configData.abnormal_thresholds.cost_increase_percentage}%, Criticals > ${configData.abnormal_thresholds.critical_log_count}`;
    elements.configDetails.textContent = html;
}

function updateCostChart(costTrend) {
    if (!costTrend || !costTrend.history) return;

    const contributor = window.dashboardData?.primary_cost_contributor;
    if (contributor && elements.costSummary) {
        elements.costSummary.innerHTML =
            `${elements.costSummary.textContent}
         <br><small style="color: var(--text-tertiary);">
         Primary contributor: ${contributor}
         </small>`;
    }

    const labels = costTrend.history.map(item => new Date(item.date).toLocaleDateString());
    const data = costTrend.history.map(item => item.cost);

    const chartData = {
        labels,
        datasets: [{
            label: 'Cost',
            data,
            borderColor: 'rgba(189, 147, 249, 1)',
            backgroundColor: 'rgba(189, 147, 249, 0.2)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
        }]
    };

    if (costChart) {
        costChart.data = chartData;
        costChart.update();
    } else {
        costChart = new Chart(elements.costTrendChart, {
            type: 'line',
            data: chartData,
            options: getChartOptions(false),
        });
    }
}

function updateLogLevelChart(levels) {
    if (!levels) return;

    const data = {
        labels: ['Critical', 'Error', 'Warning', 'Info'],
        datasets: [{
            data: [levels.critical || 0, levels.error || 0, levels.warning || 0, levels.info || 0],
            backgroundColor: ['var(--critical-color)', 'var(--error-color)', 'var(--warning-color)', 'var(--primary-light)'],
            borderWidth: 0,
        }]
    };

    if (logLevelPieChart) {
        logLevelPieChart.data = data;
        logLevelPieChart.update();
    } else {
        logLevelPieChart = new Chart(elements.logLevelChart, {
            type: 'doughnut',
            data: data,
            options: getChartOptions(true, 'bottom'),
        });
    }
}

function getChartOptions(isPie = false, legendPos = 'top') {
    return {
        responsive: true,
        maintainAspectRatio: false,
        scales: isPie ? {} : {
            y: { beginAtZero: true, ticks: { color: 'var(--text-tertiary)' }, grid: { color: 'var(--border-color)' } },
            x: { ticks: { color: 'var(--text-tertiary)' }, grid: { color: 'var(--border-color)' } }
        },
        plugins: {
            legend: { display: isPie, position: legendPos, labels: { color: 'var(--text-tertiary)' } },
            tooltip: {
                backgroundColor: 'var(--bg-primary)',
                titleColor: 'var(--text-secondary)',
                bodyColor: 'var(--text-primary)',
            }
        }
    };
}

// --- UTILITY & EVENT HANDLERS ---
function downloadReport() {
    window.open(S3_REPORT_URL, '_blank');
}

function showError(message) {
    elements.errorMessage.querySelector('p').textContent = message;
    elements.errorMessage.classList.remove('error-hidden');
}

function hideError() {
    elements.errorMessage.classList.add('error-hidden');
}

function showLoadingOverlay(show) {
    elements.loadingOverlay.style.display = show ? 'flex' : 'none';
}

function initialize() {
    elements.refreshBtn.addEventListener('click', fetchDashboardData);
    elements.downloadReportBtn.addEventListener('click', downloadReport);
    elements.autoRefreshToggle.addEventListener('change', (e) => {
        e.target.checked ? startAutoRefresh() : stopAutoRefresh();
    });

    fetchDashboardData();
    fetchConfigData();
    startAutoRefresh();
    showLoadingOverlay(true);
}

function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(fetchDashboardData, REFRESH_INTERVAL_MS);
}

function stopAutoRefresh() {
    clearInterval(autoRefreshInterval);
}

document.addEventListener('DOMContentLoaded', initialize);