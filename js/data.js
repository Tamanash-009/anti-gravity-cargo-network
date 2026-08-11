/* ============================================================
   ANTI-GRAVITY CARGO NETWORK — Mock Data
   Realistic logistics data for all views
   ============================================================ */

// ---- Utilities ----
export function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min, max, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

export function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function formatNumber(n, decimals = 0) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

export function formatCurrency(n) {
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

export function hoursAgo(h) {
  return new Date(Date.now() - h * 3600000);
}

// ---- Cargo Hubs ----
export const hubs = [
  { id: 'HUB-ATL', name: 'Atlanta Gateway', city: 'Atlanta, GA', lat: 33.749, lng: -84.388, capacity: 12000, current: 8640, status: 'active', inbound: 42, outbound: 38, lastSync: hoursAgo(0.2), manager: 'Priya Sharma', type: 'Primary Hub' },
  { id: 'HUB-LAX', name: 'LA Pacific Hub', city: 'Los Angeles, CA', lat: 34.052, lng: -118.244, capacity: 18000, current: 16920, status: 'active', inbound: 67, outbound: 71, lastSync: hoursAgo(0.1), manager: 'Carlos Vega', type: 'Primary Hub' },
  { id: 'HUB-ORD', name: 'Chicago Midway', city: 'Chicago, IL', lat: 41.878, lng: -87.629, capacity: 14500, current: 9425, status: 'active', inbound: 55, outbound: 49, lastSync: hoursAgo(0.3), manager: 'Dana Park', type: 'Regional Hub' },
  { id: 'HUB-MIA', name: 'Miami Seaport', city: 'Miami, FL', lat: 25.774, lng: -80.194, capacity: 9000, current: 5850, status: 'active', inbound: 28, outbound: 31, lastSync: hoursAgo(0.4), manager: 'Marco Torres', type: 'Secondary Hub' },
  { id: 'HUB-SEA', name: 'Seattle Cascade', city: 'Seattle, WA', lat: 47.606, lng: -122.332, capacity: 7500, current: 3225, status: 'maintenance', inbound: 12, outbound: 8, lastSync: hoursAgo(1.2), manager: 'Lisa Chen', type: 'Secondary Hub' },
  { id: 'HUB-DFW', name: 'Dallas-Fort Worth', city: 'Dallas, TX', lat: 32.779, lng: -96.808, capacity: 11000, current: 9790, status: 'active', inbound: 44, outbound: 52, lastSync: hoursAgo(0.2), manager: 'Brett Williams', type: 'Regional Hub' },
];

// ---- Fleet / Vehicles ----
const vehicleTypes = ['Cargo Truck XL', 'Heavy Freighter', 'Refrigerated Van', 'Box Truck', 'Flatbed Trailer', 'City Sprinter'];
const vehicleMakes = ['Volvo FH', 'Mercedes Actros', 'Scania R-Series', 'MAN TGX', 'DAF XF', 'Kenworth T680'];
export const vehicles = Array.from({ length: 24 }, (_, i) => {
  const id = `VH-${String(i + 1).padStart(3, '0')}`;
  const type = vehicleTypes[i % vehicleTypes.length];
  const make = vehicleMakes[i % vehicleMakes.length];
  const statuses = ['active', 'idle', 'maintenance', 'transit'];
  const statusWeights = [0.4, 0.25, 0.15, 0.2];
  let cumulative = 0;
  const rand = Math.random();
  let status = 'idle';
  for (let j = 0; j < statuses.length; j++) {
    cumulative += statusWeights[j];
    if (rand < cumulative) { status = statuses[j]; break; }
  }
  const fuel = randomBetween(12, 98);
  const load = status === 'transit' ? randomBetween(55, 100) : randomBetween(0, 80);
  const nextMaint = daysFromNow(randomBetween(-3, 45));
  const hubId = hubs[i % hubs.length].id;
  return {
    id,
    name: `${make} #${i + 1}`,
    type,
    make,
    status,
    fuel,
    load,
    mileage: randomBetween(18000, 320000),
    speed: status === 'transit' ? randomBetween(45, 80) : 0,
    currentHub: hubId,
    nextMaintenance: nextMaint,
    driver: randomChoice(['Alex Morgan', 'Sam Lee', 'Chris Park', 'Jordan Kim', 'Taylor Brown', 'Jamie Scott', 'Robin Hall', 'Casey Adams']),
    lat: randomFloat(25, 48, 3),
    lng: randomFloat(-122, -74, 3),
    lastUpdate: hoursAgo(randomFloat(0, 2, 1)),
    dailyMileage: randomBetween(120, 480),
    riskScore: randomBetween(1, 8),
    cargo: status === 'transit' ? randomChoice(['Electronics', 'Automotive Parts', 'Perishables', 'Medical Supplies', 'Consumer Goods', 'Industrial Equipment']) : null,
    jobId: status === 'transit' ? `JOB-${randomBetween(1000, 9999)}` : null,
  };
});

// ---- Routes ----
const routePairs = [
  { from: 'Atlanta, GA', to: 'Miami, FL', fromHub: 'HUB-ATL', toHub: 'HUB-MIA', dist: 665 },
  { from: 'Los Angeles, CA', to: 'Seattle, WA', fromHub: 'HUB-LAX', toHub: 'HUB-SEA', dist: 1135 },
  { from: 'Chicago, IL', to: 'Dallas, TX', fromHub: 'HUB-ORD', toHub: 'HUB-DFW', dist: 925 },
  { from: 'Atlanta, GA', to: 'Chicago, IL', fromHub: 'HUB-ATL', toHub: 'HUB-ORD', dist: 718 },
  { from: 'Dallas, TX', to: 'Los Angeles, CA', fromHub: 'HUB-DFW', toHub: 'HUB-LAX', dist: 1435 },
  { from: 'Miami, FL', to: 'Atlanta, GA', fromHub: 'HUB-MIA', toHub: 'HUB-ATL', dist: 665 },
  { from: 'Seattle, WA', to: 'Dallas, TX', fromHub: 'HUB-SEA', toHub: 'HUB-DFW', dist: 2100 },
  { from: 'Chicago, IL', to: 'Atlanta, GA', fromHub: 'HUB-ORD', toHub: 'HUB-ATL', dist: 718 },
  { from: 'Los Angeles, CA', to: 'Dallas, TX', fromHub: 'HUB-LAX', toHub: 'HUB-DFW', dist: 1435 },
  { from: 'Miami, FL', to: 'Chicago, IL', fromHub: 'HUB-MIA', toHub: 'HUB-ORD', dist: 1375 },
];

export const routes = routePairs.map((pair, i) => ({
  id: `RT-${String(i + 1).padStart(3, '0')}`,
  ...pair,
  eta: `${Math.floor(pair.dist / 65)}h ${Math.floor((pair.dist % 65) / 65 * 60)}m`,
  avgTime: `${Math.floor(pair.dist / 62)}h`,
  capacity: randomBetween(4, 12),
  activeJobs: randomBetween(0, 6),
  onTimeRate: randomFloat(82, 98, 1),
  avgDelay: randomFloat(0, 45, 0),
  stops: randomBetween(1, 4),
  status: randomChoice(['active', 'active', 'active', 'maintenance', 'idle']),
  weeklyVolume: randomBetween(80, 400),
  riskLevel: randomChoice(['low', 'low', 'medium', 'medium', 'high']),
  lastRun: hoursAgo(randomBetween(1, 48)),
  preferredVehicleType: randomChoice(vehicleTypes),
}));

// ---- Jobs ----
export const cargoTypes = ['Electronics', 'Automotive Parts', 'Medical Supplies', 'Perishables', 'Consumer Goods', 'Industrial Equipment', 'Textiles', 'Chemicals', 'Furniture', 'Hazmat-Class-3'];
export const clients = ['TechCore Industries', 'MedLogix Corp', 'FreshPath Distributors', 'AutoPlus Supply', 'NovaMart Retail', 'Steelworks LLC', 'ClearPath Pharma', 'Pacific Consumer Goods', 'EcoMart Group', 'Apex Manufacturing'];

export const jobs = Array.from({ length: 42 }, (_, i) => {
  const statuses = ['pending', 'assigned', 'transit', 'delivered', 'exception'];
  const statusWeights = [0.18, 0.22, 0.28, 0.25, 0.07];
  let cumulative = 0;
  const rand = Math.random();
  let status = 'pending';
  for (let j = 0; j < statuses.length; j++) {
    cumulative += statusWeights[j];
    if (rand < cumulative) { status = statuses[j]; break; }
  }
  const route = routes[i % routes.length];
  const vehicle = status !== 'pending' ? vehicles.find(v => v.id === `VH-${String((i % 10) + 1).padStart(3, '0')}`) : null;
  const weight = randomBetween(200, 24000);
  const created = hoursAgo(randomBetween(1, 120));
  const priority = randomChoice(['standard', 'standard', 'standard', 'express', 'critical']);
  return {
    id: `JOB-${String(5000 + i).padStart(4, '0')}`,
    status,
    route,
    routeId: route.id,
    vehicle: vehicle ? vehicle.id : null,
    driver: vehicle ? vehicle.driver : null,
    client: randomChoice(clients),
    cargo: randomChoice(cargoTypes),
    weight,
    pieces: randomBetween(1, 240),
    priority,
    created,
    scheduledPickup: hoursAgo(randomBetween(-12, 24)),
    eta: daysFromNow(randomFloat(0.1, 3, 1)),
    progress: status === 'transit' ? randomBetween(5, 95) : (status === 'delivered' ? 100 : 0),
    notes: randomChoice(['', '', '', 'Fragile — handle with care', 'Temperature sensitive', 'Requires signature on delivery', 'Hazardous material — follow protocol']),
    value: randomBetween(800, 48000),
    exceptions: status === 'exception' ? [randomChoice(['Vehicle breakdown', 'Weather delay', 'Traffic incident', 'Customs hold', 'Address issue'])] : [],
  };
});

// ---- Safety Events ----
const safetyEventTypes = [
  { type: 'Hard Braking', severity: 'medium', icon: '⚡' },
  { type: 'Speeding', severity: 'high', icon: '🚨' },
  { type: 'Rapid Acceleration', severity: 'low', icon: '⚠' },
  { type: 'Overload Detected', severity: 'high', icon: '🚨' },
  { type: 'Seatbelt Violation', severity: 'medium', icon: '⚠' },
  { type: 'Sharp Cornering', severity: 'low', icon: '⚡' },
  { type: 'Fatigue Alert', severity: 'high', icon: '🚨' },
  { type: 'Geofence Breach', severity: 'medium', icon: '⚡' },
  { type: 'Lane Departure', severity: 'low', icon: '⚠' },
  { type: 'Emergency Braking', severity: 'high', icon: '🚨' },
];

export const safetyEvents = Array.from({ length: 28 }, (_, i) => {
  const event = safetyEventTypes[i % safetyEventTypes.length];
  const vehicle = vehicles[i % vehicles.length];
  return {
    id: `EVT-${String(8000 + i).padStart(4, '0')}`,
    ...event,
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    driver: vehicle.driver,
    location: randomChoice(['I-75 North near Atlanta', 'US-1 Miami Bypass', 'I-90 Chicago Loop', 'I-35 Dallas Central', 'I-5 LA Connector', 'SR-99 Seattle North']),
    timestamp: hoursAgo(randomBetween(1, 168)),
    resolved: Math.random() > 0.3,
    lat: randomFloat(25, 48, 3),
    lng: randomFloat(-122, -74, 3),
    speed: randomBetween(45, 95),
    notes: '',
  };
});

// ---- Invoices / Billing ----
export const invoices = Array.from({ length: 30 }, (_, i) => {
  const isPaid = Math.random() > 0.4;
  const isOverdue = !isPaid && Math.random() > 0.6;
  const amount = Math.floor(Math.random() * 15000) + 1200;
  return {
    id: `INV-26${String(100 + i).padStart(3, '0')}`,
    client: clients[Math.floor(Math.random() * clients.length)],
    amount,
    due: isPaid ? 0 : amount,
    issueDate: Date.now() - Math.floor(Math.random() * 45) * 86400000,
    dueDate: Date.now() + (isOverdue ? -1 : 1) * Math.floor(Math.random() * 15) * 86400000,
    status: isPaid ? 'paid' : isOverdue ? 'overdue' : 'pending',
    description: `Freight services for ${Math.floor(Math.random() * 3) + 1} shipments.`,
    jobCount: Math.floor(Math.random() * 5) + 1,
  };
});

// ---- Notifications ----
export const notifications = [
  { id: 'N1', type: 'danger',  title: 'Critical: Overload Detected', body: 'Vehicle VH-007 is 12% over capacity limit on route RT-002.', time: hoursAgo(0.3), read: false },
  { id: 'N2', type: 'warning', title: 'Delivery Delay — JOB-5012', body: 'ETA shifted by 2h 15m due to I-90 traffic incident near Chicago.', time: hoursAgo(0.8), read: false },
  { id: 'N3', type: 'warning', title: 'HUB-LAX Capacity at 94%', body: 'LA Pacific Hub approaching capacity. Consider rerouting inbound freight.', time: hoursAgo(1.5), read: false },
  { id: 'N4', type: 'info',    title: 'Fleet maintenance due: VH-014', body: 'Scheduled maintenance window in 3 days. Book service slot to avoid disruption.', time: hoursAgo(3), read: true },
  { id: 'N5', type: 'success', title: 'JOB-5003 Delivered', body: 'TechCore Industries shipment delivered successfully to Atlanta Gateway.', time: hoursAgo(5), read: true },
  { id: 'N6', type: 'info',    title: 'New route recommendation', body: 'Smart routing suggests RT-005 can save 1h 20m on Dallas–LA corridor.', time: hoursAgo(8), read: true },
];

// ---- Dashboard KPIs ----
export function getDashboardKPIs() {
  const activeJobs = jobs.filter(j => j.status === 'transit' || j.status === 'assigned').length;
  const deliveredToday = jobs.filter(j => j.status === 'delivered').length;
  const exceptions = jobs.filter(j => j.status === 'exception').length;
  const activeVehicles = vehicles.filter(v => v.status === 'transit' || v.status === 'active').length;
  const fleetUtil = Math.round(activeVehicles / vehicles.length * 100);
  const onTimeJobs = jobs.filter(j => j.status === 'delivered').length;
  const onTimeRate = 94.2;
  const revenueToday = invoices.reduce((s, inv) => s + (inv.status === 'paid' ? inv.amount : 0), 0);
  return {
    activeJobs,
    deliveredToday,
    exceptions,
    activeVehicles,
    fleetUtil,
    onTimeRate,
    revenueToday,
    totalVehicles: vehicles.length,
    totalHubs: hubs.length,
    totalRoutes: routes.length,
  };
}

// ---- Sparkline / Chart Data ----
export function generateSparkline(points = 20, min = 40, max = 100, trend = 'up') {
  const data = [];
  let current = randomBetween(min, max);
  for (let i = 0; i < points; i++) {
    const delta = randomBetween(-8, 10) + (trend === 'up' ? 1 : trend === 'down' ? -1 : 0);
    current = Math.max(min, Math.min(max, current + delta));
    data.push(current);
  }
  return data;
}

export function generateDailyData(days = 14) {
  const data = [];
  let deliveries = randomBetween(80, 120);
  let revenue = randomBetween(40000, 80000);
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    deliveries = Math.max(50, deliveries + randomBetween(-15, 20));
    revenue = Math.max(20000, revenue + randomBetween(-8000, 12000));
    data.push({
      date: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      deliveries,
      revenue: Math.round(revenue),
      onTime: randomFloat(88, 99, 1),
      exceptions: randomBetween(0, 6),
    });
  }
  return data;
}

export function generateHourlyData() {
  return Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: `${String(h).padStart(2, '0')}:00`,
    volume: h >= 6 && h <= 22 ? randomBetween(10, 85) : randomBetween(2, 18),
  }));
}

// ---- Activity Feed ----
export const activityFeed = [
  { id: 'A1', type: 'delivered', icon: 'delivered', color: 'success', text: 'JOB-5021 delivered to HUB-ATL', meta: 'TechCore Industries · 2.4t', time: hoursAgo(0.2) },
  { id: 'A2', type: 'alert',     icon: 'alert',     color: 'danger',  text: 'Safety event: Hard braking on VH-012', meta: 'I-90 Chicago · Driver: Sam Lee', time: hoursAgo(0.4) },
  { id: 'A3', type: 'transit',   icon: 'transit',   color: 'primary', text: 'JOB-5034 picked up from HUB-LAX', meta: 'NovaMart Retail · 8.1t → Dallas', time: hoursAgo(0.7) },
  { id: 'A4', type: 'hub',       icon: 'hub',       color: 'warning', text: 'HUB-LAX capacity at 94%', meta: 'Consider rerouting inbound shipments', time: hoursAgo(1.0) },
  { id: 'A5', type: 'vehicle',   icon: 'vehicle',   color: 'info',    text: 'VH-003 entered maintenance mode', meta: 'Scheduled — HUB-ORD Bay 4', time: hoursAgo(1.5) },
  { id: 'A6', type: 'delivered', icon: 'delivered', color: 'success', text: 'JOB-5018 delivered to HUB-DFW', meta: 'Apex Manufacturing · 14.2t', time: hoursAgo(2.1) },
  { id: 'A7', type: 'exception', icon: 'alert',     color: 'danger',  text: 'JOB-5029 flagged: Address not found', meta: 'AutoPlus Supply · Miami route', time: hoursAgo(2.8) },
  { id: 'A8', type: 'route',     icon: 'route',     color: 'purple',  text: 'New optimal route computed: RT-003', meta: 'Saves 47min on Chicago–Dallas corridor', time: hoursAgo(3.5) },
];

// ---- Recommendations ----
export const recommendations = [
  { id: 'R1', type: 'capacity', priority: 'high', title: 'Reroute 4 jobs from LAX hub', body: 'HUB-LAX is at 94% capacity. Route 4 inbound jobs to HUB-ATL to prevent overflow.', savings: '~$3,200 avoided penalty' },
  { id: 'R2', type: 'route',    priority: 'medium', title: 'Use RT-005 for Dallas–LA jobs', body: 'New route analysis shows 1h 20m time savings and 12% lower fuel cost.', savings: '~$840/shipment' },
  { id: 'R3', type: 'fleet',    priority: 'low', title: 'Schedule VH-014 maintenance now', body: 'Pre-scheduling avoids peak weekend disruption. 3 available slots today.', savings: 'Prevents 2-day downtime' },
];
