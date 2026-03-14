import { api, agents, loadAgents, esc, toast, closeModal } from './app.js';
import type { Agent } from './types.js';

let editingAgentId: string | null = null;
let isOrchestrator = false;

const ICONS = ['◈', '◇', '◉', '◎', '◆', '◐'] as const;
const COLORS = ['icon-green', 'icon-amber', 'icon-blue', 'icon-green', 'icon-amber', 'icon-blue'] as const;

function modelShort(m: string): string {
    if (m.includes('opus')) return 'opus-4';
    if (m.includes('sonnet')) return 'sonnet-4';
    if (m.includes('haiku')) return 'haiku-4.5';
    return m;
}

export function renderAgents(): void {
    const el = document.getElementById('agentsList')!;
    if (!agents.length) {
        el.innerHTML = `<div class="empty"><div class="empty-icon">◈</div>No agents defined yet.</div>`;
        return;
    }
    el.innerHTML = agents.map((a: Agent, i: number) => {
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

export function openAgentModal(id: string | null = null): void {
    editingAgentId = id;
    isOrchestrator = false;

    const titleEl = document.getElementById('agentModalTitle')!;
    titleEl.textContent = id ? '// EDIT_AGENT' : '// NEW_AGENT';

    if (id) {
        const a = agents.find(x => x.id === id);
        if (!a) return;
        (document.getElementById('agentName') as HTMLInputElement).value = a.name;
        (document.getElementById('agentRole') as HTMLInputElement).value = a.role;
        (document.getElementById('agentGoal') as HTMLTextAreaElement).value = a.goal;
        (document.getElementById('agentBackstory') as HTMLTextAreaElement).value = a.backstory;
        (document.getElementById('agentModel') as HTMLSelectElement).value = a.model;
        isOrchestrator = a.is_orchestrator;
    } else {
        (['agentName', 'agentRole', 'agentGoal', 'agentBackstory'] as const).forEach(fieldId => {
            (document.getElementById(fieldId) as HTMLInputElement | HTMLTextAreaElement).value = '';
        });
        (document.getElementById('agentModel') as HTMLSelectElement).value = 'claude-sonnet-4-20250514';
    }

    updateOrchestratorToggle();
    document.getElementById('agentModal')!.classList.add('open');
}

export function toggleOrchestrator(): void {
    isOrchestrator = !isOrchestrator;
    updateOrchestratorToggle();
}

function updateOrchestratorToggle(): void {
    const toggle = document.getElementById('orchToggle')!;
    const label = document.getElementById('orchToggleLabel')! as HTMLElement;
    if (isOrchestrator) {
        toggle.classList.add('on');
        label.textContent = 'Orchestrator';
        label.style.color = 'var(--purple)';
    } else {
        toggle.classList.remove('on');
        label.textContent = 'Worker agent';
        label.style.color = 'var(--text)';
    }
}

export async function saveAgent(): Promise<void> {
    const data = {
        name: (document.getElementById('agentName') as HTMLInputElement).value.trim(),
        role: (document.getElementById('agentRole') as HTMLInputElement).value.trim(),
        goal: (document.getElementById('agentGoal') as HTMLTextAreaElement).value.trim(),
        backstory: (document.getElementById('agentBackstory') as HTMLTextAreaElement).value.trim(),
        model: (document.getElementById('agentModel') as HTMLSelectElement).value,
        is_orchestrator: isOrchestrator,
    };
    if (!data.name || !data.role) return toast('Name and role are required');
    try {
        if (editingAgentId) {
            await api<Agent>('/agents/' + editingAgentId, 'PUT', data);
            toast('Agent updated');
        } else {
            await api<Agent>('/agents', 'POST', data);
            toast('Agent created');
        }
        await loadAgents();
        renderAgents();
        closeModal('agentModal');
    } catch (e) { toast('Error: ' + (e as Error).message); }
}

export async function deleteAgent(id: string): Promise<void> {
    if (!confirm('Delete this agent?')) return;
    await api<void>('/agents/' + id, 'DELETE');
    await loadAgents();
    renderAgents();
    toast('Agent deleted');
}

// Expose functions called from inline HTML onclick handlers
declare global {
    interface Window {
        openAgentModal: typeof openAgentModal;
        toggleOrchestrator: typeof toggleOrchestrator;
        saveAgent: typeof saveAgent;
        deleteAgent: typeof deleteAgent;
        renderAgents: typeof renderAgents;
    }
}
window.openAgentModal = openAgentModal;
window.toggleOrchestrator = toggleOrchestrator;
window.saveAgent = saveAgent;
window.deleteAgent = deleteAgent;
window.renderAgents = renderAgents;