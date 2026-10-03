const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'src/app/trading/i18n/config.ts');
let code = fs.readFileSync(configPath, 'utf8').replace(/\r\n/g, '\n');

const adminUsersEN = `
        adminUsers: {
          title: "User Directory",
          desc: "Manage all registered users and their permissions.",
          search: "Search UUID, email, name, phone...",
          columns: {
            identity: "Identity",
            contact: "Contact",
            uuid: "UUID",
            role: "Role",
            kyc: "KYC",
            balance: "Balance",
            created: "Created",
            actions: "Actions"
          },
          empty: {
            loading: "Loading users...",
            noUsers: "No users found",
            adjust: "Adjust your search or wait for registrations."
          },
          tooltips: {
            view: "View Details",
            edit: "Edit User",
            addBal: "Add Balance",
            remBal: "Remove Balance"
          },
          details: {
            title: "User Details",
            close: "Close",
            identity: "Identity",
            contact: "Contact",
            noPhone: "No phone",
            noCountry: "No country",
            access: "Access",
            role: "Role",
            wallet: "Wallet"
          },
          actions: {
            editUser: "Edit User",
            addAssets: "Add Assets",
            removeAssets: "Remove Assets",
            editAssets: "Edit Assets",
            cancel: "Cancel",
            saveChanges: "Save Changes",
            saving: "Saving..."
          },
          editModal: {
            title: "Edit User",
            firstName: "First Name",
            lastName: "Last Name",
            displayName: "Display Name",
            phone: "Phone",
            country: "Country",
            role: "Role",
            kycStatus: "KYC Status"
          },
          toasts: {
            userUpdated: "User updated",
            failedUpdateUser: "Failed to update user",
            enterValidAmount: "Enter a valid non-negative amount",
            balanceNegative: "Wallet balance cannot be negative",
            walletUpdated: "Wallet updated",
            failedUpdateWallet: "Failed to update wallet",
            prompts: {
              amountToAdd: "Amount to add for {{name}}",
              amountToRemove: "Amount to remove for {{name}}",
              amountToSet: "Amount to set for {{name}}",
              confirmAdd: "Add $\${{amount}} to {{name}}?",
              confirmRemove: "Remove $\${{amount}} from {{name}}?",
              confirmSet: "Set $\${{amount}} for {{name}}?"
            }
          }
        },`;

const adminUsersDE = `
        adminUsers: {
          title: "Benutzerverzeichnis",
          desc: "Verwalten Sie alle registrierten Benutzer und deren Berechtigungen.",
          search: "UUID, E-Mail, Name, Telefon suchen...",
          columns: {
            identity: "Identität",
            contact: "Kontakt",
            uuid: "UUID",
            role: "Rolle",
            kyc: "KYC",
            balance: "Guthaben",
            created: "Erstellt",
            actions: "Aktionen"
          },
          empty: {
            loading: "Benutzer werden geladen...",
            noUsers: "Keine Benutzer gefunden",
            adjust: "Passen Sie Ihre Suche an oder warten Sie auf Registrierungen."
          },
          tooltips: {
            view: "Details ansehen",
            edit: "Benutzer bearbeiten",
            addBal: "Guthaben hinzufügen",
            remBal: "Guthaben entfernen"
          },
          details: {
            title: "Benutzerdetails",
            close: "Schließen",
            identity: "Identität",
            contact: "Kontakt",
            noPhone: "Kein Telefon",
            noCountry: "Kein Land",
            access: "Zugang",
            role: "Rolle",
            wallet: "Brieftasche"
          },
          actions: {
            editUser: "Benutzer bearbeiten",
            addAssets: "Anlagen hinzufügen",
            removeAssets: "Anlagen entfernen",
            editAssets: "Anlagen bearbeiten",
            cancel: "Abbrechen",
            saveChanges: "Änderungen speichern",
            saving: "Speichern..."
          },
          editModal: {
            title: "Benutzer bearbeiten",
            firstName: "Vorname",
            lastName: "Nachname",
            displayName: "Anzeigename",
            phone: "Telefon",
            country: "Land",
            role: "Rolle",
            kycStatus: "KYC-Status"
          },
          toasts: {
            userUpdated: "Benutzer aktualisiert",
            failedUpdateUser: "Fehler beim Aktualisieren des Benutzers",
            enterValidAmount: "Geben Sie einen gültigen, nicht negativen Betrag ein",
            balanceNegative: "Brieftaschenguthaben kann nicht negativ sein",
            walletUpdated: "Brieftasche aktualisiert",
            failedUpdateWallet: "Fehler beim Aktualisieren der Brieftasche",
            prompts: {
              amountToAdd: "Betrag zum Hinzufügen für {{name}}",
              amountToRemove: "Betrag zum Entfernen für {{name}}",
              amountToSet: "Betrag zum Festlegen für {{name}}",
              confirmAdd: "\${{amount}} zu {{name}} hinzufügen?",
              confirmRemove: "\${{amount}} von {{name}} entfernen?",
              confirmSet: "\${{amount}} für {{name}} festlegen?"
            }
          }
        },`;

if (!code.includes('adminUsers: {')) {
  // Inject into EN
  code = code.replace(/(\n\s*)adminDashboard: \{/, adminUsersEN + "$1adminDashboard: {");
  
  // Inject into DE
  let deIndex = code.indexOf("de: {");
  let deBlock = code.substring(deIndex);
  deBlock = deBlock.replace(/(\n\s*)adminDashboard: \{/, adminUsersDE + "$1adminDashboard: {");
  
  code = code.substring(0, deIndex) + deBlock;
  fs.writeFileSync(configPath, code);
  console.log("Injected adminUsers into config.ts");
}
