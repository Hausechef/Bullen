// BullenHaus telephony layer — shared types.
// WebRTC calls via Asterisk + Voxio trunk.

export type TelephonyState =
  | 'OFFLINE'
  | 'CONNECTING'
  | 'REGISTERING'
  | 'READY'
  | 'DIALING'
  | 'RINGING'
  | 'INCOMING'
  | 'CONNECTED'
  | 'HOLD'
  | 'ENDING'
  | 'ENDED'
  | 'BUSY'
  | 'NO_ANSWER'
  | 'FAILED';

export type MicPermission = 'GRANTED' | 'DENIED' | 'NO_DEVICE' | 'DEVICE_REMOVED' | 'PENDING';

export interface TelephonyConfig {
  wssUrl: string;
  sipUser: string;
  sipPassword: string;
  sipDomain: string;
}

export interface AudioDiagnostics {
  microphoneLevel: number;
  remoteLevel: number;
  microphoneTrackLive: boolean;
  remoteTrackLive: boolean;
  outboundAudioPackets: number;
  inboundAudioPackets: number;
  lastUpdatedAt: number | null;
}

export interface ActiveCall {
  direction?: 'outbound' | 'inbound';
  remoteNumber: string;
  remoteName?: string;
  clientId?: string | null;
  callLogId?: string;
  startedAt: number;
  answeredAt?: number;
  muted: boolean;
  onHold: boolean;
}

export interface CallResult {
  status: TelephonyState;
  durationSeconds: number;
  hangupCause?: string;
}
