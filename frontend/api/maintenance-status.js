import {
  readMaintenanceState,
  toPublicResponse,
} from './_lib/maintenance.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const state = await readMaintenanceState();
    return res.status(200).json(toPublicResponse(state));
  } catch (err) {
    console.error('[api/maintenance-status]', err);
    return res.status(200).json(toPublicResponse({
      maintenance_enabled: false,
      start_time: null,
      end_time: null,
      message: '',
    }));
  }
}
