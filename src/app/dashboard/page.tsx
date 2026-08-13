'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasPermission } from '../../lib/permissions';
import { fetchCurrentSession } from '../../lib/client-session';
import PageHeader from '../../components/ui/page-header';
import EmptyState from '../../components/ui/empty-state';
import StatusBadge from '../../components/ui/status-badge';

type CurrentUser = {
  id: string;
  fullName: string;
  roleCode?: string | null;
  roleName?: string | null;
  permissions: string[];
};

type DashboardData = {
  cards: {
    activeUsers: number;
    activitiesCount: number;
    obligationsPendingCount: number;
    totalCollected: number;
  };
  operations: {
    paymentsCount: number;
    pendingExcusesCount: number;
    obligationsPartialCount: number;
    obligationsPaidCount: number;
    attendancePercentage: number;
    attendanceSummary: {
      total: number;
      presentes: number;
      ausentes: number;
      excusados: number;
    };
  };
  alerts: {
    pendingExcusesCount: number;
    nearDueObligations: Array<{
      id: string;
      status: string;
      user: {
        fullName: string;
      };
      obligation: {
        title: string;
        dueDate: string;
      };
    }>;
  };
  recent: {
    payments: Array<{
      id: string;
      amountPaid: string;
      paymentDate: string;
      userObligation: {
        user: {
          fullName: string;
        };
        obligation: {
          title: string;
        };
      };
    }>;
    excuses: Array<{
      id: string;
      status: string;
      createdAt: string;
      user: {
        fullName: string;
      };
      activity: {
        title: string;
      };
    }>;
    activities: Array<{
      title: string;
      activityDate: string;
      location?: string | null;
    }>;
  };
};

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <section className="card stat-card">
      <div style={{ fontSize: '14px', opacity: 0.8 }}>{title}</div>
      <div className="stat-card-value">{value}</div>
      {subtitle ? <div style={{ fontSize: '13px', opacity: 0.72 }}>{subtitle}</div> : null}
    </section>
  );
}

function SearchablePanel({
  title,
  placeholder,
  children,
  query,
  setQuery,
}: {
  title: string;
  placeholder: string;
  children: React.ReactNode;
  query: string;
  setQuery: (value: string) => void;
}) {
  return (
    <section className="card" style={{ minHeight: '420px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '14px',
          flexWrap: 'wrap',
        }}
      >
        <h2>{title}</h2>
        <input
          className="input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            maxWidth: '260px',
            minWidth: '220px',
            width: '100%',
          }}
        />
      </div>

      <div
        style={{
          maxHeight: '320px',
          overflowY: 'auto',
          paddingRight: '4px',
          display: 'grid',
          gap: '10px',
        }}
      >
        {children}
      </div>
    </section>
  );
}

function getExcuseVariant(status: string) {
  if (status === 'APROBADA') return 'success';
  if (status === 'RECHAZADA') return 'danger';
  return 'warning';
}

export default function DashboardPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [paymentsQuery, setPaymentsQuery] = useState('');
  const [excusesQuery, setExcusesQuery] = useState('');
  const [activitiesQuery, setActivitiesQuery] = useState('');

  async function loadMe() {
    try {
      const session = await fetchCurrentSession<CurrentUser>();
      if (!session.ok || !session.user) {
        router.push('/acceso');
        return;
      }
      const user = session.user;

      const canView =
        hasPermission(user.permissions, 'dashboard.view') ||
        hasPermission(user.permissions, 'dashboard.view.own');

      if (!canView) {
        router.push('/acceso');
        return;
      }

      setCurrentUser(user);
    } catch (error) {
      console.error(error);
      router.push('/acceso');
    } finally {
      setCheckingAccess(false);
    }
  }

  async function loadDashboard() {
    try {
      const res = await fetch('/api/dashboard/summary', {
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudo cargar el dashboard.');
        return;
      }

      setDashboard(data.data);
    } catch (error) {
      console.error(error);
      setErrorMessage('No se pudo cargar el dashboard.');
    }
  }

  useEffect(() => {
    void loadMe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      void loadDashboard();
    }
  }, [currentUser]);

  const isAdminView = Boolean(
    currentUser && hasPermission(currentUser.permissions, 'dashboard.view')
  );

  const filteredPayments = useMemo(() => {
    if (!dashboard) return [];
    const q = paymentsQuery.trim().toLowerCase();
    if (!q) return dashboard.recent.payments;
    return dashboard.recent.payments.filter((payment) =>
      payment.userObligation.obligation.title.toLowerCase().includes(q)
    );
  }, [dashboard, paymentsQuery]);

  const filteredExcuses = useMemo(() => {
    if (!dashboard) return [];
    const q = excusesQuery.trim().toLowerCase();
    if (!q) return dashboard.recent.excuses;
    return dashboard.recent.excuses.filter((excuse) =>
      excuse.activity.title.toLowerCase().includes(q)
    );
  }, [dashboard, excusesQuery]);

  const filteredActivities = useMemo(() => {
    if (!dashboard) return [];
    const q = activitiesQuery.trim().toLowerCase();
    if (!q) return dashboard.recent.activities;
    return dashboard.recent.activities.filter((activity) =>
      activity.title.toLowerCase().includes(q)
    );
  }, [dashboard, activitiesQuery]);

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

  if (!dashboard) {
    return (
      <main>
        <section className="card">
          <PageHeader
            title="Dashboard"
            subtitle="Resumen visual del sistema"
          />
          {errorMessage ? (
            <div className="alert alert-error">{errorMessage}</div>
          ) : (
            <p>Cargando información...</p>
          )}
        </section>
      </main>
    );
  }

  return (
    <main style={{ display: 'grid', gap: '20px' }}>
      <section className="card">
        <PageHeader
          title={`Bienvenido, ${currentUser.fullName}`}
          subtitle={
            isAdminView
              ? 'Resumen ejecutivo del sistema de tesorería y control interno.'
              : 'Resumen personal de tus pagos, excusas, actividades y asistencia.'
          }
          right={
            <StatusBadge
              label={currentUser.roleName ?? currentUser.roleCode ?? 'Usuario'}
              variant="info"
            />
          }
        />
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        {isAdminView ? (
          <>
            <StatCard
              title="Usuarios activos"
              value={dashboard.cards.activeUsers}
              subtitle="Usuarios habilitados en el sistema"
            />
            <StatCard
              title="Actividades"
              value={dashboard.cards.activitiesCount}
              subtitle="Actividades registradas"
            />
            <StatCard
              title="Obligaciones pendientes"
              value={dashboard.cards.obligationsPendingCount}
              subtitle="Aún no canceladas"
            />
            <StatCard
              title="Total recaudado"
              value={`Q ${dashboard.cards.totalCollected.toFixed(2)}`}
              subtitle="Suma de pagos registrados"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Mis actividades"
              value={dashboard.cards.activitiesCount}
              subtitle="Actividades visibles en tu panel"
            />
            <StatCard
              title="Mis obligaciones pendientes"
              value={dashboard.cards.obligationsPendingCount}
              subtitle="Aún no canceladas"
            />
            <StatCard
              title="Mi total pagado"
              value={`Q ${dashboard.cards.totalCollected.toFixed(2)}`}
              subtitle="Pagos registrados a tu nombre"
            />
            <StatCard
              title="Mi asistencia"
              value={`${dashboard.operations.attendancePercentage}%`}
              subtitle="Porcentaje actual"
            />
          </>
        )}
      </section>

      <section
        className="dashboard-split"
        style={{
          display: 'grid',
          gridTemplateColumns: isAdminView ? 'minmax(0, 1.2fr) minmax(0, 0.8fr)' : '1fr',
          gap: '20px',
        }}
      >
        <section className="card">
          <PageHeader
            title={isAdminView ? 'Resumen operativo' : 'Resumen personal'}
            subtitle="Indicadores principales del momento"
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '14px',
            }}
          >
            <div className="card-muted">
              <div style={{ opacity: 0.8, fontSize: '13px' }}>
                {isAdminView ? 'Pagos registrados' : 'Mis pagos'}
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700 }}>
                {dashboard.operations.paymentsCount}
              </div>
            </div>

            <div className="card-muted">
              <div style={{ opacity: 0.8, fontSize: '13px' }}>
                {isAdminView ? 'Excusas pendientes' : 'Mis excusas pendientes'}
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700 }}>
                {dashboard.operations.pendingExcusesCount}
              </div>
            </div>

            <div className="card-muted">
              <div style={{ opacity: 0.8, fontSize: '13px' }}>
                {isAdminView ? 'Obligaciones parciales' : 'Mis obligaciones parciales'}
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700 }}>
                {dashboard.operations.obligationsPartialCount}
              </div>
            </div>

            <div className="card-muted">
              <div style={{ opacity: 0.8, fontSize: '13px' }}>
                {isAdminView ? 'Obligaciones pagadas' : 'Mis obligaciones pagadas'}
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700 }}>
                {dashboard.operations.obligationsPaidCount}
              </div>
            </div>
          </div>

          <div
            className="card-muted"
            style={{
              marginTop: '18px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '10px',
                flexWrap: 'wrap',
              }}
            >
              <strong>
                {isAdminView ? 'Asistencia general' : 'Mi asistencia'}
              </strong>
              <span>{dashboard.operations.attendancePercentage}%</span>
            </div>

            <div
              style={{
                height: '12px',
                width: '100%',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.08)',
                overflow: 'hidden',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  width: `${Math.min(dashboard.operations.attendancePercentage, 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #7ee787, #4ade80)',
                }}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '10px',
                fontSize: '14px',
              }}
            >
              <div>Presentes: {dashboard.operations.attendanceSummary.presentes}</div>
              <div>Ausentes: {dashboard.operations.attendanceSummary.ausentes}</div>
              <div>Excusados: {dashboard.operations.attendanceSummary.excusados}</div>
            </div>
          </div>
        </section>

        {isAdminView && (
          <section className="card">
            <PageHeader
              title="Alertas"
              subtitle="Elementos que requieren atención"
            />

            <div className="alert alert-warning" style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', opacity: 0.9 }}>Excusas pendientes</div>
              <div style={{ fontSize: '28px', fontWeight: 800 }}>
                {dashboard.alerts.pendingExcusesCount}
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '10px', fontSize: '15px' }}>
                Obligaciones próximas a vencer
              </h3>

              <div
                style={{
                  display: 'grid',
                  gap: '10px',
                  maxHeight: '280px',
                  overflowY: 'auto',
                  paddingRight: '4px',
                }}
              >
                {dashboard.alerts.nearDueObligations.length > 0 ? (
                  dashboard.alerts.nearDueObligations.map((item) => (
                    <div key={item.id} className="card-muted">
                      <div style={{ fontWeight: 600 }}>{item.obligation.title}</div>
                      <div style={{ opacity: 0.8, fontSize: '13px' }}>
                        {item.user.fullName}
                      </div>
                      <div
                        style={{
                          opacity: 0.75,
                          fontSize: '12px',
                          marginTop: '4px',
                        }}
                      >
                        Vence: {new Date(item.obligation.dueDate).toLocaleDateString('es-GT')}
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="Sin alertas cercanas"
                    description="No hay obligaciones próximas a vencer."
                  />
                )}
              </div>
            </div>
          </section>
        )}
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
        }}
      >
        <SearchablePanel
          title={isAdminView ? 'Pagos recientes' : 'Mis pagos recientes'}
          placeholder="Buscar por título del pago"
          query={paymentsQuery}
          setQuery={setPaymentsQuery}
        >
          {filteredPayments.length > 0 ? (
            filteredPayments.map((payment) => (
              <div key={payment.id} className="card-muted">
                <div style={{ fontWeight: 600 }}>
                  {payment.userObligation.obligation.title}
                </div>
                {isAdminView && (
                  <div style={{ fontSize: '13px', opacity: 0.8 }}>
                    {payment.userObligation.user.fullName}
                  </div>
                )}
                <div style={{ marginTop: '6px', fontWeight: 700 }}>
                  Q {Number(payment.amountPaid).toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.72, marginTop: '4px' }}>
                  {new Date(payment.paymentDate).toLocaleString('es-GT')}
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="Sin resultados"
              description="No hay pagos que coincidan con tu búsqueda."
            />
          )}
        </SearchablePanel>

        <SearchablePanel
          title={isAdminView ? 'Excusas recientes' : 'Mis excusas recientes'}
          placeholder="Buscar por título de excusa"
          query={excusesQuery}
          setQuery={setExcusesQuery}
        >
          {filteredExcuses.length > 0 ? (
            filteredExcuses.map((excuse) => (
              <div key={excuse.id} className="card-muted">
                <div style={{ fontWeight: 600 }}>{excuse.activity.title}</div>
                {isAdminView && (
                  <div style={{ fontSize: '13px', opacity: 0.8 }}>
                    {excuse.user.fullName}
                  </div>
                )}
                <div style={{ marginTop: '8px' }}>
                  <StatusBadge
                    label={excuse.status}
                    variant={getExcuseVariant(excuse.status)}
                  />
                </div>
                <div style={{ fontSize: '12px', opacity: 0.72, marginTop: '8px' }}>
                  {new Date(excuse.createdAt).toLocaleDateString('es-GT')}
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="Sin resultados"
              description="No hay excusas que coincidan con tu búsqueda."
            />
          )}
        </SearchablePanel>

        <SearchablePanel
          title={isAdminView ? 'Actividades recientes' : 'Mis actividades'}
          placeholder="Buscar por título de actividad"
          query={activitiesQuery}
          setQuery={setActivitiesQuery}
        >
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity, index) => (
              <div key={`${activity.title}-${index}`} className="card-muted">
                <div style={{ fontWeight: 600 }}>{activity.title}</div>
                <div style={{ fontSize: '13px', opacity: 0.8 }}>
                  {new Date(activity.activityDate).toLocaleString('es-GT')}
                </div>
                <div style={{ marginTop: '4px', fontSize: '12px', opacity: 0.72 }}>
                  {activity.location ?? 'Sin ubicación'}
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="Sin resultados"
              description="No hay actividades que coincidan con tu búsqueda."
            />
          )}
        </SearchablePanel>
      </section>
    </main>
  );
}
