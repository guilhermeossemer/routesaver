require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const routeRoutes = require('./routes/routeRoutes');

const app = express();

// --------------- Middlewares ---------------
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// --------------- API Routes ---------------
app.use('/api/auth', authRoutes);
app.use('/api/routes', routeRoutes);

// --------------- Page Routes ---------------
app.get('/login', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'login.html'));
});

app.get('/register', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'register.html'));
});

app.get('/dashboard', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'dashboard.html'));
});

app.get('/', (_req, res) => {
  res.redirect('/login');
});

// --------------- Global Error Handler ---------------
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
  });
});

// --------------- Start ---------------
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
