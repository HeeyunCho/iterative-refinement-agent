import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';

/**
 * Iterative Refinement Logic: Session Management
 */
interface RefinementVersion {
  version: number;
  content: string;
  critique?: string;
  timestamp: string;
}

interface RefinementSession {
  id: string;
  goal: string;
  currentContent: string;
  versions: RefinementVersion[];
  maxIterations: number;
  currentIteration: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'MAX_ITERATIONS_REACHED';
}

const sessionStore = new Map<string, RefinementSession>();

/**
 * Tool Schemas
 */
const StartRefinementSchema = z.object({
  goal: z.string().describe("The high-level goal or target output"),
  initialContent: z.string().describe("The initial draft or starting point"),
  maxIterations: z.number().optional().default(5).describe("Limit to prevent infinite loops"),
});

const RecordCritiqueSchema = z.object({
  sessionId: z.string().describe("The ID of the refinement session"),
  critique: z.string().describe("Feedback or criticism for the current version"),
});

const ApplyRevisionSchema = z.object({
  sessionId: z.string().describe("The ID of the refinement session"),
  newContent: z.string().describe("The improved content based on the critique"),
});

const GetStatusSchema = z.object({
  sessionId: z.string().describe("The ID of the refinement session"),
});

const FinalizeSchema = z.object({
  sessionId: z.string().describe("The ID of the refinement session"),
  reason: z.string().optional().describe("Why the process is being finalized"),
});

/**
 * MCP Server Definition
 */
const server = new Server(
  {
    name: "iterative-refinement-agent",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Tool Registration
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "start_refinement",
        description: "Initialize a new iterative refinement task.",
        inputSchema: {
          type: "object",
          properties: {
            goal: { type: "string", description: "The goal of the task" },
            initialContent: { type: "string", description: "The starting content" },
            maxIterations: { type: "number", description: "Max refinement cycles (default 5)" },
          },
          required: ["goal", "initialContent"],
        },
      },
      {
        name: "record_critique",
        description: "Submit a critique of the current draft for improvement.",
        inputSchema: {
          type: "object",
          properties: {
            sessionId: { type: "string", description: "The session ID" },
            critique: { type: "string", description: "The feedback" },
          },
          required: ["sessionId", "critique"],
        },
      },
      {
        name: "apply_revision",
        description: "Apply a revision based on the critique, creating a new version.",
        inputSchema: {
          type: "object",
          properties: {
            sessionId: { type: "string", description: "The session ID" },
            newContent: { type: "string", description: "The updated content" },
          },
          required: ["sessionId", "newContent"],
        },
      },
      {
        name: "get_refinement_status",
        description: "Retrieve the current state and full version history of a refinement session.",
        inputSchema: {
          type: "object",
          properties: {
            sessionId: { type: "string", description: "The session ID" },
          },
          required: ["sessionId"],
        },
      },
      {
        name: "finalize_output",
        description: "Mark the refinement process as complete.",
        inputSchema: {
          type: "object",
          properties: {
            sessionId: { type: "string", description: "The session ID" },
            reason: { type: "string", description: "Why the refinement is done" },
          },
          required: ["sessionId"],
        },
      },
    ],
  };
});

/**
 * Tool Handlers
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "start_refinement": {
        const { goal, initialContent, maxIterations } = StartRefinementSchema.parse(args);
        const id = uuidv4();
        const session: RefinementSession = {
          id,
          goal,
          currentContent: initialContent,
          versions: [{
            version: 0,
            content: initialContent,
            timestamp: new Date().toISOString(),
          }],
          maxIterations,
          currentIteration: 0,
          status: 'IN_PROGRESS',
        };
        sessionStore.set(id, session);
        return {
          content: [{ type: "text", text: `Refinement started with ID: ${id}\nGoal: ${goal}\nInitial Content: ${initialContent.substring(0, 50)}...` }],
        };
      }

      case "record_critique": {
        const { sessionId, critique } = RecordCritiqueSchema.parse(args);
        const session = sessionStore.get(sessionId);
        if (!session) throw new Error(`Session ${sessionId} not found`);

        const currentVersion = session.versions[session.versions.length - 1];
        currentVersion.critique = critique;

        return {
          content: [{ type: "text", text: `[CRITIQUE] Logged for session ${sessionId} - Version ${currentVersion.version}` }],
        };
      }

      case "apply_revision": {
        const { sessionId, newContent } = ApplyRevisionSchema.parse(args);
        const session = sessionStore.get(sessionId);
        if (!session) throw new Error(`Session ${sessionId} not found`);

        if (session.currentIteration >= session.maxIterations) {
          session.status = 'MAX_ITERATIONS_REACHED';
          throw new Error(`Session ${sessionId} has reached maximum iterations (${session.maxIterations})`);
        }

        session.currentIteration += 1;
        session.currentContent = newContent;
        session.versions.push({
          version: session.currentIteration,
          content: newContent,
          timestamp: new Date().toISOString(),
        });

        if (session.currentIteration === session.maxIterations) {
          session.status = 'MAX_ITERATIONS_REACHED';
        }

        return {
          content: [{ type: "text", text: `[REVISION] Version ${session.currentIteration} applied for session ${sessionId}` }],
        };
      }

      case "get_refinement_status": {
        const { sessionId } = GetStatusSchema.parse(args);
        const session = sessionStore.get(sessionId);
        if (!session) throw new Error(`Session ${sessionId} not found`);

        let history = `SESSION: ${session.id}\nGOAL: ${session.goal}\nSTATUS: ${session.status}\nITERATION: ${session.currentIteration}/${session.maxIterations}\n\n`;
        session.versions.forEach((refinementVersionHistoryItem) => {
          history += `--- VERSION ${refinementVersionHistoryItem.version} (${refinementVersionHistoryItem.timestamp}) ---\nCONTENT:\n${refinementVersionHistoryItem.content}\n`;
          if (refinementVersionHistoryItem.critique) {
            history += `CRITIQUE:\n${refinementVersionHistoryItem.critique}\n`;
          }
          history += `\n`;
        });

        return {
          content: [{ type: "text", text: history }],
        };
      }

      case "finalize_output": {
        const { sessionId, reason } = FinalizeSchema.parse(args);
        const session = sessionStore.get(sessionId);
        if (!session) throw new Error(`Session ${sessionId} not found`);

        session.status = 'COMPLETED';
        return {
          content: [{ type: "text", text: `[FINALIZED] Session ${sessionId} marked as complete.\nReason: ${reason || "Quality threshold met."}` }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        content: [{ type: "text", text: `Error: Invalid inputs - ${error.issues.map((e: any) => e.message).join(", ")}` }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: `Error: ${(error as Error).message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("iterative-refinement-agent server running on stdio");
}

main().catch(console.error);
