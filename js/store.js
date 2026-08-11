export let state = {
  jobs: [],
  vehicles: [],
  routes: [],
  hubs: [],
  safetyEvents: [],
  invoices: [],
  notifications: [],
  activityFeed: [],
  recommendations: [],
};

const API_URL = '/api';

export async function loadState() {
  try {
    const response = await fetch(`${API_URL}/state`);
    if (response.ok) {
      const data = await response.json();
      state = { ...state, ...data };
      window.dispatchEvent(new CustomEvent('statechange'));
      return state;
    }
  } catch (e) {
    console.error('Failed to load state from API:', e);
  }
  return state;
}

// Helpers for specific mutations
export async function addJob(job) {
  try {
    const res = await fetch(`${API_URL}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job)
    });
    if (res.ok) {
      const newJob = await res.json();
      state.jobs.unshift(newJob);
      window.dispatchEvent(new CustomEvent('statechange'));
    }
  } catch(e) {
    console.error('Failed to add job:', e);
  }
}

export async function updateJobStatus(jobId, status) {
  try {
    const res = await fetch(`${API_URL}/jobs/${jobId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      const job = state.jobs.find(j => j.id === jobId);
      if (job) job.status = status;
      window.dispatchEvent(new CustomEvent('statechange'));
    }
  } catch(e) {
    console.error('Failed to update job:', e);
  }
}

export async function addInvoice(invoice) {
  try {
    const res = await fetch(`${API_URL}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice)
    });
    if (res.ok) {
      const newInv = await res.json();
      state.invoices.unshift(newInv);
      window.dispatchEvent(new CustomEvent('statechange'));
    }
  } catch(e) {
    console.error('Failed to add invoice:', e);
  }
}

export async function markInvoicePaid(invoiceId) {
  try {
    const res = await fetch(`${API_URL}/invoices/${invoiceId}/pay`, {
      method: 'PUT'
    });
    if (res.ok) {
      const inv = state.invoices.find(i => i.id === invoiceId);
      if (inv) {
        inv.status = 'paid';
        inv.due = 0;
        window.dispatchEvent(new CustomEvent('statechange'));
      }
    }
  } catch(e) {
    console.error('Failed to pay invoice:', e);
  }
}

export async function addVehicle(vehicle) {
  try {
    const res = await fetch(`${API_URL}/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vehicle)
    });
    if (res.ok) {
      const newV = await res.json();
      state.vehicles.unshift(newV);
      window.dispatchEvent(new CustomEvent('statechange'));
    }
  } catch(e) {
    console.error('Failed to add vehicle:', e);
  }
}

export async function addRoute(route) {
  try {
    const res = await fetch(`${API_URL}/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(route)
    });
    if (res.ok) {
      const newR = await res.json();
      state.routes.unshift(newR);
      window.dispatchEvent(new CustomEvent('statechange'));
    }
  } catch(e) {
    console.error('Failed to add route:', e);
  }
}

export async function optimizeRoute(routeId) {
  try {
    const res = await fetch(`${API_URL}/routes/${routeId}/optimize`, {
      method: 'POST'
    });
    if (res.ok) {
      const optimizedRoute = await res.json();
      const idx = state.routes.findIndex(r => r.id === routeId);
      if (idx !== -1) {
        state.routes[idx] = optimizedRoute;
        window.dispatchEvent(new CustomEvent('statechange'));
      }
    }
  } catch(e) {
    console.error('Failed to optimize route:', e);
  }
}

export async function optimizeRoutes() {
  try {
    const res = await fetch(`${API_URL}/routes/optimize-all`, {
      method: 'POST'
    });
    if (res.ok) {
      state.routes = await res.json();
      window.dispatchEvent(new CustomEvent('statechange'));
    }
  } catch(e) {
    console.error('Failed to optimize all routes:', e);
  }
}

export function getDashboardKPIs() {
  const activeJobs = state.jobs.filter(j => j.status === 'transit' || j.status === 'assigned').length;
  const deliveredToday = state.jobs.filter(j => j.status === 'delivered').length;
  const exceptions = state.jobs.filter(j => j.status === 'exception').length;
  const activeVehicles = state.vehicles.filter(v => v.status === 'transit' || v.status === 'active').length;
  const fleetUtil = state.vehicles.length > 0 ? Math.round(activeVehicles / state.vehicles.length * 100) : 0;
  const avgOnTime = state.routes.length > 0 ? (state.routes.reduce((s, r) => s + r.onTimeRate, 0) / state.routes.length).toFixed(1) : "0.0";
  const revToday = state.invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);

  return {
    activeJobs,
    deliveredToday,
    exceptions,
    activeVehicles,
    fleetUtil,
    avgOnTime,
    revToday
  };
}
