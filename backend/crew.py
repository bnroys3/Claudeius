from dataclasses import dataclass, field
from typing import Optional
from claude_client import call_claude
from github_tools import GITHUB_TOOLS


@dataclass
class Agent:
    id: str
    name: str
    role: str
    goal: str
    backstory: str
    tools: list = field(default_factory=lambda: GITHUB_TOOLS)
    model: str = "claude-sonnet-4-20250514"

    def run(self, task_description: str, context: str = "") -> str:
        system = (
            f"You are {self.name}, a {self.role}.\n\n"
            f"Your goal: {self.goal}\n\n"
            f"Background: {self.backstory}\n\n"
            "Use your tools when you need to interact with GitHub or the filesystem. "
            "Be thorough, precise, and complete your task fully."
        )
        user = f"## Your Task\n{task_description}"
        if context:
            user += f"\n\n## Context from Previous Agents\n{context}"

        return call_claude(system, user, self.tools, self.model)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "role": self.role,
            "goal": self.goal,
            "backstory": self.backstory,
            "model": self.model,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Agent":
        return cls(
            id=data["id"],
            name=data["name"],
            role=data["role"],
            goal=data["goal"],
            backstory=data["backstory"],
            model=data.get("model", "claude-sonnet-4-20250514"),
        )


@dataclass
class Task:
    id: str
    description: str
    agent_id: str
    expected_output: str = ""
    result: Optional[str] = None
    status: str = "pending"  # pending | running | complete | failed

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "description": self.description,
            "agent_id": self.agent_id,
            "expected_output": self.expected_output,
            "result": self.result,
            "status": self.status,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Task":
        return cls(
            id=data["id"],
            description=data["description"],
            agent_id=data["agent_id"],
            expected_output=data.get("expected_output", ""),
            result=data.get("result"),
            status=data.get("status", "pending"),
        )


class Crew:
    def __init__(self, agents: list[Agent], tasks: list[Task]):
        self.agents = {a.id: a for a in agents}
        self.tasks = tasks

    def run(self, on_task_update=None) -> list[dict]:
        """
        Run all tasks sequentially, passing outputs as context to the next task.
        on_task_update: optional callback(task) called after each task completes.
        """
        context = ""
        results = []

        for task in self.tasks:
            agent = self.agents.get(task.agent_id)
            if not agent:
                task.status = "failed"
                task.result = f"Error: No agent found with id '{task.agent_id}'"
                results.append(task.to_dict())
                continue

            task.status = "running"
            if on_task_update:
                on_task_update(task)

            try:
                result = agent.run(task.description, context)
                task.result = result
                task.status = "complete"
                context += f"\n\n### {agent.name} ({agent.role}) completed:\n{result}"
            except Exception as e:
                task.result = f"Error: {str(e)}"
                task.status = "failed"

            if on_task_update:
                on_task_update(task)

            results.append(task.to_dict())

        return results
