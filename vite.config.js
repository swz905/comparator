import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    const env = loadEnv(mode, process.cwd(), '');

    return {
        // Define global constants that will be replaced at build time
        define: {
            'import.meta.env.VITE_PERPLEXITY_API_KEY': JSON.stringify(env.VITE_PERPLEXITY_API_KEY),
            'import.meta.env.VITE_GROQ_API_KEY': JSON.stringify(env.VITE_GROQ_API_KEY),
            'import.meta.env.VITE_GROQ_MODEL': JSON.stringify(env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'),
            'import.meta.env.VITE_PERPLEXITY_MODEL': JSON.stringify(env.VITE_PERPLEXITY_MODEL || 'sonar'),
        },
        build: {
            outDir: 'dist',
            rollupOptions: {
                input: 'index.html'
            }
        },
        server: {
            port: 3000,
            open: true
        }
    };
});
