import { Link } from 'react-router-dom';

function Logo() {
  return (
    <Link to="/" className="st-logo" aria-label="Sucre Turístico, inicio">
      <span className="st-logo-mark"><i className="fas fa-umbrella-beach" aria-hidden="true" /></span>
      <span className="st-logo-text">
        <strong>SUCRE TURÍSTICO</strong>
        <small>Golfo de Morrosquillo</small>
      </span>
    </Link>
  );
}

export default Logo;
