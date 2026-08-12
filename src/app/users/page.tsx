'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasPermission } from '../../lib/permissions';

type User = {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  role: {
    code: string;
    name: string;
  } | null;
};

type UserForm = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  roleCode:
    | 'SUPERADMIN'
    | 'ADMIN_GENERAL'
    | 'JUNTA'
    | 'TESORERIA'
    | 'SECRETARIA'
    | 'COLABORADOR';
};

type EditForm = {
  id: string;
  fullName: string;
  email: string;
 roleCode:
  | 'SUPERADMIN'
  | 'ADMIN_GENERAL'
  | 'JUNTA'
  | 'TESORERIA'
  | 'SECRETARIA'
  | 'COLABORADOR';
};

type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  roleCode: string | null;
  roleName: string | null;
  permissions: string[];
};

export default function UsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [form, setForm] = useState<UserForm>({
  fullName: '',
  username: '',
  email: '',
  password: '',
  roleCode: 'COLABORADOR',
});

  const [editForm, setEditForm] = useState<EditForm>({
    id: '',
    fullName: '',
    email: '',
    roleCode: 'COLABORADOR',
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

      if (!hasPermission(user.permissions, 'users.view')) {
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
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudieron cargar los usuarios.');
        return;
      }

      setUsers(data.data ?? []);
    } catch (error) {
      setErrorMessage('No se pudieron cargar los usuarios.');
      console.error(error);
    }
  }

  useEffect(() => {
    void loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      void loadUsers();
    }
  }, [currentUser]);

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudo crear el usuario.');
        setLoading(false);
        return;
      }

      setMessage('Usuario creado correctamente.');

      setForm({
        fullName: '',
        username: '',
        email: '',
        password: '',
        roleCode: 'COLABORADOR',
      });
            

      await loadUsers();
    } catch (error) {
      setErrorMessage('Ocurrió un error al crear el usuario.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user: User) => {
    setMessage('');
    setErrorMessage('');
    setEditingUserId(user.id);
    setEditForm({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      roleCode: (user.role?.code as EditForm['roleCode']) ?? 'COLABORADOR',
    });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditForm({
      id: '',
      fullName: '',
      email: '',
      roleCode: 'COLABORADOR',
    });
  };

  const submitEdit = async () => {
    setMessage('');
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudo actualizar el usuario.');
        setLoading(false);
        return;
      }

      setMessage('Usuario actualizado correctamente.');
      cancelEdit();
      await loadUsers();
    } catch (error) {
      setErrorMessage('Ocurrió un error al actualizar el usuario.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (user: User) => {
    setMessage('');
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          isActive: !user.isActive,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(
          data.error ?? 'No se pudo actualizar el estado del usuario.'
        );
        setLoading(false);
        return;
      }

      setMessage(
        user.isActive
          ? 'Usuario desactivado correctamente.'
          : 'Usuario activado correctamente.'
      );

      await loadUsers();
    } catch (error) {
      setErrorMessage('Ocurrió un error al cambiar el estado del usuario.');
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

  if (!currentUser) {
    return null;
  }

  const canCreateUsers = hasPermission(currentUser.permissions, 'users.create');
  const canEditUsers = hasPermission(currentUser.permissions, 'users.update');
  const canActivateUsers = hasPermission(currentUser.permissions, 'users.activate');
  const canDeactivateUsers = hasPermission(
    currentUser.permissions,
    'users.deactivate'
  );

  return (
    <main
      className="responsive-split"
      style={{
        display: 'grid',
        gridTemplateColumns: canCreateUsers ? 'minmax(320px, 420px) minmax(0, 1fr)' : '1fr',
        gap: '20px',
      }}
    >
      {canCreateUsers && (
        <section className="card">
          <h2 style={{ marginBottom: '16px' }}>Crear usuario</h2>

          <form onSubmit={submitCreate}>
            <div>
              <label>Nombre completo</label>
              <input
                className="input"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>
            <div>
            <label>Usuario</label>
            <input
              className="input"
              value={form.username}
              placeholder="Ej. Jestrada"
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>

            <div>
              <label>Correo</label>
              <input
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label>Contraseña</label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div>
              <label>Rol</label>
              <select
                className="select"
                value={form.roleCode}
                onChange={(e) =>
                  setForm({
                    ...form,
                    roleCode: e.target.value as UserForm['roleCode'],
                  })
                }
              >
                <option value="SUPERADMIN">SUPERADMIN</option>
                <option value="ADMIN_GENERAL">ADMIN_GENERAL</option>
                <option value="TESORERIA">TESORERIA</option>
                <option value="SECRETARIA">SECRETARIA</option>
                <option value="COLABORADOR">COLABORADOR</option>
                <option value="JUNTA">JUNTA</option>
              </select>
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
          <h2>Usuarios registrados</h2>
          <span style={{ opacity: 0.78 }}>Total: {users.length}</span>
        </div>

        {message && (
          <p style={{ color: '#0bdf1d', marginBottom: '12px' }}>{message}</p>
        )}

        {errorMessage && (
          <p style={{ color: '#f51808', marginBottom: '12px' }}>
            {errorMessage}
          </p>
        )}

        <div className="table-scroll" style={{ overflowX: 'auto' }}>
          <table
            className="table"
            style={{ width: '100%', minWidth: '980px', tableLayout: 'fixed' }}
          >
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Nombre</th>
                <th style={{ width: '24%' }}>Email</th>
                <th style={{ width: '16%' }}>Rol</th>
                <th style={{ width: '12%' }}>Estado</th>
                <th style={{ width: '26%' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isEditing = editingUserId === user.id;

                const canToggleThisUser =
                  (user.isActive && canDeactivateUsers) ||
                  (!user.isActive && canActivateUsers);

                return (
                  <tr key={user.id}>
                    <td style={{ wordBreak: 'break-word' }}>
                      {isEditing ? (
                        <input
                          className="input"
                          value={editForm.fullName}
                          onChange={(e) =>
                            setEditForm({ ...editForm, fullName: e.target.value })
                          }
                        />
                      ) : (
                        user.fullName
                      )}
                    </td>

                    <td style={{ wordBreak: 'break-word' }}>
                      {isEditing ? (
                        <input
                          className="input"
                          value={editForm.email}
                          onChange={(e) =>
                            setEditForm({ ...editForm, email: e.target.value })
                          }
                        />
                      ) : (
                        user.email
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <select
                          className="select"
                          value={editForm.roleCode}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              roleCode: e.target.value as EditForm['roleCode'],
                            })
                          }
                        >
                          <option value="SUPERADMIN">SUPERADMIN</option>
                          <option value="ADMIN_GENERAL">ADMIN_GENERAL</option>
                          <option value="TESORERIA">TESORERIA</option>
                          <option value="SECRETARIA">SECRETARIA</option>
                          <option value="COLABORADOR">COLABORADOR</option>
                        </select>
                      ) : (
                        user.role?.name ?? 'Sin rol'
                      )}
                    </td>

                    <td>{user.isActive ? 'Activo' : 'Inactivo'}</td>

                    <td>
                     <div className="table-actions">
                        {canEditUsers &&
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
                              onClick={() => startEdit(user)}
                            >
                              Editar
                            </button>
                          ))}

                        {canToggleThisUser && !isEditing && (
                          <button
                            className={user.isActive ? 'button-danger table-button' : 'button-success table-button'}
                            type="button"
                            onClick={() => toggleUserStatus(user)}
                            disabled={loading}
                          >
                            {user.isActive ? 'Desactivar' : 'Activar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && (
                <tr>
                  <td colSpan={5}>No hay usuarios registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
