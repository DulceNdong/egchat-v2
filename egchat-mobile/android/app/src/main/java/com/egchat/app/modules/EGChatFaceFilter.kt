package com.egchat.app.modules

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.Face
import com.google.mlkit.vision.face.FaceContour
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetector
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.google.mlkit.vision.face.FaceLandmark

/**
 * EGChat — Detección facial Android con ML Kit
 * Equivalente al EGChatFaceFilter.swift (Vision Framework) de iOS.
 *
 * Devuelve landmarks normalizados 0-1 para que FaceFilterOverlay.tsx
 * pueda dibujar filtros SVG encima del stream de cámara.
 *
 * Requiere en build.gradle (app):
 *   implementation 'com.google.mlkit:face-detection:16.1.6'
 */
class EGChatFaceFilter(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "EGChatFaceFilter"
    }

    private var detector: FaceDetector? = null

    override fun getName(): String = NAME

    @ReactMethod
    fun initialize(promise: Promise) {
        try {
            val options = FaceDetectorOptions.Builder()
                .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
                .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
                .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
                .setContourMode(FaceDetectorOptions.CONTOUR_MODE_NONE)
                .setMinFaceSize(0.10f)
                .enableTracking()
                .build()

            detector = FaceDetection.getClient(options)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("INIT_ERROR", e.message ?: "Error al inicializar detector")
        }
    }

    @ReactMethod
    fun detectFacesInImage(base64Image: String, promise: Promise) {
        val det = detector
        if (det == null) {
            promise.resolve(Arguments.createArray())
            return
        }

        try {
            // Decodificar base64 → Bitmap
            val bytes = Base64.decode(base64Image, Base64.DEFAULT)
            val bitmap: Bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                ?: run { promise.resolve(Arguments.createArray()); return }

            val image = InputImage.fromBitmap(bitmap, 0)
            val imgW = bitmap.width.toDouble()
            val imgH = bitmap.height.toDouble()

            det.process(image)
                .addOnSuccessListener { faces ->
                    val result: WritableArray = Arguments.createArray()

                    faces.forEach { face ->
                        val faceMap: WritableMap = Arguments.createMap()
                        val bb = face.boundingBox

                        // Posición y tamaño normalizados 0-1
                        faceMap.putDouble("x", bb.left / imgW)
                        faceMap.putDouble("y", bb.top / imgH)
                        faceMap.putDouble("width", bb.width() / imgW)
                        faceMap.putDouble("height", bb.height() / imgH)

                        // Rotación de cabeza
                        faceMap.putDouble("headEulerX", face.headEulerAngleX.toDouble())
                        faceMap.putDouble("headEulerY", face.headEulerAngleY.toDouble())
                        faceMap.putDouble("headEulerZ", face.headEulerAngleZ.toDouble())

                        // Probabilidades de clasificación
                        face.smilingProbability?.let {
                            faceMap.putDouble("smileProb", it.toDouble())
                        }
                        face.leftEyeOpenProbability?.let {
                            faceMap.putDouble("leftEyeOpenProb", it.toDouble())
                        }
                        face.rightEyeOpenProbability?.let {
                            faceMap.putDouble("rightEyeOpenProb", it.toDouble())
                        }

                        face.trackingId?.let { faceMap.putInt("trackingId", it) }

                        // Landmarks normalizados
                        val landmarks: WritableMap = Arguments.createMap()
                        putLandmark(landmarks, face, FaceLandmark.NOSE_BASE, "nose", imgW, imgH)
                        putLandmark(landmarks, face, FaceLandmark.LEFT_EYE, "leftEye", imgW, imgH)
                        putLandmark(landmarks, face, FaceLandmark.RIGHT_EYE, "rightEye", imgW, imgH)
                        putLandmark(landmarks, face, FaceLandmark.MOUTH_BOTTOM, "mouth", imgW, imgH)
                        putLandmark(landmarks, face, FaceLandmark.LEFT_EAR, "leftBrow", imgW, imgH)
                        putLandmark(landmarks, face, FaceLandmark.RIGHT_EAR, "rightBrow", imgW, imgH)
                        putLandmark(landmarks, face, FaceLandmark.MOUTH_LEFT, "mouthLeft", imgW, imgH)
                        putLandmark(landmarks, face, FaceLandmark.MOUTH_RIGHT, "mouthRight", imgW, imgH)
                        faceMap.putMap("landmarks", landmarks)

                        result.pushMap(faceMap)
                    }

                    promise.resolve(result)
                    bitmap.recycle()
                }
                .addOnFailureListener { e ->
                    bitmap.recycle()
                    promise.reject("DETECT_ERROR", e.message ?: "Error en detección facial")
                }

        } catch (e: Exception) {
            promise.reject("IMAGE_ERROR", e.message ?: "No se pudo decodificar la imagen")
        }
    }

    private fun putLandmark(
        map: WritableMap,
        face: Face,
        type: Int,
        key: String,
        imgW: Double,
        imgH: Double
    ) {
        face.getLandmark(type)?.let { lm ->
            val pt: WritableMap = Arguments.createMap()
            pt.putDouble("x", lm.position.x / imgW)
            pt.putDouble("y", lm.position.y / imgH)
            map.putMap(key, pt)
        }
    }

    @ReactMethod
    fun release() {
        detector?.close()
        detector = null
    }
}
