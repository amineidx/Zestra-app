const fs = require('fs');
const path = require('path');

const replacements = {
  'text-ink': 'text-foreground',
  'bg-ink': 'bg-foreground',
  'text-body-text': 'text-muted-foreground',
  'bg-canvas': 'bg-background',
  'bg-surface-soft': 'bg-muted',
  'bg-surface-strong': 'bg-accent',
  'bg-surface-dark': 'bg-card',
  'border-hairline': 'border-border',
  'bg-signature-cream': 'bg-accent/50',
  'text-signature-coral': 'text-destructive',
  'bg-signature-peach': 'bg-orange-500/10',
  'text-signature-peach': 'text-orange-500',
  'bg-signature-forest': 'bg-green-500/10',
  'text-signature-forest': 'text-green-500',
  'bg-signature-mint': 'bg-teal-500/10',
  'text-signature-mint': 'text-teal-500',
  'bg-signature-yellow': 'bg-yellow-500/10',
  'text-signature-yellow': 'text-yellow-600',
  'bg-signature-mustard': 'bg-yellow-600/10',
  'text-signature-mustard': 'text-yellow-700',
  'text-muted-custom': 'text-muted-foreground',
  'dark:text-white': 'dark:text-foreground',
};

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function replaceInFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    content = content.replace(regex, value);
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

const dirsToProcess = [
  path.join(__dirname, 'app'),
  path.join(__dirname, 'features'),
  path.join(__dirname, 'components')
];

dirsToProcess.forEach(dir => {
  if (fs.existsSync(dir)) {
    walkDir(dir, replaceInFile);
  }
});

console.log('Replacement complete.');
