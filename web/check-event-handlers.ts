import fs from 'fs';
import path from 'path';

function walk(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, fileList);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const files = [
  ...walk(path.resolve('src/app')),
  ...walk(path.resolve('src/components'))
];

const eventHandlerRegex = /\b(onClick|onChange|onSubmit|onKeyDown|onKeyUp|onBlur|onFocus|onSelect)\s*=/;

const issues: { file: string; match: string }[] = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  const isClient = content.includes('"use client"') || content.includes("'use client'");
  if (!isClient && eventHandlerRegex.test(content)) {
    // Check which event handlers are found
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      const m = line.match(eventHandlerRegex);
      if (m) {
        issues.push({
          file: path.relative(process.cwd(), file),
          match: `Line ${index + 1}: ${line.trim()}`
        });
      }
    });
  }
}

console.log(`Found ${issues.length} event handler issues in server components:`);
issues.forEach(i => console.log(`${i.file}: ${i.match}`));
