import { api, agents, loadAgents, esc, toast, closeModal } from './app.js';
let editingAgentId = null;
let isOrchestrator = false;
const ICONS = ['◈', '◇', '◉', '◎', '◆', '◐'];
const COLORS = ['icon-green', 'icon-amber', 'icon-blue', 'icon-green', 'icon-amber', 'icon-blue'];
function modelShort(m) {
    if (m.includes('opus'))
        return 'opus-4';
    if (m.includes('sonnet'))
        return 'sonnet-4';
    if (m.includes('haiku'))
        return 'haiku-4.5';
    return m;
}
export function renderAgents() {
    const el = document.getElementById('agentsList');
    if (!agents.length) {
        el.innerHTML = `<div class="empty"><div class="empty-icon">◈</div>No agents defined yet.</div>`;
        return;
    }
    el.innerHTML = agents.map((a, i) => {
        const orch = a.is_orchestrator;
        return `
    <div class="card">
      <div class="card-header">
        <div class="card-icon ${COLORS[i % COLORS.length]}">${ICONS[i % ICONS.length]}</div>
        <div class="card-name">${esc(a.name)}</div>
        <span class="badge ${orch ? 'badge-orch' : 'badge-worker'}">${orch ? 'orchestrator' : 'worker'}</span>
        <span class="badge badge-model" style="margin-left:6px">${esc(modelShort(a.model))}</span>
      </div>
      <div class="card-body">
        <div class="field-row">
          <div class="field-label">Role</div>
          <div class="field-value">${esc(a.role)}</div>
        </div>
        <div class="field-row">
          <div class="field-label">Goal</div>
          <div class="field-value">${esc(a.goal)}</div>
        </div>
        <div class="field-row">
          <div class="field-label">Backstory</div>
          <div class="field-value">${esc(a.backstory)}</div>
        </div>
      </div>
      <div class="card-actions">
        <button class="btn btn-ghost" onclick="openAgentModal('${a.id}')">&#9998; Edit</button>
        <button class="btn btn-danger" onclick="deleteAgent('${a.id}')">&#10005; Delete</button>
      </div>
    </div>`;
    }).join('');
}
export function openAgentModal(id = null) {
    editingAgentId = id;
    isOrchestrator = false;
    const titleEl = document.getElementById('agentModalTitle');
    titleEl.textContent = id ? '// EDIT_AGENT' : '// NEW_AGENT';
    if (id) {
        const a = agents.find(x => x.id === id);
        if (!a)
            return;
        document.getElementById('agentName').value = a.name;
        document.getElementById('agentRole').value = a.role;
        document.getElementById('agentGoal').value = a.goal;
        document.getElementById('agentBackstory').value = a.backstory;
        document.getElementById('agentModel').value = a.model;
        isOrchestrator = a.is_orchestrator;
    }
    else {
        ['agentName', 'agentRole', 'agentGoal', 'agentBackstory'].forEach(fieldId => {
            document.getElementById(fieldId).value = '';
        });
        document.getElementById('agentModel').value = 'claude-sonnet-4-20250514';
    }
    updateOrchestratorToggle();
    document.getElementById('agentModal').classList.add('open');
}
export function toggleOrchestrator() {
    isOrchestrator = !isOrchestrator;
    updateOrchestratorToggle();
}
function updateOrchestratorToggle() {
    const toggle = document.getElementById('orchToggle');
    const label = document.getElementById('orchToggleLabel');
    if (isOrchestrator) {
        toggle.classList.add('on');
        label.textContent = 'Orchestrator';
        label.style.color = 'var(--purple)';
    }
    else {
        toggle.classList.remove('on');
        label.textContent = 'Worker agent';
        label.style.color = 'var(--text)';
    }
}
export async function saveAgent() {
    const data = {
        name: document.getElementById('agentName').value.trim(),
        role: document.getElementById('agentRole').value.trim(),
        goal: document.getElementById('agentGoal').value.trim(),
        backstory: document.getElementById('agentBackstory').value.trim(),
        model: document.getElementById('agentModel').value,
        is_orchestrator: isOrchestrator,
    };
    if (!data.name || !data.role)
        return toast('Name and role are required');
    try {
        if (editingAgentId) {
            await api('/agents/' + editingAgentId, 'PUT', data);
            toast('Agent updated');
        }
        else {
            await api('/agents', 'POST', data);
            toast('Agent created');
        }
        await loadAgents();
        renderAgents();
        closeModal('agentModal');
    }
    catch (e) {
        toast('Error: ' + e.message);
    }
}
export async function deleteAgent(id) {
    if (!confirm('Delete this agent?'))
        return;
    await api('/agents/' + id, 'DELETE');
    await loadAgents();
    renderAgents();
    toast('Agent deleted');
}
window.openAgentModal = openAgentModal;
window.toggleOrchestrator = toggleOrchestrator;
window.saveAgent = saveAgent;
window.deleteAgent = deleteAgent;
window.renderAgents = renderAgents;
//# sourceMappingURL=agents.js.map