import { useEffect, useState } from 'react';
import i18n from '../../trading/i18n/config';

export type LoginLanguage = 'en' | 'de';
export const germanLoginText: Record<string, string> = {
  'Bullenhaus home': 'Bullenhaus-Startseite', 'Primary': 'Hauptnavigation',
  'Markets': 'Märkte', 'Premarket': 'Vorhandel', 'Platform': 'Plattform', 'Log In': 'Anmelden',
  'Private multi-asset trading terminal': 'Privates Handelsterminal für mehrere Anlageklassen',
  'Trade crypto, Forex & metals': 'Krypto, Devisen und Metalle handeln',
  'with a premium edge': 'mit erstklassigen Funktionen',
  'Fast execution, premarket access and the iTools analytics suite — one elegant terminal on desktop and mobile.': 'Schnelle Ausführung, Zugang zum Vorhandel und die iTools-Analysewerkzeuge — in einem eleganten Terminal für Desktop und Mobilgeräte.',
  'Log in to your account': 'Bei Ihrem Konto anmelden', 'Open an account': 'Konto eröffnen',
  'Crypto': 'Krypto', 'Forex': 'Devisen', 'Metals': 'Metalle', 'Risk controls': 'Risikokontrollen',
  'Live market overview': 'Aktueller Marktüberblick', 'Crypto, Forex & Metals at a glance': 'Krypto, Devisen und Metalle im Überblick',
  'Cryptocurrencies': 'Kryptowährungen', 'Live': 'Live', 'Demo': 'Demo',
  'Live cryptocurrency prices': 'Aktuelle Kryptowährungskurse',
  'Live last price & 24h change via public exchange feed.': 'Aktueller Kurs und 24-Stunden-Veränderung aus einem öffentlichen Börsenfeed.',
  'Reference rates are live; intraday change % is indicative (simulated).': 'Referenzkurse sind aktuell; die prozentuale Tagesveränderung ist indikativ (simuliert).',
  'Demo prices — a metals feed is not yet connected.': 'Demokurse — ein Kursfeed für Metalle ist noch nicht angebunden.',
  'No market data available.': 'Keine Marktdaten verfügbar.',
  'Live market feed unavailable — showing demo data.': 'Live-Marktdaten sind nicht verfügbar — Demodaten werden angezeigt.',
  'Gold': 'Gold', 'Silver': 'Silber', 'Platinum': 'Platin', 'Palladium': 'Palladium',
  'Why Bullenhaus': 'Warum Bullenhaus', 'Everything a modern trader needs': 'Alles, was moderne Trader benötigen',
  'A premium multi-asset terminal built for speed, clarity and control.': 'Ein erstklassiges Terminal für mehrere Anlageklassen — entwickelt für Geschwindigkeit, Übersicht und Kontrolle.',
  'Platform advantages': 'Vorteile der Plattform', 'Multi-asset access': 'Zugang zu mehreren Anlageklassen',
  'Trade crypto, Forex and precious metals from one unified account.': 'Handeln Sie Krypto, Devisen und Edelmetalle mit einem einzigen Konto.',
  'Fast execution': 'Schnelle Ausführung', 'Low-latency order routing so your fills track the price you see.': 'Orderweiterleitung mit geringer Latenz, damit die Ausführung dem angezeigten Kurs folgt.',
  'Risk management': 'Risikomanagement', 'Stop-loss, take-profit and margin controls built into every ticket.': 'Stop-Loss, Take-Profit und Margenkontrollen direkt in jeder Ordermaske.',
  'Smart alerts': 'Intelligente Benachrichtigungen', 'Price and volatility alerts that reach you on desktop and mobile.': 'Kurs- und Volatilitätsmeldungen auf Desktop und Mobilgeräten.',
  'Market overview': 'Marktüberblick', 'Clean, responsive charts with the depth serious traders expect.': 'Übersichtliche, reaktionsschnelle Charts mit der Detailtiefe für anspruchsvolle Trader.',
  'Desktop & mobile': 'Desktop und Mobilgeräte', 'A consistent premium terminal on every screen size.': 'Ein einheitliches, erstklassiges Terminal für jede Bildschirmgröße.',
  'Get in before the crowd': 'Frühzeitig einsteigen',
  'Access premarket opportunities and pre-IPO style allocations the moment they open. Position early on emerging assets with transparent terms and a fixed price at signing.': 'Nutzen Sie Vorhandelsmöglichkeiten und Zuteilungen vor einem möglichen Börsengang, sobald sie verfügbar sind. Positionieren Sie sich frühzeitig in neuen Vermögenswerten — mit transparenten Bedingungen und einem bei Vertragsabschluss festgelegten Preis.',
  'Early access to pre-market assets': 'Früher Zugang zu Vermögenswerten im Vorhandel', 'Fixed price locked at signing': 'Festpreis bei Vertragsabschluss',
  'Transparent, contract-backed allocations': 'Transparente, vertraglich geregelte Zuteilungen', 'Explore premarket': 'Vorhandel entdecken',
  'Early entry': 'Früher Einstieg', 'Pre-launch': 'Vor dem Marktstart', 'Upside potential': 'Wachstumspotenzial', 'High': 'Hoch',
  'Terms': 'Bedingungen', 'Contract-backed': 'Vertraglich geregelt', 'Price': 'Preis', 'Fixed at signing': 'Bei Vertragsabschluss festgelegt',
  'AI insights': 'KI-Einblicke', 'Signal scoring': 'Signalbewertung', 'Analytics': 'Analysen', 'Market depth': 'Markttiefe',
  'Alerts': 'Benachrichtigungen', 'Real-time': 'Echtzeit', 'Risk radar': 'Risikoradar', 'Exposure view': 'Risikoübersicht',
  'Analytics that work while you trade': 'Analysen, die Sie beim Handel unterstützen',
  "iTools is the platform's analytical module: market scanning, signal scoring, risk exposure and volatility alerts in one place — so you spend less time hunting and more time deciding.": 'iTools ist das Analysemodul der Plattform: Marktsuche, Signalbewertung, Risikoübersicht und Volatilitätsmeldungen an einem Ort — damit Sie weniger suchen und fundierter entscheiden können.',
  'Cross-asset market scanner': 'Marktscanner für mehrere Anlageklassen', 'Volatility & momentum signals': 'Volatilitäts- und Momentumsignale',
  'Portfolio risk & exposure radar': 'Radar für Portfoliorisiken und Positionen', 'Platform strength': 'Stärken der Plattform',
  'Built for serious execution': 'Für anspruchsvollen Handel entwickelt', 'Strong platform features': 'Leistungsstarke Plattformfunktionen',
  'Multi-asset trading': 'Handel mit mehreren Anlageklassen',
  'Crypto, Forex majors, and metals side by side — diversify without switching platforms.': 'Krypto, wichtige Devisenpaare und Metalle nebeneinander — diversifizieren Sie, ohne die Plattform zu wechseln.',
  'Fast, precise fills': 'Schnelle, präzise Ausführung', 'A responsive engine and live pricing keep execution tight during fast markets.': 'Eine reaktionsschnelle Handelsengine und aktuelle Kurse unterstützen eine präzise Ausführung in dynamischen Märkten.',
  'Global markets': 'Globale Märkte', 'Follow currencies and commodities around the clock with a live market overview.': 'Verfolgen Sie Währungen und Rohstoffe rund um die Uhr mit einem aktuellen Marktüberblick.',
  'Limited offer': 'Zeitlich begrenztes Angebot', 'Start trading with a premium edge': 'Starten Sie mit erstklassigen Handelsfunktionen',
  'Open an account today and unlock multi-asset trading, premarket access and the full iTools analytics suite. Fast onboarding, transparent terms, and support on desktop and mobile.': 'Eröffnen Sie heute ein Konto und erhalten Sie Zugang zum Handel mit mehreren Anlageklassen, zum Vorhandel und zu allen iTools-Analysewerkzeugen. Schneller Einstieg, transparente Bedingungen und Unterstützung auf Desktop und Mobilgeräten.',
  'Welcome package': 'Willkommenspaket', 'Priority onboarding': 'Bevorzugte Kontoaktivierung', 'iTools included': 'iTools inklusive',
  'Full analytics suite': 'Alle Analysewerkzeuge', 'Premarket access': 'Zugang zum Vorhandel', 'Early allocations': 'Frühzeitige Zuteilungen',
  'Log in to continue': 'Anmelden und fortfahren', 'Create an account': 'Konto erstellen',
  'Trading involves risk. Promotional content describes platform features only.': 'Der Handel ist mit Risiken verbunden. Werbeinhalte beschreiben ausschließlich die Funktionen der Plattform.',
  'Bullenhaus. Trading involves risk.': 'Bullenhaus. Der Handel ist mit Risiken verbunden.',
  'Legal': 'Rechtliche Informationen', 'Privacy': 'Datenschutz', 'Contact': 'Kontakt',
  'Terminal access': 'Zugang zum Terminal', 'Welcome back': 'Willkommen zurück', 'Close login': 'Anmeldung schließen',
  'Email or Login': 'E-Mail oder Benutzername', 'Password': 'Passwort', 'Remember me': 'Angemeldet bleiben', 'Forgot password?': 'Passwort vergessen?',
  'New to Bullenhaus?': 'Neu bei Bullenhaus?', 'Apply for access': 'Zugang beantragen',
  'Account pending activation. Please contact support to verify your account.': 'Ihr Konto wartet auf die Aktivierung. Bitte wenden Sie sich zur Überprüfung Ihres Kontos an den Support.',
  'Invalid email or password. Please try again.': 'Ungültige E-Mail-Adresse oder ungültiges Passwort. Bitte versuchen Sie es erneut.',
  'Too many attempts. Please wait a few minutes and try again.': 'Zu viele Versuche. Bitte warten Sie einige Minuten und versuchen Sie es erneut.',
  'Network error. Please check your connection and try again.': 'Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
  'Unable to sign in. Please check your credentials or contact support.': 'Anmeldung nicht möglich. Bitte überprüfen Sie Ihre Zugangsdaten oder kontaktieren Sie den Support.',
  'This account is disabled. Please contact support.': 'Dieses Konto ist deaktiviert. Bitte kontaktieren Sie den Support.',
  'Please enter the email address registered for this account.': 'Bitte geben Sie die für dieses Konto registrierte E-Mail-Adresse ein.',
  'The sign-in service returned an error. Please try again later or contact support.': 'Der Anmeldedienst hat einen Fehler zurückgegeben. Bitte versuchen Sie es später erneut oder kontaktieren Sie den Support.',
  'Another sign-in operation is still pending. Close other Bullenhaus tabs and try again.': 'Ein anderer Anmeldevorgang läuft noch. Schließen Sie andere Bullenhaus-Tabs und versuchen Sie es erneut.',
};

export function loginText(text: string): string {
  return i18n.language?.split('-')[0] === 'de' ? germanLoginText[text] ?? text : text;
}

export function useLoginLanguage() {
  const readLanguage = (): LoginLanguage => i18n.language?.split('-')[0] === 'de' ? 'de' : 'en';
  const [language, setLanguage] = useState<LoginLanguage>(readLanguage);
  useEffect(() => {
    const sync = () => {
      const next = readLanguage();
      setLanguage(next);
      document.documentElement.lang = next;
    };
    sync();
    i18n.on('languageChanged', sync);
    return () => { i18n.off('languageChanged', sync); };
  }, []);
  return { language, setLanguage: (next: LoginLanguage) => { void i18n.changeLanguage(next); } };
}
