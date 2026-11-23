import { Link } from 'react-router-dom';

export default function NotFound({ title = 'Page not found', message = "The page you're looking for doesn't exist." }) {
  return (
    <div className="state-page">
      <div className="state-card">
        <h1>{title}</h1>
        <p>{message}</p>
        <Link to="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          Back to my documents
        </Link>
      </div>
    </div>
  );
}
