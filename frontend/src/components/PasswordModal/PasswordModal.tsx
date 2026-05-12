'use client';
import React, { useState } from 'react';
import styles from './PasswordModal.module.css';
import { useTranslation } from '../../context/LanguageContext';
import { EyeIcon, EyeOffIcon } from '../icons/eye';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function PasswordModal({ isOpen, onClose }: Props) {
  const { t } = useTranslation();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  function handleClose() {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
    onClose();
  }

  async function handleSubmit() {
    setError('');

    if (newPassword.length < 4) {
      setError(t.profile.passwordTooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t.profile.passwordMismatch);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });

      if (res.status === 400) {
        setError(t.profile.wrongOldPassword);
        return;
      }
      if (!res.ok) {
        setError(t.common.error);
        return;
      }

      setSuccess(true);
      setTimeout(handleClose, 1500);
    } catch {
      setError(t.common.networkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t.profile.changePassword}</h2>
          <button className={styles.closeBtn} onClick={handleClose}>✕</button>
        </div>

        {success ? (
          <p className={styles.successMsg}>{t.profile.passwordChanged}</p>
        ) : (
          <>
            <div className={styles.inputWrap}>
              <input
                type={showOld ? 'text' : 'password'}
                className={styles.input}
                placeholder={t.profile.oldPassword}
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
              />
              <button className={styles.eyeBtn} type="button" onClick={() => setShowOld(v => !v)}>
                {showOld ? <EyeOffIcon className={styles.eyeIcon} /> : <EyeIcon className={styles.eyeIcon} />}
              </button>
            </div>

            <div className={styles.inputWrap}>
              <input
                type={showNew ? 'text' : 'password'}
                className={styles.input}
                placeholder={t.profile.newPassword}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <button className={styles.eyeBtn} type="button" onClick={() => setShowNew(v => !v)}>
                {showNew ? <EyeOffIcon className={styles.eyeIcon} /> : <EyeIcon className={styles.eyeIcon} />}
              </button>
            </div>

            <div className={styles.inputWrap}>
              <input
                type={showConfirm ? 'text' : 'password'}
                className={styles.input}
                placeholder={t.profile.confirmPassword}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
              <button className={styles.eyeBtn} type="button" onClick={() => setShowConfirm(v => !v)}>
                {showConfirm ? <EyeOffIcon className={styles.eyeIcon} /> : <EyeIcon className={styles.eyeIcon} />}
              </button>
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={loading || !oldPassword || !newPassword || !confirmPassword}
            >
              {loading ? t.common.saving : t.common.save}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
