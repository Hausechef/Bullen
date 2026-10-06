import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import './RecoveryLanding.css';

export function RecoveryLanding() {
  const configuredRecoveryUrl = ((import.meta as any).env?.VITE_RECOVERY_URL as string | undefined)?.trim();
  const recoveryProjectUrl = configuredRecoveryUrl || 'http://localhost:3001/';

  return (
    <main className="recovery-landing">
      <img
        className="recovery-landing__background"
        src="/bullenhaus-gateway.jpg"
        alt=""
        aria-hidden="true"
        fetchPriority="high"
      />
      <div className="recovery-landing__veil" aria-hidden="true" />

      <header className="recovery-landing__header">
        <Link className="recovery-landing__back" to="/">
          <ArrowLeft size={16} aria-hidden="true" />
          Platform selection
        </Link>
        <span className="recovery-landing__brand"><b>BH</b>Bullenhaus</span>
      </header>

      <section className="recovery-landing__content" aria-labelledby="recovery-title">
        <div className="recovery-landing__frame">
          <p className="recovery-landing__eyebrow">
            <ShieldCheck size={15} aria-hidden="true" />
            Bullenhaus recovery division
          </p>
          <div className="recovery-landing__title-row">
            <h1 id="recovery-title">Recovery</h1>
            <span aria-hidden="true">01</span>
          </div>
          <p className="recovery-landing__description">
            A private case workspace for protecting your claim, submitting evidence, and following every recovery milestone.
          </p>
          <a className="recovery-landing__cta" href={recoveryProjectUrl}>
            Enter secure workspace
            <ArrowRight size={18} aria-hidden="true" />
          </a>
          <dl className="recovery-landing__assurances" aria-label="Recovery service qualities">
            <div><dt>Private</dt><dd>Client access</dd></div>
            <div><dt>Traceable</dt><dd>Case progress</dd></div>
            <div><dt>Protected</dt><dd>Evidence vault</dd></div>
          </dl>
        </div>
      </section>

      <p className="recovery-landing__footer">Secure client access · Bullenhaus Recovery · Est. 2026</p>
    </main>
  );
}
