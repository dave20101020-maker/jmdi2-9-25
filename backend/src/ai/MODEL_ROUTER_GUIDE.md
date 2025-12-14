# Model Router - Quick Reference

## Overview

The `modelRouter.js` file provides a reusable, intelligent AI routing system that automatically selects between OpenAI (ChatGPT) and Anthropic (Claude) based on task requirements, with automatic fallback handling.

## Main Function: `runWithBestModel()`

### Signature

```javascript
async function runWithBestModel(options)
```

### Parameters

```javascript
{
  taskType: 'deep_reasoning' | 'emotional_coaching' | 'mixed',
  systemPrompt: string,
  userMessage: string,
  conversationHistory?: Array<{
    role: 'user' | 'assistant' | 'system',
    content: string
  }>
}
```

### Returns

```javascript
{
  model: 'openai' | 'anthropic',
  text: string,          // The AI's response text
  raw: any              // Full API response object
}
```

## Routing Rules

| Task Type            | Primary Model      | Fallback | Reasoning                         |
| -------------------- | ------------------ | -------- | --------------------------------- |
| `deep_reasoning`     | Claude (Anthropic) | OpenAI   | Claude excels at complex analysis |
| `emotional_coaching` | OpenAI (ChatGPT)   | Claude   | GPT-4 is better for empathy       |
| `mixed`              | Claude (Anthropic) | OpenAI   | Balanced default choice           |

## Usage Examples

### Basic Usage

```javascript
import { runWithBestModel } from "./modelRouter.js";

const result = await runWithBestModel({
  taskType: "emotional_coaching",
  systemPrompt: "You are an empathetic internal coach.",
  userMessage: "I feel stressed about work.",
});

console.log(result.text); // AI response
console.log(result.model); // 'openai' or 'anthropic'
```

### With Conversation History

```javascript
const result = await runWithBestModel({
  taskType: "deep_reasoning",
  systemPrompt: "You are a sleep science expert.",
  userMessage: "What changes should I make?",
  conversationHistory: [
    {
      role: "user",
      content: "I sleep only 5 hours per night.",
    },
    {
      role: "assistant",
      content: "That's below the recommended 7-9 hours for adults.",
    },
  ],
});
```

### Error Handling

```javascript
try {
  const result = await runWithBestModel({
    taskType: "mixed",
    systemPrompt: "You are a helpful assistant.",
    userMessage: "Hello!",
  });
  console.log("Success:", result.text);
} catch (error) {
  console.error("Both providers failed:", error.message);
}
```

## Internal Helper Functions

### `callOpenAI(systemPrompt, userMessage, conversationHistory)`

- Calls OpenAI GPT-4 Turbo
- Handles message formatting
- Returns standardized response object

### `callClaude(systemPrompt, userMessage, conversationHistory)`

- Calls Anthropic Claude 3.5 Sonnet
- Converts system prompt to Anthropic format
- Returns standardized response object

## Fallback Behavior

1. **Primary attempt**: Calls preferred provider based on `taskType`
2. **If primary fails**: Logs error and automatically tries fallback provider
3. **If both fail**: Throws comprehensive error with both error messages

Example error flow:

```
[ModelRouter] claude failed: Rate limit exceeded
[ModelRouter] Attempting fallback to openai...
✓ Success with OpenAI
```

## Environment Variables Required

```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

Check configuration:

```javascript
import { checkAPIKeys } from "./modelRouter.js";

const keys = checkAPIKeys();
// { openai: true, anthropic: true }
```

## Model Constants

```javascript
import { MODELS } from "./modelRouter.js";

MODELS.GPT4_TURBO; // 'gpt-4o-mini'
MODELS.GPT4; // 'gpt-4'
MODELS.GPT35_TURBO; // 'gpt-3.5-turbo'
MODELS.CLAUDE_35_SONNET; // 'claude-3-5-sonnet-20241022'
MODELS.CLAUDE_3_OPUS; // 'claude-3-opus-20240229'
MODELS.CLAUDE_3_SONNET; // 'claude-3-sonnet-20240229'
MODELS.CLAUDE_3_HAIKU; // 'claude-3-haiku-20240307'
```

## Legacy Functions (Backward Compatibility)

These functions are kept for compatibility with existing code:

### `routeCompletion({ model, messages, temperature, maxTokens })`

Direct model selection with full parameter control.

### `routeStreamingCompletion({ model, messages, ... })`

Streaming responses for real-time UI updates.

### `getRecommendedModel(taskType)`

Get model recommendation for a specific task type.

## Integration with Agents

Use in your agent classes:

```javascript
import { runWithBestModel } from "../modelRouter.js";

class MyAgent {
  async process(userMessage) {
    const result = await runWithBestModel({
      taskType: "emotional_coaching",
      systemPrompt: this.systemPrompt,
      userMessage,
      conversationHistory: this.history,
    });

    return result.text;
  }
}
```

## Best Practices

1. **Choose correct taskType**:

   - Complex analysis? → `deep_reasoning`
   - Emotional support? → `emotional_coaching`
   - Not sure? → `mixed`

2. **Provide clear system prompts**:

   ```javascript
   // Good ✓
   systemPrompt: "You are a sleep coach specializing in insomnia treatment.";

   // Bad ✗
   systemPrompt: "You help people.";
   ```

3. **Handle errors gracefully**:

   ```javascript
   try {
     const result = await runWithBestModel({...});
   } catch (error) {
     // Log for debugging
     console.error('AI error:', error);
     // Provide fallback response to user
     return 'I apologize, but I\'m having trouble responding right now.';
   }
   ```

4. **Keep conversation history manageable**:
   - Limit to last 10-15 turns
   - Older context may not be relevant
   - Reduces token costs

## Testing

Run the example file:

```bash
cd backend
node src/ai/modelRouterExamples.js
```

Or run specific examples:

```javascript
import { exampleDeepReasoning } from "./modelRouterExamples.js";
await exampleDeepReasoning();
```

## Troubleshooting

**Error: "OPENAI_API_KEY is not configured"**
→ Add API key to `.env` file

**Error: "Invalid taskType"**
→ Use 'deep_reasoning', 'emotional_coaching', or 'mixed'

**Both providers fail**
→ Check API keys, network connection, and rate limits

**Response is too short/generic**
→ Improve system prompt specificity

## Performance Notes

- **GPT-4 Turbo**: ~2-3 seconds response time
- **Claude 3.5 Sonnet**: ~2-4 seconds response time
- **Token limit**: 1500 tokens (adjustable in code)
- **Temperature**: 0.7 (balanced creativity/consistency)

## Cost Estimation (as of Dec 2025)

| Model             | Input         | Output        |
| ----------------- | ------------- | ------------- |
| GPT-4 Turbo       | $10/1M tokens | $30/1M tokens |
| Claude 3.5 Sonnet | $3/1M tokens  | $15/1M tokens |

Typical internal coaching interaction:

- System prompt: ~100 tokens
- User message: ~50 tokens
- AI response: ~200 tokens
- **Cost per interaction**: ~$0.005-0.015

## Future Enhancements

Potential improvements to consider:

- [ ] Streaming support for `runWithBestModel`
- [ ] Token usage tracking
- [ ] Response caching for repeated queries
- [ ] A/B testing between models
- [ ] Custom model selection based on user preferences
- [ ] Multi-turn conversation optimization

## Support

For issues or questions about the model router:

1. Check error messages carefully
2. Verify API keys are valid and have credits
3. Review the examples in `modelRouterExamples.js`
4. Check Anthropic/OpenAI status pages for outages
