'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasPermission } from '@/lib/permissions';
import PageHeader from '@/components/ui/page-header';
import EmptyState from '@/components/ui/empty-state';

type AssignedUser = {
  user: {
    id: string;
    fullName: string;
    email: string;
  };
};

type Activity = {
  id: string;
  title: string;
  description?: string | null;
  activityDate: string;
  location?: string | null;
  createdBy: {
    fullName: string;
  };
  assignedUsers?: AssignedUser[];
};

type AppUser = {
  id: string;
  fullName: string;
  email: string;
  isActive?: boolean;
  role?: {
    code: string;
    name: string;
  } | null;
};

type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  roleCode: string | null;
  roleName: string | null;
  permissions: string[];
};

type ActivityForm = {
  title: string;
  description: string;
  activityDate: string;
  location: string;
  userIds: string[];
};

type EditForm = {
  id: string;
  title: string;
  description: string;
  activityDate: string;
  location: string;
  userIds: string[];
};

function toDateTimeLocalValue(dateString: string) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function ActivitiesPage() {
  const router = useRouter();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);

  const [form, setForm] = useState<ActivityForm>({
    title: '',
    description: '',
    activityDate: '',
    location: '',
    userIds: [],
  });

  const [editForm, setEditForm] = useState<EditForm>({
    id: '',
    title: '',
    description: '',
    activityDate: '',
    location: '',
    userIds: [],
  });

  async function loadCurrentUser() {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
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
        hasPermission(user.permissions, 'activities.view') ||
        hasPermission(user.permissions, 'activities.view.own');

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

  async function loadActivities() {
    try {
      const res = await fetch('/api/activities', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudieron cargar las actividades.');
        return;
      }

      setActivities(data.data ?? []);
    } catch (error) {
      setErrorMessage('No se pudieron cargar las actividades.');
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
        const activeUsers = (data.data ?? []).filter((user: AppUser) => user.isActive !== false);
        setUsers(activeUsers);
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    void loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      void loadActivities();

      if (hasPermission(currentUser.permissions, 'activities.create')) {
        void loadUsers();
      }
    }
  }, [currentUser]);

  function toggleUser(userId: string) {
    setForm((prev) => ({
      ...prev,
      userIds: prev.userIds.includes(userId)
        ? prev.userIds.filter((id) => id !== userId)
        : [...prev.userIds, userId],
    }));
  }

  function toggleAllUsers() {
    setForm((prev) => {
      const allUserIds = users.map((user) => user.id);
      const allSelected = allUserIds.length > 0 && allUserIds.every((id) => prev.userIds.includes(id));

      return {
        ...prev,
        userIds: allSelected ? [] : allUserIds,
      };
    });
  }

  function toggleEditUser(userId: string) {
    setEditForm((prev) => ({
      ...prev,
      userIds: prev.userIds.includes(userId)
        ? prev.userIds.filter((id) => id !== userId)
        : [...prev.userIds, userId],
    }));
  }

  function toggleAllEditUsers() {
    setEditForm((prev) => {
      const allUserIds = users.map((user) => user.id);
      const allSelected = allUserIds.length > 0 && allUserIds.every((id) => prev.userIds.includes(id));

      return {
        ...prev,
        userIds: allSelected ? [] : allUserIds,
      };
    });
  }

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudo crear la actividad.');
        setLoading(false);
        return;
      }

      setMessage('Actividad creada correctamente.');

      setForm({
        title: '',
        description: '',
        activityDate: '',
        location: '',
        userIds: [],
      });

      await loadActivities();
    } catch (error) {
      setErrorMessage('Ocurrió un error al crear la actividad.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = async (activity: Activity) => {
    setMessage('');
    setErrorMessage('');

    if (users.length === 0) {
      await loadUsers();
    }

    setEditingActivityId(activity.id);
    setEditForm({
      id: activity.id,
      title: activity.title,
      description: activity.description ?? '',
      activityDate: toDateTimeLocalValue(activity.activityDate),
      location: activity.location ?? '',
      userIds: activity.assignedUsers?.map((item) => item.user.id) ?? [],
    });
  };

  const cancelEdit = () => {
    setEditingActivityId(null);
    setEditForm({
      id: '',
      title: '',
      description: '',
      activityDate: '',
      location: '',
      userIds: [],
    });
  };

  const submitEdit = async () => {
    setMessage('');
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/activities', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudo actualizar la actividad.');
        setLoading(false);
        return;
      }

      setMessage('Actividad actualizada correctamente.');
      cancelEdit();
      await loadActivities();
    } catch (error) {
      setErrorMessage('Ocurrió un error al actualizar la actividad.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteActivity = async (activityId: string) => {
    const confirmed = window.confirm('¿Estás seguro de eliminar esta actividad?');

    if (!confirmed) return;

    setMessage('');
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch(`/api/activities?id=${activityId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudo eliminar la actividad.');
        setLoading(false);
        return;
      }

      setMessage('Actividad eliminada correctamente.');
      await loadActivities();
    } catch (error) {
      setErrorMessage('Ocurrió un error al eliminar la actividad.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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

  const canCreateActivities = hasPermission(currentUser.permissions, 'activities.create');
  const canEditActivities = hasPermission(currentUser.permissions, 'activities.update');
  const canDeleteActivities = hasPermission(currentUser.permissions, 'activities.delete');
  const canPassAttendance =
    hasPermission(currentUser.permissions, 'attendance.create') ||
    hasPermission(currentUser.permissions, 'attendance.update');

  const allSelected =
    users.length > 0 && users.every((user) => form.userIds.includes(user.id));

  const allEditSelected =
    users.length > 0 && users.every((user) => editForm.userIds.includes(user.id));

  return (
    <main
      style={{
        display: 'grid',
        gridTemplateColumns: canCreateActivities
          ? 'minmax(320px, 430px) minmax(0, 1fr)'
          : '1fr',
        gap: '20px',
      }}
    >
      {canCreateActivities && (
        <section className="card">
          <PageHeader
            title="Crear actividad"
            subtitle="Programa una actividad y asigna colaboradores"
          />

          {message ? <div className="alert alert-success" style={{ marginBottom: '12px' }}>{message}</div> : null}
          {errorMessage ? <div className="alert alert-error" style={{ marginBottom: '12px' }}>{errorMessage}</div> : null}

          <form onSubmit={submitCreate}>
            <div>
              <label>Título</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div>
              <label>Descripción</label>
              <input
                className="input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div>
              <label>Fecha y hora</label>
              <input
                className="input"
                type="datetime-local"
                value={form.activityDate}
                onChange={(e) => setForm({ ...form, activityDate: e.target.value })}
              />
            </div>

            <div>
              <label>Ubicación</label>
              <input
                className="input"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>

            <div>
              <label>Colaboradores asignados</label>

              <button
                type="button"
                className="button-secondary table-button"
                onClick={toggleAllUsers}
                style={{ marginBottom: '10px' }}
              >
                {allSelected ? 'Quitar todos' : 'Asignar a todos'}
              </button>

              <div
                style={{
                  maxHeight: '260px',
                  overflowY: 'auto',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '14px',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                {users.map((user) => (
                  <label
                    key={user.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      marginBottom: '10px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.userIds.includes(user.id)}
                      onChange={() => toggleUser(user.id)}
                      style={{ marginTop: '3px' }}
                    />
                    <span style={{ lineHeight: 1.4 }}>
                      {user.fullName}
                      <br />
                      <small>{user.email}</small>
                    </span>
                  </label>
                ))}

                {users.length === 0 && (
                  <p>No hay usuarios disponibles para asignar.</p>
                )}
              </div>
            </div>

            <button className="button" type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </form>
        </section>
      )}

      <section className="card">
        <PageHeader
          title="Actividades registradas"
          subtitle="Consulta actividades y pasa asistencia por actividad"
          right={<span style={{ opacity: 0.78 }}>Total: {activities.length}</span>}
        />

        {!canCreateActivities && message ? (
          <div className="alert alert-success" style={{ marginBottom: '12px' }}>{message}</div>
        ) : null}
        {!canCreateActivities && errorMessage ? (
          <div className="alert alert-error" style={{ marginBottom: '12px' }}>{errorMessage}</div>
        ) : null}

        {activities.length === 0 ? (
          <EmptyState
            title="Sin actividades"
            description="Todavía no hay actividades registradas."
          />
        ) : (
          <div className="table-wrap">
            <table className="table" style={{ width: '100%', minWidth: '1220px', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ width: '16%' }}>Título</th>
                  <th style={{ width: '18%' }}>Descripción</th>
                  <th style={{ width: '14%' }}>Fecha</th>
                  <th style={{ width: '14%' }}>Ubicación</th>
                  <th style={{ width: '12%' }}>Asignados</th>
                  <th style={{ width: '10%' }}>Creado por</th>
                  <th style={{ width: '16%' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => {
                  const isEditing = editingActivityId === activity.id;

                  return (
                    <tr key={activity.id}>
                      <td style={{ wordBreak: 'break-word' }}>
                        {isEditing ? (
                          <input
                            className="input"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          />
                        ) : (
                          activity.title
                        )}
                      </td>

                      <td style={{ wordBreak: 'break-word' }}>
                        {isEditing ? (
                          <input
                            className="input"
                            value={editForm.description}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                description: e.target.value,
                              })
                            }
                          />
                        ) : (
                          activity.description ?? '-'
                        )}
                      </td>

                      <td>
                        {isEditing ? (
                          <input
                            className="input"
                            type="datetime-local"
                            value={editForm.activityDate}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                activityDate: e.target.value,
                              })
                            }
                          />
                        ) : (
                          new Date(activity.activityDate).toLocaleString('es-GT')
                        )}
                      </td>

                      <td style={{ wordBreak: 'break-word' }}>
                        {isEditing ? (
                          <input
                            className="input"
                            value={editForm.location}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                location: e.target.value,
                              })
                            }
                          />
                        ) : (
                          activity.location ?? '-'
                        )}
                      </td>

                      <td>
                        {isEditing ? (
                          <div>
                            <button
                              type="button"
                              className="button-secondary table-button"
                              onClick={toggleAllEditUsers}
                              style={{ marginBottom: '8px' }}
                            >
                              {allEditSelected ? 'Quitar todos' : 'Asignar todos'}
                            </button>

                            <div
                              style={{
                                maxHeight: '180px',
                                overflowY: 'auto',
                                border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: '12px',
                                padding: '10px',
                              }}
                            >
                              {users.map((user) => (
                                <label
                                  key={user.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '8px',
                                    marginBottom: '8px',
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={editForm.userIds.includes(user.id)}
                                    onChange={() => toggleEditUser(user.id)}
                                    style={{ marginTop: '3px' }}
                                  />
                                  <span>
                                    {user.fullName}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ) : (
                          `${activity.assignedUsers?.length ?? 0} usuario(s)`
                        )}
                      </td>

                      <td style={{ wordBreak: 'break-word' }}>{activity.createdBy.fullName}</td>

                      <td>
                        <div className="table-actions">
                          {canPassAttendance && !isEditing && (
                            <button
                              className="button-success table-button"
                              type="button"
                              onClick={() => router.push(`/activities/${activity.id}/attendance`)}
                            >
                              Pasar asistencia
                            </button>
                          )}

                          {canEditActivities &&
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
                                onClick={() => startEdit(activity)}
                              >
                                Editar
                              </button>
                            ))}

                          {canDeleteActivities && !isEditing && (
                            <button
                              className="button-danger table-button"
                              type="button"
                              onClick={() => deleteActivity(activity.id)}
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
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}