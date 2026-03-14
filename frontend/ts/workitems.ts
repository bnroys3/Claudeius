import { api, workItems, loadWorkItems, esc, toast, closeModal } from './app.js';
import type { WorkItem } from './types.js';

export function renderWorkItems(): void {
    const el = document.getElementById('workItemsList')!;
    if (!workItems.length) {
        el.innerHTML = `<div class="empty"><div class="empty-icon">?</div>No work items yet. Describe something you want done.</div>`;
        return;
    }
    el.innerHTML = workItems.map((w: WorkItem) => `
    <div class="card">
      <div class="card-header">
        <div class="card-icon icon-amber">?</div>
        <div class="card-name" style="font-size:13px; font-weight:400">
          ${esc(w.description.slice(0, 90))}${w.description.length > 90 ? '&hellip;' : ''}
        </div>
        <span class="status status-${w.status}">${w.status}</span>
      </div>
      ${w.result ? `
      <div class="card-body">
        <div class="field-row">
          <div class="field-label">Last Result</div>
          <div class="field-value" style="font-family:var(--mono); font-size:11px">
            ${esc(w.result.slice(0, 200))}${w.result.length > 200 ? '&hellip;' : ''}
          </div>
        </div>
      </div>` : ''}
      <div class="card-actions">
        <button class="btn btn-danger" onclick="deleteWorkItem('${w.id}')">&#10005; Remove</button>
      </div>
    </div>
  `).join('');
}

export function openWorkItemModal(): void {
    (document.getElementById('workItemDesc') as HTMLTextAreaElement).value = '';
    document.getElementById('workItemModal')!.classList.add('open');
}

export async function saveWorkItem(): Promise<void> {
    const desc = (document.getElementById('workItemDesc') as HTMLTextAreaElement).value.trim();
    if (!desc) return toast('Description is required');
    try {
        await api<WorkItem>('/work-items', 'POST', { description: desc });
        await loadWorkItems();
        renderWorkItems();
        closeModal('workItemModal');
        toast('Work item added');
    } catch (e) { toast('Error: ' + (e as Error).message); }
}

export async function deleteWorkItem(id: string): Promise<void> {
    await api<void>('/work-items/' + id, 'DELETE');
    await loadWorkItems();
    renderWorkItems();
    toast('Work item removed');
}

declare global {
    interface Window {
        openWorkItemModal: typeof openWorkItemModal;
        saveWorkItem: typeof saveWorkItem;
        deleteWorkItem: typeof deleteWorkItem;
        renderWorkItems: typeof renderWorkItems;
    }
}
window.openWorkItemModal = openWorkItemModal;
window.saveWorkItem = saveWorkItem;
window.deleteWorkItem = deleteWorkItem;
window.renderWorkItems = renderWorkItems;