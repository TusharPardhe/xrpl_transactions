import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import nodePolyfills from "rollup-plugin-polyfill-node";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true,
        }),
        NodeModulesPolyfillPlugin(),
      ],
    },
  },
  rollupOptions: {
    output: { entryFileNames: "[name].js" },
    plugins: [nodePolyfills()],
  },
  resolve: {
    extensions: ["*", ".js", ".jsx"],
    alias: [
      { find: "events", replacement: "rollup-plugin-node-polyfills/polyfills/events" },
      { find: "child_process", replacement: "rollup-plugin-node-polyfills" },
      { find: "path", replacement: "rollup-plugin-node-polyfills/polyfills/path" },
    ],
  },
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
})
