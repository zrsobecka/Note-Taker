import { CONFIG } from "./config.js";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.action === "checkLlmStatus") {
    checkLlmStatus()
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: error.message }));

    return true;
  }

  if (message?.action === "listFolders") {
    listFolders()
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: error.message }));

    return true;
  }

  if (message?.action !== "generateAndSaveNote") {
    return false;
  }

  generateAndSaveNote(message.payload)
    .then(sendResponse)
    .catch((error) => sendResponse({ ok: false, error: error.message }));

  return true;
});

async function generateAndSaveNote({ title, folder, sourceText }) {
  const markdown = await generateMarkdown(title, sourceText);
  const saved = await saveMarkdown(title, folder, markdown);

  return {
    ok: true,
    markdown,
    path: saved.path
  };
}

async function checkLlmStatus() {
  const response = await fetch(getLmStudioModelsUrl(), { method: "GET" });

  if (!response.ok) {
    throw new Error(`LM Studio status request failed: ${response.status}`);
  }

  const data = await response.json();
  const models = Array.isArray(data?.data) ? data.data : [];
  const modelNames = models.map((model) => model.id).filter(Boolean);
  const configuredModel = CONFIG.lmStudioModel;
  const modelName = modelNames.includes(configuredModel)
    ? configuredModel
    : modelNames[0] || configuredModel;

  return {
    ok: true,
    loaded: modelNames.length > 0,
    modelName,
    models: modelNames
  };
}

async function generateMarkdown(title, sourceText) {
  const response = await fetch(CONFIG.lmStudioUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: CONFIG.lmStudioModel,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt()
        },
        {
          role: "user",
          content: buildUserPrompt(title, sourceText)
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`LM Studio request failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("LM Studio returned an empty response.");
  }

  return normalizeMarkdownTitle(content, title);
}

function getLmStudioModelsUrl() {
  return CONFIG.lmStudioUrl.replace(/\/chat\/completions\/?$/, "/models");
}

function buildSystemPrompt() {
  return [
    "You turn copied source text into clean Obsidian Markdown notes.",
    "The goal is not to summarize text nicely. The goal is to create a reusable knowledge note.",
    "Write in the same language as the source text.",
    "Use a practical, clear, human tone with short paragraphs.",
    "Do not sound academic. Do not add filler or generic advice.",
    "Do not copy the source text verbatim.",
    "Transform the source into practical understanding, mental models, and useful future reference.",
    "Prefer clear mental models over long explanations.",
    "Use bullets when they improve scanning.",
    "Use tables only when they make comparison or process clearer.",
    "Remove unnecessary details and anything that future me will not use.",
    "Add Obsidian wiki links for key terms, for example [[HTTP]], [[URL]], [[Cookies]], [[Headers]], [[curl]].",
    "Use specific links when obvious, but do not over-link every word.",
    "Return only Markdown."
  ].join("\n");
}

function buildUserPrompt(title, sourceText) {
  return [
    `Title: ${title}`,
    "",
    "Use exactly this Markdown structure:",
    "",
    `# ${title}`,
    "",
    "## Główna idea",
    "",
    "One clear idea in plain language.",
    "",
    "## Co muszę zrozumieć",
    "",
    "The core concepts, broken into small chunks.",
    "",
    "## Jak o tym myśleć",
    "",
    "Mental model, comparison, frame, or decision logic.",
    "",
    "## Przydatne w praktyce",
    "",
    "How to use this knowledge in real work.",
    "",
    "## Najważniejsze wnioski",
    "",
    "Short bullet list of what matters most.",
    "",
    "## Powiązane pojęcia",
    "",
    "- [[Key Concept]]",
    "- [[Another Concept]]",
    "",
    "Optional sections:",
    "- Add ## Komendy only if the source includes commands, CLI usage, code snippets, or technical steps.",
    "- Add ## Proces only if the source describes a workflow.",
    "- Add ## Checklist only if the note should guide repeated action.",
    "- Add ## Przykład only if one simple example makes the idea easier to remember.",
    "- Add ## Pułapki only if the source warns about mistakes or false assumptions.",
    "",
    "Source text:",
    sourceText
  ].join("\n");
}

function normalizeMarkdownTitle(markdown, title) {
  const trimmed = markdown.trim();
  if (trimmed.startsWith("# ")) {
    return trimmed;
  }

  return `# ${title}\n\n${trimmed}`;
}

function listFolders() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendNativeMessage(
      CONFIG.nativeHostName,
      { action: "listFolders" },
      (response) => {
        const error = chrome.runtime.lastError;

        if (error) {
          reject(new Error(error.message));
          return;
        }

        if (!response?.ok) {
          reject(new Error(response?.error || "Native host failed."));
          return;
        }

        resolve(response);
      }
    );
  });
}

function saveMarkdown(title, folder, markdown) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendNativeMessage(
      CONFIG.nativeHostName,
      { action: "saveNote", title, folder, markdown },
      (response) => {
        const error = chrome.runtime.lastError;

        if (error) {
          reject(new Error(error.message));
          return;
        }

        if (!response?.ok) {
          reject(new Error(response?.error || "Native host failed."));
          return;
        }

        resolve(response);
      }
    );
  });
}
