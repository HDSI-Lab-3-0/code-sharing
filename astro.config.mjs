// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
    site: 'https://hdsi-lab-3-0.github.io',
    base: '/code-sharing',
    output: 'static',
    integrations: [react()],
    vite: {
        plugins: [
            tailwindcss()
        ]
    }
});
