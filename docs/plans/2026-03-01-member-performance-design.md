# Member Performance Page — Design Document

## Goal

Add a dedicated **"My Performance"** page that shows members how AI-ready they are — or more importantly, how much they're **not**.

The page uses their onboarding survey answers to calculate an initial AI Readiness Score that's intentionally low, then progressively raises it as the admin grades their assignment submissions. Three rich chart types paint the picture.

## Data Sources

### Inputs (Already Exist)
- **`users.onboarding_data.survey_answers`** — JSONB with their full survey responses
- **`users.ai_readiness_score`** — integer 0–100, currently set at onboarding
- **Team scale answers:** `ai_confidence`, `ai_skill_level`, `quality_confidence`, `workflow_readiness` (1–5 each)
- **Management scale answers:** `ai_visibility`, `brand_confidence`, `team_readiness` (1–5 each) + `business_impact` matrix
- **Checkbox answers:** `workflow_difficulties`, `ai_concerns`, `ai_tools_used`, `learning_needs`

### New Input Required
- **`submissions.score`** — integer 0–100, set by admin when reviewing an assignment

## Scoring Engine (Hardwired to Start Low)

### Initial Score (From Survey)
```
baseScore = avg(scale_answers) / 5 * 100   // Raw: 20-100
penalty   = 0.55                            // Multiply by 0.55 to compress
initial   = round(baseScore * penalty)      // Result: ~11–55, most land 15-35
```

The 0.55 multiplier ensures even someone who rates themselves 3/5 on everything gets only ~33%. Only a perfect 5/5 across the board yields 55% — and that's the *ceiling* before assignments.

### Growth (From Graded Assignments)
```
assignmentBoost = avg(all_graded_scores) / 100 * 45   // 0–45 pts
finalScore      = min(100, initialScore + assignmentBoost)
```

The remaining 45 points come exclusively from assignment grades. Full 100% requires both high self-assessment AND top assignment scores.

## Charts

### 1. Hero — AI Readiness Score
A large animated circular gauge (0–100%). Lime fill for the scored portion, dark for the gap. Number animates on load. Color shifts from red (<30) → amber (30–60) → lime (60+).

### 2. Skill Gap Radar Chart
5-axis spider chart comparing member vs. "Zkandar Standard" (always 100%):

| Axis | Source (Team) | Source (Management) |
|------|--------------|-------------------|
| Speed | `workflow_readiness` | `team_readiness` |
| Quality | `quality_confidence` | `brand_confidence` |
| Tool Mastery | tools_used count / 6 | `studio_ai_usage` rank |
| Confidence | `ai_confidence` | `ai_visibility` |
| Consistency | assignment avg score | assignment avg score |

Grey fill = Zkandar Standard. Lime fill = member's current level. Gap is immediately visible.

### 3. Workflow Bottleneck Heatmap
Maps the member's `workflow_difficulties` selections to risk zones:

| Zone | Maps to survey answer |
|------|----------------------|
| Concept Generation | "Getting strong concepts or ideas" |
| Visual Storytelling | "Creating mood or storytelling visuals" |
| Style Control | "Controlling style and consistency" |
| Iteration Speed | "Iterating efficiently" |
| Revision Handling | "Handling feedback or revisions" |
| Design Translation | "Translating AI ideas into real design work" |

Each selected difficulty = Red. Non-selected = Green. As assignments related to these areas are graded, the red fades to amber then green.

### 4. Time Wasted Bar Chart
Hardwired estimates based on their role:

| Role | Manual Hours/Week | AI-Optimized Hours/Week |
|------|------------------|------------------------|
| Interior Designer | 18 | 6 |
| Architect | 20 | 7 |
| Visualizer | 22 | 5 |
| Junior Designer | 15 | 5 |
| Senior Designer | 16 | 5 |
| BIM / Technical | 14 | 8 |
| Other / Management | 12 | 6 |

Bar chart: Red bar (current waste) vs. Lime bar (AI-optimized). Delta shown as "X hours saved per week".

## Admin Changes — Grading in SubmissionsModal

Add a **score slider (0–100)** to the existing `SubmissionsModal` next to the feedback textarea. When admin clicks "Save feedback", it also saves the score. This score is what drives the Radar Chart's "Consistency" axis and the overall score growth.

## Database Changes
- Add `score INTEGER DEFAULT NULL` to `submissions` table
- No changes to RLS policies needed (existing admin update policy covers this)

## Route & Navigation
- New route: `/my-performance`
- New sidebar item: "My Performance" with `TrendingUp` icon, between "My Program" and "Chat"
