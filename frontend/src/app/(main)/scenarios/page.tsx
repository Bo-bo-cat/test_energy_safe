'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import Link from 'next/link';

import { DeleteIcon } from '../../../components/icons/Delete'; 
import { PenIcon } from '../../../components/icons/Pen'; 
import { DecisionModal } from '../../../components/DecisionModal/DecisionModal';
import { SaveScenarioModal } from '../../../components/SaveScenarioModal/SaveScenarioModal';
import { ScenarioDetailsModal } from '../../../components/ScenarioDetailsModal/ScenarioDetailsModal'; 
import { useTranslation } from '../../../context/LanguageContext';

export default function ScenariosPage() {
  const { t } = useTranslation();

  const [scenarios, setScenarios] = useState<any[]>([]);
  
  // Стейти для всіх приладів та систем (щоб шукати їхні назви по ID)
  const [allDevices, setAllDevices] = useState<any[]>([]);
  const [allSystems, setAllSystems] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [viewingScenario, setViewingScenario] = useState<any | null>(null);
  const [scenarioToDelete, setScenarioToDelete] = useState<string | null>(null);
  const [editingScenario, setEditingScenario] = useState<{ id: string, name: string } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Одночасно завантажуємо сценарії, прилади та системи з перевіркою формату (масив чи об'єкт)
  const fetchData = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const [scenRes, devRes, sysRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/scenarios`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/systems`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
      ]);

      if (scenRes && scenRes.ok) {
        const data = await scenRes.json();
        setScenarios(Array.isArray(data) ? data : (data.items || data.data || []));
      }
      if (devRes && devRes.ok) {
        const data = await devRes.json();
        setAllDevices(Array.isArray(data) ? data : (data.items || data.devices || data.data || []));
      }
      if (sysRes && sysRes.ok) {
        const data = await sysRes.json();
        setAllSystems(Array.isArray(data) ? data : (data.items || data.systems || data.data || []));
      }

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (id: string) => {
    setSelectedScenarioId(prev => prev === id ? null : id);
  };

  // ФУНКЦІЯ: Бронебійне зіставлення ID з реальними назвами
  const handleOpenInfo = (e: React.MouseEvent, scenario: any) => {
    e.stopPropagation();

    // Дістаємо ID приладів (враховуємо обидва формати написання)
    const deviceIds = scenario.selectedDeviceIds || scenario.selected_device_ids || [];
    
    const matchedDevices = deviceIds.map((id: any) => {
      const strId = String(id);
      const device = allDevices.find(d => String(d.id) === strId || String(d._id) === strId);
      
      // Якщо прилад видалений з бази, але залишився в сценарії
      if (!device) {
        return { name: `Видалений прилад`, power_watts: 0 };
      }

      // Шукаємо ім'я та потужність по всіх можливих полях!
      return { 
        name: device.name || device.model || device.title || device.deviceName || 'Прилад без назви', 
        power_watts: device.power || device.powerW || device.power_watts || device.powerWatts || 0 
      };
    });

    // Знаходимо ДБЖ
    const sysId = scenario.selectedSystemId || scenario.selected_system_id;
    let system_model = null;
    
    if (sysId) {
      const strSysId = String(sysId);
      const matchedSystem = allSystems.find(s => String(s.id) === strSysId || String(s._id) === strSysId);
      
      if (matchedSystem) {
         system_model = matchedSystem.model || matchedSystem.name || matchedSystem.title || 'Моя система';
      } else {
         system_model = `Видалена система`;
      }
    }

    setViewingScenario({
      ...scenario,
      devices: matchedDevices,
      system_model: system_model
    });
  };

  return (
    <div className="global-page-wrap">
      <h1 className="page-title">{t.scenarios.title}</h1>

      {isLoading ? (
        <p style={{ color: 'var(--text-muted)' }}>{t.scenarios.loading}</p>
      ) : (
        <div className={styles.grid}>
          {scenarios.map(scenario => {
            const powerWatts = scenario.totalPowerWatts || scenario.total_power_watts || 0;
            const autonomyHours = scenario.autonomyHours || scenario.duration_hours || 0;
            const loadPercent = scenario.loadPercent || scenario.load_percent || 0;
            
            const isSelected = selectedScenarioId === scenario.id;

            return (
              <div 
                key={scenario.id} 
                className={`${styles.card} ${isSelected ? styles.selected : ''}`}
                onClick={() => handleCardClick(scenario.id)}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    {scenario.name}
                    
                    <span 
                      className={styles.infoMarker}
                      onClick={(e) => handleOpenInfo(e, scenario)}
                    >
                      i
                    </span>
                  </div>
                  
                  <div className={styles.actions}>
                    <button 
                      className={styles.iconBtn} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingScenario({ id: scenario.id, name: scenario.name });
                      }}
                    >
                      <PenIcon/>
                    </button>
                    <button 
                      className={`${styles.iconBtn} ${styles.deleteBtn}`} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setScenarioToDelete(scenario.id);
                      }}
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </div>

                <div>
                  <div className={styles.statsRow}>
                    <div className={styles.statBox}>
                      <span className={styles.statValue}>{powerWatts}</span>
                      <span className={styles.statLabel}>{t.common.w}</span>
                    </div>
                    <div className={styles.statBox}>
                      <span className={styles.statValue}>~{Number(autonomyHours).toFixed(1)}</span>
                      <span className={styles.statLabel}>{t.common.h}</span>
                    </div>
                    <div className={styles.statBox}>
                      <span className={styles.statValue}>{Math.round(loadPercent)}%</span>
                      <span className={styles.statLabel}>{t.scenarios.inverterSuffix || 'інвертор'}</span>
                    </div>
                  </div>
                  <div className={styles.progressContainer}>
                    <div 
                      className={styles.progressFill} 
                      style={{ 
                        width: `${Math.min(loadPercent, 100)}%`, 
                        backgroundColor: loadPercent > 66 ? '#FF2D55' : loadPercent > 33 ? '#FF9500' : '#34C759' 
                      }} 
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <Link href="/calculator" className={`${styles.card} ${styles.addCard}`}>
            <div className={styles.addIcon}>+</div>
            <div className={styles.addText}>{t.scenarios.addScenario}</div>
          </Link>
        </div>
      )}

      <ScenarioDetailsModal 
        isOpen={viewingScenario !== null}
        onClose={() => setViewingScenario(null)}
        scenario={viewingScenario}
      />

      <DecisionModal 
        isOpen={scenarioToDelete !== null}
        onClose={() => setScenarioToDelete(null)}
        onConfirm={async () => {
            const token = localStorage.getItem('access_token');
            const id = scenarioToDelete;
            setScenarioToDelete(null);
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scenarios/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        }}
        title={t.scenarios.deleteConfirm}
        confirmText={t.common.yes}
        cancelText={t.common.no}
      />
      
      <SaveScenarioModal 
        isOpen={editingScenario !== null}
        onClose={() => setEditingScenario(null)}
        onSave={async (newName) => {
          setIsRenaming(true);
          const token = localStorage.getItem('access_token');
          try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scenarios/${editingScenario?.id}`, {
              method: 'PATCH', 
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ name: newName })
            });
            fetchData(); 
          } finally {
            setIsRenaming(false);
            setEditingScenario(null);
          }
        }}
        isLoading={isRenaming}
        title={t.scenarios.renameModal}
        initialName={editingScenario?.name || ''}
      />
    </div>
  );
}