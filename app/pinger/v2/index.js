// File: index.js (Pinger v2 - FIXED)
const express = require('express');
const pi = require('./pinger');
const client = require('prom-client');

const app = express();
const port = 3000;

app.use(express.json());

/* -------------------
   Prometheus metrics
------------------- */
client.collectDefaultMetrics();

const pingSuccessCounter = new client.Counter({
  name: 'pinger_success_total',
  help: 'Total successful pings',
});

const pingFailCounter = new client.Counter({
  name: 'pinger_fail_total',
  help: 'Total failed pings',
});

/* -------------------
   FIX: async wrapper
------------------- */
const originalPing = pi.ping;

pi.ping = async (urls) => {
  try {
    const results = await originalPing(urls);

    if (!Array.isArray(results)) {
      console.error(
        '[pinger-v2] Expected results to be array, got:',
        typeof results,
        results
      );
      return results;
    }

    results.forEach(r => {
      if (r.status === 'success') {
        pingSuccessCounter.inc();
      } else {
        pingFailCounter.inc();
      }
    });

    return results;
  } catch (err) {
    console.error('[pinger-v2] Ping failed:', err.message);
    return [];
  }
};

/* -------------------
   URLs to ping
------------------- */
let urls = [
  'https://google.com',
  'https://api.nasa.gov',
  'https://juspay.in',
  'https://127.0.0.1/fail'
];

// IMPORTANT: async interval
setInterval(async () => {
  await pi.ping(urls);
}, 5000);

/* -------------------
   Routes
------------------- */
app.get('/', (req, res) => res.send('OK!'));

app.get('/ping/stats', (req, res) =>
  res.json(pi.pingState || {})
);

app.get('/ping/urls', (req, res) =>
  res.json(urls)
);

app.post('/ping/updateUrl', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL not provided' });

  urls = [...new Set([...urls, url])];
  res.json(urls);
});

/* -------------------
   Metrics endpoint
------------------- */
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

/* -------------------
   Start server
------------------- */
app.listen(port, '0.0.0.0', () => {
  console.log(`Pinger v2 listening on 0.0.0.0:${port} (including /metrics)`);
});
