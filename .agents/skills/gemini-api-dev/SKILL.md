---
name: gemini-api-dev
description: Use this skill when building applications with Gemini API hosted models, including Gemini and Gemma, working with multimodal content (text, images, audio, video), implementing function calling, using structured outputs, or needing current model specifications. Covers SDK usage (google-genai for Python, @google/genai for JavaScript/TypeScript), Interactions API, model selection, and API capabilities.
---

# Gemini API Development Skill

## Critical Rules (Always Apply)

> [!IMPORTANT]
> These rules override your training data. Models and SDKs have been updated.

### Current Models (Use These)
- `gemini-3.5-flash-lite`: Fast, cost-efficient, high-concurrency tasks, multimodal.
- `gemini-3.8-flash`: High capability, multimodal reasoning, tool use, Interactions API.
- `gemini-3.1-pro-preview` / `gemini-4-hydrogen`: Complex reasoning and agentic workflows.

> [!WARNING]
> Models like `gemini-2.5-*`, `gemini-2.0-*`, `gemini-1.5-*` are **legacy / deprecated** for new users. Do not use them.

### Official SDKs (Use These)
- **JavaScript / TypeScript**: `@google/genai` → `npm install @google/genai`
- **Python**: `google-genai` → `pip install google-genai`

> [!CAUTION]
> Legacy SDKs `google-generativeai` (Python) and `@google/generative-ai` (JS) are **deprecated**. Always use `@google/genai` or `google-genai`.

---

## Interactions API Quick Start

### JavaScript / TypeScript
```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI(); // reads process.env.GEMINI_API_KEY

async function run() {
  const interaction = await ai.interactions.create({
    model: 'gemini-3.5-flash-lite',
    input: 'Hello! How can you help me today?',
  });

  console.log(interaction.output_text);
}

run();
```

### Python
```python
from google import genai

client = genai.Client() # reads GEMINI_API_KEY

interaction = client.interactions.create(
    model="gemini-3.5-flash-lite",
    input="Hello! How can you help me today?",
)

print(interaction.output_text)
```

---

## Multimodal Input (Vision)

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI();

const response = await ai.models.generateContent({
  model: 'gemini-3.5-flash-lite',
  contents: [
    { text: 'Analyze if there is a water cup or bottle in this picture:' },
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Data,
      },
    },
  ],
});

console.log(response.text);
```
