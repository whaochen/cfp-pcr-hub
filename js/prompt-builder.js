/**
 * prompt-builder.js — 模組 3：解析工作台（5 筆標竿範例 + 動態 PCR 解析 Prompt 組裝器 + Skill 檢視下載）
 */

(function () {
  let samples = [];
  let activeSampleIdx = 0;

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderSampleTabs() {
    const tabsContainer = document.getElementById('sample-analyses-tabs');
    if (!tabsContainer || !samples.length) return;

    tabsContainer.innerHTML = samples.map((s, idx) => {
      const isActive = idx === activeSampleIdx;
      return `
        <button type="button" data-sample-idx="${idx}"
                class="px-3.5 py-2 rounded-xl text-xs font-semibold border transition whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-teal-50 text-teal-800 border-teal-300 shadow'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-900'
                }">
          <span class="font-mono text-[11px] px-1.5 py-0.5 rounded bg-white text-teal-700">${escapeHtml(s.pcr_no)}</span>
          <span>${escapeHtml(s.name)}</span>
          <span class="text-[10px] opacity-75">(${escapeHtml(s.industry_tag)})</span>
        </button>
      `;
    }).join('');

    tabsContainer.querySelectorAll('[data-sample-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeSampleIdx = Number(btn.getAttribute('data-sample-idx'));
        renderSampleTabs();
        renderSampleDetail();
      });
    });
  }

  function renderSampleDetail() {
    const detail = document.getElementById('sample-analysis-detail');
    if (!detail || !samples[activeSampleIdx]) return;

    const s = samples[activeSampleIdx];
    const m = s.collection_matrix || {};

    const renderList = (arr) =>
      (arr || []).map((item) => `<li class="leading-relaxed">${escapeHtml(item)}</li>`).join('');

    detail.innerHTML = `
      <div class="space-y-4">
        <!-- 標竿頭部資訊與一鍵套用按鈕 -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div class="space-y-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2 py-0.5 rounded font-mono text-xs font-bold bg-teal-50 text-teal-800 border border-teal-300">${escapeHtml(s.pcr_no)}</span>
              <h4 class="text-base sm:text-lg font-bold text-slate-900">${escapeHtml(s.name)}</h4>
              <span class="text-xs px-2 py-0.5 rounded bg-slate-100 text-sky-800">${escapeHtml(s.industry_tag)}</span>
              <span class="text-xs text-slate-500">制定者：${escapeHtml(s.applicant)}</span>
            </div>
            <div class="text-xs text-slate-700">
              <strong class="text-teal-800">功能單位：</strong>${escapeHtml(s.functional_unit)} ｜ 
              <strong class="text-sky-800">系統界限：</strong>${escapeHtml(s.system_boundary)}
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button type="button" id="btn-apply-sample-to-form"
                    class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white shadow transition">
              ⬇️ 將此標竿帶入下方 Prompt 表單
            </button>
            <button type="button" id="btn-apply-sample-to-mermaid"
                    class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-sky-800 border border-sky-300 transition">
              📐 繪製此標竿界限圖 →
            </button>
          </div>
        </div>

        <!-- 關鍵查驗避雷提示 -->
        <div class="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 leading-relaxed">
          <strong class="text-amber-800">⚠️ 主任查驗員避雷重點：</strong>${escapeHtml(s.pitfall_summary)}
        </div>

        <!-- 五欄跨部門盤查資料蒐集清單 (採購 / 廠務 / 物流 / 使用 / 廢棄) -->
        <div>
          <div class="text-xs font-semibold text-slate-700 mb-2.5 flex items-center justify-between">
            <span>📋 解析完畢應產出之「跨部門盤查資料蒐集清單（採購／廠務／物流／使用／廢棄五欄矩陣）」：</span>
            <span class="text-[11px] text-slate-500 font-mono">ISO 14067 Data Collection Matrix</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <!-- 1. 採購 / 原料取得 -->
            <div class="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
              <div class="font-bold text-teal-800 pb-1.5 border-b border-slate-200 flex items-center justify-between">
                <span>① 採購／研發部</span>
                <span class="text-[10px] font-mono text-slate-500">原料取得</span>
              </div>
              <ul class="list-disc list-inside space-y-1.5 text-slate-700">
                ${renderList(m.procurement)}
              </ul>
            </div>

            <!-- 2. 廠務 / 製造或服務提供 -->
            <div class="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
              <div class="font-bold text-sky-800 pb-1.5 border-b border-slate-200 flex items-center justify-between">
                <span>② 廠務／生產營運</span>
                <span class="text-[10px] font-mono text-slate-500">${s.category === 'service' ? '服務提供' : '製造階段'}</span>
              </div>
              <ul class="list-disc list-inside space-y-1.5 text-slate-700">
                ${renderList(m.factory)}
              </ul>
            </div>

            <!-- 3. 物流 / 配送銷售 -->
            <div class="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
              <div class="font-bold text-indigo-800 pb-1.5 border-b border-slate-200 flex items-center justify-between">
                <span>③ 物流／業務部</span>
                <span class="text-[10px] font-mono text-slate-500">配送銷售</span>
              </div>
              <ul class="list-disc list-inside space-y-1.5 text-slate-700">
                ${renderList(m.logistics)}
              </ul>
            </div>

            <!-- 4. 使用階段 -->
            <div class="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
              <div class="font-bold text-amber-800 pb-1.5 border-b border-slate-200 flex items-center justify-between">
                <span>④ 品保／產品工程</span>
                <span class="text-[10px] font-mono text-slate-500">使用階段</span>
              </div>
              <ul class="list-disc list-inside space-y-1.5 text-slate-700">
                ${renderList(m.use)}
              </ul>
            </div>

            <!-- 5. 廢棄處理階段 -->
            <div class="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
              <div class="font-bold text-rose-800 pb-1.5 border-b border-slate-200 flex items-center justify-between">
                <span>⑤ 環安衛／總務</span>
                <span class="text-[10px] font-mono text-slate-500">廢棄處理</span>
              </div>
              <ul class="list-disc list-inside space-y-1.5 text-slate-700">
                ${renderList(m.disposal)}
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-apply-sample-to-form')?.addEventListener('click', () => {
      window.prefillPromptBuilder({
        pcr_no: s.pcr_no,
        name: s.name,
        category: s.category,
        codes: s.codes,
        scope: `功能單位：${s.functional_unit}\n系統界限：${s.system_boundary}\n查驗重點：${s.pitfall_summary}`
      });
      window.showToast(`已將標竿「${s.pcr_no} ${s.name}」帶入下方表單！`);
    });

    document.getElementById('btn-apply-sample-to-mermaid')?.addEventListener('click', () => {
      window.sendPcrToMermaidStudio({
        pcr_no: s.pcr_no,
        name: s.name,
        category: s.category
      });
    });
  }

  function buildPromptText() {
    const pcrNo = document.getElementById('pb-pcr-no')?.value.trim() || '未指定編號';
    const pcrName = document.getElementById('pb-pcr-name')?.value.trim() || '目標產品/服務';
    const category = document.getElementById('pb-pcr-category')?.value || 'goods';
    const codes = document.getElementById('pb-pcr-codes')?.value.trim() || '詳見文件第 1 章';
    const companyCtx = document.getElementById('pb-company-context')?.value.trim();
    const scope = document.getElementById('pb-pcr-scope')?.value.trim() || '詳見隨附上傳之 PCR PDF 原檔';

    const g1 = document.getElementById('pb-goal-1')?.checked;
    const g2 = document.getElementById('pb-goal-2')?.checked;
    const g3 = document.getElementById('pb-goal-3')?.checked;

    const categoryDesc = category === 'service'
      ? '服務型 PCR（依循環境部 2025 服務型參考範本第三版：原料取得、服務提供、廢棄處理 3 大階段 + 4 碼行業標準分類）'
      : '商品型 PCR（依循環境部 2025 商品型參考範本第五版：原料取得、製造、配送銷售、使用、廢棄處理 5 大階段 + CCC Code）';

    const sections = [];

    if (g1) {
      sections.push(`### 任務一：10 分鐘白話導讀與查驗關鍵陷阱（引用明確章節號碼）
1. **適用範圍與排除條款核對（第 1 章）**：列出本 PCR 涵蓋之所有 ${category === 'service' ? '4 碼行業標準分類代碼' : 'CCC Code 進出口貨品分類號列'} 與 CNS 標準，並特別標出「不適用／排除項目」。
2. **功能單位／宣告單位（第 4 章）**：明訂計算分母基準為何？與最小銷售包裝標示單位如何換算？
3. **系統界限與製程單元（第 3、5、6 章）**：
   - 屬於搖籃至墳墓（Cradle-to-Grave）或搖籃至大門（Cradle-to-Gate）？
   - 列出第 3 章（組成）與第 5 章（名詞定義）規定在「${category === 'service' ? '服務提供階段' : '製造階段'}」必須涵蓋的所有工序／作業單元名稱。
   - 確認不納入項目（如廠房營建、既有生產機台製造、員工通勤與差旅）。
4. **切斷規則與分配規則（第 7、8 章）**：
   - 確認切斷門檻（單一項目 ≤ 1%、累計忽略 ≤ 5%，至少納入 95%）。
   - **共用資源分配基準**：本 PCR 指定工廠／場域共用電力、水、蒸氣與空調時，應優先按「重量」、「產量」、「工時」、「樓地板面積」還是「經濟價值」分攤？請引述第 8 章原文。`);
    }

    if (g2) {
      sections.push(`### 任務二：跨部門 ISO 14067 盤查資料蒐集清單（可直接貼進 Excel 之 Markdown 表格）
請依據本 PCR 第 3、6、9、10 章規範，針對「**採購/研發**、**廠務/生產營運**、**物流/業務**、**品保/產品工程**、**環安衛/總務**」五個部門，產出一張結構化 Markdown 表格（欄位包含：\`生命週期階段\` | \`負責部門\` | \`應蒐集活動數據項目\` | \`法定 SI 制單位 (kg/kWh/L/tkm)\` | \`數據等級 (一級/二級)\` | \`查驗必備佐證單據 (如電費單/BOM表/三聯單)\` | \`PCR 條文節次與避雷提醒\`）。`);
    }

    if (g3) {
      sections.push(`### 任務三：一級數據 10% 門檻檢核（10.2.2 節）與預設情境公式拆解（10.3 節）
1. **10.2.2 上游一級數據 10% 貢獻率鐵律**：
   - 檢視本 PCR 對於一級活動數據之要求。若本廠${category === 'service' ? '服務提供階段' : '製造階段'}排放佔總碳足跡未達 10%，請預測本產品碳排佔比最高的前 3 項上游原物料／耗材（碳排熱點 Hotspots），作為優先向供應商索取一級盤查數據之清單。
2. **10.3 各階段預設情境參數與計算公式完整摘錄**：
   - 完整摘錄文件中規定之預設運輸距離、使用階段耗能計算公式、以及廢棄處理階段各材質之「焚化、掩埋、回收」比例參數，整理成可直接寫入 Excel 的算式。`);
    }

    if (sections.length === 0) {
      sections.push('（請於左側至少勾選一項解析輸出目標）');
    }

    const prompt = `你現在是一位擁有 10 年以上經驗的「台灣環境部（MOENV）產品碳足跡（ISO 14067）主任查驗員與碳標籤輔導顧問」。
我已附上環境部核准之碳足跡產品類別規則（PCR）PDF 文件，目標資訊如下：

- **PCR 登錄編號**：${pcrNo}
- **PCR 文件名稱**：${pcrName}
- **範本屬性**：${categoryDesc}
- **對應分類代碼**：${codes}
- **官方適用範圍摘要**：${scope}
${companyCtx ? `- **本公司實際製程／服務情境補充**：${companyCtx}\n` : ''}
請嚴格依據我上傳的 PCR PDF 原文條款（並對齊環境部 2025 最新參考範本規範），使用**台灣繁體中文**為我執行以下深度解析：

${sections.join('\n\n')}

---
**輸出品質守則**：
1. 每一項規定請務必標註對應之 **PCR 章節號碼**（例如 \`[參照 6.1.2 節]\`、\`[參照 10.2.2 節]\`），嚴禁憑空猜測文件中未記載之數值。
2. 若該份 PDF 為 2020~2024 年間核准之舊版格式（例如內文仍寫「系統邊界」、含「1.2 有效期限」或「環保署 Taiwan EPA」），請自動幫我對照轉換為環境部 2025 最新查驗標準術語並提醒差異。`;

    const outEl = document.getElementById('pb-generated-prompt');
    if (outEl) outEl.value = prompt;
  }

  /**
   * 供外部模組（如模組 1 檢索庫或標竿按鈕）呼叫預填表單
   */
  window.prefillPromptBuilder = function (rec) {
    if (!rec) return;
    const noEl = document.getElementById('pb-pcr-no');
    const nameEl = document.getElementById('pb-pcr-name');
    const catEl = document.getElementById('pb-pcr-category');
    const codesEl = document.getElementById('pb-pcr-codes');
    const scopeEl = document.getElementById('pb-pcr-scope');

    if (noEl) noEl.value = rec.pcr_no || '';
    if (nameEl) nameEl.value = rec.name || '';
    if (catEl && rec.category) catEl.value = rec.category;
    if (codesEl) codesEl.value = (rec.codes || []).join(', ');
    if (scopeEl) scopeEl.value = rec.scope || '';

    buildPromptText();
  };

  window.initPromptBuilder = function (sampleData) {
    samples = sampleData || [];
    renderSampleTabs();
    renderSampleDetail();

    // 綁定表單變更即時重組 Prompt
    const formIds = [
      'pb-pcr-no',
      'pb-pcr-name',
      'pb-pcr-category',
      'pb-pcr-codes',
      'pb-company-context',
      'pb-pcr-scope',
      'pb-goal-1',
      'pb-goal-2',
      'pb-goal-3'
    ];
    formIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', buildPromptText);
        el.addEventListener('change', buildPromptText);
      }
    });

    // 重設表單按鈕
    document.getElementById('btn-prompt-reset')?.addEventListener('click', () => {
      if (samples[0]) {
        window.prefillPromptBuilder({
          pcr_no: samples[0].pcr_no,
          name: samples[0].name,
          category: samples[0].category,
          codes: samples[0].codes,
          scope: `功能單位：${samples[0].functional_unit}\n系統界限：${samples[0].system_boundary}`
        });
      }
      const ctxEl = document.getElementById('pb-company-context');
      if (ctxEl) ctxEl.value = '';
      buildPromptText();
      window.showToast('已重設 Prompt 組裝表單');
    });

    // 一鍵複製 Prompt
    document.getElementById('btn-copy-analysis-prompt')?.addEventListener('click', () => {
      const txt = document.getElementById('pb-generated-prompt')?.value || '';
      window.copyToClipboard(txt, '已複製「PCR 深度解析 Prompt」！請連同 PDF 貼至 AI 對話框。');
    });

    // 從模組 3 跳轉至模組 4 (Mermaid 工作室)
    document.getElementById('btn-jump-to-mermaid-from-pb')?.addEventListener('click', () => {
      const rec = {
        pcr_no: document.getElementById('pb-pcr-no')?.value || '25-022',
        name: document.getElementById('pb-pcr-name')?.value || '曲柄齒盤組',
        category: document.getElementById('pb-pcr-category')?.value || 'goods'
      };
      window.sendPcrToMermaidStudio(rec);
    });

    // 檢視 Skill 原始碼按鈕
    const btnPreviewSkill = document.getElementById('btn-preview-analyzer-skill');
    const previewContainer = document.getElementById('skill-preview-container');
    const previewCode = document.getElementById('skill-preview-code');
    if (btnPreviewSkill && previewContainer && previewCode) {
      btnPreviewSkill.addEventListener('click', async () => {
        const isHidden = previewContainer.classList.contains('hidden');
        if (isHidden) {
          if (!previewCode.textContent) {
            try {
              const res = await fetch('./skills/pcr-analyzer.skill.md');
              previewCode.textContent = await res.text();
            } catch (e) {
              previewCode.textContent = '無法載入 ./skills/pcr-analyzer.skill.md';
            }
          }
          previewContainer.classList.remove('hidden');
          btnPreviewSkill.textContent = '🔼 收合 Skill 原始碼';
        } else {
          previewContainer.classList.add('hidden');
          btnPreviewSkill.textContent = '👁️ 檢視 Skill 原始碼';
        }
      });
    }

    buildPromptText();
  };
})();
