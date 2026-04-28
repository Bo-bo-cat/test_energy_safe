'use client';
import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
}

export default function PickerPage() {
  const [tab, setTab] = useState<'my' | 'recommended'>('my');
  const [systems, setSystems] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');

  useEffect(() => {
    fetchMySystems();
    fetchRecommended();
  }, []);

  async function fetchMySystems() {
    const token = getToken();
    if (!token) return;
    const res = await fetch(`${API}/systems/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setSystems(await res.json());
  }

  async function fetchRecommended() {
    const res = await fetch(`${API}/systems/recommended`);
    if (res.ok) setRecommended(await res.json());
  }

  function showNotification(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  }

  async function handleAdd() {
    if (!query.trim()) return;
    if (systems.length >= 6) {
      setError('Максимум 6 систем');
      return;
    }
    setLoading(true);
    setError('');
    const token = getToken();
    const res = await fetch(`${API}/systems/by-name`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ model: query.trim() }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.detail || 'Помилка. Перевірте назву системи.');
      return;
    }
    const system = await res.json();
    setSystems(prev => [...prev, system]);
    setQuery('');
  }

  async function handleDelete(id: string) {
    const token = getToken();
    await fetch(`${API}/systems/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setSystems(prev => prev.filter(s => s.id !== id));
  }

  async function handleCheckbox(id: string, current: boolean) {
    const token = getToken();
    const res = await fetch(`${API}/systems/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ selected_for_calculation: !current }),
    });
    if (res.ok) {
      setSystems(prev =>
        prev.map(s => s.id === id ? { ...s, selected_for_calculation: !current } : s)
      );
      if (!current) showNotification('Систему додано до розрахунку');
    }
  }

  async function handleAddRecommended(rec: any) {
    if (systems.length >= 6) {
      setError('Максимум 6 систем');
      setTab('my');
      return;
    }
    const token = getToken();
    const res = await fetch(`${API}/systems`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        model: rec.model,
        type: rec.type,
        power: rec.power,
        battery: rec.battery,
        autonomy: rec.autonomy,
        selected_for_calculation: false,
      }),
    });
    if (res.ok) {
      const system = await res.json();
      setSystems(prev => [...prev, system]);
      setTab('my');
      showNotification(`${rec.model} додано до ваших систем`);
    }
  }

  return (
    <div>
      <h1>Система</h1>

      {notification && (
        <div style={{ background: '#d4edda', color: '#155724', padding: '8px 14px', marginBottom: 12, borderRadius: 6 }}>
          {notification}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setTab('my')}
          style={{ fontWeight: tab === 'my' ? 'bold' : 'normal', padding: '6px 16px' }}
        >
          Мої системи
        </button>
        <button
          onClick={() => setTab('recommended')}
          style={{ fontWeight: tab === 'recommended' ? 'bold' : 'normal', padding: '6px 16px' }}
        >
          Рекомендації
        </button>
      </div>

      {tab === 'my' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Введіть назву ДБЖ (напр. EcoFlow RIVER 2)"
              style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }}
              disabled={loading}
            />
            <button
              onClick={handleAdd}
              disabled={loading || !query.trim() || systems.length >= 6}
              style={{ padding: '8px 16px' }}
            >
              {loading ? 'Пошук...' : 'Додати систему'}
            </button>
          </div>

          {error && <p style={{ color: 'red', marginBottom: 8 }}>{error}</p>}

          {systems.length === 0 && !loading && (
            <p style={{ color: '#888' }}>У вас ще немає доданих систем. Введіть назву ДБЖ або перейдіть у "Рекомендації".</p>
          )}

          {systems.map(sys => (
            <div
              key={sys.id}
              style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: '12px 16px', marginBottom: 10 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{sys.model}</div>
                  <div style={{ color: '#555', fontSize: 14 }}>Тип: {sys.type}</div>
                  <div style={{ color: '#555', fontSize: 14 }}>Потужність: {sys.power} Вт</div>
                  <div style={{ color: '#555', fontSize: 14 }}>Батарея: {sys.battery}</div>
                  <div style={{ color: '#555', fontSize: 14 }}>Автономія: {sys.autonomy}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
                  <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={sys.selected_for_calculation}
                      onChange={() => handleCheckbox(sys.id, sys.selected_for_calculation)}
                    />
                    До розрахунку
                  </label>
                  <button
                    onClick={() => handleDelete(sys.id)}
                    style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
                  >
                    Видалити
                  </button>
                </div>
              </div>
            </div>
          ))}

          {systems.length >= 6 && (
            <p style={{ color: '#888', fontSize: 13 }}>Досягнуто максимум 6 систем.</p>
          )}
        </div>
      )}

      {tab === 'recommended' && (
        <div>
          {recommended.map(rec => (
            <div
              key={rec.id}
              style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: '12px 16px', marginBottom: 10 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{rec.model}</div>
                  <div style={{ color: '#555', fontSize: 14 }}>Тип: {rec.type}</div>
                  <div style={{ color: '#555', fontSize: 14 }}>Потужність: {rec.power} Вт</div>
                  <div style={{ color: '#555', fontSize: 14 }}>Батарея: {rec.battery}</div>
                  <div style={{ color: '#555', fontSize: 14 }}>Автономія: {rec.autonomy}</div>
                </div>
                <button
                  onClick={() => handleAddRecommended(rec)}
                  disabled={systems.length >= 6}
                  style={{ fontSize: 22, padding: '0 12px', cursor: 'pointer' }}
                  title="Додати до моїх систем"
                >
                  +
                </button>
              </div>
            </div>
          ))}

          <p style={{ color: '#888', fontSize: 13, marginTop: 16 }}>
            Додайте рекомендовану систему до свого профілю, щоб протестувати розрахунок автономії.
          </p>
        </div>
      )}
    </div>
  );
}
