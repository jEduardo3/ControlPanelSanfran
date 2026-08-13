import Link from 'next/link';
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/acceso');
  return (
    <main className="grid" style={{ gap: 24 }}>
      <section className="card">
        <h2>Resumen del proyecto</h2>
        <p>
          Este sistema permite administrar usuarios, actividades, asistencia, obligaciones financieras,
          pagos y excusas. Fue planteado para una tarea académica y sirve como MVP funcional.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link className="button" href="/dashboard">Ver dashboard</Link>
          <Link className="button secondary" href="/acceso">Probar login</Link>
        </div>
      </section>

      <section className="grid grid-2">
        <div className="card">
          <h3>Administrador</h3>
          <ul>
            <li>Crear usuarios</li>
            <li>Crear actividades</li>
            <li>Registrar asistencia</li>
            <li>Crear obligaciones y pagos</li>
          </ul>
        </div>
        <div className="card">
          <h3>Colaborador</h3>
          <ul>
            <li>Visualizar actividades</li>
            <li>Ver asistencia</li>
            <li>Revisar obligaciones y pagos</li>
            <li>Enviar excusas</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
