const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const jwt = require('jsonwebtoken');

const router = express.Router();
const DATA_FILE = path.join(__dirname, '../data/maintenance.json');

const defaultState = () => ({
  maintenance_enabled: false,
  start_time: null,
  end_time: null,
  message: '',
});

async function readState() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    return defaultState();
  }
}

async function writeState(state) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function computeActive(state) {
  if (!state.maintenance_enabled) return false;

  const now = Date.now();
  if (state.start_time) {
    const start = new Date(state.start_time).getTime();
    if (!Number.isNaN(start) && now < start) return false;
  }
  if (state.end_time) {
    const end = new Date(state.end_time).getTime();
    if (!Number.isNaN(end) && now > end) return false;
  }
  return true;
}

function toPublicResponse(state) {
  return {
    maintenance_enabled: Boolean(state.maintenance_enabled),
    active: computeActive(state),
    start_time: state.start_time || null,
    end_time: state.end_time || null,
    message: state.message || '',
  };
}

function authenticateAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const secret = process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'JWT_SECRET is not configured on the server' });
  }

  try {
    jwt.verify(token, secret);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

router.get('/maintenance-status', async (req, res) => {
  try {
    const state = await readState();
    res.json(toPublicResponse(state));
  } catch (err) {
    console.error('[Maintenance] GET status failed:', err);
    res.status(500).json({ error: 'Failed to read maintenance status' });
  }
});

router.post('/admin/maintenance', authenticateAdmin, async (req, res) => {
  try {
    const {
      maintenance_enabled = false,
      start_time = null,
      end_time = null,
      message = '',
    } = req.body || {};

    const state = {
      maintenance_enabled: Boolean(maintenance_enabled),
      start_time: start_time || null,
      end_time: end_time || null,
      message: typeof message === 'string' ? message : '',
    };

    await writeState(state);
    res.json({ success: true, ...toPublicResponse(state) });
  } catch (err) {
    console.error('[Maintenance] POST admin failed:', err);
    res.status(500).json({ error: 'Failed to update maintenance settings' });
  }
});

module.exports = router;
