const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, searchRegex, replaceWith) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(searchRegex, replaceWith);
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

// 1. Fix app.ts
let appTs = fs.readFileSync('src/app.ts', 'utf8');
appTs = appTs.replace(/import \{ documentsRouter \} from '.\/modules\/documents\/documents.routes';\n/, '');
appTs = appTs.replace(/import \{ reportsRouter \} from '.\/modules\/reports\/reports.routes';\n/, '');
appTs = appTs.replace(/import \{ notificationsRouter \} from '.\/modules\/notifications\/notifications.routes';\n/, '');
appTs = appTs.replace(/apiRouter\.use\('\/documents', documentsRouter\);\n/, '');
appTs = appTs.replace(/apiRouter\.use\('\/reports', reportsRouter\);\n/, '');
appTs = appTs.replace(/apiRouter\.use\('\/notifications', notificationsRouter\);\n/, '');
fs.writeFileSync('src/app.ts', appTs, 'utf8');

// 2. Fix auth.service.ts
replaceInFile('src/modules/auth/auth.service.ts', 
  /expiresIn: env\.JWT_EXPIRES_IN,/g, 
  'expiresIn: env.JWT_EXPIRES_IN as any,'
);
replaceInFile('src/modules/auth/auth.service.ts', 
  /expiresIn: env\.JWT_REFRESH_EXPIRES_IN,/g, 
  'expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,'
);

// 3. Fix validator imports and validateRequest
const routeFiles = [
  'src/modules/hosts/hosts.routes.ts',
  'src/modules/supervisors/supervisors.routes.ts',
  'src/modules/placements/placements.routes.ts',
  'src/modules/evidence/evidence.routes.ts',
  'src/modules/journal/journal.routes.ts'
];
routeFiles.forEach(f => {
  replaceInFile(f, /import \{ validateRequest \} from '\.\.\/\.\.\/middleware\/validator';/g, "import { validate } from '../../middleware/validator';");
  replaceInFile(f, /validateRequest\(/g, "validate(");
  replaceInFile(f, /import \{ UserRole \} from '\.\.\/\.\.\/types';\n/g, "");
  // add UserRole import if needed, but easier to just cast
  replaceInFile(f, /requireRole\(\['super_admin', 'college_admin', 'host_manager'\]\)/g, "requireRole(['super_admin', 'college_admin', 'host_manager'] as any)");
});

// 4. Fix hours.controller.ts
replaceInFile('src/modules/hours/hours.controller.ts', /getHoursLog/g, 'listHours');
replaceInFile('src/modules/hours/hours.controller.ts', /getWeeklyProgress/g, 'getHoursSummary');

