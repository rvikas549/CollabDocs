import Logo from './Logo';

export default function Splash() {
  return (
    <div className="splash" aria-busy="true" aria-label="Loading CollabDocs">
      <div className="splash-logo">
        <Logo size={56} />
      </div>
      <div className="splash-bar" />
    </div>
  );
}
