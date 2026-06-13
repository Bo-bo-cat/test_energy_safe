'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../context/LanguageContext';

export default function PickerPage() {
  const { t, lang } = useTranslation();
  const router = useRouter();

  // Три вкладки: 'my' (Мої системи), 'catalog' (Рекомендовані), 'scenarios' (Рекомендовані сценарії)
  const [activeTab, setActiveTab] = useState<'my' | 'catalog' | 'scenarios'>('my');

  const [mySystems, setMySystems] = useState<any[]>([]);
  const [catalogSystems, setCatalogSystems] = useState<any[]>([]);
  const [readyScenarios, setReadyScenarios] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [lang]);

  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('access_token');
    try {
      const [myRes, catRes, scenRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/systems/my`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/systems/recommended`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/systems/recommended/all-scenarios`) // Ендпоінт для всіх сценаріїв
      ]);

      if (myRes.ok) setMySystems(await myRes.json());
      if (catRes.ok) setCatalogSystems(await catRes.json());
      if (scenRes.ok) setReadyScenarios(await scenRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustom = () => {
    // Логіка відкриття модалки або переходу на форму створення
    toast.success(lang === 'uk' ? 'Функція додавання власної системи' : 'Add custom system feature');
  };

  return (
    <div className="global-page-wrap">
      <h1 className={styles.pageTitle}>Система</h1>

      {/* Перемикач вкладок */}
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
        {/* Вкладка 1: МОЇ СИСТЕМИ (як на скріншоті) */}
        {activeTab === 'my' && (
          <>
            <div className={styles.searchHeader}>
              <h2 className={styles.cardHeading}>Введіть вашу систему</h2>
              <div className={styles.searchRow}>
                <input 
                  type="text" 
                  className={styles.searchInput} 
                  placeholder="Наприклад: EcoFlow"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className={styles.orangeBtn}>Знайти систему</button>
                <button className={styles.blackBtn} onClick={handleAddCustom}>Додати свою систему</button>
              </div>
            </div>

            {mySystems.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="7" width="20" height="14" rx="2" strokeOpacity="0.3" />
                    <path d="M12 11V17M9 14H15" strokeOpacity="0.3" />
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
                {/* Список ваших систем */}
              </div>
            )}
          </>
        )}

        {/* Вкладка 2: РЕКОМЕНДОВАНІ (Каталог) */}
        {activeTab === 'catalog' && (
          <div className={styles.catalogWrapper}>
            <h2 className={styles.cardHeading}>Популярні рішення на ринку</h2>
            <div className={styles.systemsGrid}>
              {catalogSystems.map((sys: any) => (
                <div key={sys.id} className={styles.systemCard}>
                  <div className={styles.sysInfo}>
                    <div className={styles.sysName}>{sys.model}</div>
                    <div className={styles.sysMeta}>{sys.power} Вт · {sys.battery}</div>
                  </div>
                  <button className={styles.addSmallBtn}>Додати собі</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Вкладка 3: РЕКОМЕНДОВАНІ СЦЕНАРІЇ (Готові набори) */}
        {activeTab === 'scenarios' && (
          <div className={styles.scenariosWrapper}>
            <h2 className={styles.cardHeading}>Готові сценарії під ваші потреби</h2>
            <div className={styles.scenariosGrid}>
              {readyScenarios.length > 0 ? (
                readyScenarios.map((scen: any, idx: number) => (
                  <div key={idx} className={styles.scenarioCard}>
                    <div className={styles.scenHeader}>
                      <div className={styles.scenTitle}>{scen.name}</div>
                      <div className={styles.scenBadge}>~{scen.autonomy_hours} год</div>
                    </div>
                    <p className={styles.scenDevices}>{scen.devices.map((d: any) => d.name).join(', ')}</p>
                    <button className={styles.orangeBtnFull}>Вибрати цей сценарій</button>
                  </div>
                ))
              ) : (
                <p className={styles.emptyText}>Завантаження сценаріїв...</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}