import React, { useState, useMemo } from 'react';
import { fetchCryptoPrice } from '../../utils/marketPrices';

const COINS = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'solana', name: 'Solana', symbol: 'SOL' },
  { id: 'ripple', name: 'XRP', symbol: 'XRP' },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
  { id: 'polkadot', name: 'Polkadot', symbol: 'DOT' },
  { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX' },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE' },
  { id: 'matic-network', name: 'Polygon', symbol: 'MATIC' },
  { id: 'chainlink', name: 'Chainlink', symbol: 'LINK' },
  { id: 'litecoin', name: 'Litecoin', symbol: 'LTC' },
  { id: 'uniswap', name: 'Uniswap', symbol: 'UNI' },
  { id: 'cosmos', name: 'Cosmos', symbol: 'ATOM' },
  { id: 'tron', name: 'TRON', symbol: 'TRX' },
  { id: 'stellar', name: 'Stellar', symbol: 'XLM' },
  { id: 'near', name: 'NEAR Protocol', symbol: 'NEAR' },
  { id: 'bitcoin-cash', name: 'Bitcoin Cash', symbol: 'BCH' },
  { id: 'ethereum-classic', name: 'Ethereum Classic', symbol: 'ETC' },
  { id: 'vechain', name: 'VeChain', symbol: 'VET' },
  { id: 'filecoin', name: 'Filecoin', symbol: 'FIL' },
];

export default function AddCryptoModal({ onClose, onAdd }) {
  const [search, setSearch] = useState('');
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [amount, setAmount] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [wallet, setWallet] = useState('');
  const [notes, setNotes] = useState('');
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [closing, setClosing] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return COINS;
    const q = search.toLowerCase();
    return COINS.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
  }, [search]);

  const handleSelectCoin = async (coin) => {
    setSelectedCoin(coin);
    setSearch('');
    setFetchingPrice(true);
    try {
      const price = await fetchCryptoPrice(coin.symbol);
      if (price) setBuyPrice(price.toString());
    } catch {}
    setFetchingPrice(false);
  };

  const handleSubmit = async () => {
    if (!selectedCoin || !amount || !buyPrice || closing) return;
    setClosing(true);
    await new Promise(r => setTimeout(r, 300));
    await onAdd({
      coinId: selectedCoin.id,
      coinName: selectedCoin.name,
      symbol: selectedCoin.symbol,
      amount: parseFloat(amount),
      buyPrice: parseFloat(buyPrice),
      purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
      wallet: wallet || '',
      notes: notes || '',
    });
  };

  const totalCost = (parseFloat(amount) || 0) * (parseFloat(buyPrice) || 0);

  return (
    <div className={`modal-overlay${closing ? ' closing' : ''}`} onClick={onClose}>
      <div className={`modal-glass${closing ? ' closing' : ''}`} onClick={e => e.stopPropagation()} style={{ maxWidth: 480, width: '90%' }}>
        <div className="acm-header">
          <h2>Add Cryptocurrency</h2>
          <button className="acm-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="acm-body">
          {!selectedCoin ? (
            <>
              <div className="input-group">
                <label>Search or select a cryptocurrency</label>
                <div className="input-wrapper">
                  <input type="text" placeholder="Type to search..." value={search}
                    onChange={e => setSearch(e.target.value)} autoFocus />
                </div>
              </div>
              <div className="acm-coin-list">
                {filtered.map(c => (
                  <button key={c.id} className="acm-coin-item" onClick={() => handleSelectCoin(c)}>
                    <span className="acm-coin-symbol">{c.symbol}</span>
                    <span className="acm-coin-name">{c.name}</span>
                    <svg className="acm-coin-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                ))}
                {search && filtered.length === 0 && (
                  <div className="acm-no-results">No coins found</div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="acm-selected-header">
                <div className="acm-selected-coin">
                  <span className="acm-selected-symbol">{selectedCoin.symbol}</span>
                  <span className="acm-selected-name">{selectedCoin.name}</span>
                </div>
                <button className="acm-change-btn" onClick={() => { setSelectedCoin(null); setBuyPrice(''); }}>Change</button>
              </div>
              <div className="acm-fields">
                <div className="input-group">
                  <label>Amount</label>
                  <div className="input-wrapper">
                    <input type="number" step="any" min="0" placeholder="0.005" value={amount}
                      onChange={e => setAmount(e.target.value)} autoFocus />
                  </div>
                </div>
                <div className="input-group">
                  <label>Purchase Price (USD)</label>
                  <div className="input-wrapper">
                    <input type="number" step="any" min="0" placeholder="45000" value={buyPrice}
                      onChange={e => setBuyPrice(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="acm-fields">
                <div className="input-group">
                  <label>Purchase Date</label>
                  <div className="input-wrapper">
                    <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
                  </div>
                </div>
                <div className="input-group">
                  <label>Wallet</label>
                  <div className="input-wrapper">
                    <input type="text" placeholder="Binance, MetaMask..." value={wallet}
                      onChange={e => setWallet(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="input-group">
                <label>Notes (optional)</label>
                <div className="input-wrapper">
                  <input type="text" placeholder="Any details..." value={notes}
                    onChange={e => setNotes(e.target.value)} />
                </div>
              </div>
              <div className="acm-summary">
                <div className="acm-summary-row">
                  <span>Amount</span><span>{amount || '0'} {selectedCoin.symbol}</span>
                </div>
                <div className="acm-summary-row">
                  <span>Buy Price</span><span>${parseFloat(buyPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="acm-summary-row">
                  <span>Total</span><span>${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              <button className="btn btn-primary" onClick={handleSubmit} style={{ width: '100%', marginTop: 10 }}>
                Add {selectedCoin.symbol}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
