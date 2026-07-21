const api = window.finora?.keyauth;

export function isExpired(expiry) {
  if (!expiry || expiry === '' || expiry === '0' || expiry === '0.0') return false;
  const exp = Number(expiry);
  if (isNaN(exp)) return false;
  return exp > 0 && Date.now() > exp;
}

export function formatExpiry(expiry) {
  if (!expiry || expiry === '' || expiry === '0' || expiry === '0.0') return 'Lifetime';
  const exp = Number(expiry);
  if (isNaN(exp)) return 'N/A';
  return new Date(exp).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export async function loginKeyAuth(username, password, licenseKey) {
  if (!api) return { success: false, error: 'Not running in Electron' };
  try {
    return await api.login(username, password, licenseKey || '');
  } catch (err) {
    return { success: false, error: `Connection error: ${err.message}` };
  }
}

export async function registerKeyAuth(username, password, licenseKey) {
  if (!api) return { success: false, error: 'Not running in Electron' };
  try {
    return await api.register(username, password, licenseKey);
  } catch (err) {
    return { success: false, error: `Connection error: ${err.message}` };
  }
}

export async function verifyLicenseKey(licenseKey) {
  if (!api) return { success: false, error: 'Not running in Electron' };
  try {
    return await api.license(licenseKey);
  } catch (err) {
    return { success: false, error: `Connection error: ${err.message}` };
  }
}

export async function fetchUserData(username) {
  if (!api) return { success: false, error: 'Not running in Electron' };
  try {
    return await api.fetch(username);
  } catch (err) {
    return { success: false, error: `Connection error: ${err.message}` };
  }
}

export async function forgotPassword(username, email) {
  if (!api) return { success: false, error: 'Not running in Electron' };
  try {
    return await api.forgot(username, email);
  } catch (err) {
    return { success: false, error: `Connection error: ${err.message}` };
  }
}
