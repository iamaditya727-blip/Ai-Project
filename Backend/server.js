import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

console.log("🔑 GROQ KEY LOADED:", process.env.GROQ_API_KEY ? "YES" : "NO");

app.post("/generate-plan", async (req, res) => {
  try {
    console.log("🔥 ROUTE HIT");
    console.log("📩 REQUEST:", req.body);

    const { name, department, scenario, observation } = req.body;

    const prompt = `
You are a senior organisational psychologist and executive coach specialising in Industrial-Organizational (I-O) Psychology and Cognitive Behavioral Techniques (CBT).

A student has just completed an industry stress simulation. Generate a structured professional development report in exactly the following format:

Name: ${name}
Department: ${department}
Scenario: ${scenario}
Mentor Observation: ${observation}

---

Real-Time AI Analysis

Upon submission, the AI generates targeted developmental interventions using Cognitive Behavioral Techniques (CBT) and principles from Industrial-Organizational (I-O) Psychology. Simulations are tailored to disciplines such as Human Resource Management, Business & Finance Management, Law, Psychology, Civic & Political Science, and Marketing.

---

Box 1: Cognitive Reframing & Professional Identity Development

Goal: Transition from a Student Mindset to a Professional Decision-Maker Mindset.

Cognitive Reframing Analysis: [Analyse whether ${name} approached the simulation as an academic exercise or as a real-world professional challenge. Did they rely on theoretical knowledge alone, or did they apply practical reasoning and contextual awareness? Be specific to the scenario and observation provided.]

Developmental Interventions: [Provide 3 targeted, specific growth actions to strengthen ${name}'s professional identity, reduce industry dysmorphia, and build confidence in applying ${department} knowledge to real-world scenarios.]

---

Box 2: Behavioral Analysis & Performance Readiness

Goal: Transition from subject competence to professional effectiveness.

**Behavioral Performance Audit:** [Assess ${name}'s communication clarity, analytical reasoning, decision-making quality, stakeholder awareness, and listening accuracy based on the observation provided. Be direct and specific.]

**Applied Competency Mapping:** [Identify 2-3 observable behaviors or decisions demonstrated during the simulation that ${name} can translate into interview narratives, professional portfolios, or workplace performance examples.]

**Performance Interventions:** [Provide 3 personalised recommendations to improve ${name}'s execution, influence, adaptability, and professional presence within ${department}.]

---

Box 3: Emotional Intelligence & Pressure Adaptability

Goal: Evaluate the student's ability to perform under pressure.

Emotional Response Analysis: [Analyse whether ${name}'s decision-making was influenced by fear, uncertainty, or cognitive distortions — or guided by emotional intelligence, evidence-based reasoning, and situational awareness. Reference the scenario and observation directly.]

Pressure Adaptability Score: [Give a score out of 10 and justify it. Assess resilience, stress tolerance, and performance consistency under the conditions of the scenario.]

Growth Actions: [Provide 3 targeted interventions to strengthen ${name}'s emotional regulation, psychological resilience, confidence under pressure, and adaptive decision-making in ${department} environments.]
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
            content: "You are a professional organisational psychologist and executive coach. Always respond in the exact structured format provided. Be specific, insightful, and personalised — never generic.",
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
