import React, { useState } from 'react';
import styles from './PasswordResetModal.module.css';
import { useTranslation } from '../../context/LanguageContext';
import { EyeIcon, EyeOffIcon } from '../icons/eye';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRegister?: () => void;
}

export const PasswordResetModal: React.FC<Props> = ({ isOpen, onClose, onRegister }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notRegistered, setNotRegistered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const API = process.env.NEXT_PUBLIC_API_URL;

  const handleClose = () => {
    setStep(1);
    setEmail('');
    setCode('');
    setNewPassword('');
    setError('');
    setNotRegistered(false);
    setShowPassword(false);
    onClose();
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setNotRegistered(false);
    try {
      const res = await fetch(`${API}/auth/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStep(2);
      } else if (res.status === 404) {
        setNotRegistered(true);
      } else {
        setError(t.auth.reqError);
      }
    } catch (err) {
      setError('Server error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/auth/password-reset/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, new_password: newPassword }),
      });
      if (res.ok) {
        alert(t.auth.successAlert);
        handleClose();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || t.auth.confirmError);
      }
    } catch (err) {
      setError(t.auth.confirmError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h3 className={styles.modalHeader}>
          {step === 1 ? t.auth.resetTitle : t.auth.confirmTitle}
        </h3>
        
        <p className={styles.modalDesc}>
          {step === 1 
            ? t.auth.resetDesc 
            : t.auth.confirmDesc.replace('{email}', email)}
        </p>

        <form onSubmit={step === 1 ? handleRequestCode : handleConfirmReset} className={styles.modalForm}>
          {step === 1 ? (
            <div className={styles.inputWrap}>
              <label>Email</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="mail@example.com" />
            </div>
          ) : (
            <>
              <div className={styles.inputWrap}>
                <label>Код</label>
                <input required value={code} onChange={e => setCode(e.target.value.trim())} placeholder={t.auth.codePlaceholder} maxLength={6} />
                <p className={styles.spamHint}>{t.auth.spamHint}</p>
              </div>
              <div className={styles.inputWrap}>
                <label>Новий пароль</label>
                <div className={styles.passwordWrap}>
                  <input required type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder={t.auth.passPlaceholder} />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(v => !v)}>
                    {showPassword ? <EyeOffIcon className={styles.eyeIcon} /> : <EyeIcon className={styles.eyeIcon} />}
                  </button>
                </div>
              </div>
            </>
          )}

          {error && <p className={styles.errorText}>{error}</p>}

          {notRegistered ? (
            <div className={styles.notRegisteredBox}>
              <p className={styles.errorText}>{t.auth.notRegistered}</p>
              <div className={styles.modalActions}>
                <button type="button" className={styles.modalBtnCancel} onClick={handleClose}>
                  {t.common.cancel}
                </button>
                {onRegister && (
                  <button
                    type="button"
                    className={styles.modalBtnSave}
                    onClick={() => { handleClose(); onRegister(); }}
                  >
                    {t.auth.goToRegister}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.modalActions}>
              <button type="button" className={styles.modalBtnCancel} onClick={handleClose}>{t.common.no || 'No'}</button>
              <button type="submit" className={styles.modalBtnSave} disabled={isLoading}>
                {isLoading ? '...' : (step === 1 ? t.auth.sendCode : t.auth.changePass)}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};