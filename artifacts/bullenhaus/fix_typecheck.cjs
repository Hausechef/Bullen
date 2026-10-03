const fs = require('fs');
let code = fs.readFileSync('src/app/trading/pages/admin/AdminUsers.tsx', 'utf8');

code = code.replace(/\{t\(\`adminUsers\.roles\.\$\{(.*?)\}\`\, (.*?)\)\}/g, "{t(`adminUsers.roles.${$1 || 'client'}`) as string}");
code = code.replace(/\{t\(\`adminUsers\.roles\.\$\{r\}\`\, r\)\}/g, "{t(`adminUsers.roles.${r}`) as string}");

fs.writeFileSync('src/app/trading/pages/admin/AdminUsers.tsx', code);
