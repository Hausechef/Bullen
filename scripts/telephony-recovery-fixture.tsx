// Local regression fixture: actual provider/store and SIP wrapper, with explicit
// doubles for auth, network responses, media capture and protocol transport.
// This is NOT a production PSTN/audio test.
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TelephonyProvider } from '../artifacts/bullenhaus/src/telephony/TelephonyProvider';
import { useTelephony } from '../artifacts/bullenhaus/src/telephony/callStore';
import { SipClient } from '../artifacts/bullenhaus/src/telephony/sipClient';

const qa = (window as any).__qa;
qa.store = useTelephony;
qa.actualSipClient = SipClient;
const root = createRoot(document.getElementById('root')!);
qa.render = () => root.render(<StrictMode><TelephonyProvider><div>Telephony regression fixture</div></TelephonyProvider></StrictMode>);
qa.unmount = () => root.unmount();
qa.render();
