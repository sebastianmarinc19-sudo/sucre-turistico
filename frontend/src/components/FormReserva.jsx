import { CalendarCheck, CircleCheck } from 'lucide-react';
import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import api, { mensajeDeError } from '../api/client';
import { CATALOGO, RESERVABLES } from '../catalogo';
import { hoy, rangoDeFechas } from '../fechas';

// AAAA-MM-DD + n dias.
function sumarDias(fecha, dias) {
  const d = new Date(`${fecha}T12:00:00`);
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const VACIO = { nombre_cliente: '', telefono: '', email: '', fecha_inicio: '', fecha_fin: '', hora: '', personas: '2', mensaje: '' };

// Solicitud de reserva, sin crear cuenta. Llega a la bandeja "Reservas" del
// negocio, que contacta al turista para confirmar. No se cobra nada aqui.
function FormReserva({ seccion, registro, abierto, onCerrar }) {
  const tipo = RESERVABLES[seccion];
  const [valores, setValores] = useState(VACIO);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [enviada, setEnviada] = useState(null);

  if (!tipo) return null;
  const minimoHoy = hoy();
  const maxPersonas = (seccion === 'alojamiento' && registro.capacidad) || 50;
  const poner = (campo) => (e) => setValores((v) => ({ ...v, [campo]: e.target.value }));

  function cerrar() {
    if (enviando) return;
    onCerrar();
    // Al cerrar despues de enviar, el formulario queda limpio para otra reserva.
    if (enviada) { setEnviada(null); setValores(VACIO); }
    setError(null);
  }

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const cuerpo = {
        ...valores,
        personas: Number(valores.personas),
        email: valores.email.trim() || undefined,
        fecha_fin: tipo.conSalida ? valores.fecha_fin : undefined,
        hora: tipo.conHora ? valores.hora : undefined,
      };
      await api.post(`${CATALOGO[seccion].endpoint}/${registro.id}/reservas`, cuerpo);
      setEnviada(cuerpo);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal show={abierto} onHide={cerrar} centered>
      {enviada ? (
        <>
          <Modal.Body className="text-center p-4">
            <span className="st-reserva-ok"><CircleCheck size={34} aria-hidden="true" /></span>
            <h2 className="h4 mt-3">¡Solicitud enviada!</h2>
            <p className="text-muted mb-3">
              <strong>{registro.nombre}</strong> recibió tu solicitud para {tipo.conSalida
                ? rangoDeFechas(enviada.fecha_inicio, enviada.fecha_fin)
                : rangoDeFechas(enviada.fecha_inicio)}{tipo.conHora ? ` a las ${enviada.hora}` : ''}, {enviada.personas} {enviada.personas === 1 ? 'persona' : 'personas'}.
            </p>
            <p className="small mb-0">Te van a contactar al <strong>{enviada.telefono}</strong> para confirmar. Reservar aquí no tiene costo: el pago se acuerda con el lugar.</p>
          </Modal.Body>
          <Modal.Footer><button type="button" className="btn btn-primary w-100" onClick={cerrar}>Listo</button></Modal.Footer>
        </>
      ) : (
        <form onSubmit={enviar} className="d-contents">
          <Modal.Header closeButton>
            <Modal.Title as="h2" className="h5">{tipo.titulo} · {registro.nombre}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row g-3">
              <div className={tipo.conSalida || tipo.conHora ? 'col-6' : 'col-12 col-sm-6'}>
                <label className="form-label small" htmlFor="res-inicio">{tipo.fechaInicio}</label>
                <input id="res-inicio" type="date" className="form-control" required min={minimoHoy}
                  value={valores.fecha_inicio} onChange={poner('fecha_inicio')} />
              </div>
              {tipo.conSalida && (
                <div className="col-6">
                  <label className="form-label small" htmlFor="res-fin">Salida</label>
                  <input id="res-fin" type="date" className="form-control" required
                    min={valores.fecha_inicio ? sumarDias(valores.fecha_inicio, 1) : sumarDias(minimoHoy, 1)}
                    value={valores.fecha_fin} onChange={poner('fecha_fin')} />
                </div>
              )}
              {tipo.conHora && (
                <div className="col-6">
                  <label className="form-label small" htmlFor="res-hora">Hora</label>
                  <input id="res-hora" type="time" className="form-control" required value={valores.hora} onChange={poner('hora')} />
                </div>
              )}
              <div className={tipo.conSalida || tipo.conHora ? 'col-12 col-sm-6' : 'col-12 col-sm-6'}>
                <label className="form-label small" htmlFor="res-personas">{tipo.personas}</label>
                <input id="res-personas" type="number" className="form-control" required min={1} max={maxPersonas}
                  value={valores.personas} onChange={poner('personas')} />
              </div>
              <div className="col-12 col-sm-6">
                <label className="form-label small" htmlFor="res-nombre">Tu nombre</label>
                <input id="res-nombre" className="form-control" required autoComplete="name" value={valores.nombre_cliente} onChange={poner('nombre_cliente')} />
              </div>
              <div className="col-12 col-sm-6">
                <label className="form-label small" htmlFor="res-tel">Teléfono o WhatsApp</label>
                <input id="res-tel" type="tel" className="form-control" required autoComplete="tel" placeholder="300 123 4567"
                  value={valores.telefono} onChange={poner('telefono')} />
              </div>
              <div className="col-12 col-sm-6">
                <label className="form-label small" htmlFor="res-email">Correo <span className="text-muted">(opcional)</span></label>
                <input id="res-email" type="email" className="form-control" autoComplete="email" value={valores.email} onChange={poner('email')} />
              </div>
              <div className="col-12">
                <label className="form-label small" htmlFor="res-mensaje">Algo que deba saber el lugar <span className="text-muted">(opcional)</span></label>
                <textarea id="res-mensaje" rows={2} className="form-control" maxLength={1000} value={valores.mensaje} onChange={poner('mensaje')} />
              </div>
            </div>
            <p className="small text-muted mt-3 mb-0">No necesitas cuenta. Tus datos solo los ve este negocio, para confirmarte la reserva.</p>
            {error && <div className="alert alert-warning small mt-3 mb-0" role="alert">{error}</div>}
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="btn btn-light" onClick={cerrar} disabled={enviando}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={enviando}>
              <CalendarCheck size={17} aria-hidden="true" /> {enviando ? 'Enviando…' : 'Enviar solicitud'}
            </button>
          </Modal.Footer>
        </form>
      )}
    </Modal>
  );
}

export default FormReserva;
