/* ============================================================
   ANTI-GRAVITY CARGO NETWORK — Billing View
   Invoices, revenue summary, client breakdown
   ============================================================ */

import { clients, formatCurrency, formatDate, timeAgo } from '../data.js';
import { renderDonut, renderBarChart, animateCounter } from '../charts.js';
import { showToast, openModal } from '../components.js';
import { state, markInvoicePaid, addInvoice } from '../store.js';

export function renderBilling(container) {
  let filterStatus = 'all';
  let searchQuery = '';

  container.innerHTML = `
    <div class="page stagger">
      <div class="page-header">
        <div>
          <h1 class="page-title">Billing</h1>
          <p class="page-subtitle" id="billing-subtitle"></p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" id="exportInvoicesBtn">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4 6l3 3 3-3M2 10v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Export
          </button>
          <button class="btn btn-primary btn-sm" id="newInvoiceBtn">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            New Invoice
          </button>
        </div>
      </div>

      <!-- Revenue Summary KPIs -->
      <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
        <div class="kpi-card" style="--kpi-color:#8b5cf6;--kpi-bg:rgba(139,92,246,0.12)">
          <div class="kpi-label">Total Invoiced</div>
          <div class="kpi-value" id="kpi-total-rev" style="font-size:22px">—</div>
          <div style="font-size:11px;color:var(--text-3)" id="kpi-total-count"></div>
        </div>
        <div class="kpi-card" style="--kpi-color:#10b981;--kpi-bg:rgba(16,185,129,0.12)">
          <div class="kpi-label">Collected</div>
          <div class="kpi-value" id="kpi-paid-rev" style="font-size:22px">—</div>
          <div style="font-size:11px;color:var(--success)" id="kpi-paid-count"></div>
        </div>
        <div class="kpi-card" style="--kpi-color:#f59e0b;--kpi-bg:rgba(245,158,11,0.12)">
          <div class="kpi-label">Pending</div>
          <div class="kpi-value" id="kpi-pend-rev" style="font-size:22px">—</div>
          <div style="font-size:11px;color:var(--warning)" id="kpi-pend-count"></div>
        </div>
        <div class="kpi-card" style="--kpi-color:#ef4444;--kpi-bg:rgba(239,68,68,0.12)">
          <div class="kpi-label">Overdue</div>
          <div class="kpi-value" id="kpi-over-rev" style="font-size:22px">—</div>
          <div style="font-size:11px;color:var(--danger)" id="kpi-over-count"></div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="dashboard-grid" style="gap:16px">

        <!-- Invoice Table -->
        <div style="display:flex;flex-direction:column;gap:14px">
          <!-- Filter Bar -->
          <div class="filter-bar">
            <div class="filter-input-wrap" style="max-width:260px">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" stroke-width="1.5"/><path d="M9 9l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              <input class="filter-input" id="invoiceSearch" placeholder="Search client or invoice…" type="search" />
            </div>
            <div class="chip-select" id="invoiceStatusFilter">
              <div class="chip active" data-status="all">All</div>
              <div class="chip" data-status="paid">Paid</div>
              <div class="chip" data-status="pending">Pending</div>
              <div class="chip" data-status="overdue">Overdue</div>
            </div>
          </div>
          <div class="card" id="invoiceTable"></div>
        </div>

        <!-- Right Column -->
        <div style="display:flex;flex-direction:column;gap:16px">
          <!-- Revenue Donut -->
          <div class="card card-padded">
            <div class="card-title" style="margin-bottom:16px">Revenue Status</div>
            <div class="donut-container">
              <div id="revenueDonut"></div>
              <div class="donut-legend" id="donut-legend">
              </div>
            </div>
          </div>

          <!-- Top Clients -->
          <div class="card card-padded">
            <div class="card-title" style="margin-bottom:14px">Revenue by Client</div>
            <div id="clientRevenueChart" style="height:140px;margin-bottom:12px"></div>
            <div style="display:flex;flex-direction:column;gap:10px" id="topClientList"></div>
          </div>

          <!-- Quick Stats -->
          <div class="card card-padded">
            <div class="card-title" style="margin-bottom:12px">Billing Health</div>
            <div style="display:flex;flex-direction:column;gap:0" id="billing-quick-stats">
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  function updateDOM() {
    const { invoices } = state;
    
    const totalRevenue = invoices.reduce((s, inv) => s + inv.amount, 0);
    const paidRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
    const pendingRevenue = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
    const overdueRevenue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);
    
    const overdueCount = invoices.filter(i => i.status === 'overdue').length;

    // Subtitle
    const subtitleEl = document.getElementById('billing-subtitle');
    if (subtitleEl) subtitleEl.textContent = `${invoices.length} invoices · ${overdueCount} overdue`;

    // KPIs
    const kpiTotal = document.getElementById('kpi-total-rev');
    if (kpiTotal) {
      kpiTotal.textContent = formatCurrency(totalRevenue);
      document.getElementById('kpi-total-count').textContent = `${invoices.length} invoices`;
    }
    const kpiPaid = document.getElementById('kpi-paid-rev');
    if (kpiPaid) {
      kpiPaid.textContent = formatCurrency(paidRevenue);
      document.getElementById('kpi-paid-count').textContent = `${invoices.filter(i => i.status === 'paid').length} paid`;
    }
    const kpiPend = document.getElementById('kpi-pend-rev');
    if (kpiPend) {
      kpiPend.textContent = formatCurrency(pendingRevenue);
      document.getElementById('kpi-pend-count').textContent = `${invoices.filter(i => i.status === 'pending').length} pending`;
    }
    const kpiOver = document.getElementById('kpi-over-rev');
    if (kpiOver) {
      kpiOver.textContent = formatCurrency(overdueRevenue);
      document.getElementById('kpi-over-count').textContent = `${overdueCount} overdue`;
    }

    // Render Table
    const tableEl = document.getElementById('invoiceTable');
    if (tableEl) {
      const search = searchQuery.toLowerCase();
      const filtered = invoices.filter(inv => {
        const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
        const matchSearch = !search || inv.client.toLowerCase().includes(search) || inv.id.toLowerCase().includes(search);
        return matchStatus && matchSearch;
      });

      tableEl.innerHTML = `
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th class="sortable">Invoice #</th>
                <th>Client</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Issued</th>
                <th>Due</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(inv => {
                const dueDate = new Date(inv.dueDate);
                const daysUntilDue = Math.round((dueDate - Date.now()) / 86400000);
                return `
                  <tr style="cursor:pointer" class="invoice-row" data-id="${inv.id}">
                    <td><span class="cell-mono">${inv.id}</span></td>
                    <td style="max-width:140px"><div class="truncate" style="font-size:13px;font-weight:500">${inv.client}</div></td>
                    <td style="max-width:160px"><div class="truncate" style="font-size:12px;color:var(--text-2)">${inv.description}</div></td>
                    <td style="font-weight:700;font-family:var(--font-mono)">${formatCurrency(inv.amount)}</td>
                    <td style="font-size:12px;color:var(--text-2)">${formatDate(inv.issueDate)}</td>
                    <td style="font-size:12px;color:${inv.status === 'overdue' ? 'var(--danger)' : daysUntilDue < 7 ? 'var(--warning)' : 'var(--text-2)'};font-weight:${daysUntilDue < 7 ? '600' : '400'}">
                      ${inv.status === 'overdue' ? 'Overdue' : formatDate(inv.dueDate)}
                    </td>
                    <td>
                      <span class="badge ${inv.status === 'paid' ? 'badge-green' : inv.status === 'pending' ? 'badge-yellow' : 'badge-red'}">${inv.status}</span>
                    </td>
                    <td>
                      <div style="display:flex;gap:4px">
                        <button class="btn btn-ghost btn-sm" title="View invoice" onclick="event.stopPropagation()">View</button>
                        ${inv.status !== 'paid' ? `<button class="btn btn-success btn-sm btn-pay" data-id="${inv.id}" title="Mark paid">Pay</button>` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <span class="pagination-info">Showing ${filtered.length} of ${invoices.length} invoices</span>
          <div class="pagination-buttons">
            <button class="btn btn-secondary btn-sm">Previous</button>
            <button class="btn btn-primary btn-sm">Next</button>
          </div>
        </div>
      `;

      tableEl.querySelectorAll('.invoice-row').forEach(row => {
        row.addEventListener('click', () => openInvoiceDetail(row.dataset.id));
      });
      tableEl.querySelectorAll('.btn-pay').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          markInvoicePaid(id);
          showToast('success', 'Invoice Paid', `${id} marked as paid.`);
        });
      });
    }

    // Revenue donut
    const rdEl = document.getElementById('revenueDonut');
    if (rdEl) {
      renderDonut(rdEl, [
        { value: paidRevenue, color: '#10b981' },
        { value: pendingRevenue, color: '#f59e0b' },
        { value: overdueRevenue, color: '#ef4444' },
      ], { size: 100, strokeWidth: 14, centerLabel: `${Math.round(paidRevenue/totalRevenue*100) || 0}%`, centerSub: 'Collected' });
      
      document.getElementById('donut-legend').innerHTML = `
        <div class="legend-item"><div class="legend-dot" style="background:#10b981"></div><span class="legend-label">Collected</span><span class="legend-value">${formatCurrency(paidRevenue)}</span></div>
        <div class="legend-item"><div class="legend-dot" style="background:#f59e0b"></div><span class="legend-label">Pending</span><span class="legend-value">${formatCurrency(pendingRevenue)}</span></div>
        <div class="legend-item"><div class="legend-dot" style="background:#ef4444"></div><span class="legend-label">Overdue</span><span class="legend-value">${formatCurrency(overdueRevenue)}</span></div>
      `;
    }

    // Client revenue chart
    const clientEl = document.getElementById('clientRevenueChart');
    if (clientEl) {
      const clientRevs = {};
      invoices.forEach(inv => {
        clientRevs[inv.client] = (clientRevs[inv.client] || 0) + inv.amount;
      });
      const topClients = Object.entries(clientRevs).sort((a, b) => b[1] - a[1]).slice(0, 6);
      clientEl.innerHTML = ''; // clear before render
      renderBarChart(clientEl, topClients.map(([name, rev]) => ({
        label: name.split(' ')[0].slice(0, 6),
        value: rev,
      })), {
        width: clientEl.offsetWidth || 280, height: 140,
        barColor: '#8b5cf6', labelKey: 'label', valueKey: 'value', showLabels: true,
      });

      // Top client list
      const listEl = document.getElementById('topClientList');
      if (listEl) {
        listEl.innerHTML = topClients.slice(0, 4).map(([name, rev]) => `
          <div class="metric-row">
            <span class="metric-label">${name.split(' ')[0]}</span>
            <span class="metric-value" style="font-family:var(--font-mono)">${formatCurrency(rev)}</span>
          </div>
        `).join('');
      }
    }
    
    // Quick Stats
    const qs = document.getElementById('billing-quick-stats');
    if (qs) {
      qs.innerHTML = `
        <div class="metric-row">
          <span class="metric-label">Collection Rate</span>
          <span class="metric-value" style="color:var(--success)">${Math.round(paidRevenue / (totalRevenue || 1) * 100)}%</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Avg. Invoice Value</span>
          <span class="metric-value">${formatCurrency(Math.round(totalRevenue / (invoices.length || 1)))}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Avg. Days to Pay</span>
          <span class="metric-value">18 days</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Payment On-Time Rate</span>
          <span class="metric-value" style="color:var(--warning)">71%</span>
        </div>
        <div class="metric-row" style="border:none">
          <span class="metric-label">Outstanding Risk</span>
          <span class="metric-value" style="color:var(--danger)">${formatCurrency(overdueRevenue)}</span>
        </div>
      `;
    }
  }

  function openInvoiceDetail(invId) {
    const inv = state.invoices.find(i => i.id === invId);
    if (!inv) return;
    openModal({
      title: `Invoice ${inv.id}`,
      body: `
        <div style="display:flex;flex-direction:column;gap:16px">
          <div style="display:flex;justify-content:space-between">
            <div><div style="font-size:13px;color:var(--text-2)">${inv.client}</div><div style="font-size:22px;font-weight:800;margin-top:4px">${formatCurrency(inv.amount)}</div></div>
            <span class="badge ${inv.status === 'paid' ? 'badge-green' : inv.status === 'pending' ? 'badge-yellow' : 'badge-red'}" style="font-size:13px;padding:6px 12px">${inv.status}</span>
          </div>
          <div style="background:var(--bg-surface-2);border:1px solid var(--border);border-radius:8px;padding:14px">
            <div style="font-size:11px;color:var(--text-3);margin-bottom:12px">${inv.description}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px">
              <div class="form-group"><div class="form-label">Issue Date</div><div style="font-weight:600">${formatDate(inv.issueDate)}</div></div>
              <div class="form-group"><div class="form-label">Due Date</div><div style="font-weight:600;color:${inv.status === 'overdue' ? 'var(--danger)' : 'inherit'}">${formatDate(inv.dueDate)}</div></div>
              <div class="form-group"><div class="form-label">Jobs Covered</div><div style="font-weight:600">${inv.jobCount}</div></div>
              <div class="form-group"><div class="form-label">Amount Due</div><div style="font-weight:700;color:${inv.status === 'paid' ? 'var(--success)' : 'var(--danger)'}">${inv.status === 'paid' ? 'Paid in full' : formatCurrency(inv.due)}</div></div>
            </div>
          </div>
        </div>
      `,
      footerHTML: `
        <div class="modal-footer">
          <button class="btn btn-secondary modal-cancel">Close</button>
          <button class="btn btn-secondary" onclick="window.showToast('info','Download','Invoice PDF downloading.')">Download PDF</button>
          ${inv.status !== 'paid' ? `<button class="btn btn-success" id="modal-pay-btn">Mark Paid</button>` : ''}
        </div>
      `,
    });
    
    // Add real event listener to the modal pay button
    setTimeout(() => {
      const btn = document.getElementById('modal-pay-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          markInvoicePaid(inv.id);
          showToast('success', 'Paid', `${inv.id} marked as paid.`);
          // Close modal manually
          document.querySelector('.modal-backdrop').remove();
        });
      }
    }, 100);
  }

  // Filters
  document.getElementById('invoiceSearch')?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    updateDOM();
  });
  document.getElementById('invoiceStatusFilter')?.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#invoiceStatusFilter .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filterStatus = chip.dataset.status;
      updateDOM();
    });
  });

  document.getElementById('newInvoiceBtn')?.addEventListener('click', () => {
    const options = clients.map(c => `<option value="${c}">${c}</option>`).join('');
    openModal({
      title: 'New Invoice',
      body: `
        <form id="new-invoice-form" style="display:flex;flex-direction:column;gap:12px">
          <div class="form-group"><label class="form-label">Client</label><select id="inv-client" class="form-select">${options}</select></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group"><label class="form-label">Amount (USD)</label><input id="inv-amt" class="form-input" type="number" placeholder="0.00" required /></div>
            <div class="form-group"><label class="form-label">Due Date</label><input id="inv-due" class="form-input" type="date" required /></div>
          </div>
          <div class="form-group"><label class="form-label">Description</label><textarea id="inv-desc" class="form-textarea" placeholder="Invoice description..." required></textarea></div>
          <input type="submit" style="display:none" />
        </form>
      `,
      confirmLabel: 'Create Invoice',
      onConfirm: (e, modalBody) => {
        const form = modalBody.querySelector('#new-invoice-form');
        if (!form.checkValidity()) {
          form.reportValidity();
          return false; // Prevent close
        }
        
        const client = form.querySelector('#inv-client').value;
        const amount = parseFloat(form.querySelector('#inv-amt').value);
        const dueDate = new Date(form.querySelector('#inv-due').value).getTime();
        const description = form.querySelector('#inv-desc').value;
        
        const newInv = {
          id: `INV-${Math.floor(Math.random() * 90000) + 10000}`,
          client,
          amount,
          due: amount,
          issueDate: Date.now(),
          dueDate,
          status: 'pending',
          description,
          jobCount: 1,
        };
        
        addInvoice(newInv);
        showToast('success', 'Invoice Created', 'New invoice added to billing queue.');
        return true; // Allow close
      },
    });
  });

  document.getElementById('exportInvoicesBtn')?.addEventListener('click', () => {
    showToast('success', 'Export Ready', 'Billing report has been downloaded.');
  });

  // Handle global state changes
  const onStateChange = () => {
    requestAnimationFrame(updateDOM);
  };
  window.addEventListener('statechange', onStateChange);

  // Initial render
  requestAnimationFrame(updateDOM);

  return {
    handleState: true,
    cleanup: () => {
      window.removeEventListener('statechange', onStateChange);
    }
  };
}
