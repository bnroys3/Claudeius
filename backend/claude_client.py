import json
import logging
from datetime import datetime, timezone
from typing import Any, Callable, Optional

import anthropic

logger = logging.getLogger("claudeius")
client = anthropic.Anthropic()
DEFAULT_MODEL = "claude-sonnet-4-20250514"

# ── Limits ────────────────────────────────────────────────────────────────────

MAX_TOOL_RESULT_CHARS = 2000   # Tool results larger than this get truncated
MAX_TOOL_ROUNDS       = 12     # Max tool call rounds per agent turn (safety cap)

# ── Tool registry ─────────────────────────────────────────────────────────────

_tool_registry: dict[str, callable] = {}


def register_tool(name: str, fn: callable):
    _tool_registry[name] = fn


def dispatch_tool(name: str, inputs: dict) -> Any:
    if name in _tool_registry:
        try:
            return _tool_registry[name](**inputs)
        except Exception as e:
            logger.error("Tool %s failed: %s", name, e)
            return {"error": str(e)}
    logger.warning("Unknown tool called: %s", name)
    return {"error": f"Unknown tool: {name}"}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _log(on_log: Optional[Callable], kind: str, message: str, data: dict = None) -> None:
    entry = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "kind": kind,
        "message": message,
    }
    if data:
        entry["data"] = data
    logger.info("[%s] %s %s", kind.upper(), message, json.dumps(data or {}))
    if on_log:
        on_log(entry)


def _estimate_tokens(text: str) -> int:
    """Rough token estimate: ~4 chars per token."""
    return len(text) // 4


def _truncate_tool_result(result: Any) -> str:
    """
    Serialize and truncate a tool result to MAX_TOOL_RESULT_CHARS.
    Keeps the result useful by preserving the start (most important) and
    appending a note if truncated.
    """
    serialized = json.dumps(result)
    if len(serialized) <= MAX_TOOL_RESULT_CHARS:
        return serialized
    truncated = serialized[:MAX_TOOL_RESULT_CHARS]
    note = f'... [truncated: {len(serialized)} chars total, showing first {MAX_TOOL_RESULT_CHARS}]'
    logger.warning("Tool result truncated: %d -> %d chars", len(serialized), MAX_TOOL_RESULT_CHARS)
    return truncated + note


def _total_message_chars(messages: list) -> int:
    total = 0
    for m in messages:
        content = m.get("content", "")
        if isinstance(content, str):
            total += len(content)
        elif isinstance(content, list):
            for block in content:
                if isinstance(block, dict):
                    total += len(json.dumps(block))
    return total


# ── Main Claude call ──────────────────────────────────────────────────────────

def call_claude(
    system: str,
    user: str,
    tools: list = [],
    model: str = DEFAULT_MODEL,
    on_log: Optional[Callable] = None,
) -> str:
    """
    Call Claude with optional tool use. Handles the tool loop automatically.
    Enforces tool result size limits and max tool rounds per call.
    """
    messages = [{"role": "user", "content": user}]
    tool_round = 0

    # Log estimated input tokens
    est_input = _estimate_tokens(system + user)
    _log(on_log, "token_estimate", f"Initial call ~{est_input:,} tokens", {
        "system_chars": len(system),
        "user_chars": len(user),
        "est_tokens": est_input,
    })

    while True:
        if tool_round >= MAX_TOOL_ROUNDS:
            _log(on_log, "warn", f"Hit max tool rounds ({MAX_TOOL_ROUNDS}) — forcing final response")
            # Add a message asking Claude to wrap up without more tools
            messages.append({"role": "user", "content": "Please provide your final response now without using any more tools."})
            kwargs = {
                "model": model,
                "max_tokens": 4096,
                "system": system,
                "messages": messages,
            }
            response = client.messages.create(**kwargs)
            for block in response.content:
                if hasattr(block, "text"):
                    return block.text
            return ""

        total_chars = _total_message_chars(messages)
        kwargs = {
            "model": model,
            "max_tokens": 4096,
            "system": system,
            "messages": messages,
        }
        if tools:
            kwargs["tools"] = tools

        response = client.messages.create(**kwargs)

        if response.stop_reason == "tool_use":
            tool_round += 1
            tool_results = []
            assistant_content = response.content

            for block in response.content:
                if block.type == "tool_use":
                    _log(on_log, "tool_call", f"-> {block.name}()", {
                        "tool": block.name,
                        "inputs": block.input,
                        "round": tool_round,
                    })

                    result = dispatch_tool(block.name, block.input)
                    truncated = _truncate_tool_result(result)

                    _log(on_log, "tool_result", f"<- {block.name} returned", {
                        "tool": block.name,
                        "result_chars": len(json.dumps(result)),
                        "truncated_to": len(truncated),
                        "round": tool_round,
                    })

                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": truncated,
                    })

            messages.append({"role": "assistant", "content": assistant_content})
            messages.append({"role": "user", "content": tool_results})

            # Log growing context size
            new_total = _total_message_chars(messages)
            _log(on_log, "token_estimate", f"After tool round {tool_round}: ~{new_total // 4:,} tokens", {
                "message_chars": new_total,
                "est_tokens": new_total // 4,
                "tool_rounds": tool_round,
            })

        else:
            final_text = ""
            for block in response.content:
                if hasattr(block, "text"):
                    final_text = block.text
                    break
            est_output = _estimate_tokens(final_text)
            _log(on_log, "token_estimate", f"Final response ~{est_output:,} output tokens", {
                "output_chars": len(final_text),
                "est_output_tokens": est_output,
                "tool_rounds_total": tool_round,
            })
            return final_text
