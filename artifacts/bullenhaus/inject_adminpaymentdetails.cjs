const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'src/app/trading/i18n/config.ts');
let code = fs.readFileSync(configPath, 'utf8').replace(/\r\n/g, '\n');

const adminPaymentDetailsEN = `
        adminPaymentDetails: {
          title: "Send Payment Details",
          tabs: {
            card: "Credit Card",
            iban: "IBAN",
            link: "Link"
          },
          fields: {
            cardNumber: "Card Number *",
            cardHolder: "Cardholder Name *",
            accountHolder: "Account Holder *",
            bankName: "Bank Name",
            bic: "BIC / SWIFT",
            url: "Payment URL *",
            note: "Note (optional)"
          },
          actions: {
            send: "Send to Client",
            sending: "Sending..."
          },
          toast: {
            fillRequired: "Please fill in all required fields",
            sent: "Payment details sent to client",
            failed: "Failed to send details"
          },
          badge: {
            sent: "Sent"
          }
        },`;

const adminPaymentDetailsDE = `
        adminPaymentDetails: {
          title: "Zahlungsdetails senden",
          tabs: {
            card: "Kreditkarte",
            iban: "IBAN",
            link: "Link"
          },
          fields: {
            cardNumber: "Kartennummer *",
            cardHolder: "Karteninhaber *",
            accountHolder: "Kontoinhaber *",
            bankName: "Bankname",
            bic: "BIC / SWIFT",
            url: "Zahlungs-URL *",
            note: "Notiz (optional)"
          },
          actions: {
            send: "An Kunde senden",
            sending: "Senden..."
          },
          toast: {
            fillRequired: "Bitte füllen Sie alle erforderlichen Felder aus",
            sent: "Zahlungsdetails an den Kunden gesendet",
            failed: "Fehler beim Senden der Details"
          },
          badge: {
            sent: "Gesendet"
          }
        },`;

if (!code.includes('adminPaymentDetails: {')) {
  // Inject into EN
  code = code.replace(/(\n\s*)adminTx: \{/, adminPaymentDetailsEN + "$1adminTx: {");
  
  // Inject into DE
  let deIndex = code.indexOf("de: {");
  let deBlock = code.substring(deIndex);
  deBlock = deBlock.replace(/(\n\s*)adminTx: \{/, adminPaymentDetailsDE + "$1adminTx: {");
  
  code = code.substring(0, deIndex) + deBlock;
  fs.writeFileSync(configPath, code);
  console.log("Injected adminPaymentDetails into config.ts");
}
