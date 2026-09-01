const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'app');

const replacements = [
  { search: /CormorantGaramond_700Bold/g, replace: 'Outfit_700Bold' },
  { search: /CormorantGaramond_600SemiBold/g, replace: 'Outfit_600SemiBold' },
  { search: /DMSans_400Regular/g, replace: 'Inter_400Regular' },
  { search: /DMSans_500Medium/g, replace: 'Inter_500Medium' },
  { search: /DMSans_700Bold/g, replace: 'Inter_700Bold' },
  { search: /SpaceGrotesk_600SemiBold/g, replace: 'Inter_600SemiBold' }
];

function processDirectory(dir) {
  fs.readdir(dir, (err, files) => {
    if (err) {
      return console.log('Unable to scan directory: ' + err);
    } 
    files.forEach((file) => {
      const fullPath = path.join(dir, file);
      fs.stat(fullPath, (err, stats) => {
        if (stats.isDirectory()) {
          processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
          fs.readFile(fullPath, 'utf8', (err, data) => {
            if (err) {
              return console.log(err);
            }
            let result = data;
            replacements.forEach(replacement => {
              result = result.replace(replacement.search, replacement.replace);
            });

            if (result !== data) {
              fs.writeFile(fullPath, result, 'utf8', (err) => {
                if (err) return console.log(err);
                console.log(`Updated ${fullPath}`);
              });
            }
          });
        }
      });
    });
  });
}

processDirectory(directoryPath);
