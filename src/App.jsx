import { useState } from "react";
import { SignIn, SignUp, SignedIn, SignedOut, UserButton, useAuth, useUser } from "@clerk/clerk-react";

const navItems = ["Dashboard", "Analyze", "My Cases", "Documents", "Messages", "Resources", "Profile"];
const protectedItems = new Set(["Dashboard", "My Cases", "Documents", "Messages", "Profile"]);

export default function App({ authConfigured = true }) {
  return authConfigured ? <ClerkApp /> : <TenantApp authConfigured={false} />;
}

function ClerkApp() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  if (!isLoaded) return <div className="auth-loading">Loading TenantAI…</div>;
  return <TenantApp signedIn={Boolean(isSignedIn)} user={user} authConfigured />;
}

function TenantApp({ signedIn = false, user, authConfigured }) {
  const [active, setActive] = useState(signedIn ? "Dashboard" : "Analyze");
  const [form, setForm] = useState({ state: "", city: "", input: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authView, setAuthView] = useState(null);

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const navigate = (item) => {
    if (protectedItems.has(item) && !signedIn) {
      setAuthView("sign-in");
      return;
    }
    setActive(item);
  };

  async function analyze(event) {
    event.preventDefault(); setLoading(true);
    try {
      const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setResult(await response.json());
    } catch { setResult({ error: "The analysis service could not be reached." }); }
    finally { setLoading(false); }
  }

  if (authView) return <AuthPage view={authView} onChange={setAuthView} onBack={() => setAuthView(null)} authConfigured={authConfigured} />;

  return <div className="app-shell">
    <aside className="sidebar">
      <button className="brand" onClick={() => navigate("Dashboard")}><span className="brand-mark">T</span>TenantAI</button>
      <p className="eyebrow sidebar-label">Your housing workspace</p>
      <nav aria-label="Main navigation">{navItems.map((item) => <button key={item} className={active === item ? "nav-item active" : "nav-item"} onClick={() => navigate(item)}><span>{({ Dashboard: "⌂", Analyze: "✦", "My Cases": "▣", Documents: "◇", Messages: "✉", Resources: "◎", Profile: "○" })[item]}</span>{item}{protectedItems.has(item) && !signedIn ? <small className="lock">Sign in</small> : null}</button>)}</nav>
      <div className="sidebar-footer">{signedIn ? <><UserButton afterSignOutUrl="/" /><div><strong>{user?.firstName || user?.username || "Tenant"}</strong><small>Signed in</small></div></> : <><span className="avatar">G</span><div><strong>Guest workspace</strong><small>Analysis available publicly</small></div></>}</div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div><p className="eyebrow">TenantAI / {active}</p><h1>{active === "Dashboard" ? "Welcome to TenantAI" : active}</h1></div><div className="topbar-actions">{signedIn ? <UserButton afterSignOutUrl="/" /> : <><button className="text-button" onClick={() => setAuthView("sign-in")}>Sign in</button><button className="primary compact" onClick={() => setAuthView("sign-up")}>Create account</button></>}<span className="status-pill">{signedIn ? "Authenticated" : "Public analysis"}</span></div></header>
      {!authConfigured && <div className="notice">Clerk is not configured in this environment. Add <code>VITE_CLERK_PUBLISHABLE_KEY</code>, <code>CLERK_SECRET_KEY</code>, and restart the app to enable real accounts.</div>}
      {active === "Dashboard" && <Dashboard onNavigate={navigate} signedIn={signedIn} />}
      {active === "Analyze" && <Analyze form={form} update={update} submit={analyze} loading={loading} result={result} />}
      {active === "My Cases" && <Unconnected title="My cases" description="Case tracking will be connected after authentication and server-side persistence are implemented." />}
      {active === "Documents" && <Unconnected title="Documents & evidence" description="Secure uploads for leases, photos, notices, repair requests, and other housing records are not configured yet. No upload is being simulated." />}
      {active === "Messages" && <Unconnected title="Messages" description="Editable landlord and property-manager communications will be connected to authenticated cases in a later phase." />}
      {active === "Profile" && <Profile authConfigured={authConfigured} signedIn={signedIn} />}
      {active === "Resources" && <Resources />}
    </main>
  </div>;
}

function AuthPage({ view, onChange, onBack, authConfigured }) {
  if (!authConfigured) return <div className="auth-page"><section className="auth-card"><button className="brand auth-brand" onClick={onBack}><span className="brand-mark">T</span>TenantAI</button><h1>Account setup required</h1><p>Clerk authentication is not configured for this environment.</p><div className="config-note"><strong>Required configuration</strong><span>Set VITE_CLERK_PUBLISHABLE_KEY for the browser and CLERK_SECRET_KEY for Express. No fake authentication is used.</span></div><button className="secondary" onClick={onBack}>Continue with public analysis</button></section></div>;
  return <div className="auth-page"><section className="auth-card"><button className="brand auth-brand" onClick={onBack}><span className="brand-mark">T</span>TenantAI</button>{view === "sign-in" ? <SignIn routing="hash" signUpUrl="#sign-up" /> : <SignUp routing="hash" signInUrl="#sign-in" />}<button className="back-button" onClick={onBack}>← Continue as a guest</button><button className="text-button" onClick={() => onChange(view === "sign-in" ? "sign-up" : "sign-in")}>{view === "sign-in" ? "Need an account? Sign up" : "Already have an account? Sign in"}</button></section></div>;
}

function Dashboard({ onNavigate, signedIn }) { return <><section className="hero-card"><div><p className="eyebrow light">A clearer path forward</p><h2>Understand your housing situation. Organize your evidence. Know what to do next.</h2><p>TenantAI helps renters turn housing concerns into organized, professional next steps.</p><button className="light-button" onClick={() => onNavigate("Analyze")}>Analyze a housing issue <span>→</span></button></div><div className="hero-art" aria-hidden="true"><span>✦</span><span>▤</span><span>⌁</span></div></section><div className="section-heading"><div><p className="eyebrow">Your workspace</p><h2>Overview</h2></div></div><section className="stats"><div><span>Active cases</span><strong>—</strong><small>{signedIn ? "Persistence not connected" : "Sign in to access cases"}</small></div><div><span>Evidence items</span><strong>—</strong><small>Secure storage not connected</small></div><div><span>Next follow-ups</span><strong>—</strong><small>No dates recorded</small></div></section><section className="panel empty"><span className="empty-icon">▣</span><h3>No cases yet</h3><p>Cases, activity, and deadlines will appear here once authenticated server-side storage is connected.</p><button className="secondary" onClick={() => onNavigate(signedIn ? "My Cases" : "sign-in")}>{signedIn ? "View my cases" : "Sign in to manage cases"}</button></section><div className="quick-grid"><QuickAction title="Analyze an issue" text="Available without an account" onClick={() => onNavigate("Analyze")} /><QuickAction title="Add evidence" text="Storage configuration required" onClick={() => onNavigate("Documents")} /><QuickAction title="Find resources" text="Explore trusted starting points" onClick={() => onNavigate("Resources")} /></div></>; }
function QuickAction({ title, text, onClick }) { return <button className="quick-action" onClick={onClick}><span className="quick-icon">✦</span><span><strong>{title}</strong><small>{text}</small></span><b>→</b></button>; }
function Analyze({ form, update, submit, loading, result }) { const issues = result?.issues || [], steps = result?.steps || [], resources = result?.resources || []; return <div className="workspace-grid"><section className="panel"><div className="panel-heading"><div><p className="eyebrow">Guided analysis</p><h2>Describe what is happening</h2></div><span className="ai-badge">AI-assisted</span></div><p className="muted">Share the facts and TenantAI will organize potential concerns, next steps, evidence to gather, and an editable message. This is not legal advice.</p><form onSubmit={submit} className="analysis-form"><div className="field-row"><label>State<input required name="state" value={form.state} onChange={update} placeholder="e.g. California" /></label><label>City <span className="optional">(optional)</span><input name="city" value={form.city} onChange={update} placeholder="Your city" /></label></div><label>What happened?<textarea required name="input" value={form.input} onChange={update} rows="8" placeholder="Include dates, communications, notices, and what you need help deciding..." /></label><button className="primary" disabled={loading}>{loading ? "Analyzing…" : "Analyze my situation →"}</button></form></section>{result && <section className="panel"><div className="panel-heading"><div><p className="eyebrow">TenantAI analysis</p><h2>What to do next</h2></div></div>{result.error && <div className="error-box"><strong>Analysis needs attention</strong><p>{result.error}</p>{result.note && <small>{result.note}</small>}</div>}{!result.error && <><div className="ai-disclaimer">AI-generated guidance · Review local requirements and consider qualified legal help for decisions.</div>{issues.length > 0 && <ResultSection title="Potential housing concerns">{issues.map((item, i) => <div className="result-card" key={i}><strong>{item.title}</strong><span className="risk">{item.riskLevel || "Review"}</span><p>{item.description}</p></div>)}</ResultSection>}<ResultSection title="What to do next"><ol>{steps.map((step, i) => <li key={i}>{step}</li>)}</ol></ResultSection>{result.communication?.template && <ResultSection title="Suggested communication"><textarea className="template" defaultValue={result.communication.template} /><button className="secondary" onClick={() => navigator.clipboard?.writeText(result.communication.template)}>Copy message</button></ResultSection>}{resources.length > 0 && <ResultSection title="Helpful resources"><ul className="resource-list">{resources.map((item, i) => <li key={i}><a href={item.url} target="_blank" rel="noreferrer">{item.name} ↗</a><p>{item.description}</p></li>)}</ul></ResultSection>}</>}</section>}</div>; }
function ResultSection({ title, children }) { return <section className="result-section"><h3>{title}</h3>{children}</section>; }
function Unconnected({ title, description }) { return <section className="panel config-panel"><span className="config-icon">◇</span><p className="eyebrow">Configuration required</p><h2>{title}</h2><p>{description}</p><div className="config-note"><strong>Not connected yet</strong><span>This area is intentionally unavailable until real authentication, authorization, and server-side persistence are configured.</span></div></section>; }
function Profile({ authConfigured, signedIn }) { return <section className="panel config-panel"><span className="config-icon">○</span><p className="eyebrow">Account</p><h2>Profile & account</h2>{signedIn ? <><p>Your Clerk account is active. Use the account control in the header or sidebar to manage your session.</p><SignedIn><UserButton afterSignOutUrl="/" /></SignedIn></> : <><p>Sign in to access your account profile and protected TenantAI areas.</p><SignedOut><button className="primary" onClick={() => window.location.hash = "#sign-in"}>Sign in</button></SignedOut></>}{!authConfigured && <div className="config-note"><strong>Clerk configuration required</strong><span>Authentication cannot be enabled until the environment variables are set.</span></div>}</section>; }
function Resources() { return <section className="panel page-panel"><p className="eyebrow">Starting points</p><h2>Resources</h2><p className="muted">TenantAI uses attributable public sources and does not invent local organizations or legal deadlines.</p><div className="resource-cards"><a href="https://www.lawhelp.org/" target="_blank" rel="noreferrer"><strong>LawHelp</strong><span>Find legal aid and local assistance.</span>↗</a><a href="https://www.hud.gov/" target="_blank" rel="noreferrer"><strong>HUD</strong><span>Federal housing programs and information.</span>↗</a><a href="https://www.usa.gov/housing-help" target="_blank" rel="noreferrer"><strong>USA.gov housing help</strong><span>Government guidance and assistance pathways.</span>↗</a></div></section>; }
