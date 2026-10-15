import { useTelephony } from './callStore';

export function PhoneAudioNotice() {
  const blocked = useTelephony((s) => s.audioBlocked);
  const resume = useTelephony((s) => s.resumeAudio);
  if (!blocked) return null;
  return <div role="alert" className="px-4 py-3 text-sm text-amber-300 bg-amber-500/10">
    <p>Der Browser hat die Audiowiedergabe blockiert.</p>
    <button onClick={resume} className="mt-2 px-4 py-2 rounded-lg bg-amber-300 text-black">Ton einschalten</button>
  </div>;
}
