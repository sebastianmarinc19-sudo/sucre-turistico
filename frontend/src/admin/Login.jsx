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
    <section className="mx-auto" style={{ maxWidth: '380px' }}>
      <h2 className="h4 mb-3">Acceso de administrador</h2>
      <form className="card card-body" onSubmit={enviar}>
        <div className="mb-3">
          <label className="form-label small" htmlFor="login-email">Correo</label>
          <input id="login-email" type="email" className="form-control" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label small" htmlFor="login-password">Contraseña</label>
          <input id="login-password" type="password" className="form-control" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <div className="alert alert-warning small py-2" role="alert">{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </section>
  );
}

export default Login;
