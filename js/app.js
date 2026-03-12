/**
 * WCAG 2.1 AA Instructional Materials Converter - Main application
 */

(function () {
  'use strict';

  const DOM = {
    pasteArea: document.getElementById('paste-area'),
    docTitle: document.getElementById('doc-title'),
    docAuthor: document.getElementById('doc-author'),
    docSource: document.getElementById('doc-source'),
    docLang: document.getElementById('doc-lang'),
    btnDetect: document.getElementById('btn-detect'),
    btnClear: document.getElementById('btn-clear'),
    btnPreview: document.getElementById('btn-preview'),
    btnToggleView: document.getElementById('btn-toggle-view'),
    btnExport: document.getElementById('btn-export'),
    structurePanel: document.querySelector('.structure-panel'),
    structureEditor: document.getElementById('structure-editor'),
    previewPanel: document.querySelector('.preview-panel'),
    previewContent: document.getElementById('preview-content')
  };

  let blocks = [];

  function showPanel(panel) {
    DOM.structurePanel.setAttribute('aria-hidden', panel !== 'structure');
    DOM.previewPanel.setAttribute('aria-hidden', panel !== 'preview');
  }

  function renderStructureEditor() {
    DOM.structureEditor.innerHTML = '';
    blocks.forEach(function (block, index) {
      const el = document.createElement('div');
      el.className = 'structure-block';
      el.dataset.index = index;
      el.setAttribute('role', 'group');
      el.setAttribute('aria-label', 'Block ' + (index + 1) + ': ' + block.type);

      const preview = block.content.slice(0, 80) + (block.content.length > 80 ? '...' : '');
      const tagSpan = document.createElement('span');
      tagSpan.className = 'structure-block-tag';
      tagSpan.textContent = block.type;

      const contentSpan = document.createElement('div');
      contentSpan.className = 'structure-block-content';
      contentSpan.textContent = preview;

      const actions = document.createElement('div');
      actions.className = 'structure-block-actions';

      const tags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre'];
      tags.forEach(function (tag) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = tag;
        btn.addEventListener('click', function () {
          blocks[index].type = tag === 'pre' ? 'pre' : tag;
          if (tag !== 'div') delete blocks[index].isVerse;
          renderStructureEditor();
          updatePreview();
        });
        actions.appendChild(btn);
      });

      const verseBtn = document.createElement('button');
      verseBtn.type = 'button';
      verseBtn.textContent = 'verse';
      verseBtn.addEventListener('click', function () {
        blocks[index].type = 'div';
        if (!blocks[index].isVerse) blocks[index].isVerse = true;
        renderStructureEditor();
        updatePreview();
      });
      actions.appendChild(verseBtn);

      el.appendChild(tagSpan);
      el.appendChild(contentSpan);
      el.appendChild(actions);

      el.addEventListener('click', function (e) {
        if (e.target.tagName === 'BUTTON') return;
        document.querySelectorAll('.structure-block').forEach(function (b) { b.classList.remove('selected'); });
        el.classList.add('selected');
      });

      DOM.structureEditor.appendChild(el);
    });
  }

  function updatePreview() {
    const lang = DOM.docLang.value;
    const title = DOM.docTitle.value || 'Untitled';
    const author = DOM.docAuthor.value || '';
    const source = DOM.docSource.value || '';

    const contentHtml = Structure.blocksToHtml(blocks.map(function (b) {
      const type = b.type;
      const cls = b.isVerse && type === 'div' ? 'verse-block' : '';
      return { type: type, content: b.content, class: cls };
    }), lang);

    const bylineParts = [author, source].filter(Boolean);
    const byline = bylineParts.length ? '<p class="byline">' + escapeHtml(bylineParts.join(' \u2022 ')) + '</p>' : '';

    DOM.previewContent.innerHTML = '<h1>' + escapeHtml(title) + '</h1>' + byline + contentHtml;
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function runDetection() {
    const text = DOM.pasteArea.value;
    if (!text.trim()) {
      alert('Please paste some text first.');
      return;
    }
    blocks = Structure.detect(text);
    renderStructureEditor();
    showPanel('structure');
    updatePreview();
  }

  function clearAll() {
    DOM.pasteArea.value = '';
    DOM.docTitle.value = '';
    DOM.docAuthor.value = '';
    DOM.docSource.value = '';
    DOM.docLang.value = 'en';
    blocks = [];
    renderStructureEditor();
    DOM.previewContent.innerHTML = '';
    showPanel('structure');
  }

  function showPreview() {
    updatePreview();
    showPanel('preview');
  }

  function toggleSideBySide() {
    const pressed = DOM.btnToggleView.getAttribute('aria-pressed') === 'true';
    const willBeSideBySide = !pressed;
    document.body.classList.toggle('side-by-side', willBeSideBySide);
    DOM.btnToggleView.setAttribute('aria-pressed', String(willBeSideBySide));
    if (willBeSideBySide) {
      DOM.structurePanel.setAttribute('aria-hidden', 'false');
      DOM.previewPanel.setAttribute('aria-hidden', 'false');
      updatePreview();
    } else {
      showPanel('preview');
    }
  }

  function exportHtml() {
    const contentHtml = Structure.blocksToHtml(blocks.map(function (b) {
      return {
        type: b.type,
        content: b.content,
        isVerse: b.isVerse,
        class: b.isVerse && b.type === 'div' ? 'verse-block' : ''
      };
    }), DOM.docLang.value);

    const opts = {
      title: DOM.docTitle.value || 'Untitled Document',
      author: DOM.docAuthor.value || '',
      source: DOM.docSource.value || '',
      lang: DOM.docLang.value,
      contentHtml: contentHtml
    };

    const html = Export.generateDocument(opts);
    const safeTitle = (opts.title || 'document').replace(/[^a-z0-9\-_]/gi, '-').slice(0, 50);
    Export.downloadHtml(html, safeTitle + '.html');
  }

  DOM.btnDetect.addEventListener('click', runDetection);
  DOM.btnClear.addEventListener('click', clearAll);
  DOM.btnPreview.addEventListener('click', showPreview);
  DOM.btnToggleView.addEventListener('click', toggleSideBySide);
  DOM.btnExport.addEventListener('click', exportHtml);


})();
