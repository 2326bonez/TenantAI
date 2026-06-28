import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// API Routes
app.get("/api/states", (_req, res) => {
  res.json({ states: ["CA", "NY", "TX", "FL", "IL"] }); // Add more states
});

app.post("/api/analyze", async (req, res) => {
  const { state, city, input, email } = req.body;
  
  if (!state || !input) {
    return res.status(400).json({ error: "state and input are required" });
  }
  
  // TODO: Add OpenAI analysis logic here
  res.json({ 
    message: "Analysis endpoint ready",
    received: { state, city, input, email }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Landlord AI server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
