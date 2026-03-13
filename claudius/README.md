# Claudius
A lightweight, fully-owned multi-agent framework with a UI — just clean Python, HTML, and Claude.

## Structure
```
claudius/
  backend/
    main.py          # FastAPI server + REST API
    crew.py          # Agent, WorkItem, OrchestratorCrew classes
    claude_client.py # Claude API wrapper with tool use
    github_tools.py  # GitHub + filesystem tools
  frontend/
    index.html       # Single-file UI
  requirements.txt
  start.py
```

## Setup

**1. Install dependencies**

Run this from the root `claudius/` folder (where `requirements.txt` lives):
```bash
pip install -r requirements.txt
```

**2. Set environment variables**
```bash
export ANTHROPIC_API_KEY=your_key_here
export GITHUB_TOKEN=your_github_pat_here   # needs repo + pull_requests scope
```

**3. Start the app**
```bash
python start.py
```

This starts the backend and opens the browser automatically. That's it.

> All data including run history is stored in `backend/data.json` (plain JSON, no database). It is created automatically on first run.

## How it works

1. **Create agents** — define a team of workers (Reviewer, Developer, QA, etc.) and one Orchestrator. Give each a name, role, goal, backstory, and Claude model.
2. **Create a work item** — describe what you want done in plain language. No need to assign it to anyone.
3. **Run** — pick the work item and an orchestrator, hit Run. The orchestrator reads the work item, decides which worker agents to involve and in what order, and drives the work to completion. Each agent's output becomes context for the next decision.

## Agent setup

Define one **Orchestrator** and as many **Worker** agents as your workflow needs:

| Agent | Type | Role | Model |
|-------|------|------|-------|
| Nova | Orchestrator | Engineering Lead | claude-opus-4 |
| Alex | Worker | Senior Code Reviewer | claude-sonnet-4 |
| Sam | Worker | Software Developer | claude-sonnet-4 |
| Jordan | Worker | QA Engineer | claude-haiku-4.5 |

> **Cost tip:** Use Opus for the orchestrator (complex reasoning, few calls), Sonnet for workers doing real work, and Haiku for simple or high-volume workers like test runners or formatters.

## Example work items

Work items are plain language descriptions — the orchestrator figures out the rest:

- `"Review PR #42 in myorg/myrepo. If there are issues, fix them and push the changes. Then run the test suite and confirm everything passes."`
- `"Check all open PRs in myorg/myrepo and post a review on any that have been open for more than 3 days without feedback."`
- `"Read the file src/auth.py in myorg/myrepo and refactor it to use the new token validation library. Open a PR with the changes."`

The orchestrator will break these down, e.g. for the first example:
1. Routes to **Alex** to review PR #42 and post comments
2. Routes to **Sam** to read Alex's review, fix the issues, and commit
3. Routes to **Jordan** to run the test suite and report results
4. Declares work complete with a summary

## Available tools

Each worker agent has access to:
- `get_pr_diff` — read a PR's file diffs
- `post_pr_review` — post APPROVE / REQUEST_CHANGES / COMMENT
- `list_open_prs` — list all open PRs in a repo
- `get_file_contents` — read any file from a repo
- `commit_file` — create or update a file with a commit
- `create_branch` — create a new branch
- `create_pull_request` — open a PR
- `read_local_file` — read a local file
- `write_local_file` — write to a local file
- `run_command` — run shell commands (tests, linting, etc.)

## Adding your own tools

In `github_tools.py`, add a function and a schema entry to `GITHUB_TOOLS`, then register it in `register_all_tools()`. The tool dispatcher in `claude_client.py` will handle the rest automatically.