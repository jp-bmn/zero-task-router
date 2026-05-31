const express = require('express');
const cors = require('cors');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const PORT = process.env.PORT || 3000;
const ZERO_PRIVATE_KEY = process.env.ZERO_PRIVATE_KEY || null;
const ZERO_MAX_PAY_CEILING = parseFloat(process.env.ZERO_MAX_PAY_CEILING || '0.50');

function runZeroCommand(args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile('zero', args, { ...options, env: process.env }, (error, stdout, stderr) => {
      if (error) {
        return reject({ error, stderr: stderr.trim(), stdout: stdout.trim() });
      }
      resolve(stdout.trim());
    });
  });
}

function readZeroConfig() {
  try {
    const configPath = path.join(process.env.HOME || process.env.USERPROFILE, '.zero', 'config.json');
    if (!fs.existsSync(configPath)) return null;
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    return null;
  }
}

app.get('/api/wallet', async (req, res) => {
  try {
    const result = await runZeroCommand(['wallet', 'balance']);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.stderr || err.error.message });
  }
});

app.post('/api/search', async (req, res) => {
  const { task } = req.body;
  if (!task) return res.status(400).json({ success: false, error: 'Task is required' });

  if (typeof task !== 'string' || task.length > 200) {
    return res.status(400).json({ success: false, error: 'Task query must be under 200 characters.' });
  }

  try {
    const result = await runZeroCommand(['search', task]);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.stderr || err.error.message });
  }
});

app.post('/api/inspect', async (req, res) => {
  const { index } = req.body;
  if (index === undefined || index === null) {
    return res.status(400).json({ success: false, error: 'Index is required' });
  }

  const indexStr = String(index);
  if (indexStr.length > 100) {
    return res.status(400).json({ success: false, error: 'Identifier must be under 100 characters.' });
  }

  try {
    const result = await runZeroCommand(['get', indexStr, '--formatted']);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.stderr || err.error.message });
  }
});

app.post('/api/run', async (req, res) => {
  const { url, input, maxPay } = req.body;
  if (!url) return res.status(400).json({ success: false, error: 'Capability URL is required' });

  if (typeof url !== 'string' || url.length > 100) {
    return res.status(400).json({ success: false, error: 'Capability URL must be under 100 characters.' });
  }

  if (!process.env.ZERO_PRIVATE_KEY) {
    return res.status(500).json({ success: false, error: 'ZERO_PRIVATE_KEY environment variable is not configured on the server.' });
  }

  try {
    let enforcedMaxPay = ZERO_MAX_PAY_CEILING;
    if (maxPay !== undefined && maxPay !== null) {
      const parsedMaxPay = parseFloat(maxPay);
      if (!isNaN(parsedMaxPay)) {
        enforcedMaxPay = Math.min(parsedMaxPay, ZERO_MAX_PAY_CEILING);
      }
    }

    const args = ['fetch', url, '--max-pay', String(enforcedMaxPay)];
    if (input) {
      args.push('--json', JSON.stringify(input));
    }

    const result = await runZeroCommand(args);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.stderr || err.error.message });
  }
});

app.post('/api/review', async (req, res) => {
  const { runId, quality, reliability, content, notes } = req.body;
  if (!runId || quality === undefined || reliability === undefined || content === undefined) {
    return res.status(400).json({ success: false, error: 'runId, quality, reliability, and content ratings are required' });
  }

  if (typeof runId !== 'string' || !/^run_[A-Za-z0-9_-]+$/.test(runId)) {
    return res.status(400).json({ success: false, error: 'runId must match /^run_[A-Za-z0-9_-]+$/' });
  }

  const qVal = Number(quality);
  const rVal = Number(reliability);
  const cVal = Number(content);

  if (!Number.isInteger(qVal) || qVal < 1 || qVal > 5 ||
      !Number.isInteger(rVal) || rVal < 1 || rVal > 5 ||
      !Number.isInteger(cVal) || cVal < 1 || cVal > 5) {
    return res.status(400).json({ success: false, error: 'Ratings (quality, reliability, content) must be integers between 1 and 5.' });
  }

  if (notes && (typeof notes !== 'string' || notes.length > 1000)) {
    return res.status(400).json({ success: false, error: 'Notes must be under 1000 characters.' });
  }

  try {
    const args = [
      'review', runId,
      '--quality', String(qVal),
      '--reliability', String(rVal),
      '--content', String(cVal)
    ];
    if (notes) {
      args.push('--notes', notes);
    }
    const result = await runZeroCommand(args);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.stderr || err.error.message });
  }
});

app.get('/api/config', (req, res) => {
  const config = readZeroConfig();
  res.json({
    success: true,
    data: {
      port: PORT,
      zeroPrivateKey: ZERO_PRIVATE_KEY || (config && config.privateKey ? 'configured' : null),
      configPath: config ? path.join(process.env.HOME || process.env.USERPROFILE, '.zero', 'config.json') : null
    }
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Zero Task Router running on http://localhost:${PORT}`);
});
