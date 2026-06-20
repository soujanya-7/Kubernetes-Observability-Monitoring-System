// File: pinger.js
const axios = require('axios');

let pingState = {}; // store latest stats

/**
 * Ping an array of URLs
 * @param {string[]} urls
 * @returns {Array} results [{ url, status, latency, statusCode, responseSize }]
 */
async function ping(urls) {
  const results = [];

  for (const url of urls) {
    const start = Date.now();
    try {
      const res = await axios.get(url, { timeout: 5000 });
      const latency = Date.now() - start;

      const result = {
        url,
        status: 'success',
        latency,
        statusCode: res.status,
        responseSize: res.data ? res.data.length : 0,
      };

      results.push(result);

      // store latest state
      pingState[url] = result;
      console.log(`Execution time for: ${url} - ${latency} ms. Status: ${res.status}`);
    } catch (err) {
      const latency = Date.now() - start;
      const result = {
        url,
        status: 'fail',
        latency,
        statusCode: err.response ? err.response.status : null,
        responseSize: 0,
      };
      results.push(result);
      pingState[url] = result;
      console.error(`Error calling URL: ${url}. Code: ${err.code || err.message}`);
    }
  }

  return results;
}

module.exports = {
  ping,
  pingState,
};
