import { api, esc } from './app.js';
import type { Run } from './types.js';

export async function loadHistory(): Promise<void> {
    const el = document.getElementById('historyList')!;
    try {
        const runs = await api<Run[]>('/runs');
        if (!runs.length) {
            el.innerHTML = `<div class="empty"><div class="empty-icon">?</div>No runs yet.</div>`;
            return;
        }
        el.innerHTML = [...runs].reverse().map(run => `
      <div class="card">
        <div class="card-header">
          <div class="card-icon icon-blue">?</div>
          <div style="flex:1; font-size:13px">
            ${esc((run.work_item_description ?? run.id).slice(0, 70))}
          </div>
          <span style="font-size:11px; color:var(--text2); margin-right:8px">
            ${esc(run.orchestrator_name ?? '')}
          </span>
          <span class="status status-${run.status}">${run.status}</span>
        </div>
        ${run.result ? `
        <div class="card-body">
          <div class="field-row">
            <div class="field-label">Summary</div>
            <div class="field-value">${esc(run.result)}</div>
          </div>
        </div>` : ''}
        ${run.logs?.length ? `
        <div class="run-card-logs">
          ${run.logs.map(e => `
            <div style="display:flex; gap:10px; padding:2px 0; border-bottom:1px solid rgba(255,255,255,0.02)">
              <span style="color:var(--text3); flex-shrink:0; font-size:10px">${(e.ts ?? '').slice(11, 19)}</span>
              <span class="kind-${e.kind}" style="font-size:10px; width:110px; flex-shrink:0">${e.kind}</span>
              <span style="color:var(--text3); font-size:11px">${esc(e.message)}</span>
            </div>`).join('')}
        </div>` : ''}
      </div>
    `).join('');
    } catch {
        el.innerHTML = `<div class="empty" style="color:var(--red)">
      Could not reach backend — is uvicorn running on port 8000?
    </div>`;
    }
}

declare global {
    interface Window {
        loadHistory: typeof loadHistory;
    }
}
window.loadHistory = loadHistory;