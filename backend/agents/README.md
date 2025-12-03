# Agent Prompt Storage

This directory contains the system prompts and configuration for each pillar agent.

## Structure

Each agent has two files:

### {pillar}.prompt.txt
The core system prompt for the agent. Format:

```
AGENT: {Name}
PILLAR: {pillar}
ROLE: {Role description}
INTRODUCTION: "{Natural greeting}"

CORE MISSION:
{Description of what this agent does}

PERSONALITY:
{Key personality traits}

SCREENING CAPABILITIES:
{Which screenings this agent can administer}

SYSTEM PROMPT:
{The full system prompt to send to LLM}
```

### {pillar}.config.json
Configuration for the agent. Format:

```json
{
  "name": "Agent Name",
  "pillar": "pillar-name",
  "avatar": "🌙",
  "color": {
    "from": "#6B21A8",
    "to": "#A855F7"
  },
  "introduction": "Natural greeting",
  "modelPreference": "gpt|claude",
  "taskTypes": ["coach", "plan", "create"],
  "screenings": ["ISI", "STOP-BANG"],
  "temperature": 0.7,
  "maxTokens": 1000
}
```

## Agents

1. **sleep** - Dr. Luna (🌙) - Sleep quality and insomnia
2. **fitness** - Coach Phoenix (🔥) - Exercise and physical activity
3. **mental-health** - Dr. Serenity (🧘) - Mental wellbeing and anxiety
4. **nutrition** - Chef Nourish (🥗) - Diet and nutrition
5. **finances** - Sage Finance (💰) - Money and budgeting
6. **physical-health** - Dr. Vital (❤️) - Physical wellness
7. **social** - Ambassador Nova (🤝) - Relationships and connection
8. **spirituality** - Sage Spirit (✨) - Meaning and purpose

## Usage

In agent handlers:

```javascript
const fs = require('fs');
const path = require('path');

// Load prompt
const promptPath = path.join(__dirname, '../agents/sleep.prompt.txt');
const prompt = fs.readFileSync(promptPath, 'utf8');

// Load config
const configPath = path.join(__dirname, '../agents/sleep.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Inject context
const systemWithContext = prompt.replace(
  'SYSTEM PROMPT:',
  `SYSTEM PROMPT:\n${context.contextString}`
);
```

## Benefits

- ✅ Clean separation of concerns
- ✅ Easy to version control prompts
- ✅ Simple to A/B test different phrasings
- ✅ Centralized configuration
- ✅ No code changes needed to adjust behavior
- ✅ Team can edit prompts without touching code
