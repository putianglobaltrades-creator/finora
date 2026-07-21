import React, { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { useToast } from '../ui/Toast';

const CATEGORY_COLORS = ['#4F8CFF', '#34D399', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#6366F1', '#84CC16', '#A855F7'];

export default function Categories() {
  const { data, addCategory, deleteCategory } = useStore();
  const { showToast: toast } = useToast();
  const categories = data.categories;
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('expense');
  const [color, setColor] = useState('#4F8CFF');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name) return;
    if (categories.find(c => c.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Duplicate', 'Category already exists');
      return;
    }
    addCategory({ name, type, color });
    toast.success('Category Added', `${name} created`);
    setName('');
    setShowForm(false);
  };

  const handleDelete = (id, name) => {
    deleteCategory(id);
    toast.info('Category Removed', `${name} deleted`);
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');
  const transferCategories = categories.filter(c => c.type === 'transfer');

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Categories</h1>
            <p className="page-subtitle">{categories.length} total categories</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            {showForm ? 'Cancel' : 'New Category'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="glass-card" style={{ padding: 24, marginBottom: 20, animation: 'fadeInUp 0.3s ease-out' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Create Category</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="input-group">
              <label>Name</label>
              <div className="input-wrapper">
                <input type="text" placeholder="Category name" value={name} onChange={e => setName(e.target.value)} required />
              </div>
            </div>
            <div className="input-group">
              <label>Type</label>
              <div className="input-wrapper">
                <select value={type} onChange={e => setType(e.target.value)}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
            </div>
            <div className="input-group">
              <label>Color</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '6px 0' }}>
                {CATEGORY_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    style={{
                      width: 24, height: 24, borderRadius: '50%', background: c, border: color === c ? '3px solid var(--text-primary)' : '2px solid transparent',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }} />
                ))}
              </div>
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Create Category</button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {[
          { title: 'Expense Categories', items: expenseCategories },
          { title: 'Income Categories', items: incomeCategories },
          { title: 'Transfers', items: transferCategories },
        ].map(section => (
          <div key={section.title} className="glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
              {section.title}
            </h3>
            {section.items.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No categories</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {section.items.map(cat => (
                  <div key={cat.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)', transition: 'var(--transition)',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color || 'var(--primary)', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500, textTransform: 'capitalize' }}>{cat.name}</span>
                    <button className="tx-action-btn danger:hover" onClick={() => handleDelete(cat.id, cat.name)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
