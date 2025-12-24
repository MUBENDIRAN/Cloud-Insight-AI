const S3_REPORT_URL = 'https://ci-ai-reports.s3.ap-south-1.amazonaws.com/final_report.json';
const REFRESH_INTERVAL_MS = 30000;

const elements = {
    loadingOverlay: document.getElementById('loading-overlay'),
    lastUpdated: document.getElementById('last-updated'),
    refreshBtn: document.getElementById('refresh-btn'),
    downloadReportBtn: document.getElementById('download-report-btn'),
    autoRefreshToggle: document.getElementById('auto-refresh'),
    statusIndicators: document.getElementById('status-indicators'),
    criticalCount: document.getElementById('critical-count'),
    errorCount: document.getElementById('error-count'),
    warningCount: document.getElementById('warning-count'),
    infoCount: document.getElementById('info-count'),
    recommendationDisplay: document.getElementById('recommendation-display'),
    errorMessage: document.getElementById('error-message'),
};

let autoRefreshInterval;
let costBreakdownChart = null;

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

function updateDashboard(data) {
    window.dashboardData = data;
    
    console.log('📊 Dashboard Updated:', {
        timestamp: data.timestamp,
        errors: data.error_details?.length || 0,
        warnings: data.warning_details?.length || 0,
    });
    
    updateTimestamp(data.timestamp);
    updateStatusIndicators(data.cost_health, data.log_levels);
    updateLogLevels(data.log_levels);
    updateRecommendations(data.recommendations);
    updateCostBreakdown(data.cost_breakdown);
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

function updateLogLevels(levels) {
    const criticalCount = levels?.critical || 0;
    const errorCount = levels?.error || 0;
    const warningCount = levels?.warning || 0;
    const infoCount = levels?.info || 0;
    
    elements.criticalCount.textContent = criticalCount;
    elements.errorCount.textContent = errorCount;
    elements.warningCount.textContent = warningCount;
    elements.infoCount.textContent = infoCount;
    
    if (criticalCount > 0) {
        elements.criticalCount.style.cursor = 'pointer';
        elements.criticalCount.onclick = () => showErrorDetails(criticalCount);
    }
    
    if (errorCount > 0) {
        elements.errorCount.style.cursor = 'pointer';
        elements.errorCount.onclick = () => showErrorDetails(errorCount);
    }
    
    if (warningCount > 0) {
        elements.warningCount.style.cursor = 'pointer';
        elements.warningCount.onclick = () => showWarningDetails(warningCount);
    }
    
    if (infoCount > 0) {
        elements.infoCount.style.cursor = 'pointer';
        elements.infoCount.onclick = () => showInfoDetails(infoCount);
    }
}

function showErrorDetails(count) {
    if (!window.dashboardData?.error_details) {
        showModal('Error Details', `<p>${count} errors detected.</p>`);
        return;
    }
    
    // ✅ FIX: Show ALL errors, not just 10
    const errors = window.dashboardData.error_details; // Remove .slice(0, 10)
    
    const html = errors.map(e => {
        let aiAnalysisHtml = '';
        if (e.ai_analysis) {
            aiAnalysisHtml = `
                <div class="ai-analysis">
                    <h4>🤖 AI Root Cause Analysis</h4>
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
                    <span class="error-id">🔴 ${e.id}</span>
                    <span class="error-type">${e.type}</span>
                </div>
                <div class="error-message">${e.message}</div>
                ${e.recommendation ? `<div class="error-recommendation">💡 ${e.recommendation}</div>` : ''}
                ${e.timestamp ? `<div class="error-timestamp">⏰ ${e.timestamp}</div>` : ''}
                ${aiAnalysisHtml}
            </div>
        `;
    }).join('');
    
    // ✅ FIX: Show correct count
    showModal(`Error Details (${errors.length} total)`, html);
}

function showWarningDetails(count) {
    if (!window.dashboardData?.warning_details) {
        showModal('Warning Details', `<p>${count} warnings detected.</p>`);
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
    if (!window.dashboardData?.info_details) {
        showModal('Info Logs', `<p>${count} informational logs.</p>`);
        return;
    }
    
    const infos = window.dashboardData.info_details;
    
    const html = infos.map(i => `
        <div style="background: var(--bg-secondary); border-left: 3px solid var(--success-color); padding: 0.75rem; margin-bottom: 0.5rem; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem;">
                <strong style="color: var(--success-color);">${i.id}</strong>
                <span style="font-size: 0.75rem; color: var(--text-tertiary);">⏰ ${i.timestamp}</span>
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
        <div style="padding: 0.75rem; background: var(--bg-secondary); border-left: 3px solid var(--error-color); margin-bottom: 0.5rem; border-radius: 4px; cursor: pointer;" onclick="showErrorDetails(${data.count})">
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
        aiEl.innerHTML = '<p style="text-align: center; padding: 2rem;">✅ No anomalies detected</p>';
        return;
    }
    
    const html = insights.map(insight => `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem; color: white;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <strong style="font-size: 1.1rem;">${insight.title}</strong>
                <span style="background: rgba(255,255,255,0.2); padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.8rem;">
                    ${(insight.confidence * 100).toFixed(0)}% confidence
                </span>
            </div>
            <div style="margin-bottom: 0.5rem; line-height: 1.5;">${insight.finding}</div>
            <div style="background: rgba(0,0,0,0.2); padding: 0.5rem; border-radius: 4px; font-size: 0.9rem;">
                <strong>→ Action:</strong> ${insight.action}
            </div>
        </div>
    `).join('');
    
    aiEl.innerHTML = html;
}

function updateRecommendations(newRecommendations) {
    if (!elements.recommendationDisplay) return;
    
    if (!newRecommendations || newRecommendations.length === 0) {
        elements.recommendationDisplay.innerHTML = '<p style="text-align: center; padding: 2rem;">✅ All systems optimal</p>';
        return;
    }
    
    const html = newRecommendations.map((rec, i) => 
        `<div style="text-align: left; padding: 0.5rem; border-left: 3px solid var(--primary-color); margin: 0.5rem 0; background: var(--bg-secondary); border-radius: 4px; font-size: 0.85rem;">
            <strong>${i + 1}.</strong> ${rec}
        </div>`
    ).join('');
    
    elements.recommendationDisplay.innerHTML = html;
    elements.recommendationDisplay.style.textAlign = 'left';
    elements.recommendationDisplay.style.overflowY = 'auto';
    elements.recommendationDisplay.style.maxHeight = '100%';
}

function updateCostBreakdown(costBreakdown) {
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
    elements.autoRefreshToggle.addEventListener('change', (e) => {
        e.target.checked ? startAutoRefresh() : stopAutoRefresh();
    });

    fetchDashboardData();
    startAutoRefresh();
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