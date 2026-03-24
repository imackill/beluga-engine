import typescript from '@rollup/plugin-typescript';
import dts from "rollup-plugin-dts";

// Assuming your main entry point is src/Beluga.ts based on your previous config
const input = 'src/Beluga.ts'; 

export default [
  {
    input,
    output: {
      file: 'dist/beluga-engine.js',
      format: 'es',
      sourcemap: true,
    },
    // Keep internal node modules and heavy dependencies out of the bundle
    external: ['crypto', 'fs', 'http', 'path', 'three', 'ws'],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false, // We handle declarations in the next pass
      })
    ]
  },
  {
    input,
    output: {
      file: 'dist/beluga-engine.d.ts',
      format: 'es'
    },
    plugins: [dts()]
  }
];