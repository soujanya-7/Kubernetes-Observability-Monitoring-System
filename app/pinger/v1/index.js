const express = require('express');
const client = require('prom-client'); // Add prom-client for metrics
const pi = require('./pinger'); // Your existing ping logic

const app = express();
const port = 3000;

app.use(express.json());

// ------------------ Prometheus metrics ------------------
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [50, 100, 200, 300, 400, 500, 1000]
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// ------------------ Existing Pinger code ------------------
let urls = [
  'https://google.com',
  'https://api.nasa.gov',
  'https://juspay.in',
  'https://127.0.0.1/fail'
];

setInterval(() => pi.ping(urls), 5000);

app.get('/', (req, res) => res.send('OK!'));
app.get('/ping/stats', (req, res) => res.json(pi.pingState || {}));
app.get('/ping/urls', (req, res) => res.json(urls));
app.post('/ping/updateUrl', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL not provided' });
  urls.push(url);
  urls = [...new Set(urls)];
  res.json(urls);
});

// ------------------ Start server ------------------
app.listen(port, '0.0.0.0', () => {
  console.log(`Pinger v1 listening on port ${port}`);
});
