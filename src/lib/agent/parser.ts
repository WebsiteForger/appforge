/**
 * XML fallback parser for models that don't support native function calling.
 * Parses tool calls from XML tags in the model's text output.
 *
 * Format:
 * <tool name="write_file">
 * {"path": "src/App.tsx", "content": "..."}
 * </tool>
 */

export interface ParsedToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ParseResult {
  text: string;
  toolCalls: ParsedToolCall[];
}

let toolCallCounter = 0;

export function parseXMLToolCalls(rawText: string): ParseResult {
  const toolCalls: ParsedToolCall[] = [];
  let cleanText = rawText;

  // Match <tool name="...">JSON</tool> blocks
  const toolRegex = /<tool\s+name="([^"]+)">\s*([\s\S]*?)\s*<\/tool>/g;
  let match;

  while ((match = toolRegex.exec(rawText)) !== null) {
    const name = match[1];
    const argsStr = match[2].trim();

    try {
      const args = JSON.parse(argsStr);
      toolCalls.push({
        id: `xml-tc-${++toolCallCounter}`,
        name,
        arguments: args,
      });
    } catch {
      // Try to extract arguments more leniently
      // Sometimes models output slightly malformed JSON
      try {
        // Handle cases where content has unescaped newlines
        const fixedArgs = argsStr
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        const args = JSON.parse(fixedArgs);
        toolCalls.push({
          id: `xml-tc-${++toolCallCounter}`,
          name,
          arguments: args,
        });
      } catch {
        // If we still can't parse, skip this tool call
        console.warn(`Failed to parse tool call arguments for ${name}:`, argsStr.slice(0, 100));
      }
    }

    // Remove the tool call from the text
    cleanText = cleanText.replace(match[0], '').trim();
  }

  return {
    text: cleanText,
    toolCalls,
  };
}

/**
 * Build the XML instruction section to add to system prompts
 * when the model doesn't support native function calling.
 */
export function buildXMLToolInstructions(tools: { name: string; description: string; parameters: Record<string, unknown> }[]): string {
  const toolDocs = tools
    .map(
      (t) =>
        `- ${t.name}: ${t.description}\n  Parameters: ${JSON.stringify(t.parameters)}`,
    )
    .join('\n\n');

  return `
IMPORTANT: You must use XML tags to call tools. Format:

<tool name="tool_name">
{"param1": "value1", "param2": "value2"}
</tool>

You can call multiple tools in one response. Always use valid JSON inside the tags.

Available tools:
${toolDocs}
`;
}
