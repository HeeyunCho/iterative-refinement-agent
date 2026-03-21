# Iterative Refinement Agent (GEMINI.md)

## Purpose
This MCP server implements a structured **Iterative Refinement** pattern, a looping mechanism to progressively improve an output over multiple cycles. It ensures that complex generation tasks (like code debugging or document drafting) meet a high-quality threshold before completion.

## Usage for Agents
- **`start_refinement`**: Initialize a refinement task with a goal, initial content, and a maximum iteration limit.
- **`submit_critique`**: Provide detailed feedback or criticism of the current version of the output.
- **`apply_revision`**: Update the output content based on the provided critique, incrementing the iteration counter.
- **`get_refinement_status`**: Retrieve the current version, iteration count, and full history of critiques and revisions.
- **`finalize_output`**: Terminate the loop and mark the output as final once the quality threshold is met.

## The Iterative Loop Mandate
1. **DRAFT**: Generate or provide the initial version of the output.
2. **CRITIQUE**: Analyze the current draft for flow, tone, correctness, or specific requirements.
3. **REWRITE**: Apply revisions based on the critique to produce an improved version.
4. **REPEAT**: Continue until the quality threshold is met or `maxIterations` is reached.

## Exit Conditions
Always monitor `iterationCount`. If the quality is sufficient or `maxIterations` is reached, use `finalize_output` to prevent infinite loops and excessive costs.
