import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            const content = fs.readFileSync(file, 'utf8');
            const matches = [...content.matchAll(/from [\"']@\/components\/ui\/([a-zA-Z0-9-]+)[\"']/g)];
            if (matches.length > 0) results.push(...matches.map(m => m[1]));
        }
    });
    return results;
}

const comps = walk('./src');
const unique = [...new Set(comps)];
const existing = fs.readdirSync('./src/components/ui').map(f => f.replace('.tsx', ''));
const missing = unique.filter(c => !existing.includes(c));

console.log('All imported UI components:', unique.sort());
console.log('Missing UI components:', missing.sort());
