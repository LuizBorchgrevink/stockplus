/**
 * Utilidades de validacion compartidas por las rutas.
 * Devuelven null cuando el dato no es valido.
 */

function parseId(value) {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  }
  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) {
    return null;
  }
  const number = Number(value.trim());
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function parsePositiveInt(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function parseNonNegativeInt(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

function parseMoney(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  return Math.round(number * 100) / 100;
}

function text(value, maxLength) {
  if (value === undefined || value === null) return '';
  const result = String(value).trim();
  return result.length <= maxLength ? result : null;
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function isEmail(value) {
  return typeof value === 'string'
    && value.length <= 100
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value) {
  return typeof value === 'string' && value.length <= 20 && /^[0-9+\-()\s]*$/.test(value);
}

module.exports = {
  parseId,
  parsePositiveInt,
  parseNonNegativeInt,
  parseMoney,
  text,
  normalizeEmail,
  isEmail,
  isPhone
};
