'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/page-header';

export default function ChangePasswordPage() {
  const router = useRouter();

  const [showCurrentPassword, setShowCurrentPassword] =
  useState(false);

const [showNewPassword, setShowNewPassword] =
  useState(false);

const [showConfirmPassword, setShowConfirmPassword] =
  useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setMessage('');
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudo cambiar la contraseña.');
        return;
      }

      setMessage('Contraseña actualizada correctamente.');

      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 800);
    } catch (error) {
      console.error(error);
      setErrorMessage('Ocurrió un error al cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: 'calc(100vh - 140px)',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <section className="card" style={{ width: '100%', maxWidth: '520px' }}>
        <PageHeader
          title="Cambiar contraseña"
          subtitle="Por seguridad, debes establecer una nueva contraseña para continuar."
        />

        {message ? (
          <div className="alert alert-success" style={{ marginBottom: '12px' }}>
            {message}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="alert alert-error" style={{ marginBottom: '12px' }}>
            {errorMessage}
          </div>
        ) : null}

        <form onSubmit={submit}>
          <div>
  <label>Contraseña actual</label>

  <div
    style={{
      position: 'relative',
    }}
  >
    <input
      className="input"
      type={showCurrentPassword ? 'text' : 'password'}
      value={currentPassword}
      onChange={(e) =>
        setCurrentPassword(e.target.value)
      }
      style={{
        paddingRight: '52px',
      }}
    />

    <button
      type="button"
      onClick={() =>
        setShowCurrentPassword((prev) => !prev)
      }
      style={{
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        color: '#c4b5fd',
        fontSize: '18px',
      }}
    >
      {showCurrentPassword ? '🙈' : '👁️'}
    </button>
  </div>
</div>
<div>
  <label>Nueva contraseña</label>

  <div
    style={{
      position: 'relative',
    }}
  >
    <input
      className="input"
      type={showNewPassword ? 'text' : 'password'}
      value={newPassword}
      onChange={(e) =>
        setNewPassword(e.target.value)
      }
      style={{
        paddingRight: '52px',
      }}
    />

    <button
      type="button"
      onClick={() =>
        setShowNewPassword((prev) => !prev)
      }
      style={{
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        color: '#c4b5fd',
        fontSize: '18px',
      }}
    >
      {showNewPassword ? '🙈' : '👁️'}
    </button>
  </div>
</div>

         <div>
  <label>Confirmar nueva contraseña</label>

  <div
    style={{
      position: 'relative',
    }}
  >
    <input
      className="input"
      type={showConfirmPassword ? 'text' : 'password'}
      value={confirmPassword}
      onChange={(e) =>
        setConfirmPassword(e.target.value)
      }
      style={{
        paddingRight: '52px',
      }}
    />

    <button
      type="button"
      onClick={() =>
        setShowConfirmPassword((prev) => !prev)
      }
      style={{
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        color: '#c4b5fd',
        fontSize: '18px',
      }}
    >
      {showConfirmPassword ? '🙈' : '👁️'}
    </button>
  </div>
</div>

          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </section>
    </main>
  );
}