export default function FormFieldIcon({ type, className = '' }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    className,
  };

  if (type === 'user') {
    return <svg {...common}><circle cx="12" cy="8" r="3.5" /><path d="M5.5 20c.7-4 3-6 6.5-6s5.8 2 6.5 6" /></svg>;
  }
  if (type === 'lock') {
    return <svg {...common}><rect x="5" y="10" width="14" height="10" rx="2.5" /><path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" /><path d="M12 14.5v2" /></svg>;
  }
  if (type === 'eye') {
    return <svg {...common}><path d="M2.8 12s3.3-5 9.2-5 9.2 5 9.2 5-3.3 5-9.2 5-9.2-5-9.2-5Z" /><circle cx="12" cy="12" r="2.3" /></svg>;
  }
  if (type === 'eyeOff') {
    return <svg {...common}><path d="m4 4 16 16" /><path d="M10.3 7.2A9.8 9.8 0 0 1 12 7c5.9 0 9.2 5 9.2 5a15 15 0 0 1-2.2 2.7" /><path d="M14.1 14.2a3 3 0 0 1-4.2-4.3" /><path d="M6.1 6.2C4 7.7 2.8 12 2.8 12s3.3 5 9.2 5c1 0 2-.2 2.8-.5" /></svg>;
  }
  return <svg {...common}><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="m4.5 7 7.5 5.5L19.5 7" /></svg>;
}
