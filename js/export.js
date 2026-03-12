/**
 * Export to standalone WCAG 2.1 AA compliant HTML
 */

(function (global) {
  'use strict';

  const DEFAULT_CSS = `
/* WCAG 2.1 AA compliant document styles */
:root { --text: #2c2c2c; --bg: #faf9f7; --link: #1e5f8a; --focus: #1e5f8a; --accent: #1e5f8a; }
* { box-sizing: border-box; }
html { font-size: 100%; line-height: 1.6; -webkit-text-size-adjust: 100%; }
body { margin: 0; padding: 2rem 1.5rem; font-family: Georgia, "Times New Roman", serif; font-size: 1.0625rem; color: var(--text); background: var(--bg); max-width: 42rem; margin-left: auto; margin-right: auto; }
.skip-link { position: absolute; top: -4rem; left: 1rem; padding: 0.625rem 1.25rem; background: #fff; color: var(--link); border: 2px solid var(--focus); text-decoration: none; border-radius: 6px; z-index: 100; font-weight: 600; }
.skip-link:focus { top: 1rem; outline: 3px solid var(--focus); outline-offset: 2px; }
:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
a { color: var(--link); text-decoration: underline; }
a:visited { color: #5a2d82; }
a:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
h1, h2, h3, h4, h5, h6 { margin: 1.5em 0 0.5em; line-height: 1.35; }
h1:first-child, h2:first-child { margin-top: 0; }
p { margin: 0 0 1em; }
blockquote { margin: 1.25em 2em; padding-left: 1.25rem; border-left: 4px solid var(--accent); font-style: italic; }
.verse-block, pre { white-space: pre-wrap; margin: 1.25em 0; padding: 1rem 1.25rem; background: #f3f2ef; border-radius: 6px; }
.byline { color: #525252; font-size: 0.9375rem; margin-bottom: 1.5rem; }
@media print { .skip-link { display: none; } body { background: #fff; } }
`;

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Generate full standalone HTML document
   * @param {Object} opts - { title, author, source, lang, contentHtml }
   * @returns {string}
   */
  function generateDocument(opts) {
    const title = escapeHtml(opts.title || 'Untitled Document');
    const author = escapeHtml(opts.author || '');
    const lang = opts.lang || 'en';
    const contentHtml = opts.contentHtml || '';

    const bylineParts = [];
    if (author) bylineParts.push(author);
    if (opts.source) {
      const isUrl = /^https?:\/\//i.test(opts.source);
      bylineParts.push(isUrl ? '<a href="' + escapeAttr(opts.source) + '">Source</a>' : escapeHtml(opts.source));
    }
    const byline = bylineParts.length ? '<p class="byline">' + bylineParts.join(' \u2022 ') + '</p>' : '';

    return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>${DEFAULT_CSS}</style>
</head>
<body>
<a href="#main-content" class="skip-link">Skip to main content</a>
<main id="main-content" role="main">
<article>
<header>
<h1>${title}</h1>
${byline}
</header>
${contentHtml}
</article>
</main>
</body>
</html>`;
  }

  /**
   * Trigger download of HTML file
   */
  function downloadHtml(html, filename) {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'document.html';
    a.click();
    URL.revokeObjectURL(url);
  }

  global.Export = {
    generateDocument: generateDocument,
    downloadHtml: downloadHtml
  };
})(typeof window !== 'undefined' ? window : this);
