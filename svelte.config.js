import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/kit/vite';
import sveltePreprocess from 'svelte-preprocess';
import { createHighlighter } from 'shiki';

let highlighter;

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

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: [
    sveltePreprocess({
      pug: true,
      postcss: true,
      sourceMap: true,
      scss: true,
      sass: true
    }),

    mdsvex({
      highlight: {
        highlighter: async (code, lang = 'text') => {
          const shiki = await getHighlighter();

          try {
            const html = shiki.codeToHtml(code, {
              lang: lang === 'sh' ? 'bash' : lang,
              theme: 'github-dark'
            });
            // Escape backticks and wrap in Svelte's html directive
            return `{@html \`${html.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`}`;
          } catch {
            const html = shiki.codeToHtml(code, {
              lang: 'text',
              theme: 'github-dark'
            });
            return `{@html \`${html.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`}`;
          }
        }
      }
    })
  ],

  kit: {
    // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
    // If your environment is not supported or you settled on a specific environment, switch out the adapter.
    // See https://kit.svelte.dev/docs/adapters for more information about adapters.
    adapter: adapter(),

    env: { publicPrefix: 'PUB_' }
  },

  extensions: ['.svelte', '.svx']
};

export default config;
