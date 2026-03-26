import { getNotes, addNote, deleteNote, updateNote, subscribeToTable } from './api.js';
import { TRAVELERS } from './config.js';
import { openModal, closeModal, showToast, getCurrentTravelerId } from './app.js';

export async function init() {
  document.getElementById('add-note-btn').addEventListener('click', openAddNoteModal);
  subscribeToTable('notes', () => render());
  await render();
}

async function render() {
  const el = document.getElementById('notes-list');
  try {
    const notesList = await getNotes();
    if (notesList.length === 0) {
      el.innerHTML = '<div class="text-gray-400 text-center py-8">No notes yet. Add one!</div>';
      return;
    }
    el.innerHTML = notesList.map(noteCard).join('');
  } catch (e) {
    el.innerHTML = '<div class="text-gray-400 text-center py-8">Connect Supabase to see notes</div>';
  }
}

function noteCard(n) {
  const addedBy = TRAVELERS.find(t => t.id === n.added_by);
  const date = new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const rendered = window.marked ? window.marked.parse(n.content || '') : (n.content || '');
  return `
    <div class="card p-4 mb-3 ${n.pinned ? 'ring-2 ring-yellow-300' : ''}">
      <div class="flex justify-between items-start mb-2">
        <div class="flex items-center gap-2">
          ${n.pinned ? '<i data-lucide="pin" class="w-4 h-4 text-yellow-500"></i>' : ''}
          <span class="font-bold">${n.title}</span>
        </div>
        <div class="flex gap-2 text-xs">
          <button onclick="window._togglePinNote('${n.id}', ${!n.pinned})" class="text-gray-400 hover:text-yellow-500" title="${n.pinned ? 'Unpin' : 'Pin'}">
            <i data-lucide="pin" class="w-3.5 h-3.5"></i>
          </button>
          <button onclick="window._deleteNote('${n.id}')" class="text-red-400 hover:text-red-600">Delete</button>
        </div>
      </div>
      <div class="prose prose-sm max-w-none text-gray-600 text-sm mb-2">${rendered}</div>
      <div class="flex items-center gap-2 text-xs text-gray-300">
        ${addedBy ? `<div class="traveler-dot" style="background:${addedBy.color}"></div><span>${addedBy.name}</span><span>|</span>` : ''}
        <span>${date}</span>
      </div>
    </div>`;
}

window._deleteNote = async (id) => {
  if (!confirm('Delete this note?')) return;
  try { await deleteNote(id); showToast('Note deleted'); render(); }
  catch (e) { showToast('Error: ' + e.message, 'error'); }
};

window._togglePinNote = async (id, pinned) => {
  try { await updateNote(id, { pinned }); render(); }
  catch (e) { showToast('Error: ' + e.message, 'error'); }
};

function openAddNoteModal() {
  const tid = getCurrentTravelerId();
  if (!tid) { showToast('Please select who you are first', 'error'); return; }
  const html = `
    <div class="grid gap-3">
      <div><label class="form-label">Title</label><input id="n-title" class="form-input" placeholder="Packing list, ideas..."></div>
      <div><label class="form-label">Content (Markdown supported)</label><textarea id="n-content" class="form-input" rows="6" placeholder="Write your note here..."></textarea></div>
    </div>`;
  openModal('Add Note', html, async () => {
    const title = document.getElementById('n-title').value.trim();
    if (!title) { showToast('Title is required', 'error'); return; }
    try {
      await addNote({
        title,
        content: document.getElementById('n-content').value,
        added_by: tid,
      });
      closeModal();
      showToast('Note added!');
      render();
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
  });
}
