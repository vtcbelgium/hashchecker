import { initTheme } from './theme.ts';
import { initModals } from './modals.ts';
import { showToast } from './toast.ts';
import { auditCookies } from './cookies.ts';
import { auditVault } from './vault.ts';
import { computeAllHashes, MultiHashResult } from './hasher.ts';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initModals();

  const audit = auditCookies();
  const vault = auditVault();
  console.log(`[OTHRYS] HashChecker initialized. Cookies: ${audit.totalCookies}, Vault: ${vault.clientSideOnly}`);

  const inputEl = document.getElementById('app-input') as HTMLTextAreaElement | null;
  const compareInput = document.getElementById('compare-input') as HTMLInputElement | null;
  const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('drop-zone') as HTMLDivElement | null;
  const outputRegion = document.getElementById('output-region');
  const clearBtn = document.getElementById('action-clear');

  let currentHashes: MultiHashResult | null = null;

  async function updateHashesFromText(text: string) {
    if (!outputRegion) return;
    if (!text) {
      currentHashes = null;
      renderEmpty();
      return;
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    currentHashes = await computeAllHashes(data.buffer);
    renderResults(currentHashes, `Text input (${text.length} characters, ${data.byteLength} bytes)`);
  }

  function renderEmpty() {
    if (!outputRegion) return;
    outputRegion.innerHTML = '<div class="output-placeholder">Enter text or drop a file to compute SHA-256, SHA-512, SHA-384, and SHA-1 checksums in real-time.</div>';
  }

  function renderResults(hashes: MultiHashResult, sourceLabel: string) {
    if (!outputRegion) return;
    const compareVal = (compareInput?.value || '').trim().toLowerCase();

    const algos: Array<{ name: string; key: keyof MultiHashResult }> = [
      { name: 'SHA-256', key: 'sha256' },
      { name: 'SHA-512', key: 'sha512' },
      { name: 'SHA-384', key: 'sha384' },
      { name: 'SHA-1', key: 'sha1' },
    ];

    let html = `<div class="hash-results-header">
      <span class="source-tag">${escapeHtml(sourceLabel)}</span>
    </div><div class="hash-grid">`;

    for (const algo of algos) {
      const val = hashes[algo.key];
      const matches = compareVal ? val.toLowerCase() === compareVal : null;

      let matchBadge = '';
      if (matches === true) {
        matchBadge = '<span class="badge badge-match">✓ MATCHES EXPECTED CHECKSUM</span>';
      } else if (matches === false && compareVal.length === val.length) {
        matchBadge = '<span class="badge badge-mismatch">✗ DOES NOT MATCH</span>';
      }

      html += `
        <div class="hash-card ${matches ? 'matched' : ''}">
          <div class="hash-card-header">
            <strong>${algo.name}</strong>
            ${matchBadge}
            <button class="btn btn-sm btn-secondary copy-hash-btn" data-hash="${val}" type="button">Copy</button>
          </div>
          <div class="hash-value" title="${val}">${val}</div>
        </div>
      `;
    }

    html += '</div>';
    outputRegion.innerHTML = html;

    // Attach copy button listeners
    outputRegion.querySelectorAll('.copy-hash-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const target = e.currentTarget as HTMLButtonElement;
        const hashToCopy = target.getAttribute('data-hash') || '';
        await navigator.clipboard.writeText(hashToCopy);
        showToast('Hash copied to clipboard!');
      });
    });
  }

  // Real-time input handling
  if (inputEl) {
    inputEl.addEventListener('input', () => {
      updateHashesFromText(inputEl.value);
    });
  }

  if (compareInput) {
    compareInput.addEventListener('input', () => {
      if (currentHashes) {
        renderResults(currentHashes, inputEl?.value ? `Text input (${inputEl.value.length} chars)` : 'Hashed payload');
      }
    });
  }

  // File drag-and-drop
  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-active');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-active');
    });

    dropZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-active');
      if (e.dataTransfer?.files.length) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files?.length) {
        handleFile(fileInput.files[0]);
      }
    });
  }

  async function handleFile(file: File) {
    if (!outputRegion) return;
    outputRegion.innerHTML = `<div class="output-placeholder">Computing client-side hashes for <strong>${escapeHtml(file.name)}</strong> (${formatBytes(file.size)})...</div>`;
    const buffer = await file.arrayBuffer();
    currentHashes = await computeAllHashes(buffer);
    if (inputEl) inputEl.value = '';
    renderResults(currentHashes, `File: ${file.name} (${formatBytes(file.size)})`);
    showToast(`Hashed ${file.name} locally!`);
  }

  if (clearBtn && inputEl && outputRegion) {
    clearBtn.addEventListener('click', () => {
      inputEl.value = '';
      if (compareInput) compareInput.value = '';
      currentHashes = null;
      renderEmpty();
      showToast('Cleared');
    });
  }

  // Initial trigger
  if (inputEl && inputEl.value) {
    updateHashesFromText(inputEl.value);
  }
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
