export default function Footer() {
  return (
    <footer className="app-footer">
      <div>
        <strong>Trello-W</strong>
        <span>Simple boards for focused teams.</span>
      </div>
      <nav aria-label="Footer links">
        <a href="#privacy">Privacy</a>
        <a href="#terms">Terms</a>
        <a href="mailto:support@example.com">Support</a>
      </nav>
      <small>© {new Date().getFullYear()} Wolf Group</small>
    </footer>
  );
}
