const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'src/app/trading/i18n/config.ts');
let code = fs.readFileSync(configPath, 'utf8').replace(/\r\n/g, '\n');

const adminTxEN = `
        adminTx: {
          globalTitle: "Global Transactions",
          globalDesc: "Monitor all deposits, withdrawals, and fee collections.",
          searchTx: "Search TXID or user...",
          columns: {
            txid: "TXID",
            user: "User",
            type: "Type",
            amount: "Amount",
            status: "Status",
            date: "Date"
          },
          noRealTx: "No real transactions found.",
          depositsTitle: "Pending Deposits",
          depositsDesc: "Review and approve fiat/crypto deposit requests.",
          withdrawalsTitle: "Pending Withdrawals",
          withdrawalsDesc: "Review and process user withdrawal requests.",
          noPending: "No pending requests found.",
          approve: "Approve",
          reject: "Reject",
          processing: "Processing...",
          approveDepositMsg: "Approve deposit of {{amount}} for {{user}}?",
          rejectDepositMsg: "Reject deposit of {{amount}} for {{user}}?",
          approveWithdrawalMsg: "Approve withdrawal of {{amount}} for {{user}}?",
          rejectWithdrawalMsg: "Reject withdrawal of {{amount}} for {{user}}?",
          toastUpdated: "Request updated successfully",
          toastFailed: "Failed to update request"
        },`;

const adminTxDE = `
        adminTx: {
          globalTitle: "Globale Transaktionen",
          globalDesc: "Überwachen Sie alle Einzahlungen, Auszahlungen und Gebühreneinzüge.",
          searchTx: "TXID oder Benutzer suchen...",
          columns: {
            txid: "TXID",
            user: "Benutzer",
            type: "Typ",
            amount: "Betrag",
            status: "Status",
            date: "Datum"
          },
          noRealTx: "Keine echten Transaktionen gefunden.",
          depositsTitle: "Ausstehende Einzahlungen",
          depositsDesc: "Überprüfen und genehmigen Sie Fiat-/Krypto-Einzahlungsanfragen.",
          withdrawalsTitle: "Ausstehende Auszahlungen",
          withdrawalsDesc: "Überprüfen und bearbeiten Sie Auszahlungsanfragen von Benutzern.",
          noPending: "Keine ausstehenden Anfragen gefunden.",
          approve: "Genehmigen",
          reject: "Ablehnen",
          processing: "Wird bearbeitet...",
          approveDepositMsg: "Einzahlung von {{amount}} für {{user}} genehmigen?",
          rejectDepositMsg: "Einzahlung von {{amount}} für {{user}} ablehnen?",
          approveWithdrawalMsg: "Auszahlung von {{amount}} für {{user}} genehmigen?",
          rejectWithdrawalMsg: "Auszahlung von {{amount}} für {{user}} ablehnen?",
          toastUpdated: "Anfrage erfolgreich aktualisiert",
          toastFailed: "Fehler beim Aktualisieren der Anfrage"
        },`;

if (!code.includes('adminTx: {')) {
  // Inject into EN
  code = code.replace(/(\n\s*)adminDashboard: \{/, adminTxEN + "$1adminDashboard: {");
  
  // Inject into DE
  let deIndex = code.indexOf("de: {");
  let deBlock = code.substring(deIndex);
  deBlock = deBlock.replace(/(\n\s*)adminDashboard: \{/, adminTxDE + "$1adminDashboard: {");
  
  code = code.substring(0, deIndex) + deBlock;
  fs.writeFileSync(configPath, code);
  console.log("Injected adminTx into config.ts");
}
