'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageHeader from '../../components/ui/page-header';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setMessage('');
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudo restablecer la contraseña.');
        return;
      }

      setMessage(data.message ?? 'Revisa tu correo electrónico.');
    } catch (error) {
      console.error(error);
      setErrorMessage('Ocurrió un error al restablecer la contraseña.');
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
          title="Olvidé mi contraseña"
          subtitle="Ingresa tu correo para recibir una contraseña temporal."
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
            <label>Correo electrónico</label>
            <input
              className="input"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Envio de  contraseña temporal'}
          </button>

          <Link
            href="/login"
            style={{
              textAlign: 'center',
              opacity: 0.8,
              marginTop: '8px',
            }}
          >
            Volver al login
          </Link>
        </form>
      </section>
    </main>
  );
}