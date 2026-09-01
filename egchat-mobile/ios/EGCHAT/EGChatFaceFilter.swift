import ARKit
import SceneKit
import Vision
import UIKit
import React

/**
 * EGChat — Face Filters iOS con ARKit + Vision
 *
 * Detecta landmarks faciales con Vision Framework y los expone a React Native.
 * Para filtros 3D completos (máscara, gafas virtuales) requiere ARFaceTrackingConfiguration
 * que solo funciona en dispositivos con TrueDepth camera (iPhone X+, Face ID).
 *
 * La renderización se hace en JS usando los landmarks devueltos.
 *
 * Instalación (Mac/Xcode):
 * 1. Copiar a ios/EGChat/
 * 2. Añadir ARKit capability en Signing & Capabilities
 * 3. Info.plist: NSCameraUsageDescription ya existe
 */
@objc(EGChatFaceFilter)
class EGChatFaceFilter: NSObject {

  private var arSession: ARSession?
  private var sceneView: ARSCNView?

  // ── Detección con Vision (sin TrueDepth, funciona en todos los iPhone) ──

  @objc func detectFacesInImage(
    _ base64Image: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let imageData = Data(base64Encoded: base64Image, options: .ignoreUnknownCharacters),
          let uiImage   = UIImage(data: imageData),
          let cgImage   = uiImage.cgImage
    else {
      reject("IMAGE_ERROR", "No se pudo decodificar la imagen", nil)
      return
    }

    let request = VNDetectFaceLandmarksRequest { req, error in
      if let error = error {
        reject("VISION_ERROR", error.localizedDescription, error)
        return
      }

      guard let results = req.results as? [VNFaceObservation] else {
        resolve([])
        return
      }

      let faces = results.map { obs -> [String: Any] in
        let bb = obs.boundingBox
        var dict: [String: Any] = [
          "x": bb.minX,
          "y": 1 - bb.maxY,   // Invertir Y (Vision usa coordenadas normalizadas)
          "width":  bb.width,
          "height": bb.height,
        ]

        // Landmarks Vision
        if let lms = obs.landmarks {
          var landmarks: [String: Any] = [:]

          func point(_ region: VNFaceLandmarkRegion2D?) -> [String: Double]? {
            guard let pts = region?.normalizedPoints, !pts.isEmpty else { return nil }
            let cx = pts.map { Double($0.x) }.reduce(0, +) / Double(pts.count)
            let cy = pts.map { Double($0.y) }.reduce(0, +) / Double(pts.count)
            return ["x": cx * Double(bb.width) + Double(bb.minX),
                    "y": (1 - cy) * Double(bb.height) + Double(1 - bb.maxY)]
          }

          if let nose     = point(lms.nose)         { landmarks["nose"]       = nose }
          if let leftEye  = point(lms.leftEye)      { landmarks["leftEye"]    = leftEye }
          if let rightEye = point(lms.rightEye)     { landmarks["rightEye"]   = rightEye }
          if let outerLips = point(lms.outerLips)   { landmarks["mouth"]      = outerLips }
          if let leftBrow  = point(lms.leftEyebrow) { landmarks["leftBrow"]   = leftBrow }
          if let rightBrow = point(lms.rightEyebrow){ landmarks["rightBrow"]  = rightBrow }

          dict["landmarks"] = landmarks
        }

        // Yaw / roll de la cabeza
        if let yaw  = obs.yaw  { dict["headEulerY"] = Double(truncating: yaw) * 180 / .pi }
        if let roll = obs.roll { dict["headEulerZ"] = Double(truncating: roll) * 180 / .pi }

        return dict
      }
      resolve(faces)
    }

    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    DispatchQueue.global(qos: .userInitiated).async {
      try? handler.perform([request])
    }
  }

  @objc func releaseDetector() {
    arSession?.pause()
    arSession = nil
    sceneView?.removeFromSuperview()
    sceneView = nil
  }
}
