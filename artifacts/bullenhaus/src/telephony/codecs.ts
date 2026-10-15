import type { SessionDescriptionHandlerModifier } from 'sip.js';

// This PBX has no Opus transcoder. Negotiate the same G.711 audio on both
// WebRTC and PSTN legs instead of accepting a call whose media cannot bridge.
export const useG711: SessionDescriptionHandlerModifier = async (description) => {
  if (!description.sdp) return description;
  const sections = description.sdp.split(/(?=^m=)/m);
  const sdp = sections.map((section) => {
    if (!section.startsWith('m=audio ')) return section;
    const lines = section.trimEnd().split(/\r?\n/);
    const media = lines[0].split(/\s+/);
    if (media[1] === '0') return section;
    const offered = media.slice(3);
    const speech = offered.filter((pt) => pt === '0' || pt === '8' || lines.some((line) => new RegExp(`^a=rtpmap:${pt} (?:PCMU|PCMA)/8000(?:/1)?$`, 'i').test(line)));
    if (!speech.length) throw new Error('G.711 audio is required by this PBX');
    const tones = offered.filter((pt) => lines.some((line) => new RegExp(`^a=rtpmap:${pt} telephone-event/8000(?:/1)?$`, 'i').test(line)));
    const allowed = new Set([...speech, ...tones]);
    lines[0] = [...media.slice(0, 3), ...speech, ...tones].join(' ');
    return lines.filter((line) => {
      const payload = /^a=(?:rtpmap|fmtp|rtcp-fb):(\d+)\b/.exec(line);
      return !payload || allowed.has(payload[1]);
    }).join('\r\n') + '\r\n';
  }).join('');
  return { ...description, sdp };
};
