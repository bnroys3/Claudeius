import anthropic
import json
from typing import Any

client = anthropic.Anthropic()
DEFAULT_MODEL = "claude-sonnet-4-20250514"


def call_claude(system: str, user: str, tools: list = [], model: str = DEFAULT_MODEL) -> str:
    """
    Call Claude with optional tool use. Handles the tool call loop automatically.
    Returns the final text response.
    """
    messages = [{"role": "user", "content": user}]

    while True:
        kwargs = {
            "model": model,
            "max_tokens": 4096,
            "system": system,
            "messages": messages,
        }
        if tools:
            kwargs["tools"] = tools

        response = client.messages.create(**kwargs)

        # If Claude wants to use a tool, handle it
        if response.stop_reason == "tool_use":
            tool_results = []
            assistant_content = response.content

            for block in response.content:
                if block.type == "tool_use":
                    result = dispatch_tool(block.name, block.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps(result),
                    })

            # Append assistant message and tool results, then loop
            messages.append({"role": "assistant", "content": assistant_content})
            messages.append({"role": "user", "content": tool_results})

        else:
            # Final text response
            for block in response.content:
                if hasattr(block, "text"):
                    return block.text
            return ""


# Tool dispatcher — routes tool calls to the right function
_tool_registry: dict[str, callable] = {}


def register_tool(name: str, fn: callable):
    _tool_registry[name] = fn


def dispatch_tool(name: str, inputs: dict) -> Any:
    if name in _tool_registry:
        try:
            return _tool_registry[name](**inputs)
        except Exception as e:
            return {"error": str(e)}
    return {"error": f"Unknown tool: {name}"}
