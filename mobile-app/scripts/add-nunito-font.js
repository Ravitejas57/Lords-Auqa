/**
 * Script to add fontFamily: 'Nunito_400Regular' to all text styles in StyleSheet definitions
 * This script finds all fontSize properties and adds fontFamily to the same style object
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all .tsx files in the app directory
const files = glob.sync('app/**/*.tsx', { cwd: __dirname + '/..' })
  .concat(glob.sync('src/**/*.tsx', { cwd: __dirname + '/..' }))
  .concat(glob.sync('components/**/*.tsx', { cwd: __dirname + '/..' }));

console.log(`Found ${files.length} files to process`);

files.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Pattern to match style objects with fontSize but without fontFamily
  // This regex matches: fontSize: number, ... (without fontFamily before the closing brace)
  const stylePattern = /(\s+)(\w+):\s*\{([^}]*fontSize:[^}]*)\}/g;
  
  // More targeted: find style definitions that have fontSize but don't have fontFamily
  const lines = content.split('\n');
  const newLines = [];
  let inStyleSheet = false;
  let currentStyle = null;
  let styleStartLine = -1;
  let braceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect StyleSheet.create start
    if (line.includes('StyleSheet.create')) {
      inStyleSheet = true;
      newLines.push(line);
      continue;
    }

    if (inStyleSheet) {
      // Track opening braces
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      braceCount += openBraces - closeBraces;

      // If we find a style property with fontSize, check if it needs fontFamily
      if (line.includes('fontSize:') && !line.includes('fontFamily')) {
        // Find the closing brace of this style object
        let j = i;
        let tempBraceCount = braceCount;
        let foundClosing = false;
        
        while (j < lines.length && !foundClosing) {
          const tempLine = lines[j];
          const tempOpen = (tempLine.match(/\{/g) || []).length;
          const tempClose = (tempLine.match(/\}/g) || []).length;
          tempBraceCount += tempOpen - tempClose;
          
          if (tempBraceCount <= 0 && tempLine.includes('}')) {
            foundClosing = true;
            // Check if fontFamily is already in this style block
            const styleBlock = lines.slice(i, j + 1).join('\n');
            if (!styleBlock.includes('fontFamily')) {
              // Add fontFamily before the closing brace
              const lastLine = lines[j];
              const indent = lastLine.match(/^(\s*)/)[1];
              lines[j] = indent + "    fontFamily: 'Nunito_400Regular',\n" + lastLine;
              modified = true;
            }
            break;
          }
          j++;
        }
      }

      // Reset when StyleSheet block ends
      if (braceCount === 0 && line.includes('});')) {
        inStyleSheet = false;
      }
    }

    newLines.push(lines[i]);
  }

  if (modified) {
    fs.writeFileSync(fullPath, newLines.join('\n'), 'utf8');
    console.log(`Updated: ${filePath}`);
  }
});

console.log('Done!');

