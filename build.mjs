import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist', {recursive:true});
await build({entryPoints:['src/main.js'],bundle:true,minify:true,format:'esm',target:'es2022',outfile:'dist/game.js'});
await Promise.all(['index.html','style.css'].map(f=>copyFile(`src/${f}`,`dist/${f}`)));
await copyFile('node_modules/three/LICENSE','dist/THREE-LICENSE.txt');
await copyFile('LICENSE','dist/LICENSE.txt');
console.log('Built dist/');
