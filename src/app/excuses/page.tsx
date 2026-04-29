'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasPermission } from '@/lib/permissions';
import PageHeader from '@/components/ui/page-header';
import EmptyState from '@/components/ui/empty-state';
import StatusBadge from '@/components/ui/status-badge';

type CurrentUser = {
  id: string;
  fullName: string;
  permissions: string[];
};

type Activity = {
  id: string;
  title: string;
  activityDate: string;
};

type ExcuseItem = {
  id: string;
  reason: string;
  status: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  createdAt: string;
  reviewedAt?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentMimeType?: string | null;
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
  reviewedBy?: {
    fullName: string;
  } | null;
};

type EditExcuseForm = {
  excuseId: string;
  activityId: string;
  reason: string;
  removeAttachment: boolean;
  replaceAttachment: boolean;
};

function getStatusVariant(status: ExcuseItem['status']) {
  if (status === 'APROBADA') return 'success';
  if (status === 'RECHAZADA') return 'danger';
  return 'warning';
}

export default function ExcusesPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [excuses, setExcuses] = useState<ExcuseItem[]>([]);

  const [form, setForm] = useState({
    activityId: '',
    reason: '',
  });

  const [attachment, setAttachment] = useState<File | null>(null);

  const [editingExcuseId, setEditingExcuseId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditExcuseForm>({
    excuseId: '',
    activityId: '',
    reason: '',
    removeAttachment: false,
    replaceAttachment: false,
  });
  const [editAttachment, setEditAttachment] = useState<File | null>(null);

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
        hasPermission(user.permissions, 'excuses.view') ||
        hasPermission(user.permissions, 'excuses.view.own');

      if (!canView && !hasPermission(user.permissions, 'excuses.create')) {
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
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await res.json();

      if (res.ok) {
        const now = new Date();
        const futureActivities = (data.data ?? []).filter(
          (activity: Activity) => new Date(activity.activityDate) > now
        );
        setActivities(futureActivities);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function loadExcuses() {
    try {
      const res = await fetch('/api/excuses', {
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await res.json();

      if (res.ok) {
        setExcuses(data.data ?? []);
      } else {
        setErrorMessage(data.error ?? 'No se pudieron cargar las excusas.');
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('No se pudieron cargar las excusas.');
    }
  }

  useEffect(() => {
    void loadMe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      void loadExcuses();

      if (hasPermission(currentUser.permissions, 'excuses.create')) {
        void loadActivities();
      }
    }
  }, [currentUser]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setMessage('');
    setErrorMessage('');
    setLoading(true);

    try {
      const payload = new FormData();
      payload.append('activityId', form.activityId);
      payload.append('reason', form.reason);

      if (attachment) {
        payload.append('attachment', attachment);
      }

      const res = await fetch('/api/excuses', {
        method: 'POST',
        credentials: 'include',
        body: payload,
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudo enviar la excusa.');
        setLoading(false);
        return;
      }

      setMessage('Excusa enviada correctamente.');
      setForm({
        activityId: '',
        reason: '',
      });
      setAttachment(null);

      const fileInput = document.getElementById('excuse-attachment') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';

      await loadExcuses();
    } catch (error) {
      console.error(error);
      setErrorMessage('Ocurrió un error al enviar la excusa.');
    } finally {
      setLoading(false);
    }
  }

  function startEditExcuse(excuse: ExcuseItem) {
    setMessage('');
    setErrorMessage('');
    setEditingExcuseId(excuse.id);
    setEditForm({
      excuseId: excuse.id,
      activityId: excuse.activity.id,
      reason: excuse.reason,
      removeAttachment: false,
      replaceAttachment: false,
    });
    setEditAttachment(null);
  }

  function cancelEditExcuse() {
    setEditingExcuseId(null);
    setEditForm({
      excuseId: '',
      activityId: '',
      reason: '',
      removeAttachment: false,
      replaceAttachment: false,
    });
    setEditAttachment(null);

    const fileInput = document.getElementById('edit-excuse-attachment') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';
  }

  async function submitEditExcuse() {
    setMessage('');
    setErrorMessage('');
    setLoading(true);

    try {
      const payload = new FormData();
      payload.append('excuseId', editForm.excuseId);
      payload.append('activityId', editForm.activityId);
      payload.append('reason', editForm.reason);
      payload.append('removeAttachment', String(editForm.removeAttachment));
      payload.append('replaceAttachment', String(editForm.replaceAttachment));

      if (editAttachment) {
        payload.append('attachment', editAttachment);
      }

      const res = await fetch('/api/excuses', {
        method: 'PATCH',
        credentials: 'include',
        body: payload,
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudo actualizar la excusa.');
        setLoading(false);
        return;
      }

      setMessage('Excusa actualizada correctamente.');
      cancelEditExcuse();
      await loadExcuses();
    } catch (error) {
      console.error(error);
      setErrorMessage('Ocurrió un error al actualizar la excusa.');
    } finally {
      setLoading(false);
    }
  }

  async function reviewExcuse(excuseId: string, status: 'APROBADA' | 'RECHAZADA') {
    setMessage('');
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/excuses/review', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excuseId, status }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudo revisar la excusa.');
        setLoading(false);
        return;
      }

      setMessage(
        status === 'APROBADA'
          ? 'Excusa aprobada correctamente.'
          : 'Excusa rechazada correctamente.'
      );
      await loadExcuses();
    } catch (error) {
      console.error(error);
      setErrorMessage('Ocurrió un error al revisar la excusa.');
    } finally {
      setLoading(false);
    }
  }

  async function deleteExcuse(excuseId: string) {
    const confirmed = window.confirm('¿Estás seguro de eliminar esta excusa?');
    if (!confirmed) return;

    setMessage('');
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch(`/api/excuses?id=${excuseId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudo eliminar la excusa.');
        setLoading(false);
        return;
      }

      setMessage('Excusa eliminada correctamente.');
      await loadExcuses();
    } catch (error) {
      console.error(error);
      setErrorMessage('Ocurrió un error al eliminar la excusa.');
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

  const canCreate = hasPermission(currentUser.permissions, 'excuses.create');
  const canReview = hasPermission(currentUser.permissions, 'excuses.review');
  const canDelete = hasPermission(currentUser.permissions, 'excuses.delete');

  return (
    <main style={{ display: 'grid', gap: '20px' }}>
      {message ? <div className="alert alert-success">{message}</div> : null}
      {errorMessage ? <div className="alert alert-error">{errorMessage}</div> : null}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: canCreate ? 'minmax(320px, 420px) minmax(0, 1fr)' : '1fr',
          gap: '20px',
        }}
      >
        {canCreate && (
          <section className="card">
            <PageHeader
              title="Enviar excusa"
              subtitle="Registra una justificación con evidencia opcional"
            />

            <form onSubmit={submit}>
              <div>
                <label>Actividad</label>
                <select
                  className="select"
                  value={form.activityId}
                  onChange={(e) => setForm({ ...form, activityId: e.target.value })}
                >
                  <option value="">Seleccione una actividad</option>
                  {activities.map((activity) => (
                    <option key={activity.id} value={activity.id}>
                      {activity.title} — {new Date(activity.activityDate).toLocaleDateString('es-GT')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Justificación</label>
                <textarea
                  className="input"
                  rows={6}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  style={{ resize: 'vertical', minHeight: '140px' }}
                />
              </div>

              <div>
                <label>Evidencia opcional</label>
                <input
                  id="excuse-attachment"
                  className="input"
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setAttachment(file);
                  }}
                />
                <small style={{ opacity: 0.8, display: 'block', marginTop: '8px' }}>
                  Formatos permitidos: PDF, JPG, PNG, WEBP. Máximo 5 MB.
                </small>
              </div>

              <button className="button" type="submit" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar excusa'}
              </button>
            </form>
          </section>
        )}

        <section className="card">
          <PageHeader
            title="Listado de excusas"
            subtitle="Revisa el estado de cada solicitud"
            right={<span style={{ opacity: 0.8 }}>Total: {excuses.length}</span>}
          />

          {excuses.length === 0 ? (
            <EmptyState
              title="Sin excusas registradas"
              description="Todavía no hay solicitudes disponibles para mostrar."
            />
          ) : (
            <div className="table-wrap">
              <table className="table" style={{ width: '100%', minWidth: '1280px', tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th style={{ width: '12%' }}>Usuario</th>
                    <th style={{ width: '16%' }}>Actividad</th>
                    <th style={{ width: '22%' }}>Justificación</th>
                    <th style={{ width: '10%' }}>Estado</th>
                    <th style={{ width: '10%' }}>Fecha</th>
                    <th style={{ width: '12%' }}>Evidencia</th>
                    <th style={{ width: '10%' }}>Revisó</th>
                    <th style={{ width: '18%' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {excuses.map((excuse) => {
                    const isOwn = currentUser.id === excuse.user.id;
                    const isPending = excuse.status === 'PENDIENTE';
                    const isFuture = new Date(excuse.activity.activityDate) > new Date();
                    const canEditOwn = canCreate && isOwn && isPending && isFuture;
                    const isEditing = editingExcuseId === excuse.id;

                    return (
                      <tr key={excuse.id}>
                        <td style={{ wordBreak: 'break-word' }}>
                          <div style={{ fontWeight: 600 }}>{excuse.user.fullName}</div>
                          <div style={{ opacity: 0.75, fontSize: '12px', marginTop: '4px' }}>
                            {excuse.user.email}
                          </div>
                        </td>

                        <td style={{ wordBreak: 'break-word' }}>
                          {isEditing ? (
                            <select
                              className="select"
                              value={editForm.activityId}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  activityId: e.target.value,
                                })
                              }
                            >
                              <option value="">Seleccione una actividad</option>
                              {activities.map((activity) => (
                                <option key={activity.id} value={activity.id}>
                                  {activity.title} — {new Date(activity.activityDate).toLocaleDateString('es-GT')}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <>
                              <div style={{ fontWeight: 600 }}>{excuse.activity.title}</div>
                              <div style={{ opacity: 0.75, fontSize: '12px', marginTop: '4px' }}>
                                {new Date(excuse.activity.activityDate).toLocaleString('es-GT')}
                              </div>
                            </>
                          )}
                        </td>

                        <td style={{ wordBreak: 'break-word' }}>
                          {isEditing ? (
                            <textarea
                              className="input"
                              rows={5}
                              value={editForm.reason}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  reason: e.target.value,
                                })
                              }
                              style={{ resize: 'vertical', minHeight: '120px' }}
                            />
                          ) : (
                            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                              {excuse.reason}
                            </div>
                          )}
                        </td>

                        <td>
                          <StatusBadge
                            label={excuse.status}
                            variant={getStatusVariant(excuse.status)}
                          />
                        </td>

                        <td>{new Date(excuse.createdAt).toLocaleDateString('es-GT')}</td>

                        <td>
                          {isEditing ? (
                            <div>
                              {excuse.attachmentUrl && (
                                <div style={{ marginBottom: '8px' }}>
                                  <a
                                    href={excuse.attachmentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ color: '#7ee787', wordBreak: 'break-word' }}
                                  >
                                    {excuse.attachmentName ?? 'Ver archivo actual'}
                                  </a>
                                </div>
                              )}

                              <label style={{ display: 'block', marginBottom: '8px' }}>
                                <input
                                  type="checkbox"
                                  checked={editForm.removeAttachment}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      removeAttachment: e.target.checked,
                                      replaceAttachment: e.target.checked
                                        ? false
                                        : editForm.replaceAttachment,
                                    })
                                  }
                                />{' '}
                                Quitar archivo
                              </label>

                              <label style={{ display: 'block', marginBottom: '8px' }}>
                                <input
                                  type="checkbox"
                                  checked={editForm.replaceAttachment}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      replaceAttachment: e.target.checked,
                                      removeAttachment: e.target.checked
                                        ? false
                                        : editForm.removeAttachment,
                                    })
                                  }
                                />{' '}
                                Reemplazar archivo
                              </label>

                              {editForm.replaceAttachment && (
                                <input
                                  id="edit-excuse-attachment"
                                  className="input"
                                  type="file"
                                  accept=".pdf,image/jpeg,image/png,image/webp"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] ?? null;
                                    setEditAttachment(file);
                                  }}
                                />
                              )}
                            </div>
                          ) : excuse.attachmentUrl ? (
                            <a
                              href={excuse.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#7ee787', wordBreak: 'break-word' }}
                            >
                              {excuse.attachmentName ?? 'Ver archivo'}
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>

                        <td>{excuse.reviewedBy?.fullName ?? '-'}</td>

                        <td>
                         <div
                              className="actions-wrap"
                              style={{
                                display: 'flex',
                                gap: '6px',
                                flexWrap: 'wrap',
                                alignItems: 'flex-start',
                              }}
                            >
                            {canEditOwn &&
                              (isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    className="button-success"
                                    style={{
                                        padding: '8px 10px',
                                        fontSize: '12px',
                                        borderRadius: '10px',
                                        width: 'auto',
                                      }}
                                    onClick={submitEditExcuse}
                                    disabled={loading}
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    type="button"
                                    className="button-secondary"
                                    style={{
                                  padding: '8px 10px',
                                  fontSize: '12px',
                                  borderRadius: '10px',
                                  width: 'auto',
                                }}
                                    onClick={cancelEditExcuse}
                                  >
                                    Cancelar
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  className="button-secondary"
                                  style={{
                                      padding: '8px 10px',
                                      fontSize: '12px',
                                      borderRadius: '10px',
                                      width: 'auto',
                                    }}
                                  onClick={() => startEditExcuse(excuse)}
                                >
                                  Editar
                                </button>
                              ))}

                            {canReview && !isEditing && (
                              <>
                                <button
                                  type="button"
                                  className="button-success"
                                  style={{
                                      padding: '8px 10px',
                                      fontSize: '12px',
                                      borderRadius: '10px',
                                      width: 'auto',
                                    }}
                                  onClick={() => reviewExcuse(excuse.id, 'APROBADA')}
                                  disabled={loading}
                                >
                                  Aprobar
                                </button>

                                <button
                                  type="button"
                                  className="button-danger"
                                  style={{
                                        padding: '8px 10px',
                                        fontSize: '12px',
                                        borderRadius: '10px',
                                        width: 'auto',
                                      }}
                                  onClick={() => reviewExcuse(excuse.id, 'RECHAZADA')}
                                  disabled={loading}
                                >
                                  Rechazar
                                </button>
                              </>
                            )}

                            {canDelete && !isEditing && (
                              <button
                                type="button"
                                className="button-danger"
                                style={{
                                    padding: '8px 10px',
                                    fontSize: '12px',
                                    borderRadius: '10px',
                                    width: 'auto',
                                  }}
                                onClick={() => deleteExcuse(excuse.id)}
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
      </section>
    </main>
  );
}