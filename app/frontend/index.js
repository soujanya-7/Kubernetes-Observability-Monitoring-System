const express = require('express');
const path = require('path');
const morgan = require('morgan');
const axios = require('axios');
const client = require('prom-client'); // Add prom-client for metrics

const app = express();
const port = 9000;

// ------------------ Prometheus metrics ------------------
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// ------------------ Logging ------------------
app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url ' +
  'HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'));

var log = console.log;
console.log = function () {
  let first = arguments[0];
  let rest = Array.prototype.slice.call(arguments, 1);
  log.apply(console, [(new Date().toISOString()) + ' | ' + first].concat(rest));
};

// ------------------ API config ------------------
const pingerBaseUrl = process.env.PINGER_BASE_URL || 'http://localhost:3000';
const detailsBaseUrl = process.env.DETAILS_BASE_URL || 'http://localhost:4000';

const getApiCall = (url) => axios.get(url)
  .then(res => res.data)
  .catch(err => ({ error: err.code }));

const postApiCall = (url, data) => axios.post(url, data)
  .then(res => res.data)
  .catch(err => ({ error: err.code }));

const sendResponse = (res, data) => {
  if (data.error) res.status(500);
  res.json(data);
};

// ------------------ Frontend routes ------------------
app.get('/', (req, res) => res.sendFile(path.join(__dirname, './index.html')));

app.get('/ping/stats', async (req, res) => {
  const data = await getApiCall(pingerBaseUrl + '/ping/stats');
  sendResponse(res, data);
});

app.get('/ping/urls', async (req, res) => {
  const data = await getApiCall(pingerBaseUrl + '/ping/urls');
  sendResponse(res, data);
});

app.post('/ping/updateUrl', async (req, res) => {
  const data = await postApiCall(pingerBaseUrl + '/ping/updateUrl', req.body);
  sendResponse(res, data);
});

app.post('/url/info', async (req, res) => {
  const data = await postApiCall(detailsBaseUrl + '/url/info', req.body);
  sendResponse(res, data);
});

// ------------------ Start main app ------------------
app.listen(port, '0.0.0.0', () => {
  console.log(`Frontend listening on port ${port}`);
});
