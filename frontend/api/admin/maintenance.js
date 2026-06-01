import {
  readMaintenanceState,
  toPublicResponse,
  verifyAdminToken,
  writeMaintenanceState,
} from '../_lib/maintenance.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await verifyAdminToken(req);

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

    await writeMaintenanceState(state);
    return res.status(200).json({ success: true, ...toPublicResponse(state) });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) {
      console.error('[api/admin/maintenance]', err);
    }
    return res.status(status).json({ error: err.message || 'Request failed' });
  }
}
