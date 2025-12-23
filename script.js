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
    logLevelChart: document.getElementById('logLevelChart'),
};

let autoRefreshInterval;
let costBreakdownChart = null; // ADD THIS
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
    window.dashboardData = data;
    
    // 🔴 ADD DEBUGGING INFO
    console.log('📊 Dashboard Updated:', {
        timestamp: data.timestamp,
        errors: data.error_details?.length || 0,
        warnings: data.warning_details?.length || 0,
        costBreakdown: data.cost_breakdown?.length || 0,
        recommendations: data.recommendations?.length || 0
    });
    
    updateTimestamp(data.timestamp);
    updateStatusIndicators(data.cost_health, data.log_levels);
    updateExecutiveSummary(data);

    elements.logSummary.textContent = data.log_summary || 'Not available';

    updateAiInsights(data.ai_insights);
    updateLogHealth(data.log_health_status);
    updateLogLevels(data.log_levels);
    updateLogLevelChart(data.log_levels);
    updateRecommendations(data.recommendations);
    updateCostBreakdown(data.cost_breakdown);

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
    
    if (!insights || insights.length === 0) {
        elements.aiInsightsList.innerHTML = '<div class="insight">✅ No anomalies detected</div>';
        return;
    }
    
    insights.forEach(insight => {
        const severityColor = {
            'critical': 'var(--error-color)',
            'high': 'var(--warning-color)',
            'medium': 'var(--info-color)'
        }[insight.severity] || 'var(--primary-color)';
        
        const div = document.createElement('div');
        div.className = 'insight';
        div.style.borderLeftColor = severityColor;
        div.innerHTML = `
            <strong>${insight.title}</strong> (${(insight.confidence * 100).toFixed(0)}% confidence)
            <br>${insight.finding}
            <br><span style="color: ${severityColor};">→ ${insight.action}</span>
        `;
        elements.aiInsightsList.appendChild(div);
    });
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

    elements.infoCount.style.cursor = 'pointer';
    elements.infoCount.onclick = () => showInfoDetails(infoCount);
}

function showErrorDetails(count) {
    if (!window.dashboardData?.error_details) {
        showModal('Error Details', `<p>${count} errors detected. Detailed error tracking is being implemented.</p>`);
        return;
    }
    
    const errors = window.dashboardData.error_details.slice(0, 10);
    
    const html = errors.map(e => `
        <div class="error-item">
            <div class="error-item-header">
                <span class="error-id">🔴 ${e.id}</span>
                <span class="error-type">${e.type}</span>
            </div>
            <div class="error-message">${e.message}</div>
            ${e.recommendation ? `<div class="error-recommendation">💡 ${e.recommendation}</div>` : ''}
            ${e.timestamp ? `<div class="error-timestamp">⏰ ${e.timestamp}</div>` : ''}
        </div>
    `).join('');
    
    showModal(`Error Details (${errors.length} of ${count})`, html);
}

function showWarningDetails(count) {
    if (!window.dashboardData?.warning_details) {
        showModal('Warning Details', `<p>${count} warnings detected. Enable detailed logging in backend.</p>`);
        return;
    }
    
    const warnings = window.dashboardData.warning_details.slice(0, 10);
    
    const html = warnings.map(w => `
        <div class="warning-item">
            <div class="error-item-header">
                <span class="error-id">⚠️ ${w.id}</span>
                <span class="error-type">${w.type}</span>
            </div>
            <div class="error-message">${w.message}</div>
            ${w.timestamp ? `<div class="error-timestamp">⏰ ${w.timestamp}</div>` : ''}
        </div>
    `).join('');
    
    showModal(`Warning Details (${warnings.length} of ${count})`, html);
}

function showInfoDetails(count) {
    showModal('Info Logs', `<p>${count} informational logs. No action required.</p>`);
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
    const cfg = config?.analysis_config;
    if (!cfg) {
        elements.configDetails.innerHTML = '<p style="color: var(--error-color);">❌ Configuration unavailable</p>';
        return;
    }
    
    // 🔴 BETTER FORMATTING WITH VISUAL HIERARCHY
    elements.configDetails.innerHTML = `
        <div style="font-family: 'Fira Code', monospace; font-size: 0.8rem;">
            <div style="margin-bottom: 1rem; padding: 0.5rem; background: var(--bg-primary); border-radius: 4px;">
                <strong style="color: var(--text-secondary);">📋 Log Sources:</strong><br>
                ${cfg.log_files_to_analyze.map(f => `  • ${f}`).join('<br>')}
            </div>
            
            <div style="margin-bottom: 1rem; padding: 0.5rem; background: var(--bg-primary); border-radius: 4px;">
                <strong style="color: var(--text-secondary);">💰 Cost Categories:</strong><br>
                ${cfg.cost_categories_to_watch.map(c => `  • ${c}`).join('<br>')}
            </div>
            
            <div style="padding: 0.5rem; background: var(--bg-primary); border-radius: 4px;">
                <strong style="color: var(--text-secondary);">⚠️ Alert Thresholds:</strong><br>
                  • Cost Increase: <span style="color: var(--warning-color);">${cfg.abnormal_thresholds.cost_increase_percentage}%</span><br>
                  • Critical Logs: <span style="color: var(--error-color);">${cfg.abnormal_thresholds.critical_log_count}</span>
            </div>
            
            <div style="margin-top: 1rem; padding: 0.5rem; border-top: 1px solid var(--border-color); font-size: 0.75rem; color: var(--text-tertiary);">
                Version: ${config.project_info?.version || 'N/A'}<br>
                Last Updated: ${config.project_info?.last_updated ? new Date(config.project_info.last_updated).toLocaleString() : 'N/A'}
            </div>
        </div>
    `;
}

function updateCostBreakdown(costBreakdown) {
    if (!costBreakdown || costBreakdown.length === 0) return;
    
    const canvas = document.getElementById('costBreakdownChart');
    
    // 🔴 DESTROY OLD CHART FIRST
    if (costBreakdownChart) {
        costBreakdownChart.destroy();
    }
    
    const labels = costBreakdown.map(item => item.service);
    const data = costBreakdown.map(item => item.cost);
    const colors = [
        '#bd93f9', '#ff79c6', '#8be9fd', '#50fa7b', 
        '#ffb86c', '#ff5555', '#f1fa8c'
    ];
    
    // 🔴 ASSIGN TO VARIABLE
    costBreakdownChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors.slice(0, data.length),
                borderWidth: 2,
                borderColor: '#2d2f41'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#f8f8f2', font: { size: 10 } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: $${context.parsed.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function updateLogLevelChart(levels) {
    if (!levels) {
        console.warn('No log level data available');
        return;
    }

    const data = {
        labels: ['Critical', 'Error', 'Warning', 'Info'],
        datasets: [{
            data: [
                levels.critical || 0,
                levels.error || 0,
                levels.warning || 0,
                levels.info || 0
            ],
            backgroundColor: [
                '#991b1b',  // Dark red
                '#ef4444',  // Red
                '#f59e0b',  // Orange/Yellow
                '#818cf8'   // Blue
            ],
            borderWidth: 2,
            borderColor: '#2d2f41',
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    color: '#f8f8f2',  // 🔴 BRIGHT TEXT
                    font: { size: 11 },
                    padding: 10
                }
            },
            tooltip: {
                backgroundColor: 'rgba(30, 30, 46, 0.95)',
                titleColor: '#bd93f9',
                bodyColor: '#f8f8f2',
                borderColor: '#44475a',
                borderWidth: 1,
                padding: 12,
                displayColors: true
            }
        }
    };

    if (logLevelPieChart) {
        logLevelPieChart.data = data;
        logLevelPieChart.options = options;
        logLevelPieChart.update();
    } else {
        logLevelPieChart = new Chart(elements.logLevelChart, {
            type: 'doughnut',
            data: data,
            options: options
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
// Modal utility functions
function showModal(title, bodyHTML) {
    const modal = document.getElementById('error-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = title;
    modalBody.innerHTML = bodyHTML;
    modal.style.display = 'flex';
    
    // Close handlers
    document.getElementById('modal-close').onclick = closeModal;
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
    
    // ESC key to close
    document.addEventListener('keydown', handleModalEscape);
}

function closeModal() {
    const modal = document.getElementById('error-modal');
    modal.style.display = 'none';
    document.removeEventListener('keydown', handleModalEscape);
}

function handleModalEscape(e) {
    if (e.key === 'Escape') closeModal();
}
