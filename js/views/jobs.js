/* ============================================================
   ANTI-GRAVITY CARGO NETWORK — Jobs View
   Kanban board with job workflow management
   ============================================================ */

import { timeAgo, formatDate, formatCurrency } from '../data.js';
import { showToast, statusChip, priorityBadge, openModal } from '../components.js';
import { state, addJob, updateJobStatus } from '../store.js';

const COLUMNS = [
  { id: 'pending',   label: 'Pending',    color: '#f59e0b' },
  { id: 'assigned',  label: 'Assigned',   color: '#8b5cf6' },
  { id: 'transit',   label: 'In Transit', color: '#3b82f6' },
  { id: 'delivered', label: 'Delivered',  color: '#10b981' },
  { id: 'exception', label: 'Exception',  color: '#ef4444' },
];

export function renderJobs(container) {
  let viewMode = 'kanban';
  let filterStatus = 'all';
  let filterPriority = 'all';
  let searchQuery = '';

  container.innerHTML = `
    <div class="page stagger">
      <div class="page-header">
        <div>
          <h1 class="page-title">Job Board</h1>
          <p class="page-subtitle" id="jobs-subtitle"></p>
        </div>
        <div class="page-actions">
          <div class="tabs">
            <button class="tab-btn active" data-view="kanban" id="kanbanViewBtn">Kanban</button>
            <button class="tab-btn" data-view="list" id="listViewBtn">List</button>
          </div>
          <button class="btn btn-primary btn-sm" id="createJobBtn">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Create Job
          </button>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="kpi-grid" id="jobs-kpi-grid" style="grid-template-columns:repeat(5,1fr);margin-bottom:16px">
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <div class="filter-input-wrap" style="max-width:280px">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" stroke-width="1.5"/><path d="M9 9l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <input class="filter-input" id="jobSearch" placeholder="Search jobs, clients, routes…" type="search" />
        </div>
        <div class="chip-select" id="priorityFilter">
          <div class="chip active" data-priority="all">All Priority</div>
          <div class="chip" data-priority="critical">Critical</div>
          <div class="chip" data-priority="express">Express</div>
          <div class="chip" data-priority="standard">Standard</div>
        </div>
        <button class="btn btn-secondary btn-sm" id="bulkActionsBtn" style="margin-left:auto">
          Bulk Actions
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </div>

      <!-- Job Board Container -->
      <div id="jobBoardContainer"></div>
    </div>

    <!-- Job Detail Panel -->
    <div id="jobDetailPanel" class="drawer" role="dialog" aria-label="Job Details" aria-hidden="true" style="width:420px">
      <div class="drawer-header">
        <h2 class="drawer-title" id="jobDetailTitle">Job Details</h2>
        <button class="drawer-close" id="closeJobDetail" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="drawer-content" id="jobDetailContent"></div>
    </div>
    <div id="jobDetailBackdrop" class="drawer-backdrop" aria-hidden="true"></div>
  `;

  function getFilteredJobs() {
    return state.jobs.filter(j => {
      const matchPriority = filterPriority === 'all' || j.priority === filterPriority;
      const matchStatus = filterStatus === 'all' || j.status === filterStatus;
      const matchSearch = !searchQuery || 
        j.id.toLowerCase().includes(searchQuery) || 
        j.client.toLowerCase().includes(searchQuery) || 
        j.cargo.toLowerCase().includes(searchQuery) || 
        j.route.from.toLowerCase().includes(searchQuery);
      return matchPriority && matchStatus && matchSearch;
    });
  }

  function updateDOM() {
    const { jobs } = state;
    
    // Subtitle
    const totalJobs = jobs.length;
    const exceptionCount = jobs.filter(j => j.status === 'exception').length;
    const inTransit = jobs.filter(j => j.status === 'transit').length;
    const subtitle = document.getElementById('jobs-subtitle');
    if (subtitle) subtitle.textContent = `${totalJobs} total jobs · ${inTransit} in transit · ${exceptionCount} exceptions`;

    // KPIs
    const kpiGrid = document.getElementById('jobs-kpi-grid');
    if (kpiGrid) {
      kpiGrid.innerHTML = COLUMNS.map(col => {
        const count = jobs.filter(j => j.status === col.id).length;
        const isActive = filterStatus === col.id;
        return `
          <div class="kpi-card" style="--kpi-color:${col.color};--kpi-bg:${col.color}20;padding:12px 16px;cursor:pointer;border:${isActive ? `2px solid ${col.color}` : '1px solid var(--border)'}" data-filter="${col.id}">
            <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3)">${col.label}</div>
            <div style="font-size:28px;font-weight:800;color:var(--text-1);font-variant-numeric:tabular-nums">${count}</div>
          </div>
        `;
      }).join('');
      
      // Bind KPI filter clicks
      kpiGrid.querySelectorAll('.kpi-card').forEach(card => {
        card.addEventListener('click', () => {
          const f = card.dataset.filter;
          filterStatus = filterStatus === f ? 'all' : f;
          updateDOM();
        });
      });
    }

    // Board
    const boardEl = document.getElementById('jobBoardContainer');
    if (!boardEl) return;
    const filtered = getFilteredJobs();

    if (viewMode === 'kanban') {
      boardEl.innerHTML = `<div class="kanban-board" id="kanbanBoard">
        ${COLUMNS.map(col => {
          if (filterStatus !== 'all' && filterStatus !== col.id) return ''; // Hide other columns if filtered
          const colJobs = filtered.filter(j => j.status === col.id);
          return `
            <div class="kanban-column" style="${filterStatus !== 'all' ? 'flex:0.2' : ''}">
              <div class="kanban-col-header" style="border-top:3px solid ${col.color}">
                <span class="kanban-col-title" style="color:${col.color}">${col.label}</span>
                <span class="kanban-col-count">${colJobs.length}</span>
              </div>
              <div class="kanban-cards" id="col-${col.id}">
                ${colJobs.length === 0
                  ? `<div style="padding:20px;text-align:center;color:var(--text-3);font-size:12px">No jobs</div>`
                  : colJobs.map(j => renderJobCard(j)).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>`;
    } else {
      boardEl.innerHTML = `
        <div class="card">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="sortable">Job ID</th>
                  <th>Client</th>
                  <th>Route</th>
                  <th>Cargo</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>ETA</th>
                  <th>Value</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(j => `
                  <tr style="cursor:pointer" class="job-row" data-id="${j.id}">
                    <td><span class="cell-mono">${j.id}</span></td>
                    <td style="max-width:140px"><span class="truncate" style="display:block;font-size:13px">${j.client}</span></td>
                    <td>
                      <div style="font-size:12px">${j.route.from.split(',')[0]} → ${j.route.to.split(',')[0]}</div>
                    </td>
                    <td><span class="badge badge-gray">${j.cargo}</span></td>
                    <td>${priorityBadge(j.priority)}</td>
                    <td>${statusChip(j.status)}</td>
                    <td>
                      <div style="display:flex;align-items:center;gap:6px">
                        <div class="progress" style="width:70px">
                          <div class="progress-fill ${j.status === 'delivered' ? 'green' : j.status === 'exception' ? 'red' : 'blue'} progress-bar-fill" style="width:${j.progress}%"></div>
                        </div>
                        <span style="font-size:11px;font-family:var(--font-mono);color:var(--text-3)">${j.progress}%</span>
                      </div>
                    </td>
                    <td style="font-size:12px;color:var(--text-2)">${formatDate(j.eta)}</td>
                    <td style="font-family:var(--font-mono);font-size:12px">${formatCurrency(j.value)}</td>
                    <td><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation()">View</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="pagination">
            <span class="pagination-info">Showing ${filtered.length} of ${jobs.length} jobs</span>
          </div>
        </div>
      `;
      boardEl.querySelectorAll('.job-row').forEach(row => {
        row.addEventListener('click', () => openJobDetail(row.dataset.id));
      });
    }

    // Card click handlers
    boardEl.querySelectorAll('.job-card').forEach(card => {
      card.addEventListener('click', () => openJobDetail(card.dataset.id));
    });
  }

  function renderJobCard(j) {
    return `
      <div class="job-card" data-id="${j.id}" tabindex="0" role="button" aria-label="Job ${j.id}">
        <div class="job-card-id">${j.id}</div>
        <div class="job-card-route">${j.route.from.split(',')[0]} → ${j.route.to.split(',')[0]}</div>
        <div style="font-size:11px;color:var(--text-3);margin-bottom:8px">${j.client}</div>
        <div class="job-card-meta">
          <span class="job-card-weight">${(j.weight/1000).toFixed(1)}t · ${j.cargo}</span>
          ${priorityBadge(j.priority)}
        </div>
        ${j.progress > 0 && j.progress < 100 ? `
          <div class="progress progress-thin" style="margin-top:8px">
            <div class="progress-fill ${j.status === 'exception' ? 'red' : 'blue'} progress-bar-fill" style="width:${j.progress}%"></div>
          </div>
        ` : ''}
        ${j.exceptions && j.exceptions.length > 0 ? `<div style="font-size:10px;color:var(--danger);margin-top:6px;font-weight:600">⚠ ${j.exceptions[0]}</div>` : ''}
      </div>
    `;
  }

  function openJobDetail(jobId) {
    const j = state.jobs.find(j => j.id === jobId);
    if (!j) return;
    const v = j.vehicle ? state.vehicles.find(v => v.id === j.vehicle) : null;

    const panel = document.getElementById('jobDetailPanel');
    const content = document.getElementById('jobDetailContent');
    const title = document.getElementById('jobDetailTitle');
    const backdrop = document.getElementById('jobDetailBackdrop');

    title.textContent = j.id;
    content.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:20px">
        <!-- Status & Priority -->
        <div style="display:flex;gap:10px;align-items:center">
          ${statusChip(j.status)}
          ${priorityBadge(j.priority)}
          ${j.exceptions && j.exceptions.length > 0 ? `<span class="badge badge-red">Exception</span>` : ''}
        </div>

        <!-- Route -->
        <div>
          <div class="form-label" style="margin-bottom:8px">Route</div>
          <div style="background:var(--bg-surface-2);border:1px solid var(--border);border-radius:8px;padding:12px">
            <div style="display:flex;align-items:center;gap:8px">
              <div style="flex:1">
                <div style="font-size:11px;color:var(--text-3)">From</div>
                <div style="font-weight:700;font-size:14px">${j.route.from}</div>
              </div>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="color:var(--text-3)"><path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <div style="flex:1;text-align:right">
                <div style="font-size:11px;color:var(--text-3)">To</div>
                <div style="font-weight:700;font-size:14px">${j.route.to}</div>
              </div>
            </div>
            <div style="margin-top:8px;font-size:11px;color:var(--text-3);font-family:var(--font-mono)">${j.routeId} · ${j.route.dist} mi · ETA: ${j.route.eta}</div>
          </div>
        </div>

        <!-- Progress -->
        <div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <div class="form-label">Progress</div>
            <span style="font-size:12px;font-weight:700;font-family:var(--font-mono)">${j.progress}%</span>
          </div>
          <div class="progress progress-thick">
            <div class="progress-fill ${j.status === 'delivered' ? 'green' : j.status === 'exception' ? 'red' : 'blue'} progress-bar-fill" style="width:${j.progress}%"></div>
          </div>
        </div>

        <!-- Details Grid -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group"><div class="form-label">Client</div><div style="font-weight:600;font-size:13px">${j.client}</div></div>
          <div class="form-group"><div class="form-label">Cargo</div><div style="font-weight:600;font-size:13px">${j.cargo}</div></div>
          <div class="form-group"><div class="form-label">Weight</div><div style="font-weight:600;font-family:var(--font-mono)">${(j.weight/1000).toFixed(2)}t</div></div>
          <div class="form-group"><div class="form-label">Pieces</div><div style="font-weight:600;font-family:var(--font-mono)">${j.pieces}</div></div>
          <div class="form-group"><div class="form-label">Value</div><div style="font-weight:700;color:var(--success)">${formatCurrency(j.value)}</div></div>
          <div class="form-group"><div class="form-label">ETA</div><div style="font-weight:600;font-size:13px">${formatDate(j.eta)}</div></div>
        </div>

        <!-- Vehicle & Driver -->
        ${v ? `
          <div>
            <div class="form-label" style="margin-bottom:8px">Assigned Vehicle</div>
            <div style="background:var(--bg-surface-2);border:1px solid var(--border);border-radius:8px;padding:12px;display:flex;gap:10px;align-items:center">
              <div style="width:36px;height:36px;border-radius:8px;background:var(--primary-dim);display:flex;align-items:center;justify-content:center;color:var(--primary)">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="7" width="12" height="8" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M13 9h2l2 3v3h-4V9Z" stroke="currentColor" stroke-width="1.5"/><circle cx="4.5" cy="15.5" r="1.5" stroke="currentColor" stroke-width="1.5"/><circle cx="13.5" cy="15.5" r="1.5" stroke="currentColor" stroke-width="1.5"/></svg>
              </div>
              <div style="flex:1">
                <div style="font-weight:600;font-size:13px">${v.name}</div>
                <div style="font-size:11px;color:var(--text-3)">Driver: ${j.driver} · Fuel: ${v.fuel}%</div>
              </div>
              ${statusChip(v.status)}
            </div>
          </div>
        ` : j.status === 'pending' ? `
          <div class="alert alert-warning"><div class="alert-icon">!</div><div class="alert-body"><div class="alert-title">Unassigned</div><div class="alert-msg">No vehicle assigned yet.</div></div></div>
        ` : ''}

        <!-- Timeline -->
        <div>
          <div class="form-label" style="margin-bottom:12px">Shipment Timeline</div>
          <div class="timeline">
            <div class="timeline-item">
              <div class="timeline-dot ${j.status !== 'pending' ? 'done' : 'active'}"></div>
              <div class="timeline-time">${timeAgo(j.created)}</div>
              <div class="timeline-label">Job Created</div>
              <div class="timeline-desc">Order placed by ${j.client}</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot ${['assigned','transit','delivered','exception'].includes(j.status) ? 'done' : j.status === 'pending' ? '' : 'active'}"></div>
              <div class="timeline-label">Vehicle Assigned</div>
              <div class="timeline-desc">${v ? `${v.name} assigned` : 'Pending assignment'}</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot ${['transit','delivered'].includes(j.status) ? 'done' : j.status === 'exception' ? 'error' : ''}"></div>
              <div class="timeline-label">In Transit</div>
              <div class="timeline-desc">${j.progress > 0 ? `${j.progress}% complete` : 'Not started'}</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot ${j.status === 'delivered' ? 'done' : ''}"></div>
              <div class="timeline-label">Delivery</div>
              <div class="timeline-desc">ETA: ${formatDate(j.eta)}</div>
            </div>
          </div>
        </div>

        ${j.notes ? `<div class="alert alert-info"><div class="alert-icon">i</div><div class="alert-body"><div class="alert-title">Note</div><div class="alert-msg">${j.notes}</div></div></div>` : ''}

        ${j.exceptions && j.exceptions.length > 0 ? `
          <div class="alert alert-danger">
            <div class="alert-icon">!</div>
            <div class="alert-body"><div class="alert-title">Exception</div><div class="alert-msg">${j.exceptions.join(', ')}</div></div>
          </div>` : ''}

        <!-- Actions -->
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${j.status === 'pending' ? `<button class="btn btn-primary" id="btn-assign">Assign Vehicle</button>` : ''}
          ${j.status === 'transit' || j.status === 'assigned' ? `<button class="btn btn-success" id="btn-deliver">Mark Delivered</button>` : ''}
          ${j.status === 'exception' ? `<button class="btn btn-warning" id="btn-resolve">Resolve Exception</button>` : ''}
          ${['pending', 'assigned', 'transit', 'exception'].includes(j.status) ? `<button class="btn btn-danger" id="btn-exception">Report Exception</button>` : ''}
        </div>
      </div>
    `;

    // Bind action buttons
    setTimeout(() => {
      document.getElementById('btn-assign')?.addEventListener('click', () => {
        updateJobStatus(j.id, 'assigned');
        showToast('success', 'Assigned', 'Job marked as assigned.');
        openJobDetail(j.id); // Refresh detail
      });
      document.getElementById('btn-deliver')?.addEventListener('click', () => {
        updateJobStatus(j.id, 'delivered');
        showToast('success', 'Delivered', 'Job marked as delivered.');
        openJobDetail(j.id);
      });
      document.getElementById('btn-resolve')?.addEventListener('click', () => {
        updateJobStatus(j.id, 'transit'); // Resolve to transit
        showToast('success', 'Resolved', 'Exception resolved.');
        openJobDetail(j.id);
      });
      document.getElementById('btn-exception')?.addEventListener('click', () => {
        updateJobStatus(j.id, 'exception');
        showToast('warning', 'Exception Reported', 'Job is now in exception state.');
        openJobDetail(j.id);
      });
    }, 50);

    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    backdrop.classList.add('visible');
  }

  function closeDetail() {
    const panel = document.getElementById('jobDetailPanel');
    const backdrop = document.getElementById('jobDetailBackdrop');
    panel?.classList.remove('open');
    panel?.setAttribute('aria-hidden', 'true');
    backdrop?.classList.remove('visible');
  }

  document.getElementById('closeJobDetail')?.addEventListener('click', closeDetail);
  document.getElementById('jobDetailBackdrop')?.addEventListener('click', closeDetail);

  // View mode toggle
  document.getElementById('kanbanViewBtn')?.addEventListener('click', () => {
    viewMode = 'kanban';
    document.getElementById('kanbanViewBtn').classList.add('active');
    document.getElementById('listViewBtn').classList.remove('active');
    updateDOM();
  });
  document.getElementById('listViewBtn')?.addEventListener('click', () => {
    viewMode = 'list';
    document.getElementById('listViewBtn').classList.add('active');
    document.getElementById('kanbanViewBtn').classList.remove('active');
    updateDOM();
  });

  // Search
  document.getElementById('jobSearch')?.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    updateDOM();
  });

  // Priority filter
  document.getElementById('priorityFilter')?.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#priorityFilter .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filterPriority = chip.dataset.priority;
      updateDOM();
    });
  });

  // Create job button
  document.getElementById('createJobBtn')?.addEventListener('click', () => {
    const routeOptions = state.routes.map(r => `<option value="${r.id}">${r.from.split(',')[0]} → ${r.to.split(',')[0]} (${r.id})</option>`).join('');
    openModal({
        title: 'Create New Job',
        body: `
          <form id="new-job-form" style="display:flex;flex-direction:column;gap:12px">
            <div class="form-group"><label class="form-label">Client</label><input id="j-client" class="form-input" type="text" required placeholder="Client name" /></div>
            <div class="form-group"><label class="form-label">Route</label><select id="j-route" class="form-select">${routeOptions}</select></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div class="form-group"><label class="form-label">Cargo Type</label><input id="j-cargo" class="form-input" type="text" required placeholder="Electronics, etc." /></div>
              <div class="form-group"><label class="form-label">Priority</label><select id="j-priority" class="form-select"><option value="standard">Standard</option><option value="express">Express</option><option value="critical">Critical</option></select></div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div class="form-group"><label class="form-label">Weight (kg)</label><input id="j-weight" class="form-input" type="number" required placeholder="0" min="1" /></div>
              <div class="form-group"><label class="form-label">Value ($)</label><input id="j-value" class="form-input" type="number" required placeholder="0" min="0" /></div>
            </div>
            <div class="form-group"><label class="form-label">Notes</label><textarea id="j-notes" class="form-textarea" placeholder="Special handling instructions..."></textarea></div>
            <input type="submit" style="display:none" />
          </form>
        `,
        confirmLabel: 'Create Job',
        onConfirm: (e, modalBody) => {
          const form = modalBody.querySelector('#new-job-form');
          if (!form.checkValidity()) {
            form.reportValidity();
            return false;
          }
          const routeId = form.querySelector('#j-route').value;
          const routeObj = state.routes.find(r => r.id === routeId);
          const newJob = {
            id: `JOB-${Math.floor(Math.random() * 9000) + 1000}`,
            status: 'pending',
            route: routeObj,
            routeId,
            vehicle: null,
            driver: null,
            client: form.querySelector('#j-client').value,
            cargo: form.querySelector('#j-cargo').value,
            weight: parseInt(form.querySelector('#j-weight').value),
            pieces: 1,
            priority: form.querySelector('#j-priority').value,
            created: Date.now(),
            scheduledPickup: Date.now() + 86400000,
            eta: Date.now() + 86400000 * 3,
            progress: 0,
            notes: form.querySelector('#j-notes').value,
            value: parseInt(form.querySelector('#j-value').value),
            exceptions: []
          };
          addJob(newJob);
          showToast('success', 'Job Created', `${newJob.id} added to the pending queue.`);
          return true;
        },
      });
  });

  const onStateChange = () => requestAnimationFrame(updateDOM);
  window.addEventListener('statechange', onStateChange);

  updateDOM();

  return {
    handleState: true,
    cleanup: () => window.removeEventListener('statechange', onStateChange)
  };
}
