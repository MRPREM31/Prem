import maintenanceConfig from '../config/maintenanceConfig';

const INACTIVE_STATE = {
  active: false,
  maintenance_enabled: false,
  start_time: null,
  end_time: null,
  message: '',
};

export function isEmergencyMaintenanceActive() {
  if (!maintenanceConfig?.enabled) return false;
  const now = Date.now();
  const end = new Date(maintenanceConfig.endDate).getTime();
  return !Number.isNaN(end) && now < end;
}

export function getEmergencyMaintenanceState() {
  return {
    active: true,
    fallback: true,
    maintenance_enabled: true,
    start_time: new Date().toISOString(),
    end_time: maintenanceConfig.endDate,
    message: maintenanceConfig.message,
  };
}

/** Map API payload to the shape used by App + Maintenance page. */
export function normalizeMaintenanceStatus(data) {
  if (!data || typeof data !== 'object') return { ...INACTIVE_STATE };

  const maintenanceEnabled = Boolean(data.maintenance_enabled ?? data.active);
  const now = Date.now();
  const startMs = data.start_time ? new Date(data.start_time).getTime() : null;
  const endMs = data.end_time ? new Date(data.end_time).getTime() : null;

  let active = data.active !== undefined ? Boolean(data.active) : maintenanceEnabled;

  if (maintenanceEnabled) {
    if (startMs && !Number.isNaN(startMs) && now < startMs) active = false;
    if (endMs && !Number.isNaN(endMs) && now > endMs) active = false;
  } else {
    active = false;
  }

  return {
    active,
    maintenance_enabled: maintenanceEnabled,
    start_time: data.start_time || null,
    end_time: data.end_time || null,
    message: data.message || '',
    fallback: Boolean(data.fallback),
  };
}

function getMaintenanceApiBasesOrdered() {
  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const siteOrigin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : '';

  const isLocal =
    !siteOrigin ||
    siteOrigin.includes('localhost') ||
    siteOrigin.includes('127.0.0.1');

  // Production site: prefer same-origin Vercel API (avoids Render 404 noise).
  const preferSiteOrigin =
    import.meta.env.VITE_MAINTENANCE_ON_VERCEL === 'true' ||
    (import.meta.env.PROD && siteOrigin && !isLocal);

  const bases = [];
  if (preferSiteOrigin && siteOrigin) bases.push(siteOrigin);
  if (apiBase) bases.push(apiBase);
  if (!preferSiteOrigin && siteOrigin) bases.push(siteOrigin);

  return [...new Set(bases)];
}

function getMaintenanceEndpoints() {
  return getMaintenanceApiBasesOrdered().map((base) => `${base}/api/maintenance-status`);
}

export async function fetchMaintenanceStatus() {
  if (isEmergencyMaintenanceActive()) {
    return getEmergencyMaintenanceState();
  }

  const endpoints = getMaintenanceEndpoints();
  let lastError = null;

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.status === 404) continue;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return normalizeMaintenanceStatus(data);
    } catch (err) {
      lastError = err;
    }
  }

  if (import.meta.env.DEV && lastError) {
    console.warn('[Maintenance] API unavailable:', lastError.message || lastError);
  }

  return normalizeMaintenanceStatus(INACTIVE_STATE);
}

export function getMaintenanceApiBases() {
  return getMaintenanceApiBasesOrdered();
}

export async function saveMaintenanceSettings(payload, token) {
  const bases = getMaintenanceApiBases();
  let lastError = null;

  for (const base of bases) {
    try {
      const res = await fetch(`${base}/api/admin/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.status === 404) continue;
      return res;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Maintenance API unavailable');
}

export async function fetchMaintenanceSettingsForAdmin() {
  const state = await fetchMaintenanceStatus();
  return {
    maintenance_enabled: state.maintenance_enabled,
    start_time: state.start_time,
    end_time: state.end_time,
    message: state.message,
  };
}
