import fs from 'node:fs';
import path from 'node:path';

const readmePath = path.join(process.cwd(), 'profile', 'TEST.md');

let content = fs.readFileSync(readmePath, 'utf-8');

const match = content.match(/<!--counter:(\d+)-->/);
const count = match ? parseInt(match[1]) + 1 : 1;

if (match) {
  content = content.replace(/<!--counter:\d+-->/, `<!--counter:${count}-->`);
} else {
  content += `\n\n<!--counter:${count}-->`;
}

const visibleLine = `🔁 Update counter: **${count}**`;
if (content.includes('🔁 Update counter:')) {
  content = content.replace(/🔁 Update counter: \*\*\d+\*\*/, visibleLine);
} else {
  content += `\n\n${visibleLine}`;
}

fs.writeFileSync(readmePath, content);
console.log(`✅ README actualizado. Nuevo contador: ${count}`);
