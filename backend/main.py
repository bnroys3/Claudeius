import json
import uuid
import asyncio
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from crew import Agent, Task, Crew
from github_tools import register_all_tools

# Register all tools at startup
register_all_tools()

app = FastAPI(title="AgentCrew API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = Path("data.json")


# ── Persistence ───────────────────────────────────────────────────────────────

def load_data() -> dict:
    if DATA_FILE.exists():
        return json.loads(DATA_FILE.read_text())
    return {"agents": [], "tasks": [], "runs": []}


def save_data(data: dict):
    DATA_FILE.write_text(json.dumps(data, indent=2))


# ── Pydantic models ───────────────────────────────────────────────────────────

class AgentCreate(BaseModel):
    name: str
    role: str
    goal: str
    backstory: str
    model: str = "claude-sonnet-4-20250514"


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    goal: Optional[str] = None
    backstory: Optional[str] = None
    model: Optional[str] = None


class TaskCreate(BaseModel):
    description: str
    agent_id: str
    expected_output: str = ""


class RunCreate(BaseModel):
    task_ids: list[str]


# ── Agent endpoints ───────────────────────────────────────────────────────────

@app.get("/agents")
def list_agents():
    return load_data()["agents"]


@app.post("/agents")
def create_agent(body: AgentCreate):
    data = load_data()
    agent = {
        "id": str(uuid.uuid4()),
        **body.model_dump(),
    }
    data["agents"].append(agent)
    save_data(data)
    return agent


@app.put("/agents/{agent_id}")
def update_agent(agent_id: str, body: AgentUpdate):
    data = load_data()
    for i, a in enumerate(data["agents"]):
        if a["id"] == agent_id:
            updates = {k: v for k, v in body.model_dump().items() if v is not None}
            data["agents"][i] = {**a, **updates}
            save_data(data)
            return data["agents"][i]
    raise HTTPException(status_code=404, detail="Agent not found")


@app.delete("/agents/{agent_id}")
def delete_agent(agent_id: str):
    data = load_data()
    data["agents"] = [a for a in data["agents"] if a["id"] != agent_id]
    save_data(data)
    return {"deleted": agent_id}


# ── Task endpoints ────────────────────────────────────────────────────────────

@app.get("/tasks")
def list_tasks():
    return load_data()["tasks"]


@app.post("/tasks")
def create_task(body: TaskCreate):
    data = load_data()
    task = {
        "id": str(uuid.uuid4()),
        "status": "pending",
        "result": None,
        **body.model_dump(),
    }
    data["tasks"].append(task)
    save_data(data)
    return task


@app.delete("/tasks/{task_id}")
def delete_task(task_id: str):
    data = load_data()
    data["tasks"] = [t for t in data["tasks"] if t["id"] != task_id]
    save_data(data)
    return {"deleted": task_id}


# ── Run endpoints ─────────────────────────────────────────────────────────────

@app.get("/runs")
def list_runs():
    return load_data()["runs"]


@app.post("/runs")
async def create_run(body: RunCreate):
    """Start a crew run with the specified task IDs in order."""
    data = load_data()

    # Build task list in requested order
    task_map = {t["id"]: t for t in data["tasks"]}
    selected_tasks = [Task.from_dict(task_map[tid]) for tid in body.task_ids if tid in task_map]

    if not selected_tasks:
        raise HTTPException(status_code=400, detail="No valid tasks found")

    agents = [Agent.from_dict(a) for a in data["agents"]]
    crew = Crew(agents, selected_tasks)

    run_id = str(uuid.uuid4())
    run_record = {
        "id": run_id,
        "task_ids": body.task_ids,
        "status": "running",
        "results": [],
    }
    data["runs"].append(run_record)
    save_data(data)

    def on_update(task: Task):
        d = load_data()
        # Update task in storage
        for i, t in enumerate(d["tasks"]):
            if t["id"] == task.id:
                d["tasks"][i] = task.to_dict()
                break
        # Update run record
        for i, r in enumerate(d["runs"]):
            if r["id"] == run_id:
                d["runs"][i]["results"] = [t.to_dict() for t in selected_tasks]
                break
        save_data(d)

    # Run in background thread to not block
    loop = asyncio.get_event_loop()
    results = await loop.run_in_executor(None, lambda: crew.run(on_update))

    # Finalize run record
    d = load_data()
    for i, r in enumerate(d["runs"]):
        if r["id"] == run_id:
            d["runs"][i]["status"] = "complete"
            d["runs"][i]["results"] = results
            break
    save_data(d)

    return {"run_id": run_id, "results": results}


@app.get("/runs/{run_id}")
def get_run(run_id: str):
    data = load_data()
    for r in data["runs"]:
        if r["id"] == run_id:
            return r
    raise HTTPException(status_code=404, detail="Run not found")


# ── Serve frontend ────────────────────────────────────────────────────────────

@app.get("/")
def serve_frontend():
    return FileResponse("../frontend/index.html")
