const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const apiRoutes = require('./routes/api');

const app = express();

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for React
  crossOriginEmbedderPolicy: false
}));

// CORS Policy
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting (Prevent abuse on public endpoints)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

// Apply rate limiter to API
app.use('/api/', apiLimiter);

// Routes
app.use('/api', apiRoutes);

// Locate frontend static assets — check all possible paths
const possiblePaths = [
  path.join(__dirname, '..', 'client', 'dist'),   // server/app.js → client/dist
  path.join(__dirname, '..', 'dist'),              // server/app.js → dist
  path.join(__dirname, '..'),                      // server/app.js → root (index.html at root)
  path.join(process.cwd(), 'client', 'dist'),      // cwd → client/dist
  path.join(process.cwd(), 'dist'),                // cwd → dist
  path.join(process.cwd()),                        // cwd root (index.html at root)
];

let clientBuildPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(path.join(p, 'index.html'))) {
    clientBuildPath = p;
    console.log(`[Static Files] Serving frontend from: ${p}`);
    break;
  }
}

if (clientBuildPath) {
  app.use(express.static(clientBuildPath));
}

// SPA fallback — any non-API route serves index.html
app.get('*', (req, res) => {
  if (clientBuildPath) {
    const indexPath = path.join(clientBuildPath, 'index.html');
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head><title>OTESS Verification</title></head>
        <body style="font-family:sans-serif; text-align:center; padding:50px;">
          <h2>OTESS System Initializing</h2>
          <p>Please wait a moment and refresh. Frontend assets are being set up...</p>
        </body>
      </html>
    `);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
