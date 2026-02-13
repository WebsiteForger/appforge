import { streamChatCompletion, type LLMMessage, type LLMToolCall } from '../llm/client';
import { getLLMConfig, isConfigured } from '../llm/config';
import { TOOL_DEFINITIONS, TOOL_EXECUTORS } from './tools';
import { formatErrorReport } from './errors';
import { PLAN_SYSTEM_PROMPT, BUILD_SYSTEM_PROMPT, TEST_SYSTEM_PROMPT } from './prompts';
import { parseXMLToolCalls, buildXMLToolInstructions } from './parser';
import { trimConversation } from './context';
import { useAgentStore, type AgentPhase } from '../store/agent';
import { useChatStore } from '../store/chat';

const MAX_ITERATIONS = 200;
const MAX_CONSECUTIVE_ERRORS = 5;
const CONTEXT_TOKEN_BUDGET = 100000;

// Internal conversation state (full history including tool results)
let conversation: LLMMessage[] = [];

// Guard against concurrent agent loops
let activeLoopId = 0;

export function getConversation(): LLMMessage[] {
  return conversation;
}

export function clearConversation() {
  conversation = [];
}

/**
 * Stop any running agent and fully reset state for a new project.
 * Call this BEFORE starting a new agent loop on project switch.
 */
export function resetAgentForNewProject() {
  // Abort any running agent
  const agentStore = useAgentStore.getState();
  agentStore.stop();
  agentStore.reset();
  // Clear conversation history
  conversation = [];
  // Invalidate any running loop
  activeLoopId++;
}

/**
 * Main entry point — run the agent loop for a user message.
 */
export async function runAgentLoop(userMessage: string) {
  const agentStore = useAgentStore.getState();
  const chatStore = useChatStore.getState();

  if (!isConfigured()) {
    chatStore.addMessage({
      role: 'system',
      content: 'Please configure your LLM API key in Settings before using the AI assistant.',
    });
    return;
  }

  // Stop any previously running loop
  if (agentStore.isRunning) {
    agentStore.stop();
  }

  // Add user message
  if (userMessage.trim()) {
    conversation.push({ role: 'user', content: userMessage });
    chatStore.addMessage({ role: 'user', content: userMessage });
  }

  // Each loop gets a unique ID; if another loop starts, this one exits
  const myLoopId = ++activeLoopId;
  const abortController = new AbortController();
  agentStore.setAbortController(abortController);
  agentStore.setRunning(true);
  agentStore.resetIterations();

  const mode = useAgentStore.getState().mode;

  try {
    switch (mode) {
      case 'plan': {
        // Plan only — stop at approval
        agentStore.setPhase('planning');
        await runLoop({
          systemPrompt: PLAN_SYSTEM_PROMPT,
          signal: abortController.signal,
        });
        if (!abortController.signal.aborted) {
          agentStore.setPhase('awaiting_approval');
        }
        break;
      }

      case 'build': {
        // Build directly — no planning, no testing
        agentStore.setPhase('building');
        await runLoop({
          systemPrompt: BUILD_SYSTEM_PROMPT,
          signal: abortController.signal,
        });
        if (!abortController.signal.aborted) {
          agentStore.setPhase('done');
        }
        break;
      }

      case 'test': {
        // Test only — run QA on existing app
        agentStore.setPhase('testing');
        await runLoop({
          systemPrompt: TEST_SYSTEM_PROMPT,
          signal: abortController.signal,
        });
        if (!abortController.signal.aborted) {
          agentStore.setPhase('done');
        }
        break;
      }

      case 'auto': {
        // Full pipeline: Plan → approve → Build → (optionally test)
        const currentPhase = agentStore.phase;

        if (currentPhase === 'idle') {
          // Start with planning
          agentStore.setPhase('planning');
          await runLoop({
            systemPrompt: PLAN_SYSTEM_PROMPT,
            signal: abortController.signal,
          });
          if (abortController.signal.aborted) break;

          // Auto-approve the plan and continue to build
          conversation.push({
            role: 'user',
            content: 'The plan looks great. Go ahead and build it.',
          });
          chatStore.addMessage({
            role: 'user',
            content: 'Plan auto-approved. Building...',
          });
        }

        // Build phase
        agentStore.setPhase('building');
        await runLoop({
          systemPrompt: BUILD_SYSTEM_PROMPT,
          signal: abortController.signal,
        });
        if (abortController.signal.aborted) break;

        // After build: check auto-test setting
        const { autoTest } = useAgentStore.getState();
        if (autoTest) {
          // Automatically start testing
          agentStore.setPhase('testing');
          conversation.push({
            role: 'user',
            content: 'Build complete. Now run QA tests on the application.',
          });
          await runLoop({
            systemPrompt: TEST_SYSTEM_PROMPT,
            signal: abortController.signal,
          });
          if (!abortController.signal.aborted) {
            agentStore.setPhase('done');
          }
        } else {
          // Pause for test approval
          agentStore.setPhase('awaiting_test_approval');
        }
        break;
      }
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      agentStore.setPhase('idle');
    } else {
      const errorMsg = err instanceof Error ? err.message : String(err);
      agentStore.setError(errorMsg);
      chatStore.addMessage({
        role: 'system',
        content: `Error: ${errorMsg}`,
      });
    }
  } finally {
    agentStore.setRunning(false);
    agentStore.setCurrentTool(null);
    agentStore.setAbortController(null);
  }
}

/**
 * Called when user approves the plan — continues to build phase.
 */
export async function onPlanApproved() {
  conversation.push({
    role: 'user',
    content: 'The plan looks great. Go ahead and build it.',
  });
  useChatStore.getState().addMessage({
    role: 'user',
    content: 'The plan looks great. Go ahead and build it.',
  });
  const agentStore = useAgentStore.getState();
  agentStore.setPhase('building');
  agentStore.setMode('build');
  await runAgentLoop('');
}

/**
 * Called when user requests changes to the plan.
 */
export async function onPlanChangeRequested(feedback: string) {
  useAgentStore.getState().setPhase('planning');
  await runAgentLoop(feedback);
}

/**
 * Called when user approves test phase after build.
 */
export async function onTestApproved() {
  conversation.push({
    role: 'user',
    content: 'Build complete. Now run QA tests on the application.',
  });
  useChatStore.getState().addMessage({
    role: 'user',
    content: 'Running tests...',
  });
  const agentStore = useAgentStore.getState();
  agentStore.setMode('test');
  await runAgentLoop('');
}

/**
 * Called when user skips the test phase.
 */
export function onTestSkipped() {
  useAgentStore.getState().setPhase('done');
}

/**
 * The core tool-use loop. Same logic for planning, building, and testing.
 */
async function runLoop({
  systemPrompt,
  signal,
}: {
  systemPrompt: string;
  signal: AbortSignal;
}) {
  const agentStore = useAgentStore.getState();
  const chatStore = useChatStore.getState();
  const config = getLLMConfig();

  let iterations = 0;
  let consecutiveErrors = 0;
  let nudgesUsed = 0;
  const MAX_NUDGES = 10;
  let hasWrittenFiles = false;
  let taskCompleted = false;
  let hadMalformedToolCall = false;
  let consecutiveSearches = 0;

  // Capture the loop ID so we can detect if we've been superseded
  const myId = activeLoopId;

  while (iterations < MAX_ITERATIONS) {
    if (signal.aborted) break;
    // Another loop started — bail out
    if (activeLoopId !== myId) break;

    iterations++;
    agentStore.incrementIteration();

    // Build messages for the LLM
    const systemMsg: LLMMessage = { role: 'system', content: systemPrompt };

    // Add XML tool instructions if model doesn't support native tool use
    if (!config.supportsToolUse) {
      const xmlInstructions = buildXMLToolInstructions(
        TOOL_DEFINITIONS.map((t) => ({
          name: t.function.name,
          description: t.function.description,
          parameters: t.function.parameters,
        })),
      );
      systemMsg.content += '\n\n' + xmlInstructions;
    }

    const trimmedConversation = trimConversation(
      [systemMsg, ...conversation],
      CONTEXT_TOKEN_BUDGET,
    );

    // ── Call the LLM (streaming) ──
    let fullText = '';
    const toolCalls: LLMToolCall[] = [];

    const msgId = chatStore.addMessage({
      role: 'assistant',
      content: '',
      isStreaming: true,
    });

    try {
      const stream = streamChatCompletion(
        config,
        trimmedConversation,
        config.supportsToolUse ? TOOL_DEFINITIONS : undefined,
        signal,
      );

      for await (const chunk of stream) {
        if (signal.aborted) break;

        switch (chunk.type) {
          case 'text':
            fullText += chunk.text ?? '';
            chatStore.appendToMessage(msgId, chunk.text ?? '');
            break;

          case 'tool_call_end':
            if (chunk.toolCall) {
              // Validate that tool call arguments are valid JSON before accepting
              let parsedArgs: Record<string, unknown> = {};
              try {
                parsedArgs = JSON.parse(chunk.toolCall.function!.arguments || '{}');
              } catch {
                // Malformed tool call — flag it so we auto-retry
                hadMalformedToolCall = true;
                break;
              }
              toolCalls.push(chunk.toolCall as LLMToolCall);
              chatStore.addToolCallToMessage(msgId, {
                id: chunk.toolCall.id!,
                name: chunk.toolCall.function!.name,
                arguments: parsedArgs,
                isRunning: true,
              });
            }
            break;

          case 'error':
            throw new Error(chunk.error);
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') break;

      consecutiveErrors++;
      chatStore.updateMessage(msgId, { isStreaming: false });

      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        chatStore.addMessage({
          role: 'system',
          content: "I'm hitting repeated errors calling the LLM. Please check your API key and model settings.",
        });
        break;
      }

      // Auto-retry with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, consecutiveErrors - 1), 8000);
      const errDetail = err instanceof Error ? err.message : String(err);
      chatStore.addMessage({
        role: 'system',
        content: `LLM error: ${errDetail}. Retrying in ${delay / 1000}s...`,
      });
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    // ── Parse XML tool calls if needed ──
    if (!config.supportsToolUse && fullText) {
      const parsed = parseXMLToolCalls(fullText);
      if (parsed.toolCalls.length > 0) {
        fullText = parsed.text;
        chatStore.updateMessage(msgId, { content: parsed.text });
        for (const tc of parsed.toolCalls) {
          toolCalls.push({
            id: tc.id,
            type: 'function',
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments),
            },
          });
          chatStore.addToolCallToMessage(msgId, {
            id: tc.id,
            name: tc.name,
            arguments: tc.arguments,
            isRunning: true,
          });
        }
      }
    }

    chatStore.updateMessage(msgId, { isStreaming: false });

    // ── Malformed tool call = retry silently ──
    if (hadMalformedToolCall && toolCalls.length === 0) {
      hadMalformedToolCall = false;
      // Add the text to conversation, then nudge to retry
      if (fullText) {
        conversation.push({ role: 'assistant', content: fullText });
      }
      conversation.push({
        role: 'user',
        content: 'Your last tool call had malformed JSON arguments. Please try again — make sure write_file content is properly escaped JSON.',
      });
      chatStore.updateMessage(msgId, { isStreaming: false });
      continue;
    }

    // ── No tool calls = agent wants to stop ──
    if (toolCalls.length === 0) {
      conversation.push({ role: 'assistant', content: fullText });

      const currentPhase = useAgentStore.getState().phase;

      // Planning nudge: if the AI stopped without writing schema/PLAN.md, push it
      if (currentPhase === 'planning' && !hasWrittenFiles && nudgesUsed < MAX_NUDGES) {
        nudgesUsed++;
        conversation.push({
          role: 'user',
          content: 'You haven\'t written any files yet. Continue planning — write the database schema to db/schema.ts, types to src/lib/types.ts, and the full plan to PLAN.md. Then present the plan summary.',
        });
        continue;
      }

      // In build/test mode, only stop if task_complete was called.
      // Otherwise nudge the AI to keep going.
      const isBuildOrTest = currentPhase === 'building' || currentPhase === 'testing';
      if (isBuildOrTest && !taskCompleted && nudgesUsed < MAX_NUDGES) {
        nudgesUsed++;
        // Check for current errors and include them in the nudge
        const errorReport = formatErrorReport();
        const hasErrors = !errorReport.includes('No errors detected');
        let nudge: string;
        if (!hasWrittenFiles && currentPhase === 'building') {
          nudge = 'Continue. Start writing the code files now using write_file. Build the complete application step by step. Remember: write ALL page files BEFORE App.tsx. When fully done, call task_complete.';
        } else if (hasErrors) {
          nudge = `There are errors in the app that need fixing:\n\n${errorReport}\n\nIMPORTANT: Do NOT search for patterns. Instead:\n1. If the error says "Failed to resolve import" → the file doesn't exist yet, CREATE it with write_file\n2. If the error points to a specific file → use read_file on that file, then write_file to fix it\n3. After fixing, call check_errors() to verify`;
        } else {
          nudge = 'You haven\'t called task_complete yet. If the app is fully working, call task_complete with a summary. Otherwise keep building — write more files, fix errors, take a screenshot() to verify the UI, and then call task_complete when done.';
        }
        conversation.push({ role: 'user', content: nudge });
        continue;
      }

      break;
    }

    // If task_complete was called, stop after this iteration
    if (taskCompleted) {
      break;
    }

    // ── Execute tool calls ──
    conversation.push({
      role: 'assistant',
      content: fullText || '',
      tool_calls: toolCalls,
    });

    for (const tc of toolCalls) {
      if (signal.aborted) break;

      const toolName = tc.function.name;
      const executor = TOOL_EXECUTORS[toolName];

      if (toolName === 'write_file') hasWrittenFiles = true;
      if (toolName === 'task_complete') taskCompleted = true;

      agentStore.setCurrentTool(toolName);

      let args: Record<string, unknown>;
      try {
        args = JSON.parse(tc.function.arguments || '{}');
      } catch {
        args = {};
      }

      try {
        const result = await executor(args);
        consecutiveErrors = 0;

        let resultStr: string;
        if (typeof result === 'object' && result.type === 'image') {
          // For vision-capable models, include the image
          resultStr = '[Screenshot captured]';
          // Add image to conversation for vision models
          if (config.supportsVision) {
            conversation.push({
              role: 'tool',
              content: [
                { type: 'text', text: 'Screenshot of the current app:' },
                { type: 'image_url', image_url: { url: result.data } },
              ],
              tool_call_id: tc.id,
            });
          } else {
            conversation.push({
              role: 'tool',
              content: resultStr,
              tool_call_id: tc.id,
            });
          }
        } else {
          resultStr = result as string;
          conversation.push({
            role: 'tool',
            content: resultStr,
            tool_call_id: tc.id,
          });
        }

        chatStore.updateToolCall(msgId, tc.id, {
          result: typeof result === 'string' ? result.slice(0, 200) : '[Screenshot]',
          isRunning: false,
          isError: false,
        });
      } catch (err) {
        const errorMsg = `Error: ${err instanceof Error ? err.message : String(err)}`;
        consecutiveErrors++;

        conversation.push({
          role: 'tool',
          content: errorMsg,
          tool_call_id: tc.id,
        });

        chatStore.updateToolCall(msgId, tc.id, {
          result: errorMsg,
          isRunning: false,
          isError: true,
        });
      }
    }

    agentStore.setCurrentTool(null);

    // Reset nudge counter after successful tool calls — nudges only
    // count consecutive text-only responses, not total across the loop
    nudgesUsed = 0;

    // Detect degenerate search loops — if the AI calls only search_files
    // or read_file repeatedly without writing anything, inject a correction
    const allSearchOrRead = toolCalls.every(
      (tc) => tc.function.name === 'search_files' || tc.function.name === 'list_files',
    );
    if (allSearchOrRead && toolCalls.some((tc) => tc.function.name === 'search_files')) {
      consecutiveSearches++;
    } else {
      consecutiveSearches = 0;
    }

    if (consecutiveSearches >= 3) {
      consecutiveSearches = 0;
      conversation.push({
        role: 'user',
        content:
          'STOP SEARCHING. You have called search_files 3+ times in a row without making progress. ' +
          'Read the actual file that has the error (use read_file), understand the problem, and ' +
          'write the corrected file with write_file. Do not search again — act on what you know.',
      });
    }

    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      chatStore.addMessage({
        role: 'system',
        content: "I'm hitting repeated tool errors. Let me stop and explain what's going wrong.",
      });
      break;
    }
  }

  if (iterations >= MAX_ITERATIONS) {
    chatStore.addMessage({
      role: 'system',
      content: "I've been working for a while. Here's where things stand — you can continue the conversation to keep going.",
    });
  }
}
