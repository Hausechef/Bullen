import React from 'react';
import { LegalLayout } from './LegalLayout';

const sections = [
  {
    heading: 'Introduction',
    body: (
      <p>Bullenhaus GmbH ("we", "our", "us") is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and share information about you when you use our trading platform and related services, in accordance with the EU General Data Protection Regulation (GDPR) and applicable data protection laws.</p>
    ),
  },
  {
    heading: 'Data We Collect',
    body: (
      <>
        <p>We collect the following categories of personal data:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li><strong className="text-white">Identity Data:</strong> Full name, date of birth, nationality, government-issued ID documents.</li>
          <li><strong className="text-white">Contact Data:</strong> Email address, phone number, postal address, country of residence.</li>
          <li><strong className="text-white">Financial Data:</strong> Bank account details, payment card information, transaction history, portfolio data.</li>
          <li><strong className="text-white">Technical Data:</strong> IP address, browser type, device identifiers, login times, and usage data.</li>
          <li><strong className="text-white">KYC/AML Data:</strong> Identity verification documents, proof of address, source of funds declarations.</li>
        </ul>
      </>
    ),
  },
  {
    heading: 'Legal Basis for Processing',
    body: (
      <>
        <p>We process your personal data under the following legal bases:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li><strong className="text-white">Contract Performance:</strong> Processing necessary to provide our trading services.</li>
          <li><strong className="text-white">Legal Obligation:</strong> Compliance with AML, KYC, tax reporting, and financial regulations.</li>
          <li><strong className="text-white">Legitimate Interests:</strong> Fraud prevention, platform security, and service improvement.</li>
          <li><strong className="text-white">Consent:</strong> Marketing communications, where you have provided explicit consent.</li>
        </ul>
      </>
    ),
  },
  {
    heading: 'How We Use Your Data',
    body: (
      <>
        <p>Your data is used to: verify your identity and comply with KYC/AML obligations; process deposits, withdrawals, and trades; provide customer support; detect and prevent fraud; send service notifications; and comply with legal and regulatory requirements.</p>
        <p>We do not sell your personal data to third parties for marketing purposes.</p>
      </>
    ),
  },
  {
    heading: 'Data Sharing',
    body: (
      <p>We may share your data with: identity verification providers; payment processors; regulatory authorities and law enforcement when required by law; our group companies; and professional advisors (legal, accounting, auditing). All third parties are required to protect your data in accordance with applicable law and our data processing agreements.</p>
    ),
  },
  {
    heading: 'Data Retention',
    body: (
      <p>We retain your personal data for as long as necessary to provide our services and comply with legal obligations. Financial records and KYC documentation are typically retained for a minimum of 5–10 years after account closure, in accordance with EU AML Directives and tax law requirements.</p>
    ),
  },
  {
    heading: 'Your Rights',
    body: (
      <>
        <p>Under GDPR, you have the right to: access your personal data; rectify inaccurate data; request erasure (subject to legal retention obligations); restrict processing; data portability; and object to processing based on legitimate interests.</p>
        <p>To exercise your rights, contact our Data Protection Officer at <a href="mailto:dpo@bullenhaus.com" className="text-yellow-400 hover:underline">dpo@bullenhaus.com</a>.</p>
      </>
    ),
  },
  {
    heading: 'Cookies',
    body: (
      <p>We use strictly necessary cookies to operate the platform. Optional analytics and preference cookies require your consent. You may manage cookie preferences through your browser settings or our cookie consent tool.</p>
    ),
  },
  {
    heading: 'International Transfers',
    body: (
      <p>Where we transfer personal data outside the European Economic Area, we ensure appropriate safeguards are in place, such as Standard Contractual Clauses (SCCs) approved by the European Commission.</p>
    ),
  },
  {
    heading: 'Contact',
    body: (
      <p>For privacy-related inquiries, contact our Data Protection Officer at <a href="mailto:dpo@bullenhaus.com" className="text-yellow-400 hover:underline">dpo@bullenhaus.com</a> or write to: Bullenhaus GmbH, Compliance & Data Protection, Berlin, Germany.</p>
    ),
  },
];

export const PrivacyPolicy: React.FC = () => (
  <LegalLayout
    title="Privacy Policy"
    subtitle="Your privacy matters to us. This policy explains how Bullenhaus collects, uses, and protects your personal data in compliance with GDPR and applicable data protection legislation."
    lastUpdated="January 2025"
    sections={sections}
  />
);
