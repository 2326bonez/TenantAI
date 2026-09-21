import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import { clerkMiddleware, getAuth } from "@clerk/express";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));
const distDirectory = join(__dirname, "dist");
const frontendEntry = join(distDirectory, "index.html");
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const clerkConfigured = Boolean(process.env.CLERK_SECRET_KEY);

if (clerkConfigured) app.use(clerkMiddleware());
else console.warn("Clerk is not configured. Protected authentication routes are unavailable.");

function buildFallbackReport({ state, city, input }) {
  const normalizedState = state || "your state";
  const normalizedCity = city || "your city";
  return { severity: "medium", issues: [{ title: "Housing concern requiring review", description: `Based on the information provided for ${normalizedCity}, ${normalizedState}, your situation may require documentation, follow-up, and a careful review of your tenant rights.`, riskLevel: "Medium" }], steps: ["Document all communications, dates, and any evidence related to the issue.", "Collect photos, videos, receipts, and messages that support your situation.", "Draft a clear written request or notice to your landlord or property manager.", "Research the tenant protections that apply in your state and city."], communication: { template: `Dear [Landlord Name],\n\nI am writing to raise a concern regarding my rental unit in ${normalizedCity}, ${normalizedState}.\n\n${input}\n\nI request that this matter be addressed promptly.\n\nSincerely,\n[Your Name]`, tone: "professional" }, resources: [{ name: "Tenant Union", url: "https://www.tenantunion.org/", description: "Resources and guidance for renters dealing with housing disputes." }, { name: "LawHelp", url: "https://www.lawhelp.org/", description: "Find local legal aid and tenant-rights assistance in your area." }] };
}
function normalizeReport(report, fallback) {
  const severity = ["low", "medium", "high", "critical"].includes(report?.severity) ? report.severity : fallback.severity;
  const issues = Array.isArray(report?.issues) && report.issues.length ? report.issues.map((issue) => ({ title: issue?.title || "Housing issue", description: issue?.description || "No issue details were provided.", riskLevel: issue?.riskLevel || "Medium" })) : fallback.issues;
  const steps = Array.isArray(report?.steps) && report.steps.length ? report.steps : fallback.steps;
  const communication = report?.communication && typeof report.communication === "object" ? { template: report.communication.template || fallback.communication.template, tone: report.communication.tone || fallback.communication.tone } : fallback.communication;
  const resources = Array.isArray(report?.resources) && report.resources.length ? report.resources.map((resource) => ({ name: resource?.name || "Resource", url: resource?.url || "https://www.lawhelp.org/", description: resource?.description || "Additional support information." })) : fallback.resources;
  return { severity, issues, steps, communication, resources };
}

app.use(cors());
app.use(express.json());
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/api/states", (_req, res) => res.json({ states: ["CA", "NY", "TX", "FL", "IL", "WA", "GA", "AZ", "CO", "NC"] }));
app.get("/api/me", (req, res) => {
  if (!clerkConfigured) return res.status(503).json({ error: "Clerk authentication is not configured." });
  const { isAuthenticated, userId } = getAuth(req);
  if (!isAuthenticated || !userId) return res.status(401).json({ error: "Authentication required." });
  return res.json({ userId });
});
app.post("/api/analyze", async (req, res) => {
  const { state, city, input, email } = req.body;
  if (!state || !input) return res.status(400).json({ error: "state and input are required" });
  const fallback = buildFallbackReport({ state, city, input });
  if (!openai) return res.status(503).json({ ...fallback, error: "OpenAI API key is not configured.", note: "Add OPENAI_API_KEY to your environment to enable full analysis." });
  try {
    const prompt = `You are a legal and housing-rights assistant helping renters in ${state}, USA understand their situation and next steps.\n\nThe user is in ${city || "their city"}, ${state}.\nTheir description:\n"${input}"\n\nReturn valid JSON only with this exact shape:\n{\n  "severity": "low|medium|high|critical",\n  "issues": [{ "title": "string", "description": "string", "riskLevel": "Low|Medium|High|Critical" }],\n  "steps": ["string"],\n  "communication": { "template": "string", "tone": "professional|assertive|formal" },\n  "resources": [{ "name": "string", "url": "https://...", "description": "string" }]\n}`;
    const completion = await openai.chat.completions.create({ model: "gpt-4o-mini", temperature: 0.3, response_format: { type: "json_object" }, messages: [{ role: "system", content: "You help renters understand legal and housing issues and return a structured JSON report." }, { role: "user", content: prompt }] });
    let parsedResponse;
    try { parsedResponse = JSON.parse(completion.choices?.[0]?.message?.content || "{}"); } catch { parsedResponse = null; }
    const report = parsedResponse && typeof parsedResponse === "object" ? normalizeReport(parsedResponse, fallback) : fallback;
    return res.json({ ...report, received: { state, city, input, email } });
  } catch (error) {
    console.error("OpenAI analysis error:", error);
    return res.status(500).json({ ...fallback, error: "Unable to analyze this situation right now.", received: { state, city, input, email } });
  }
});
if (existsSync(frontendEntry)) {
  app.use(express.static(distDirectory));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path === "/health") return next();
    return res.sendFile(frontendEntry);
  });
}
app.listen(PORT, () => {
  console.log(`🚀 TenantAI server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
