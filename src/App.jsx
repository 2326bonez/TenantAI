import { useState } from "react";

const navItems = ["Dashboard", "Analyze", "My Cases", "Documents", "Messages", "Resources", "Profile"];

export default function App() {
  const [active, setActive] = useState("Dashboard");
  const [form, setForm] = useState({ state: "", city: "", input: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function analyze(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setResult(await response.json());
    } catch {
      setResult({ error: "The analysis service could not be reached." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setActive("Dashboard")}><span className="brand-mark">T</span>TenantAI</button>
        <p className="eyebrow sidebar-label">Your housing workspace</p>
        <nav aria-label="Main navigation">
          {navItems.map((item) => <button key={item} className={active === item ? "nav-item active" : "nav-item"} onClick={() => setActive(item)}><span>{({ Dashboard: "⌂", Analyze: "✦", "My Cases": "▣", Documents: "◇", Messages: "✉", Resources: "◎", Profile: "○" })[item]}</span>{item}</button>)}
        </nav>
        <div className="sidebar-footer"><span className="avatar">G</span><div><strong>Guest workspace</strong><small>Account setup required</small></div></div>
      </aside>
      <main className="main-content">
        <header className="topbar"><div><p className="eyebrow">TenantAI / {active}</p><h1>{active === "Dashboard" ? "Welcome to TenantAI" : active}</h1></div><span className="status-pill">Preview workspace</span></header>
        {active === "Dashboard" && <Dashboard onNavigate={setActive} />}
        {active === "Analyze" && <Analyze form={form} update={update} submit={analyze} loading={loading} result={result} />}
        {active === "My Cases" && <Unconnected title="My cases" description="Case tracking will be connected after authentication and server-side persistence are implemented." />}
        {active === "Documents" && <Unconnected title="Documents & evidence" description="Secure uploads for leases, photos, notices, repair requests, and other housing records are not configured yet. No upload is being simulated." />}
        {active === "Messages" && <Unconnected title="Messages" description="Editable landlord and property-manager communications will be connected to authenticated cases in a later phase." />}
        {active === "Profile" && <Unconnected title="Profile & account" description="Clerk is listed as a dependency, but authentication is not wired or configured in this repository. Add the required Clerk keys before enabling accounts and protected routes." />}
        {active === "Resources" && <Resources />}
      </main>
    </div>
  );
}

function Dashboard({ onNavigate }) {
  return <>
    <section className="hero-card"><div><p className="eyebrow light">A clearer path forward</p><h2>Understand your housing situation. Organize your evidence. Know what to do next.</h2><p>TenantAI helps renters turn housing concerns into organized, professional next steps.</p><button className="light-button" onClick={() => onNavigate("Analyze")}>Analyze a housing issue <span>→</span></button></div><div className="hero-art" aria-hidden="true"><span>✦</span><span>▤</span><span>⌁</span></div></section>
    <div className="section-heading"><div><p className="eyebrow">Your workspace</p><h2>Overview</h2></div></div>
    <section className="stats"><div><span>Active cases</span><strong>—</strong><small>Connect an account to track cases</small></div><div><span>Evidence items</span><strong>—</strong><small>Secure storage not connected</small></div><div><span>Next follow-ups</span><strong>—</strong><small>No dates recorded</small></div></section>
    <section className="panel empty"><span className="empty-icon">▣</span><h3>No cases yet</h3><p>Cases, activity, and deadlines will appear here once authenticated server-side storage is connected.</p><button className="secondary" onClick={() => onNavigate("Analyze")}>Analyze a housing issue</button></section>
    <div className="quick-grid"><QuickAction title="Analyze an issue" text="Get structured next steps" onClick={() => onNavigate("Analyze")} /><QuickAction title="Add evidence" text="Storage configuration required" onClick={() => onNavigate("Documents")} /><QuickAction title="Find resources" text="Explore trusted starting points" onClick={() => onNavigate("Resources")} /></div>
  </>;
}

function QuickAction({ title, text, onClick }) { return <button className="quick-action" onClick={onClick}><span className="quick-icon">✦</span><span><strong>{title}</strong><small>{text}</small></span><b>→</b></button>; }

function Analyze({ form, update, submit, loading, result }) {
  const issues = result?.issues || [], steps = result?.steps || [], resources = result?.resources || [];
  return <div className="workspace-grid"><section className="panel"><div className="panel-heading"><div><p className="eyebrow">Guided analysis</p><h2>Describe what is happening</h2></div><span className="ai-badge">AI-assisted</span></div><p className="muted">Share the facts and TenantAI will organize potential concerns, next steps, evidence to gather, and an editable message. This is not legal advice.</p><form onSubmit={submit} className="analysis-form"><div className="field-row"><label>State<input required name="state" value={form.state} onChange={update} placeholder="e.g. California" /></label><label>City <span className="optional">(optional)</span><input name="city" value={form.city} onChange={update} placeholder="Your city" /></label></div><label>What happened?<textarea required name="input" value={form.input} onChange={update} rows="8" placeholder="Include dates, communications, notices, and what you need help deciding..." /></label><button className="primary" disabled={loading}>{loading ? "Analyzing…" : "Analyze my situation →"}</button></form></section>{result && <section className="panel"><div className="panel-heading"><div><p className="eyebrow">TenantAI analysis</p><h2>What to do next</h2></div></div>{result.error && <div className="error-box"><strong>Analysis needs attention</strong><p>{result.error}</p>{result.note && <small>{result.note}</small>}</div>}{!result.error && <><div className="ai-disclaimer">AI-generated guidance · Review local requirements and consider qualified legal help for decisions.</div>{issues.length > 0 && <ResultSection title="Potential housing concerns">{issues.map((item, i) => <div className="result-card" key={i}><strong>{item.title}</strong><span className="risk">{item.riskLevel || "Review"}</span><p>{item.description}</p></div>)}</ResultSection>}<ResultSection title="What to do next"><ol>{steps.map((step, i) => <li key={i}>{step}</li>)}</ol></ResultSection>{result.communication?.template && <ResultSection title="Suggested communication"><textarea className="template" defaultValue={result.communication.template} /><button className="secondary" onClick={() => navigator.clipboard?.writeText(result.communication.template)}>Copy message</button></ResultSection>}{resources.length > 0 && <ResultSection title="Helpful resources"><ul className="resource-list">{resources.map((item, i) => <li key={i}><a href={item.url} target="_blank" rel="noreferrer">{item.name} ↗</a><p>{item.description}</p></li>)}</ul></ResultSection>}</>}</section>}</div>;
}

function ResultSection({ title, children }) { return <section className="result-section"><h3>{title}</h3>{children}</section>; }
function Unconnected({ title, description }) { return <section className="panel config-panel"><span className="config-icon">◇</span><p className="eyebrow">Configuration required</p><h2>{title}</h2><p>{description}</p><div className="config-note"><strong>Not connected yet</strong><span>This area is intentionally unavailable until real authentication, authorization, and server-side persistence are configured.</span></div></section>; }
function Resources() { return <section className="panel page-panel"><p className="eyebrow">Starting points</p><h2>Resources</h2><p className="muted">TenantAI uses attributable public sources and does not invent local organizations or legal deadlines.</p><div className="resource-cards"><a href="https://www.lawhelp.org/" target="_blank" rel="noreferrer"><strong>LawHelp</strong><span>Find legal aid and local assistance.</span>↗</a><a href="https://www.hud.gov/" target="_blank" rel="noreferrer"><strong>HUD</strong><span>Federal housing programs and information.</span>↗</a><a href="https://www.usa.gov/housing-help" target="_blank" rel="noreferrer"><strong>USA.gov housing help</strong><span>Government guidance and assistance pathways.</span>↗</a></div></section>; }
