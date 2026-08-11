/* ============================================================
   ANTI-GRAVITY CARGO NETWORK — Safety View
   Safety events, risk scores, compliance
   ============================================================ */

import { timeAgo, formatDate } from '../data.js';
import { state } from '../store.js';
import { renderBarChart, renderDonut } from '../charts.js';
import { showToast, statusChip, riskBar } from '../components.js';

export function renderSafety(container) {
  const { safetyEvents, vehicles } = state;
  let filterSeverity = 'all';
  let filterResolved = 'all';
  let searchQuery = '';

  const criticalEvents = safetyEvents.filter(e => e.severity === 'high' && !e.resolved).length;
  const unresolvedEvents = safetyEvents.filter(e => !e.resolved).length;
  const highRiskVehicles = vehicles.filter(v => v.riskScore >= 7).length;
  const avgRiskScore = (vehicles.reduce((s, v) => s + v.riskScore, 0) / vehicles.length).toFixed(1);

  container.innerHTML = `
    <div class="page stagger">
      <div class="page-header">
        <div>
          <h1 class="page-title">Safety & Compliance</h1>
          <p class="page-subtitle">${safetyEvents.length} events logged · ${unresolvedEvents} unresolved · ${criticalEvents} critical</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" id="exportSafetyBtn">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4 6l3 3 3-3M2 10v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Export Report
          </button>
        </div>
      </div>

      <!-- Risk KPIs -->
      <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
        <div class="kpi-card" style="--kpi-color:#ef4444;--kpi-bg:rgba(239,68,68,0.12)">
          <div class="kpi-label">Critical Events</div>
          <div class="kpi-value">${criticalEvents}</div>
          <div style="font-size:11px;color:${criticalEvents > 0 ? 'var(--danger)' : 'var(--text-3)'}">Requires immediate attention</div>
        </div>
        <div class="kpi-card" style="--kpi-color:#f59e0b;--kpi-bg:rgba(245,158,11,0.12)">
          <div class="kpi-label">Unresolved Events</div>
          <div class="kpi-value">${unresolvedEvents}</div>
          <div style="font-size:11px;color:var(--text-3)">${safetyEvents.filter(e => e.resolved).length} resolved this period</div>
        </div>
        <div class="kpi-card" style="--kpi-color:#8b5cf6;--kpi-bg:rgba(139,92,246,0.12)">
          <div class="kpi-label">High Risk Vehicles</div>
          <div class="kpi-value">${highRiskVehicles}</div>
          <div style="font-size:11px;color:var(--text-3)">Risk score ≥ 7/10</div>
        </div>
        <div class="kpi-card" style="--kpi-color:#3b82f6;--kpi-bg:rgba(59,130,246,0.12)">
          <div class="kpi-label">Fleet Avg. Risk</div>
          <div class="kpi-value">${avgRiskScore}<span class="kpi-unit">/10</span></div>
          <div style="font-size:11px;color:var(--text-3)">Lower is safer</div>
        </div>
      </div>

      <!-- Critical Alerts Banner -->
      ${criticalEvents > 0 ? `
        <div class="alert alert-danger" style="margin-bottom:16px;animation:alert-pulse 2s ease infinite">
          <div class="alert-icon">🚨</div>
          <div class="alert-body">
            <div class="alert-title">${criticalEvents} Critical Safety Event${criticalEvents > 1 ? 's' : ''} Require Immediate Attention</div>
            <div class="alert-msg">High-severity events below are unresolved. Please review and take action.</div>
          </div>
          <button class="btn btn-sm" style="background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.4);color:var(--danger);flex-shrink:0" onclick="document.getElementById('sevFilterHigh')?.click()">View Critical</button>
        </div>
      ` : ''}

      <!-- Main Content -->
      <div class="dashboard-grid" style="gap:16px">

        <!-- Events Table -->
        <div style="display:flex;flex-direction:column;gap:14px">
          <!-- Filter Bar -->
          <div class="filter-bar">
            <div class="filter-input-wrap" style="max-width:260px">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" stroke-width="1.5"/><path d="M9 9l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              <input class="filter-input" id="safetySearch" placeholder="Search events, vehicles, drivers…" type="search" />
            </div>
            <div class="chip-select" id="severityFilter">
              <div class="chip active" data-sev="all">All</div>
              <div class="chip" data-sev="high" id="sevFilterHigh">Critical</div>
              <div class="chip" data-sev="medium">Warning</div>
              <div class="chip" data-sev="low">Low</div>
            </div>
            <div class="chip-select" id="resolvedFilter">
              <div class="chip active" data-res="all">All</div>
              <div class="chip" data-res="unresolved">Unresolved</div>
              <div class="chip" data-res="resolved">Resolved</div>
            </div>
          </div>

          <div class="card" id="eventsTable"></div>
        </div>

        <!-- Right Column -->
        <div style="display:flex;flex-direction:column;gap:16px">

          <!-- Event Type Breakdown -->
          <div class="card card-padded">
            <div class="card-title" style="margin-bottom:14px">Events by Type</div>
            <div id="eventTypeChart" style="height:130px;margin-bottom:12px"></div>
          </div>

          <!-- Vehicle Risk Leaderboard -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">Vehicle Risk Rankings</div>
              <div class="card-subtitle">Highest risk scores</div>
            </div>
            <div id="riskLeaderboard" style="padding:0">
              ${vehicles.sort((a, b) => b.riskScore - a.riskScore).slice(0, 8).map((v, i) => `
                <div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border);${i === 7 ? 'border-bottom:none' : ''}">
                  <div style="width:20px;font-size:11px;font-weight:700;color:var(--text-3);text-align:center">#${i + 1}</div>
                  <div style="flex:1;min-width:0">
                    <div style="font-size:12px;font-weight:700">${v.id} · ${v.name.split(' ')[0]}</div>
                    <div style="font-size:10px;color:var(--text-3)">${v.driver}</div>
                  </div>
                  <div style="display:flex;align-items:center;gap:6px">
                    ${riskBar(v.riskScore)}
                    <span style="font-size:11px;font-family:var(--font-mono);color:${v.riskScore >= 8 ? 'var(--danger)' : v.riskScore >= 6 ? 'var(--warning)' : 'var(--text-2)'}">
                      ${v.riskScore}/10
                    </span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Compliance Checklist -->
          <div class="card card-padded">
            <div class="card-title" style="margin-bottom:14px">Compliance Status</div>
            <div style="display:flex;flex-direction:column;gap:10px">
              ${[
                { label: 'Driver licenses up to date', done: true },
                { label: 'Vehicle inspections current', done: true },
                { label: 'Insurance certificates valid', done: true },
                { label: 'Hazmat certifications', done: false },
                { label: 'ELD mandate compliance', done: true },
                { label: 'Hours of service tracking', done: true },
                { label: 'FMCSA registration', done: true },
                { label: 'Cargo securing protocols', done: false },
              ].map(item => `
                <div style="display:flex;align-items:center;gap:10px;font-size:12px">
                  <div style="width:18px;height:18px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;
                    background:${item.done ? 'var(--success-dim)' : 'var(--warning-dim)'};
                    color:${item.done ? 'var(--success)' : 'var(--warning)'};font-size:10px;font-weight:700">
                    ${item.done ? '✓' : '!'}
                  </div>
                  <span style="color:${item.done ? 'var(--text-1)' : 'var(--warning)'}">
                    ${item.label}
                  </span>
                  ${!item.done ? '<span class="badge badge-yellow" style="margin-left:auto;font-size:9px">Action Required</span>' : ''}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  function render() {
    const el = document.getElementById('eventsTable');
    if (!el) return;
    const search = searchQuery.toLowerCase();
    const filtered = safetyEvents.filter(ev => {
      const matchSev = filterSeverity === 'all' || ev.severity === filterSeverity;
      const matchRes = filterResolved === 'all' || (filterResolved === 'resolved' ? ev.resolved : !ev.resolved);
      const matchSearch = !search || ev.vehicleId.toLowerCase().includes(search) || ev.driver.toLowerCase().includes(search) || ev.type.toLowerCase().includes(search);
      return matchSev && matchRes && matchSearch;
    });

    el.innerHTML = `
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Event Type</th>
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Location</th>
              <th>Time</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(ev => `
              <tr style="cursor:pointer" class="event-row" data-id="${ev.id}">
                <td>
                  <span class="badge ${ev.severity === 'high' ? 'badge-red' : ev.severity === 'medium' ? 'badge-yellow' : 'badge-gray'}">
                    ${ev.severity === 'high' ? 'Critical' : ev.severity === 'medium' ? 'Warning' : 'Low'}
                  </span>
                </td>
                <td>
                  <div style="font-weight:600;font-size:13px">${ev.type}</div>
                  <div style="font-size:10px;font-family:var(--font-mono);color:var(--text-3)">${ev.id}</div>
                </td>
                <td><span class="cell-mono">${ev.vehicleId}</span></td>
                <td style="font-size:13px">${ev.driver}</td>
                <td style="font-size:11px;color:var(--text-2);max-width:140px">
                  <div class="truncate">${ev.location}</div>
                </td>
                <td style="font-size:11px;color:var(--text-3);font-family:var(--font-mono)">${timeAgo(ev.timestamp)}</td>
                <td>
                  ${ev.resolved
                    ? '<span class="badge badge-green">Resolved</span>'
                    : '<span class="badge badge-red">Open</span>'}
                </td>
                <td>
                  ${!ev.resolved ? `<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();window.showToast('success','Event Resolved','${ev.id} has been resolved.')">Resolve</button>` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <span class="pagination-info">Showing ${filtered.length} of ${safetyEvents.length} events</span>
      </div>
    `;

    el.querySelectorAll('.event-row').forEach(row => {
      row.addEventListener('click', () => openEventDetail(row.dataset.id));
    });
  }

  function openEventDetail(eventId) {
    const ev = safetyEvents.find(e => e.id === eventId);
    if (!ev) return;
    import('../components.js').then(({ openModal }) => {
      openModal({
        title: ev.type,
        body: `
          <div style="display:flex;flex-direction:column;gap:14px">
            <div style="display:flex;gap:10px;align-items:center">
              <span class="badge ${ev.severity === 'high' ? 'badge-red' : ev.severity === 'medium' ? 'badge-yellow' : 'badge-gray'}" style="font-size:13px;padding:6px 12px">
                ${ev.severity === 'high' ? 'Critical' : ev.severity === 'medium' ? 'Warning' : 'Low'} Severity
              </span>
              ${ev.resolved ? '<span class="badge badge-green">Resolved</span>' : '<span class="badge badge-red">Unresolved</span>'}
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div class="form-group"><div class="form-label">Event ID</div><div style="font-family:var(--font-mono);font-size:12px">${ev.id}</div></div>
              <div class="form-group"><div class="form-label">Time</div><div style="font-weight:600">${timeAgo(ev.timestamp)}</div></div>
              <div class="form-group"><div class="form-label">Vehicle</div><div style="font-weight:600">${ev.vehicleName} (${ev.vehicleId})</div></div>
              <div class="form-group"><div class="form-label">Driver</div><div style="font-weight:600">${ev.driver}</div></div>
              <div class="form-group"><div class="form-label">Speed at Event</div><div style="font-weight:600;color:${ev.speed > 75 ? 'var(--danger)' : 'inherit'}">${ev.speed} mph</div></div>
              <div class="form-group"><div class="form-label">Location</div><div style="font-weight:500;font-size:12px">${ev.location}</div></div>
            </div>
            ${!ev.resolved ? `
              <div class="form-group">
                <label class="form-label">Resolution Notes</label>
                <textarea class="form-textarea" placeholder="Describe corrective actions taken…"></textarea>
              </div>
            ` : ''}
          </div>
        `,
        confirmLabel: ev.resolved ? 'Close' : 'Mark Resolved',
        confirmClass: ev.resolved ? 'btn-secondary' : 'btn-success',
        onConfirm: () => {
          if (!ev.resolved) {
            ev.resolved = true;
            showToast('success', 'Event Resolved', `${ev.id} has been marked as resolved.`);
            render();
          }
        },
      });
    });
  }

  // Render event type chart
  requestAnimationFrame(() => {
    const chartEl = document.getElementById('eventTypeChart');
    if (chartEl) {
      const typeCounts = {};
      safetyEvents.forEach(ev => {
        typeCounts[ev.type] = (typeCounts[ev.type] || 0) + 1;
      });
      const top = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
      renderBarChart(chartEl, top.map(([type, count]) => ({
        label: type.split(' ')[0],
        value: count,
      })), {
        width: chartEl.offsetWidth || 280,
        height: 130,
        barColor: top.map(([type]) => {
          const ev = safetyEvents.find(e => e.type === type);
          return ev?.severity === 'high' ? '#ef4444' : ev?.severity === 'medium' ? '#f59e0b' : '#3b82f6';
        }),
        labelKey: 'label', valueKey: 'value', showLabels: true,
      });
    }
  });

  // Filters
  document.getElementById('safetySearch')?.addEventListener('input', (e) => { searchQuery = e.target.value; render(); });
  document.getElementById('severityFilter')?.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#severityFilter .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filterSeverity = chip.dataset.sev;
      render();
    });
  });
  document.getElementById('resolvedFilter')?.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#resolvedFilter .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filterResolved = chip.dataset.res;
      render();
    });
  });

  document.getElementById('exportSafetyBtn')?.addEventListener('click', () => {
    showToast('success', 'Safety Report Exported', 'Compliance report ready for download.');
  });

  render();
}
