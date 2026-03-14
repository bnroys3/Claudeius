export interface Agent {
    id: string;
    name: string;
    role: string;
    goal: string;
    backstory: string;
    is_orchestrator: boolean;
    model: string;
}

export interface WorkItem {
    id: string;
    description: string;
    status: 'pending' | 'running' | 'complete' | 'failed';
    result: string | null;
}

export interface LogEntry {
    ts: string;
    kind: string;
    message: string;
    data?: Record<string, unknown>;
}

export interface Run {
    id: string;
    work_item_id: string;
    work_item_description: string;
    orchestrator_name: string;
    status: 'running' | 'complete' | 'failed';
    result: string | null;
    logs: LogEntry[];
}

export interface RunResult {
    run_id: string;
    status: string;
    result: string;
    logs: LogEntry[];
}

export interface HealthStatus {
    ok: boolean;
    issues: string[];
    env: {
        anthropic_api_key: boolean;
        github_token: boolean;
    };
}