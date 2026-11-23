import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFound({
  emoji = '🛸',
  title = 'Lost in space',
  message = "The page you're looking for drifted away — or never existed.",
}) {
  return (
    <div className="state-page">
      <div className="state-card animate-fade-up">
        <div className="state-emoji">{emoji}</div>
        <h1 className="display">{title}</h1>
        <p>{message}</p>
        <Link to="/" className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }}>
          <ArrowLeft /> Back to your documents
        </Link>
      </div>
    </div>
  );
}
