import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
console.log("🔑 GROQ KEY LOADED:", process.env.GROQ_API_KEY ? "YES" : "NO");

function cleanMarkdown(text) {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
    .replace(/_{1,3}([^_]+)_{1,3}/g, "$1")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/`{1,3}([^`]*)`{1,3}/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^-{3,}$/gm, "")
    .replace(/Box \d+:\s*/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^Goal:.*$/gm, "")
    .replace(/^Upon submission.*$/gm, "")
    .trim();
}

app.post("/generate-plan", async (req, res) => {
  try {
    console.log("🔥 ROUTE HIT");
    console.log("📩 REQUEST:", req.body);

    const { name, department, scenario, observation } = req.body;

    const prompt = `
You are a senior organisational psychologist and executive coach specialising in Industrial-Organizational (I-O) Psychology and Cognitive Behavioral Techniques (CBT).

A student has just completed an industry stress simulation. Generate a structured professional development report using the exact format below.

CRITICAL FORMATTING RULES — you must follow these without exception:
- Do not use any markdown whatsoever. No asterisks, no hashes, no dashes, no bullet points, no numbered lists, no bold, no italics.
- Do not use the words "Box 1", "Box 2", or "Box 3" anywhere.
- Do not use any symbols such as *, **, #, -, --, or >.
- Write all content in clean, flowing prose paragraphs only.
- Use the section labels exactly as shown below, followed by a colon, then write the content on the next line as plain prose.

Name: ${name}
Department: ${department}
Scenario: ${scenario}
Mentor Observation: ${observation}

---

Real-Time AI Analysis

Upon submission, the AI generates targeted developmental interventions using Cognitive Behavioral Techniques (CBT) and principles from Industrial-Organizational (I-O) Psychology.

---

Cognitive Reframing and Professional Identity Development

Goal: Transition from a Student Mindset to a Professional Decision-Maker Mindset.

Cognitive Reframing Analysis:
[Write 3 to 4 sentences of flowing prose analysing whether ${name} approached the simulation as an academic exercise or as a real-world professional challenge. Reference the scenario and observation directly. No bullet points.]

Developmental Interventions:
[Write 3 to 4 sentences of flowing prose describing targeted growth actions to strengthen ${name}'s professional identity, reduce industry dysmorphia, and build confidence in applying ${department} knowledge. No bullet points or numbered lists.]

---

Behavioural Analysis and Performance Readiness

Goal: Transition from subject competence to professional effectiveness.

Behavioural Performance Audit:
[Write 3 to 4 sentences of flowing prose assessing ${name}'s communication clarity, analytical reasoning, decision-making quality, stakeholder awareness, and listening accuracy based on the observation provided. No bullet points.]

Applied Competency Mapping:
[Write 3 to 4 sentences of flowing prose identifying observable behaviours or decisions from the simulation that ${name} can translate into interview narratives, professional portfolios, or workplace examples. No bullet points.]

Performance Interventions:
[Write 3 to 4 sentences of flowing prose providing personalised recommendations to improve ${name}'s execution, influence, adaptability, and professional presence within ${department}. No bullet points.]

---

Emotional Intelligence and Pressure Adaptability

Goal: Evaluate the student's ability to perform under pressure.

Emotional Response Analysis:
[Write 3 to 4 sentences of flowing prose analysing whether ${name}'s decision-making was influenced by fear, uncertainty, or cognitive distortions, or guided by emotional intelligence and situational awareness. Reference the scenario and observation directly. No bullet points.]

Pressure Adaptability Score:
[Give a score out of 10 and write 2 to 3 sentences justifying it based on resilience, stress tolerance, and performance consistency. No bullet points.]

Growth Actions:
[Write 3 to 4 sentences of flowing prose describing targeted interventions to strengthen ${name}'s emotional regulation, psychological resilience, and adaptive decision-making in ${department} environments. No bullet points.]
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
              "You are a professional organisational psychologist and executive coach. Always respond using the exact structured format provided. Write only in clean prose paragraphs. Do not use markdown, asterisks, hashes, bullet points, numbered lists, or any special formatting characters. Be specific, insightful, and personalised.",
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

    if (!response.ok || data.error) {
      console.log("❌ GROQ ERROR:", data);
      return res.json({
        success: false,
        plan: data?.error?.message || "Groq API failed (check model or API key)",
      });
    }

    const aiText = data?.choices?.[0]?.message?.content;

    if (!aiText) {
      console.log("⚠️ NO AI TEXT FOUND:", data);
      return res.json({
        success: false,
        plan: "AI returned empty response",
      });
    }

    const cleanedPlan = cleanMarkdown(aiText);

    return res.json({
      success: true,
      plan: cleanedPlan,
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
