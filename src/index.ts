#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  CallToolRequest,
  ElicitRequestSchema,
  ElicitResultSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";

interface ElicitationSchema {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
}

interface ElicitationParams {
  message: string;
  requestedSchema: ElicitationSchema;
  timeoutMs?: number; // Custom timeout in milliseconds
  [key: string]: unknown;
}

interface ConfirmationLogEntry {
  timestamp: string;
  confirmationType: string;
  request: ElicitationParams;
  response: {
    action: "accept" | "decline" | "cancel";
    content?: Record<string, unknown>;
  };
  responseTimeMs: number;
  success: boolean;
  error?: string;
}

interface ServerConfig {
  confirmationHistoryPath: string;
  defaultTimeoutMs: number;
}

interface LogSearchParams {
  keyword?: string;
  confirmationType?: string;
  startDate?: string;
  endDate?: string;
  success?: boolean;
  timedOut?: boolean;
  minResponseTime?: number;
  maxResponseTime?: number;
  page?: number;
  pageSize?: number;
}

interface LogSearchResult {
  entries: ConfirmationLogEntry[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

class ConfirmationMCPServer {
  private server: Server;
  private isDebug: boolean;
  private config: ServerConfig;

  constructor() {
    this.isDebug = process.env.NODE_ENV === "development";
    this.config = this.loadConfig();

    this.server = new Server(
      {
        name: "mcp-confirm",
        version: "1.2.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.log("ConfirmationMCPServer initialized");
  }

  private log(message: string, ...args: unknown[]) {
    if (this.isDebug) {
      console.error(
        `[DEBUG] ${new Date().toISOString()} - ${message}`,
        ...args
      );
    }
  }

  private loadConfig(): ServerConfig {
    const defaultConfig: ServerConfig = {
      confirmationHistoryPath: ".mcp-data/confirmation_history.log",
      defaultTimeoutMs: 180000, // 3 minutes
    };

    // TODO: Load from config file if exists
    // For now, use environment variables or defaults
    return {
      confirmationHistoryPath:
        process.env.MCP_CONFIRM_LOG_PATH ||
        defaultConfig.confirmationHistoryPath,
      defaultTimeoutMs: parseInt(
        process.env.MCP_CONFIRM_TIMEOUT_MS ||
          String(defaultConfig.defaultTimeoutMs),
        10
      ),
    };
  }

  private async ensureLogDirectory() {
    const logDir = path.dirname(this.config.confirmationHistoryPath);
    try {
      await fs.promises.mkdir(logDir, { recursive: true });
    } catch (error) {
      this.log("Failed to create log directory:", error);
    }
  }

  private async logConfirmation(entry: ConfirmationLogEntry) {
    try {
      await this.ensureLogDirectory();
      const logLine = JSON.stringify(entry) + "\n";
      await fs.promises.appendFile(
        this.config.confirmationHistoryPath,
        logLine,
        "utf8"
      );
    } catch (error) {
      this.log("Failed to write confirmation log:", error);
    }
  }

  private setupHandlers() {
    this.log("Setting up MCP handlers");
    this.setupElicitationHandler();
    this.setupToolListHandler();
    this.setupToolCallHandler();
  }

  private setupElicitationHandler() {
    // Handle elicitation requests
    this.server.setRequestHandler(ElicitRequestSchema, async (request) => {
      this.log("Received elicitation request:", request);

      // In a real implementation, this would show a UI dialog to the user
      // and collect their input. For now, we'll simulate user responses.
      const { message, requestedSchema } = request.params;

      // Simulate different user actions based on the message content
      if (
        message.toLowerCase().includes("cancel") ||
        message.toLowerCase().includes("キャンセル")
      ) {
        return {
          action: "cancel" as const,
        };
      }

      if (
        message.toLowerCase().includes("decline") ||
        message.toLowerCase().includes("拒否")
      ) {
        return {
          action: "decline" as const,
        };
      }

      // Generate mock user data based on the schema
      const mockContent = this.generateMockContent(requestedSchema);

      return {
        action: "accept" as const,
        content: mockContent,
      };
    });
  }

  private setupToolListHandler() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getToolDefinitions(),
      };
    });
  }

  private getToolDefinitions(): Tool[] {
    return [
      this.createAskYesNoTool(),
      this.createConfirmActionTool(),
      this.createClarifyIntentTool(),
      this.createVerifyUnderstandingTool(),
      this.createCollectRatingTool(),
      this.createElicitCustomTool(),
      this.createSearchLogsTool(),
      this.createAnalyzeLogsTool(),
    ];
  }

  private createAskYesNoTool(): Tool {
    return {
      name: "ask_yes_no",
      description:
        "Ask a yes/no confirmation question to the user when the AI needs clarification or verification",
      inputSchema: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "The yes/no confirmation question to ask the user",
          },
        },
        required: ["question"],
      },
    };
  }

  private createConfirmActionTool(): Tool {
    return {
      name: "confirm_action",
      description:
        "Ask user to confirm an action before proceeding with potentially impactful operations",
      inputSchema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "Description of the action to be confirmed",
          },
          impact: {
            type: "string",
            description: "Potential impact or consequences of this action",
          },
          details: {
            type: "string",
            description: "Additional details about what will happen",
          },
        },
        required: ["action"],
      },
    };
  }

  private createClarifyIntentTool(): Tool {
    return {
      name: "clarify_intent",
      description:
        "Ask user to clarify their intent when the request is ambiguous or could be interpreted multiple ways",
      inputSchema: {
        type: "object",
        properties: {
          request_summary: {
            type: "string",
            description:
              "Summary of what the AI understood from the user's request",
          },
          ambiguity: {
            type: "string",
            description: "Description of what is unclear or ambiguous",
          },
          options: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "Possible interpretations or options for the user to choose from",
          },
        },
        required: ["request_summary", "ambiguity"],
      },
    };
  }

  private createVerifyUnderstandingTool(): Tool {
    return {
      name: "verify_understanding",
      description:
        "Verify that the AI correctly understood the user's requirements before proceeding",
      inputSchema: {
        type: "object",
        properties: {
          understanding: {
            type: "string",
            description: "AI's understanding of the user's request",
          },
          key_points: {
            type: "array",
            items: {
              type: "string",
            },
            description: "Key points that the AI wants to confirm",
          },
          next_steps: {
            type: "string",
            description:
              "What the AI plans to do next if understanding is correct",
          },
        },
        required: ["understanding"],
      },
    };
  }

  private createCollectRatingTool(): Tool {
    return {
      name: "collect_rating",
      description:
        "Collect user satisfaction rating for AI's response or help quality",
      inputSchema: {
        type: "object",
        properties: {
          subject: {
            type: "string",
            description:
              "What to rate (e.g., 'this response', 'my help with your task')",
          },
          description: {
            type: "string",
            description: "Additional context for the rating request",
          },
        },
        required: ["subject"],
      },
    };
  }

  private createElicitCustomTool(): Tool {
    return {
      name: "elicit_custom",
      description:
        "Create a custom confirmation dialog with specific schema when standard tools don't fit",
      inputSchema: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "Message to display to the user",
          },
          schema: {
            type: "object",
            description:
              "JSON schema defining the structure of information to collect",
          },
        },
        required: ["message", "schema"],
      },
    };
  }

  private createSearchLogsTool(): Tool {
    return {
      name: "search_logs",
      description:
        "Search confirmation history logs with various filters and pagination",
      inputSchema: {
        type: "object",
        properties: {
          keyword: {
            type: "string",
            description: "Search keyword in message content",
          },
          confirmationType: {
            type: "string",
            description:
              "Filter by confirmation type (confirmation, rating, clarification, verification, yes_no, custom)",
            enum: [
              "confirmation",
              "rating",
              "clarification",
              "verification",
              "yes_no",
              "custom",
            ],
          },
          startDate: {
            type: "string",
            description: "Start date filter (ISO 8601 format)",
            format: "date-time",
          },
          endDate: {
            type: "string",
            description: "End date filter (ISO 8601 format)",
            format: "date-time",
          },
          success: {
            type: "boolean",
            description: "Filter by success status",
          },
          timedOut: {
            type: "boolean",
            description: "Filter by timeout status",
          },
          minResponseTime: {
            type: "number",
            description: "Minimum response time in milliseconds",
          },
          maxResponseTime: {
            type: "number",
            description: "Maximum response time in milliseconds",
          },
          page: {
            type: "number",
            description: "Page number for pagination (1-based)",
            minimum: 1,
            default: 1,
          },
          pageSize: {
            type: "number",
            description: "Number of entries per page",
            minimum: 1,
            maximum: 100,
            default: 10,
          },
        },
      },
    };
  }

  private createAnalyzeLogsTool(): Tool {
    return {
      name: "analyze_logs",
      description: "Perform statistical analysis on confirmation history logs",
      inputSchema: {
        type: "object",
        properties: {
          startDate: {
            type: "string",
            description: "Start date for analysis (ISO 8601 format)",
            format: "date-time",
          },
          endDate: {
            type: "string",
            description: "End date for analysis (ISO 8601 format)",
            format: "date-time",
          },
          groupBy: {
            type: "string",
            description: "Group analysis by field",
            enum: ["confirmationType", "success", "hour", "day"],
            default: "confirmationType",
          },
        },
      },
    };
  }

  private setupToolCallHandler() {
    // Handle tool calls
    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request: CallToolRequest) => {
        const { name, arguments: args } = request.params;

        try {
          return await this.executeToolCall(name, args || {});
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  private async executeToolCall(name: string, args: Record<string, unknown>) {
    switch (name) {
      case "ask_yes_no":
        return await this.handleAskYesNo(args);
      case "confirm_action":
        return await this.handleConfirmAction(args);
      case "clarify_intent":
        return await this.handleClarifyIntent(args);
      case "verify_understanding":
        return await this.handleVerifyUnderstanding(args);
      case "collect_rating":
        return await this.handleCollectRating(args);
      case "elicit_custom":
        return await this.handleElicitCustom(args);
      case "search_logs":
        return await this.handleSearchLogs(args);
      case "analyze_logs":
        return await this.handleAnalyzeLogs(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private generateMockContent(
    schema: ElicitationSchema
  ): Record<string, unknown> {
    const content: Record<string, unknown> = {};

    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const prop = propSchema as Record<string, unknown>;

      switch (prop.type) {
        case "string":
          if (Array.isArray(prop.enum) && prop.enum.length > 0) {
            content[key] = prop.enum[0];
          } else if (prop.format === "email") {
            content[key] = "user@example.com";
          } else if (prop.format === "date") {
            content[key] = "2025-08-04";
          } else {
            content[key] =
              `Mock ${typeof prop.title === "string" ? prop.title : key}`;
          }
          break;
        case "number":
        case "integer":
          content[key] = typeof prop.minimum === "number" ? prop.minimum : 1;
          break;
        case "boolean":
          content[key] = prop.default !== undefined ? prop.default : true;
          break;
        default:
          content[key] = `Mock value for ${key}`;
      }
    }

    return content;
  }

  private createErrorResponse(message: string) {
    return {
      content: [
        {
          type: "text",
          text: message,
        },
      ],
      isError: true,
    };
  }

  private createSuccessResponse(message: string) {
    return {
      content: [
        {
          type: "text",
          text: message,
        },
      ],
    };
  }

  private async sendElicitationRequest(params: ElicitationParams): Promise<{
    action: "accept" | "decline" | "cancel";
    content?: Record<string, unknown>;
  }> {
    this.log("Sending elicitation request to client", params);

    const startTime = Date.now();
    const timeoutMs = params.timeoutMs || this.config.defaultTimeoutMs;

    try {
      // Use the server's request method to send elicitation to client
      const response = (await this.server.request(
        {
          method: "elicitation/create",
          params: params,
        },
        ElicitResultSchema,
        {
          timeout: timeoutMs,
        }
      )) as {
        action: "accept" | "decline" | "cancel";
        content?: Record<string, unknown>;
      };

      const responseTimeMs = Date.now() - startTime;
      this.log("Elicitation response received:", response);

      // Log the confirmation
      await this.logConfirmation({
        timestamp: new Date().toISOString(),
        confirmationType: this.getConfirmationType(params),
        request: params,
        response,
        responseTimeMs,
        success: true,
      });

      return response;
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      this.log("Elicitation request failed:", error);

      // Log the failed confirmation
      await this.logConfirmation({
        timestamp: new Date().toISOString(),
        confirmationType: this.getConfirmationType(params),
        request: params,
        response: { action: "cancel" },
        responseTimeMs,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new Error(
        `Elicitation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private getConfirmationType(params: ElicitationParams): string {
    // Try to infer confirmation type from message content
    const message = params.message.toLowerCase();
    if (message.includes("confirm") || message.includes("確認")) {
      return "confirmation";
    } else if (message.includes("rate") || message.includes("評価")) {
      return "rating";
    } else if (message.includes("clarify") || message.includes("明確")) {
      return "clarification";
    } else if (message.includes("verify") || message.includes("検証")) {
      return "verification";
    } else if (message.includes("yes/no") || message.includes("はい/いいえ")) {
      return "yes_no";
    } else {
      return "custom";
    }
  }

  private determineTimeoutForAction(impact?: string): number {
    if (!impact) return this.config.defaultTimeoutMs;

    const impactLower = impact.toLowerCase();
    if (
      impactLower.includes("delete") ||
      impactLower.includes("remove") ||
      impactLower.includes("削除") ||
      impactLower.includes("破壊")
    ) {
      return 120000; // 2 minutes for critical actions
    } else if (impactLower.includes("warning")) {
      return 90000; // 1.5 minutes for warning actions
    }

    return this.config.defaultTimeoutMs;
  }

  private async handleConfirmAction(args: Record<string, unknown>) {
    const action =
      typeof args.action === "string" ? args.action : "Unknown action";
    const impact = typeof args.impact === "string" ? args.impact : undefined;
    const details = typeof args.details === "string" ? args.details : undefined;

    let message = `Please confirm this action:\n\n**Action**: ${action}`;
    if (impact) {
      message += `\n\n**Impact**: ${impact}`;
    }
    if (details) {
      message += `\n\n**Details**: ${details}`;
    }
    message += `\n\nDo you want to proceed?`;

    const elicitationParams: ElicitationParams = {
      message,
      requestedSchema: {
        type: "object",
        properties: {
          confirmed: {
            type: "boolean",
            title: "Confirm Action",
            description: "Do you want to proceed with this action?",
          },
          note: {
            type: "string",
            title: "Additional Note",
            description: "Any additional instructions or concerns?",
          },
        },
        required: ["confirmed"],
      },
      timeoutMs: this.determineTimeoutForAction(impact),
    };

    try {
      const response = await this.sendElicitationRequest(elicitationParams);

      if (response.action === "accept" && response.content) {
        const confirmed = response.content.confirmed as boolean;
        const note = response.content.note as string | undefined;
        return {
          content: [
            {
              type: "text",
              text: `User ${confirmed ? "confirmed" : "declined"} the action.${note ? `\nNote: ${note}` : ""}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `User ${response.action}ed the confirmation request.`,
            },
          ],
        };
      }
    } catch (error) {
      return this.createErrorResponse(
        `Confirmation request failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleClarifyIntent(args: Record<string, unknown>) {
    const request_summary =
      typeof args.request_summary === "string"
        ? args.request_summary
        : "Unknown request";
    const ambiguity =
      typeof args.ambiguity === "string" ? args.ambiguity : "Unknown ambiguity";
    const options = Array.isArray(args.options) ? args.options : undefined;

    let message = `I need to clarify your intent:\n\n**My understanding**: ${request_summary}\n\n**What's unclear**: ${ambiguity}`;

    const schema: ElicitationSchema = {
      type: "object",
      properties: {},
      required: ["clarification"],
    };

    // Add selected_option FIRST if options exist (for better UX - selection before free text)
    if (options && options.length > 0) {
      message += `\n\n**Options**:\n${options.map((opt: unknown, i: number) => `${i + 1}. ${String(opt)}`).join("\n")}`;
      schema.properties.selected_option = {
        type: "string",
        title: "Select Option",
        description: "Which option best matches your intent?",
        enum: options.map((opt) => String(opt)),
      };
    }

    // Add clarification field AFTER options (better UX - free text input comes after selection)
    schema.properties.clarification = {
      type: "string",
      title: "Additional clarification",
      description: "Please provide any additional details or explanation",
    };

    const elicitationParams: ElicitationParams = {
      message,
      requestedSchema: schema,
    };

    try {
      const response = await this.sendElicitationRequest(elicitationParams);

      if (response.action === "accept") {
        return {
          content: [
            {
              type: "text",
              text: `User clarification:\n${JSON.stringify(response.content, null, 2)}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `User ${response.action}ed the clarification request.`,
            },
          ],
        };
      }
    } catch (error) {
      return this.createErrorResponse(
        `Clarification request failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleVerifyUnderstanding(args: Record<string, unknown>) {
    const understanding =
      typeof args.understanding === "string"
        ? args.understanding
        : "Unknown understanding";
    const key_points = Array.isArray(args.key_points)
      ? args.key_points
      : undefined;
    const next_steps =
      typeof args.next_steps === "string" ? args.next_steps : undefined;

    let message = `Please verify my understanding:\n\n**What I understood**: ${understanding}`;

    if (key_points && key_points.length > 0) {
      message += `\n\n**Key points to confirm**:\n${key_points.map((point: unknown, i: number) => `${i + 1}. ${String(point)}`).join("\n")}`;
    }

    if (next_steps) {
      message += `\n\n**What I plan to do next**: ${next_steps}`;
    }

    const elicitationParams: ElicitationParams = {
      message,
      requestedSchema: {
        type: "object",
        properties: {
          understanding_correct: {
            type: "boolean",
            title: "Understanding Correct",
            description: "Is my understanding correct?",
          },
          corrections: {
            type: "string",
            title: "Corrections",
            description: "What should I correct or clarify?",
          },
          proceed: {
            type: "boolean",
            title: "Proceed",
            description: "Should I proceed with the planned next steps?",
          },
        },
        required: ["understanding_correct"],
      },
    };

    try {
      const response = await this.sendElicitationRequest(elicitationParams);

      if (response.action === "accept") {
        return {
          content: [
            {
              type: "text",
              text: `Understanding verification result:\n${JSON.stringify(response.content, null, 2)}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `User ${response.action}ed the understanding verification.`,
            },
          ],
        };
      }
    } catch (error) {
      return this.createErrorResponse(
        `Understanding verification failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleElicitCustom(args: Record<string, unknown>) {
    const message =
      typeof args.message === "string" ? args.message : "Please provide input";
    const schema =
      typeof args.schema === "object" && args.schema !== null
        ? (args.schema as ElicitationSchema)
        : {
            type: "object" as const,
            properties: {},
          };

    const elicitationParams: ElicitationParams = {
      message,
      requestedSchema: schema,
    };

    try {
      const response = await this.sendElicitationRequest(elicitationParams);

      if (response.action === "accept") {
        return {
          content: [
            {
              type: "text",
              text: `Custom elicitation completed:\n${JSON.stringify(response.content, null, 2)}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `User ${response.action}ed the custom elicitation.`,
            },
          ],
        };
      }
    } catch (error) {
      return this.createErrorResponse(
        `Custom elicitation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleAskYesNo(args: Record<string, unknown>) {
    const question =
      typeof args.question === "string"
        ? args.question
        : "Please answer yes or no";

    const elicitationParams: ElicitationParams = {
      message: question,
      requestedSchema: {
        type: "object",
        properties: {
          answer: {
            type: "boolean",
            title: "Your Answer",
            description: "Please select yes or no",
          },
        },
        required: ["answer"],
      },
      timeoutMs: 30000, // Short timeout for simple yes/no questions
    };

    try {
      const response = await this.sendElicitationRequest(elicitationParams);

      if (response.action === "accept" && response.content) {
        return {
          content: [
            {
              type: "text",
              text: `User answered: ${response.content.answer ? "Yes" : "No"}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `User ${response.action}ed the question.`,
            },
          ],
        };
      }
    } catch (error) {
      return this.createErrorResponse(
        `Elicitation request failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleCollectRating(args: Record<string, unknown>) {
    const subject =
      typeof args.subject === "string" ? args.subject : "this item";
    const description =
      typeof args.description === "string" ? args.description : undefined;

    const elicitationParams: ElicitationParams = {
      message: `Please rate ${subject}`,
      requestedSchema: {
        type: "object",
        properties: {
          rating: {
            type: "number",
            title: "Rating",
            description: description || `Rate ${subject} from 1 to 10`,
            minimum: 1,
            maximum: 10,
          },
          comment: {
            type: "string",
            title: "Comment",
            description: "Optional comment about your rating",
          },
        },
        required: ["rating"],
      },
      timeoutMs: 20000, // Short timeout for ratings (reference only)
    };

    try {
      const response = await this.sendElicitationRequest(elicitationParams);

      if (response.action === "accept" && response.content) {
        const rating = response.content.rating as number;
        const comment = response.content.comment as string | undefined;
        return {
          content: [
            {
              type: "text",
              text: `User rating for ${subject}: ${rating}/10${comment ? `\nComment: ${comment}` : ""}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `User ${response.action}ed the rating request.`,
            },
          ],
        };
      }
    } catch (error) {
      return this.createErrorResponse(
        `Rating collection failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async readLogEntries(): Promise<ConfirmationLogEntry[]> {
    try {
      const logContent = await fs.promises.readFile(
        this.config.confirmationHistoryPath,
        "utf8"
      );
      const lines = logContent
        .trim()
        .split("\n")
        .filter((line) => line.trim());
      return lines.map((line) => JSON.parse(line) as ConfirmationLogEntry);
    } catch (error) {
      if ((error as { code?: string }).code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  private filterLogEntries(
    entries: ConfirmationLogEntry[],
    params: LogSearchParams
  ): ConfirmationLogEntry[] {
    return entries.filter((entry) => {
      return (
        this.matchesKeyword(entry, params.keyword) &&
        this.matchesType(entry, params.confirmationType) &&
        this.matchesDateRange(entry, params.startDate, params.endDate) &&
        this.matchesSuccess(entry, params.success) &&
        this.matchesTimeout(entry, params.timedOut) &&
        this.matchesResponseTime(
          entry,
          params.minResponseTime,
          params.maxResponseTime
        )
      );
    });
  }

  private matchesKeyword(
    entry: ConfirmationLogEntry,
    keyword?: string
  ): boolean {
    if (!keyword) return true;
    const searchText = (
      entry.request.message +
      " " +
      JSON.stringify(entry.response)
    ).toLowerCase();
    return searchText.includes(keyword.toLowerCase());
  }

  private matchesType(entry: ConfirmationLogEntry, type?: string): boolean {
    return !type || entry.confirmationType === type;
  }

  private matchesDateRange(
    entry: ConfirmationLogEntry,
    startDate?: string,
    endDate?: string
  ): boolean {
    const entryDate = new Date(entry.timestamp);
    if (startDate && entryDate < new Date(startDate)) return false;
    if (endDate && entryDate > new Date(endDate)) return false;
    return true;
  }

  private matchesSuccess(
    entry: ConfirmationLogEntry,
    success?: boolean
  ): boolean {
    return success === undefined || entry.success === success;
  }

  private matchesTimeout(
    entry: ConfirmationLogEntry,
    timedOut?: boolean
  ): boolean {
    if (timedOut === undefined) return true;
    const isTimedOut = entry.error?.includes("timed out") || false;
    return isTimedOut === timedOut;
  }

  private matchesResponseTime(
    entry: ConfirmationLogEntry,
    minTime?: number,
    maxTime?: number
  ): boolean {
    if (minTime !== undefined && entry.responseTimeMs < minTime) return false;
    if (maxTime !== undefined && entry.responseTimeMs > maxTime) return false;
    return true;
  }

  private async searchLogs(params: LogSearchParams): Promise<LogSearchResult> {
    const entries = await this.readLogEntries();

    // Apply filters
    const filteredEntries = this.filterLogEntries(entries, params);

    // Sort by timestamp (newest first)
    filteredEntries.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Pagination
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const totalCount = filteredEntries.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedEntries = filteredEntries.slice(startIndex, endIndex);

    return {
      entries: paginatedEntries,
      totalCount,
      currentPage: page,
      totalPages,
      pageSize,
    };
  }

  private async handleSearchLogs(args: Record<string, unknown>) {
    try {
      const searchParams: LogSearchParams = {
        keyword: typeof args.keyword === "string" ? args.keyword : undefined,
        confirmationType:
          typeof args.confirmationType === "string"
            ? args.confirmationType
            : undefined,
        startDate:
          typeof args.startDate === "string" ? args.startDate : undefined,
        endDate: typeof args.endDate === "string" ? args.endDate : undefined,
        success: typeof args.success === "boolean" ? args.success : undefined,
        timedOut:
          typeof args.timedOut === "boolean" ? args.timedOut : undefined,
        minResponseTime:
          typeof args.minResponseTime === "number"
            ? args.minResponseTime
            : undefined,
        maxResponseTime:
          typeof args.maxResponseTime === "number"
            ? args.maxResponseTime
            : undefined,
        page: typeof args.page === "number" ? args.page : 1,
        pageSize:
          typeof args.pageSize === "number" ? Math.min(args.pageSize, 100) : 10,
      };

      const result = await this.searchLogs(searchParams);

      const formatEntry = (entry: ConfirmationLogEntry, index: number) => {
        const timestamp = new Date(entry.timestamp).toLocaleString();
        const responseTime = `${entry.responseTimeMs}ms`;
        const status = entry.success ? "✅ Success" : "❌ Failed";
        const action = entry.response.action;

        return `**${index + 1}.** ${timestamp} [${entry.confirmationType}]
${status} - ${action} (${responseTime})
Message: ${entry.request.message.substring(0, 100)}${entry.request.message.length > 100 ? "..." : ""}
${entry.error ? `Error: ${entry.error}` : ""}`;
      };

      const entriesText = result.entries
        .map((entry, index) =>
          formatEntry(entry, (result.currentPage - 1) * result.pageSize + index)
        )
        .join("\n\n");

      const paginationInfo = `\n\n📊 **Search Results**
Total: ${result.totalCount} entries
Page: ${result.currentPage}/${result.totalPages}
Showing: ${result.entries.length} entries`;

      return {
        content: [
          {
            type: "text",
            text: `🔍 **Confirmation Log Search Results**\n\n${entriesText}${paginationInfo}`,
          },
        ],
      };
    } catch (error) {
      return this.createErrorResponse(
        `Log search failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleAnalyzeLogs(args: Record<string, unknown>) {
    try {
      const startDate =
        typeof args.startDate === "string" ? args.startDate : undefined;
      const endDate =
        typeof args.endDate === "string" ? args.endDate : undefined;
      const groupBy =
        typeof args.groupBy === "string" ? args.groupBy : "confirmationType";

      const entries = await this.readLogEntries();
      const filteredEntries = this.filterByDateRange(
        entries,
        startDate,
        endDate
      );

      const stats = this.calculateBasicStats(filteredEntries);
      const groupedData = this.groupLogsByField(filteredEntries, groupBy);
      const groupAnalysis = this.formatGroupAnalysis(groupedData);

      const analysisText = this.formatAnalysisResult(
        stats,
        groupAnalysis,
        groupBy,
        startDate,
        endDate
      );

      return {
        content: [
          {
            type: "text",
            text: analysisText,
          },
        ],
      };
    } catch (error) {
      return this.createErrorResponse(
        `Log analysis failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private filterByDateRange(
    entries: ConfirmationLogEntry[],
    startDate?: string,
    endDate?: string
  ): ConfirmationLogEntry[] {
    let filtered = entries;
    if (startDate) {
      filtered = filtered.filter(
        (entry) => new Date(entry.timestamp) >= new Date(startDate)
      );
    }
    if (endDate) {
      filtered = filtered.filter(
        (entry) => new Date(entry.timestamp) <= new Date(endDate)
      );
    }
    return filtered;
  }

  private calculateBasicStats(entries: ConfirmationLogEntry[]) {
    const totalEntries = entries.length;
    const successfulEntries = entries.filter((e) => e.success).length;
    const failedEntries = totalEntries - successfulEntries;
    const timedOutEntries = entries.filter((e) =>
      e.error?.includes("timed out")
    ).length;

    const avgResponseTime =
      totalEntries > 0
        ? entries.reduce((sum, e) => sum + e.responseTimeMs, 0) / totalEntries
        : 0;

    const maxResponseTime =
      totalEntries > 0 ? Math.max(...entries.map((e) => e.responseTimeMs)) : 0;

    const minResponseTime =
      totalEntries > 0 ? Math.min(...entries.map((e) => e.responseTimeMs)) : 0;

    return {
      totalEntries,
      successfulEntries,
      failedEntries,
      timedOutEntries,
      avgResponseTime,
      maxResponseTime,
      minResponseTime,
    };
  }

  private formatGroupAnalysis(
    groupedData: Record<string, ConfirmationLogEntry[]>
  ): string {
    return Object.entries(groupedData)
      .map(([key, entries]) => {
        const count = entries.length;
        const successRate =
          (entries.filter((e) => e.success).length / count) * 100;
        const avgTime =
          entries.reduce((sum, e) => sum + e.responseTimeMs, 0) / count;
        return `**${key}**: ${count} entries (${successRate.toFixed(1)}% success, avg: ${avgTime.toFixed(0)}ms)`;
      })
      .join("\n");
  }

  private formatAnalysisResult(
    stats: ReturnType<typeof this.calculateBasicStats>,
    groupAnalysis: string,
    groupBy: string,
    startDate?: string,
    endDate?: string
  ): string {
    return `📊 **Confirmation Log Analysis**

**Period**: ${startDate || "All time"} to ${endDate || "Present"}

**Overall Statistics**:
- Total confirmations: ${stats.totalEntries}
- Successful: ${stats.successfulEntries} (${stats.totalEntries > 0 ? ((stats.successfulEntries / stats.totalEntries) * 100).toFixed(1) : 0}%)
- Failed: ${stats.failedEntries} (${stats.totalEntries > 0 ? ((stats.failedEntries / stats.totalEntries) * 100).toFixed(1) : 0}%)
- Timed out: ${stats.timedOutEntries} (${stats.totalEntries > 0 ? ((stats.timedOutEntries / stats.totalEntries) * 100).toFixed(1) : 0}%)

**Response Times**:
- Average: ${stats.avgResponseTime.toFixed(0)}ms
- Minimum: ${stats.minResponseTime}ms
- Maximum: ${stats.maxResponseTime}ms

**Breakdown by ${groupBy}**:
${groupAnalysis}`;
  }

  private groupLogsByField(
    entries: ConfirmationLogEntry[],
    field: string
  ): Record<string, ConfirmationLogEntry[]> {
    const groups: Record<string, ConfirmationLogEntry[]> = {};

    entries.forEach((entry) => {
      let key: string;

      switch (field) {
        case "confirmationType":
          key = entry.confirmationType;
          break;
        case "success":
          key = entry.success ? "Success" : "Failed";
          break;
        case "hour":
          key =
            new Date(entry.timestamp).getHours().toString().padStart(2, "0") +
            ":00";
          break;
        case "day":
          key = new Date(entry.timestamp).toISOString().split("T")[0];
          break;
        default:
          key = "Unknown";
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(entry);
    });

    return groups;
  }

  async run() {
    this.log("Starting MCP server...");
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.log("MCP server connected and ready");
  }
}

const server = new ConfirmationMCPServer();
server.run().catch((error: unknown) => {
  console.error("Server error:", error);
  process.exit(1);
});
