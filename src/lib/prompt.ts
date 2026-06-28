export type Severity = "low" | "medium" | "high" | "critical";

export interface StructuredReport {
  severity: Severity;
  issues: Array<{
    title: string;
    description: string;
    riskLevel: string;
  }>;
  steps: string[];
  communication: {
    template: string;
    tone: string;
  };
  resources: Array<{
    name: string;
    url: string;
    description: string;
  }>;
}

/**
 * Build a structured prompt for the OpenAI API
 */
export function buildStructuredPrompt({
  city,
  state,
  situation,
  plan,
}: {
  city: string;
  state: string;
  situation: string;
  plan: "free" | "case" | "pro";
}): string {
  const planDetails = {
    free: "Provide a basic overview of potential issues and general guidance.",
    case: "Provide detailed analysis including specific issues, next steps, and a communication template.",
    pro: "Provide comprehensive analysis with all details, resources, local regulations, and multiple communication templates.",
  };

  return `You are a tenant rights assistant helping renters in ${state}, USA understand their housing situation and legal rights.

The user is in ${city}, ${state} and has described their situation:
"${situation}"

Based on this situation, provide a JSON response with the following structure:
{
  "severity": "low|medium|high|critical",
  "issues": [
    {
      "title": "Issue title",
      "description": "Detailed description of the issue",
      "riskLevel": "Low|Medium|High|Critical"
    }
  ],
  "steps": [
    "First action to take",
    "Second action to take",
    "etc..."
  ],
  "communication": {
    "template": "A professional message template the tenant can send to their landlord",
    "tone": "professional|assertive|formal"
  },
  "resources": [
    {
      "name": "Resource name",
      "url": "https://...",
      "description": "What this resource provides"
    }
  ]
}

Plan tier: ${plan}
${planDetails[plan]}

Respond ONLY with valid JSON, no markdown formatting or code blocks.`;
}

/**
 * Generate a skeleton report when AI response fails
 */
export function generateLandlordAIReport({
  city,
  state,
  situation,
  severity,
  plan,
}: {
  city: string;
  state: string;
  situation: string;
  severity: Severity;
  plan: "free" | "case" | "pro";
}): StructuredReport {
  return {
    severity,
    issues: [
      {
        title: "Housing Issue Analysis",
        description: `Based on your description in ${city}, ${state}, we've identified potential concerns with your situation.`,
        riskLevel: severity.charAt(0).toUpperCase() + severity.slice(1),
      },
    ],
    steps:
      plan === "free"
        ? [
            "Document all communications with your landlord",
            "Take photos/videos of any issues",
            "Research your local tenant rights",
          ]
        : [
            "Document all communications with your landlord",
            "Take photos/videos of any issues",
            "Review applicable state and local laws",
            "Prepare written communication",
            "Send documentation to landlord",
            "Keep records of all interactions",
          ],
    communication: {
      template: `Dear [Landlord Name],\n\nI am writing to inform you of the following concern(s) regarding my rental unit:\n\n[Your concern]\n\nI kindly request that you address this matter within [X days].\n\nThank you for your prompt attention to this matter.\n\nSincerely,\n[Your Name]`,
      tone: "professional",
    },
    resources: [
      {
        name: "State Tenant Rights",
        url: `https://www.tenant.net/`,
        description: "Information about tenant rights in your state",
      },
      {
        name: "Local Legal Aid",
        url: "https://www.lawhelp.org/",
        description: "Find legal assistance in your area",
      },
    ],
  };
}

/**
 * Coerce a severity value to a valid Severity type
 */
export function coerceSeverity(value: unknown, fallback: Severity = "medium"): Severity {
  if (value === "low" || value === "medium" || value === "high" || value === "critical") {
    return value;
  }
  return fallback;
}

/**
 * Merge AI response with skeleton report
 */
export function mergeReport(
  skeleton: StructuredReport,
  aiPartial: Partial<StructuredReport>
): StructuredReport {
  return {
    severity: coerceSeverity(aiPartial.severity, skeleton.severity),
    issues: aiPartial.issues?.length ? aiPartial.issues : skeleton.issues,
    steps: aiPartial.steps?.length ? aiPartial.steps : skeleton.steps,
    communication: aiPartial.communication ?? skeleton.communication,
    resources: aiPartial.resources?.length ? aiPartial.resources : skeleton.resources,
  };
}

/**
 * Try to parse a report from JSON string
 */
export function tryParseReport(json: string): StructuredReport | null {
  try {
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === "object") {
      return {
        severity: coerceSeverity(parsed.severity, "medium"),
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        steps: Array.isArray(parsed.steps) ? parsed.steps : [],
        communication: parsed.communication ?? { template: "", tone: "professional" },
        resources: Array.isArray(parsed.resources) ? parsed.resources : [],
      };
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Build a preview report (limited details for free tier)
 */
export function buildPreviewReport(report: StructuredReport): StructuredReport {
  return {
    severity: report.severity,
    issues: report.issues.slice(0, 2), // Only show first 2 issues
    steps: report.steps.slice(0, 3), // Only show first 3 steps
    communication: {
      template: "Preview: Unlock full communication template",
      tone: report.communication.tone,
    },
    resources: report.resources.slice(0, 1), // Only show first resource
  };
}

/**
 * Convert report to markdown format
 */
export function reportToMarkdown(report: StructuredReport): string {
  let markdown = `# Housing Situation Analysis\n\n`;

  markdown += `**Severity Level:** ${report.severity.toUpperCase()}\n\n`;

  if (report.issues.length > 0) {
    markdown += `## Issues Identified\n\n`;
    report.issues.forEach((issue) => {
      markdown += `### ${issue.title}\n`;
      markdown += `**Risk Level:** ${issue.riskLevel}\n\n`;
      markdown += `${issue.description}\n\n`;
    });
  }

  if (report.steps.length > 0) {
    markdown += `## Next Steps\n\n`;
    report.steps.forEach((step, idx) => {
      markdown += `${idx + 1}. ${step}\n`;
    });
    markdown += `\n`;
  }

  if (report.communication.template) {
    markdown += `## Communication Template\n\n`;
    markdown += `\`\`\`\n${report.communication.template}\n\`\`\`\n\n`;
  }

  if (report.resources.length > 0) {
    markdown += `## Resources\n\n`;
    report.resources.forEach((resource) => {
      markdown += `- **[${resource.name}](${resource.url})** - ${resource.description}\n`;
    });
  }

  return markdown;
}
