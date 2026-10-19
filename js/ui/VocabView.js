/**
 * 学习标签面板：生词 + 语法练习，可切换、可折叠
 * @module ui/VocabView
 */

import { escapeHtml } from '../utils/escape.js';

const TABS_STORAGE_KEY = 'NCE_STUDY_TAB_STATE';

export class VocabView {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.container 生词面板容器
   * @param {HTMLElement} [options.grammarPanel] 语法面板容器
   * @param {HTMLElement} [options.tabsWrap] 标签整体容器
   * @param {HTMLElement} [options.tabVocab] 生词标签按钮
   * @param {HTMLElement} [options.tabGrammar] 语法标签按钮
   * @param {HTMLElement} [options.collapseBtn] 折叠按钮
   * @param {HTMLElement} [options.vocabCount] 生词数量角标
   * @param {HTMLElement} [options.grammarCount] 语法数量角标
   * @param {string} [options.baseUrl] 词汇数据基础路径
   */
  constructor(options = {}) {
    this.container = options.container;
    this.baseUrl = (options.baseUrl || 'vocab').replace(/\/$/, '');
    this.cache = new Map();
    this.loadedUnit = null;
    this.grammarCache = new Map();
    this.grammarPanel = options.grammarPanel || null;
    this.tabsWrap = options.tabsWrap || null;
    this.tabVocab = options.tabVocab || null;
    this.tabGrammar = options.tabGrammar || null;
    this.collapseBtn = options.collapseBtn || null;
    this.vocabCountEl = options.vocabCount || null;
    this.grammarCountEl = options.grammarCount || null;
    this.activeTab = 'vocab';
    this.collapsed = false;
    this.hasVocab = false;
    this.hasGrammar = false;
    this.ttsAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;
    this.#restoreTabState();
    this.#bind();
  }

  #restoreTabState() {
    try {
      const saved = localStorage.getItem(TABS_STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        if (state.collapsed) this.collapsed = true;
      }
    } catch { /* ignore */ }
  }

  #saveTabState() {
    try {
      localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify({ collapsed: this.collapsed }));
    } catch { /* ignore */ }
  }

  #bind() {
    if (this.container) {
      this.container.addEventListener('click', (event) => {
        const btn = event.target.closest('.vocab-speak-btn');
        if (!btn) return;
        const word = btn.closest('.vocab-item')?.dataset.word;
        if (word) this.speak(word);
      });
    }
    // 练习题交互：核对 / 显示答案
    this.grammarPanel?.addEventListener('click', (event) => {
      const ex = event.target.closest('.grammar-exercise');
      if (!ex) return;

      if (event.target.closest('.ex-check-btn')) {
        this.#checkExercise(ex);
      } else if (event.target.closest('.ex-reveal-btn')) {
        const result = ex.querySelector('.ex-result');
        result.hidden = false;
        result.textContent = `答案：${ex.dataset.answer}`;
        result.className = 'ex-result ex-revealed';
        ex.classList.remove('correct', 'wrong');
      } else if (event.target.matches('.ex-option')) {
        this.#selectOption(ex, event.target);
      }
    });
    this.grammarPanel?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || !event.target.matches('.ex-input')) return;
      this.#checkExercise(event.target.closest('.grammar-exercise'));
    });
    // 标签切换
    this.tabVocab?.addEventListener('click', () => this.#setActiveTab('vocab'));
    this.tabGrammar?.addEventListener('click', () => this.#setActiveTab('grammar'));
    this.collapseBtn?.addEventListener('click', () => {
      this.collapsed = !this.collapsed;
      this.#saveTabState();
      this.#applyTabState();
    });
  }

  #checkExercise(ex) {
    const input = ex.querySelector('.ex-input');
    const result = ex.querySelector('.ex-result');
    const expected = (ex.dataset.answer || '').trim().toLowerCase();
    const given = (input?.value || '').trim().toLowerCase();
    if (!given) {
      input?.focus();
      return;
    }
    const correct = given === expected;
    result.hidden = false;
    result.textContent = correct ? '✓ 正确！' : '✗ 不对，再想想（可点 💡 看答案）';
    result.className = `ex-result ${correct ? 'ex-ok' : 'ex-bad'}`;
    ex.classList.toggle('correct', correct);
    ex.classList.toggle('wrong', !correct);
  }

  #selectOption(ex, option) {
    const result = ex.querySelector('.ex-result');
    const expected = (ex.dataset.answer || '').trim().toLowerCase();
    const given = (option.dataset.value || '').trim().toLowerCase();
    const correct = given === expected;
    // 高亮选中项
    ex.querySelectorAll('.ex-option').forEach((b) => {
      b.classList.remove('selected', 'correct', 'wrong');
    });
    option.classList.add('selected', correct ? 'correct' : 'wrong');
    result.hidden = false;
    result.textContent = correct ? '✓ 正确！' : `✗ 正确答案：${ex.dataset.answer}`;
    result.className = `ex-result ${correct ? 'ex-ok' : 'ex-bad'}`;
    ex.classList.toggle('correct', correct);
    ex.classList.toggle('wrong', !correct);
  }

  #setActiveTab(tab) {
    this.activeTab = tab;
    this.collapsed = false;
    this.#applyTabState();
  }

  #applyTabState() {
    const vocabAvailable = this.hasVocab;
    const grammarAvailable = this.hasGrammar;
    this.tabsWrap && (this.tabsWrap.hidden = !(vocabAvailable || grammarAvailable));
    this.tabVocab && (this.tabVocab.hidden = !vocabAvailable);
    this.tabGrammar && (this.tabGrammar.hidden = !grammarAvailable);

    // 若当前标签无数据，自动跳到另一个
    if (this.activeTab === 'vocab' && !vocabAvailable) this.activeTab = 'grammar';
    if (this.activeTab === 'grammar' && !grammarAvailable) this.activeTab = 'vocab';

    if (this.tabVocab) {
      this.tabVocab.classList.toggle('active', this.activeTab === 'vocab' && !this.collapsed);
      this.tabVocab.setAttribute('aria-selected', String(this.activeTab === 'vocab'));
    }
    if (this.tabGrammar) {
      this.tabGrammar.classList.toggle('active', this.activeTab === 'grammar' && !this.collapsed);
      this.tabGrammar.setAttribute('aria-selected', String(this.activeTab === 'grammar'));
    }
    if (this.collapseBtn) {
      this.collapseBtn.textContent = this.collapsed ? '▸' : '▾';
    }
    if (this.container) {
      this.container.hidden = this.collapsed || this.activeTab !== 'vocab' || !this.hasVocab;
    }
    if (this.grammarPanel) {
      this.grammarPanel.hidden = this.collapsed || this.activeTab !== 'grammar' || !this.hasGrammar;
    }
  }

  /** 课程切换：重置到生词标签 */
  #resetTabOnUnitChange() {
    if (!this.hasVocab && this.hasGrammar) this.activeTab = 'grammar';
    else this.activeTab = 'vocab';
    if (this.container) this.container.scrollTop = 0;
    if (this.grammarPanel) this.grammarPanel.scrollTop = 0;
  }

  /**
   * 朗读单词（浏览器 TTS）
   * @param {string} word
   */
  speak(word) {
    if (!this.ttsAvailable || !word) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  /**
   * 切换课程时加载对应词汇数据；文件不存在时静默隐藏
   * @param {string} bookKey 课本 key（如 NCE1）
   * @param {string} filename 课程文件名
   * @param {AbortSignal} [signal]
   */
  async load(bookKey, filename, signal) {
    if (!this.container || !bookKey || !filename) return;

    const unitId = `${bookKey}/${filename}`;
    if (unitId === this.loadedUnit) return;
    this.loadedUnit = unitId;

    const url = `${this.baseUrl}/${encodeURIComponent(bookKey)}/${encodeURIComponent(filename)}.json`;

    let entries;
    if (this.cache.has(url)) {
      entries = this.cache.get(url);
    } else {
      try {
        const response = await fetch(url, { signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        entries = await response.json();
        this.cache.set(url, entries);
      } catch (error) {
        if (error?.name === 'AbortError') return;
        this.hasVocab = false;
        if (this.vocabCountEl) this.vocabCountEl.textContent = '';
        this.#applyTabState(); // 该课暂无词汇数据
        return;
      }
    }

    if (this.loadedUnit !== unitId) return;
    this.#resetTabOnUnitChange();
    this.render(entries);

    // 语法讲解数据（独立目录 grammar/）
    this.#loadGrammar(bookKey, filename, signal);
  }

  async #loadGrammar(bookKey, filename, signal) {
    const url = `grammar/${encodeURIComponent(bookKey)}/${encodeURIComponent(filename)}.json`;
    if (this.grammarCache.has(url)) {
      this.renderGrammar(this.grammarCache.get(url));
      return;
    }
    try {
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      this.grammarCache.set(url, data);
      this.renderGrammar(data);
    } catch (error) {
      if (error?.name === 'AbortError') return;
      this.renderGrammar(null); // 该课暂无语法数据
    }
  }

  /**
   * 渲染语法讲解区：概述 + 语法点（标题+讲解+例句）+ 练习（填空判定）
   * 数据格式: { grammar: {summary, points:[{title, explanation, examples:[{en,cn}]}]},
   *            exercises: [{q, a, type}] }
   * 兼容旧格式(数组)时降级为标题+段落。
   * @param {Object|null} data
   */
  renderGrammar(data) {
    const panel = this.grammarPanel;
    if (!panel) return;

    const g = data?.grammar;
    const isNew = g && !Array.isArray(g) && Array.isArray(g.points);
    const exCount = data?.exercises?.length || 0;
    const pointCount = isNew ? g.points.length : (Array.isArray(g) ? g.length : 0);
    const gCount = pointCount + exCount;
    this.hasGrammar = gCount > 0;
    if (this.grammarCountEl) {
      this.grammarCountEl.textContent = gCount ? ` ${gCount}` : '';
    }
    this.#applyTabState();

    if (!data || !this.hasGrammar) {
      panel.innerHTML = '';
      return;
    }

    let grammarHtml = '';
    if (isNew) {
      grammarHtml = `
        <section class="grammar-block">
          ${g.summary ? `<p class="grammar-summary">${escapeHtml(g.summary)}</p>` : ''}
          ${g.points.map((p) => `
            <article class="grammar-item">
              <h4>${escapeHtml(p.title || '')}</h4>
              <p class="grammar-explain">${escapeHtml(p.explanation || '')}</p>
              ${(p.examples || []).map((e) => `
                <div class="grammar-example">
                  <p class="ge-en">${escapeHtml(e.en || '')}</p>
                  ${e.cn ? `<p class="ge-cn">${escapeHtml(e.cn)}</p>` : ''}
                </div>`).join('')}
            </article>`).join('')}
        </section>`;
    } else if (Array.isArray(g) && g.length) {
      // 兼容旧结构
      grammarHtml = `
        <section class="grammar-block">
          ${g.map((item) => `
            <article class="grammar-item">
              <h4>${escapeHtml(item.title || '')}</h4>
              ${(item.parts || []).map((part) => `<p>${escapeHtml(part.text || '')}</p>`).join('')}
            </article>`).join('')}
        </section>`;
    }

    const exercises = data.exercises?.length
      ? `<section class="grammar-block">
           <h3 class="grammar-heading">✏️ 练习题${''}</h3>
           ${data.exercises.map((ex, idx) => {
             const options = Array.isArray(ex.options) && ex.options.length
               ? `<div class="ex-options" role="radiogroup" aria-label="第 ${idx + 1} 题选项">
                    ${ex.options.map((op) => `<button class="ex-option" type="button" data-value="${escapeHtml(op)}">${escapeHtml(op)}</button>`).join('')}
                  </div>`
               : `<div class="ex-input-row">
                    <input class="ex-input" type="text" autocomplete="off"
                           placeholder="输入答案…" aria-label="第 ${idx + 1} 题答案">
                    <button class="ex-check-btn" type="button">核对</button>
                    <button class="ex-reveal-btn" type="button" title="显示答案">💡</button>
                  </div>`;
             return `
             <div class="grammar-exercise" data-answer="${escapeHtml(ex.a)}">
               <p class="ex-question">${idx + 1}. ${escapeHtml(ex.q)}</p>
               ${options}
               <p class="ex-result" hidden></p>
             </div>`;
           }).join('')}
         </section>`
      : '';

    const html = [
      '<h3 class="grammar-heading">📘 本课语法</h3>',
      grammarHtml,
      exercises,
    ].filter(Boolean).join('');

    if (!html) {
      panel.innerHTML = '';
      return;
    }
    panel.innerHTML = html;
  }

  /**
   * @param {Array<{word: string, phonetic?: string, translation?: string, definition?: string}>} entries
   */
  render(entries) {
    if (!this.container) return;

    this.hasVocab = Array.isArray(entries) && entries.length > 0;
    if (this.vocabCountEl) {
      this.vocabCountEl.textContent = this.hasVocab ? ` ${entries.length}` : '';
    }
    this.#applyTabState();

    if (!this.hasVocab) {
      this.container.innerHTML = '';
      return;
    }

    const rows = entries
      .map((entry) => {
        const word = escapeHtml(entry.word || '');
        const phonetic = entry.phonetic ? `<span class="vocab-phonetic">/${escapeHtml(entry.phonetic)}/</span>` : '';
        const speakBtn = this.ttsAvailable
          ? `<button class="vocab-speak-btn" type="button" aria-label="朗读 ${word}">🔊</button>`
          : '';
        const translation = entry.translation
          ? `<p class="vocab-translation">${escapeHtml(entry.translation).replace(/\\n|\n/g, '<br>')}</p>`
          : '';
        const definition = entry.definition
          ? `<p class="vocab-definition">${escapeHtml(entry.definition).replace(/\\n|\n/g, '<br>')}</p>`
          : '';
        return `
          <li class="vocab-item" data-word="${word}">
            <div class="vocab-head">
              <span class="vocab-word">${word}</span>
              ${phonetic}
              ${speakBtn}
            </div>
            ${translation}
            ${definition}
          </li>`;
      })
      .join('');

    this.container.innerHTML = `
      <h3 class="vocab-title">📖 本课生词（${entries.length}）</h3>
      <ul class="vocab-list">${rows}</ul>`;
  }
}
