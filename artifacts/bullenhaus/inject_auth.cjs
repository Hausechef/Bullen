const fs = require('fs');

let config = fs.readFileSync('./src/app/trading/i18n/config.ts', 'utf8');

const enAuth = `
        auth: {
          errors: {
            signInFailed: "An error occurred during sign in."
          },
          login: {
            title: "Access Terminal",
            subtitle: "Authenticate to enter the elite trading ecosystem.",
            emailLabel: "Email Identity",
            emailPlaceholder: "Username or Operator Email",
            passwordLabel: "Passphrase",
            forgotPassword: "Forgot?",
            loginBtn: "Connect Protocol",
            noAccount: "Unregistered operator?",
            registerBtn: "Apply Here"
          },
          register: {
            errors: {
              firstNameRequired: "First name is required.",
              lastNameRequired: "Last name is required.",
              countryRequired: "Please select your country.",
              phoneRequired: "Phone number is required.",
              registerFailed: "An error occurred during registration."
            },
            successTitle: "Application submitted",
            successSubtitle: "Your account is being prepared. You can sign in shortly.",
            returnToLogin: "Return to login",
            title: "Create account",
            subtitle: "Apply for access to the Bullenhaus terminal.",
            firstNameLabel: "First name",
            firstNamePlaceholder: "John",
            lastNameLabel: "Last name",
            lastNamePlaceholder: "Smith",
            countryLabel: "Country",
            countryPlaceholder: "Select country...",
            phoneLabel: "Phone number",
            phonePlaceholder: "Enter number...",
            phoneDisabledPlaceholder: "Select country first",
            phoneStoredAs: "Will be stored as:",
            emailLabel: "Secure email",
            emailPlaceholder: "you@example.com",
            passwordLabel: "Passphrase",
            passwordPlaceholder: "Minimum 8 characters",
            submitBtn: "Submit application",
            hasAccount: "Already have an account?",
            loginBtn: "Sign in"
          },
          forgotPassword: {
            errors: {
              tooManyRequests: "Too many requests. Please wait a minute and try again.",
              invalidEmail: "Please enter a valid email address.",
              default: "Failed to send reset link. Please check your email and try again."
            },
            successTitle: "Email sent",
            successSubtitle1: "If an account with that email exists, a reset link is on its way.",
            successSubtitle2: "Check your spam folder if the email doesn't arrive within 2-3 minutes.",
            backToLogin: "Back to login",
            title: "Reset password",
            subtitle: "Enter your email - we'll send you a reset link.",
            emailLabel: "Account email",
            emailPlaceholder: "operator@bullenhaus.com",
            sendLinkBtn: "Send reset link"
          },
          resetPassword: {
            errors: {
              passwordsDoNotMatch: "Passwords do not match.",
              passwordTooShort: "Password must be at least 8 characters.",
              linkExpired: "Reset link has expired or was already used. Please request a new one.",
              passwordTooWeak: "Password is too weak. Use at least 8 characters.",
              default: "Failed to update password."
            },
            successTitle: "Password updated",
            successSubtitle: "Redirecting to login...",
            verifyingLink: "Verifying reset link...",
            invalidLinkTitle: "Link invalid",
            invalidLinkSubtitle: "This link has expired or was already used. Please request a new one.",
            requestNewLink: "Request new link",
            title: "New password",
            subtitle: "Enter a new password for your account.",
            newPasswordLabel: "New password",
            newPasswordPlaceholder: "Minimum 8 characters",
            confirmPasswordLabel: "Confirm password",
            confirmPasswordPlaceholder: "Repeat password",
            savePasswordBtn: "Save password"
          }
        },`;

const deAuth = `
        auth: {
          errors: {
            signInFailed: "Während der Anmeldung ist ein Fehler aufgetreten."
          },
          login: {
            title: "Zugangsterminal",
            subtitle: "Authentifizieren Sie sich, um das elitäre Handelsökosystem zu betreten.",
            emailLabel: "E-Mail Identität",
            emailPlaceholder: "Benutzername oder Operator E-Mail",
            passwordLabel: "Passphrase",
            forgotPassword: "Vergessen?",
            loginBtn: "Verbindungsprotokoll",
            noAccount: "Nicht registrierter Operator?",
            registerBtn: "Hier bewerben"
          },
          register: {
            errors: {
              firstNameRequired: "Vorname ist erforderlich.",
              lastNameRequired: "Nachname ist erforderlich.",
              countryRequired: "Bitte wählen Sie Ihr Land aus.",
              phoneRequired: "Telefonnummer ist erforderlich.",
              registerFailed: "Während der Registrierung ist ein Fehler aufgetreten."
            },
            successTitle: "Bewerbung eingereicht",
            successSubtitle: "Ihr Konto wird vorbereitet. Sie können sich in Kürze anmelden.",
            returnToLogin: "Zurück zum Login",
            title: "Konto erstellen",
            subtitle: "Bewerben Sie sich für den Zugang zum Bullenhaus-Terminal.",
            firstNameLabel: "Vorname",
            firstNamePlaceholder: "Max",
            lastNameLabel: "Nachname",
            lastNamePlaceholder: "Mustermann",
            countryLabel: "Land",
            countryPlaceholder: "Land auswählen...",
            phoneLabel: "Telefonnummer",
            phonePlaceholder: "Nummer eingeben...",
            phoneDisabledPlaceholder: "Zuerst Land auswählen",
            phoneStoredAs: "Wird gespeichert als:",
            emailLabel: "Sichere E-Mail",
            emailPlaceholder: "sie@beispiel.com",
            passwordLabel: "Passphrase",
            passwordPlaceholder: "Mindestens 8 Zeichen",
            submitBtn: "Bewerbung einreichen",
            hasAccount: "Haben Sie bereits ein Konto?",
            loginBtn: "Anmelden"
          },
          forgotPassword: {
            errors: {
              tooManyRequests: "Zu viele Anfragen. Bitte warten Sie eine Minute und versuchen Sie es erneut.",
              invalidEmail: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
              default: "Senden des Zurücksetzungslinks fehlgeschlagen. Bitte überprüfen Sie Ihre E-Mail und versuchen Sie es erneut."
            },
            successTitle: "E-Mail gesendet",
            successSubtitle1: "Wenn ein Konto mit dieser E-Mail-Adresse existiert, ist ein Link zum Zurücksetzen unterwegs.",
            successSubtitle2: "Überprüfen Sie Ihren Spam-Ordner, falls die E-Mail nicht innerhalb von 2-3 Minuten ankommt.",
            backToLogin: "Zurück zum Login",
            title: "Passwort zurücksetzen",
            subtitle: "Geben Sie Ihre E-Mail-Adresse ein - wir senden Ihnen einen Link zum Zurücksetzen.",
            emailLabel: "Konto-E-Mail",
            emailPlaceholder: "operator@bullenhaus.com",
            sendLinkBtn: "Link senden"
          },
          resetPassword: {
            errors: {
              passwordsDoNotMatch: "Die Passwörter stimmen nicht überein.",
              passwordTooShort: "Das Passwort muss mindestens 8 Zeichen lang sein.",
              linkExpired: "Der Link zum Zurücksetzen ist abgelaufen oder wurde bereits verwendet. Bitte fordern Sie einen neuen an.",
              passwordTooWeak: "Das Passwort ist zu schwach. Verwenden Sie mindestens 8 Zeichen.",
              default: "Passwortaktualisierung fehlgeschlagen."
            },
            successTitle: "Passwort aktualisiert",
            successSubtitle: "Weiterleitung zum Login...",
            verifyingLink: "Link wird überprüft...",
            invalidLinkTitle: "Link ungültig",
            invalidLinkSubtitle: "Dieser Link ist abgelaufen oder wurde bereits verwendet. Bitte fordern Sie einen neuen an.",
            requestNewLink: "Neuen Link anfordern",
            title: "Neues Passwort",
            subtitle: "Geben Sie ein neues Passwort für Ihr Konto ein.",
            newPasswordLabel: "Neues Passwort",
            newPasswordPlaceholder: "Mindestens 8 Zeichen",
            confirmPasswordLabel: "Passwort bestätigen",
            confirmPasswordPlaceholder: "Passwort wiederholen",
            savePasswordBtn: "Passwort speichern"
          }
        },`;

// Find end of EN common
config = config.replace(
  /(adminLayout: {[\s\S]*?signOut: "Sign Out"\n          }\n        }),/,
  `$1,\n${enAuth}`
);

// Find end of DE common
config = config.replace(
  /(adminLayout: {[\s\S]*?signOut: "Abmelden"\n          }\n        }),/,
  `$1,\n${deAuth}`
);

fs.writeFileSync('./src/app/trading/i18n/config.ts', config);
console.log('Injected Auth translations');
