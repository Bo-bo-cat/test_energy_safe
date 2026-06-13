'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

import { CheckboxIcon } from '../../../components/icons/Checkbox';
import { CheckboxCheckedIcon } from '../../../components/icons/Checkbox_checked';
import { DeleteIcon } from '../../../components/icons/Delete'; 
import { PenIcon } from '../../../components/icons/Pen'; 
import { SystemIcon } from '../../../components/icons/System'; 
import { DecisionModal } from '../../../components/DecisionModal/DecisionModal';
import { AddSystemModal } from '../../../components/AddSystemModal/AddSystemModal';
import { useTranslation } from '../../../context/LanguageContext';

const API = process.env.NEXT_PUBLIC_API_URL;

const cleanModelName = (name: string, fallback: string) => {
  if (!name) return fallback;
  if (name.includes(' - ')) return name.split(' - ')[1].trim();
  return name;
};

export default function SystemsPage() {
  const { t, lang } = useTranslation();
  const router = useRouter();

  const [tab, setTab] = useState<'my' | 'recommended' | 'scenarios'>('my');
  
  const [systems, setSystems] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]); 
  
  const [query, setQuery] = useState('');
  const [systemToDelete, setSystemToDelete] = useState<string | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState<{ model: string; power: string; battery: string } | null>(null);
  const [editingSystem, setEditingSystem] = useState<any | null>(null);
  const [hiddenAutonomy, setHiddenAutonomy] = useState('');
  const [hiddenType, setHiddenType] = useState('ДБЖ / Власна збірка');

  useEffect(() => {
    fetchMySystems();
    fetchRecommended();
    fetchScenarios();
  }, []);

  async function fetchMySystems() {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const res = await fetch(`${API}/systems/my`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setSystems(await res.json() || []);
    } catch (err) { console.error(err); }
  }

  async function fetchRecommended() {
    try {
      const res = await fetch(`${API}/systems/recommended`);
      if (res.ok) setRecommended(await res.json() || []);
    } catch (err) { console.error(err); }
  }

  async function fetchScenarios() {
    try {
      const res = await fetch(`${API}/systems/recommended/all-scenarios`);
      if (res.ok) setScenarios(await res.json() || []);
    } catch (err) { console.error(err); }
  }

  const handleSaveScenario = async (scenario: any) => {
    const token = localStorage.getItem('access_token');
    if (!token) { toast.error(lang === 'uk' ? 'Будь ласка, авторизуйтесь' : 'Please log in'); return; }

    const toastId = toast.loading(lang === 'uk' ? 'Збереження...' : 'Saving...');
    try {
      const sysRes = await fetch(`${API}/systems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          model: scenario.system_model || 'Станція зі сценарію',
          type: 'Портативна електростанція',
          power: scenario.total_power_watts * 1.2, 
          battery: scenario.autonomy_hours + "h capacity",
          autonomy: scenario.autonomy_hours,
          selected_for_calculation: true 
        })
      });
      const savedSystem = await sysRes.json();

      await fetch(`${API}/scenarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: scenario.name,
          totalPowerWatts: scenario.total_power_watts,
          autonomyHours: scenario.autonomy_hours,
          selectedSystemId: savedSystem.id || savedSystem._id,
          devicesSnapshot: scenario.devices.map((d: any) => ({ model_name: d.name, power_watts: d.power_watts, qty: 1 }))
        })
      });

      toast.dismiss(toastId);
      toast.success(lang === 'uk' ? 'Сценарій успішно додано!' : 'Scenario successfully added!');
      router.push('/dashboard');
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(t.common.error || 'Помилка');
    }
  };

  const handleAddByName = async () => {
    if (!query.trim()) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;
    const toastId = toast.loading(lang === 'uk' ? 'Пошук характеристик...' : 'Searching specs...');
    try {
      const res = await fetch(`${API}/systems/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ model: query })
      });
      if (res.ok) {
        const data = await res.json();
        setQuery('');
        toast.dismiss(toastId);
        setModalInitialData({ model: data.model || query, power: data.power ? String(data.power) : '', battery: data.battery ? String(data.battery) : '' });
        setHiddenAutonomy(data.autonomy || '');
        setHiddenType(data.type || 'ДБЖ / Власна збірка');
        setIsCustomModalOpen(true);
      } else {
        toast.dismiss(toastId);
        toast.error(lang === 'uk' ? 'Систему не знайдено' : 'System not found');
      }
    } catch (err) { 
      toast.dismiss(toastId);
      toast.error(t.common.error || 'Помилка');
    }
  };

  const handleOpenEmptyModal = () => { setModalInitialData(null); setHiddenAutonomy(''); setHiddenType('ДБЖ / Власна збірка'); setIsCustomModalOpen(true); };
  
  const handleCreateCustomSystem = async (formData: any) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    const res = await fetch(`${API}/systems`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...formData, power: Number(formData.power), type: hiddenType, autonomy: hiddenAutonomy || '-', selected_for_calculation: true }),
    });
    if (res.ok) { setIsCustomModalOpen(false); fetchMySystems(); toast.success(lang === 'uk' ? 'Систему збережено' : 'System saved'); }
  };
  
  const handleUpdateSystem = async (formData: any) => {
    if (!editingSystem) return;
    const token = localStorage.getItem('access_token');
    const res = await fetch(`${API}/systems/${editingSystem.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ model: formData.model, power: Number(formData.power), battery: formData.battery }),
    });
    if (res.ok) { setEditingSystem(null); fetchMySystems(); toast.success(lang === 'uk' ? 'Систему оновлено' : 'System updated'); }
  };
  
  const handleAddRecommended = async (rec: any) => {
    const token = localStorage.getItem('access_token');
    const res = await fetch(`${API}/systems`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ model: rec.model, type: rec.type, power: rec.power, battery: rec.battery, autonomy: rec.autonomy, selected_for_calculation: true }),
    });
    if (res.ok) { fetchMySystems(); toast.success(lang === 'uk' ? 'Систему додано' : 'System added'); }
  };
  
  const confirmDelete = async () => {
    if (!systemToDelete) return;
    const token = localStorage.getItem('access_token');
    await fetch(`${API}/systems/${systemToDelete}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setSystemToDelete(null); fetchMySystems(); toast.success(lang === 'uk' ? 'Систему видалено' : 'System deleted');
  };
  
  const handleToggleSelect = async (id: string, currentState: boolean) => {
    const token = localStorage.getItem('access_token');
    await fetch(`${API}/systems/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ selected_for_calculation: !currentState })
    });
    fetchMySystems();
  };

  return (
    <div className="global-page-wrap">
      <h1 className="page-title" style={{color: 'var(--accent-orange)'}}>Система</h1>

      <div className={styles.tabs}>
        <button className={`${styles.tabBtn} ${tab === 'my' ? styles.active : ''}`} onClick={() => setTab('my')}>
          {t.picker.tabMy}
        </button>
        <button className={`${styles.tabBtn} ${tab === 'recommended' ? styles.active : ''}`} onClick={() => setTab('recommended')}>
          {t.picker.tabRec}
        </button>
        <button className={`${styles.tabBtn} ${tab === 'scenarios' ? styles.active : ''}`} onClick={() => setTab('scenarios')}>
          Рекомендовані сценарії
        </button>
      </div>

      <div className={styles.mainCard}>
        {tab === 'my' && (
          <>
            <h2 className={styles.sectionTitle}>{t.picker.enterYours || 'Введіть вашу систему'}</h2>
            <div className={styles.topControls}>
              <input 
                type="text" className={styles.addInput} placeholder={t.picker.inputPlaceholder || 'Наприклад: EcoFlow'} 
                value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddByName()}
              />
              <button className={styles.addBtn} onClick={handleAddByName}>{t.picker?.findSystem || 'Знайти систему'}</button>
              <button className={styles.customSysBtn} onClick={handleOpenEmptyModal}>{t.picker?.addCustomSystem || 'Додати свою систему'}</button>
            </div>

            {systems.length === 0 ? (
              <div className={styles['empty-state']}>
                <div className={styles['empty-icon-wrap']}><SystemIcon className={styles['empty-svg']} /></div>
                <h3 className={styles['empty-title']}>{lang === 'uk' ? 'Немає систем' : 'No systems'}</h3>
                <p className={styles['empty-desc']}>{lang === 'uk' ? 'Ви ще не додали жодної системи. Знайдіть її в базі або додайте вручну.' : 'Add your first system.'}</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {systems.map((item) => (
                  <div key={item.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <div className={styles.cardTitle}>{cleanModelName(item.model, t.common.model || 'Модель')}</div>
                      <div className={styles.cardActions}>
                        <button className={styles.iconBtn} onClick={() => setEditingSystem(item)}><PenIcon className={styles.actionIconGray} /></button>
                        <button className={styles.iconBtn} onClick={() => setSystemToDelete(item.id)}><DeleteIcon className={styles.actionIconOrange} /></button>
                      </div>
                    </div>
                    <div className={styles.specs}>
                      <div className={styles.specRow}><span className={styles.specLabel}>{t.common.power || 'Потужність'}</span><span className={styles.specValue}>{item.power} Вт</span></div>
                      <div className={styles.specRow}><span className={styles.specLabel}>{t.common.battery || 'Батарея'}</span><span className={styles.specValue}>{item.battery}</span></div>
                    </div>
                    <div className={styles.calcRow} onClick={() => handleToggleSelect(item.id, item.selected_for_calculation)}>
                      <span className={styles.calcLabel}>{item.selected_for_calculation ? 'У розрахунку' : t.picker.addToCalc || 'Додати до розрахунку'}</span>
                      {item.selected_for_calculation ? <CheckboxCheckedIcon className={styles.actionIconOrange} /> : <CheckboxIcon className={styles.actionIconGray} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'recommended' && (
          <div className={styles.grid}>
            {recommended.map((item) => (
              <div key={item.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>{item.model}</div>
                  <button className={styles.iconBtn} onClick={() => handleAddRecommended(item)}><span className={styles.plusIconTop}>+</span></button>
                </div>
                <div className={styles.specs}>
                  <div className={styles.specRow}><span className={styles.specLabel}>{t.common.power || 'Потужність'}</span><span className={styles.specValue}>{item.power} Вт</span></div>
                  <div className={styles.specRow}><span className={styles.specLabel}>{t.common.battery || 'Батарея'}</span><span className={styles.specValue}>{item.battery}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'scenarios' && (
          <div className={styles.scenariosGrid}>
            {scenarios.map((scen, idx) => (
              <div key={idx} className={styles.scenarioCard}>
                <div className={styles.scenHeader}>
                  <div className={styles.scenTitle}>{scen.name}</div>
                  <div className={styles.scenBadge}>~{scen.autonomy_hours} год</div>
                </div>
                <p className={styles.scenDevices}>{scen.devices?.map((d: any) => d.name).join(', ')}</p>
                <div className={styles.scenFooter}>
                   <span className={styles.scenPower}>{scen.total_power_watts} Вт</span>
                   <button className={styles.orangeBtnFull} onClick={() => handleSaveScenario(scen)}>Додати цей сценарій</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddSystemModal isOpen={isCustomModalOpen || editingSystem !== null} onClose={() => { setIsCustomModalOpen(false); setEditingSystem(null); }} onSave={editingSystem ? handleUpdateSystem : handleCreateCustomSystem} initialData={editingSystem ? { model: editingSystem.model, power: String(editingSystem.power), battery: editingSystem.battery } : modalInitialData} title={editingSystem ? 'Редагувати систему' : undefined} />
      <DecisionModal isOpen={systemToDelete !== null} onClose={() => setSystemToDelete(null)} onConfirm={confirmDelete} title={t.picker.deleteSystem || 'Видалити систему?'} confirmText={t.common.yes || 'Так'} cancelText={t.common.no || 'Ні'} />
    </div>
  );
}