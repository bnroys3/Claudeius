import { api, workItems, loadWorkItems, esc, toast, closeModal } from './app.js';
export function renderWorkItems() {
    const el = document.getElementById('workItemsList');
    if (!workItems.length) {
        el.innerHTML = `<div class="empty"><div class="empty-icon">?</div>No work items yet. Describe something you want done.</div>`;
        return;
    }
    el.innerHTML = workItems.map((w) => `
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
export function openWorkItemModal() {
    document.getElementById('workItemDesc').value = '';
    document.getElementById('workItemModal').classList.add('open');
}
export async function saveWorkItem() {
    const desc = document.getElementById('workItemDesc').value.trim();
    if (!desc)
        return toast('Description is required');
    try {
        await api('/work-items', 'POST', { description: desc });
        await loadWorkItems();
        renderWorkItems();
        closeModal('workItemModal');
        toast('Work item added');
    }
    catch (e) {
        toast('Error: ' + e.message);
    }
}
export async function deleteWorkItem(id) {
    await api('/work-items/' + id, 'DELETE');
    await loadWorkItems();
    renderWorkItems();
    toast('Work item removed');
}
window.openWorkItemModal = openWorkItemModal;
window.saveWorkItem = saveWorkItem;
window.deleteWorkItem = deleteWorkItem;
window.renderWorkItems = renderWorkItems;
//# sourceMappingURL=workitems.js.map