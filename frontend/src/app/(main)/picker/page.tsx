'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function PickerPage() {
  const router = useRouter();

  // Три вкладки, як ви просили
  const [activeTab, setActiveTab] = useState<'my' | 'catalog' | 'scenarios'>('my');

  const [mySystems, setMySystems] = useState<any[]>([]);
  const [catalogSystems, setCatalogSystems] = useState<any[]>([]);
  const [readyScenarios, setReadyScenarios] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('access_token');
    try {
      const [myRes, catRes, scenRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/systems/my`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/systems/recommended`).catch(() => null),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/systems/recommended/all-scenarios`).catch(() => null)
      ]);

      if (myRes && myRes.ok) setMySystems(await myRes.json());
      if (catRes && catRes.ok) setCatalogSystems(await catRes.json());
      if (scenRes && scenRes.ok) setReadyScenarios(await scenRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) return;
    toast.success('Пошук системи: ' + searchQuery);
    // Тут буде логіка вашого ШІ-пошуку
  };

  const handleAddCustom = () => {
    toast.success('Відкриття форми ручного додавання');
  };

  return (
    <div className="global-page-wrap">
      <h1 className={styles.pageTitle}>Система</h1>

      <div className={styles.tabsWrapper}>
        <button 
          className={`${styles.tab} ${activeTab === 'my' ? styles.active : ''}`}
          onClick={() => setActiveTab('my')}
        >
          Мої системи
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'catalog' ? styles.active : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          Рекомендовані
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'scenarios' ? styles.active : ''}`}
          onClick={() => setActiveTab('scenarios')}
        >
          Рекомендовані сценарії
        </button>
      </div>

      <div className={styles.mainCard}>
        {/* ВКЛАДКА 1: МОЇ СИСТЕМИ (Точна копія зі скріншоту) */}
        {activeTab === 'my' && (
          <>
            <h2 className={styles.cardHeading}>Введіть вашу систему</h2>
            <div className={styles.searchRow}>
              <input 
                type="text" 
                className={styles.searchInput} 
                placeholder="Наприклад: EcoFlow"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className={styles.orangeBtn} onClick={handleSearchSubmit}>
                Знайти систему
              </button>
              <button className={styles.blackBtn} onClick={handleAddCustom}>
                Додати свою систему
              </button>
            </div>

            {mySystems.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="7" width="14" height="14" rx="2" fill="currentColor" />
                    <path d="M8 4h8v3H8z" fill="currentColor" />
                    <path d="M8.5 14h3m-1.5-1.5v3m3.5-1.5h3" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className={styles.emptyTitle}>Немає систем</h3>
                <p className={styles.emptyText}>
                  Ви ще не додали жодної системи резервного живлення.<br />
                  Знайдіть її в базі або додайте вручну.
                </p>
              </div>
            ) : (
              <div className={styles.systemsGrid}>
                {mySystems.map((sys: any) => (
                  <div key={sys.id} className={styles.systemCard}>
                    <div className={styles.sysName}>{sys.model}</div>
                    <div className={styles.sysMeta}>{sys.power} Вт · {sys.battery}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ВКЛАДКА 2: РЕКОМЕНДОВАНІ */}
        {activeTab === 'catalog' && (
          <>
            <h2 className={styles.cardHeading}>Популярні рішення на ринку</h2>
            <div className={styles.systemsGrid}>
              {catalogSystems.length > 0 ? catalogSystems.map((sys: any) => (
                <div key={sys.id} className={styles.systemCard}>
                  <div className={styles.sysName}>{sys.model}</div>
                  <div className={styles.sysMeta}>{sys.power} Вт · {sys.battery}</div>
                  <button className={styles.addSmallBtn}>Додати собі</button>
                </div>
              )) : (
                <p className={styles.emptyText}>Завантаження каталогу...</p>
              )}
            </div>
          </>
        )}

        {/* ВКЛАДКА 3: РЕКОМЕНДОВАНІ СЦЕНАРІЇ */}
        {activeTab === 'scenarios' && (
          <>
            <h2 className={styles.cardHeading}>Готові сценарії під ваші потреби</h2>
            <div className={styles.scenariosGrid}>
              {readyScenarios.length > 0 ? readyScenarios.map((scen: any, idx: number) => (
                <div key={idx} className={styles.scenarioCard}>
                  <div className={styles.scenHeader}>
                    <div className={styles.scenTitle}>{scen.name}</div>
                    <div className={styles.scenBadge}>~{scen.autonomy_hours} год</div>
                  </div>
                  <p className={styles.scenDevices}>{scen.devices?.map((d: any) => d.name).join(', ')}</p>
                  <button className={styles.orangeBtnFull}>Вибрати цей сценарій</button>
                </div>
              )) : (
                <p className={styles.emptyText}>Завантаження сценаріїв...</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}