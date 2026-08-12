'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasPermission } from '../../lib/permissions';

type CurrentUser = {
  id: string;
  fullName: string;
  permissions: string[];
};

type AppUser = {
  id: string;
  fullName: string;
  email: string;
  role?: {
    code: string;
    name: string;
  } | null;
};

type ReportsData = {
  selectedUser: {
    id: string;
    fullName: string;
    email: string;
    role?: {
      code: string;
      name: string;
    } | null;
  } | null;
  users: {
    total: number;
  };
  activities: {
    total: number;
  };
  attendance: {
    total: number;
    presentes: number;
    ausentes: number;
    excusados: number;
    percentage: number;
  };
  excuses: {
    total: number;
    pending: number;
  };
  obligations: {
    total: number;
    pending: number;
    partial: number;
    paid: number;
    overdue: number;
  };
  payments: {
    total: number;
    totalCollected: number;
  };
};

export default function ReportsPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  async function loadMe() {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) {
        router.push('/login');
        return;
      }

      const data = await res.json();
      const user = data.user as CurrentUser;

      if (!hasPermission(user.permissions, 'reports.view')) {
        router.push('/dashboard');
        return;
      }

      setCurrentUser(user);
    } catch (error) {
      console.error(error);
      router.push('/login');
    } finally {
      setCheckingAccess(false);
    }
  }

  async function loadUsers() {
    try {
      const res = await fetch('/api/users', {
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await res.json();

      if (res.ok) {
        setUsers(data.data ?? []);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function loadReports(userId?: string) {
    try {
      const url =
        userId && userId.length > 0
          ? `/api/reports?userId=${encodeURIComponent(userId)}`
          : '/api/reports';

      const res = await fetch(url, {
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudieron cargar los reportes.');
        return;
      }

      setReports(data.data);
    } catch (error) {
      console.error(error);
      setErrorMessage('No se pudieron cargar los reportes.');
    }
  }

  useEffect(() => {
    void loadMe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      void loadUsers();
      void loadReports(selectedUserId);
    }
  }, [currentUser, selectedUserId]);

  if (checkingAccess) {
    return (
      <main>
        <section className="card">
          <h2>Validando acceso...</h2>
        </section>
      </main>
    );
  }

  if (!currentUser) return null;

  if (!reports) {
    return (
      <main>
        <section className="card">
          <h2>Reportes</h2>
          {errorMessage ? (
            <p style={{ color: '#ff7b72' }}>{errorMessage}</p>
          ) : (
            <p>Cargando datos...</p>
          )}
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="card" style={{ marginBottom: '24px' }}>
        <h2>Filtrar por colaborador</h2>

        <div style={{ marginTop: '16px', maxWidth: '420px' }}>
          <label>Colaborador</label>
          <select
            className="select"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <option value="">Todos</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName} — {user.email}
              </option>
            ))}
          </select>
          {hasPermission(currentUser.permissions, 'reports.export') && (
            <a
              className="button"
              href={`/api/reports?format=csv${selectedUserId ? `&userId=${encodeURIComponent(selectedUserId)}` : ''}`}
              style={{ display: 'inline-block', marginTop: '12px', textDecoration: 'none' }}
            >
              Exportar CSV
            </a>
          )}
        </div>

        {reports.selectedUser && (
          <div style={{ marginTop: '16px', opacity: 0.9 }}>
            <p>
              <strong>Seleccionado:</strong> {reports.selectedUser.fullName}
            </p>
            <p>{reports.selectedUser.email}</p>
            <p>{reports.selectedUser.role?.name ?? 'Sin rol'}</p>
          </div>
        )}
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="card">
          <h2>Usuarios</h2>
          <p style={{ marginTop: '10px', fontSize: '28px', fontWeight: 700 }}>
            {reports.users.total}
          </p>
        </div>

        <div className="card">
          <h2>Actividades</h2>
          <p style={{ marginTop: '10px', fontSize: '28px', fontWeight: 700 }}>
            {reports.activities.total}
          </p>
        </div>

        <div className="card">
          <h2>Pagos registrados</h2>
          <p style={{ marginTop: '10px', fontSize: '28px', fontWeight: 700 }}>
            {reports.payments.total}
          </p>
        </div>

        <div className="card">
          <h2>Total recaudado</h2>
          <p style={{ marginTop: '10px', fontSize: '28px', fontWeight: 700 }}>
            Q {reports.payments.totalCollected.toFixed(2)}
          </p>
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        <div className="card">
          <h2>Asistencia</h2>
          <p><strong>Total:</strong> {reports.attendance.total}</p>
          <p><strong>Presentes:</strong> {reports.attendance.presentes}</p>
          <p><strong>Ausentes:</strong> {reports.attendance.ausentes}</p>
          <p><strong>Excusados:</strong> {reports.attendance.excusados}</p>
          <p><strong>% asistencia:</strong> {reports.attendance.percentage}%</p>
        </div>

        <div className="card">
          <h2>Excusas</h2>
          <p><strong>Total:</strong> {reports.excuses.total}</p>
          <p><strong>Pendientes:</strong> {reports.excuses.pending}</p>
        </div>

        <div className="card">
          <h2>Obligaciones</h2>
          <p><strong>Total:</strong> {reports.obligations.total}</p>
          <p><strong>Pendientes:</strong> {reports.obligations.pending}</p>
          <p><strong>Parciales:</strong> {reports.obligations.partial}</p>
          <p><strong>Pagadas:</strong> {reports.obligations.paid}</p>
          <p><strong>Vencidas:</strong> {reports.obligations.overdue}</p>
        </div>
      </section>
    </main>
  );
}
