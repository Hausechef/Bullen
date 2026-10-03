const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'src/app/trading/i18n/config.ts');
let code = fs.readFileSync(configPath, 'utf8').replace(/\r\n/g, '\n');

const adminKycEN = `
        adminKyc: {
          title: "KYC Review",
          desc: "Review client identity documents and approve or reject verifications.",
          pendingBadge: "{{count}} pending",
          filters: {
            pending: "Pending",
            all: "All Users"
          },
          columns: {
            client: "Client",
            status: "KYC Status",
            balance: "Balance",
            documents: "Documents",
            submitted: "Submitted",
            actions: "Actions"
          },
          empty: {
            loading: "Loading...",
            noPending: "No pending KYC requests",
            noUsers: "No users found",
            noDocs: "No documents uploaded yet"
          },
          actions: {
            approve: "Approve",
            reject: "Reject"
          },
          toast: {
            loadError: "Could not load: {{error}}",
            approved: "KYC approved for {{email}}",
            approveFailed: "Approval failed",
            rejectConfirm: "Reject KYC for {{email}}?",
            rejected: "KYC rejected for {{email}}",
            rejectFailed: "Rejection failed"
          },
          docs: {
            files: "{{count}} files",
            file: "{{count}} file"
          }
        },`;

const adminKycDE = `
        adminKyc: {
          title: "KYC-Überprüfung",
          desc: "Überprüfen Sie Identitätsdokumente von Kunden und genehmigen oder lehnen Sie Verifizierungen ab.",
          pendingBadge: "{{count}} ausstehend",
          filters: {
            pending: "Ausstehend",
            all: "Alle Benutzer"
          },
          columns: {
            client: "Kunde",
            status: "KYC-Status",
            balance: "Guthaben",
            documents: "Dokumente",
            submitted: "Eingereicht",
            actions: "Aktionen"
          },
          empty: {
            loading: "Laden...",
            noPending: "Keine ausstehenden KYC-Anfragen",
            noUsers: "Keine Benutzer gefunden",
            noDocs: "Noch keine Dokumente hochgeladen"
          },
          actions: {
            approve: "Genehmigen",
            reject: "Ablehnen"
          },
          toast: {
            loadError: "Laden fehlgeschlagen: {{error}}",
            approved: "KYC genehmigt für {{email}}",
            approveFailed: "Genehmigung fehlgeschlagen",
            rejectConfirm: "KYC ablehnen für {{email}}?",
            rejected: "KYC abgelehnt für {{email}}",
            rejectFailed: "Ablehnung fehlgeschlagen"
          },
          docs: {
            files: "{{count}} Dateien",
            file: "{{count}} Datei"
          }
        },`;

if (!code.includes('adminKyc: {')) {
  // Inject into EN
  code = code.replace(/(\n\s*)adminTx: \{/, adminKycEN + "$1adminTx: {");
  
  // Inject into DE
  let deIndex = code.indexOf("de: {");
  let deBlock = code.substring(deIndex);
  deBlock = deBlock.replace(/(\n\s*)adminTx: \{/, adminKycDE + "$1adminTx: {");
  
  code = code.substring(0, deIndex) + deBlock;
  fs.writeFileSync(configPath, code);
  console.log("Injected adminKyc into config.ts");
}
