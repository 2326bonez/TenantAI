import { useState } from "react";

export default function App() {
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [situation, setSituation] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state,
          city,
          input: situation,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Error:", err);
      setResult({ error: "Failed to analyze situation" });
    } finally {
      setLoading(false);
    }
  };

  const issues = Array.isArray(result?.issues) ? result.issues : [];
  const steps = Array.isArray(result?.steps) ? result.steps : [];
  const resources = Array.isArray(result?.resources) ? result.resources : [];
  const communication = result?.communication || { template: "", tone: "professional" };

  return (
    <div className="app">
      <header>
        <h1>🏠 Landlord AI</h1>
        <p>Understand your tenant rights and housing issues</p>
      </header>

      <main>
        <div className="container">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="state">State</label>
              <input
                id="state"
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Enter your state (e.g., CA, NY)"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter your city"
              />
            </div>

            <div className="form-group">
              <label htmlFor="situation">Describe Your Situation</label>
              <textarea
                id="situation"
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="Describe your housing issue in detail..."
                required
                rows="5"
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Analyzing..." : "Analyze My Situation"}
            </button>
          </form>

          {result && (
            <div className="result">
              {result.error ? (
                <div className="error-box">
                  <h2>Couldn’t analyze this yet</h2>
                  <p>{result.error}</p>
                  {result.note && <p className="note">{result.note}</p>}
                </div>
              ) : (
                <>
                  <div className="result-header">
                    <h2>Analysis Result</h2>
                    {result.severity && (
                      <span className={`severity severity-${result.severity}`}>
                        {result.severity.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {issues.length > 0 && (
                    <section className="result-section">
                      <h3>Issues</h3>
                      {issues.map((issue, index) => (
                        <article key={`${issue.title}-${index}`} className="result-card">
                          <h4>{issue.title}</h4>
                          <p className="risk">Risk: {issue.riskLevel || "Medium"}</p>
                          <p>{issue.description}</p>
                        </article>
                      ))}
                    </section>
                  )}

                  {steps.length > 0 && (
                    <section className="result-section">
                      <h3>Next steps</h3>
                      <ol>
                        {steps.map((step, index) => (
                          <li key={`${step}-${index}`}>{step}</li>
                        ))}
                      </ol>
                    </section>
                  )}

                  {communication.template && (
                    <section className="result-section">
                      <h3>Message template</h3>
                      <p className="tone">Tone: {communication.tone || "professional"}</p>
                      <pre className="template-box">{communication.template}</pre>
                    </section>
                  )}

                  {resources.length > 0 && (
                    <section className="result-section">
                      <h3>Resources</h3>
                      <ul className="resource-list">
                        {resources.map((resource, index) => (
                          <li key={`${resource.name}-${index}`}>
                            <a href={resource.url} target="_blank" rel="noreferrer">
                              {resource.name}
                            </a>
                            <p>{resource.description}</p>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
