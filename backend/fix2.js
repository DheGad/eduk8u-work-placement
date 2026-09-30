const fs = require('fs');
function replaceInFile(filePath, searchRegex, replaceWith) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(searchRegex, replaceWith);
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

replaceInFile('src/modules/placements/placements.service.ts', 
  /const placementReference = generatePlacementReference\(\);/,
  'const placementReference = await generatePlacementReference(tenantId);'
);

replaceInFile('src/modules/documents/documents.service.ts',
  /return result\.rows as \(DocumentRow & \{/g,
  'return result.rows as any as (DocumentRow & {'
);

replaceInFile('src/modules/documents/documents.service.ts',
  /return result\.rows\[0\] as DocumentRow & \{/g,
  'return result.rows[0] as any as DocumentRow & {'
);

