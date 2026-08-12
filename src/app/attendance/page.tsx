'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasPermission } from '../../lib/permissions';
type CurrentUser = {
  id: string;
  fullName: string;
  permissions: string[];
};

type Activity = {
  id: string;
  title: string;
};

type User = {
  id: string;
  fullName: string;
};

type AttendanceItem = {
  id: string;
  status: string;
  notes?: string;
  registeredAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  activity: {
    id: string;
    title: string;
    activityDate: string;
  };
};

type AttendanceSummary = {
  total: number;
  presentes: number;
  ausentes: number;
  excusados: number;
  percentage: number;
};

type EditAttendanceForm = {
  id: string;
  status: 'PRESENTE' | 'AUSENTE' | 'EXCUSADO';
  notes: string;
};

export default function AttendancePage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  const [summary, setSummary] = useState<AttendanceSummary>({
    total: 0,
    presentes: 0,
    ausentes: 0,
    excusados: 0,
    percentage: 0,
  });

  const [checkingAccess, setCheckingAccess] = useState(true);

  const [form, setForm] = useState({
    userId: '',
    activityId: '',
    status: 'PRESENTE',
    notes: '',
  });

  const [editingAttendanceId, setEditingAttendanceId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditAttendanceForm>({
    id: '',
    status: 'PRESENTE',
    notes: '',
  });

  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

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

      const canView =
        hasPermission(user.permissions, 'attendance.view') ||
        hasPermission(user.permissions, 'attendance.view.own');

      if (!canView) {
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

  async function loadAttendance(userId?: string) {
    try {
      const url =
        userId && userId.length > 0
          ? `/api/attendance/register?userId=${encodeURIComponent(userId)}`
          : '/api/attendance/register';

      const res = await fetch(url, {
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await res.json();

      if (res.ok) {
        setAttendance(data.data ?? []);
        setSummary(
          data.summary ?? {
            total: 0,
            presentes: 0,
            ausentes: 0,
            excusados: 0,
            percentage: 0,
          }
        );
      } else {
        setErrorMessage(data.error ?? 'No se pudo cargar la asistencia.');
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('No se pudo cargar la asistencia.');
    }
  }

  async function loadActivities() {
    try {
      const res = await fetch('/api/activities', {
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await res.json();

      if (res.ok) {
        setActivities(data.data ?? []);
      }
    } catch (error) {
      console.error(error);
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

  useEffect(() => {
    void loadMe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      const canViewAll = hasPermission(currentUser.permissions, 'attendance.view');
      const canCreate = hasPermission(currentUser.permissions, 'attendance.create');

      void loadAttendance(canViewAll ? selectedUserId : undefined);

      if (canCreate) {
        void loadActivities();
        void loadUsers();
      } else if (canViewAll) {
        void loadUsers();
      }
    }
  }, [currentUser, selectedUserId]);

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();

    setMessage('');
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/attendance/register', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudo registrar la asistencia.');
        setLoading(false);
        return;
      }

      setMessage('Asistencia registrada correctamente.');

      setForm({
        userId: '',
        activityId: '',
        status: 'PRESENTE',
        notes: '',
      });

      await loadAttendance(selectedUserId);
    } catch (error) {
      console.error(error);
      setErrorMessage('Ocurrió un error al registrar la asistencia.');
    } finally {
      setLoading(false);
    }
  }

  function startEdit(item: AttendanceItem) {
    setMessage('');
    setErrorMessage('');
    setEditingAttendanceId(item.id);
    setEditForm({
      id: item.id,
      status: item.status as EditAttendanceForm['status'],
      notes: item.notes ?? '',
    });
  }

  function cancelEdit() {
    setEditingAttendanceId(null);
    setEditForm({
      id: '',
      status: 'PRESENTE',
      notes: '',
    });
  }

  async function submitEdit() {
    setMessage('');
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/attendance/register', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudo actualizar la asistencia.');
        setLoading(false);
        return;
      }

      setMessage('Asistencia actualizada correctamente.');
      cancelEdit();
      await loadAttendance(selectedUserId);
    } catch (error) {
      console.error(error);
      setErrorMessage('Ocurrió un error al actualizar la asistencia.');
    } finally {
      setLoading(false);
    }
  }

  async function deleteAttendance(attendanceId: string) {
    const confirmed = window.confirm('¿Estás seguro de eliminar este registro de asistencia?');

    if (!confirmed) return;

    setMessage('');
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch(`/api/attendance/register?id=${attendanceId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudo eliminar la asistencia.');
        setLoading(false);
        return;
      }

      setMessage('Asistencia eliminada correctamente.');
      await loadAttendance(selectedUserId);
    } catch (error) {
      console.error(error);
      setErrorMessage('Ocurrió un error al eliminar la asistencia.');
    } finally {
      setLoading(false);
    }
  }

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

  const canCreate = hasPermission(currentUser.permissions, 'attendance.create');
  const canViewAll = hasPermission(currentUser.permissions, 'attendance.view');
  const canEdit = hasPermission(currentUser.permissions, 'attendance.update');
  const canDelete = hasPermission(currentUser.permissions, 'attendance.cancel');

  return (
    <main style={{ display: 'grid', gap: '20px' }}>
      {canViewAll && (
        <section className="card">
          <h2 style={{ marginBottom: '14px' }}>Filtrar por colaborador</h2>
          <div style={{ maxWidth: '380px' }}>
            <label>Colaborador</label>
            <select
              className="select"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Todos</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName}
                </option>
              ))}
            </select>
          </div>
        </section>
      )}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
        }}
      >
        <div className="card">
          <h2>Total registros</h2>
          <p style={{ marginTop: '10px', fontSize: '28px', fontWeight: 700 }}>
            {summary.total}
          </p>
        </div>

        <div className="card">
          <h2>Presentes</h2>
          <p style={{ marginTop: '10px', fontSize: '28px', fontWeight: 700 }}>
            {summary.presentes}
          </p>
        </div>

        <div className="card">
          <h2>Ausentes</h2>
          <p style={{ marginTop: '10px', fontSize: '28px', fontWeight: 700 }}>
            {summary.ausentes}
          </p>
        </div>

        <div className="card">
          <h2>Excusados</h2>
          <p style={{ marginTop: '10px', fontSize: '28px', fontWeight: 700 }}>
            {summary.excusados}
          </p>
        </div>

        <div className="card">
          <h2>% Asistencia</h2>
          <p style={{ marginTop: '10px', fontSize: '28px', fontWeight: 700 }}>
            {summary.percentage}%
          </p>
        </div>
      </section>

      <section
        className="responsive-split"
        style={{
          display: 'grid',
          gridTemplateColumns: canCreate ? 'minmax(320px, 420px) minmax(0, 1fr)' : '1fr',
          gap: '20px',
        }}
      >
        {canCreate && (
          <section className="card">
            <h2 style={{ marginBottom: '16px' }}>Registrar asistencia</h2>

            <form onSubmit={submitCreate}>
              <div>
                <label>Usuario</label>
                <select
                  className="select"
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                >
                  <option value="">Seleccione</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Actividad</label>
                <select
                  className="select"
                  value={form.activityId}
                  onChange={(e) => setForm({ ...form, activityId: e.target.value })}
                >
                  <option value="">Seleccione</option>
                  {activities.map((activity) => (
                    <option key={activity.id} value={activity.id}>
                      {activity.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Estado</label>
                <select
                  className="select"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="PRESENTE">PRESENTE</option>
                  <option value="AUSENTE">AUSENTE</option>
                  <option value="EXCUSADO">EXCUSADO</option>
                </select>
              </div>

              <div>
                <label>Notas</label>
                <input
                  className="input"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <button className="button" type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </form>
          </section>
        )}

        <section className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '16px',
            }}
          >
            <h2>Historial de asistencia</h2>
            <span style={{ opacity: 0.78 }}>Total: {attendance.length}</span>
          </div>

          {message && <p style={{ color: '#7ee787', marginBottom: '12px' }}>{message}</p>}
          {errorMessage && <p style={{ color: '#ff7b72', marginBottom: '12px' }}>{errorMessage}</p>}

          <div className="table-scroll" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', minWidth: '1020px', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ width: '18%' }}>Usuario</th>
                  <th style={{ width: '22%' }}>Actividad</th>
                  <th style={{ width: '14%' }}>Estado</th>
                  <th style={{ width: '14%' }}>Fecha</th>
                  <th style={{ width: '16%' }}>Notas</th>
                  <th style={{ width: '16%' }}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {attendance.map((item) => {
                  const isEditing = editingAttendanceId === item.id;

                  return (
                    <tr key={item.id}>
                      <td style={{ wordBreak: 'break-word' }}>{item.user.fullName}</td>

                      <td style={{ wordBreak: 'break-word' }}>{item.activity.title}</td>

                      <td>
                        {isEditing ? (
                          <select
                            className="select"
                            value={editForm.status}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                status: e.target.value as EditAttendanceForm['status'],
                              })
                            }
                          >
                            <option value="PRESENTE">PRESENTE</option>
                            <option value="AUSENTE">AUSENTE</option>
                            <option value="EXCUSADO">EXCUSADO</option>
                          </select>
                        ) : (
                          item.status
                        )}
                      </td>

                      <td>{new Date(item.activity.activityDate).toLocaleDateString('es-GT')}</td>

                      <td style={{ wordBreak: 'break-word' }}>
                        {isEditing ? (
                          <input
                            className="input"
                            value={editForm.notes}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                notes: e.target.value,
                              })
                            }
                          />
                        ) : (
                          item.notes ?? '-'
                        )}
                      </td>

                      <td>
                       <div className="table-actions">
                          {canEdit &&
                            (isEditing ? (
                              <>
                                <button
                                  className="button-success table-button"
                                  type="button"
                                  onClick={submitEdit}
                                  disabled={loading}
                                >
                                  Guardar
                                </button>
                                <button
                                className="button-secondary table-button"
                                type="button"
                                onClick={cancelEdit}
                              >
                                Cancelar
                              </button>
                              </>
                            ) : (
                              <button
                              className="button-secondary table-button"
                              type="button"
                              onClick={() => startEdit(item)}
                            >
                              Editar
                            </button>
                            ))}

                          {canDelete && !isEditing && (
                            <button
                              className="button-danger table-button"
                              type="button"
                              onClick={() => deleteAttendance(item.id)}
                              disabled={loading}
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {attendance.length === 0 && (
                  <tr>
                    <td colSpan={6}>No hay registros de asistencia.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
