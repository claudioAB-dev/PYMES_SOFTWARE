const fs = require('fs');
const path = require('path');

const targetPath = path.join(
    process.cwd(),
    'node_modules/.pnpm/@modelcontextprotocol+sdk@1.26.0_zod@3.24.1'
);

try {
    console.log('Attempting to force delete:', targetPath);
    fs.rmSync(targetPath, { recursive: true, force: true, maxRetries: 5 });
    console.log('Successfully deleted the locked directory using fs.rmSync');
} catch (error) {
    console.error('Failed to delete lock directory:', error.message);
}
