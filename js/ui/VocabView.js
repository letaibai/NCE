/**
 * 本课生词面板：加载并展示每课词汇（音标 + 中英释义 + 读音）
 * @module ui/VocabView
 */

import { escapeHtml } from '../utils/escape.js';

export class VocabView {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.container 生词面板容器
   * @param {string} options.baseUrl 词汇数据基础路径，如 "vocab"
   */
  constructor(options = {}) {
    this.container = options.container;
    this.baseUrl = (options.baseUrl || 'vocab').replace(/\/$/, '');
    this.cache = new Map();
    this.loadedUnit = null;
    this.ttsAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;
    this.#bind();
  }

  #bind() {
    if (!this.container) return;
    this.container.addEventListener('click', (event) => {
      const btn = event.target.closest('.vocab-speak-btn');
      if (!btn) return;
      const word = btn.closest('.vocab-item')?.dataset.word;
      if (word) this.speak(word);
    });
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
        this.#setEmpty(); // 该课暂无词汇数据
        return;
      }
    }

    if (this.loadedUnit !== unitId) return;
    this.render(entries);
  }

  /**
   * @param {Array<{word: string, phonetic?: string, translation?: string, definition?: string}>} entries
   */
  render(entries) {
    if (!this.container) return;

    if (!Array.isArray(entries) || !entries.length) {
      this.#setEmpty();
      return;
    }

    const rows = entries
      .map((entry) => {
        const word = escapeHtml(entry.word || '');
        const phonetic = entry.phonetic ? `<span class="vocab-phonetic">/${escapeHtml(entry.phonetic)}/</span>` : '';
        const speakBtn = this.ttsAvailable
          ? `<button class="vocab-speak-btn" type="button" aria-label="朗读 ${word}">🔊</button>`
          : '';
        const translation = entry.translation ? `<p class="vocab-translation">${escapeHtml(entry.translation)}</p>` : '';
        const definition = entry.definition ? `<p class="vocab-definition">${escapeHtml(entry.definition)}</p>` : '';
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
    this.container.hidden = false;
  }

  #setEmpty() {
    if (!this.container) return;
    this.container.hidden = true;
    this.container.innerHTML = '';
  }
}
