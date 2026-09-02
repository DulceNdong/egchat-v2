/**
 * EGChatAudioRecorderBridge.swift
 * Grabación de voz nativa — AAC 128kbps con AEC + ANS via voiceChat mode
 * Mapeado a "EGChatAudioRecorder" en JS
 */

import AVFoundation

@objc(EGChatAudioRecorderBridge)
class EGChatAudioRecorderBridge: NSObject, AVAudioRecorderDelegate {

  @objc static func requiresMainQueueSetup() -> Bool { false }

  private var recorder: AVAudioRecorder?
  private var outputURL: URL?
  private var startTime: Date?

  // MARK: - startRecording

  @objc func startRecording(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let session = AVAudioSession.sharedInstance()
    do {
      try session.setCategory(.playAndRecord,
                              mode: .voiceChat,
                              options: [.allowBluetooth, .defaultToSpeaker])
      try session.setActive(true)
    } catch {
      reject("AUDIO_SESSION", "No se pudo activar la sesión de audio", error)
      return
    }

    let name = "egchat_voice_\(Int(Date().timeIntervalSince1970)).m4a"
    let url  = FileManager.default.temporaryDirectory.appendingPathComponent(name)
    outputURL = url

    let settings: [String: Any] = [
      AVFormatIDKey:              Int(kAudioFormatMPEG4AAC),
      AVSampleRateKey:            44100.0,
      AVNumberOfChannelsKey:      1,
      AVEncoderAudioQualityKey:   AVAudioQuality.high.rawValue,
      AVEncoderBitRateKey:        128_000
    ]

    do {
      recorder = try AVAudioRecorder(url: url, settings: settings)
      recorder?.delegate         = self
      recorder?.isMeteringEnabled = true
      recorder?.record()
      startTime = Date()
      resolve(["path": url.absoluteString, "recording": true])
    } catch {
      reject("RECORDER_START", "No se pudo iniciar la grabación", error)
    }
  }

  // MARK: - stopRecording

  @objc func stopRecording(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let rec = recorder, rec.isRecording else {
      reject("NOT_RECORDING", "No hay grabación activa", nil)
      return
    }
    let duration = Date().timeIntervalSince(startTime ?? Date())
    rec.stop()
    try? AVAudioSession.sharedInstance().setActive(false,
                                                   options: .notifyOthersOnDeactivation)
    guard let url = outputURL else {
      reject("NO_FILE", "No se encontró el archivo grabado", nil)
      return
    }
    resolve(["uri": url.absoluteString, "duration": duration, "mimeType": "audio/aac"])
    recorder  = nil
    outputURL = nil
    startTime = nil
  }

  // MARK: - cancelRecording

  @objc func cancelRecording() {
    recorder?.stop()
    recorder?.deleteRecording()
    recorder  = nil
    outputURL = nil
    startTime = nil
    try? AVAudioSession.sharedInstance().setActive(false,
                                                   options: .notifyOthersOnDeactivation)
  }

  // MARK: - getAmplitude

  @objc func getAmplitude(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let rec = recorder, rec.isRecording else { resolve(0); return }
    rec.updateMeters()
    let power      = rec.averagePower(forChannel: 0)   // -160 … 0 dB
    let normalized = max(0.0, (power + 160.0) / 160.0) // 0 … 1
    resolve(Int(normalized * 32_768))
  }

  // MARK: - AVAudioRecorderDelegate

  func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
    if !flag { print("[AudioRecorder] grabación terminó con error") }
  }
}
