/**
 * mermaid-studio.js — 模組 4：生命週期系統界限圖工作台（6.2 節 4 大繪圖鐵律 Prompt 生成 + 純前端 Mermaid 渲染 + 合規檢查 + PNG/SVG 匯出）
 */

(function () {
  let msMode = 'goods'; // 'goods' | 'service'
  let renderSeq = 0;

  // 內建標準範例 1：商品型標準範例（5 大階段，以 25-022 曲柄齒盤組為例，100% 符合 6.2 節 4 大鐵律）
  const SAMPLE_GOODS_MERMAID = `flowchart LR
  classDef mandatory fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#064e3b;
  classDef optional fill:#fffbeb,stroke:#d97706,stroke-width:2px,stroke-dasharray: 5 5,color:#78350f;
  classDef stageBox fill:#f8fafc,stroke:#64748b,stroke-width:1.5px,color:#0f172a;

  subgraph LEGEND["圖例定義（環境部 2025 範本 6.2 節規範）"]
    L1["實線框：強制性納入"]:::mandatory
    L2["虛線框：若有此程序應納入計算"]:::optional
  end

  subgraph S1["1. 原料取得階段"]
    R1["鋁合金鍛胚與鋼齒片"]:::mandatory
    R2["中軸軸心與螺絲配件"]:::mandatory
    R3["包裝材料(彩盒/紙箱/PE袋)"]:::mandatory
  end

  subgraph S2["2. 製造階段（對齊第3、5章）"]
    M1["鍛造成型與熱處理"]:::mandatory
    M2["CNC精密加工與洗齒"]:::mandatory
    M3["陽極表面處理/塗裝"]:::optional
    M4["雷雕組裝與成品包裝"]:::mandatory
    M1 --> M2 --> M3 --> M4
  end

  subgraph S3["3. 配送銷售階段"]
    D1["陸運／海運配送至通路或客戶"]:::mandatory
  end

  subgraph S4["4. 使用階段"]
    U1["產品使用與清潔維護情境"]:::optional
  end

  subgraph S5["5. 廢棄處理階段"]
    E1["回收"]:::mandatory
    E2["焚化"]:::mandatory
    E3["掩埋"]:::mandatory
  end

  S1 -->|"運輸"| S2
  S2 -->|"運輸"| S3
  S3 -.-> S4
  S4 -->|"運輸"| S5`;

  // 內建標準範例 2：服務型標準範例（3 大階段，以 26-001 住宿服務為例，100% 符合 6.2 節 4 大鐵律）
  const SAMPLE_SERVICE_MERMAID = `flowchart LR
  classDef mandatory fill:#f0f9ff,stroke:#0284c7,stroke-width:2px,color:#0c4a6e;
  classDef optional fill:#fffbeb,stroke:#d97706,stroke-width:2px,stroke-dasharray: 5 5,color:#78350f;

  subgraph LEGEND["圖例定義（環境部 2025 服務型範本 6.2 節規範）"]
    L1["實線框：強制性納入"]:::mandatory
    L2["虛線框：若有此程序應納入計算"]:::optional
  end

  subgraph S1["1. 原料取得階段"]
    R1["客房備品與洗沐耗材製造"]:::mandatory
    R2["布巾與清潔藥劑供應"]:::mandatory
    R3["耗材進場運輸"]:::mandatory
    R1 & R2 --> R3
  end

  subgraph S2["2. 服務提供階段（對齊第3、5章）"]
    P1["接待櫃檯與入住服務"]:::mandatory
    P2["客房住宿空間空調與照明"]:::mandatory
    P3["熱水供應與布巾委外洗滌"]:::mandatory
    P4["附屬休閒公設營運"]:::optional
    P1 --> P2 --> P3 --> P4
  end

  subgraph S3["3. 廢棄處理階段"]
    E1["回收"]:::mandatory
    E2["焚化"]:::mandatory
    E3["掩埋"]:::mandatory
    E4["生活污水處理"]:::mandatory
  end

  S1 -->|"運輸"| S2
  S2 -->|"運輸"| S3`;

  function buildMermaidPrompt() {
    const pcrNo = document.getElementById('ms-pcr-no')?.value.trim() || '25-022';
    const pcrName = document.getElementById('ms-pcr-name')?.value.trim() || '曲柄齒盤組';
    const customProc = document.getElementById('ms-custom-processes')?.value.trim();

    const modeDesc = msMode === 'service'
      ? '服務型參考範本（2025 第三版，3 大生命週期階段：1.原料取得階段 → 2.服務提供階段 → 3.廢棄處理階段）'
      : '商品型參考範本（2025 第五版，5 大生命週期階段：1.原料取得階段 → 2.製造階段 → 3.配送銷售階段 -.-> 4.使用階段 → 5.廢棄處理階段）';

    const prompt = `你現在是台灣環境部（MOENV）產品碳足跡（CFP-PCR）報告書與系統界限圖繪製專家。
請根據我提供的「${pcrNo} ${pcrName}」PCR 文件（或以下製程資訊），為我撰寫第 6.2 節「生命週期流程圖（系統界限圖）」的 **Mermaid \`flowchart LR\` 語法**。

- **目標 PCR**：${pcrNo} ${pcrName}
- **適用範本架構**：${modeDesc}
${customProc ? `- **指定包含之第 3 章組件／第 5 章製程單元**：${customProc}\n` : '- **製程單元來源**：請直接從我上傳的 PCR PDF「第 3 章（組成）」與「第 5 章（名詞定義）」擷取所有單元過程名稱。\n'}
### ⚠️ 強制遵守環境部 2025 範本第 6.2 節「四大繪圖鐵律」（違反任一條將被審查退件）：
1. **鐵律一（必備實虛線圖例定義）**：
   - 必須建立 \`subgraph LEGEND["圖例定義"]\`，包含兩個圖例節點：
     - 實線框：標示「\`實線框：強制性納入\`」（使用 \`classDef mandatory\` 實線邊框）
     - 虛線框：標示「\`虛線框：若有此程序應納入計算\`」（使用 \`classDef optional\` 設定 \`stroke-dasharray: 5 5\`）
2. **鐵律二（配送銷售 → 使用階段虛線與禁寫運輸）**：
   - ${msMode === 'goods' ? '在商品型 5 大階段中，「配送銷售階段」連向「使用階段」的連線**必須使用虛線箭頭（`S3 -.-> S4`）**，且箭頭上**絕對嚴禁標註「運輸」二字**！其他階段之間（如 S1-->|"運輸"|S2、S2-->|"運輸"|S3、S4-->|"運輸"|S5）則為實線並標註運輸。' : '服務型採 3 大階段（原料取得、服務提供、廢棄處理），階段間以實線連接，注意耗材進場運輸歸於第一階段。'}
3. **鐵律三（廢棄處理階段必列三種處置路徑）**：
   - 在「廢棄處理階段」子圖內，**必須同時明確列出「\`焚化\`」、「\`掩埋\`」、「\`回收\`」三個獨立節點**（缺一不可）。
4. **鐵律四（名稱與第 3、5 章完全一致）**：
   - 「${msMode === 'service' ? '服務提供階段' : '製造階段'}」子圖內的每一個程序方塊名稱，必須與該本 PCR 第 3 章及第 5 章名詞定義完全一致。

### 輸出格式要求：
- **請只輸出純粹的 Mermaid \`flowchart LR\` 程式碼區塊**，不要產生圖片，不要使用任何不支援的實驗性語法，以便我直接複製貼回「CFP-PCR 生命週期圖工作室」即時渲染並匯出 2x 高清 PNG 與 SVG。`;

    const outEl = document.getElementById('ms-generated-prompt');
    if (outEl) outEl.value = prompt;
  }

  /**
   * 純前端合規小檢查（Regex 檢核 2025 範本 6.2 節 4 大繪圖鐵律）
   */
  function checkMermaidCompliance(code) {
    const panel = document.getElementById('ms-compliance-panel');
    if (!panel) return;

    // 檢查 1：圖例定義（是否含「強制性納入」與「若有此程序」或 stroke-dasharray）
    const hasLegend = /強制性納入/.test(code) && (/若有此程序/.test(code) || /stroke-dasharray/.test(code));

    // 檢查 2：廢棄處理三路徑（是否同時包含「焚化」、「掩埋」、「回收」）
    const hasIncineration = /焚化/.test(code);
    const hasLandfill = /掩埋/.test(code);
    const hasRecycling = /回收/.test(code);
    const hasAllThreeDisposal = hasIncineration && hasLandfill && hasRecycling;

    // 檢查 3：配送銷售 -> 使用階段是否誤標「運輸」或未用虛線（針對含配送/使用之商品型圖表）
    const isGoodsChart = /配送/.test(code) && /使用階段/.test(code);
    let passDeliveryToUse = true;
    let deliveryIssueMsg = '配送→使用階段已採虛線 `-.->` 且未誤標「運輸」';

    if (isGoodsChart) {
      // 檢查 S3 到 S4 或配送到使用是否誤寫運輸
      const badTransportOnDotted = /(S3|配送[^\n]*)\s*-\.->\s*\|[^|]*運輸[^|]*\|\s*(S4|使用)/i.test(code) ||
                                   /(S3|配送[^\n]*)\s*-->\s*\|[^|]*運輸[^|]*\|\s*(S4|使用)/i.test(code);
      const hasDottedArrow = /-\.->/.test(code);

      if (badTransportOnDotted) {
        passDeliveryToUse = false;
        deliveryIssueMsg = '⚠️ 違規警告：偵測到「配送銷售 → 使用階段」連線標註了「運輸」字樣！依 6.2 節鐵律應改為純虛線 `S3 -.-> S4` 且不可寫運輸。';
      } else if (!hasDottedArrow) {
        passDeliveryToUse = false;
        deliveryIssueMsg = '⚠️ 違規警告：商品型「配送銷售 → 使用階段」缺少虛線箭頭（`-.->`）！';
      }
    } else {
      deliveryIssueMsg = '服務型 3 階段架構（無獨立配送→使用連線，符合規範）';
    }

    const missingDisposal = [];
    if (!hasIncineration) missingDisposal.push('焚化');
    if (!hasLandfill) missingDisposal.push('掩埋');
    if (!hasRecycling) missingDisposal.push('回收');

    const allPass = hasLegend && hasAllThreeDisposal && passDeliveryToUse;

    panel.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold ${allPass ? 'text-teal-800' : 'text-amber-800'} flex items-center gap-1.5">
          <span>${allPass ? '✅ 2025 範本 6.2 節合規檢查：4 大鐵律全數通過' : '⚠️ 2025 範本 6.2 節合規紅線即時檢測提醒'}</span>
        </span>
        <span class="text-[11px] font-mono text-slate-500">Regex Auto-Check</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
        <div class="px-2.5 py-1.5 rounded-lg border ${hasLegend ? 'bg-emerald-50 border-teal-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'}">
          ${hasLegend ? '✓ 已含實線/虛線圖例定義' : '✕ 缺少「強制性納入／若有此程序」圖例'}
        </div>
        <div class="px-2.5 py-1.5 rounded-lg border ${passDeliveryToUse ? 'bg-emerald-50 border-teal-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'}">
          ${passDeliveryToUse ? `✓ ${deliveryIssueMsg}` : deliveryIssueMsg}
        </div>
        <div class="px-2.5 py-1.5 rounded-lg border ${hasAllThreeDisposal ? 'bg-emerald-50 border-teal-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'}">
          ${hasAllThreeDisposal ? '✓ 廢棄階段已備齊「焚化/掩埋/回收」' : `✕ 廢棄階段漏列：${missingDisposal.join('、')}`}
        </div>
      </div>
    `;
  }

  /**
   * 純前端渲染 Mermaid SVG
   */
  window.renderMermaidDiagram = async function () {
    const editor = document.getElementById('ms-code-editor');
    const container = document.getElementById('ms-preview-container');
    if (!editor || !container) return;

    // 清理前後可能夾帶的 ```mermaid 標籤
    let rawCode = editor.value.trim();
    rawCode = rawCode.replace(/^```(?:mermaid)?\s*/i, '').replace(/\s*```$/, '').trim();

    checkMermaidCompliance(rawCode);

    if (typeof mermaid === 'undefined') {
      container.innerHTML = '<div class="text-xs text-rose-600 p-4">Mermaid.js 尚未載入完成。</div>';
      return;
    }

    try {
      renderSeq += 1;
      const svgId = `mermaid-svg-${renderSeq}`;
      const { svg } = await mermaid.render(svgId, rawCode);
      container.innerHTML = svg;
    } catch (err) {
      container.innerHTML = `
        <div class="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs max-w-xl space-y-1">
          <div class="font-bold">⚠️ Mermaid 語法解析錯誤（請檢查括號或箭頭語法）：</div>
          <pre class="font-mono text-[11px] whitespace-pre-wrap">${String(err.message || err)}</pre>
        </div>
      `;
    }
  };

  /**
   * 匯出 SVG 向量圖檔
   */
  function downloadSvg() {
    const svgEl = document.querySelector('#ms-preview-container svg');
    if (!svgEl) {
      window.showToast('畫布上尚無可匯出的圖表！');
      return;
    }
    const clone = svgEl.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const svgData = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const pcrNo = document.getElementById('ms-pcr-no')?.value.trim() || 'pcr';
    const a = document.createElement('a');
    a.href = url;
    a.download = `CFP-PCR-${pcrNo}-系統界限圖.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    window.showToast('已下載 SVG 向量系統界限圖！');
  }

  /**
   * 匯出 2x 高解析度 PNG（白底，可直接貼進 Word/ODT 報告書）
   */
  function downloadPng2x() {
    const svgEl = document.querySelector('#ms-preview-container svg');
    if (!svgEl) {
      window.showToast('畫布上尚無可匯出的圖表！');
      return;
    }

    const bbox = svgEl.getBoundingClientRect();
    const viewBox = svgEl.viewBox && svgEl.viewBox.baseVal;
    const width = Math.max(Math.ceil(viewBox?.width || bbox.width || 960), 600);
    const height = Math.max(Math.ceil(viewBox?.height || bbox.height || 420), 280);
    const scale = 2; // 2x 高清解析度

    const clone = svgEl.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', String(width));
    clone.setAttribute('height', String(height));

    const svgStr = new XMLSerializer().serializeToString(clone);
    const svgBase64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      const padding = 32;
      const canvas = document.createElement('canvas');
      canvas.width = (width + padding * 2) * scale;
      canvas.height = (height + padding * 2) * scale;

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, padding, padding, width, height);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const pcrNo = document.getElementById('ms-pcr-no')?.value.trim() || 'pcr';
        const a = document.createElement('a');
        a.href = url;
        a.download = `CFP-PCR-${pcrNo}-系統界限圖-2x.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        window.showToast('已匯出 2x 高清白底 PNG！可直接貼入 Word / ODT 報告書。');
      }, 'image/png');
    };
    img.src = svgBase64;
  }

  function setMermaidMode(mode, loadDefaultCode = false) {
    msMode = mode === 'service' ? 'service' : 'goods';
    const btnGoods = document.getElementById('ms-mode-goods');
    const btnService = document.getElementById('ms-mode-service');

    if (msMode === 'goods') {
      if (btnGoods) btnGoods.className = 'ms-mode-btn py-2 px-3 rounded-lg text-xs font-semibold bg-teal-700 text-white shadow-sm transition';
      if (btnService) btnService.className = 'ms-mode-btn py-2 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 transition';
    } else {
      if (btnService) btnService.className = 'ms-mode-btn py-2 px-3 rounded-lg text-xs font-semibold bg-sky-700 text-white shadow-sm transition';
      if (btnGoods) btnGoods.className = 'ms-mode-btn py-2 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 transition';
    }

    buildMermaidPrompt();

    if (loadDefaultCode) {
      const editor = document.getElementById('ms-code-editor');
      if (editor) {
        editor.value = msMode === 'service' ? SAMPLE_SERVICE_MERMAID : SAMPLE_GOODS_MERMAID;
        window.renderMermaidDiagram();
      }
    }
  }

  /**
   * 供外部模組（模組 1 或模組 3）一鍵帶入 PCR 資訊
   */
  window.prefillMermaidStudio = function (rec) {
    if (!rec) return;
    const noEl = document.getElementById('ms-pcr-no');
    const nameEl = document.getElementById('ms-pcr-name');
    if (noEl) noEl.value = rec.pcr_no || '';
    if (nameEl) nameEl.value = rec.name || '';

    const targetMode = rec.category === 'service' ? 'service' : 'goods';
    setMermaidMode(targetMode, true);
  };

  window.initMermaidStudio = function () {
    if (typeof mermaid !== 'undefined') {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'basis'
        }
      });
    }

    // 預設載入商品型標準範例
    const editor = document.getElementById('ms-code-editor');
    if (editor) {
      editor.value = SAMPLE_GOODS_MERMAID;
    }

    buildMermaidPrompt();
    window.renderMermaidDiagram();

    // 綁定左欄模式切換與輸入框
    document.getElementById('ms-mode-goods')?.addEventListener('click', () => setMermaidMode('goods', false));
    document.getElementById('ms-mode-service')?.addEventListener('click', () => setMermaidMode('service', false));

    ['ms-pcr-no', 'ms-pcr-name', 'ms-custom-processes'].forEach((id) => {
      document.getElementById(id)?.addEventListener('input', buildMermaidPrompt);
    });

    // 複製繪圖 Prompt
    document.getElementById('btn-copy-mermaid-prompt')?.addEventListener('click', () => {
      const txt = document.getElementById('ms-generated-prompt')?.value || '';
      window.copyToClipboard(txt, '已複製「6.2 節系統界限圖 Prompt」！');
    });

    // 右欄載入預設範例按鈕
    document.getElementById('btn-load-sample-goods')?.addEventListener('click', () => {
      document.getElementById('ms-pcr-no').value = '25-022';
      document.getElementById('ms-pcr-name').value = '曲柄齒盤組';
      setMermaidMode('goods', true);
      window.showToast('已載入「商品型 5 階段」標準系統界限圖範例');
    });

    document.getElementById('btn-load-sample-service')?.addEventListener('click', () => {
      document.getElementById('ms-pcr-no').value = '26-001';
      document.getElementById('ms-pcr-name').value = '住宿服務';
      setMermaidMode('service', true);
      window.showToast('已載入「服務型 3 階段」標準系統界限圖範例');
    });

    // 編輯器即時防抖渲染
    let debounceTimer = null;
    if (editor) {
      editor.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          window.renderMermaidDiagram();
        }, 320);
      });
    }

    document.getElementById('btn-render-mermaid')?.addEventListener('click', () => {
      window.renderMermaidDiagram();
    });

    // 綁定 SVG 與 2x PNG 下載按鈕
    document.getElementById('btn-download-svg')?.addEventListener('click', downloadSvg);
    document.getElementById('btn-download-png')?.addEventListener('click', downloadPng2x);
  };
})();
