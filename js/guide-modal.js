/**
 * guide-modal.js — Phase 6 附錄彈窗：找不到適用 PCR？《碳足跡產品類別規則訂定、引用及修訂指引》法定四階段流程引導
 */

(function () {
  function renderGuideContent() {
    const body = document.getElementById('pcr-guide-modal-body');
    if (!body) return;

    body.innerHTML = `
      <!-- 標題列 -->
      <div class="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-300">
            依據環境部《碳足跡產品類別規則訂定、引用及修訂指引》（民國 109 年修正）
          </span>
          <h3 class="text-xl font-bold text-slate-900 mt-2">🧭 找不到適用 PCR 怎麼辦？法定訂定四階段與引用捷徑</h3>
          <p class="text-xs text-slate-500 mt-0.5">
            當全庫 208 筆有效 PCR 之 CCC Code 或 4 碼行業分類均無法涵蓋貴司產品／服務時，可依指引申請新訂或引用國際／EPD PCR。
          </p>
        </div>
        <button type="button" id="btn-close-guide-modal" class="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-sm">✕</button>
      </div>

      <!-- 1. 申請資格確認 -->
      <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
        <div class="text-xs font-bold text-teal-800 flex items-center gap-1.5">
          <span>🏛️</span>
          <span>一、誰有資格發起訂定 PCR？（法定四類申請主體）</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs pt-1">
          <div class="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800">
            <strong class="text-slate-900 block">① 製造商</strong>
            實際從事該項商品生產製造之企業（常聯合同業或上下游共同制定）。
          </div>
          <div class="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800">
            <strong class="text-slate-900 block">② 服務業者</strong>
            具合法營業登記並提供該項服務之機構（如醫院、飯店、貨櫃商）。
          </div>
          <div class="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800">
            <strong class="text-slate-900 block">③ 同業公（協、商）會</strong>
            代表產業公信力之公協會或法人研究機構（最受環境部鼓勵）。
          </div>
          <div class="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800">
            <strong class="text-slate-900 block">④ 政府機關（構）</strong>
            目的事業主管機關（如農業部農糧署、交通部觀光署、經濟部等）。
          </div>
        </div>
      </div>

      <!-- 2. 法定訂定四階段視覺化時間軸（6 個月時限） -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-sky-800">⏱️ 二、法定訂定四階段時間軸（核發編號後 6 個月內須完成）</span>
          <span class="text-[11px] font-mono text-amber-800">逾期未完成且未申請展延者將註銷編號</span>
        </div>

        <div class="relative pl-6 border-l-2 border-teal-300 space-y-4">
          <!-- 階段 1 -->
          <div class="relative bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <span class="absolute -left-[33px] top-3.5 w-6 h-6 rounded-full bg-teal-700 text-white font-mono text-xs font-bold flex items-center justify-center shadow">1</span>
            <div class="flex items-center justify-between flex-wrap gap-2">
              <h4 class="text-sm font-bold text-slate-900">第一階段：初始階段（提交基本資料表 → 核發登錄編號）</h4>
              <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800">起算日 Day 0</span>
            </div>
            <p class="text-xs text-slate-700 mt-1 leading-relaxed">
              至環境部產品碳足跡資訊網填具「PCR 基本資料表」（明確定義產品/服務名稱、CCC Code 或 4 碼行業分類碼、預定採用之 2025 商品型第五版或服務型第三版範本）。經審核無重複後，環境部核發<strong>「PCR 登錄編號（如 26-XXX）」</strong>。
            </p>
          </div>

          <!-- 階段 2 -->
          <div class="relative bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <span class="absolute -left-[33px] top-3.5 w-6 h-6 rounded-full bg-teal-700 text-white font-mono text-xs font-bold flex items-center justify-center shadow">2</span>
            <div class="flex items-center justify-between flex-wrap gap-2">
              <h4 class="text-sm font-bold text-slate-900">第二階段：準備階段（撰寫草案第一版 & 公開預告 ≥ 14 天）</h4>
              <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-800">公開徵詢 ≥ 14 日</span>
            </div>
            <p class="text-xs text-slate-700 mt-1 leading-relaxed">
              嚴格依循環境部《2025 參考範本》撰寫 PCR 草案第一版，送交環境部上傳至產品碳足跡資訊網進行公開預告，徵詢各界意見<strong>至少 14 日曆天</strong>。
            </p>
          </div>

          <!-- 階段 3 -->
          <div class="relative bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <span class="absolute -left-[33px] top-3.5 w-6 h-6 rounded-full bg-teal-700 text-white font-mono text-xs font-bold flex items-center justify-center shadow">3</span>
            <div class="flex items-center justify-between flex-wrap gap-2">
              <h4 class="text-sm font-bold text-slate-900">第三階段：磋商階段（利害相關者會議＋3 位以上專家學者 → 草案二版預告）</h4>
              <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800">關鍵審查門檻</span>
            </div>
            <p class="text-xs text-slate-700 mt-1 leading-relaxed">
              召開實體或視訊利害相關者磋商會議：必須廣泛邀請同業公會與上下游代表，並聘請<strong>「3 位以上相關領域專家學者（其中至少 1 位須具備 LCA 生命週期評估或碳足跡查驗資歷）」</strong>出席審查。彙整意見修正後提出「草案第二版」再次上網預告。
            </p>
          </div>

          <!-- 階段 4 -->
          <div class="relative bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <span class="absolute -left-[33px] top-3.5 w-6 h-6 rounded-full bg-teal-700 text-white font-mono text-xs font-bold flex items-center justify-center shadow">4</span>
            <div class="flex items-center justify-between flex-wrap gap-2">
              <h4 class="text-sm font-bold text-slate-900">第四階段：完成階段（6 個月內提送完備性檢核 → 工作小組審查公告）</h4>
              <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-800">6 個月法定期限</span>
            </div>
            <p class="text-xs text-slate-700 mt-1 leading-relaxed">
              自核發登錄編號起 <strong>6 個月內</strong>，備齊 PCR 定稿、意見回覆對照表與完備性檢核表提送環境部。經工作小組審查通過後正式核准公告（現行統一為<strong>無有效期限</strong>），全國同業即可共同引用申請碳標籤！
            </p>
          </div>
        </div>
      </div>

      <!-- 3. EPD 引用捷徑提示 -->
      <div class="p-4 rounded-xl bg-gradient-to-r from-sky-50 to-teal-50 border border-sky-300 space-y-1.5">
        <div class="text-xs font-bold text-sky-800 flex items-center gap-1.5">
          <span>🚀</span>
          <span>三、快速通關捷徑：引用已公告認可之第三類環境宣告（EPD）或國際 PCR</span>
        </div>
        <p class="text-xs text-slate-800 leading-relaxed">
          若國內外已有公告認可之第三類環境宣告（ISO 14025 EPD-PCR，例如產發署/工研院制訂或國際 Environdec EPD）且涵蓋貴司產品 CCC Code，可免除從頭撰寫全文，改依指引提交<strong>「引用要求文件（補充台灣本土系統界限、電力係數與 GWP 規範）」</strong>，公開預告期可由 14 天<strong>大幅縮短為 7 天</strong>！
        </p>
      </div>

      <!-- 4. V2 預告 -->
      <div class="p-3.5 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div class="text-slate-700">
          <span class="px-2 py-0.5 rounded bg-purple-50 text-purple-800 font-mono text-[11px] mr-1.5">Roadmap V2 預告</span>
          即將上線<strong>「新建 PCR 草案撰寫 Skill」</strong>與<strong>「2025 範本錯別字／6.2 圖例紅線自動掃描器」</strong>！
        </div>
        <button type="button" id="btn-guide-bottom-close" class="px-4 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold shrink-0">
          我知道了，返回平台
        </button>
      </div>
    `;

    document.getElementById('btn-close-guide-modal')?.addEventListener('click', closeGuideModal);
    document.getElementById('btn-guide-bottom-close')?.addEventListener('click', closeGuideModal);
  }

  window.openGuideModal = function () {
    const modal = document.getElementById('pcr-guide-modal');
    if (!modal) return;
    renderGuideContent();
    modal.classList.remove('hidden');
  };

  function closeGuideModal() {
    const modal = document.getElementById('pcr-guide-modal');
    if (modal) modal.classList.add('hidden');
  }

  window.initGuideModal = function () {
    const openBtn = document.getElementById('btn-open-guide-modal');
    const modal = document.getElementById('pcr-guide-modal');

    if (openBtn) {
      openBtn.addEventListener('click', window.openGuideModal);
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeGuideModal();
        }
      });
    }
  };
})();
