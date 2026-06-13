'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../context/LanguageContext';

export default function PickerPage() {
  const { t, lang } = useTranslation();
  const router = useRouter();

  // Стейт вкладок: 'recommended' - готові сценарії, 'custom' - додати свою систему
  const [activeTab, setActiveTab] = useState<'recommended' | 'custom'>('recommended');

  // Стейт для каталогу та сценаріїв
  const [recommendedSystems, setRecommendedSystems] = useState<any[]>([]);
  const [activeSystemId, setActiveSystemId] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [isLoadingSystems, setIsLoadingSystems] = useState(true);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);

  // Стейт для ШІ-пошуку системи
  const [aiModelName, setAiModelName] = useState('');
  const [isAiSubmitting, setIsAiSubmitting] = useState(false);

  // Стейт для ручного додавання системи
  const [manualForm, setManualForm] = useState({
    model: '',
    type: 'ДБЖ',
    power: '',
    battery: '',
    autonomy: '–'
  });
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);

  // 1. Завантаження каталогу рекомендованих станцій
  useEffect(() => {
    const fetchSystems = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/systems/recommended`);
        if (!res.ok) throw new Error('Помилка завантаження');
        const data = await res.json();
        setRecommendedSystems(data);
        if (data.length > 0) setActiveSystemId(data[0].id);
      } catch (err) {
        console.error(err);
        toast.error(lang === 'uk' ? 'Помилка завантаження рекомендацій' : 'Error loading recommendations');
      } finally {
        setIsLoadingSystems(false);
      }
    };
    fetchSystems();
  }, [lang]);

  // 2. Завантаження сценаріїв для активної станції
  useEffect(() => {
    if (!activeSystemId || activeTab !== 'recommended') return;
    
    const fetchScenarios = async () => {
      setIsLoadingScenarios(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/systems/recommended/${activeSystemId}/scenarios`);
        if (!res.ok) throw new Error('Помилка');
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
  }, [activeSystemId, activeTab]);

  // 3. Додавання готового сценарію у профіль користувача
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

      if (!scenRes.ok) throw new Error();

      toast.success(lang === 'uk' ? 'Сценарій додано!' : 'Scenario added!');
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error(lang === 'uk' ? 'Помилка збереження' : 'Error saving');
    }
  };

  // 4. Логіка автоматичного ШІ-пошуку системи за назвою
  const handleAiSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiModelName.trim()) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error(lang === 'uk' ? 'Будь ласка, авторизуйтесь' : 'Please log in');
      return;
    }

    setIsAiSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/systems/by-name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ model: aiModelName.trim() })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Помилка пошуку');
      }

      toast.success(lang === 'uk' ? 'Систему знайдено та додано за допомогою ШІ!' : 'System found and added via AI!');
      setAiModelName('');
      router.push('/calculator'); // Перекидаємо в калькулятор, де система вже доступна
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || (lang === 'uk' ? 'Не вдалося розпізнати модель' : 'Failed to parse model'));
    } finally {
      setIsAiSubmitting(false);
    }
  };

  // 5. Логіка ручного створення власної системи
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.model.trim() || !manualForm.power || !manualForm.battery.trim()) {
      toast.error(lang === 'uk' ? 'Заповніть обов’язкові поля' : 'Fill required fields');
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error(lang === 'uk' ? 'Будь ласка, авторизуйтесь' : 'Please log in');
      return;
    }

    setIsManualSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/systems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          model: manualForm.model.trim(),
          type: manualForm.type,
          power: parseFloat(manualForm.power),
          battery: manualForm.battery.trim(),
          autonomy: manualForm.autonomy.trim() || '–',
          selected_for_calculation: true // Одразу вибираємо її для калькулятора
        })
      });

      if (!res.ok) throw new Error();

      toast.success(lang === 'uk' ? 'Власну систему успішно створено!' : 'Custom system created successfully!');
      router.push('/calculator');
    } catch (err) {
      console.error(err);
      toast.error(lang === 'uk' ? 'Помилка створення системи' : 'Error creating system');
    } finally {
      setIsManualSubmitting(false);
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
            ? 'Оберіть готовий пресет або додайте характеристики свого власного обладнання.' 
            : 'Choose a ready preset or add the specifications of your own equipment.'}
        </p>
      </div>

      {/* Перемикач вкладок */}
      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tab} ${activeTab === 'recommended' ? styles.active : ''}`}
          onClick={() => setActiveTab('recommended')}
        >
          {lang === 'uk' ? '🌟 Готові сценарії' : '🌟 Ready-made Scenarios'}
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'custom' ? styles.active : ''}`}
          onClick={() => setActiveTab('custom')}
        >
          {lang === 'uk' ? '➕ Додати власне ДБЖ' : '➕ Add Custom UPS'}
        </button>
      </div>

      {/* ВКЛАДКА 1: РЕКОМЕНДОВАНІ СЦЕНАРІЇ */}
      {activeTab === 'recommended' && (
        isLoadingSystems ? (
          <div className={styles.loading}>Завантаження систем...</div>
        ) : (
          <>
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
                      <button className={styles.addBtn} onClick={() => handleSaveScenario(scenario)}>
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
        )
      )}

      {/* ВКЛАДКА 2: ДОДАТИ ВЛАСНУ СИСТЕМУ (ШІ ПОШУК ТА ВРУЧНУ) */}
      {activeTab === 'custom' && (
        <div className={styles.formsWrapper}>
          
          {/* ФОРМА 1: Розумний ШІ-пошук за назвою моделей */}
          <div className={styles.formBlock}>
            <h2 className={styles.formTitle}>
              {lang === 'uk' ? '✨ Розумний пошук станції через ШІ' : '✨ Smart AI Station Lookup'}
            </h2>
            <form onSubmit={handleAiSearchSubmit}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  {lang === 'uk' ? 'Назва або модель пристрою' : 'Device name or model'}
                </label>
                <div className={styles.formRow}>
                  <input 
                    type="text" 
                    className={styles.input}
                    placeholder="Напр. Bluetti EB3A або EcoFlow Delta Pro"
                    value={aiModelName}
                    onChange={(e) => setAiModelName(e.target.value)}
                    required
                  />
                  <button 
                    type="submit" 
                    className={styles.addBtn} 
                    style={{ padding: '0 24px', whiteSpace: 'nowrap' }}
                    disabled={isAiSubmitting || !aiModelName.trim()}
                  >
                    {isAiSubmitting ? (lang === 'uk' ? 'Аналіз...' : 'Parsing...') : (lang === 'uk' ? 'Знайти' : 'Find')}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* ФОРМА 2: Повне ручне додавання */}
          <div className={styles.formBlock}>
            <h2 className={styles.formTitle}>
              {lang === 'uk' ? '✍️ Ввести характеристики вручную' : '✍️ Enter Specifications Manually'}
            </h2>
            <form onSubmit={handleManualSubmit}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>{lang === 'uk' ? 'Назва моделі *' : 'Model Name *'}</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="Напр. Volt Polska 500"
                  value={manualForm.model}
                  onChange={(e) => setManualForm({...manualForm, model: e.target.value})}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>{lang === 'uk' ? 'Тип системи' : 'System Type'}</label>
                  <select 
                    className={styles.select}
                    value={manualForm.type}
                    onChange={(e) => setManualForm({...manualForm, type: e.target.value})}
                  >
                    <option value="ДБЖ">{lang === 'uk' ? 'ДБЖ (Інвертор)' : 'UPS (Inverter)'}</option>
                    <option value="Портативна електростанція">{lang === 'uk' ? 'Зарядна станція' : 'Power Station'}</option>
                    <option value="Генератор">{lang === 'uk' ? 'Генератор' : 'Generator'}</option>
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>{lang === 'uk' ? 'Потужність (Вт) *' : 'Power (Watts) *'}</label>
                  <input 
                    type="number" 
                    className={styles.input} 
                    placeholder="600"
                    value={manualForm.power}
                    onChange={(e) => setManualForm({...manualForm, power: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>{lang === 'uk' ? 'Ємність батареї *' : 'Battery Capacity *'}</label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    placeholder="Напр. 1024 Wh або 100Ah 12V"
                    value={manualForm.battery}
                    onChange={(e) => setManualForm({...manualForm, battery: e.target.value})}
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>{lang === 'uk' ? 'Час автономії (опціонально)' : 'Autonomy Time (optional)'}</label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    placeholder="Напр. 4 год"
                    value={manualForm.autonomy}
                    onChange={(e) => setManualForm({...manualForm, autonomy: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className={styles.submitBtn}
                disabled={isManualSubmitting}
              >
                {isManualSubmitting ? (lang === 'uk' ? 'Збереження...' : 'Saving...') : (lang === 'uk' ? 'Створити систему' : 'Create System')}
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  );
}