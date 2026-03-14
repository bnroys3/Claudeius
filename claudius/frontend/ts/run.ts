import { api, agents, workItems, loadWorkItems, esc, toast } from './app.js';
import type { LogEntry, RunResult } from './types.js';

export function renderRunPanel(): void {
    const wiSel = document.getElementById('runWorkItem') as HTMLSelectElement;
    const orchSel = document.getElementById('runOrchestrator') as HTMLSelectElement;

    wiSel.innerHTML = workItems.length
        ? workItems.map(w =>
            `<option value="${w.id}">${esc(w.description.slice(0, 60))}${w.description.length > 60 ? '...' : ''}</option>`
        ).join('')
        : '<option value="">-- No work items --</option>';

    const orchs = agents.filter(a => a.is_orchestrator);
    orchSel.innerHTML = orchs.length
        ? orchs.map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join('')
        : '<option value="">-- No orchestrators defined --</option>';
}

export async function executeRun(): Promise<void> {
    const work_item_id = (document.getElementById('runWorkItem') as HTMLSelectElement).value;
    const orchestrator_id = (document.getElementById('runOrchestrator') as HTMLSelectElement).value;
    if (!work_item_id || !orchestrator_id) return toast('Select a work item and an orchestrator');

    const btn = document.getElementById('runBtn') as HTMLButtonElement;
    const logEl = document.getElementById('liveLogBody') as HTMLDivElement;
    const logContainer = document.getElementById('liveLog') as HTMLDivElement;
    const logStatus = document.getElementById('liveLogStatus') as HTMLDivElement;

    btn.disabled = true;
    btn.textContent = 'Running...';
    logEl.innerHTML = '';
    logContainer.style.display = 'block';
    logStatus.innerHTML = '<span class="spinner"></span> running';

    try {
        const result = await api<RunResult>('/runs', 'POST', { work_item_id, orchestrator_id });

        logEl.innerHTML = '';
        (result.logs ?? []).forEach(entry => appendLogEntry(logEl, entry));

        logStatus.innerHTML = result.status === 'complete'
            ? '<span style="color:var(--accent)">&#10003; complete</span>'
            : '<span style="color:var(--red)">&#10007; failed</span>';

        await loadWorkItems();
        toast(result.status === 'complete' ? 'Run complete' : 'Run failed');
    } catch (e) {
        appendLogEntry(logEl, { kind: 'error', message: (e as Error).message, ts: new Date().toISOString() });
        logStatus.innerHTML = '<span style="color:var(--red)">&#10007; error</span>';
        toast('Run failed: ' + (e as Error).message);
    }

    btn.disabled = false;
    btn.textContent = 'Run';
}

export function appendLogEntry(container: HTMLElement, entry: LogEntry): void {
    const ts = entry.ts ? entry.ts.slice(11, 19) : '';
    const kind = entry.kind ?? 'info';
    const div = document.createElement('div');
    div.className = 'log-entry';

    const SKIP_KEYS = new Set(['work_item_id', 'result_preview', 'context_length']);
    let dataHtml = '';
    if (entry.data) {
        const interesting = Object.entries(entry.data)
            .filter(([k]) => !SKIP_KEYS.has(k))
            .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
            .join(' · ');
        if (interesting) dataHtml = `<div class="log-data">${esc(interesting)}</div>`;
    }

    div.innerHTML = `
    <div class="log-ts">${ts}</div>
    <div class="log-kind kind-${kind}">${kind}</div>
    <div class="log-msg">
      <div>${esc(entry.message)}</div>
      ${dataHtml}
    </div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

declare global {
    interface Window {
        executeRun: typeof executeRun;
        renderRunPanel: typeof renderRunPanel;
    }
}
window.executeRun = executeRun;
window.renderRunPanel = renderRunPanel;