import { useSelector } from 'react-redux';
import StatusPage from '../components/StatusPage.jsx';

export default function NotFound() {
  const { token, user } = useSelector((state) => state.auth);
  const signedIn = Boolean(token && user);

  return (
    <StatusPage
      code="404"
      eyebrow="Page not found"
      title="This page is off the board."
      description="The link may be outdated, or the page may have moved. Return to your workspace and continue where you left off."
      icon="notFound"
      primaryLabel={signedIn ? 'Open workspaces' : 'Go to sign in'}
      primaryTo={signedIn ? '/workspaces' : '/signin'}
    />
  );
}
