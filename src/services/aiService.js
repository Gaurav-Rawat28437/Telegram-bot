const {
  GoogleGenerativeAI
} = require("@google/generative-ai");

const Conversation =
  require("../models/Conversation");

/* =========================================================
   CONVERSATION HISTORY
========================================================= */

async function getConversationHistory(
  telegramId
) {
  return Conversation.find({
    telegramId
  })
    .sort({
      createdAt: -1
    })
    .limit(8)
    .lean();
}

/* =========================================================
   PROMPT
========================================================= */

function createPrompt({
  user,
  question,
  history,
  context
}) {
  const previousConversation =
    [...history]
      .reverse()
      .map(
        (item) =>
          `User: ${item.question}\nAssistant: ${item.answer}`
      )
      .join("\n\n");

  return `
You are UV-Atlas, an AI financial assistant.

User role:
${user?.role || "Finance user"}

Rules:

- Be helpful and concise.
- Answer naturally.
- You can handle normal conversation such as greetings, small talk, general questions, comparisons, and explanations.
- Never invent financial numbers.
- If live financial data is provided below, use it.
- Do not claim information is live unless live data is provided.
- Explain financial concepts clearly.
- If the user asks about a company, focus on that company when relevant.
- Use previous conversation when relevant.
- Do not tell the user to use commands such as /price when natural language works.
- Do not provide personalized financial advice as certainty.
- Mention uncertainty when appropriate.
- If the user says hello, hi, hey, hyy, or asks how you are, respond naturally.
- If the user asks a comparison such as Apple vs Samsung, answer the comparison normally.
- Do not force every conversation into finance.

Previous conversation:

${
  previousConversation ||
  "No previous conversation available."
}

Current financial context:

${
  context ||
  "No live financial context available."
}

User message:

${question}
`;
}

/* =========================================================
   ASK GEMINI
========================================================= */

async function askAI({
  telegramId,
  user,
  question,
  context = ""
}) {
  const apiKey =
    process.env.GEMINI_API_KEY;

  /* =======================================================
     CHECK API KEY
  ======================================================= */

  if (!apiKey) {
    console.error(
      "GEMINI_API_KEY is missing"
    );

    return {
      success: false,
      quota: false,
      error:
        "GEMINI_API_KEY is missing"
    };
  }

  try {
    /* =====================================================
       GET HISTORY
    ===================================================== */

    const history =
      await getConversationHistory(
        telegramId
      );

    /* =====================================================
       GOOGLE AI
    ===================================================== */

    const googleAI =
      new GoogleGenerativeAI(
        apiKey
      );

    /* =====================================================
       MODEL

       You can override this using:

       GEMINI_MODEL=gemini-2.0-flash

       or another model available to your API key.
    ===================================================== */

    const modelName =
      process.env.GEMINI_MODEL ||
      "gemini-2.0-flash";

    console.log(
      "Gemini model:",
      modelName
    );

    const model =
      googleAI.getGenerativeModel({
        model: modelName
      });

    /* =====================================================
       CREATE PROMPT
    ===================================================== */

    const prompt =
      createPrompt({
        user,
        question,
        history,
        context
      });

    /* =====================================================
       SEND TO GEMINI
    ===================================================== */

    console.log(
      "Sending message to Gemini:",
      question
    );

    const result =
      await model.generateContent(
        prompt
      );

    /* =====================================================
       RESPONSE
    ===================================================== */

    const response =
      result?.response;

    if (!response) {
      console.error(
        "Gemini returned no response"
      );

      return {
        success: false,
        quota: false,
        error:
          "Gemini returned no response"
      };
    }

    const text =
      response.text();

    if (!text) {
      console.error(
        "Gemini returned empty text"
      );

      return {
        success: false,
        quota: false,
        error:
          "Empty AI response"
      };
    }

    console.log(
      "Gemini response received successfully"
    );

    return {
      success: true,
      text: text.trim()
    };

  } catch (error) {

    const message =
      error?.message ||
      String(error);

    const lowerMessage =
      message.toLowerCase();

    const quota =
      message.includes("429") ||
      message.includes("RESOURCE_EXHAUSTED") ||
      lowerMessage.includes("quota") ||
      lowerMessage.includes("rate limit");

    console.error(
      "===================================="
    );

    console.error(
      "GEMINI ERROR"
    );

    console.error(
      message
    );

    console.error(
      "===================================="
    );

    return {
      success: false,
      quota,
      error: message
    };
  }
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  askAI
};