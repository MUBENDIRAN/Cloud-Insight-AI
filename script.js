const S3_REPORT_URL = 'https://ci-ai-reports.s3.ap-south-1.amazonaws.com/final_report.json';
const REFRESH_INTERVAL_MS = 30000;

const elements = {
    loadingOverlay: document.getElementById('loading-overlay'),
    lastUpdated: document.getElementById('last-updated'),
    dataFreshness: document.getElementById('data-freshness'),
    refreshBtn: document.getElementById('refresh-btn'),
    downloadReportBtn: document.getElementById('download-report-btn'),
    autoRefreshToggle: document.getElementById('auto-refresh'),
    statusIndicators: document.getElementById('status-indicators'),
    criticalCount: document.getElementById('critical-count'),
    errorCount: document.getElementById('error-count'),
    warningCount: document.getElementById('warning-count'),
    infoCount: document.getElementById('info-count'),
    recommendationDisplay: document.getElementById('recommendation-display'),
    costBreakdownSubtitle: document.getElementById('cost-breakdown-subtitle'),
    errorMessage: document.getElementById('error-message'),
};

const DashboardStore = {
  data: null,
  set(data) { this.data = data }
};

let autoRefreshInterval;
let costBreakdownChart = null;

async function fetchDashboardData() {
    showLoadingOverlay(true);
    try {
        const response = await fetch(S3_REPORT_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        document.querySelector('.dashboard-container').classList.remove('data-stale');
        updateDashboard(data);
        hideError();
    } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        document.querySelector('.dashboard-container').classList.add('data-stale');
        showError(`Failed to fetch new data. Displayed data may be outdated.`);
    } finally {
        showLoadingOverlay(false);
    }
}

function updateDashboard(data) {
    DashboardStore.set(data);
    
    console.log('📊 Dashboard Updated:', {
        timestamp: data.timestamp,
        errors: data.error_details?.length || 0,
        warnings: data.warning_details?.length || 0,
    });
    
    updateTimestamp(data.timestamp);
    updateStatusIndicators(data.cost_health, data.log_levels);
    updateLogLevels(data.log_levels);
    updateRecommendations(data.recommendations);
    updateCostBreakdown(data.cost_breakdown, data.cost_metadata);
    updateAIAnalysis(data.ai_insights);
    updateTopErrors(data.error_details);

    if (data.run_mode && elements.lastUpdated) {
        elements.lastUpdated.innerHTML += `<br><small>${data.run_mode}</small>`;
    }

    document.querySelectorAll('.loading').forEach(el => el.classList.remove('loading'));
}

function updateTimestamp(timestamp) {
    if (!timestamp) {
        elements.lastUpdated.textContent = 'Last updated: N/A';
        elements.dataFreshness.style.display = 'none';
        return;
    }
    
    const date = new Date(timestamp);
    elements.lastUpdated.textContent = `Last updated: ${date.toLocaleTimeString()}`;

    const ageMinutes = (Date.now() - date) / 60000;
    const freshnessBadge = elements.dataFreshness;
    
    if (ageMinutes < 1) {
        freshnessBadge.textContent = 'Fresh';
        freshnessBadge.className = 'freshness-badge fresh';
    } else if (ageMinutes <= 5) {
        freshnessBadge.textContent = 'Stale';
        freshnessBadge.className = 'freshness-badge stale';
    } else {
        freshnessBadge.textContent = 'Old';
        freshnessBadge.className = 'freshness-badge old';
    }
    freshnessBadge.style.display = 'inline-block';
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
    if (criticals > 0) {
        logStatus = 'red';
    } else if (warnings > 0) {
        logStatus = 'yellow';
    }
    indicators += `<div class="status-item"><span class="status-dot ${logStatus}"></span>Logs</div>`;

    elements.statusIndicators.innerHTML = indicators;
}

function updateLogLevels(levels) {
    const criticalCount = levels?.critical || 0;
    const errorCount = levels?.error || 0;
    const warningCount = levels?.warning || 0;
    const infoCount = levels?.info || 0;
    
    const setupLogLevel = (element, count, handler) => {
        element.textContent = count;
        if (count > 0) {
            element.style.cursor = 'pointer';
            element.onclick = handler;
        } else {
            element.style.cursor = 'default';
            element.onclick = null;
        }
    };

    setupLogLevel(elements.criticalCount, criticalCount, () => showErrorDetails('critical'));
    setupLogLevel(elements.errorCount, errorCount, () => showErrorDetails('error'));
    setupLogLevel(elements.warningCount, warningCount, () => showWarningDetails('warning'));
    setupLogLevel(elements.infoCount, infoCount, () => showInfoDetails(infoCount));
}

function showErrorDetails(filter) {
    if (!DashboardStore.data?.error_details) {
        showModal('Error Details', `<p>No error details available.</p>`);
        return;
    }
    
    let errors = DashboardStore.data.error_details;
    let title = 'Error Details';

    if (filter === 'critical') {
        errors = errors.filter(e => e.severity === 'critical');
        title = 'Critical Error Details';
    } else if (filter === 'error') {
        errors = errors.filter(e => e.severity !== 'critical');
        title = 'Non-Critical Error Details';
    } else if (filter) {
        errors = errors.filter(e => e.type === filter);
        title = `${filter} Details`;
    }
    
    const html = errors.map(e => {
        let aiAnalysisHtml = '';
        if (e.ai_analysis) {
            aiAnalysisHtml = `
                <div class="ai-analysis">
                    <h4>⚙️ Heuristic Root Cause Analysis</h4>
                    <p><strong>Root Cause:</strong> ${e.ai_analysis.root_cause}</p>
                    <p><strong>Related:</strong> ${e.ai_analysis.related_errors.join(', ')}</p>
                    <p><strong>Fix Time:</strong> ${e.ai_analysis.estimated_fix_time}</p>
                    <div class="cli-command">
                        <code>${e.ai_analysis.fix_command}</code>
                    </div>
                </div>
            `;
        }

        return `
            <div class="error-item">
                <div class="error-item-header">
                    <div>
                        <span class="error-id">🔴 ${e.id}</span>
                        <span class="error-type">${e.type}</span>
                    </div>
                    <span class="severity-badge severity-${e.severity}">${e.severity}</span>
                </div>
                <div class="error-message">${e.message}</div>
                ${e.recommendation ? `<div class="error-recommendation">💡 ${e.recommendation}</div>` : ''}
                ${e.timestamp ? `<div class="error-timestamp">⏰ ${e.timestamp}</div>` : ''}
                ${aiAnalysisHtml}
            </div>
        `;
    }).join('');
    
    showModal(`${title} (${errors.length} total)`, html);
}

function showWarningDetails(severity) {
    if (!DashboardStore.data?.warning_details) {
        showModal('Warning Details', `<p>No warning details available.</p>`);
        return;
    }
    
    const warnings = DashboardStore.data.warning_details.filter(w => w.severity === severity);
    
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
    
    showModal(`Warning Details (${warnings.length} total)`, html);
}

function showInfoDetails(count) {
    if (!DashboardStore.data?.info_details) {
        showModal('Info Logs', `<p>${count} informational logs.</p>`);
        return;
    }
    
    const infos = DashboardStore.data.info_details;
    
    const html = infos.map(i => `
        <div class="info-item">
            <div class="info-item-header">
                <strong class="info-item-id">${i.id}</strong>
                <span class="info-item-timestamp">⏰ ${i.timestamp}</span>
            </div>
            <div>${i.message}</div>
        </div>
    `).join('');
    
    showModal(`Info Logs (${infos.length} total)`, html);
}

function updateTopErrors(errorDetails) {
    const topErrorsEl = document.getElementById('top-errors-list');
    
    if (!topErrorsEl) {
        console.warn('top-errors-list element not found');
        return;
    }
    
    if (!errorDetails || errorDetails.length === 0) {
        topErrorsEl.innerHTML = '<p style="text-align: center; color: var(--success-color); padding: 2rem;">✅ No errors</p>';
        return;
    }
    
    const errorGroups = {};
    errorDetails.forEach(e => {
        if (!errorGroups[e.type]) {
            errorGroups[e.type] = { count: 0, first: e };
        }
        errorGroups[e.type].count++;
    });
    
    const sorted = Object.entries(errorGroups)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5);
    
    const html = sorted.map(([type, data]) => `
        <div class="error-summary-item" onclick="showErrorDetails('${type}')">
            <strong>${type}</strong> <span style="color: var(--error-color);">(${data.count}x)</span>
            <br><small style="color: var(--text-tertiary);">${data.first.message.substring(0, 60)}...</small>
        </div>
    `).join('');
    
    topErrorsEl.innerHTML = html;
}

function updateAIAnalysis(insights) {
    const aiEl = document.getElementById('ai-analysis-content');
    if (!aiEl) return;
    
    if (!insights || insights.length === 0) {
        aiEl.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div style="font-size: 2rem;">✅</div>
                <h4 style="margin-top: 0.5rem; color: var(--success-color);">No Anomalies Detected</h4>
                <p style="color: var(--text-tertiary); font-size: 0.9rem;">Automated analysis found no unusual patterns.</p>
            </div>
        `;
        return;
    }
    
    const html = insights.map(insight => `
        <div class="insight-card">
            <div class="insight-card-header">
                <strong class="insight-card-title">${insight.title}</strong>
                <span class="insight-card-confidence">
                    ${(insight.confidence * 100).toFixed(0)}% confidence
                </span>
            </div>
            <div class="insight-card-finding">${insight.finding}</div>
            <div class="insight-card-action">
                <strong>→ Action:</strong> ${insight.action}
            </div>
        </div>
    `).join('');
    
    aiEl.innerHTML = html;
}

function updateRecommendations(newRecommendations) {
    if (!elements.recommendationDisplay) return;
    
    if (!newRecommendations || newRecommendations.length === 0) {
        elements.recommendationDisplay.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div style="font-size: 2rem;">👍</div>
                <h4 style="margin-top: 0.5rem; color: var(--success-color);">All Systems Optimal</h4>
                <p style="color: var(--text-tertiary); font-size: 0.9rem;">No actionable recommendations at this time.</p>
            </div>
        `;
        return;
    }
    
    const html = newRecommendations.map((rec, i) => 
        `<div class="recommendation-item">
            <strong>${i + 1}.</strong> ${rec}
        </div>`
    ).join('');
    
    elements.recommendationDisplay.innerHTML = html + `
        <p class="disclaimer">
            <strong>Disclaimer:</strong> Commands shown for guidance, not auto-execution.
        </p>
    `;
    elements.recommendationDisplay.style.textAlign = 'left';
    elements.recommendationDisplay.style.overflowY = 'auto';
    elements.recommendationDisplay.style.maxHeight = '100%';
}

function updateCostBreakdown(costBreakdown, costMetadata) {
    if (elements.costBreakdownSubtitle && costMetadata) {
        elements.costBreakdownSubtitle.textContent = 
            `Billing Period: ${costMetadata.billing_period} | Account: ${costMetadata.account} (${costMetadata.region})`;
    }

    if (!costBreakdown || costBreakdown.length === 0) return;
    
    const canvas = document.getElementById('costBreakdownChart');
    if (!canvas) return;
    
    if (costBreakdownChart) {
        costBreakdownChart.destroy();
    }
    
    const labels = costBreakdown.map(item => item.service);
    const data = costBreakdown.map(item => item.cost);
    const colors = [
        '#bd93f9', '#ff79c6', '#8be9fd', '#50fa7b', 
        '#ffb86c', '#ff5555', '#f1fa8c'
    ];
    
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

    const autoRefreshEnabled = localStorage.getItem('autoRefresh') !== 'false';
    elements.autoRefreshToggle.checked = autoRefreshEnabled;
    if (autoRefreshEnabled) {
        startAutoRefresh();
    }

    elements.autoRefreshToggle.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        localStorage.setItem('autoRefresh', isChecked);
        isChecked ? startAutoRefresh() : stopAutoRefresh();
    });

    fetchDashboardData();
}

function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(fetchDashboardData, REFRESH_INTERVAL_MS);
}

function stopAutoRefresh() {
    clearInterval(autoRefreshInterval);
}

function showModal(title, bodyHTML) {
    const modal = document.getElementById('error-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    if (!modal || !modalTitle || !modalBody) return;
    
    modalTitle.textContent = title;
    modalBody.innerHTML = bodyHTML;
    modal.style.display = 'flex';
    
    document.getElementById('modal-close').onclick = closeModal;
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
    
    document.addEventListener('keydown', handleModalEscape);
}

function closeModal() {
    const modal = document.getElementById('error-modal');
    if (modal) modal.style.display = 'none';
    document.removeEventListener('keydown', handleModalEscape);
}

function handleModalEscape(e) {
    if (e.key === 'Escape') closeModal();
}

document.addEventListener('DOMContentLoaded', initialize);