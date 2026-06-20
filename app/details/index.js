const express = require('express');
const details = require('./details');
const client = require('prom-client'); // Add prom-client for metrics

const app = express();
const port = 4000;

app.use(express.json());

// ------------------ Prometheus metrics ------------------
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// ------------------ Default route ------------------
app.get('/', (req, res) => res.send('OK!'));

// ------------------ URL info API ------------------
app.post('/url/info', async (req, res) => {
  try {
    const data = await details.fetchUrlInfo(req.body.url);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------ Start server ------------------
app.listen(port, '0.0.0.0', () => {
  console.log(`Details service listening on port ${port}`);
});
