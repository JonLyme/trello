import StatusPage from '../components/StatusPage.jsx';

export default function AccessDenied() {
  return (
    <StatusPage
      code="403"
      eyebrow="Access denied"
      title="You do not have permission."
      description="This area is limited to workspace administrators. You can return to your workspaces or ask an administrator for access."
      icon="denied"
      primaryLabel="Open workspaces"
      primaryTo="/workspaces"
    />
  );
}
