# AI Modules Integration - Visual Overview

## 🎯 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                            │
│                                                                  │
│  • Chat Components                                               │
│  • Journaling UI                                                 │
│  • Planning Dashboard                                            │
│  • Insights Widgets                                              │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               │ HTTPS Requests
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                    API ROUTES LAYER                              │
│                  /api/ai/unified/*                               │
│                                                                  │
│  ✅ /chat          - Universal chat endpoint                     │
│  ✅ /journaling    - Generate prompts                            │
│  ✅ /plan          - Adaptive planning                           │
│  ✅ /correlations  - Pattern analysis                            │
│  ✅ /micro-actions - Quick actions                               │
│  ✅ /workflow      - Multi-step routines                         │
│  ✅ /modules       - Module info                                 │
│  ✅ /memory        - Memory management                           │
│  ✅ /health        - Health check                                │
│                                                                  │
│  🔒 Auth Required | 🛡️ Rate Limited | 🧹 Sanitized              │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│              AI ORCHESTRATOR SERVICE                             │
│           backend/services/aiOrchestratorService.js              │
│                                                                  │
│  • Load user data (User, CheckIns, Habits)                      │
│  • Build context for AI                                          │
│  • Format responses                                              │
│  • Handle errors gracefully                                      │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│              UNIFIED ORCHESTRATOR                                │
│        backend/src/ai/orchestrator/unifiedOrchestrator.js        │
│                                                                  │
│  Step 1: 🚨 Crisis Check (ALWAYS FIRST)                         │
│  Step 2: 🎯 Route to appropriate module                         │
│  Step 3: 🔄 Execute module logic                                │
│  Step 4: 💾 Update memory                                       │
│  Step 5: ✅ Return formatted response                            │
└────────┬──────────────┬────────────────┬────────────────────────┘
         │              │                │
         │              │                │
    ┌────▼─────┐   ┌───▼──────┐    ┌───▼────────┐
    │          │   │          │    │            │
    │  COACHES │   │ ENGINES  │    │   UTILS    │
    │          │   │          │    │            │
    └──────────┘   └──────────┘    └────────────┘
```

## 🎨 Module Categories

### 🧑‍⚕️ COACH AGENTS (8 total)

```
┌─────────────────────┐
│   Sleep Coach       │  Sleep hygiene, insomnia
├─────────────────────┤
│ Mental Health Coach │  Stress, anxiety, mood
├─────────────────────┤
│   Diet Coach        │  Nutrition, meals
├─────────────────────┤
│  Fitness Coach      │  Exercise, workouts
├─────────────────────┤
│Physical Health Coach│  General health
├─────────────────────┤
│  Finances Coach     │  Budgeting, money
├─────────────────────┤
│   Social Coach      │  Relationships
├─────────────────────┤
│ Spirituality Coach  │  Purpose, meaning
└─────────────────────┘
```

### ⚙️ SPECIALIZED ENGINES (5 total)

```
┌─────────────────────┐
│ Crisis Handler      │  🚨 Always runs first
├─────────────────────┤
│ Correlation Engine  │  📊 Pattern analysis
├─────────────────────┤
│ Journaling Agent    │  ✍️ 6 prompt types
├─────────────────────┤
│ Adaptive Planner    │  📋 Data-driven plans
├─────────────────────┤
│ Micro-Actions       │  ⚡ 2-5 min actions
└─────────────────────┘
```

## 🔄 Request Flow

### Example: User asks "I can't sleep"

```
1. Frontend
   │
   │ POST /api/ai/unified/chat
   │ { message: "I can't sleep" }
   │
   ▼
2. API Route (aiUnifiedRoutes.js)
   │
   │ ✅ Check auth token
   │ ✅ Apply rate limit
   │ ✅ Sanitize input
   │
   ▼
3. Service Layer (aiOrchestratorService.js)
   │
   │ 📦 Load user data
   │    - User profile
   │    - Recent check-ins
   │    - Active habits
   │
   ▼
4. Unified Orchestrator (unifiedOrchestrator.js)
   │
   │ 🚨 Crisis check: ✅ No crisis
   │ 🎯 Route: "sleep" detected → Sleep Coach
   │ 🔄 Execute: Sleep Coach processes message
   │ 💾 Memory: Save conversation
   │
   ▼
5. Sleep Coach Agent
   │
   │ 🤖 AI generates response
   │ 💡 Provides sleep hygiene tips
   │ ✅ Returns helpful advice
   │
   ▼
6. Response
   │
   └─► {
         ok: true,
         module: "sleep_coach",
         pillar: "sleep",
         response: "Let's improve your sleep hygiene...",
         metadata: { model: "gpt-4-turbo" }
       }
```

## 🚨 Crisis Flow

### Example: User expresses suicidal ideation

```
1. Message arrives
   │
   ▼
2. Crisis Check (FIRST THING)
   │
   │ 🚨 CRISIS DETECTED
   │ Type: Suicide
   │ Severity: Critical
   │
   ▼
3. Immediate Response
   │
   │ ⚠️ Skip regular coaches
   │ 📞 Provide hotline numbers
   │ 🆘 Give immediate resources
   │ 💙 Supportive message
   │
   ▼
4. Return Crisis Response
   │
   └─► {
         isCrisis: true,
         module: "crisis_handler",
         severity: "critical",
         response: "I'm very concerned...",
         resources: [
           { name: "988 Suicide Prevention",
             number: "988",
             available: "24/7" }
         ]
       }
```

## 🔀 Workflow Example

### Morning Routine Workflow

```
POST /api/ai/unified/workflow
{ workflowType: "morning_routine" }

┌──────────────────────────────────┐
│  Step 1: Mental Health Check-in │
│  "How am I feeling this morning?"│
│  → Mental Health Coach           │
└───────────┬──────────────────────┘
            │
            │ Result feeds into...
            │
┌───────────▼──────────────────────┐
│  Step 2: Daily Intentions        │
│  "Generate morning intention"    │
│  → Journaling Agent              │
└───────────┬──────────────────────┘
            │
            │ Result feeds into...
            │
┌───────────▼──────────────────────┐
│  Step 3: Quick Actions           │
│  "Morning micro-actions"         │
│  → Micro-Actions Engine          │
└───────────┬──────────────────────┘
            │
            ▼
       🎉 Complete!
```

## 📊 Module Statistics

| Category            | Count | Examples                     |
| ------------------- | ----- | ---------------------------- |
| Coach Agents        | 8     | Sleep, Mental Health, Diet   |
| Specialized Engines | 5     | Crisis, Correlation, Journal |
| API Endpoints       | 10    | /chat, /plan, /workflow      |
| Security Features   | 6     | Auth, Rate Limit, Sanitize   |
| Workflow Types      | 3     | Morning, Evening, Assessment |

## 🎯 Integration Points

```
DATABASE MODELS          AI MODULES           FRONTEND
─────────────────        ──────────           ────────

User ────────────┐       ┌─► Sleep Coach     Chat UI
                 │       │
PillarCheckIn ───┼──────►├─► Mental Health   Journal UI
                 │       │
Habit ───────────┼──────►├─► Diet Coach      Planning UI
                 │       │
Goal ────────────┘       ├─► Fitness Coach   Insights UI
                         │
                         ├─► Crisis Handler
                         │
                         ├─► Correlation
                         │
                         └─► Adaptive Plan
```

## ✅ Quality Gates

Every request goes through:

```
┌─────────────────────┐
│ 1. Authentication   │ ✅ Valid token?
├─────────────────────┤
│ 2. Authorization    │ ✅ Feature access?
├─────────────────────┤
│ 3. Rate Limiting    │ ✅ Under limit?
├─────────────────────┤
│ 4. Input Validation │ ✅ Valid format?
├─────────────────────┤
│ 5. Sanitization     │ ✅ Clean input?
├─────────────────────┤
│ 6. Crisis Check     │ ✅ Safe to proceed?
├─────────────────────┤
│ 7. Process Request  │ 🎯 Execute module
├─────────────────────┤
│ 8. Format Response  │ 📦 Clean output
├─────────────────────┤
│ 9. Update Memory    │ 💾 Save context
├─────────────────────┤
│ 10. Log & Monitor   │ 📊 Track usage
└─────────────────────┘
```

## 🎉 Summary

**13 AI modules** cleanly integrated through:

- 1 unified orchestrator
- 1 service layer
- 10 API endpoints
- Complete security
- Smart routing
- Memory management
- Crisis safety
- Multi-module workflows

**Status**: ✅ Production Ready
