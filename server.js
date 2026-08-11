import express from 'express';
import cors from 'cors';

// Load mock data generators for seeding
import { 
  jobs as initJobs, 
  vehicles as initVehicles, 
  routes as initRoutes, 
  hubs as initHubs, 
  safetyEvents as initSafetyEvents, 
  invoices as initInvoices, 
  notifications as initNotifications,
  activityFeed as initActivityFeed,
  recommendations as initRecommendations
} from './js/data.js';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize database in-memory
// For a production Vercel deployment, this resets on cold starts.
let db = {
  jobs: [...initJobs],
  vehicles: [...initVehicles],
  routes: [...initRoutes],
  hubs: [...initHubs],
  safetyEvents: [...initSafetyEvents],
  invoices: [...initInvoices],
  notifications: [...initNotifications],
  activityFeed: [...initActivityFeed],
  recommendations: [...initRecommendations],
};

// --- API Endpoints ---

// Get full state (used on app initialization)
app.get('/api/state', (req, res) => {
  res.json(db);
});

// Jobs
app.post('/api/jobs', (req, res) => {
  const newJob = req.body;
  db.jobs.unshift(newJob);
  res.status(201).json(newJob);
});

app.put('/api/jobs/:id/status', (req, res) => {
  const job = db.jobs.find(j => j.id === req.params.id);
  if (job) {
    job.status = req.body.status;
    res.json(job);
  } else {
    res.status(404).json({ error: 'Job not found' });
  }
});

// Invoices
app.post('/api/invoices', (req, res) => {
  const newInvoice = req.body;
  db.invoices.unshift(newInvoice);
  res.status(201).json(newInvoice);
});

app.put('/api/invoices/:id/pay', (req, res) => {
  const inv = db.invoices.find(i => i.id === req.params.id);
  if (inv) {
    inv.status = 'paid';
    inv.due = 0;
    res.json(inv);
  } else {
    res.status(404).json({ error: 'Invoice not found' });
  }
});

// Vehicles
app.post('/api/vehicles', (req, res) => {
  const newVehicle = req.body;
  db.vehicles.unshift(newVehicle);
  res.status(201).json(newVehicle);
});

// Routes
app.post('/api/routes', (req, res) => {
  const newRoute = req.body;
  db.routes.unshift(newRoute);
  res.status(201).json(newRoute);
});

app.post('/api/routes/:id/optimize', (req, res) => {
  const r = db.routes.find(r => r.id === req.params.id);
  if (r) {
    r.onTimeRate = parseFloat(Math.min(100, r.onTimeRate + 5).toFixed(1));
    r.avgDelay = parseFloat(Math.max(0, r.avgDelay - 15).toFixed(1));
    res.json(r);
  } else {
    res.status(404).json({ error: 'Route not found' });
  }
});

app.post('/api/routes/optimize-all', (req, res) => {
  db.routes.forEach(r => {
    r.onTimeRate = parseFloat(Math.min(100, r.onTimeRate + (Math.random() * 5)).toFixed(1));
    r.avgDelay = parseFloat(Math.max(0, r.avgDelay - 10).toFixed(1));
  });
  res.json(db.routes);
});

// Start Server locally if not running on Vercel
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Anti-Gravity API Server running on port ${PORT}`);
  });
}

// Export the Express app for Vercel
export default app;
