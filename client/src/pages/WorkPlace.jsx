import AnimatedPage from '../components/ui/AnimatedPage.jsx';
import WorkPlaceComponent from '../components/WorkPlaceComponent.jsx';
import AddWorkPlaceComponent from '../components/AddWorkPlaceComponent.jsx';
import SharedWorkPlaceComponent from '../components/SharedWorkPlaceComponent.jsx';

export default function WorkPlace() {
  return (
    <AnimatedPage className="page-stack workspace-page-clean">
      <section className="page-header modern workspace-page-header">
        <div>
          <span className="eyebrow">Projects</span>
          <h1>Your workspaces</h1>
          <p>Create focused spaces, share them with teammates, and keep every ticket moving.</p>
        </div>
        <AddWorkPlaceComponent />
      </section>
      <WorkPlaceComponent />
      <SharedWorkPlaceComponent />
    </AnimatedPage>
  );
}
