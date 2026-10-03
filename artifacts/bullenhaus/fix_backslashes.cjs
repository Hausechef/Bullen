const fs = require('fs');

['src/app/trading/pages/admin/AdminOverview.tsx', 'src/app/trading/pages/admin/AdminUsers.tsx'].forEach(f => {
  let code = fs.readFileSync(f, 'utf8');
  code = code.replace(/\\`/g, '`');
  code = code.replace(/\\\$/g, '$');
  fs.writeFileSync(f, code);
});
