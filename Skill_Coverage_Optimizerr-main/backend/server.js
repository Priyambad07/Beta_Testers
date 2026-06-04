const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const employeeRoutes  = require('./routes/employees');
const skillRoutes     = require('./routes/skills');
const taskRoutes      = require('./routes/tasks');
const optimizeRoutes  = require('./routes/optimize');
const dashboardRoutes = require('./routes/dashboard');
const allocationRoutes = require('./routes/allocations');
const errorHandler    = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/optimize', optimizeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/allocations', allocationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Skill Coverage Optimizer API running on http://localhost:${PORT}`);
});

module.exports = app;
