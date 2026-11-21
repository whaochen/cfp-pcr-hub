/**
 * pcr-explorer.js — 模組 1：全量 PCR 智慧檢索庫（明亮清新環保綠系版，比照 cfp-query-web 視覺系統）
 */

(function () {
  let allRecords = [];
  let metadata = {};
  let fuseInstance = null;

  const filterState = {
    query: '',
    includeExpired: false,
    systemType: 'all',
    category: 'all',
    specialFilter: null
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getSystemLabel(rec) {
    return `${rec.source} ${rec.pcr_type}`.trim();
  }

  function getCategoryBadge(cat) {
    if (cat === 'goods') {
      return '<span class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">📦 商品型</span>';
    }
    if (cat === 'service') {
      return '<span class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">🛎️ 服務型</span>';
    }
    return '<span class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">🧱 其他/通用</span>';
  }

  function getSystemBadge(rec) {
    const sys = getSystemLabel(rec);
    if (sys.includes('PEFCR')) {
      return `<span class="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-indigo-50 text-indigo-800 border border-indigo-200">${escapeHtml(sys)}</span>`;
    }
    if (sys.includes('EPD-PCR')) {
      return `<span class="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-cyan-50 text-cyan-800 border border-cyan-200">${escapeHtml(sys)}</span>`;
    }
    return `<span class="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">${escapeHtml(sys)}</span>`;
  }

  function renderStatsBar() {
    const bar = document.getElementById('explorer-stats-bar');
    if (!bar || !metadata) return;

    const cfpCount = metadata.active_by_type?.['環境部 CFP-PCR'] ?? 159;
    const epdCount = metadata.active_by_type?.['產發署 EPD-PCR'] ?? 34;
    const pefCount = metadata.active_by_type?.['環境部 PEFCR'] ?? 15;
    const goodsCount = metadata.active_by_category?.goods ?? 156;
    const serviceCount = metadata.active_by_category?.service ?? 44;
    const otherCount = metadata.active_by_category?.other ?? 8;

    bar.innerHTML = `
      <!-- 卡片 1：現行有效總數與三體系細分 -->
      <div class="bg-white border border-teal-200 border-l-4 border-l-teal-700 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">現行有效 PCR 規則</span>
          <span class="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">Active</span>
        </div>
        <div class="my-1.5 flex items-baseline gap-2">
          <span class="text-2xl sm:text-3xl font-bold font-mono text-teal-800">${metadata.active_count || 208}</span>
          <span class="text-xs text-slate-500">筆（全庫共 ${metadata.total_count || 494} 筆）</span>
        </div>
        <div class="text-[11px] text-slate-600 flex items-center gap-2 flex-wrap pt-1.5 border-t border-slate-100">
          <span>CFP-PCR <strong class="text-slate-900 font-mono">${cfpCount}</strong></span>
          <span>·</span>
          <span>EPD-PCR <strong class="text-slate-900 font-mono">${epdCount}</strong></span>
          <span>·</span>
          <span>PEFCR <strong class="text-slate-900 font-mono">${pefCount}</strong></span>
        </div>
      </div>

      <!-- 卡片 2：商品 vs 服務型分佈 -->
      <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">有效規則產業屬性</span>
          <span class="text-xs font-mono font-semibold text-sky-700">2025 雙範本對應</span>
        </div>
        <div class="my-1.5 flex items-baseline gap-3">
          <div>
            <span class="text-xl sm:text-2xl font-bold font-mono text-slate-900">${goodsCount}</span>
            <span class="text-xs text-slate-500">商品型</span>
          </div>
          <span class="text-slate-300">/</span>
          <div>
            <span class="text-xl sm:text-2xl font-bold font-mono text-sky-700">${serviceCount}</span>
            <span class="text-xs text-slate-500">服務型</span>
          </div>
          <span class="text-slate-300">/</span>
          <div>
            <span class="text-lg font-bold font-mono text-purple-700">${otherCount}</span>
            <span class="text-xs text-slate-500">其他</span>
          </div>
        </div>
        <div class="text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
          支援 CCC Code 與 4 碼行業分類模糊檢索
        </div>
      </div>

      <!-- 卡片 3：即將到期與同名雙軌防呆警示 -->
      <div class="bg-white border border-amber-200 border-l-4 border-l-amber-500 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">實務防呆警示雷達</span>
          <span class="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">90 天內預警</span>
        </div>
        <div class="my-1.5 flex items-center gap-4">
          <button type="button" id="stat-btn-expiring" class="text-left group">
            <span class="text-2xl font-bold font-mono text-orange-700 group-hover:underline">${metadata.expiring_soon_count || 2}</span>
            <span class="text-xs font-medium text-orange-800 ml-1">筆即將到期</span>
          </button>
          <span class="text-slate-300">|</span>
          <button type="button" id="stat-btn-dual" class="text-left group">
            <span class="text-2xl font-bold font-mono text-amber-700 group-hover:underline">${(metadata.dual_track_items || []).length}</span>
            <span class="text-xs font-medium text-amber-800 ml-1">組同名雙軌</span>
          </button>
        </div>
        <div class="text-[11px] text-slate-600 pt-1.5 border-t border-slate-100 truncate" title="同名雙軌：鞋靴、戶外照明燈具、衣著">
          雙軌品項：${(metadata.dual_track_items || ['鞋靴', '戶外照明燈具', '衣著']).join('、')}
        </div>
      </div>

      <!-- 卡片 4：資料基準日與官方同步 -->
      <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">官方資料基準日</span>
          <span class="text-xs font-mono font-semibold text-teal-700">環境部 ODT 同步</span>
        </div>
        <div class="my-1.5">
          <span class="text-xl sm:text-2xl font-bold font-mono text-slate-900">${escapeHtml(metadata.generated_at || '2026-11-21')}</span>
        </div>
        <div class="text-[11px] text-slate-500 pt-1.5 border-t border-slate-100 flex items-center justify-between">
          <span>歷史過期封存：${metadata.expired_count || 286} 筆</span>
          <a href="${escapeHtml(metadata.source_url || 'https://cfp.moenv.gov.tw/Carbon/WebPage/FLPCRDoneList.aspx')}" target="_blank" rel="noopener noreferrer" class="text-teal-700 font-semibold hover:underline">環境部官網 ↗</a>
        </div>
      </div>
    `;

    document.getElementById('stat-btn-expiring')?.addEventListener('click', () => toggleSpecialFilter('expiring'));
    document.getElementById('stat-btn-dual')?.addEventListener('click', () => toggleSpecialFilter('dual'));
  }

  function applyFilters() {
    let baseList = allRecords;

    const q = filterState.query.trim();
    if (q) {
      const qLower = q.toLowerCase();
      const fuseResults = fuseInstance ? fuseInstance.search(q).map((r) => r.item) : [];
      const seenSeq = new Set();
      const combined = [];

      for (const rec of allRecords) {
        const matchCode = (rec.codes || []).some((c) => c.toLowerCase().includes(qLower));
        const matchNo = (rec.pcr_no || '').toLowerCase().includes(qLower);
        const matchName = (rec.name || '').toLowerCase().includes(qLower);
        const matchApp = (rec.applicant || '').toLowerCase().includes(qLower);
        const matchScope = (rec.scope || '').toLowerCase().includes(qLower);
        if (matchCode || matchNo || matchName || matchApp || matchScope) {
          seenSeq.add(rec.seq);
          combined.push(rec);
        }
      }
      for (const rec of fuseResults) {
        if (!seenSeq.has(rec.seq)) {
          seenSeq.add(rec.seq);
          combined.push(rec);
        }
      }
      baseList = combined;
    }

    let filtered = baseList.filter((rec) => {
      if (!filterState.includeExpired && rec.status === 'expired') {
        return false;
      }
      if (filterState.systemType !== 'all') {
        const sys = getSystemLabel(rec);
        if (sys !== filterState.systemType) return false;
      }
      if (filterState.category !== 'all') {
        if (rec.category !== filterState.category) return false;
      }
      if (filterState.specialFilter === 'expiring') {
        if (rec.status !== 'expiring_soon') return false;
      }
      if (filterState.specialFilter === 'dual') {
        if (!rec.has_dual_track) return false;
      }
      return true;
    });

    renderCards(filtered);
  }

  function renderCards(records) {
    const grid = document.getElementById('pcr-cards-grid');
    const counter = document.getElementById('pcr-result-counter');
    if (!grid) return;

    if (counter) {
      const modeText = filterState.includeExpired ? '含歷史過期版' : '現行有效';
      counter.innerHTML = `顯示 <strong class="text-teal-700 font-mono">${records.length}</strong> 筆 PCR 規則（${modeText}）`;
    }

    if (records.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3">
          <div class="text-3xl">🔍</div>
          <h4 class="text-base font-bold text-slate-800">找不到符合條件的現行 PCR 規則</h4>
          <p class="text-xs text-slate-600 max-w-lg mx-auto">
            您可以嘗試開啟右上角「含已過期歷史版 (+286 筆)」查看是否曾有舊版 PCR，或點擊頂部「找不到適用 PCR？」了解環境部法定訂定四階段流程。
          </p>
          <div class="pt-2 flex items-center justify-center gap-3">
            <button type="button" id="btn-empty-enable-expired" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300">
              展開歷史過期版搜尋
            </button>
            <button type="button" id="btn-empty-open-guide" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300">
              🧭 找不到適用 PCR 怎麼辦？
            </button>
          </div>
        </div>
      `;
      document.getElementById('btn-empty-enable-expired')?.addEventListener('click', () => {
        const chk = document.getElementById('toggle-include-expired');
        if (chk) {
          chk.checked = true;
          filterState.includeExpired = true;
          applyFilters();
        }
      });
      const btnGuide = document.getElementById('btn-empty-open-guide');
      if (btnGuide && typeof window.openGuideModal === 'function') {
        btnGuide.addEventListener('click', window.openGuideModal);
      }
      return;
    }

    grid.innerHTML = records.map((rec) => {
      let statusBadgeHtml = '';
      if (rec.status === 'expiring_soon') {
        const days = rec.days_to_expiry != null ? rec.days_to_expiry : '90內';
        statusBadgeHtml = `
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-300">
            ⏰ 即將到期（剩餘 ${days} 天）
          </span>
        `;
      } else if (rec.status === 'expired') {
        statusBadgeHtml = `
          <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            已過期 (${escapeHtml(rec.expiry_date)})
          </span>
        `;
      } else {
        statusBadgeHtml = `
          <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            ✓ 有效 (${escapeHtml(rec.expiry_date)})
          </span>
        `;
      }

      let dualTrackHtml = '';
      if (rec.has_dual_track) {
        dualTrackHtml = `
          <div class="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-[11px] text-amber-900 flex items-start gap-1.5">
            <span class="shrink-0">⚖️</span>
            <div>
              <strong class="text-amber-900">同名雙軌規則：</strong>
              <span>${escapeHtml(rec.dual_track_note)}</span>
            </div>
          </div>
        `;
      }

      const codes = rec.codes || [];
      let codesHtml = '';
      if (codes.length > 0) {
        const shown = codes.slice(0, 4).map((c) =>
          `<span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200">${escapeHtml(c)}</span>`
        ).join('');
        const more = codes.length > 4
          ? `<span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-[11px]">+${codes.length - 4}</span>`
          : '';
        codesHtml = `<div class="flex items-center gap-1 flex-wrap mt-2">${shown}${more}</div>`;
      }

      const scopePreview = rec.scope
        ? escapeHtml(rec.scope.length > 110 ? rec.scope.slice(0, 110) + '...' : rec.scope)
        : '請點選查看詳情或參閱官方 PDF 文件。';

      const borderClass = rec.status === 'expiring_soon'
        ? 'border-orange-300'
        : rec.has_dual_track
        ? 'border-amber-300'
        : 'border-slate-200';

      return `
        <article data-pcr-seq="${rec.seq}"
                 class="pcr-card bg-white border ${borderClass} rounded-2xl p-4 flex flex-col justify-between cursor-pointer">
          <div>
            <!-- 頂部編號與狀態列 -->
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <div class="flex items-center gap-1.5">
                <span class="px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">${escapeHtml(rec.pcr_no)}</span>
                <span class="text-[11px] font-mono text-slate-500">v${escapeHtml(rec.version)}</span>
              </div>
              ${statusBadgeHtml}
            </div>

            <!-- 標題 -->
            <h3 class="text-base font-bold text-slate-900 mt-2.5 leading-snug">
              ${escapeHtml(rec.name)}
            </h3>

            <!-- 體系與分類標籤 -->
            <div class="flex items-center gap-1.5 flex-wrap mt-2">
              ${getSystemBadge(rec)}
              ${getCategoryBadge(rec.category)}
            </div>

            ${dualTrackHtml}
            ${codesHtml}

            <!-- 適用範圍摘要 -->
            <p class="text-xs text-slate-600 mt-2.5 line-clamp-3 leading-relaxed">
              ${scopePreview}
            </p>
          </div>

          <!-- 底部申請者與操作按鈕 -->
          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px] text-slate-500">
            <span class="truncate" title="申請者：${escapeHtml(rec.applicant)}">🏢 ${escapeHtml(rec.applicant)}</span>
            <span class="text-teal-700 font-semibold shrink-0 hover:underline">詳情與 AI 解析 →</span>
          </div>
        </article>
      `;
    }).join('');

    grid.querySelectorAll('article[data-pcr-seq]').forEach((card) => {
      card.addEventListener('click', () => {
        const seq = Number(card.getAttribute('data-pcr-seq'));
        const rec = allRecords.find((r) => r.seq === seq);
        if (rec) openDetailModal(rec);
      });
    });
  }

  function openDetailModal(rec) {
    const modal = document.getElementById('pcr-detail-modal');
    const body = document.getElementById('pcr-detail-modal-body');
    if (!modal || !body) return;

    const codesListHtml = (rec.codes && rec.codes.length > 0)
      ? rec.codes.map((c) => `<span class="px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-mono text-xs font-medium border border-teal-200">${escapeHtml(c)}</span>`).join('')
      : '<span class="text-xs text-slate-500">（詳見下方適用範圍內文敘述）</span>';

    let alertBanner = '';
    if (rec.status === 'expiring_soon') {
      alertBanner += `
        <div class="p-3 rounded-xl bg-orange-50 border border-orange-300 text-xs text-orange-900 flex items-center gap-2">
          <span class="text-base">⏰</span>
          <div>
            <strong>即將到期警示：</strong>本 PCR 有效期限為 <code class="font-mono font-bold">${escapeHtml(rec.expiry_date)}</code>（距離基準日僅剩 <strong>${rec.days_to_expiry}</strong> 天），引用前請確認環境部是否已公告展延或修訂版本。
          </div>
        </div>
      `;
    }
    if (rec.has_dual_track) {
      alertBanner += `
        <div class="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-center gap-2">
          <span class="text-base">⚖️</span>
          <div>
            <strong>同名雙軌規則提醒：</strong>${escapeHtml(rec.dual_track_note)}
          </div>
        </div>
      `;
    }

    body.innerHTML = `
      <div class="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="px-2.5 py-0.5 rounded-md font-mono text-sm font-bold bg-teal-50 text-teal-800 border border-teal-200">${escapeHtml(rec.pcr_no)}</span>
            ${getSystemBadge(rec)}
            ${getCategoryBadge(rec.category)}
            <span class="text-xs font-mono text-slate-500">版本 v${escapeHtml(rec.version)}</span>
          </div>
          <h3 class="text-xl font-bold text-slate-900 mt-2">${escapeHtml(rec.name)}</h3>
        </div>
        <button type="button" id="btn-close-detail-modal" class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm">✕</button>
      </div>

      ${alertBanner ? `<div class="space-y-2">${alertBanner}</div>` : ''}

      <!-- 基本中繼資料表 -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
        <div>
          <span class="text-slate-500 block">制定／申請者</span>
          <span class="text-slate-900 font-semibold mt-0.5 block">${escapeHtml(rec.applicant)}</span>
        </div>
        <div>
          <span class="text-slate-500 block">核准日期</span>
          <span class="text-slate-900 font-mono font-semibold mt-0.5 block">${escapeHtml(rec.approved_date)}</span>
        </div>
        <div>
          <span class="text-slate-500 block">有效期限</span>
          <span class="font-mono font-bold mt-0.5 block ${rec.status === 'expiring_soon' ? 'text-orange-700' : rec.status === 'expired' ? 'text-rose-700' : 'text-emerald-700'}">${escapeHtml(rec.expiry_date)}</span>
        </div>
      </div>

      <!-- 擷取之分類代碼清單 -->
      <div class="space-y-1.5">
        <span class="text-xs font-bold text-slate-700 block">
          ${rec.category === 'service' ? '擷取之行業標準分類代碼（4 碼）：' : '擷取之進出口貨品分類號列（CCC Code）：'}
        </span>
        <div class="flex items-center gap-1.5 flex-wrap">
          ${codesListHtml}
        </div>
      </div>

      <!-- 完整適用範圍 Scope -->
      <div class="space-y-1.5">
        <span class="text-xs font-bold text-slate-700 block">完整適用產品／服務範圍（Scope）：</span>
        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line max-h-56 overflow-y-auto">
          ${escapeHtml(rec.scope || '無詳細文字，請直接參閱環境部官網 PDF 原檔。')}
        </div>
      </div>

      <!-- 三大行動按鈕（串接官網、模組 3 與模組 4） -->
      <div class="pt-3 border-t border-slate-200 space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <a href="https://cfp.moenv.gov.tw/Carbon/WebPage/FLPCRDoneList.aspx" target="_blank" rel="noopener noreferrer"
             class="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-sm transition text-center">
            <span>前往環境部官網下載 PDF ↗</span>
          </a>
          <button type="button" id="btn-modal-to-prompt"
                  class="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white shadow-sm transition">
            <span>⚡ 一鍵帶入「解析 PCR Prompt」→</span>
          </button>
          <button type="button" id="btn-modal-to-mermaid"
                  class="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-sky-700 hover:bg-sky-800 text-white shadow-sm transition">
            <span>📐 一鍵帶入「生命週期圖 Prompt」→</span>
          </button>
        </div>
        <p class="text-[11px] text-slate-500 text-center">
          💡 提示：請於環境部官網輸入登錄編號 <code class="text-teal-800 font-mono font-bold">${escapeHtml(rec.pcr_no)}</code> 並完成驗證碼下載 PDF，本平台不鏡像託管原檔以確保版本即時。
        </p>
      </div>
    `;

    modal.classList.remove('hidden');

    document.getElementById('btn-close-detail-modal')?.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
    document.getElementById('btn-modal-to-prompt')?.addEventListener('click', () => {
      window.sendPcrToPromptBuilder(rec);
    });
    document.getElementById('btn-modal-to-mermaid')?.addEventListener('click', () => {
      window.sendPcrToMermaidStudio(rec);
    });
  }

  function toggleSpecialFilter(mode) {
    const expChip = document.getElementById('chip-special-expiring');
    const dualChip = document.getElementById('chip-special-dual');

    if (filterState.specialFilter === mode) {
      filterState.specialFilter = null;
      expChip?.classList.remove('active');
      dualChip?.classList.remove('active');
    } else {
      filterState.specialFilter = mode;
      if (mode === 'expiring') {
        expChip?.classList.add('active');
        dualChip?.classList.remove('active');
      } else {
        dualChip?.classList.add('active');
        expChip?.classList.remove('active');
      }
    }
    applyFilters();
  }

  window.initPcrExplorer = function (data) {
    metadata = data.metadata || {};
    allRecords = data.records || [];

    if (typeof Fuse !== 'undefined') {
      fuseInstance = new Fuse(allRecords, {
        keys: [
          { name: 'pcr_no', weight: 2.0 },
          { name: 'name', weight: 1.8 },
          { name: 'codes', weight: 1.8 },
          { name: 'applicant', weight: 1.2 },
          { name: 'scope', weight: 1.0 }
        ],
        threshold: 0.32,
        ignoreLocation: true
      });
    }

    renderStatsBar();

    const searchInput = document.getElementById('pcr-search-input');
    const clearBtn = document.getElementById('pcr-search-clear');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        filterState.query = e.target.value;
        if (clearBtn) {
          clearBtn.classList.toggle('hidden', !filterState.query);
        }
        applyFilters();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        filterState.query = '';
        clearBtn.classList.add('hidden');
        applyFilters();
      });
    }

    const expiredToggle = document.getElementById('toggle-include-expired');
    if (expiredToggle) {
      expiredToggle.addEventListener('change', (e) => {
        filterState.includeExpired = e.target.checked;
        applyFilters();
      });
    }

    document.querySelectorAll('.type-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.type-chip').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        filterState.systemType = btn.getAttribute('data-filter-type') || 'all';
        applyFilters();
      });
    });

    document.querySelectorAll('.cat-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-chip').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        filterState.category = btn.getAttribute('data-filter-cat') || 'all';
        applyFilters();
      });
    });

    document.getElementById('chip-special-expiring')?.addEventListener('click', () => {
      toggleSpecialFilter('expiring');
    });
    document.getElementById('chip-special-dual')?.addEventListener('click', () => {
      toggleSpecialFilter('dual');
    });

    document.querySelectorAll('[data-quick-query]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const q = btn.getAttribute('data-quick-query') || '';
        if (searchInput) searchInput.value = q;
        filterState.query = q;
        filterState.specialFilter = null;
        document.getElementById('chip-special-expiring')?.classList.remove('active');
        document.getElementById('chip-special-dual')?.classList.remove('active');
        if (clearBtn) clearBtn.classList.toggle('hidden', !q);
        applyFilters();
      });
    });

    const detailModal = document.getElementById('pcr-detail-modal');
    if (detailModal) {
      detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) {
          detailModal.classList.add('hidden');
        }
      });
    }

    applyFilters();
  };
})();
