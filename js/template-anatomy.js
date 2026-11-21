/**
 * template-anatomy.js — 模組 2：2025 雙範本互動解剖室 + 14 章雙欄手風琴 + 10% 上游門檻試算器 + 三大避雷卡（明亮環保綠系版）
 */

(function () {
  let tplData = null;
  let currentTrack = 'goods';

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderStageBanner(trackKey) {
    const banner = document.getElementById('anatomy-stage-banner');
    if (!banner || !tplData) return;

    const track = tplData.tracks[trackKey];
    if (!track) return;

    const stagesHtml = track.stages.map((st, idx) => {
      const arrow = idx < track.stages.length - 1
        ? `<span class="text-slate-400 font-mono text-xs">${trackKey === 'goods' && idx === 2 ? '-.-> (虛線禁寫運輸)' : '→'}</span>`
        : '';
      return `
        <div class="flex items-center gap-2">
          <div class="px-3 py-1.5 rounded-xl border ${trackKey === 'goods' ? 'bg-teal-50 border-teal-200 text-teal-800' : 'bg-sky-50 border-sky-200 text-sky-800'} text-xs font-semibold">
            <span class="font-mono opacity-75 mr-1">S${idx + 1}</span>${escapeHtml(st)}
          </div>
          ${arrow}
        </div>
      `;
    }).join('');

    banner.innerHTML = `
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs font-bold text-slate-600">法定生命週期階段架構：</span>
          ${stagesHtml}
        </div>
        <div class="text-xs text-slate-600">
          對應分類系統：<strong class="text-slate-900">${escapeHtml(track.classification_system)}</strong>
        </div>
      </div>
    `;
  }

  function renderChaptersAccordion(trackKey) {
    const container = document.getElementById('anatomy-chapters-list');
    if (!container || !tplData) return;

    const track = tplData.tracks[trackKey];
    if (!track || !track.chapters) return;

    const defaultOpenIndices = new Set([0, 3, 5, 6, 7, 9]);

    container.innerHTML = track.chapters.map((ch, idx) => {
      const isOpen = defaultOpenIndices.has(idx);
      const isHighlight = [3, 5, 6, 7, 9].includes(idx);

      return `
        <div class="chapter-item bg-white border ${isHighlight ? 'border-teal-300' : 'border-slate-200'} rounded-2xl overflow-hidden shadow-sm">
          <button type="button" data-ch-toggle="${idx}"
                  class="w-full px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition">
            <div class="flex items-center gap-3 flex-wrap">
              <span class="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold ${isHighlight ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}">
                ${escapeHtml(ch.chapter_no)}
              </span>
              <span class="text-sm sm:text-base font-bold text-slate-900">${escapeHtml(ch.title)}</span>
              ${isHighlight ? '<span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">★ 查驗核心章節</span>' : ''}
            </div>
            <span class="ch-arrow text-slate-400 font-mono text-sm transition-transform ${isOpen ? 'rotate-180' : ''}">▼</span>
          </button>

          <div data-ch-body="${idx}" class="${isOpen ? '' : 'hidden'} px-5 pb-5 pt-3 border-t border-slate-100 bg-slate-50/50 space-y-3">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <!-- 左欄：環境部 2025 範本章節結構與重點要求 -->
              <div class="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-sm">
                <div class="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <span>📜</span>
                  <span>環境部 2025 範本條文規範重點</span>
                </div>
                <p class="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">${escapeHtml(ch.official_spec)}</p>
              </div>

              <!-- 右欄：白話翻譯（這條在 ISO 14067 Excel 盤查表要怎麼做） -->
              <div class="p-4 rounded-xl bg-teal-50/60 border border-teal-200 space-y-1.5 shadow-sm">
                <div class="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                  <span>📊</span>
                  <span>白話翻譯：在 ISO 14067 盤查表（Excel）要怎麼做？</span>
                </div>
                <p class="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">${escapeHtml(ch.excel_translation)}</p>
              </div>
            </div>

            <!-- 底部查驗檢核點 -->
            <div class="px-3.5 py-2 rounded-lg bg-amber-50 border border-amber-300 flex items-center gap-2 text-xs text-amber-900">
              <span>✅ <strong>查驗員必看檢核點：</strong></span>
              <span class="text-amber-950 font-medium">${escapeHtml(ch.key_checkpoint)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('[data-ch-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = btn.getAttribute('data-ch-toggle');
        const body = container.querySelector(`[data-ch-body="${idx}"]`);
        const arrow = btn.querySelector('.ch-arrow');
        if (body) {
          body.classList.toggle('hidden');
          arrow?.classList.toggle('rotate-180', !body.classList.contains('hidden'));
        }
      });
    });
  }

  function renderPitfallCards() {
    if (!tplData || !tplData.pitfall_cards) return;

    // 1. 三體系辨識卡
    const sysCard = document.getElementById('pitfall-three-systems');
    const sysInfo = tplData.pitfall_cards.three_systems;
    if (sysCard && sysInfo) {
      sysCard.innerHTML = `
        <div class="space-y-3">
          <div>
            <span class="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">避雷卡 1 · 規則體系</span>
            <h4 class="text-base sm:text-lg font-bold text-slate-900 mt-1.5">${escapeHtml(sysInfo.title)}</h4>
            <p class="text-xs text-slate-600 mt-0.5">${escapeHtml(sysInfo.subtitle)}</p>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th class="py-2.5 px-2">規則體系</th>
                  <th class="py-2.5 px-2">有效筆數</th>
                  <th class="py-2.5 px-2">效期特性</th>
                  <th class="py-2.5 px-2">引用與碳標籤實務建議</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                ${sysInfo.rows.map((r) => `
                  <tr class="hover:bg-slate-50/80">
                    <td class="py-2.5 px-2 font-bold text-teal-800 whitespace-nowrap">${escapeHtml(r.system)}</td>
                    <td class="py-2.5 px-2 font-mono font-semibold text-slate-800">${r.count} 筆</td>
                    <td class="py-2.5 px-2 text-slate-700">${escapeHtml(r.validity)}</td>
                    <td class="py-2.5 px-2 text-slate-700 leading-relaxed">${escapeHtml(r.action_guide)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    // 2. 2025 新版 vs 2020 舊版判讀對照卡
    const verCard = document.getElementById('pitfall-version-comparison');
    const verInfo = tplData.pitfall_cards.version_comparison;
    if (verCard && verInfo) {
      verCard.innerHTML = `
        <div class="space-y-3">
          <div>
            <span class="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300">避雷卡 2 · 新舊版對照</span>
            <h4 class="text-base sm:text-lg font-bold text-slate-900 mt-1.5">${escapeHtml(verInfo.title)}</h4>
            <p class="text-xs text-slate-600 mt-0.5">${escapeHtml(verInfo.subtitle)}</p>
          </div>
          <div class="space-y-2.5">
            ${verInfo.diffs.map((d) => `
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div class="font-bold text-slate-900">${escapeHtml(d.item)}</div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div class="text-slate-600"><span class="text-rose-700 font-mono font-semibold">[2020 舊版]</span> ${escapeHtml(d.old_2020)}</div>
                  <div class="text-slate-800"><span class="text-teal-700 font-mono font-semibold">[2025 新版]</span> ${escapeHtml(d.new_2025)}</div>
                </div>
                <div class="text-[11px] text-amber-800 font-medium pt-1">💡 實務提醒：${escapeHtml(d.tip)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }

  function updateThresholdCalculator() {
    const mfgVal = Math.max(0, parseFloat(document.getElementById('calc-mfg-input')?.value) || 0);
    const upVal = Math.max(0, parseFloat(document.getElementById('calc-upstream-input')?.value) || 0);
    const downVal = Math.max(0, parseFloat(document.getElementById('calc-downstream-input')?.value) || 0);

    const total = mfgVal + upVal + downVal;
    const box = document.getElementById('calc-result-box');
    if (!box) return;

    if (total <= 0) {
      box.className = 'lg:col-span-5 rounded-2xl p-5 border border-slate-200 bg-slate-50 text-xs text-slate-600';
      box.innerHTML = '請輸入大於 0 的預估碳排放量數值。';
      return;
    }

    const mfgRatio = (mfgVal / total) * 100;
    const requiredTotalPrimary = total * 0.10;
    const shortfallKg = Math.max(0, requiredTotalPrimary - mfgVal);
    const shortfallPctOfTotal = Math.max(0, 10 - mfgRatio);
    const shortfallPctOfUpstream = upVal > 0 ? (shortfallKg / upVal) * 100 : 0;

    if (mfgRatio >= 10) {
      box.className = 'lg:col-span-5 rounded-2xl p-5 border border-emerald-300 bg-emerald-50/70 space-y-3 shadow-sm';
      box.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            ✓ 符合 10.2.2 節一級數據門檻
          </span>
          <span class="text-xs font-mono text-slate-600">總碳排 ${total.toFixed(1)} kgCO2e</span>
        </div>
        <div>
          <div class="text-xs font-medium text-slate-700">本廠製造／服務階段一級數據貢獻率：</div>
          <div class="text-3xl font-bold font-mono text-emerald-700 mt-0.5">${mfgRatio.toFixed(2)}% <span class="text-sm font-normal text-emerald-800">(≥ 10% 法定門檻)</span></div>
        </div>
        <div class="w-full bg-emerald-200/70 h-2.5 rounded-full overflow-hidden">
          <div class="bg-emerald-600 h-full" style="width: ${Math.min(100, mfgRatio)}%"></div>
        </div>
        <p class="text-xs text-slate-700 leading-relaxed">
          🎉 <strong>判定結果：</strong>貴司本廠製造／服務提供階段（100% 一級活動數據）已佔基準總排放量 <strong>${mfgRatio.toFixed(2)}%</strong>，直接滿足第 10.2.2 節「一級數據貢獻率 ≥ 10%」之規定！上游原物料可合規採用環境部或國際資料庫之二級係數（惟若有個別特定規定仍依該 PCR 辦理）。
        </p>
      `;
    } else {
      box.className = 'lg:col-span-5 rounded-2xl p-5 border border-rose-300 bg-rose-50/70 space-y-3 shadow-sm';
      box.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            ⚠️ 警告：未達 10% 一級數據門檻！
          </span>
          <span class="text-xs font-mono text-slate-600">總碳排 ${total.toFixed(1)} kgCO2e</span>
        </div>
        <div>
          <div class="text-xs font-medium text-rose-800">目前本廠製造／服務階段貢獻率僅：</div>
          <div class="text-3xl font-bold font-mono text-rose-700 mt-0.5">${mfgRatio.toFixed(2)}% <span class="text-sm font-normal text-rose-800">(&lt; 10% 法定門檻)</span></div>
        </div>
        <div class="w-full bg-rose-200/70 h-2.5 rounded-full overflow-hidden relative">
          <div class="bg-rose-600 h-full" style="width: ${Math.max(4, mfgRatio)}%"></div>
        </div>
        <div class="p-3 rounded-xl bg-white border border-rose-200 space-y-1.5 text-xs">
          <div class="font-bold text-amber-800">📌 法定補救行動（依 2025 範本 10.2.2 節）：</div>
          <p class="text-slate-700 leading-relaxed">
            尚須向上游原物料供應商追回至少 <strong class="text-rose-700 font-mono text-sm">${shortfallKg.toFixed(2)} kgCO2e</strong> 之供應商一級盤查數據（相當於總碳排的 <strong class="text-rose-700 font-mono">${shortfallPctOfTotal.toFixed(2)}%</strong>，或佔上游原料總排放量的 <strong class="text-amber-800 font-mono">${shortfallPctOfUpstream.toFixed(1)}%</strong>），方能通過查驗！
          </p>
        </div>
      `;
    }
  }

  window.initTemplateAnatomy = function (data) {
    tplData = data;
    renderStageBanner(currentTrack);
    renderChaptersAccordion(currentTrack);
    renderPitfallCards();

    const btnGoods = document.getElementById('btn-track-goods');
    const btnService = document.getElementById('btn-track-service');

    function setTrack(trackKey) {
      currentTrack = trackKey;
      if (trackKey === 'goods') {
        btnGoods.className = 'anatomy-track-btn px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-teal-700 text-white shadow-sm transition';
        btnService.className = 'anatomy-track-btn px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition';
      } else {
        btnService.className = 'anatomy-track-btn px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-sky-700 text-white shadow-sm transition';
        btnGoods.className = 'anatomy-track-btn px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition';
      }
      renderStageBanner(trackKey);
      renderChaptersAccordion(trackKey);
    }

    btnGoods?.addEventListener('click', () => setTrack('goods'));
    btnService?.addEventListener('click', () => setTrack('service'));

    document.getElementById('btn-expand-all-chapters')?.addEventListener('click', () => {
      document.querySelectorAll('[data-ch-body]').forEach((el) => el.classList.remove('hidden'));
      document.querySelectorAll('.ch-arrow').forEach((el) => el.classList.add('rotate-180'));
    });
    document.getElementById('btn-collapse-all-chapters')?.addEventListener('click', () => {
      document.querySelectorAll('[data-ch-body]').forEach((el) => el.classList.add('hidden'));
      document.querySelectorAll('.ch-arrow').forEach((el) => el.classList.remove('rotate-180'));
    });

    const pairs = [
      ['calc-mfg-input', 'calc-mfg-slider'],
      ['calc-upstream-input', 'calc-upstream-slider'],
      ['calc-downstream-input', 'calc-downstream-slider']
    ];

    pairs.forEach(([inputId, sliderId]) => {
      const inp = document.getElementById(inputId);
      const sld = document.getElementById(sliderId);
      if (inp && sld) {
        inp.addEventListener('input', () => {
          sld.value = inp.value;
          updateThresholdCalculator();
        });
        sld.addEventListener('input', () => {
          inp.value = sld.value;
          updateThresholdCalculator();
        });
      }
    });

    document.querySelectorAll('[data-calc-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-calc-preset');
        const mfgInp = document.getElementById('calc-mfg-input');
        const mfgSld = document.getElementById('calc-mfg-slider');
        const upInp = document.getElementById('calc-upstream-input');
        const upSld = document.getElementById('calc-upstream-slider');
        const dnInp = document.getElementById('calc-downstream-input');
        const dnSld = document.getElementById('calc-downstream-slider');

        if (preset === 'assembly') {
          if (mfgInp) mfgInp.value = 4;
          if (mfgSld) mfgSld.value = 4;
          if (upInp) upInp.value = 86;
          if (upSld) upSld.value = 86;
          if (dnInp) dnInp.value = 10;
          if (dnSld) dnSld.value = 10;
        } else {
          if (mfgInp) mfgInp.value = 25;
          if (mfgSld) mfgSld.value = 25;
          if (upInp) upInp.value = 65;
          if (upSld) upSld.value = 65;
          if (dnInp) dnInp.value = 10;
          if (dnSld) dnSld.value = 10;
        }
        updateThresholdCalculator();
      });
    });

    updateThresholdCalculator();
  };
})();
