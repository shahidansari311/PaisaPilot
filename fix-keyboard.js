const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('/run/media/shahid-ansari/data/PaisaPilot/app', function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace behavior={Platform.OS === 'ios' ? 'padding' : undefined} with behavior="padding"
    content = content.replace(/behavior=\{Platform\.OS === 'ios' \? 'padding' : undefined\}/g, 'behavior="padding"');
    
    // Replace behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} with behavior="padding"
    content = content.replace(/behavior=\{Platform\.OS === 'ios' \? 'padding' : 'padding'\}/g, 'behavior="padding"');
    
    // Sometimes there are extra spaces
    content = content.replace(/behavior=\{\s*Platform\.OS === 'ios'\s*\?\s*'padding'\s*:\s*undefined\s*\}/g, 'behavior="padding"');

    // Also fix any ScrollViews that don't have keyboardShouldPersistTaps
    // content = content.replace(/<ScrollView/g, '<ScrollView keyboardShouldPersistTaps="handled"');
    // Actually, maybe not do that globally, it might break touchables. Most already have it.

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed ' + filePath);
    }
  }
});
