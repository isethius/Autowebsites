/**
 * Overnight Runs Dashboard JavaScript
 */

// State
let currentPeriod = 7;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Check auth
  const token = localStorage.getItem('authToken');
  if (!token) {
    window.location.href = '/';
    return;
  }

  // Load all data
  await Promise.all([
    loadQuotas(),
    loadStats(currentPeriod),
    loadConfig(),
    loadRuns(),
  ]);

  // Set up event listeners
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  // Period selector
  document.querySelectorAll('.period-button').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const days = parseInt(e.target.dataset.days, 10);

      // Update active state
      document.querySelectorAll('.period-button').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');

      currentPeriod = days;
      await loadStats(days);
      await loadRuns(days);
    });
  });

  // Trigger run button
  document.getElementById('triggerRunBtn').addEventListener('click', () => {
    document.getElementById('triggerModal').style.display = 'flex';
  });

  // Cancel trigger
  document.getElementById('cancelTrigger').addEventListener('click', () => {
    document.getElementById('triggerModal').style.display = 'none';
  });

  // Trigger form submit
  document.getElementById('triggerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await triggerRun();
  });

  // Close modal on outside click
  document.getElementById('triggerModal').addEventListener('click', (e) => {
    if (e.target.id === 'triggerModal') {
      e.target.style.display = 'none';
    }
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('authToken');
    window.location.href = '/';
  });
}

// Load quotas
async function loadQuotas() {
  try {
    const res = await fetch('/api/overnight/quotas', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    if (!res.ok) throw new Error('Failed to load quotas');

    const quotas = await res.json();

    // Update Gmail quota
    const gmailUsed = quotas.gmail_sent_today;
    const gmailLimit = quotas.gmail_daily_limit;
    const gmailPercent = (gmailUsed / gmailLimit) * 100;

    document.getElementById('gmailQuota').textContent = `${gmailUsed}/${gmailLimit}`;
    const progressFill = document.getElementById('gmailProgress');
    progressFill.style.width = `${Math.min(gmailPercent, 100)}%`;

    if (gmailPercent >= 90) {
      progressFill.className = 'progress-fill danger';
    } else if (gmailPercent >= 70) {
      progressFill.className = 'progress-fill warning';
    }

    // Update other quotas
    document.getElementById('leadsToday').textContent = quotas.leads_processed_today || 0;
    document.getElementById('deploysToday').textContent = quotas.vercel_deployed_today || 0;

  } catch (error) {
    console.error('Error loading quotas:', error);
  }
}

// Load stats
async function loadStats(days = 7) {
  try {
    const res = await fetch(`/api/overnight/stats?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    if (!res.ok) throw new Error('Failed to load stats');

    const stats = await res.json();

    document.getElementById('statTotalRuns').textContent = stats.runs.total;
    document.getElementById('statPeriod').textContent = `Last ${days} days`;

    document.getElementById('statLeadsDiscovered').textContent = stats.totals.leadsDiscovered;
    document.getElementById('statLeadsPerRun').textContent = `${stats.averages.leadsPerRun} per run`;

    document.getElementById('statEmailsSent').textContent = stats.totals.emailsSent;
    document.getElementById('statEmailsPerRun').textContent = `${stats.averages.emailsPerRun} per run`;

    document.getElementById('statSuccessRate').textContent = `${stats.runs.successRate}%`;

  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Load config
async function loadConfig() {
  try {
    const res = await fetch('/api/overnight/config', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    if (!res.ok) throw new Error('Failed to load config');

    const config = await res.json();

    document.getElementById('configIndustries').textContent = config.industries?.join(', ') || '-';
    document.getElementById('configLocations').textContent = config.locations?.join(', ') || '-';
    document.getElementById('configMaxLeads').textContent = config.maxLeads || '-';

    const runHours = config.runHours;
    if (runHours) {
      const startTime = runHours.start > 12 ? `${runHours.start - 12} PM` : `${runHours.start} AM`;
      const endTime = runHours.end > 12 ? `${runHours.end - 12} PM` : `${runHours.end} AM`;
      document.getElementById('configRunHours').textContent = `${startTime} - ${endTime}`;
    }

    // Pre-fill trigger form
    document.getElementById('triggerIndustries').value = config.industries?.join(', ') || '';
    document.getElementById('triggerLocations').value = config.locations?.join(', ') || '';
    document.getElementById('triggerMaxLeads').value = Math.min(config.maxLeads || 10, 10);

  } catch (error) {
    console.error('Error loading config:', error);
  }
}

// Load runs
async function loadRuns(days = 7) {
  try {
    const res = await fetch(`/api/overnight/runs?limit=20`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    if (!res.ok) throw new Error('Failed to load runs');

    const { runs } = await res.json();
    const tbody = document.getElementById('runsTableBody');

    if (!runs || runs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-state">
            <h3>No overnight runs yet</h3>
            <p>Click "Trigger Run Now" to start your first run</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = runs.map(run => {
      const stats = run.stats || {};
      const config = run.config || {};
      const startedAt = new Date(run.started_at);
      const completedAt = run.completed_at ? new Date(run.completed_at) : null;

      let duration = '-';
      if (completedAt) {
        const durationMs = completedAt - startedAt;
        const durationMin = Math.floor(durationMs / 60000);
        const durationSec = Math.floor((durationMs % 60000) / 1000);
        duration = durationMin > 0 ? `${durationMin}m ${durationSec}s` : `${durationSec}s`;
      } else if (run.status === 'running') {
        duration = 'Running...';
      }

      const industries = config.industries?.slice(0, 3).join(', ') || '-';
      const errorsCount = run.errors?.length || 0;

      return `
        <tr>
          <td>
            <a href="#" class="run-detail-link" data-run-id="${run.id}">
              ${startedAt.toLocaleDateString()} ${startedAt.toLocaleTimeString()}
            </a>
          </td>
          <td>
            <span class="status-badge ${run.status}">${run.status}</span>
          </td>
          <td>${duration}</td>
          <td>
            <div class="mini-stats">
              <span class="mini-stat">${stats.leads_discovered || 0} found</span>
              <span class="mini-stat">${stats.leads_qualified || 0} qualified</span>
            </div>
          </td>
          <td>
            <div class="mini-stats">
              <span class="mini-stat">${stats.emails_sent || 0} sent</span>
              <span class="mini-stat">${stats.emails_failed || 0} failed</span>
            </div>
          </td>
          <td>${industries}</td>
          <td>${errorsCount > 0 ? `<span style="color: #dc3545">${errorsCount}</span>` : '-'}</td>
        </tr>
      `;
    }).join('');

  } catch (error) {
    console.error('Error loading runs:', error);
    document.getElementById('runsTableBody').innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <h3>Error loading runs</h3>
          <p>${error.message}</p>
        </td>
      </tr>
    `;
  }
}

// Trigger a new run
async function triggerRun() {
  const btn = document.querySelector('#triggerForm button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Starting...';

  try {
    const industries = document.getElementById('triggerIndustries').value
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const locations = document.getElementById('triggerLocations').value
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const maxLeads = parseInt(document.getElementById('triggerMaxLeads').value, 10) || 10;
    const dryRun = document.getElementById('triggerDryRun').checked;

    const res = await fetch('/api/overnight/trigger', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        industries: industries.length > 0 ? industries : undefined,
        locations: locations.length > 0 ? locations : undefined,
        maxLeads,
        dryRun,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to trigger run');
    }

    const result = await res.json();
    alert('Overnight run started! Check back in a few minutes for results.');

    document.getElementById('triggerModal').style.display = 'none';

    // Refresh data after a short delay
    setTimeout(() => {
      loadRuns();
      loadQuotas();
    }, 2000);

  } catch (error) {
    alert(`Error: ${error.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Start Run';
  }
}

// Auto-refresh running status
setInterval(async () => {
  const hasRunningRun = document.querySelector('.status-badge.running');
  if (hasRunningRun) {
    await loadRuns();
    await loadQuotas();
  }
}, 30000); // Refresh every 30 seconds if there's a running job
