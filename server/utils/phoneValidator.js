const MTN_PREFIXES = ['024', '054', '055', '059', '025', '053'];

function normalizePhoneNumber(rawPhone) {
  if (!rawPhone) return null;
  let cleaned = String(rawPhone).trim().replace(/[\s\-\(\)\.]/g, '');

  if (cleaned.startsWith('+233')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('233') && cleaned.length === 12) {
    cleaned = '0' + cleaned.slice(3);
  }

  if (!/^0\d{9}$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

function isMTNNumber(normalizedPhone) {
  if (!normalizedPhone || normalizedPhone.length !== 10) return false;
  const prefix = normalizedPhone.slice(0, 3);
  return MTN_PREFIXES.includes(prefix);
}

function validateMTNPhone(rawPhone) {
  const normalized = normalizePhoneNumber(rawPhone);
  if (!normalized) {
    return {
      isValid: false,
      normalized: null,
      error: 'Invalid Ghana phone format. Number must be 10 digits (e.g., 0241234567).'
    };
  }

  if (!isMTNNumber(normalized)) {
    return {
      isValid: false,
      normalized,
      error: `Number (${normalized}) is not an MTN Ghana number. Eligible prefixes: ${MTN_PREFIXES.join(', ')}.`
    };
  }

  return {
    isValid: true,
    normalized,
    network: 'MTN Ghana'
  };
}

module.exports = {
  MTN_PREFIXES,
  normalizePhoneNumber,
  isMTNNumber,
  validateMTNPhone
};
