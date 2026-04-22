import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Debug: confirm API key is loaded (DO NOT expose in production logs later)
console.log("🔑 GROQ KEY LOADED:", process.env.GROQ_API_KEY ? "YES" : "NO");

app.post("/generate-plan", async (req, res) => {
  try {
    console.log("🔥 ROUTE HIT");
    console.log("📩 REQUEST:", req.body);

    const { name, department, scenario, observation } = req.body;

    const prompt = `
You are a senior organisational psychologist and executive coach.

Return a structured professional report.

Name: ${name}
Department: ${department}
Scenario: ${scenario}
Observation: ${observation}

Format:
1. Executive Summary
2. Strengths
3. Stress Behaviour Analysis
4. Weaknesses
5. Improvement Plan
6. Final Recommendation
`;

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "You are a professional HR and psychology performance analyst.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    console.log("🤖 GROQ RAW RESPONSE:", JSON.stringify(data, null, 2));

    // HANDLE API ERRORS PROPERLY
    if (!response.ok || data.error) {
      console.log("❌ GROQ ERROR:", data);
      return res.json({
        success: false,
        plan:
          data?.error?.message ||
          "Groq API failed (check model or API key)",
      });
    }

    // SAFE EXTRACTION
    const aiText = data?.choices?.[0]?.message?.content;

    if (!aiText) {
      console.log("⚠️ NO AI TEXT FOUND:", data);
      return res.json({
        success: false,
        plan: "AI returned empty response",
      });
    }

    return res.json({
      success: true,
      plan: aiText,
    });

  } catch (err) {
    console.error("💥 SERVER ERROR:", err);

    return res.status(500).json({
      success: false,
      plan: "Internal server error",
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});