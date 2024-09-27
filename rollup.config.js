import typescript from '@rollup/plugin-typescript';
import dts from "rollup-plugin-dts";
const config = [
  {
    input: 'dist/build/Beluga.js',
    output: {
      file: 'dist/beluga-engine.js',
      format: 'es',
      sourcemap: true,
    },
    external: ['crypto', 'fs', 'http', 'path', 'three'],
    plugins: [typescript()]
  }, {
    input: 'dist/build/Beluga.d.ts',
    output: {
      file: 'dist/beluga-engine.d.ts',
      format: 'es'
    },
    plugins: [dts()]
  }
];
export default config;