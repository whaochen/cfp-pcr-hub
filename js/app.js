/**
 * app.js — 路由/分頁狀態、全域資料載入與跨模組串接核心
 */

window.AppState = {
  activeTab: 'explorer',
  pcrData: null,
  templateData: null,
  sampleAnalyses: null
};

window.showToast = function (message) {
  const toast = document.getElementById('app-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 2600);
};

window.copyToClipboard = async function (text, successMsg = '已複製到剪貼簿！') {
  try {
    await navigator.clipboard.writeText(text);
    window.showToast(successMsg);
  } catch (err) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    window.showToast(successMsg);
  }
};

window.switchTab = function (tabId) {
  window.AppState.activeTab = tabId;

  // 切換導覽按鈕樣式
  document.querySelectorAll('.nav-tab').forEach((btn) => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // 切換面板顯示
  const panels = ['explorer', 'anatomy', 'prompt', 'mermaid'];
  panels.forEach((id) => {
    const el = document.getElementById(`tab-${id}`);
    if (el) {
      if (id === tabId) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });

  // 若切換至生命週期圖工作室，觸發 Mermaid 渲染確保 SVG 尺寸正確
  if (tabId === 'mermaid' && typeof window.renderMermaidDiagram === 'function') {
    setTimeout(() => {
      window.renderMermaidDiagram();
    }, 60);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * 從模組 1 詳情彈窗一鍵帶入模組 3（解析工作台 Prompt）
 */
window.sendPcrToPromptBuilder = function (record) {
  const modal = document.getElementById('pcr-detail-modal');
  if (modal) modal.classList.add('hidden');

  window.switchTab('prompt');
  if (typeof window.prefillPromptBuilder === 'function') {
    window.prefillPromptBuilder(record);
  }
  window.showToast(`已帶入「${record.pcr_no} ${record.name}」至解析工作台！`);
};

/**
 * 從模組 1 或模組 3 一鍵帶入模組 4（生命週期系統界限圖工作台）
 */
window.sendPcrToMermaidStudio = function (record) {
  const modal = document.getElementById('pcr-detail-modal');
  if (modal) modal.classList.add('hidden');

  window.switchTab('mermaid');
  if (typeof window.prefillMermaidStudio === 'function') {
    window.prefillMermaidStudio(record);
  }
  window.showToast(`已帶入「${record.pcr_no} ${record.name}」至生命週期圖工作室！`);
};

document.addEventListener('DOMContentLoaded', async () => {
  // 綁定頂部導覽分頁點擊
  document.querySelectorAll('.nav-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      if (target) window.switchTab(target);
    });
  });

  try {
    // 平行載入三大靜態資料檔
    const [pcrRes, tplRes, sampleRes] = await Promise.all([
      fetch('./data/pcr_list.json'),
      fetch('./data/template_2025.json'),
      fetch('./data/sample_analyses.json')
    ]);

    if (!pcrRes.ok) throw new Error('無法載入 ./data/pcr_list.json');
    if (!tplRes.ok) throw new Error('無法載入 ./data/template_2025.json');
    if (!sampleRes.ok) throw new Error('無法載入 ./data/sample_analyses.json');

    window.AppState.pcrData = await pcrRes.json();
    window.AppState.templateData = await tplRes.json();
    window.AppState.sampleAnalyses = await sampleRes.json();

    // 初始化各功能模組
    if (typeof window.initPcrExplorer === 'function') {
      window.initPcrExplorer(window.AppState.pcrData);
    }
    if (typeof window.initTemplateAnatomy === 'function') {
      window.initTemplateAnatomy(window.AppState.templateData);
    }
    if (typeof window.initPromptBuilder === 'function') {
      window.initPromptBuilder(window.AppState.sampleAnalyses);
    }
    if (typeof window.initMermaidStudio === 'function') {
      window.initMermaidStudio();
    }
    if (typeof window.initGuideModal === 'function') {
      window.initGuideModal();
    }
  } catch (err) {
    console.error('資料初始化失敗：', err);
    const grid = document.getElementById('pcr-cards-grid');
    if (grid) {
      grid.innerHTML = `
        <div class="col-span-full p-6 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-sm">
          <strong>資料載入失敗：</strong> ${err.message}。請確認是否透過本地伺服器（如 <code>python -m http.server</code> 或 Cloudflare Pages）存取。
        </div>
      `;
    }
  }
});
