'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../context/LanguageContext';

export default function PickerPage() {
  const { t, lang } = useTranslation();
  const router = useRouter();

  const [recommendedSystems, setRecommendedSystems] = useState<any[]>([]);
  const [activeSystemId, setActiveSystemId] = useState<string | null>(null);
  
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [isLoadingSystems, setIsLoadingSystems] = useState(true);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);

  // 1. Завантажуємо список рекомендованих систем
  useEffect(() => {
    const fetchSystems = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/systems/recommended`);
        if (!res.ok) throw new Error('Помилка завантаження систем');
        const data = await res.json();
        setRecommendedSystems(data);
        if (data.length > 0) {
          setActiveSystemId(data[0].id);
        }
      } catch (err) {
        console.error(err);
        toast.error(lang === 'uk' ? 'Помилка завантаження рекомендацій' : 'Error loading recommendations');
      } finally {
        setIsLoadingSystems(false);
      }
    };
    fetchSystems();
  }, [lang]);

  // 2. Завантажуємо сценарії для активної системи
  useEffect(() => {
    if (!activeSystemId) return;
    
    const fetchScenarios = async () => {
      setIsLoadingScenarios(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/systems/recommended/${activeSystemId}/scenarios`);
        if (!res.ok) throw new Error('Помилка завантаження сценаріїв');
        const data = await res.json();
        setScenarios(data);
      } catch (err) {
        console.error(err);
        setScenarios([]);
      } finally {
        setIsLoadingScenarios(false);
      }
    };
    fetchScenarios();
  }, [activeSystemId]);

  // 3. Збереження сценарію в профіль користувача
  const handleSaveScenario = async (scenario: any) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error(lang === 'uk' ? 'Будь ласка, авторизуйтесь' : 'Please log in');
      return;
    }

    try {
      const activeSystem = recommendedSystems.find(s => s.id === activeSystemId);
      const sysRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/systems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          model: activeSystem.model,
          type: activeSystem.type,
          power: activeSystem.power,
          battery: activeSystem.battery,
          autonomy: activeSystem.autonomy,
          selected_for_calculation: true 
        })
      });
      const savedSystem = await sysRes.json();

      const scenarioPayload = {
        name: scenario.name,
        totalPowerWatts: scenario.total_power_watts,
        autonomyHours: scenario.autonomy_hours,
        selectedSystemId: savedSystem.id || savedSystem._id,
        devicesSnapshot: scenario.devices.map((d: any) => ({
          model_name: d.name,
          power_watts: d.power_watts,
          qty: 1
        }))
      };

      const scenRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scenarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(scenarioPayload)
      });

      if (!scenRes.ok) throw new Error('Failed to save scenario');

      toast.success(lang === 'uk' ? 'Сценарій успішно додано!' : 'Scenario successfully added!');
      router.push('/dashboard');

    } catch (err) {
      console.error(err);
      toast.error(lang === 'uk' ? 'Помилка збереження' : 'Error saving');
    }
  };

  return (
    <div className="global-page-wrap">
      <div className={styles.header}>
        <h1 className={styles.title}>
          {lang === 'uk' ? 'Підбір системи' : 'System Picker'}
        </h1>
        <p className={styles.subtitle}>
          {lang === 'uk' 
            ? 'Оберіть станцію та перегляньте, які життєві сценарії вона зможе забезпечити.' 
            : 'Choose a station and see what lifestyle scenarios it can support.'}
        </p>
      </div>

      {isLoadingSystems ? (
        <div className={styles.loading}>Завантаження систем...</div>
      ) : (
        <>
          {/* ДОДАНО: id="tour-recommended-systems" для інтерактивного туру */}
          <div className={`${styles.systemScroll} no-swipe`} id="tour-recommended-systems">
            {recommendedSystems.map(system => (
              <div 
                key={system.id} 
                className={`${styles.systemChip} ${activeSystemId === system.id ? styles.active : ''}`}
                onClick={() => setActiveSystemId(system.id)}
              >
                <span>{system.model}</span>
                <span className={styles.systemChipPower}>{system.power} Вт · {system.battery}</span>
              </div>
            ))}
          </div>

          {/* ДОДАНО: id="tour-system-scenarios" для інтерактивного туру */}
          <div className={styles.scenariosGrid} id="tour-system-scenarios">
            {isLoadingScenarios ? (
              <div className={styles.loading}>Формуємо сценарії...</div>
            ) : scenarios.length > 0 ? (
              scenarios.map((scenario, idx) => (
                <div key={idx} className={styles.scenarioCard}>
                  
                  <div className={styles.cardHeader}>
                    <h3 className={styles.scenarioTitle}>{scenario.name}</h3>
                    <div className={styles.autonomyBadge}>
                      ~ {scenario.autonomy_hours} {t.common.h}
                    </div>
                  </div>

                  <ul className={styles.deviceList}>
                    {scenario.devices.map((device: any, dIdx: number) => (
                      <li key={dIdx} className={styles.deviceItem}>
                        {device.name} <span style={{ opacity: 0.5, fontSize: '13px', marginLeft: '4px' }}>({device.power_watts} Вт)</span>
                      </li>
                    ))}
                  </ul>

                  <div className={styles.cardFooter}>
                    <div className={styles.totalPower}>
                      Навантаження: <span>{scenario.total_power_watts} Вт</span>
                    </div>
                    <button 
                      className={styles.addBtn}
                      onClick={() => handleSaveScenario(scenario)}
                    >
                      {lang === 'uk' ? 'Додати собі' : 'Add to my list'}
                    </button>
                  </div>

                </div>
              ))
            ) : (
              <div className={styles.loading}>Для цієї системи немає готових сценаріїв.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}