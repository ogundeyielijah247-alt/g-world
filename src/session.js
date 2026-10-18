// Cached profile fields are presentation hints, never proof of authentication.
export function cachedToken(raw) {
  try {
    const value = JSON.parse(raw);
    return value && typeof value === 'object' && !Array.isArray(value)
      && typeof value.token === 'string' && /^[a-f0-9]{64}$/i.test(value.token)
      ? value.token : '';
  } catch { return ''; }
}
export function validMember(member) {
  return !!member && typeof member === 'object'
    && typeof member.name === 'string' && member.name.trim().length > 0
    && typeof member.gworldId === 'string' && member.gworldId.trim().length > 0;
}
