/**
 * Stub de react-native-webrtc para iOS nativo.
 * El framework de WebRTC consume demasiada RAM al inicializarse en Release.
 * Las llamadas usan solo señalización HTTP (sin media nativa) en este build.
 */
import { View } from 'react-native';

export const RTCPeerConnection = class {
  constructor() {}
  close() {}
  addTrack() {}
  addStream() {}
  createOffer() { return Promise.resolve({ type: 'offer', sdp: '' }); }
  createAnswer() { return Promise.resolve({ type: 'answer', sdp: '' }); }
  setLocalDescription() { return Promise.resolve(); }
  setRemoteDescription() { return Promise.resolve(); }
  addIceCandidate() { return Promise.resolve(); }
  ontrack = null;
  onicecandidate = null;
  onconnectionstatechange = null;
  oniceconnectionstatechange = null;
  connectionState = 'new';
  iceConnectionState = 'new';
  signalingState = 'stable';
  localDescription = null;
};

export const RTCSessionDescription = class {
  constructor(public init: any) {}
};

export const RTCIceCandidate = class {
  constructor(public init: any) {}
  toJSON() { return this.init; }
};

export const mediaDevices = {
  getUserMedia: () => Promise.reject(new Error('WebRTC no disponible en este build')),
  getDisplayMedia: () => Promise.reject(new Error('WebRTC no disponible en este build')),
};

export const RTCView = View;

export default {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  RTCView,
  mediaDevices,
};
