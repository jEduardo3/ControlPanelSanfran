'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasPermission } from '../../lib/permissions';
import { fetchCurrentSession } from '../../lib/client-session';

type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  roleCode: string | null;
  roleName: string | null;
  permissions: string[];
};

type AppUser = {
  id: string;
  fullName: string;
  email: string;
};

type TreasuryItem = {
  id: string;
  assignedAmount: string;
  balance: string;
  status: string;
  assignedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  obligation: {
    id: string;
    title: string;
    description?: string | null;
    amount: string;
    dueDate: string;
    isActive: boolean;
  };
};

type ObligationForm = {
  title: string;
  description: string;
  amount: string;
  dueDate: string;
  userIds: string[];
};

type EditForm = {
  obligationId: string;
  title: string;
  description: string;
  amount: string;
  dueDate: string;
};

export default function TreasuryPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [users, setUsers] = useState<AppUser[]>([]);
  const [items, setItems] = useState<TreasuryItem[]>([]);

  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [editingObligationId, setEditingObligationId] = useState<string | null>(null);

  const [form, setForm] = useState<ObligationForm>({
    title: '',
    description: '',
    amount: '',
    dueDate: '',
    userIds: [],
  });

  const [editForm, setEditForm] = useState<EditForm>({
    obligationId: '',
    title: '',
    description: '',
    amount: '',
    dueDate: '',
  });

  async function loadCurrentUser() {
    try {
      const session = await fetchCurrentSession<CurrentUser>();
      if (!session.ok || !session.user) {
        router.push('/acceso');
        return;
      }
      const user = session.user;

      const canView =
        hasPermission(user.permissions, 'treasury.view') ||
        hasPermission(user.permissions, 'treasury.view.own');

      if (!canView) {
        router.push('/dashboard');
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

  async function loadTreasury() {
    try {
      const res = await fetch('/api/obligations', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudo cargar tesorería.');
        return;
      }

      setItems(data.data ?? []);
    } catch (error) {
      console.error(error);
      setErrorMessage('No se pudo cargar tesorería.');
    }
  }

  async function loadUsers() {
    try {
      const res = await fetch('/api/users?scope=obligation-assignees', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) return;

      const data = await res.json();
      setUsers(data.data ?? []);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    void loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      void loadTreasury();

      if (hasPermission(currentUser.permissions, 'obligations.create')) {
        void loadUsers();
      }
    }
  }, [currentUser]);

  const canCreateObligations = Boolean(
    currentUser?.permissions &&
      hasPermission(currentUser.permissions, 'obligations.create')
  );

  const canEditObligations = Boolean(
    currentUser?.permissions &&
      hasPermission(currentUser.permissions, 'obligations.update')
  );

  const canDeleteObligations = Boolean(
    currentUser?.permissions &&
      hasPermission(currentUser.permissions, 'obligations.delete')
  );

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/obligations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudo crear la obligación.');
        setLoading(false);
        return;
      }

      setMessage('Obligación creada correctamente.');
      setForm({
        title: '',
        description: '',
        amount: '',
        dueDate: '',
        userIds: [],
      });

      await loadTreasury();
    } catch (error) {
      console.error(error);
      setErrorMessage('Ocurrió un error al crear la obligación.');
    } finally {
      setLoading(false);
    }
  }

  function startEdit(item: TreasuryItem) {
    setMessage('');
    setErrorMessage('');
    setEditingObligationId(item.obligation.id);
    setEditForm({
      obligationId: item.obligation.id,
      title: item.obligation.title,
      description: item.obligation.description ?? '',
      amount: String(item.obligation.amount),
      dueDate: new Date(item.obligation.dueDate).toISOString().slice(0, 10),
    });
  }

  function cancelEdit() {
    setEditingObligationId(null);
    setEditForm({
      obligationId: '',
      title: '',
      description: '',
      amount: '',
      dueDate: '',
    });
  }

  async function submitEdit() {
    setMessage('');
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/obligations', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          amount: Number(editForm.amount),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudo actualizar la obligación.');
        setLoading(false);
        return;
      }

      setMessage('Obligación actualizada correctamente.');
      cancelEdit();
      await loadTreasury();
    } catch (error) {
      console.error(error);
      setErrorMessage('Ocurrió un error al actualizar la obligación.');
    } finally {
      setLoading(false);
    }
  }

  async function deleteObligation(obligationId: string) {
    const confirmed = window.confirm(
      '¿Estás seguro de eliminar esta obligación?'
    );

    if (!confirmed) return;

    setMessage('');
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch(`/api/obligations?id=${obligationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudo eliminar la obligación.');
        setLoading(false);
        return;
      }

      setMessage('Obligación eliminada correctamente.');
      await loadTreasury();
    } catch (error) {
      console.error(error);
      setErrorMessage('Ocurrió un error al eliminar la obligación.');
    } finally {
      setLoading(false);
    }
  }

  function toggleUser(userId: string) {
    setForm((prev) => ({
      ...prev,
      userIds: prev.userIds.includes(userId)
        ? prev.userIds.filter((id) => id !== userId)
        : [...prev.userIds, userId],
    }));
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

  return (
    <main
      className="treasury-layout"
      style={{
        display: 'grid',
        gridTemplateColumns: canCreateObligations
          ? 'minmax(320px, 420px) minmax(0, 1fr)'
          : '1fr',
        gap: '20px',
      }}
    >
      {canCreateObligations && (
        <section className="card">
          <h2 style={{ marginBottom: '16px' }}>Crear obligación</h2>

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
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <div>
              <label>Monto</label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>

            <div>
              <label>Fecha límite</label>
              <input
                className="input"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>

            <div>
              <label>Asignar a usuarios</label>
              <div
                style={{
                  maxHeight: '220px',
                  overflowY: 'auto',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '14px',
                  padding: '12px',
                  marginTop: '8px',
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
                      {user.fullName} — {user.email}
                    </span>
                  </label>
                ))}
                {users.length === 0 && <p>No hay usuarios disponibles.</p>}
              </div>
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
          <h2>Obligaciones registradas</h2>
          <span style={{ opacity: 0.78 }}>Total: {items.length}</span>
        </div>

        {message && (
          <p style={{ color: '#7ee787', marginBottom: '12px' }}>{message}</p>
        )}

        {errorMessage && (
          <p style={{ color: '#ff7b72', marginBottom: '12px' }}>
            {errorMessage}
          </p>
        )}

        <div className="table-scroll" style={{ overflowX: 'auto' }}>
          <table
            className="table"
            style={{ width: '100%', minWidth: '1180px', tableLayout: 'fixed' }}
          >
            <thead>
              <tr>
                <th style={{ width: '16%' }}>Usuario</th>
                <th style={{ width: '18%' }}>Obligación</th>
                <th style={{ width: '14%' }}>Descripción</th>
                <th style={{ width: '10%' }}>Monto</th>
                <th style={{ width: '10%' }}>Saldo</th>
                <th style={{ width: '10%' }}>Estado</th>
                <th style={{ width: '10%' }}>Vence</th>
                <th style={{ width: '12%' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isEditing = editingObligationId === item.obligation.id;

                return (
                  <tr key={item.id}>
                    <td style={{ wordBreak: 'break-word' }}>{item.user.fullName}</td>

                    <td style={{ wordBreak: 'break-word' }}>
                      {isEditing ? (
                        <input
                          className="input"
                          value={editForm.title}
                          onChange={(e) =>
                            setEditForm({ ...editForm, title: e.target.value })
                          }
                        />
                      ) : (
                        item.obligation.title
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
                        item.obligation.description ?? '-'
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <input
                          className="input"
                          type="number"
                          step="0.01"
                          value={editForm.amount}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              amount: e.target.value,
                            })
                          }
                        />
                      ) : (
                        `Q ${Number(item.assignedAmount).toFixed(2)}`
                      )}
                    </td>

                    <td>Q {Number(item.balance).toFixed(2)}</td>

                    <td>{item.status}</td>

                    <td>
                      {isEditing ? (
                        <input
                          className="input"
                          type="date"
                          value={editForm.dueDate}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              dueDate: e.target.value,
                            })
                          }
                        />
                      ) : (
                        new Date(item.obligation.dueDate).toLocaleDateString('es-GT')
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {canEditObligations &&
                          (isEditing ? (
                            <>
                              <button
                                className="button"
                                type="button"
                                onClick={submitEdit}
                                disabled={loading}
                              >
                                Guardar
                              </button>
                              <button
                                className="button"
                                type="button"
                                onClick={cancelEdit}
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <button
                              className="button"
                              type="button"
                              onClick={() => startEdit(item)}
                            >
                              Editar
                            </button>
                          ))}

                        {canDeleteObligations && !isEditing && (
                          <button
                            className="button"
                            type="button"
                            onClick={() => deleteObligation(item.obligation.id)}
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

              {items.length === 0 && (
                <tr>
                  <td colSpan={8}>No hay obligaciones registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
