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

interface ElicitationSchema {
  type: "object";
  properties: Record<string, any>;
  required?: string[];
}

interface ElicitationParams {
  message: string;
  requestedSchema: ElicitationSchema;
  [key: string]: unknown;
}

class ConfirmationMCPServer {
  private server: Server;
  private isDebug: boolean;

  constructor() {
    this.isDebug = process.env.NODE_ENV === "development";

    this.server = new Server(
      {
        name: "mcp-confirm",
        version: "1.0.0",
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

  private log(message: string, ...args: any[]) {
    if (this.isDebug) {
      console.error(
        `[DEBUG] ${new Date().toISOString()} - ${message}`,
        ...args
      );
    }
  }

  private setupHandlers() {
    this.log("Setting up MCP handlers");

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

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "ask_yes_no",
            description:
              "Ask a yes/no confirmation question to the user when the AI needs clarification or verification",
            inputSchema: {
              type: "object",
              properties: {
                question: {
                  type: "string",
                  description:
                    "The yes/no confirmation question to ask the user",
                },
              },
              required: ["question"],
            },
          },
          {
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
                  description:
                    "Potential impact or consequences of this action",
                },
                details: {
                  type: "string",
                  description: "Additional details about what will happen",
                },
              },
              required: ["action"],
            },
          },
          {
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
          },
          {
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
          },
          {
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
          },
          {
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
          },
        ] satisfies Tool[],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request: CallToolRequest) => {
        const { name, arguments: args } = request.params;

        try {
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
            default:
              throw new Error(`Unknown tool: ${name}`);
          }
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

  private generateMockContent(schema: ElicitationSchema): Record<string, any> {
    const content: Record<string, any> = {};

    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const prop = propSchema as any;

      switch (prop.type) {
        case "string":
          if (prop.enum) {
            content[key] = prop.enum[0];
          } else if (prop.format === "email") {
            content[key] = "user@example.com";
          } else if (prop.format === "date") {
            content[key] = "2025-08-04";
          } else {
            content[key] = `Mock ${prop.title || key}`;
          }
          break;
        case "number":
        case "integer":
          content[key] = prop.minimum || 1;
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

  private async sendElicitationRequest(
    params: ElicitationParams
  ): Promise<any> {
    this.log("Sending elicitation request to client", params);

    try {
      // Use the server's request method to send elicitation to client
      const response = await this.server.request(
        {
          method: "elicitation/create",
          params: params as any,
        },
        ElicitResultSchema
      );

      this.log("Elicitation response received:", response);
      return response;
    } catch (error) {
      this.log("Elicitation request failed:", error);
      throw new Error(
        `Elicitation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleConfirmAction(args: any) {
    const { action, impact, details } = args;

    let message = `Please confirm this action:\n\n**Action**: ${action}`;
    if (impact) {
      message += `\n**Impact**: ${impact}`;
    }
    if (details) {
      message += `\n**Details**: ${details}`;
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
    };

    try {
      const response = await this.sendElicitationRequest(elicitationParams);

      if (response.action === "accept") {
        const confirmed = response.content.confirmed;
        const note = response.content.note;
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

  private async handleClarifyIntent(args: any) {
    const { request_summary, ambiguity, options } = args;

    let message = `I need to clarify your intent:\n\n**My understanding**: ${request_summary}\n\n**What's unclear**: ${ambiguity}`;

    const schema: ElicitationSchema = {
      type: "object",
      properties: {
        clarification: {
          type: "string",
          title: "Please clarify",
          description: "Please explain what you actually want",
        },
      },
      required: ["clarification"],
    };

    if (options && options.length > 0) {
      message += `\n\n**Options**:\n${options.map((opt: string, i: number) => `${i + 1}. ${opt}`).join("\n")}`;
      schema.properties.selected_option = {
        type: "string",
        title: "Select Option",
        description: "Which option best matches your intent?",
        enum: options,
      };
    }

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

  private async handleVerifyUnderstanding(args: any) {
    const { understanding, key_points, next_steps } = args;

    let message = `Please verify my understanding:\n\n**What I understood**: ${understanding}`;

    if (key_points && key_points.length > 0) {
      message += `\n\n**Key points to confirm**:\n${key_points.map((point: string, i: number) => `${i + 1}. ${point}`).join("\n")}`;
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

  private async handleElicitCustom(args: any) {
    const { message, schema } = args;

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

  private async handleAskYesNo(args: any) {
    const { question } = args;

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
    };

    try {
      const response = await this.sendElicitationRequest(elicitationParams);

      if (response.action === "accept") {
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

  private async handleCollectRating(args: any) {
    const { subject, description } = args;

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
    };

    try {
      const response = await this.sendElicitationRequest(elicitationParams);

      if (response.action === "accept") {
        return {
          content: [
            {
              type: "text",
              text: `User rating for ${subject}: ${response.content.rating}/10${response.content.comment ? `\nComment: ${response.content.comment}` : ""}`,
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

  async run() {
    this.log("Starting MCP server...");
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.log("MCP server connected and ready");
  }
}

const server = new ConfirmationMCPServer();
server.run().catch((error: any) => {
  console.error("Server error:", error);
  process.exit(1);
});
