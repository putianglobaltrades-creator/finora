const SYMBOLS = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', CHF: 'Fr',
  CAD: 'C$', AUD: 'A$', CNY: '¥', INR: '₹', BRL: 'R$',
};

export function getCurrencySymbol(code) {
  return SYMBOLS[code] || '$';
}

export function formatAmount(amount, currency) {
  const sym = getCurrencySymbol(currency);
  return `${sym}${Number(amount).toLocaleString()}`;
}
