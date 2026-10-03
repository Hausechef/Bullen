const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'src/app/trading/i18n/config.ts');
let code = fs.readFileSync(configPath, 'utf8').replace(/\r\n/g, '\n');

const adminCrmEN = `
        adminCrm: {
          metrics: {
            connection: "CRM Connection",
            notConfigured: "Not Configured",
            na: "N/A",
            uptime: "Uptime (30d)",
            synced: "Events Synced (24h)",
            vsYesterday: "{{val}}% vs yesterday",
            pending: "Pending Retries",
            active: "{{val}} Active",
            deadLetter: "Dead Letter Queue"
          },
          secret: {
            title: "Webhook Signing Secret",
            subtitle: "Secure your data transmissions",
            hide: "Hide Settings",
            configure: "Configure Secrets",
            warningTitle: "Security Warning",
            warningDesc: "Webhook secrets are used to sign requests sent to your CRM. If the secret is compromised, attackers could spoof webhook events. Never share this key or commit it to version control.",
            enable: "Enable Verification",
            enableDesc: "Sign all outgoing payloads with this secret",
            activeKey: "Active Secret Key",
            rotate: "Rotate Secret",
            save: "Save Changes"
          },
          endpoints: {
            title: "Webhook Endpoints",
            none: "No webhook endpoints configured",
            add: "+ Add New Endpoint"
          },
          dataPolicy: {
            title: "Data Handling Policy",
            desc: "Financial figures, such as <1>balances, transaction amounts, and portfolio values</1>, must come from account records or synchronized CRM events before reporting.",
            balanceTitle: "Balance Classification",
            balanceDesc: "Balances synced to the CRM must carry an explicit source and currency classification before reporting.",
            retentionTitle: "Data Retention",
            retentionDesc: "Sync logs are purged every 30 days. PII (KYC data) is transmitted once and never cached locally."
          },
          audit: {
            title: "Audit Log",
            none: "No recent sync events",
            target: "Target: {{user}}",
            retries: "Retries: {{count}}/5",
            forceRetry: "Force Retry",
            viewAll: "View All Logs"
          }
        },`;

const adminCrmDE = `
        adminCrm: {
          metrics: {
            connection: "CRM-Verbindung",
            notConfigured: "Nicht konfiguriert",
            na: "N/A",
            uptime: "Verfügbarkeit (30d)",
            synced: "Synchronisierte Events (24h)",
            vsYesterday: "{{val}}% im Vergleich zu gestern",
            pending: "Ausstehende Wiederholungen",
            active: "{{val}} Aktiv",
            deadLetter: "Dead-Letter-Queue"
          },
          secret: {
            title: "Webhook-Signaturgeheimnis",
            subtitle: "Sichern Sie Ihre Datenübertragungen",
            hide: "Einstellungen ausblenden",
            configure: "Geheimnisse konfigurieren",
            warningTitle: "Sicherheitswarnung",
            warningDesc: "Webhook-Geheimnisse werden verwendet, um Anfragen an Ihr CRM zu signieren. Wenn das Geheimnis kompromittiert ist, könnten Angreifer Webhook-Ereignisse fälschen. Teilen Sie diesen Schlüssel niemals und committen Sie ihn nicht in die Versionskontrolle.",
            enable: "Verifizierung aktivieren",
            enableDesc: "Signieren Sie alle ausgehenden Payloads mit diesem Geheimnis",
            activeKey: "Aktiver geheimer Schlüssel",
            rotate: "Geheimnis rotieren",
            save: "Änderungen speichern"
          },
          endpoints: {
            title: "Webhook-Endpunkte",
            none: "Keine Webhook-Endpunkte konfiguriert",
            add: "+ Neuen Endpunkt hinzufügen"
          },
          dataPolicy: {
            title: "Datenrichtlinie",
            desc: "Finanzielle Kennzahlen wie <1>Guthaben, Transaktionsbeträge und Portfoliowerte</1> müssen aus Kontounterlagen oder synchronisierten CRM-Ereignissen stammen, bevor sie gemeldet werden.",
            balanceTitle: "Guthabenklassifizierung",
            balanceDesc: "Guthaben, die mit dem CRM synchronisiert werden, müssen vor der Meldung eine explizite Quellen- und Währungsklassifizierung tragen.",
            retentionTitle: "Vorratsdatenspeicherung",
            retentionDesc: "Sync-Protokolle werden alle 30 Tage gelöscht. PII (KYC-Daten) werden einmal übertragen und niemals lokal zwischengespeichert."
          },
          audit: {
            title: "Audit-Protokoll",
            none: "Keine aktuellen Synchronisierungsereignisse",
            target: "Ziel: {{user}}",
            retries: "Wiederholungen: {{count}}/5",
            forceRetry: "Erneuter Versuch erzwingen",
            viewAll: "Alle Protokolle anzeigen"
          }
        },`;

if (!code.includes('adminCrm: {')) {
  // Inject into EN
  code = code.replace(/(\n\s*)adminTx: \{/, adminCrmEN + "$1adminTx: {");
  
  // Inject into DE
  let deIndex = code.indexOf("de: {");
  let deBlock = code.substring(deIndex);
  deBlock = deBlock.replace(/(\n\s*)adminTx: \{/, adminCrmDE + "$1adminTx: {");
  
  code = code.substring(0, deIndex) + deBlock;
  fs.writeFileSync(configPath, code);
  console.log("Injected adminCrm into config.ts");
}
