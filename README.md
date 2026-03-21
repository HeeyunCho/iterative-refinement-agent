# Iterative Refinement Agent

A specialized MCP server implementing the **Iterative Refinement** pattern. This agent is designed for complex generation tasks that require progressive improvement over multiple cycles.

## 🚀 Purpose
High-quality code, documentation, or plans are rarely perfect on the first try. This agent facilitates a structured **Draft -> Critique -> Rewrite** loop, ensuring that the final output meets a predefined quality threshold.

## 🛠 Features
- **Version Control**: Automatically tracks every version of the output and its associated critique.
- **Safety Limits**: Built-in `maxIterations` enforcement to prevent infinite loops and excessive token costs.
- **Structured Tools**:
  - `start_refinement`: Initialize a task with a goal and initial draft.
  - `record_critique`: Attach detailed feedback to the current version.
  - `apply_revision`: Increment the version counter and update content based on the critique.
  - `finalize_output`: Safely close the loop once quality standards are met.

## 📦 Installation
```bash
npm install
npm run build
```

## 🤖 Usage in MCP
Register the server in your `settings.json`:
```json
"iterative-refinement-agent": {
  "command": "node",
  "args": ["C:/gemini_project/iterative-refinement-agent/dist/index.js"]
}
```

## 📜 The Refinement Loop
1. **DRAFT**: Generate the initial version.
2. **CRITIQUE**: Analyze for flow, correctness, and tone.
3. **REWRITE**: Apply improvements and repeat until finalized.
