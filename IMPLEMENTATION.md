# IMPLEMENTATION: Iterative Refinement Agent

## Overview
The `iterative-refinement-agent` is an MCP server designed to manage the Iterative Refinement pattern. It provides a structured versioning system for drafts, critiques, and revisions.

## Tool Definitions

### `start_refinement(goal: string, initialContent: string, maxIterations?: number)`
- **Purpose**: Initializes a new refinement session.
- **Output**: Returns a unique `sessionId`.

### `record_critique(sessionId: string, critique: string)`
- **Purpose**: Attaches feedback to the current version.

### `apply_revision(sessionId: string, newContent: string)`
- **Purpose**: Creates a new version (incrementing the counter) based on the critique.

### `get_refinement_status(sessionId: string)`
- **Purpose**: Generates a full chronological history of versions and critiques.

### `finalize_output(sessionId: string, reason?: string)`
- **Purpose**: Marks the process as complete, stopping the loop.

## Internal Architecture
- **State Storage**: In-memory `Map<string, RefinementSession>`.
- **Validation**: Zod-based schema enforcement for all inputs.
- **Protocol**: Standard MCP/Stdio.
- **Max Iterations**: Enforced to prevent infinite loops.
