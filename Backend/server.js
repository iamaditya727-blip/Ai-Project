import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

app.post("/generate-plan", async (req, res) => {
  try {
    const { name, department, scenario, observation } = req.body;

    console.log("📩 REQUEST:", req.body);

    const prompt = `
Create a professional performance report for a student.

Name: ${name}
Department: ${department}
Scenario: ${scenario}
Observation: ${observation}

Structure:
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
            content: "You are a professional HR and psychology performance analyst.",
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

    console.log("🤖 GROQ RESPONSE:", data);

    // error check
    if (data.error) {
      return res.json({
        success: false,
        plan: data.error.message,
      });
    }

    const aiText = data?.choices?.[0]?.message?.content;

    return res.json({
      success: true,
      plan: aiText || "No response from AI",
    });

  } catch (err) {
    console.error("ERROR:", err);

    return res.status(500).json({
      success: false,
      plan: "Server error",
    });
  }
});

app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});