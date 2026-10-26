import { KeyRound, LogIn, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { mensajeDeError } from '../api/client';
import { iniciarSesion, usuarioActual } from '../api/sesion';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  if (usuarioActual()) return <Navigate to="/admin" replace />;

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await iniciarSesion(email, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      // En el login, el 401 trae el mensaje util del servidor ("Credenciales invalidas").
      setError(err.response?.status === 401 ? 'Correo o contraseña incorrectos.' : mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="st-login">
      <div className="st-login-tarjeta">
        <span className="st-login-icono"><ShieldCheck size={28} aria-hidden="true" /></span>
        <h1 className="h4">Acceso de administrador</h1>
        <p className="text-muted small">Gestiona destinos, alojamientos, restaurantes, experiencias y eventos.</p>
        <form onSubmit={enviar}>
          <div className="mb-3">
            <label className="form-label small" htmlFor="login-email">Correo</label>
            <div className="st-campo-icono">
              <Mail size={17} aria-hidden="true" />
              <input id="login-email" type="email" className="form-control" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label small" htmlFor="login-password">Contraseña</label>
            <div className="st-campo-icono">
              <KeyRound size={17} aria-hidden="true" />
              <input id="login-password" type="password" className="form-control" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          {error && <div className="alert alert-warning small py-2" role="alert">{error}</div>}
          <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
            <LogIn size={17} aria-hidden="true" /> {enviando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </section>
  );
}

export default Login;
