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
   * @param {string} text - Raw pasted text
   * @returns {Array<{type: string, content: string, raw?: boolean}>}
   */
  function detectStructure(text) {
    if (!text || typeof text !== 'string') return [];
    const lines = text.split(/\r?\n/);
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        i++;
        continue;
      }

      let type = BLOCK_TYPES.P;
      let content = line;

      // Check for heading patterns
      if (ROMAN_NUMERALS.test(trimmed)) {
        const match = trimmed.match(ROMAN_NUMERALS);
        type = BLOCK_TYPES.H2;
        content = match[3] ? `${match[1]} ${match[2]}: ${match[3]}` : `${match[1]} ${match[2]}`;
      } else if (HEADING_LIKE.test(trimmed) && trimmed.length < 80) {
        type = BLOCK_TYPES.H2;
      } else if (ALL_CAPS.test(trimmed) && trimmed.length > 2 && trimmed.length < 100) {
        type = BLOCK_TYPES.H3;
      }

      blocks.push({ type, content: content });
      i++;
    }

    // Merge consecutive non-heading lines into paragraphs (split by blank lines)
    return mergeParagraphs(blocks);
  }

  /**
   * Merge consecutive p blocks separated by detected structure
   */
  function mergeParagraphs(blocks) {
    const result = [];
    let pending = [];

    for (const block of blocks) {
      if (block.type === BLOCK_TYPES.P) {
        pending.push(block.content);
      } else {
        if (pending.length) {
          result.push({ type: BLOCK_TYPES.P, content: pending.join('\n\n') });
          pending = [];
        }
        result.push(block);
      }
    }
    if (pending.length) {
      result.push({ type: BLOCK_TYPES.P, content: pending.join('\n\n') });
    }
    return result;
  }

  /**
   * Render blocks as HTML string
   * @param {Array} blocks
   * @param {string} lang - Document language
   * @returns {string}
   */
  function blocksToHtml(blocks, lang) {
    if (!blocks || !blocks.length) return '';
    const parts = blocks.map(function (b) {
      const tag = b.type;
      const inner = escapeHtml(b.content).replace(/\n/g, '<br>');
      if (tag === 'blockquote') {
        return '<blockquote>' + inner + '</blockquote>';
      }
      if (tag === 'pre' || tag === 'div') {
        const cls = tag === 'div' ? ' class="verse-block"' : '';
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
