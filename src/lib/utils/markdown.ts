import { marked, type Tokens } from 'marked';
import { createHighlighter } from 'shiki';
import sanitizeHtml from 'sanitize-html';

let highlighterPromise: ReturnType<typeof createHighlighter> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark'],
      langs: [
        'javascript',
        'typescript',
        'json',
        'bash',
        'shell',
        'sh',
        'text',
        'markdown',
        'html',
        'css',
        'scss',
        'svelte',
        'yaml',
        'yml',
        'toml',
        'xml'
      ]
    });
  }
  return highlighterPromise;
}

export const renderMarkdown = async (markdown: string): Promise<string> => {
  const shiki = await getHighlighter();

  marked.setOptions({
    breaks: true,
    gfm: true
  });

  marked.use({
    renderer: {
      code(token: Tokens.Code) {
        const rawCode = token.text;
        const language = token.lang === 'sh' ? 'bash' : token.lang || 'text';

        let highlightedHtml: string;

        try {
          highlightedHtml = shiki.codeToHtml(rawCode, {
            lang: language,
            theme: 'github-dark'
          });
        } catch {
          highlightedHtml = shiki.codeToHtml(rawCode, {
            lang: 'text',
            theme: 'github-dark'
          });
        }

        const encoded = encodeURIComponent(rawCode);

        return `
<div class="code-block">
  <button
    class="code-block__copy"
    type="button"
    data-code="${encoded}"
  >
    Copy
  </button>
  ${highlightedHtml}
</div>
`.trim();
      }
    }
  });

  const dirtyHtml = marked.parse(markdown) as string;
  return sanitizeHtml(dirtyHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['button']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      button: ['class', 'data-code', 'type'],
      div: ['class'],
      pre: ['class'],
      code: ['class'],
      span: ['style']
    }
  });
};
