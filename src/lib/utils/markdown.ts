import { marked, type Tokens } from 'marked';
import { createHighlighter } from 'shiki';
import DOMPurify from 'isomorphic-dompurify';

let highlighter: Awaited<ReturnType<typeof createHighlighter>> | null = null;

const getHighlighter = async () => {
  if (!highlighter) {
    highlighter = await createHighlighter({
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
  return highlighter;
};

export const renderMarkdown = async (markdown: string): Promise<string> => {
  const shiki = await getHighlighter();

  marked.setOptions({
    breaks: true,
    gfm: true
  });

  marked.use({
    renderer: {
      code(token: Tokens.Code) {
        try {
          return shiki.codeToHtml(token.text, {
            lang: token.lang === 'sh' ? 'bash' : token.lang || 'text',
            theme: 'github-dark'
          });
        } catch {
          return shiki.codeToHtml(token.text, {
            lang: 'text',
            theme: 'github-dark'
          });
        }
      }
    }
  });

  const dirtyHtml = marked.parse(markdown) as string;
  return DOMPurify.sanitize(dirtyHtml, { USE_PROFILES: { html: true } });
};
