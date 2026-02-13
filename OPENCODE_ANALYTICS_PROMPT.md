# Helix Tracker Analytics Module - OpenCode Briefing

## Objective
Replace the placeholder "📊 Analytics Weekly trends and macro analysis coming soon..." with a full-featured analytics dashboard that transforms raw nutrition data into actionable visualizations and AI-powered insights.

## Tech Stack
- **Pure HTML/CSS/JavaScript** (no frameworks)
- **Chart.js** for lightweight data visualization
- **localStorage** for data retrieval (keys: `nutrition-YYYY-MM-DD-{breakfast|lunch|dinner|snack}`)
- **Target Macros:** Calories 1,600 | Protein 150g | Carbs 150g | Fat 70g

## Feature Set

### 1. Time-Series Charts (7-day & 30-day toggle)
- **Line Chart:** Daily calorie intake vs 1,600 target line (with visual zone for on-target range)
- **Stacked Bar Chart:** Macro breakdown (protein/carbs/fat) per day, each day shows three segments
- **Area Chart:** Weekly calorie trends with 7-day moving average overlay

### 2. Statistical Insight Cards (Dashboard Grid)
- **Avg Daily Calories:** Last 7 days | Last 30 days
- **Protein Consistency Score:** % of days hitting 150g target (green if >80%, yellow if 60-80%, red if <60%)
- **Top 5 Foods by Frequency:** List most-logged items across all meals
- **Best/Worst Macro Days:** Auto-identify outliers (highest/lowest calorie days, best protein days, etc.)

### 3. AI-Powered Analysis Section
Generate text insights using pattern detection (no API calls—use localStorage data):
- **Pattern Detection:** "You tend to eat X% more calories on [weekends/specific days]"
- **Goal Gap Analysis:** "You're averaging Xg protein - Xg short of target. Consider adding [specific suggestion]"
- **Meal Timing Insights:** "Your [snack/lunch] calories are X% of daily intake - consider redistribution"
- **Trend Forecasting:** "At current pace, you'll [hit/miss] weekly target with X cal [buffer/deficit]"

### 4. Macro Balance Visualization
- **Pie/Donut Chart:** Current macro ratio (% protein/carbs/fat) vs ideal (40% carbs / 30% protein / 30% fat)
- **Protein Efficiency Score:** g protein per calorie (higher = better)
- **Compliance Heatmap Calendar:** 30-day grid showing green (hit target) / yellow (close) / red (missed) for each day

### 5. Comparison Tools
- **Week-over-Week Comparison:** Side-by-side average metrics (current week vs previous week)
- **Day-of-Week Patterns:** Line chart showing Monday vs Tuesday vs... Sunday trends (avg intake per day of week)

## Data Source
```
localStorage keys: nutrition-YYYY-MM-DD-{breakfast|lunch|dinner|snack}
Each value is a JSON array: [{name: "Food", cal: 500, protein: 30, carbs: 40, fat: 20}, ...]
Aggregation: Sum by day, then by week/month
```

## UI/UX Requirements
- Responsive grid layout (charts stack on mobile)
- Toggle buttons for 7-day / 30-day / 90-day views where applicable
- Color-coded: Green (on-target) | Yellow (warning) | Red (alert)
- Insights render as readable prose cards (not bullet lists)
- All calculations happen client-side (no API calls)

## Deliverables
1. New `<section id="analytics">` with full HTML structure
2. Chart.js initialization code (CDN link if needed)
3. JavaScript module: `nutritionAnalytics()` to fetch localStorage, aggregate data, generate insights
4. CSS: Responsive grid, card styling, chart containers
5. Insert analytics section into existing tracker.html (replace placeholder)

## Success Criteria
- ✅ Charts render with real localStorage data
- ✅ AI insights are contextual and accurate (no hallucination)
- ✅ All calculations validate against manual spot-checks
- ✅ Mobile-responsive (< 600px breakpoint)
- ✅ Performance: page load <2s with full month of data

## Edge Cases
- Empty localStorage (show placeholder: "No data yet - start logging meals")
- Incomplete weeks (handle missing days gracefully)
- Zero-value macros (skip or show as 0%)
- Days with no intake (count as missed targets but don't crash)

---
**Status:** Ready for OpenCode execution  
**Owner:** Architect  
**Deadline:** Today  
