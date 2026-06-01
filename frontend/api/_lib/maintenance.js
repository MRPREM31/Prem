const DEFAULT_STATE = {
  maintenance_enabled: false,
  start_time: null,
  end_time: null,
  message: '',
};

export function computeActive(state) {
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

export function toPublicResponse(state) {
  return {
    maintenance_enabled: Boolean(state.maintenance_enabled),
    active: computeActive(state),
    start_time: state.start_time || null,
    end_time: state.end_time || null,
    message: state.message || '',
  };
}

function parseEnvState() {
  const raw = process.env.MAINTENANCE_STATE;
  if (!raw) return { ...DEFAULT_STATE };
  try {
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

async function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) return null;

  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, key);
}

export async function readMaintenanceState() {
  const supabase = await getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('maintenance_settings')
      .select('maintenance_enabled, start_time, end_time, message')
      .eq('id', 1)
      .maybeSingle();

    if (!error && data) {
      return {
        maintenance_enabled: Boolean(data.maintenance_enabled),
        start_time: data.start_time,
        end_time: data.end_time,
        message: data.message || '',
      };
    }
  }

  return parseEnvState();
}

export async function writeMaintenanceState(state) {
  const supabase = await getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from('maintenance_settings').upsert({
      id: 1,
      maintenance_enabled: Boolean(state.maintenance_enabled),
      start_time: state.start_time,
      end_time: state.end_time,
      message: state.message || '',
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return;
  }

  throw new Error(
    'Maintenance persistence is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on Vercel, or deploy backend/routes/maintenance.js on Render.'
  );
}

export async function verifyAdminToken(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }

  const secret =
    process.env.JWT_SECRET ||
    process.env.ADMIN_JWT_SECRET ||
    process.env.VITE_JWT_SECRET;

  if (!secret) {
    const err = new Error('JWT_SECRET is not configured');
    err.status = 500;
    throw err;
  }

  const jwt = await import('jsonwebtoken');
  try {
    jwt.default.verify(token, secret);
  } catch {
    const err = new Error('Invalid or expired token');
    err.status = 401;
    throw err;
  }
}
