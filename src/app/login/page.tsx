'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        identifier,
        password,
}),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudo iniciar sesión.');
        setLoading(false);
        return;
      }

      if (data.user?.mustChangePassword) {
        window.location.assign('/change-password');
      } else {
        window.location.assign('/dashboard');
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('Ocurrió un error al iniciar sesión.');
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
        padding: '20px 0 30px',
      }}
    >
      <section
        className="card"
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: 'clamp(20px, 4vw, 34px)',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.04))',
          border: '1px solid rgba(212, 175, 55, 0.14)',
        }}
      >
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: 'clamp(80px, 18vw, 96px)',
              height: 'clamp(80px, 18vw, 96px)',
              borderRadius: '28px',
              display: 'grid',
              placeItems: 'center',
              marginBottom: '16px',
              background:
                'linear-gradient(180deg, rgba(212, 175, 55, 0.25), rgba(139, 92, 246, 0.08))',
              border: '1px solid rgba(212, 175, 55, 0.18)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <Image
              src="/branding/logo.png"
              alt="Logo Hermandad"
              width={70}
              height={70}
              priority
              style={{ objectFit: 'contain', width: '72%', height: '72%' }}
            />
          </div>

          <Image
            src="/branding/hermandad.png"
            alt="Hermandad"
            width={320}
            height={68}
            priority
            style={{
              width: 'min(100%, 320px)',
              height: 'auto',
              maxHeight: '38px',
              marginBottom: '10px',
              objectFit: 'contain',
            }}
          />

          <Image
            src="/branding/jueves.png"
            alt="Jesús Nazareno del Perdón"
            width={400}
            height={60}
            priority
            style={{
              width: 'min(100%, 360px)',
              height: 'auto',
              maxHeight: '30px',
              marginBottom: '18px',
              objectFit: 'contain',
            }}
          />

          <h1
            style={{
              fontSize: 'clamp(26px, 5vw, 36px)',
              fontWeight: 800,
              marginBottom: '8px',
            }}
          >
            Iniciar sesión
          </h1>

          <p
            style={{
              maxWidth: '440px',
              lineHeight: 1.55,
              opacity: 0.82,
              fontSize: 'clamp(14px, 2.7vw, 18px)',
            }}
          >
            Sistema Interno Hermandad de San Francisco el Grande.
          </p>
        </div>

        {errorMessage ? (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 14px',
              borderRadius: '14px',
              background: 'rgba(255, 123, 114, 0.08)',
              border: '1px solid rgba(255, 123, 114, 0.18)',
              color: '#ffb4ad',
            }}
          >
            {errorMessage}
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div>
            <label>Usuario</label>
            <input
              className="input"
              type="text"
              placeholder="Ej. Agonzales"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          <div>
  <label>Contraseña</label>

  <div
    style={{
      position: 'relative',
    }}
  >
    <input
      className="input"
      type={showPassword ? 'text' : 'password'}
      placeholder="Ingresa tu contraseña"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      style={{
        paddingRight: '52px',
      }}
    />

    <button
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {showPassword ? '🙈' : '👁️'}
    </button>
  </div>
</div>

          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
          <a
              href="/forgot-password"
              style={{
                textAlign: 'center',
                opacity: 0.82,
                marginTop: '8px',
              }}
            >
              ¿Olvidaste tu contraseña?
            </a>
        </form>
      </section>
    </main>
  );
}
