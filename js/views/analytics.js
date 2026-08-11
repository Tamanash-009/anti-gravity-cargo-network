/* ============================================================
   ANTI-GRAVITY CARGO NETWORK — Analytics View
   KPI trends, charts, fleet heatmap, route performance
   ============================================================ */

import { generateDailyData, generateHourlyData, generateSparkline, formatNumber, formatCurrency } from '../data.js';
import { state } from '../store.js';
import { renderLineChart, renderBarChart, renderDonut, renderHeatmap } from '../charts.js';
import { showToast } from '../components.js';

export function renderAnalytics(container) {
  const { jobs, vehicles, routes, hubs } = state;
  let dateRange = '14d';
  const dailyData = generateDailyData(13);
  const hourlyData = generateHourlyData();

  const totalDeliveries = dailyData.reduce((s, d) => s + d.deliveries, 0);
  const totalRevenue = dailyData.reduce((s, d) => s + d.revenue, 0);
  const avgOnTime = (dailyData.reduce((s, d) => s + d.onTime, 0) / dailyData.length).toFixed(1);
  const totalExceptions = dailyData.reduce((s, d) => s + d.exceptions, 0);

  container.innerHTML = `
    <div class="page stagger">
      <div class="page-header">
        <div>
          <h1 class="page-title">Analytics</h1>
          <p class="page-subtitle">Performance intelligence for the last ${dateRange === '14d' ? '14 days' : dateRange === '30d' ? '30 days' : '7 days'}</p>
        </div>
        <div class="page-actions">
          <div class="tabs" id="dateRangeTabs">
            <button class="tab-btn" data-range="7d">7D</button>
            <button class="tab-btn active" data-range="14d">14D</button>
            <button class="tab-btn" data-range="30d">30D</button>
          </div>
          <button class="btn btn-secondary btn-sm" id="exportAnalyticsBtn">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4 6l3 3 3-3M2 10v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Export Report
          </button>
        </div>
      </div>

      <!-- Summary KPIs -->
      <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
        <div class="kpi-card" style="--kpi-color:#3b82f6;--kpi-bg:rgba(59,130,246,0.12)">
          <div class="kpi-label">Total Deliveries</div>
          <div class="kpi-value">${formatNumber(totalDeliveries)}</div>
          <div class="kpi-change positive">+8.2% vs prior period</div>
        </div>
        <div class="kpi-card" style="--kpi-color:#8b5cf6;--kpi-bg:rgba(139,92,246,0.12)">
          <div class="kpi-label">Total Revenue</div>
          <div class="kpi-value">${formatCurrency(totalRevenue)}</div>
          <div class="kpi-change positive">+12.4% vs prior period</div>
        </div>
        <div class="kpi-card" style="--kpi-color:#10b981;--kpi-bg:rgba(16,185,129,0.12)">
          <div class="kpi-label">Avg. On-Time Rate</div>
          <div class="kpi-value">${avgOnTime}<span class="kpi-unit">%</span></div>
          <div class="kpi-change negative">−0.8% vs prior period</div>
        </div>
        <div class="kpi-card" style="--kpi-color:#ef4444;--kpi-bg:rgba(239,68,68,0.12)">
          <div class="kpi-label">Total Exceptions</div>
          <div class="kpi-value">${totalExceptions}</div>
          <div class="kpi-change positive">−4 vs prior period</div>
        </div>
      </div>

      <!-- Charts Row 1 -->
      <div class="content-grid-2" style="gap:16px">
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Deliveries Over Time</div>
              <div class="card-subtitle">Daily completed deliveries</div>
            </div>
          </div>
          <div class="card-body" style="padding-top:8px">
            <div id="deliveriesChart" style="height:180px"></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Revenue Trend</div>
              <div class="card-subtitle">Daily revenue (USD thousands)</div>
            </div>
          </div>
          <div class="card-body" style="padding-top:8px">
            <div id="revenueChart" style="height:180px"></div>
          </div>
        </div>
      </div>

      <!-- Charts Row 2 -->
      <div class="content-grid-2" style="gap:16px">
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">On-Time Rate</div>
              <div class="card-subtitle">Daily delivery punctuality</div>
            </div>
          </div>
          <div class="card-body" style="padding-top:8px">
            <div id="onTimeChart" style="height:160px"></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Hourly Activity</div>
              <div class="card-subtitle">Shipment volume by hour of day</div>
            </div>
          </div>
          <div class="card-body" style="padding-top:8px">
            <div id="hourlyChart" style="height:160px"></div>
          </div>
        </div>
      </div>

      <!-- Charts Row 3 -->
      <div class="dashboard-grid" style="gap:16px">
        <!-- Fleet Utilization Heatmap -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Fleet Utilization Heatmap</div>
              <div class="card-subtitle">Vehicle activity by day (rows) and hour (columns) · darker = higher utilization</div>
            </div>
          </div>
          <div class="card-body">
            <div style="display:flex;gap:8px;margin-bottom:10px;font-size:10px;color:var(--text-3)">
              <span>Mon</span><span style="margin-left:20px">Tue</span><span style="margin-left:20px">Wed</span>
              <span style="margin-left:20px">Thu</span><span style="margin-left:20px">Fri</span>
              <span style="margin-left:20px">Sat</span><span style="margin-left:20px">Sun</span>
            </div>
            <div id="fleetHeatmap" style="overflow-x:auto"></div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:10px;color:var(--text-3)">
              <span>Low</span>
              <div style="display:flex;gap:2px">
                ${['rgba(59,130,246,0.1)','rgba(59,130,246,0.25)','rgba(59,130,246,0.45)','rgba(59,130,246,0.65)','#3b82f6'].map(c =>
                  `<div style="width:14px;height:14px;border-radius:2px;background:${c}"></div>`
                ).join('')}
              </div>
              <span>High</span>
            </div>
          </div>
        </div>

        <!-- Route Performance Table -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Route Performance</div>
          </div>
          <div style="padding:0">
            ${routes.map(r => `
              <div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border)">
                <div style="flex:1;min-width:0">
                  <div style="font-size:12px;font-weight:700">${r.from.split(',')[0]} → ${r.to.split(',')[0]}</div>
                  <div style="font-size:10px;color:var(--text-3);font-family:var(--font-mono)">${r.id} · ${r.dist} mi</div>
                </div>
                <div style="text-align:center;width:48px">
                  <div style="font-size:14px;font-weight:800;color:${r.onTimeRate >= 95 ? 'var(--success)' : r.onTimeRate >= 88 ? 'var(--warning)' : 'var(--danger)'}">${r.onTimeRate}%</div>
                  <div style="font-size:9px;color:var(--text-3)">on-time</div>
                </div>
                <div style="width:60px">
                  <div class="progress">
                    <div class="progress-fill ${r.onTimeRate >= 95 ? 'green' : r.onTimeRate >= 88 ? 'yellow' : 'red'} progress-bar-fill" style="width:${r.onTimeRate}%"></div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Breakdown Donuts -->
      <div class="content-grid-3" style="gap:16px">
        <div class="card card-padded">
          <div class="card-title" style="margin-bottom:16px">Jobs by Status</div>
          <div class="donut-container">
            <div id="jobsDonut"></div>
            <div class="donut-legend">
              ${[
                { label: 'Delivered', color: '#10b981', count: jobs.filter(j => j.status === 'delivered').length },
                { label: 'In Transit', color: '#3b82f6', count: jobs.filter(j => j.status === 'transit').length },
                { label: 'Assigned',  color: '#8b5cf6', count: jobs.filter(j => j.status === 'assigned').length },
                { label: 'Pending',   color: '#f59e0b', count: jobs.filter(j => j.status === 'pending').length },
                { label: 'Exception', color: '#ef4444', count: jobs.filter(j => j.status === 'exception').length },
              ].map(s => `
                <div class="legend-item">
                  <div class="legend-dot" style="background:${s.color}"></div>
                  <span class="legend-label">${s.label}</span>
                  <span class="legend-value">${s.count}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="card card-padded">
          <div class="card-title" style="margin-bottom:16px">Fleet by Status</div>
          <div class="donut-container">
            <div id="fleetDonut2"></div>
            <div class="donut-legend">
              ${[
                { label: 'Active', color: '#10b981', count: vehicles.filter(v => v.status === 'active').length },
                { label: 'Transit', color: '#3b82f6', count: vehicles.filter(v => v.status === 'transit').length },
                { label: 'Idle',  color: '#94a3b8', count: vehicles.filter(v => v.status === 'idle').length },
                { label: 'Maint.',color: '#f59e0b', count: vehicles.filter(v => v.status === 'maintenance').length },
              ].map(s => `
                <div class="legend-item">
                  <div class="legend-dot" style="background:${s.color}"></div>
                  <span class="legend-label">${s.label}</span>
                  <span class="legend-value">${s.count}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="card card-padded">
          <div class="card-title" style="margin-bottom:16px">Cargo Types</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${[
              { label: 'Electronics', pct: 28, color: '#3b82f6' },
              { label: 'Automotive', pct: 22, color: '#8b5cf6' },
              { label: 'Medical', pct: 16, color: '#10b981' },
              { label: 'Consumer Goods', pct: 14, color: '#f59e0b' },
              { label: 'Industrial', pct: 12, color: '#06b6d4' },
              { label: 'Other', pct: 8, color: '#64748b' },
            ].map(item => `
              <div>
                <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
                  <span style="color:var(--text-2)">${item.label}</span>
                  <span style="font-weight:700;font-family:var(--font-mono)">${item.pct}%</span>
                </div>
                <div class="progress">
                  <div class="progress-fill progress-bar-fill" style="width:${item.pct}%;background:${item.color}"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  // Render all charts
  requestAnimationFrame(() => {
    const labels = dailyData.map(d => d.date);

    // Deliveries
    const delEl = document.getElementById('deliveriesChart');
    if (delEl) renderLineChart(delEl, [{ data: dailyData.map(d => d.deliveries), color: '#3b82f6', strokeWidth: 2 }], { width: delEl.offsetWidth || 400, height: 180, labels, showGrid: true, padLeft: 40, padBottom: 24 });

    // Revenue
    const revEl = document.getElementById('revenueChart');
    if (revEl) renderLineChart(revEl, [{ data: dailyData.map(d => d.revenue / 1000), color: '#8b5cf6', strokeWidth: 2 }], { width: revEl.offsetWidth || 400, height: 180, labels, showGrid: true, padLeft: 44, padBottom: 24 });

    // On-time
    const otEl = document.getElementById('onTimeChart');
    if (otEl) renderLineChart(otEl, [
      { data: dailyData.map(d => d.onTime), color: '#10b981', strokeWidth: 2 },
    ], { width: otEl.offsetWidth || 400, height: 160, labels, showGrid: true, padLeft: 36, padBottom: 24 });

    // Hourly bar
    const hrEl = document.getElementById('hourlyChart');
    if (hrEl) renderBarChart(hrEl, hourlyData.map(d => ({
      label: d.hour % 4 === 0 ? d.label : '',
      value: d.volume,
    })), {
      width: hrEl.offsetWidth || 400,
      height: 160,
      barColor: hourlyData.map(d => d.hour >= 8 && d.hour <= 18 ? '#3b82f6' : 'rgba(59,130,246,0.35)'),
      labelKey: 'label', valueKey: 'value', showLabels: true,
    });

    // Heatmap
    const hmEl = document.getElementById('fleetHeatmap');
    if (hmEl) {
      const heatData = Array.from({ length: 7 }, (_, day) =>
        Array.from({ length: 24 }, (_, hour) => {
          const isWeekday = day < 5;
          const isPeakHour = hour >= 8 && hour <= 17;
          return Math.random() * (isWeekday && isPeakHour ? 0.8 : 0.3) + 0.1;
        })
      );
      renderHeatmap(hmEl, heatData, { cols: 24, rows: 7, cellSize: 14, gap: 3 });
    }

    // Donuts
    const jobsDonutEl = document.getElementById('jobsDonut');
    if (jobsDonutEl) renderDonut(jobsDonutEl, [
      { value: jobs.filter(j => j.status === 'delivered').length, color: '#10b981' },
      { value: jobs.filter(j => j.status === 'transit').length, color: '#3b82f6' },
      { value: jobs.filter(j => j.status === 'assigned').length, color: '#8b5cf6' },
      { value: jobs.filter(j => j.status === 'pending').length, color: '#f59e0b' },
      { value: jobs.filter(j => j.status === 'exception').length, color: '#ef4444' },
    ], { size: 100, strokeWidth: 14, centerLabel: jobs.length.toString(), centerSub: 'Jobs' });

    const fleetDonut2 = document.getElementById('fleetDonut2');
    if (fleetDonut2) renderDonut(fleetDonut2, [
      { value: vehicles.filter(v => v.status === 'active').length, color: '#10b981' },
      { value: vehicles.filter(v => v.status === 'transit').length, color: '#3b82f6' },
      { value: vehicles.filter(v => v.status === 'idle').length, color: '#94a3b8' },
      { value: vehicles.filter(v => v.status === 'maintenance').length, color: '#f59e0b' },
    ], { size: 100, strokeWidth: 14, centerLabel: vehicles.length.toString(), centerSub: 'Vehicles' });
  });

  // Date range tabs
  document.getElementById('dateRangeTabs')?.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#dateRangeTabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      dateRange = btn.dataset.range;
      showToast('info', 'Date Range Updated', `Showing analytics for last ${dateRange === '7d' ? '7' : dateRange === '30d' ? '30' : '14'} days.`);
    });
  });

  document.getElementById('exportAnalyticsBtn')?.addEventListener('click', () => {
    showToast('success', 'Report Exported', 'Analytics report has been generated and is ready to download.');
  });
}
