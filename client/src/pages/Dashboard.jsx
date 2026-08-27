import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import FileUpload from '../components/FileUpload.jsx';
import AvatarUpload from '../components/AvatarUpload.jsx';
import AnimatedPage from '../components/ui/AnimatedPage.jsx';
import { fetchWorkplaces } from '../features/workplaces/workplacesSlice.js';
import { apiRequest } from '../api/http.js';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
const card = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const ranges = [7, 30, 90];

function safeDate(value, options = { month: 'short', year: 'numeric' }) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Recently' : new Intl.DateTimeFormat(undefined, options).format(date);
}

function ChangeBadge({ value }) {
  const number = Number(value || 0);
  const direction = number > 0 ? 'up' : number < 0 ? 'down' : 'flat';
  return <span className={`change-badge ${direction}`}>{number > 0 ? '+' : number < 0 ? '−' : ''}{Math.abs(number)}%</span>;
}

function TrendChart({ data }) {
  const width = 720;
  const height = 220;
  const padding = 28;
  const max = Math.max(1, ...data.map((item) => item.count));
  const points = data.map((item, index) => {
    const x = data.length === 1 ? width / 2 : padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - (item.count / max) * (height - padding * 2);
    return { ...item, x, y };
  });
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  const area = points.length ? `${path} L ${points.at(-1).x} ${height - padding} L ${points[0].x} ${height - padding} Z` : '';

  return (
    <div className="analytics-chart-wrap">
      <svg className="analytics-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Workspace creation trend">
        <defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity=".16" /><stop offset="100%" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
        {[0, .5, 1].map((ratio) => <line key={ratio} x1={padding} x2={width - padding} y1={padding + ratio * (height - padding * 2)} y2={padding + ratio * (height - padding * 2)} className="chart-grid-line" />)}
        {area && <path d={area} fill="url(#trendFill)" />}
        {path && <path d={path} className="chart-line" />}
        {points.map((point) => <circle key={point.date} cx={point.x} cy={point.y} r="4" className="chart-point"><title>{`${safeDate(point.date, { month: 'short', day: 'numeric' })}: ${point.count}`}</title></circle>)}
      </svg>
      <div className="chart-axis"><span>{data[0] ? safeDate(data[0].date, { month: 'short', day: 'numeric' }) : ''}</span><span>{data.at(-1) ? safeDate(data.at(-1).date, { month: 'short', day: 'numeric' }) : ''}</span></div>
    </div>
  );
}

export default function Dashboard() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const workplaces = useSelector((state) => state.workplaces.items);
  const workplaceStatus = useSelector((state) => state.workplaces.fetchStatus);
  const [resumeName, setResumeName] = useState(user.resume_originalName);
  const [resumeUrl, setResumeUrl] = useState(user.resume_url);
  const [rangeDays, setRangeDays] = useState(30);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsStatus, setAnalyticsStatus] = useState('idle');

  useEffect(() => { if (workplaceStatus === 'idle') dispatch(fetchWorkplaces()); }, [dispatch, workplaceStatus]);
  useEffect(() => {
    let active = true;
    setAnalyticsStatus('loading');
    apiRequest(`/analytics/dashboard?days=${rangeDays}`, { token })
      .then((data) => { if (active) { setAnalytics(data); setAnalyticsStatus('ready'); } })
      .catch(() => { if (active) setAnalyticsStatus('error'); });
    return () => { active = false; };
  }, [rangeDays, token, workplaces.length]);

  const summary = analytics?.summary;
  const completion = useMemo(() => {
    const checks = [Boolean(user.name), Boolean(user.email), Boolean(user.avatarUrl), Boolean(resumeUrl), workplaces.length > 0];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [user.name, user.email, user.avatarUrl, resumeUrl, workplaces.length]);

  const stats = [
    { label: 'Total workspaces', value: analyticsStatus === 'loading' ? '—' : (summary?.totalWorkspaces ?? workplaces.length), meta: 'All project spaces', change: summary?.workspaceChange },
    { label: `New in ${rangeDays} days`, value: analyticsStatus === 'loading' ? '—' : (summary?.newWorkspaces ?? 0), meta: 'Compared with prior period', change: summary?.workspaceChange },
    { label: 'Profile completion', value: `${completion}%`, meta: resumeUrl ? 'Resume attached' : 'Add a resume to complete your profile' },
    ...(analytics?.admin ? [{ label: 'User retention', value: `${analytics.admin.retentionRate}%`, meta: `${analytics.admin.activeUsers} of ${analytics.admin.totalUsers} accounts enabled`, change: analytics.admin.userGrowth }] : []),
  ];

  return (
    <AnimatedPage className="page-stack overview-clean">
      <motion.section className="overview-intro" initial="hidden" animate="show" variants={card}>
        <div>
          <span className="eyebrow">Overview</span>
          <h1>Workspace activity at a glance.</h1>
          <p>Review recent activity, workspace growth, profile progress, and your documents without extra dashboard noise.</p>
        </div>
        <Link className="button button-primary" to="/workspaces">Open workspaces</Link>
      </motion.section>

      <div className="analytics-toolbar glass clean-toolbar">
        <div><span className="eyebrow">Reporting period</span><strong>Compare workspace activity</strong></div>
        <div className="range-selector" aria-label="Analytics date range">
          {ranges.map((range) => <button type="button" key={range} className={rangeDays === range ? 'active' : ''} onClick={() => setRangeDays(range)}>{range}D</button>)}
        </div>
      </div>

      <motion.section className="stat-grid analytics-stats clean-stats" initial="hidden" animate="show" transition={{ staggerChildren: 0.06 }}>
        {stats.map((item) => (
          <motion.article className="stat-card glass" variants={card} key={item.label}>
            <span>{item.label}</span>
            <div className="stat-value-row"><strong>{item.value}</strong>{item.change !== undefined && <ChangeBadge value={item.change} />}</div>
            <small>{item.meta}</small>
          </motion.article>
        ))}
      </motion.section>

      <section className="analytics-layout">
        <motion.article className="surface-card glass analytics-main" variants={card} initial="hidden" animate="show">
          <div className="section-heading"><div><span className="eyebrow">Historical trend</span><h2>Workspace creation</h2></div><span className="secure-chip">Last {rangeDays} days</span></div>
          {analyticsStatus === 'loading' ? <div className="chart-loading skeleton" /> : analyticsStatus === 'error' ? <div className="analytics-empty">Analytics could not be loaded.</div> : <TrendChart data={analytics?.workspaceTrend || []} />}
        </motion.article>
        <motion.article className="surface-card glass" variants={card} initial="hidden" animate="show">
          <div className="section-heading"><div><span className="eyebrow">Recent events</span><h2>Activity</h2></div><span className="activity-count">{analytics?.recentEvents?.length || 0}</span></div>
          <div className="activity-feed">
            {analyticsStatus === 'loading' && [1, 2, 3, 4].map((item) => <div className="activity-skeleton skeleton" key={item} />)}
            {analyticsStatus === 'ready' && analytics?.recentEvents?.length === 0 && <div className="analytics-empty">Create or edit a workspace to start your activity feed.</div>}
            {analytics?.recentEvents?.map((event) => <div className="activity-item" key={event.id}><span className={`activity-dot ${event.type}`} /><div><strong>{event.description}</strong><small>{safeDate(event.createdAt, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</small></div></div>)}
          </div>
        </motion.article>
      </section>

      <section className="dashboard-grid profile-tools-grid">
        <motion.article className="surface-card glass avatar-settings-card" variants={card} initial="hidden" animate="show">
          <div className="section-heading"><div><span className="eyebrow">Profile photo</span><h2>Change avatar</h2></div></div>
          <AvatarUpload />
        </motion.article>
        <motion.article className="surface-card glass" variants={card} initial="hidden" animate="show">
          <FileUpload setResumeName={setResumeName} setResumeUrl={setResumeUrl} />
        </motion.article>
      </section>

      <motion.section className="surface-card glass resume-card" variants={card} initial="hidden" animate="show">
        <div className="section-heading"><div><span className="eyebrow">Document</span><h2>Resume preview</h2></div></div>
        {resumeUrl ? <><p className="file-name">{resumeName}</p><iframe title="Uploaded resume" src={`${API_ORIGIN}${resumeUrl}`} /></> : <div className="empty-modern"><strong>No resume yet</strong><p>Upload a PDF to preview it here.</p></div>}
      </motion.section>
    </AnimatedPage>
  );
}
