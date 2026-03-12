/**
 * Structure detection and manipulation for WCAG 2.1 AA Instructional Materials Converter
 * Detects headings from patterns: ALL CAPS, Roman numerals, "Chapter X", blank-line-separated sections
 */

(function (global) {
  'use strict';

  const BLOCK_TYPES = {
    H1: 'h1', H2: 'h2', H3: 'h3', H4: 'h4', H5: 'h5', H6: 'h6',
    P: 'p',
    BLOCKQUOTE: 'blockquote',
    VERSE: 'div',
    PRE: 'pre'
  };

  const ROMAN_NUMERALS = /^(chapter|part|book|act|scene)\s+([ivxlcdmIVXLCDM]+|\d+)[.:]?\s*(.*)$/i;
  const ALL_CAPS = /^[A-Z][A-Z\s\-'",;:!?—–-]+$/;
  const HEADING_LIKE = /^(chapter|part|book|act|scene|section)\s+\d+/i;

  /**
   * Parse plain text into blocks with suggested structure
   * Splits by blank lines; detects headings from ALL CAPS, Roman numerals, "Chapter X"
   * @param {string} text - Raw pasted text
   * @returns {Array<{type: string, content: string}>}
   */
  function detectStructure(text) {
    if (!text || typeof text !== 'string') return [];
    const rawChunks = text.split(/\n\s*\n/);
    const blocks = [];

    for (let i = 0; i < rawChunks.length; i++) {
      const chunk = rawChunks[i].trim();
      if (!chunk) continue;

      let type = BLOCK_TYPES.P;
      const firstLine = chunk.split(/\n/)[0];
      const trimmed = firstLine.trim();

      let content = chunk;
      if (ROMAN_NUMERALS.test(trimmed) && chunk.split(/\n/).length <= 3) {
        const match = trimmed.match(ROMAN_NUMERALS);
        type = BLOCK_TYPES.H2;
        content = match[3] ? match[1] + ' ' + match[2] + ': ' + match[3] : match[1] + ' ' + match[2];
      } else if (HEADING_LIKE.test(trimmed) && chunk.length < 120) {
        type = BLOCK_TYPES.H2;
      } else if (ALL_CAPS.test(trimmed) && trimmed.length > 2 && trimmed.length < 100) {
        type = BLOCK_TYPES.H3;
      }

      blocks.push({ type: type, content: content });
    }

    return blocks;
  }

  /**
   * Render blocks as HTML string
   * @param {Array} blocks - [{ type, content, class?, isVerse? }]
   * @param {string} lang - Document language (reserved for future lang attribute on parts)
   * @returns {string}
   */
  function blocksToHtml(blocks, lang) {
    if (!blocks || !blocks.length) return '';
    const parts = blocks.map(function (b) {
      const tag = b.type;
      const inner = escapeHtml(b.content).replace(/\n/g, '<br>');
      const hasVerseClass = (tag === 'div' && (b.isVerse || b.class === 'verse-block'));
      if (tag === 'blockquote') {
        return '<blockquote>' + inner + '</blockquote>';
      }
      if (tag === 'pre' || tag === 'div') {
        const cls = (tag === 'div' && hasVerseClass) ? ' class="verse-block"' : (tag === 'pre' ? '' : (b.class ? ' class="' + escapeHtml(b.class) + '"' : ''));
        return '<' + tag + cls + '>' + inner + '</' + tag + '>';
      }
      return '<' + tag + '>' + inner + '</' + tag + '>';
    });
    return parts.join('\n');
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  global.Structure = {
    detect: detectStructure,
    blocksToHtml: blocksToHtml,
    BLOCK_TYPES: BLOCK_TYPES
  };
})(typeof window !== 'undefined' ? window : this);
