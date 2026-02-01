// Job Queue Management JavaScript

// State
let currentPage = 1;
let currentTab = 'jobs';
let selectedJobs = new Set();
let autoRefreshInterval = null;
let pipelineStats = {};

// Initialize page
function initJobsPage() {
  loadStats();
  loadJobs();
  loadDLQ();
}

// Load queue statistics
async function loadStats() {
  try {
    const stats = await api('/api/jobs/stats');

    // Update stat cards
    document.getElementById('statTotal').textContent = stats.total || 0;
    document.getElementById('statPending').textContent = stats.byStatus?.pending || 0;
    document.getElementById('statRunning').textContent = stats.byStatus?.running || 0;
    document.getElementById('statCompleted').textContent = stats.byStatus?.completed || 0;
    document.getElementById('statFailed').textContent = stats.byStatus?.failed || 0;

    // Store for pipeline
    pipelineStats = stats.byType || {};
    updatePipeline();
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

// Update pipeline visualization
function updatePipeline() {
  const types = ['discover', 'capture', 'generate', 'deploy', 'email'];
  const maxCount = Math.max(...types.map(t => pipelineStats[t] || 0), 1);
  const bottleneckThreshold = maxCount * 0.7;

  types.forEach(type => {
    const count = pipelineStats[type] || 0;
    const el = document.getElementById(`pipeline${type.charAt(0).toUpperCase() + type.slice(1)}`);
    if (el) {
      el.textContent = count;
    }

    // Highlight bottlenecks
    const box = document.querySelector(`.pipeline-stage-box[data-type="${type}"]`);
    if (box) {
      box.classList.toggle('bottleneck', count >= bottleneckThreshold && count > 5);
    }
  });
}

// Load jobs list
async function loadJobs(page = 1) {
  currentPage = page;
  const status = document.getElementById('filterStatus').value;
  const type = document.getElementById('filterType').value;

  const params = new URLSearchParams({ page, limit: 50 });
  if (status) params.set('status', status);
  if (type) params.set('type', type);

  try {
    const data = await api(`/api/jobs?${params}`);
    renderJobsList(data.jobs, data.pagination);
  } catch (error) {
    document.getElementById('jobsList').innerHTML =
      `<p class="error">Failed to load jobs: ${escapeHtml(error.message)}</p>`;
  }
}

// Render jobs list
function renderJobsList(jobs, pagination) {
  const container = document.getElementById('jobsList');

  if (jobs.length === 0) {
    container.innerHTML = '<p class="empty" style="padding: 24px; text-align: center;">No jobs found</p>';
    return;
  }

  container.innerHTML = jobs.map(job => `
    <div class="job-row ${selectedJobs.has(job.id) ? 'selected' : ''}" data-job-id="${escapeHtml(job.id)}">
      <div>
        <input type="checkbox"
               ${selectedJobs.has(job.id) ? 'checked' : ''}
               onchange="toggleJobSelection('${escapeHtml(job.id)}')"
               ${['completed', 'failed', 'cancelled'].includes(job.status) ? '' : ''}>
      </div>
      <div>
        <div class="job-id">${escapeHtml(job.id.slice(0, 8))}...</div>
        <div class="job-data-preview">${getJobPreview(job)}</div>
      </div>
      <div><span class="badge badge-${escapeHtml(job.type)}">${escapeHtml(job.type)}</span></div>
      <div><span class="badge badge-${escapeHtml(job.status)}">${escapeHtml(job.status)}</span></div>
      <div>${formatTime(job.createdAt)}</div>
      <div class="job-duration">${getJobDuration(job)}</div>
      <div>
        <button class="btn btn-sm" onclick="viewJobDetails('${escapeHtml(job.id)}')">View</button>
        ${getJobActions(job)}
      </div>
    </div>
  `).join('');

  // Render pagination
  renderPagination(pagination);
}

// Get job preview from data
function getJobPreview(job) {
  if (!job.data) return '-';

  // Show relevant preview based on job type
  if (job.data.business_name) return escapeHtml(job.data.business_name);
  if (job.data.lead_id) return `Lead: ${escapeHtml(job.data.lead_id.slice(0, 8))}...`;
  if (job.data.email) return escapeHtml(job.data.email);
  if (job.data.query) return escapeHtml(job.data.query);

  return JSON.stringify(job.data).slice(0, 50) + '...';
}

// Calculate job duration
function getJobDuration(job) {
  if (!job.startedAt) return '-';

  const start = new Date(job.startedAt);
  const end = job.completedAt ? new Date(job.completedAt) : new Date();
  const diff = end - start;

  if (diff < 1000) return `${diff}ms`;
  if (diff < 60000) return `${(diff / 1000).toFixed(1)}s`;
  return `${(diff / 60000).toFixed(1)}m`;
}

// Get action buttons for job
function getJobActions(job) {
  const actions = [];

  if (job.status === 'failed' || job.status === 'cancelled') {
    actions.push(`<button class="btn btn-sm btn-primary" onclick="retryJob('${escapeHtml(job.id)}')">Retry</button>`);
  }

  if (job.status === 'pending' || job.status === 'scheduled' || job.status === 'running') {
    actions.push(`<button class="btn btn-sm btn-danger" onclick="cancelJob('${escapeHtml(job.id)}')">Cancel</button>`);
  }

  return actions.join(' ');
}

// Render pagination
function renderPagination(pagination) {
  const container = document.getElementById('pagination');
  if (!pagination || pagination.totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '<div class="pagination-controls">';

  if (pagination.page > 1) {
    html += `<button class="btn btn-sm" onclick="loadJobs(${pagination.page - 1})">Previous</button>`;
  }

  html += `<span class="pagination-info">Page ${pagination.page} of ${pagination.totalPages}</span>`;

  if (pagination.page < pagination.totalPages) {
    html += `<button class="btn btn-sm" onclick="loadJobs(${pagination.page + 1})">Next</button>`;
  }

  html += '</div>';
  container.innerHTML = html;
}

// Job selection
function toggleJobSelection(jobId) {
  if (selectedJobs.has(jobId)) {
    selectedJobs.delete(jobId);
  } else {
    selectedJobs.add(jobId);
  }
  updateBulkActionBar();
  updateJobRowSelection(jobId);
}

function toggleSelectAll() {
  const selectAll = document.getElementById('selectAll');
  const jobRows = document.querySelectorAll('.job-row[data-job-id]');

  if (selectAll.checked) {
    jobRows.forEach(row => {
      const jobId = row.dataset.jobId;
      selectedJobs.add(jobId);
      row.classList.add('selected');
      const checkbox = row.querySelector('input[type="checkbox"]');
      if (checkbox) checkbox.checked = true;
    });
  } else {
    selectedJobs.clear();
    jobRows.forEach(row => {
      row.classList.remove('selected');
      const checkbox = row.querySelector('input[type="checkbox"]');
      if (checkbox) checkbox.checked = false;
    });
  }

  updateBulkActionBar();
}

function updateJobRowSelection(jobId) {
  const row = document.querySelector(`.job-row[data-job-id="${jobId}"]`);
  if (row) {
    row.classList.toggle('selected', selectedJobs.has(jobId));
  }
}

function updateBulkActionBar() {
  const bar = document.getElementById('bulkActionBar');
  const count = selectedJobs.size;

  document.getElementById('selectedCount').textContent = count;
  bar.classList.toggle('visible', count > 0);
}

function clearSelection() {
  selectedJobs.clear();
  document.querySelectorAll('.job-row').forEach(row => {
    row.classList.remove('selected');
    const checkbox = row.querySelector('input[type="checkbox"]');
    if (checkbox) checkbox.checked = false;
  });
  document.getElementById('selectAll').checked = false;
  updateBulkActionBar();
}

// Bulk actions
async function bulkAction(action) {
  if (selectedJobs.size === 0) return;

  const confirmed = await confirmAction(
    `Are you sure you want to ${action} ${selectedJobs.size} job(s)?`
  );

  if (!confirmed) return;

  try {
    const result = await api('/api/jobs/bulk', {
      method: 'POST',
      body: JSON.stringify({
        job_ids: Array.from(selectedJobs),
        action: action
      })
    });

    showToast(`${result.success} jobs ${action === 'cancel' ? 'cancelled' : 'queued for retry'}`);

    if (result.errors.length > 0) {
      console.warn('Bulk action errors:', result.errors);
    }

    clearSelection();
    loadStats();
    loadJobs(currentPage);
  } catch (error) {
    showToast(`Bulk ${action} failed: ${error.message}`, 'error');
  }
}

// Individual job actions
async function retryJob(jobId) {
  try {
    await api(`/api/jobs/${jobId}/retry`, { method: 'POST' });
    showToast('Job queued for retry');
    loadStats();
    loadJobs(currentPage);
  } catch (error) {
    showToast(`Retry failed: ${error.message}`, 'error');
  }
}

async function cancelJob(jobId) {
  const confirmed = await confirmAction('Are you sure you want to cancel this job?');
  if (!confirmed) return;

  try {
    await api(`/api/jobs/${jobId}/cancel`, { method: 'POST' });
    showToast('Job cancelled');
    loadStats();
    loadJobs(currentPage);
  } catch (error) {
    showToast(`Cancel failed: ${error.message}`, 'error');
  }
}

// View job details
async function viewJobDetails(jobId) {
  showModal('jobDetailModal');
  const content = document.getElementById('jobDetailContent');
  content.innerHTML = '<p class="loading">Loading...</p>';

  try {
    const data = await api(`/api/jobs/${jobId}`);
    renderJobDetails(data.job, data.logs);
  } catch (error) {
    content.innerHTML = `<p class="error">Failed to load job: ${escapeHtml(error.message)}</p>`;
  }
}

function renderJobDetails(job, logs) {
  const content = document.getElementById('jobDetailContent');

  content.innerHTML = `
    <div class="job-detail-section">
      <div style="display: flex; gap: 16px; margin-bottom: 16px;">
        <span class="badge badge-${escapeHtml(job.type)}">${escapeHtml(job.type)}</span>
        <span class="badge badge-${escapeHtml(job.status)}">${escapeHtml(job.status)}</span>
      </div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
        <div>
          <strong>Job ID:</strong><br>
          <code style="font-size: 12px;">${escapeHtml(job.id)}</code>
        </div>
        <div>
          <strong>Priority:</strong><br>
          ${job.priority}
        </div>
        <div>
          <strong>Created:</strong><br>
          ${formatDate(job.createdAt)} ${new Date(job.createdAt).toLocaleTimeString()}
        </div>
        <div>
          <strong>Retries:</strong><br>
          ${job.retries} / ${job.maxRetries}
        </div>
        ${job.startedAt ? `
        <div>
          <strong>Started:</strong><br>
          ${formatDate(job.startedAt)} ${new Date(job.startedAt).toLocaleTimeString()}
        </div>
        ` : ''}
        ${job.completedAt ? `
        <div>
          <strong>Completed:</strong><br>
          ${formatDate(job.completedAt)} ${new Date(job.completedAt).toLocaleTimeString()}
        </div>
        ` : ''}
      </div>

      ${job.error ? `
      <div style="margin-bottom: 24px;">
        <strong>Error:</strong>
        <div class="dlq-error">${escapeHtml(job.error)}</div>
      </div>
      ` : ''}
    </div>

    <div class="job-detail-section">
      <h4>Payload</h4>
      <div class="job-payload" id="jobPayload">${formatJson(job.data)}</div>
    </div>

    ${job.result ? `
    <div class="job-detail-section">
      <h4>Result</h4>
      <div class="job-payload">${formatJson(job.result)}</div>
    </div>
    ` : ''}

    ${logs && logs.length > 0 ? `
    <div class="job-detail-section">
      <h4>Logs</h4>
      <div class="job-logs">
        ${logs.map(log => `
          <div class="log-entry ${escapeHtml(log.level)}">
            <span class="log-time">${new Date(log.created_at).toLocaleTimeString()}</span>
            <span class="log-message">${escapeHtml(log.message)}</span>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <div style="margin-top: 24px; display: flex; gap: 12px;">
      ${job.status === 'failed' || job.status === 'cancelled' ?
        `<button class="btn btn-primary" onclick="retryJob('${escapeHtml(job.id)}'); hideModal('jobDetailModal');">Retry Job</button>` : ''}
      ${['pending', 'scheduled', 'running'].includes(job.status) ?
        `<button class="btn btn-danger" onclick="cancelJob('${escapeHtml(job.id)}'); hideModal('jobDetailModal');">Cancel Job</button>` : ''}
      <button class="btn" onclick="copyToClipboard(JSON.stringify(${escapeHtml(JSON.stringify(job.data))}))">Copy Payload</button>
    </div>
  `;
}

// Format JSON for display with syntax highlighting
function formatJson(obj) {
  if (!obj) return '-';

  try {
    const json = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
    return escapeHtml(json)
      .replace(/"([^"]+)":/g, '<span style="color: #92400e;">"$1":</span>')
      .replace(/: "([^"]+)"/g, ': <span style="color: #065f46;">"$1"</span>')
      .replace(/: (\d+)/g, ': <span style="color: #1e40af;">$1</span>')
      .replace(/: (true|false|null)/g, ': <span style="color: #5b21b6;">$1</span>');
  } catch (e) {
    return escapeHtml(String(obj));
  }
}

// Filter by pipeline type
function filterByType(type) {
  // Update filter dropdown
  document.getElementById('filterType').value = type;

  // Update active state on pipeline
  document.querySelectorAll('.pipeline-stage-box').forEach(box => {
    box.classList.toggle('active', box.dataset.type === type);
  });

  // Load filtered jobs
  loadJobs(1);
}

// Tab switching
function switchTab(tab) {
  currentTab = tab;

  // Update tab buttons
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });

  // Update tab content
  document.getElementById('jobsTab').classList.toggle('active', tab === 'jobs');
  document.getElementById('dlqTab').classList.toggle('active', tab === 'dlq');

  if (tab === 'dlq') {
    loadDLQ();
  }
}

// Auto-refresh
function toggleAutoRefresh() {
  const checkbox = document.getElementById('autoRefresh');

  if (checkbox.checked) {
    autoRefreshInterval = setInterval(() => {
      loadStats();
      if (currentTab === 'jobs') {
        loadJobs(currentPage);
      } else {
        loadDLQ();
      }
    }, 5000);
  } else {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
      autoRefreshInterval = null;
    }
  }
}

// Clear finished jobs
async function clearJobs() {
  const confirmed = await confirmAction(
    'Are you sure you want to clear all completed, failed, and cancelled jobs?'
  );

  if (!confirmed) return;

  try {
    const result = await api('/api/jobs/clear', { method: 'DELETE' });
    showToast(`Cleared ${result.cleared} jobs`);
    loadStats();
    loadJobs(1);
  } catch (error) {
    showToast(`Clear failed: ${error.message}`, 'error');
  }
}

// Dead Letter Queue
async function loadDLQ() {
  const showResolved = document.getElementById('showResolvedDLQ').checked;
  const params = new URLSearchParams({ resolved: showResolved });

  try {
    const data = await api(`/api/jobs/dlq?${params}`);
    renderDLQList(data.items);
  } catch (error) {
    document.getElementById('dlqList').innerHTML =
      `<p class="error">Failed to load DLQ: ${escapeHtml(error.message)}</p>`;
  }
}

function renderDLQList(items) {
  const container = document.getElementById('dlqList');

  if (items.length === 0) {
    container.innerHTML = '<p class="empty" style="text-align: center; padding: 24px;">No items in dead letter queue</p>';
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="dlq-item ${item.resolved_at ? 'resolved' : ''}">
      <div class="dlq-header">
        <div>
          <span class="badge badge-${escapeHtml(item.job_type)}">${escapeHtml(item.job_type)}</span>
          <span style="margin-left: 8px; font-weight: 500;">
            ${item.original_job_id ? escapeHtml(item.original_job_id.slice(0, 8)) + '...' : 'Unknown'}
          </span>
        </div>
        <div>
          ${item.resolved_at ?
            `<span class="badge badge-completed">Resolved</span>` :
            `<button class="btn btn-sm btn-primary" onclick="retryDLQ('${escapeHtml(item.id)}')">Retry</button>
             <button class="btn btn-sm" onclick="resolveDLQ('${escapeHtml(item.id)}')">Resolve</button>`
          }
        </div>
      </div>
      <div class="dlq-error">${escapeHtml(item.error || 'Unknown error')}</div>
      <div class="dlq-meta">
        <span>Attempts: ${item.attempts}</span>
        <span>Failed: ${formatTime(item.failed_at)}</span>
        ${item.resolved_at ? `<span>Resolved: ${formatTime(item.resolved_at)}</span>` : ''}
      </div>
      ${item.resolution_notes ? `<p style="margin-top: 8px; font-size: 13px; color: var(--text-secondary);">Notes: ${escapeHtml(item.resolution_notes)}</p>` : ''}
      <details style="margin-top: 12px;">
        <summary style="cursor: pointer; font-size: 13px; color: var(--text-muted);">View Payload</summary>
        <div class="job-payload" style="margin-top: 8px;">${formatJson(item.job_data)}</div>
      </details>
    </div>
  `).join('');
}

async function retryDLQ(dlqId) {
  try {
    const result = await api(`/api/jobs/dlq/${dlqId}/retry`, { method: 'POST' });
    showToast(`Job queued for retry (${result.newJobId.slice(0, 8)}...)`);
    loadDLQ();
    loadStats();
  } catch (error) {
    showToast(`Retry failed: ${error.message}`, 'error');
  }
}

async function resolveDLQ(dlqId) {
  const notes = prompt('Resolution notes (optional):');

  try {
    await api(`/api/jobs/dlq/${dlqId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    });
    showToast('DLQ item resolved');
    loadDLQ();
  } catch (error) {
    showToast(`Resolve failed: ${error.message}`, 'error');
  }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
});
