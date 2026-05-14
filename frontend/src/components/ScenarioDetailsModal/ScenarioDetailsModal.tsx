'use client';
import React from 'react';
import styles from './ScenarioDetailsModal.module.css';
import { useTranslation } from '../../context/LanguageContext';

interface Device {
  name: string;
  power_watts: number;
}

interface Scenario {
  name: string;
  devices?: Device[];
  system_model?: string;
  total_power_watts: number;
  duration_hours: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  scenario: Scenario | null;
}

export function ScenarioDetailsModal({ isOpen, onClose, scenario }: Props) {
  const { t } = useTranslation();
  if (!isOpen || !scenario) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{scenario.name}</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t.dashboard.chooseSystem}</h3>
            <div className={styles.systemBox}>
              {scenario.system_model || t.dashboard.unknown}
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t.dashboard.devicesIncluded}</h3>
            <div className={styles.deviceList}>
              {scenario.devices && scenario.devices.length > 0 ? (
                scenario.devices.map((device, idx) => (
                  <div key={idx} className={styles.deviceItem}>
                    <span className={styles.deviceName}>{device.name}</span>
                    <span className={styles.devicePower}>{device.power_watts} {t.common.w}</span>
                  </div>
                ))
              ) : (
                <p className={styles.emptyText}>{t.dashboard.noDevicesInScenario}</p>
              )}
            </div>
          </section>
        </div>

        <div className={styles.footer}>
          <button className={styles.submitBtn} onClick={onClose}>
            {t.common.gotIt}
          </button>
        </div>
      </div>
    </div>
  );
}