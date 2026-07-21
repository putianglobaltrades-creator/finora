const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

const cryptoMap = {
  'BTC': 'bitcoin', 'BITCOIN': 'bitcoin',
  'ETH': 'ethereum', 'ETHEREUM': 'ethereum',
  'SOL': 'solana', 'SOLANA': 'solana',
  'XRP': 'ripple', 'RIPPLE': 'ripple',
  'ADA': 'cardano', 'CARDANO': 'cardano',
  'DOT': 'polkadot', 'POLKADOT': 'polkadot',
  'DOGE': 'dogecoin', 'DOGECOIN': 'dogecoin',
  'AVAX': 'avalanche-2', 'AVALANCHE': 'avalanche-2',
  'MATIC': 'matic-network', 'POLYGON': 'matic-network',
  'LINK': 'chainlink', 'CHAINLINK': 'chainlink',
  'UNI': 'uniswap', 'UNISWAP': 'uniswap',
  'ATOM': 'cosmos', 'COSMOS': 'cosmos',
  'LTC': 'litecoin', 'LITECOIN': 'litecoin',
  'BCH': 'bitcoin-cash', 'BITCOINCASH': 'bitcoin-cash',
  'TRX': 'tron', 'TRON': 'tron',
  'ETC': 'ethereum-classic', 'ETHEREUMCLASSIC': 'ethereum-classic',
  'XLM': 'stellar', 'STELLAR': 'stellar',
  'VET': 'vechain', 'VECHAIN': 'vechain',
  'FIL': 'filecoin', 'FILECOIN': 'filecoin',
  'SHIB': 'shiba-inu', 'SHIBAINU': 'shiba-inu',
  'NEAR': 'near', 'NEARPROTOCOL': 'near',
  'APE': 'apecoin', 'APECOIN': 'apecoin',
  'SAND': 'the-sandbox', 'THESANDBOX': 'the-sandbox',
  'MANA': 'decentraland', 'DECENTRALAND': 'decentraland',
};

export async function fetchCryptoPrice(ticker) {
  const key = ticker.toUpperCase();
  const coinId = cryptoMap[key];
  if (!coinId) return null;
  try {
    const res = await fetch(`${COINGECKO_BASE}/simple/price?ids=${coinId}&vs_currencies=usd`);
    if (!res.ok) return null;
    const data = await res.json();
    return data[coinId]?.usd || null;
  } catch {
    return null;
  }
}

export async function fetchCryptoPrices(tickers) {
  const coinIds = tickers
    .map(t => cryptoMap[t.toUpperCase()])
    .filter(Boolean);
  if (coinIds.length === 0) return {};
  try {
    const res = await fetch(`${COINGECKO_BASE}/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd`);
    if (!res.ok) return {};
    const data = await res.json();
    const result = {};
    for (const [ticker, id] of Object.entries(cryptoMap)) {
      if (data[id]?.usd !== undefined) {
        result[ticker] = data[id].usd;
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function isCryptoTicker(ticker) {
  return !!cryptoMap[ticker.toUpperCase()];
}
