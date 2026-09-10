// Tiny, safe markdown renderer for chat bubbles. Escapes all HTML first, then
// supports **bold**, *italic*, [links](url), "- " bullet lists and paragraphs.
// Links are limited to http(s), site-relative paths, tel: and mailto:.

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const SAFE_URL = /^(https?:\/\/|\/(?!\/)|tel:|mailto:)/i;

function inline(src: string) {
  return escapeHtml(src)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, url: string) => {
      if (!SAFE_URL.test(url)) return label;
      const external = /^https?:\/\//i.test(url);
      return `<a href="${url}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
    })
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*(?!\s)([^*]+?)\*(?=[\s).,!?:;]|$)/g, '$1<em>$2</em>');
}

export function renderMarkdown(src: string) {
  const blocks = src.replace(/\r\n?/g, '\n').trim().split(/\n{2,}/);
  return blocks
    .map((block) => {
      const lines = block.split('\n');
      const out: string[] = [];
      let list: string[] = [];
      const flush = () => {
        if (list.length) out.push(`<ul>${list.map((li) => `<li>${inline(li)}</li>`).join('')}</ul>`);
        list = [];
      };
      const para: string[] = [];
      const flushPara = () => {
        if (para.length) out.push(`<p>${para.map(inline).join('<br>')}</p>`);
        para.length = 0;
      };
      for (const line of lines) {
        const m = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
        if (m) {
          flushPara();
          list.push(m[1]);
        } else {
          flush();
          para.push(line.replace(/^#{1,6}\s+/, ''));
        }
      }
      flushPara();
      flush();
      return out.join('');
    })
    .join('');
}
