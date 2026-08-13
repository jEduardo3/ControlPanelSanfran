'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '../../../../components/ui/page-header';
import EmptyState from '../../../../components/ui/empty-state';
type AttendanceStatus = 'PENDIENTE' | 'PRESENTE' | 'AUSENTE' | 'EXCUSADO';

type Row = {
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  status: AttendanceStatus;
  notes: string;
  hasApprovedExcuse: boolean;
};

export default function ActivityAttendancePage() {
  const router = useRouter();
  const params = useParams();

  const activityId = String(params.id);

  const [activity, setActivity] = useState<{
    id: string;
    title: string;
    activityDate: string;
    location?: string | null;
    attendanceFinalized: boolean;
    attendanceUpdatedAt?: string | null;
    attendanceUpdatedBy?: { fullName: string } | null;
  } | null>(null);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [canUpdate, setCanUpdate] = useState(false);
  const [editingFinalized, setEditingFinalized] = useState(false);

  async function loadAttendance() {
    try {
      const res = await fetch(`/api/activities/${activityId}/attendance`, {
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudo cargar la asistencia.');
        return;
      }

      setActivity(data.data.activity);
      setRows(data.data.users ?? []);
      setCanUpdate(Boolean(data.data.permissions?.canUpdate));
      setEditingFinalized(false);
    } catch (error) {
      console.error(error);
      setErrorMessage('No se pudo cargar la asistencia.');
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    void loadAttendance();
  }, []);

  function updateStatus(userId: string, status: AttendanceStatus) {
    setRows((prev) =>
      prev.map((row) =>
        row.user.id === userId
          ? {
              ...row,
              status,
            }
          : row
      )
    );
  }

  function updateNotes(userId: string, notes: string) {
    setRows((prev) =>
      prev.map((row) =>
        row.user.id === userId
          ? {
              ...row,
              notes,
            }
          : row
      )
    );
  }

  function markAllPresent() {
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        status: row.hasApprovedExcuse ? 'EXCUSADO' : 'PRESENTE',
      }))
    );
  }

  function markPendingAbsent() {
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        status: row.hasApprovedExcuse
          ? 'EXCUSADO'
          : row.status === 'PENDIENTE'
            ? 'AUSENTE'
            : row.status,
      }))
    );
  }

  async function saveAttendance(action: 'draft' | 'finalize' | 'correction') {
    setMessage('');
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch(`/api/activities/${activityId}/attendance`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          records: rows.map((row) => ({
            userId: row.user.id,
            status: row.status,
            notes: row.notes,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudo guardar la asistencia.');
        return;
      }

      setMessage(data.message ?? 'Asistencia guardada correctamente.');
      await loadAttendance();
    } catch (error) {
      console.error(error);
      setErrorMessage('Ocurrió un error al guardar la asistencia.');
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main>
        <section className="card">
          <h2>Cargando asistencia...</h2>
        </section>
      </main>
    );
  }

  if (!activity) {
    return (
      <main>
        <section className="card">
          <EmptyState
            title="Actividad no encontrada"
            description="No se pudo cargar la actividad seleccionada."
          />
        </section>
      </main>
    );
  }

  const isReadOnly = activity.attendanceFinalized && !editingFinalized;
  const pendingCount = rows.filter((row) => row.status === 'PENDIENTE').length;

  return (
    <main style={{ display: 'grid', gap: '20px' }}>
      <section className="card">
        <PageHeader
          title="Pasar asistencia"
          subtitle={`${activity.title} — ${new Date(
            activity.activityDate
          ).toLocaleString('es-GT')}`}
          right={
            <button
              type="button"
              className="button-secondary"
              onClick={() => router.push('/activities')}
            >
              Volver
            </button>
          }
        />

        {activity.location ? (
          <p style={{ marginTop: '-8px', marginBottom: '14px' }}>
            Ubicación: {activity.location}
          </p>
        ) : null}

        <div className="alert alert-warning" style={{ marginBottom: '14px' }}>
          Estado: <strong>{activity.attendanceFinalized ? 'Finalizada' : 'Borrador'}</strong>
          {' · '}Pendientes: <strong>{pendingCount}</strong>
          {activity.attendanceUpdatedAt ? (
            <span>
              {' · '}Última modificación:{' '}
              {new Date(activity.attendanceUpdatedAt).toLocaleString('es-GT')}
              {activity.attendanceUpdatedBy?.fullName
                ? ` por ${activity.attendanceUpdatedBy.fullName}`
                : ''}
            </span>
          ) : null}
        </div>

        <div className="actions-wrap" style={{ marginBottom: '16px' }}>
          {isReadOnly ? (
            canUpdate ? (
              <button type="button" className="button" onClick={() => setEditingFinalized(true)}>
                Editar asistencia
              </button>
            ) : null
          ) : (
            <>
              <button type="button" className="button-success" onClick={markAllPresent}>
                Marcar todos presentes
              </button>
              <button type="button" className="button-secondary" onClick={markPendingAbsent}>
                Marcar pendientes como ausentes
              </button>
              {!activity.attendanceFinalized ? (
                <button type="button" className="button-secondary" onClick={() => saveAttendance('draft')} disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar borrador'}
                </button>
              ) : null}
              <button
                type="button"
                className="button"
                onClick={() => saveAttendance(activity.attendanceFinalized ? 'correction' : 'finalize')}
                disabled={loading || pendingCount > 0}
              >
                {loading
                  ? 'Guardando...'
                  : activity.attendanceFinalized
                    ? 'Guardar correcciones'
                    : 'Finalizar asistencia'}
              </button>
              {editingFinalized ? (
                <button type="button" className="button-secondary" onClick={() => void loadAttendance()} disabled={loading}>
                  Cancelar edición
                </button>
              ) : null}
            </>
          )}
        </div>

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

        {rows.length === 0 ? (
          <EmptyState
            title="Sin usuarios asignados"
            description="Esta actividad todavía no tiene colaboradores asignados."
          />
        ) : (
          <div className="table-wrap">
            <table
              className="table"
              style={{
                width: '100%',
                minWidth: '980px',
                tableLayout: 'fixed',
              }}
            >
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Nombre</th>
                  <th style={{ width: '11%' }}>Pendiente</th>
                  <th style={{ width: '14%' }}>Asistió</th>
                  <th style={{ width: '14%' }}>No asistió</th>
                  <th style={{ width: '11%' }}>Excusa</th>
                  <th style={{ width: '31%' }}>Notas</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr key={row.user.id}>
                    <td style={{ wordBreak: 'break-word' }}>
                      <strong>{row.user.fullName}</strong>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>
                        {row.user.email}
                      </div>
                    </td>

                    <td>
                      <input
                        type="radio"
                        name={`status-${row.user.id}`}
                        checked={row.status === 'PENDIENTE'}
                        disabled={row.hasApprovedExcuse || isReadOnly}
                        onChange={() => updateStatus(row.user.id, 'PENDIENTE')}
                      />
                    </td>

                    <td>
                      <input
                        type="radio"
                        name={`status-${row.user.id}`}
                        checked={row.status === 'PRESENTE'}
                        disabled={row.hasApprovedExcuse || isReadOnly}
                        onChange={() => updateStatus(row.user.id, 'PRESENTE')}
                      />
                    </td>

                    <td>
                      <input
                        type="radio"
                        name={`status-${row.user.id}`}
                        checked={row.status === 'AUSENTE'}
                        disabled={row.hasApprovedExcuse || isReadOnly}
                        onChange={() => updateStatus(row.user.id, 'AUSENTE')}
                      />
                    </td>

                    <td>
                      <input
                        type="radio"
                        name={`status-${row.user.id}`}
                        checked={row.status === 'EXCUSADO'}
                        disabled={isReadOnly}
                        onChange={() => updateStatus(row.user.id, 'EXCUSADO')}
                      />

                      {row.hasApprovedExcuse ? (
                        <div style={{ color: '#7ee787', fontSize: '12px', marginTop: '6px' }}>
                          Excusa aprobada
                        </div>
                      ) : null}
                    </td>

                    <td>
                      <input
                        className="input"
                        value={row.notes}
                        disabled={isReadOnly}
                        onChange={(e) => updateNotes(row.user.id, e.target.value)}
                        placeholder="Nota opcional"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
