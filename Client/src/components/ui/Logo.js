import { FileText } from 'lucide-react';

export default function Logo({ size = 32, withText = false }) {
  return (
    <span className="logo">
      <span className="logo-mark" style={{ width: size, height: size }} aria-hidden="true">
        <FileText size={Math.round(size * 0.56)} />
      </span>
      {withText && <span className="logo-name">CollabDocs</span>}
    </span>
  );
}
