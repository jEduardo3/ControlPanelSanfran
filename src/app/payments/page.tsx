'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasPermission } from '../../lib/permissions';
import { fetchCurrentSession } from '../../lib/client-session';
import PageHeader from '../../components/ui/page-header';
import EmptyState from '../../components/ui/empty-state';
type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  roleCode: string | null;
  roleName: string | null;
  permissions: string[];
};

type UserObligationItem = {
  id: string;
  assignedAmount: string;
  balance: string;
  status: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  obligation: {
    id: string;
    title: string;
    amount: string;
    dueDate: string;
  };
};

type PaymentItem = {
  id: string;
  amountPaid: string;
  paymentDate: string;
  paymentMethod?: string | null;
  notes?: string | null;
  receiptUrl?: string | null;
  registeredBy: {
    fullName: string;
  };
  userObligation: {
    id: string;
    user: {
      fullName: string;
      email: string;
    };
    obligation: {
      title: string;
    };
  };
};

type PaymentForm = {
  userObligationId: string;
  amountPaid: string;
  paymentMethod: string;
  notes: string;
};

type EditPaymentForm = {
  id: string;
  amountPaid: string;
  paymentMethod: string;
  notes: string;
};

export default function PaymentsPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [obligations, setObligations] = useState<UserObligationItem[]>([]);

  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

  const [form, setForm] = useState<PaymentForm>({
    userObligationId: '',
    amountPaid: '',
    paymentMethod: 'EFECTIVO',
    notes: '',
  });

  const [editForm, setEditForm] = useState<EditPaymentForm>({
    id: '',
    amountPaid: '',
    paymentMethod: 'EFECTIVO',
    notes: '',
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
        hasPermission(user.permissions, 'payments.view') ||
        hasPermission(user.permissions, 'payments.view.own');

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

  async function loadPayments() {
    try {
      const res = await fetch('/api/payments', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudieron cargar los pagos.');
        return;
      }

      setPayments(data.data ?? []);
    } catch (error) {
      console.error(error);
      setErrorMessage('No se pudieron cargar los pagos.');
    }
  }

  async function loadObligations() {
    try {
      const res = await fetch('/api/obligations', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await res.json();

      if (!res.ok) return;

      const pendingOnly = (data.data ?? []).filter(
        (item: UserObligationItem) => Number(item.balance) > 0
      );

      setObligations(pendingOnly);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    void loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      void loadPayments();

      if (hasPermission(currentUser.permissions, 'payments.create')) {
        void loadObligations();
      }
    }
  }, [currentUser]);

  const canCreatePayments = Boolean(
    currentUser && hasPermission(currentUser.permissions, 'payments.create')
  );

  const canEditPayments = Boolean(
    currentUser && hasPermission(currentUser.permissions, 'payments.update')
  );

  const canDeletePayments = Boolean(
    currentUser && hasPermission(currentUser.permissions, 'payments.delete')
  );

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amountPaid: Number(form.amountPaid),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudo registrar el pago.');
        setLoading(false);
        return;
      }

      setMessage('Pago registrado correctamente y recibo generado.');

      setForm({
        userObligationId: '',
        amountPaid: '',
        paymentMethod: 'EFECTIVO',
        notes: '',
      });

      await loadPayments();
      await loadObligations();
    } catch (error) {
      console.error(error);
      setErrorMessage('Ocurrió un error al registrar el pago.');
    } finally {
      setLoading(false);
    }
  }

  function startEdit(payment: PaymentItem) {
    setMessage('');
    setErrorMessage('');
    setEditingPaymentId(payment.id);
    setEditForm({
      id: payment.id,
      amountPaid: String(payment.amountPaid),
      paymentMethod: payment.paymentMethod ?? 'EFECTIVO',
      notes: payment.notes ?? '',
    });
  }

  function cancelEdit() {
    setEditingPaymentId(null);
    setEditForm({
      id: '',
      amountPaid: '',
      paymentMethod: 'EFECTIVO',
      notes: '',
    });
  }

  async function submitEdit() {
    setMessage('');
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/payments', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          amountPaid: Number(editForm.amountPaid),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudo actualizar el pago.');
        setLoading(false);
        return;
      }

      setMessage('Pago actualizado correctamente.');
      cancelEdit();
      await loadPayments();
      await loadObligations();
    } catch (error) {
      console.error(error);
      setErrorMessage('Ocurrió un error al actualizar el pago.');
    } finally {
      setLoading(false);
    }
  }

  async function deletePayment(paymentId: string) {
    const confirmed = window.confirm('¿Estás seguro de eliminar este pago?');

    if (!confirmed) return;

    setMessage('');
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch(`/api/payments?id=${paymentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'No se pudo eliminar el pago.');
        setLoading(false);
        return;
      }

      setMessage('Pago eliminado correctamente.');
      await loadPayments();
      await loadObligations();
    } catch (error) {
      console.error(error);
      setErrorMessage('Ocurrió un error al eliminar el pago.');
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

  return (
    <main
      className="responsive-split"
      style={{
        display: 'grid',
        gridTemplateColumns: canCreatePayments
          ? 'minmax(320px, 420px) minmax(0, 1fr)'
          : '1fr',
        gap: '20px',
      }}
    >
      {canCreatePayments && (
        <section className="card">
          <PageHeader
            title="Registrar pago"
            subtitle="Ingresa un nuevo pago y genera su recibo"
          />

          <form onSubmit={submitCreate}>
            <div>
              <label>Obligación</label>
              <select
                className="select"
                value={form.userObligationId}
                onChange={(e) =>
                  setForm({ ...form, userObligationId: e.target.value })
                }
              >
                <option value="">Seleccione una obligación</option>
                {obligations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.user.fullName} — {item.obligation.title} — Saldo Q{' '}
                    {Number(item.balance).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Monto pagado</label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={form.amountPaid}
                onChange={(e) =>
                  setForm({ ...form, amountPaid: e.target.value })
                }
              />
            </div>

            <div>
              <label>Método de pago</label>
              <select
                className="select"
                value={form.paymentMethod}
                onChange={(e) =>
                  setForm({ ...form, paymentMethod: e.target.value })
                }
              >
                <option value="EFECTIVO">EFECTIVO</option>
                <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                <option value="DEPOSITO">DEPOSITO</option>
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
        <PageHeader
          title="Historial de pagos"
          subtitle="Consulta, edita o elimina registros de pago"
          right={<span style={{ opacity: 0.78 }}>Total: {payments.length}</span>}
        />

        {message ? <div className="alert alert-success" style={{ marginBottom: '12px' }}>{message}</div> : null}
        {errorMessage ? <div className="alert alert-error" style={{ marginBottom: '12px' }}>{errorMessage}</div> : null}

        {payments.length === 0 ? (
          <EmptyState
            title="Sin pagos registrados"
            description="Todavía no hay movimientos disponibles para mostrar."
          />
        ) : (
          <div className="table-wrap">
            <table
              className="table"
              style={{ width: '100%', minWidth: '1180px', tableLayout: 'fixed' }}
            >
              <thead>
                <tr>
                  <th style={{ width: '16%' }}>Usuario</th>
                  <th style={{ width: '16%' }}>Obligación</th>
                  <th style={{ width: '10%' }}>Monto</th>
                  <th style={{ width: '14%' }}>Fecha</th>
                  <th style={{ width: '12%' }}>Método</th>
                  <th style={{ width: '12%' }}>Registrado por</th>
                  <th style={{ width: '10%' }}>Recibo</th>
                  <th style={{ width: '10%' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const isEditing = editingPaymentId === payment.id;

                  return (
                    <tr key={payment.id}>
                      <td style={{ wordBreak: 'break-word' }}>
                        {payment.userObligation.user.fullName}
                      </td>

                      <td style={{ wordBreak: 'break-word' }}>
                        {payment.userObligation.obligation.title}
                      </td>

                      <td>
                        {isEditing ? (
                          <input
                            className="input"
                            type="number"
                            step="0.01"
                            value={editForm.amountPaid}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                amountPaid: e.target.value,
                              })
                            }
                          />
                        ) : (
                          `Q ${Number(payment.amountPaid).toFixed(2)}`
                        )}
                      </td>

                      <td>{new Date(payment.paymentDate).toLocaleString('es-GT')}</td>

                      <td>
                        {isEditing ? (
                          <select
                            className="select"
                            value={editForm.paymentMethod}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                paymentMethod: e.target.value,
                              })
                            }
                          >
                            <option value="EFECTIVO">EFECTIVO</option>
                            <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                            <option value="DEPOSITO">DEPOSITO</option>
                          </select>
                        ) : (
                          payment.paymentMethod ?? '-'
                        )}
                      </td>

                      <td style={{ wordBreak: 'break-word' }}>
                        {payment.registeredBy.fullName}
                      </td>

                      <td>
                        {payment.receiptUrl ? (
                          <a
                            href={payment.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#7ee787' }}
                          >
                            Ver recibo
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td>
                       <div className="table-actions">
                          {canEditPayments &&
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
                                onClick={() => startEdit(payment)}
                              >
                                Editar
                              </button>
                            ))}

                          {canDeletePayments && !isEditing && (
                            <button
                                className="button-danger table-button"
                                type="button"
                                onClick={() => deletePayment(payment.id)}
                                disabled={loading}
                              >
                                Eliminar
                              </button>
                          )}
                        </div>

                        {isEditing && (
                          <div style={{ marginTop: '8px' }}>
                            <label>Notas</label>
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
                          </div>
                        )}
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
