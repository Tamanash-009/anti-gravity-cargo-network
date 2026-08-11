/* ============================================================
   ANTI-GRAVITY CARGO NETWORK — Dashboard View
   Executive operations overview
   ============================================================ */

import { generateSparkline, generateDailyData, timeAgo, formatCurrency, formatNumber } from '../data.js';
import { state, getDashboardKPIs } from '../store.js';
import { renderSparkline, renderBarChart, renderLineChart, renderDonut, animateCounter } from '../charts.js';
import { showToast, statusChip } from '../components.js';

export function renderDashboard(container) {
  const { vehicles, jobs, routes, hubs, activityFeed, recommendations } = state;
  const kpis = getDashboardKPIs();
  // Map properties to match dashboard's expectations
  kpis.onTimeRate = parseFloat(kpis.avgOnTime);
  kpis.revenueToday = kpis.revToday;
  kpis.totalVehicles = vehicles.length;
  
  const dailyData = generateDailyData(13);

  container.innerHTML = `
    <div class="page stagger">

      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Operations Overview</h1>
          <p class="page-subtitle">Live feed · ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" id="refreshDashBtn">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7a6 6 0 1 1 1.5 3.9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M1 11.5V8M1 8h3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Refresh
          </button>
          <button class="btn btn-primary btn-sm" id="newJobBtn">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            New Job
          </button>
        </div>
      </div>

      <!-- KPI Strip -->
      <div class="kpi-grid">
        <div class="kpi-card" style="--kpi-color: #3b82f6; --kpi-bg: rgba(59,130,246,0.12)">
          <div class="kpi-header">
            <span class="kpi-label">Active Jobs</span>
            <div class="kpi-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1.5" y="3" width="15" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M6 3V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M5 9h8M5 12h5" stroke="currentColor" stroke-width="1.5"/></svg>
            </div>
          </div>
          <div class="kpi-value" id="kpi-activeJobs">—</div>
          <div class="kpi-change positive">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 9V3M3 6l3-3 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            +4 from yesterday
          </div>
          <div class="kpi-sparkline" id="spark-jobs"></div>
        </div>

        <div class="kpi-card" style="--kpi-color: #10b981; --kpi-bg: rgba(16,185,129,0.12)">
          <div class="kpi-header">
            <span class="kpi-label">Fleet Utilization</span>
            <div class="kpi-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="7" width="12" height="8" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M13 9h2l2 3v3h-4V9Z" stroke="currentColor" stroke-width="1.5"/><circle cx="4.5" cy="15.5" r="1.5" stroke="currentColor" stroke-width="1.5"/><circle cx="13.5" cy="15.5" r="1.5" stroke="currentColor" stroke-width="1.5"/></svg>
            </div>
          </div>
          <div class="kpi-value"><span id="kpi-fleetUtil">—</span><span class="kpi-unit">%</span></div>
          <div class="kpi-change positive">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 9V3M3 6l3-3 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            +3% vs last week
          </div>
          <div class="kpi-sparkline" id="spark-fleet"></div>
        </div>

        <div class="kpi-card" style="--kpi-color: #f59e0b; --kpi-bg: rgba(245,158,11,0.12)">
          <div class="kpi-header">
            <span class="kpi-label">On-Time Rate</span>
            <div class="kpi-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke="currentColor" stroke-width="1.5"/><path d="M9 5v4l2.5 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </div>
          </div>
          <div class="kpi-value"><span id="kpi-onTime">—</span><span class="kpi-unit">%</span></div>
          <div class="kpi-change negative">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 3v6M9 6l-3 3-3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            −0.8% this week
          </div>
          <div class="kpi-sparkline" id="spark-ontime"></div>
        </div>

        <div class="kpi-card" style="--kpi-color: #8b5cf6; --kpi-bg: rgba(139,92,246,0.12)">
          <div class="kpi-header">
            <span class="kpi-label">Revenue Today</span>
            <div class="kpi-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="4" width="16" height="11" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M1 8h16M5 11h2M12 11h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </div>
          </div>
          <div class="kpi-value" id="kpi-revenue">—</div>
          <div class="kpi-change positive">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 9V3M3 6l3-3 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            +12.4% vs yesterday
          </div>
          <div class="kpi-sparkline" id="spark-rev"></div>
        </div>

        <div class="kpi-card" style="--kpi-color: #ef4444; --kpi-bg: rgba(239,68,68,0.12)">
          <div class="kpi-header">
            <span class="kpi-label">Exceptions</span>
            <div class="kpi-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L1.5 15h15L9 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 8v4M9 13.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </div>
          </div>
          <div class="kpi-value" id="kpi-exceptions">—</div>
          <div class="kpi-change negative">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 3v6M9 6l-3 3-3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            +2 new today
          </div>
          <div class="kpi-sparkline" id="spark-exc"></div>
        </div>

        <div class="kpi-card" style="--kpi-color: #06b6d4; --kpi-bg: rgba(6,182,212,0.12)">
          <div class="kpi-header">
            <span class="kpi-label">Delivered Today</span>
            <div class="kpi-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M5 9l3 3 5-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="9" r="7.5" stroke="currentColor" stroke-width="1.5"/></svg>
            </div>
          </div>
          <div class="kpi-value" id="kpi-delivered">—</div>
          <div class="kpi-change positive">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 9V3M3 6l3-3 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            +7 vs yesterday
          </div>
          <div class="kpi-sparkline" id="spark-del"></div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="dashboard-grid" style="gap: 16px">

        <!-- Left Column -->
        <div style="display:flex;flex-direction:column;gap:16px">

          <!-- Delivery & Revenue Chart -->
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">Delivery Trends</div>
                <div class="card-subtitle">Last 14 days · Deliveries & revenue</div>
              </div>
              <div class="tabs" style="width:auto">
                <button class="tab-btn active" data-chart="deliveries">Deliveries</button>
                <button class="tab-btn" data-chart="revenue">Revenue</button>
                <button class="tab-btn" data-chart="ontime">On-Time</button>
              </div>
            </div>
            <div class="card-body" style="padding-top:8px">
              <div id="mainChart" style="height:180px"></div>
            </div>
          </div>

          <!-- Live Ops Map -->
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">Live Fleet Map</div>
                <div class="card-subtitle" id="liveMapSub">Tracking ${vehicles.filter(v => v.status === 'transit').length} active vehicles</div>
              </div>
              <div style="display:flex;gap:8px;align-items:center">
                <div class="status-chip status-active" style="font-size:10px">Live</div>
                <a href="#tracking" class="btn btn-ghost btn-sm">Full Map →</a>
              </div>
            </div>
            <div id="liveMap" class="map-container" style="height:260px;position:relative"></div>
          </div>

          <!-- Route Performance -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">Top Routes</div>
              <a href="#routes" class="btn btn-ghost btn-sm">View All →</a>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Active Jobs</th>
                    <th>On-Time</th>
                    <th>Utilization</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  ${routes.slice(0, 5).map(r => `
                    <tr>
                      <td>
                        <div style="font-weight:600;font-size:13px">${r.from.split(',')[0]} → ${r.to.split(',')[0]}</div>
                        <div style="font-size:11px;color:var(--text-3);font-family:var(--font-mono)">${r.id} · ${r.dist} mi</div>
                      </td>
                      <td><span class="font-semi">${r.activeJobs}</span> <span style="color:var(--text-3)">/ ${r.capacity}</span></td>
                      <td>
                        <span style="color:${r.onTimeRate >= 95 ? 'var(--success)' : r.onTimeRate >= 88 ? 'var(--warning)' : 'var(--danger)'}; font-weight:600">
                          ${r.onTimeRate}%
                        </span>
                      </td>
                      <td style="width:120px">
                        <div style="display:flex;align-items:center;gap:8px">
                          <div class="progress" style="flex:1">
                            <div class="progress-fill ${r.activeJobs/r.capacity > 0.8 ? 'yellow' : 'blue'} progress-bar-fill"
                              style="width:${Math.round(r.activeJobs/r.capacity*100)}%"></div>
                          </div>
                          <span style="font-size:11px;color:var(--text-3);font-family:var(--font-mono);width:28px;text-align:right">${Math.round(r.activeJobs/r.capacity*100)}%</span>
                        </div>
                      </td>
                      <td>
                        <span class="badge ${r.riskLevel === 'low' ? 'badge-green' : r.riskLevel === 'medium' ? 'badge-yellow' : 'badge-red'}">${r.riskLevel}</span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div style="display:flex;flex-direction:column;gap:16px">

          <!-- Fleet Status Donut -->
          <div class="card card-padded">
            <div class="card-title" style="margin-bottom:16px">Fleet Health</div>
            <div class="donut-container">
              <div id="fleetDonut"></div>
              <div class="donut-legend">
                ${buildFleetLegend(kpis, vehicles)}
              </div>
            </div>
          </div>

          <!-- Smart Recommendations -->
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">Smart Alerts</div>
                <div class="card-subtitle">AI-powered recommendations</div>
              </div>
              <span class="badge badge-blue">3</span>
            </div>
            <div class="card-body" style="display:flex;flex-direction:column;gap:10px">
              ${recommendations.map(r => `
                <div class="alert ${r.priority === 'high' ? 'alert-danger' : r.priority === 'medium' ? 'alert-warning' : 'alert-info'}" style="flex-direction:column;gap:6px">
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <div class="alert-title">${r.title}</div>
                    <span class="badge ${r.priority === 'high' ? 'badge-red' : r.priority === 'medium' ? 'badge-yellow' : 'badge-blue'}">${r.priority}</span>
                  </div>
                  <div class="alert-msg" style="color:var(--text-2)">${r.body}</div>
                  <div style="font-size:11px;font-weight:600;color:var(--success);margin-top:2px">${r.savings}</div>
                  <button class="btn btn-sm" style="background:rgba(255,255,255,0.06);border:1px solid var(--border);color:var(--text-1);margin-top:4px;align-self:flex-start" onclick="window.location.hash='#${r.type === 'fleet' ? 'fleet' : r.type === 'route' ? 'routes' : 'hubs'}'">
                    Review →
                  </button>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Activity Feed -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">Recent Activity</div>
              <div class="status-chip status-active" style="font-size:10px">Live</div>
            </div>
            <div class="card-body" style="padding:0">
              <div style="display:flex;flex-direction:column;gap:1px" id="activityFeed">
                ${renderActivityFeed(activityFeed)}
              </div>
            </div>
          </div>

          <!-- Hub Capacity -->
          <div class="card card-padded">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
              <div class="card-title">Hub Capacity</div>
              <a href="#hubs" class="btn btn-ghost btn-sm">All Hubs →</a>
            </div>
            <div style="display:flex;flex-direction:column;gap:12px">
              ${hubs.slice(0, 4).map(h => {
                const pct = Math.round(h.current / h.capacity * 100);
                return `
                  <div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px">
                      <span style="font-weight:600">${h.name.split(' ')[0]}</span>
                      <span style="color:${pct >= 90 ? 'var(--danger)' : pct >= 75 ? 'var(--warning)' : 'var(--success)'};font-weight:700;font-family:var(--font-mono)">${pct}%</span>
                    </div>
                    <div class="progress">
                      <div class="progress-fill ${pct >= 90 ? 'red' : pct >= 75 ? 'yellow' : 'green'} progress-bar-fill" style="width:${pct}%"></div>
                    </div>
                    <div style="font-size:10px;color:var(--text-3);margin-top:3px;font-family:var(--font-mono)">${formatNumber(h.current)} / ${formatNumber(h.capacity)} units</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Animate KPI counters
  requestAnimationFrame(() => {
    animateCounter(document.getElementById('kpi-activeJobs'), 0, kpis.activeJobs, 800);
    animateCounter(document.getElementById('kpi-fleetUtil'), 0, kpis.fleetUtil, 800);
    animateCounter(document.getElementById('kpi-onTime'), 0, kpis.onTimeRate, 800, v => v.toFixed(1));
    animateCounter(document.getElementById('kpi-exceptions'), 0, kpis.exceptions, 600);
    animateCounter(document.getElementById('kpi-delivered'), 0, kpis.deliveredToday, 700);
    document.getElementById('kpi-revenue').textContent = formatCurrency(kpis.revenueToday);

    // Sparklines
    renderSparkline(document.getElementById('spark-jobs'), generateDailyData(7).map(d => d.deliveries), { color: '#3b82f6', height: 40 });
    renderSparkline(document.getElementById('spark-fleet'), generateDailyData(7).map(d => d.deliveries + 10), { color: '#10b981', height: 40 });
    renderSparkline(document.getElementById('spark-ontime'), generateDailyData(7).map(d => d.onTime), { color: '#f59e0b', height: 40 });
    renderSparkline(document.getElementById('spark-rev'), generateDailyData(7).map(d => d.revenue), { color: '#8b5cf6', height: 40 });
    renderSparkline(document.getElementById('spark-exc'), generateDailyData(7).map(d => Math.floor(Math.random() * 5)), { color: '#ef4444', height: 40 });
    renderSparkline(document.getElementById('spark-del'), generateDailyData(7).map(d => d.deliveries - 2), { color: '#06b6d4', height: 40 });

    // Fleet donut
    renderDonut(document.getElementById('fleetDonut'), [
      { label: 'In Transit', value: kpis.transit, color: '#10b981' },
      { label: 'Idle', value: kpis.idle, color: '#3b82f6' },
      { label: 'Maintenance', value: kpis.maint, color: '#f59e0b' }
    ], { size: 140, holeSize: 100, label: 'Total Fleet', value: kpis.totalVehicles });

    // Main chart
    renderMainChart('deliveries', dailyData);

    // Live map
    renderLiveMap(hubs, vehicles);
  });

  // Chart tab switching
  container.querySelectorAll('[data-chart]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-chart]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMainChart(btn.dataset.chart, dailyData);
    });
  });

  // Refresh button
  document.getElementById('refreshDashBtn')?.addEventListener('click', () => {
    showToast('success', 'Dashboard Refreshed', 'All data synchronized with live network.');
  });

  // New job button
  document.getElementById('newJobBtn')?.addEventListener('click', () => {
    window.location.hash = '#jobs';
  });

  // Live activity updates
  let feedUpdateInterval = setInterval(() => {
    const feed = document.getElementById('activityFeed');
    if (!feed) { clearInterval(feedUpdateInterval); return; }
    // Subtle pulse on last item
    feed.firstElementChild?.classList.add('animate-fade-in');
  }, 15000);

  return { cleanup: () => clearInterval(feedUpdateInterval) };
}

function buildFleetLegend(kpis, vehicles) {
  const active = kpis.transit;
  const idle = kpis.idle;
  const maint = kpis.maint;
  return `
    <div class="legend-item">
      <div class="legend-dot" style="background:#10b981"></div>
      <span class="legend-label">Active / Transit</span>
      <span class="legend-value">${active}</span>
    </div>
    <div class="legend-item">
      <div class="legend-dot" style="background:#3b82f6"></div>
      <span class="legend-label">Idle</span>
      <span class="legend-value">${idle}</span>
    </div>
    <div class="legend-item">
      <div class="legend-dot" style="background:#f59e0b"></div>
      <span class="legend-label">Maintenance</span>
      <span class="legend-value">${maint}</span>
    </div>
    <div class="legend-item">
      <div class="legend-dot" style="background:rgba(255,255,255,0.1)"></div>
      <span class="legend-label">Total Fleet</span>
      <span class="legend-value">${kpis.totalVehicles}</span>
    </div>
  `;
}

function renderActivityFeed(activityFeed) {
  const icons = {
    delivered: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8l3 3 5-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    alert:     `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L1.5 13h13L8 2Z" stroke="currentColor" stroke-width="1.5"/><path d="M8 7v3M8 11.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    transit:   `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="6" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M11 8h2l2 2.5V13h-4V8Z" stroke="currentColor" stroke-width="1.5"/><circle cx="4" cy="13.5" r="1.5" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="13.5" r="1.5" stroke="currentColor" stroke-width="1.5"/></svg>`,
    hub:       `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1L15 4.5V11.5L8 15L1 11.5V4.5L8 1Z" stroke="currentColor" stroke-width="1.5"/></svg>`,
    vehicle:   `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="6" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/><circle cx="4" cy="13.5" r="1.5" stroke="currentColor" stroke-width="1.5"/></svg>`,
    exception: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L1.5 13h13L8 2Z" stroke="currentColor" stroke-width="1.5"/><path d="M8 7v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    route:     `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="5" cy="5" r="2.5" stroke="currentColor" stroke-width="1.5"/><circle cx="11" cy="11" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M7.5 5h2.5v3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  };
  const colorMap = { success: '#10b981', danger: '#ef4444', primary: '#3b82f6', warning: '#f59e0b', info: '#06b6d4', purple: '#8b5cf6' };

  return activityFeed.map(item => `
    <div class="activity-item" style="padding: 12px 20px">
      <div class="activity-icon-wrap" style="background:${colorMap[item.color]}20;color:${colorMap[item.color]}">
        ${icons[item.icon] || icons.alert}
      </div>
      <div class="activity-body">
        <div class="activity-text">${item.text}</div>
        <div class="activity-meta">
          <span>${timeAgo(item.time)}</span>
          <span>·</span>
          <span>${item.meta}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function renderMainChart(type, dailyData) {
  const el = document.getElementById('mainChart');
  if (!el) return;
  const labels = dailyData.map(d => d.date);
  const datasets = {
    deliveries: [{ data: dailyData.map(d => d.deliveries), color: '#3b82f6', strokeWidth: 2 }],
    revenue:    [{ data: dailyData.map(d => d.revenue / 1000), color: '#8b5cf6', strokeWidth: 2 }],
    ontime:     [{ data: dailyData.map(d => d.onTime), color: '#10b981', strokeWidth: 2 }],
  };
  renderLineChart(el, datasets[type], {
    width: el.offsetWidth || 600,
    height: 180,
    labels,
    showGrid: true,
    padLeft: 44,
    padBottom: 28,
  });
}

function renderLiveMap(hubs, vehicles) {
  const mapEl = document.getElementById('liveMap');
  if (!mapEl) return;

  const w = mapEl.offsetWidth || 600;
  const h = 260;

  // SVG USA map approximation with dots for hubs and vehicles
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', w);
  svg.setAttribute('height', h);
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.style.position = 'absolute';
  svg.style.inset = '0';

  // Background grid
  for (let i = 0; i < 8; i++) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', (i / 8) * w); line.setAttribute('x2', (i / 8) * w);
    line.setAttribute('y1', 0); line.setAttribute('y2', h);
    line.setAttribute('stroke', 'rgba(255,255,255,0.03)'); line.setAttribute('stroke-width', 1);
    svg.appendChild(line);
  }
  for (let i = 0; i < 5; i++) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', 0); line.setAttribute('x2', w);
    line.setAttribute('y1', (i / 5) * h); line.setAttribute('y2', (i / 5) * h);
    line.setAttribute('stroke', 'rgba(255,255,255,0.03)'); line.setAttribute('stroke-width', 1);
    svg.appendChild(line);
  }

  // Map lat/lng to SVG coords (approximate US bounding box)
  const latMin = 25, latMax = 49, lngMin = -124, lngMax = -66;
  const toSvg = (lat, lng) => ({
    x: ((lng - lngMin) / (lngMax - lngMin)) * w,
    y: ((latMax - lat) / (latMax - latMin)) * h,
  });

  // Draw routes as faint lines
  const routeHubs = [
    ['HUB-ATL', 'HUB-MIA'], ['HUB-LAX', 'HUB-SEA'], ['HUB-ORD', 'HUB-DFW'],
    ['HUB-ATL', 'HUB-ORD'], ['HUB-DFW', 'HUB-LAX'], ['HUB-MIA', 'HUB-ORD'],
  ];
  const hubMap = Object.fromEntries(hubs.map(h => [h.id, h]));

  routeHubs.forEach(([aId, bId]) => {
    const a = hubMap[aId], b = hubMap[bId];
    if (!a || !b) return;
    const pa = toSvg(a.lat, a.lng);
    const pb = toSvg(b.lat, b.lng);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', pa.x); line.setAttribute('y1', pa.y);
    line.setAttribute('x2', pb.x); line.setAttribute('y2', pb.y);
    line.setAttribute('stroke', 'rgba(59,130,246,0.2)');
    line.setAttribute('stroke-width', 1.5);
    line.setAttribute('stroke-dasharray', '4 4');
    svg.appendChild(line);
  });

  // Vehicles in transit
  vehicles.filter(v => v.status === 'transit').slice(0, 12).forEach((v, i) => {
    const pt = toSvg(v.lat, v.lng);
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // Ping animation
    const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ring.setAttribute('cx', pt.x); ring.setAttribute('cy', pt.y); ring.setAttribute('r', 6);
    ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', '#3b82f6'); ring.setAttribute('stroke-width', 1.5);
    ring.style.transformOrigin = `${pt.x}px ${pt.y}px`;
    ring.style.animation = `radar-ping 2s ease-out ${(i * 0.3) % 2}s infinite`;
    g.appendChild(ring);

    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y); dot.setAttribute('r', 4);
    dot.setAttribute('fill', '#3b82f6');
    g.appendChild(dot);
    svg.appendChild(g);
  });

  // Hub dots
  hubs.forEach(h => {
    const pt = toSvg(h.lat, h.lng);
    const pct = h.current / h.capacity;
    const color = pct >= 0.9 ? '#ef4444' : pct >= 0.75 ? '#f59e0b' : '#10b981';

    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bg.setAttribute('cx', pt.x); bg.setAttribute('cy', pt.y); bg.setAttribute('r', 10);
    bg.setAttribute('fill', color + '25'); bg.setAttribute('stroke', color); bg.setAttribute('stroke-width', 1.5);
    svg.appendChild(bg);

    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y); dot.setAttribute('r', 4);
    dot.setAttribute('fill', color);
    svg.appendChild(dot);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', pt.x); text.setAttribute('y', pt.y + 22);
    text.setAttribute('text-anchor', 'middle'); text.setAttribute('font-size', '9');
    text.setAttribute('fill', 'rgba(255,255,255,0.6)'); text.setAttribute('font-family', 'Inter, sans-serif');
    text.textContent = h.city.split(',')[0];
    svg.appendChild(text);
  });

  // Legend
  const legendY = h - 20;
  const legendItems = [
    { color: '#10b981', label: 'Hub OK' },
    { color: '#f59e0b', label: 'Hub Busy' },
    { color: '#ef4444', label: 'Hub Critical' },
    { color: '#3b82f6', label: 'Vehicle' },
  ];
  legendItems.forEach((item, i) => {
    const x = 16 + i * 110;
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', x); dot.setAttribute('cy', legendY); dot.setAttribute('r', 4);
    dot.setAttribute('fill', item.color);
    svg.appendChild(dot);
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x + 10); text.setAttribute('y', legendY + 4);
    text.setAttribute('font-size', '9'); text.setAttribute('fill', 'rgba(255,255,255,0.4)');
    text.setAttribute('font-family', 'Inter, sans-serif');
    text.textContent = item.label;
    svg.appendChild(text);
  });

  mapEl.innerHTML = '';
  mapEl.appendChild(svg);
}
