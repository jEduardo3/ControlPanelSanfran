'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudo iniciar sesión.');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
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
            Accede al sistema interno para consultar actividades, asistencia,
            pagos, excusas y módulos administrativos según tu perfil.
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
            <label>Correo electrónico</label>
            <input
              className="input"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label>Contraseña</label>
            <input
              className="input"
              type="password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Entrar al sistema'}
          </button>
        </form>
      </section>
    </main>
  );
}