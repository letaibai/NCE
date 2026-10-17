/**
 * 课本目录与课件配置加载
 * @module services/BookService
 */

/**
 * 音频文件名映射：把 book.json 里的课程名转换为目标仓库的实际音频文件名
 * nce1:   "001&002.Sorry, Sir" -> "001&002－Sorry, Sir"（全角破折号，可能带尾部句点）
 * nce234: "01.Finding Fossil Man" -> "01－Finding Fossil Man"
 */
const AUDIO_NAMERS = {
  nce1: (name) => name.replace('.', '－'),
  nce234: (name) => name.replace('.', '－'),
};

export class BookService {
  /**
   * @param {string} [catalogUrl='data.json']
   */
  constructor(catalogUrl = 'data.json') {
    this.catalogUrl = catalogUrl;
    this.books = [];
  }

  /**
   * @param {AbortSignal} [signal]
   * @returns {Promise<Array>}
   */
  async loadCatalog(signal) {
    const response = await fetch(this.catalogUrl, { signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    this.books = Array.isArray(data.books) ? data.books : [];
    return this.books;
  }

  /**
   * @param {string} bookKey
   * @param {string} defaultKey
   * @returns {Object|null}
   */
  resolve(bookKey, defaultKey) {
    if (!this.books.length) return null;

    const getPath = (book) => book?.path || '';

    const exact = this.books.find((book) => book?.key === bookKey && getPath(book));
    if (exact) return exact;

    const fallback = this.books.find((book) => book?.key === defaultKey && getPath(book));
    if (fallback) return fallback;

    return this.books.find((book) => getPath(book)) || null;
  }

  /**
   * @param {{key?: string, path?: string, bookPath?: string, lrcPath?: string}} book
   * @param {AbortSignal} [signal]
   * @returns {Promise<{units: Array, coverUrl: string, bookName: string, bookLevel: string}>}
   */
  async loadBook(book, signal) {
    const rawPath = book.path || '';
    const bookPath = rawPath.trim().replace(/\/$/, '');
    const catalogPath = (book.catalogPath || bookPath).trim().replace(/\/$/, '');
    const response = await fetch(`${catalogPath}/book.json`, { signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    const lrcPath = (book.lrcPath || '').trim().replace(/\/$/, '');
    const namer = AUDIO_NAMERS[book.audioNamer] || ((name) => name);
    const units = (Array.isArray(data.units) ? data.units : [])
      .filter((unit) => unit?.filename)
      .map((unit, index) => ({
        ...unit,
        id: index + 1,
        title: unit.title || `Unit ${index + 1}`,
        audio: `${bookPath}/${encodeURIComponent(namer(unit.filename))}.mp3`,
        lrc: `${lrcPath || bookPath}/${unit.filename}.lrc`,
      }));

    return {
      units,
      coverUrl: data.cover ? `${catalogPath}/${data.cover}` : '',
      bookName: data.name || book.title || '',
      bookLevel: data.level || book.key || '',
    };
  }
}
