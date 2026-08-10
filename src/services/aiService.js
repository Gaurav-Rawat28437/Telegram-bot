const {
  GoogleGenerativeAI
} = require(
  "@google/generative-ai"
);

const Conversation =
  require("../models/Conversation");

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

function createPrompt({
  user,
  question,
  history,
  context
}) {
  const previousConversation =
    history
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
- Never invent financial numbers.
- If live financial data is provided below, use it.
- Do not claim information is live unless live data is provided.
- Explain financial concepts clearly.
- If the user asks about a company, focus on that company.
- Use previous conversation when relevant.
- Do not tell the user to use commands such as /price when natural language works.
- Do not provide personalized financial advice as certainty.
- Mention uncertainty when appropriate.

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

async function askAI({
  telegramId,
  user,
  question,
  context = ""
}) {
  const apiKey =
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      quota: false,
      error:
        "GEMINI_API_KEY is missing"
    };
  }

  try {
    const history =
      await getConversationHistory(
        telegramId
      );

    const googleAI =
      new GoogleGenerativeAI(
        apiKey
      );

    const model =
      googleAI.getGenerativeModel({
        model:
          process.env.GEMINI_MODEL ||
          "gemini-1.5-flash"
      });

    const prompt =
      createPrompt({
        user,
        question,
        history,
        context
      });

    const result =
      await model.generateContent(
        prompt
      );

    const response =
      result.response;

    const text =
      response.text();

    if (!text) {
      return {
        success: false,
        quota: false,
        error:
          "Empty AI response"
      };
    }

    return {
      success: true,
      text: text.trim()
    };
  } catch (error) {
    const message =
      error?.message || "";

    const quota =
      message.includes("429") ||
      message.includes(
        "RESOURCE_EXHAUSTED"
      ) ||
      message.toLowerCase().includes(
        "quota"
      );

    console.error(
      "Gemini error:",
      message
    );

    return {
      success: false,
      quota,
      error: message
    };
  }
}

module.exports = {
  askAI
};