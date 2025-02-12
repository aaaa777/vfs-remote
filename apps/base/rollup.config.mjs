import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";

const typescriptOptions = { tsconfig: "./tsconfig.json", declaration: false };

const config = {
  input: "src/index.js",
  output: {
    file: "dist/index.umd.js",
    format: "umd",
    name: "poc-remotefs",
  },
  plugins: [
    typescript(typescriptOptions),
    nodeResolve({
      resolveOnly: ["@bjorn3/browser_wasi_shim", "@ruby/wasm-wasi"],
    }),
  ],
};

export default config;
