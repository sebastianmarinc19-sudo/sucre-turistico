import { TreePalm } from 'lucide-react';
import { Link } from 'react-router-dom';

function Logo() {
  return (
    <Link to="/" className="st-logo" aria-label="Sucre Turístico, inicio">
      <span className="st-logo-mark"><TreePalm size={19} aria-hidden="true" /></span>
      <span className="st-logo-text">
        <strong>SUCRE TURÍSTICO</strong>
        <small>Golfo de Morrosquillo</small>
      </span>
    </Link>
  );
}

export default Logo;
