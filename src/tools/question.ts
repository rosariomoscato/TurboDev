/**
 * Question tool — allows the AI agent to ask the user a question
 * and wait for their response.
 *
 * This is a placeholder implementation: the agent loop intercepts
 * question tool calls before they reach executeToolCall, routing
 * them through the onQuestion callback instead.
 */

export interface QuestionArgs {
  /** The question text to present to the user */
  question: string;
  /** Optional list of suggested answers the user can choose from */
  options?: string[];
}

export interface QuestionResult {
  /** The original question that was asked */
  question: string;
  /** The user's answer */
  answer: string;
}

/**
 * Placeholder tool function. In practice the loop intercepts
 * question tool calls and handles them via the onQuestion callback.
 */
export async function questionTool(args: QuestionArgs): Promise<QuestionResult> {
  return {
    question: args.question,
    answer: ''
  };
}
