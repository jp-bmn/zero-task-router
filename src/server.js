const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const PORT = process.env.PORT || 3000;
const ZERO_PRIVATE_KEY = process.env.ZERO_PRIVATE_KEY || null;

function runZeroCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    exec(command, { ...options, shell: true, env: process.env }, (error, stdout, stderr) => {
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
    const result = await runZeroCommand('zero wallet balance');
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.stderr || err.error.message });
  }
});

app.post('/api/search', async (req, res) => {
  const { task } = req.body;
  if (!task) return res.status(400).json({ success: false, error: 'Task is required' });

  try {
    const command = `zero search "${task.replace(/"/g, '\\"')}"`;
    const result = await runZeroCommand(command);
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

  try {
    const command = `zero get ${index} --formatted`;
    const result = await runZeroCommand(command);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.stderr || err.error.message });
  }
});

app.post('/api/run', async (req, res) => {
  const { url, input, maxPay } = req.body;
  if (!url) return res.status(400).json({ success: false, error: 'Capability URL is required' });

  try {
    const payFlag = maxPay ? `--max-pay ${maxPay}` : '';
    const payload = input ? `--json '${JSON.stringify(input).replace(/'/g, "\\'")}'` : '';
    const command = `zero fetch ${url} ${payload} ${payFlag}`.trim();
    const result = await runZeroCommand(command);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.stderr || err.error.message });
  }
});

app.post('/api/review', async (req, res) => {
  const { runId, rating, notes } = req.body;
  if (!runId || rating === undefined) {
    return res.status(400).json({ success: false, error: 'runId and rating are required' });
  }

  try {
    const command = `zero review ${runId} --rating ${rating} ${notes ? `--notes "${notes.replace(/"/g, '\\"')}"` : ''}`;
    const result = await runZeroCommand(command);
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
