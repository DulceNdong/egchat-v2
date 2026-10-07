import Foundation
import AVFoundation

/**
 * EGChat — Grabación de audio iOS (AVAudioRecorder)
 * Codec: AAC 128kbps, 44100Hz, mono
 * AVAudioSession en modo .voiceChat = cancelación de eco + ruido automática
 *
 * Instalación:
 * 1. Copiar a ios/EGChat/
 * 2. Añadir en Xcode al target EGChat
 * 3. Info.plist ya tiene NSMicrophoneUsageDescription
 */
@objc(EGChatAudioRecorder)
class EGChatAudioRecorder: NSObject {

  private var recorder: AVAudioRecorder?
  private var outputURL: URL?
  private var startTime: Date?
  private var amplitudeTimer: Timer?

  @objc func startRecording(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    do {
      // Configurar sesión de audio en modo VoiceChat
      // — activa AEC (cancelación de eco) y ANS (reducción de ruido)
      let session = AVAudioSession.sharedInstance()
      try session.setCategory(
        .playAndRecord,
        mode: .voiceChat,                    // ← clave para calidad de voz
        options: [.defaultToSpeaker, .allowBluetooth]
      )
      try session.setActive(true)

      // Ruta temporal
      let tmpDir = FileManager.default.temporaryDirectory
      let fileName = "egchat_voice_\(Int(Date().timeIntervalSince1970)).m4a"
      let url = tmpDir.appendingPathComponent(fileName)
      outputURL = url

      // Configuración AAC 128kbps — igual calidad que WhatsApp
      let settings: [String: Any] = [
        AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
        AVSampleRateKey: 44100,
        AVNumberOfChannelsKey: 1,
        AVEncoderBitRateKey: 128_000,
        AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue,
      ]

      recorder = try AVAudioRecorder(url: url, settings: settings)
      recorder?.isMeteringEnabled = true
      recorder?.record()
      startTime = Date()

      resolve(["path": url.path, "recording": true])
    } catch {
      reject("RECORD_ERROR", error.localizedDescription, error)
    }
  }

  @objc func stopRecording(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let rec = recorder, let url = outputURL else {
      reject("STOP_ERROR", "No hay grabación activa", nil)
      return
    }
    rec.stop()
    let duration = Int(Date().timeIntervalSince(startTime ?? Date()))

    try? AVAudioSession.sharedInstance().setActive(false)
    recorder = nil

    resolve([
      "uri": url.path,
      "duration": duration,
      "mimeType": "audio/m4a",
    ])
  }

  @objc func cancelRecording() {
    recorder?.stop()
    recorder?.deleteRecording()
    recorder = nil
    outputURL = nil
    try? AVAudioSession.sharedInstance().setActive(false)
  }

  @objc func getAmplitude(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let rec = recorder else { resolve(0); return }
    rec.updateMeters()
    // Convertir dB a valor 0-32768 para compatibilidad con Android
    let db = rec.averagePower(forChannel: 0)
    let normalized = Int(max(0, (db + 60) / 60 * 32768))
    resolve(normalized)
  }
}
