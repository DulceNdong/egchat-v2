package com.egchat.app

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.*
import java.io.ByteArrayOutputStream

/**
 * EGChat — Face Filters Android con ML Kit
 *
 * Detecta puntos faciales (landmarks) en tiempo real usando
 * Google ML Kit Face Detection y los expone a React Native
 * para renderizar filtros AR superpuestos en el stream de video.
 *
 * La renderización del filtro se hace en React Native (Canvas/SVG)
 * usando las coordenadas de los landmarks devueltas por este módulo.
 *
 * Dependencias añadir en build.gradle:
 *   implementation 'com.google.mlkit:face-detection:16.1.5'
 */
class FaceFilterModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "EGChatFaceFilter"

    private var detector: FaceDetector? = null
    private var isActive = false

    @ReactMethod
    fun initialize(promise: Promise) {
        val options = FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
            .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
            .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
            .setContourMode(FaceDetectorOptions.CONTOUR_MODE_ALL)
            .setMinFaceSize(0.15f)
            .enableTracking()
            .build()

        detector = FaceDetection.getClient(options)
        isActive = true
        promise.resolve(true)
    }

    /**
     * Procesa un frame de la cámara (base64 JPEG) y devuelve landmarks faciales.
     * Llamar desde JS en cada frame del stream de video.
     */
    @ReactMethod
    fun detectFaces(base64Frame: String, promise: Promise) {
        if (!isActive || detector == null) {
            promise.resolve(Arguments.createArray())
            return
        }

        try {
            val bytes  = Base64.decode(base64Frame, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
            val image  = InputImage.fromBitmap(bitmap, 0)

            detector!!.process(image)
                .addOnSuccessListener { faces ->
                    val result = Arguments.createArray()
                    faces.forEach { face ->
                        val faceMap = Arguments.createMap().apply {
                            // Bounding box
                            val bb = face.boundingBox
                            putDouble("x", bb.left.toDouble())
                            putDouble("y", bb.top.toDouble())
                            putDouble("width",  bb.width().toDouble())
                            putDouble("height", bb.height().toDouble())

                            // Rotación
                            putDouble("headEulerX", face.headEulerAngleX.toDouble())
                            putDouble("headEulerY", face.headEulerAngleY.toDouble())
                            putDouble("headEulerZ", face.headEulerAngleZ.toDouble())

                            // Landmarks
                            val landmarks = Arguments.createMap()
                            FaceLandmark.NOSE_BASE.let { t ->
                                face.getLandmark(t)?.let { lm ->
                                    val m = Arguments.createMap()
                                    m.putDouble("x", lm.position.x.toDouble())
                                    m.putDouble("y", lm.position.y.toDouble())
                                    landmarks.putMap("nose", m)
                                }
                            }
                            FaceLandmark.LEFT_EYE.let { t ->
                                face.getLandmark(t)?.let { lm ->
                                    val m = Arguments.createMap()
                                    m.putDouble("x", lm.position.x.toDouble())
                                    m.putDouble("y", lm.position.y.toDouble())
                                    landmarks.putMap("leftEye", m)
                                }
                            }
                            FaceLandmark.RIGHT_EYE.let { t ->
                                face.getLandmark(t)?.let { lm ->
                                    val m = Arguments.createMap()
                                    m.putDouble("x", lm.position.x.toDouble())
                                    m.putDouble("y", lm.position.y.toDouble())
                                    landmarks.putMap("rightEye", m)
                                }
                            }
                            FaceLandmark.MOUTH_LEFT.let { t ->
                                face.getLandmark(t)?.let { lm ->
                                    val m = Arguments.createMap()
                                    m.putDouble("x", lm.position.x.toDouble())
                                    m.putDouble("y", lm.position.y.toDouble())
                                    landmarks.putMap("mouthLeft", m)
                                }
                            }
                            FaceLandmark.MOUTH_RIGHT.let { t ->
                                face.getLandmark(t)?.let { lm ->
                                    val m = Arguments.createMap()
                                    m.putDouble("x", lm.position.x.toDouble())
                                    m.putDouble("y", lm.position.y.toDouble())
                                    landmarks.putMap("mouthRight", m)
                                }
                            }
                            putMap("landmarks", landmarks)

                            // Clasificaciones
                            face.smilingProbability?.let { putDouble("smileProb", it.toDouble()) }
                            face.leftEyeOpenProbability?.let { putDouble("leftEyeOpenProb", it.toDouble()) }
                            face.rightEyeOpenProbability?.let { putDouble("rightEyeOpenProb", it.toDouble()) }
                            face.trackingId?.let { putInt("trackingId", it) }
                        }
                        result.pushMap(faceMap)
                    }
                    promise.resolve(result)
                }
                .addOnFailureListener { e ->
                    promise.reject("DETECT_ERROR", e.message)
                }
        } catch (e: Exception) {
            promise.reject("FRAME_ERROR", e.message)
        }
    }

    @ReactMethod
    fun release() {
        isActive = false
        detector?.close()
        detector = null
    }

    @ReactMethod fun addListener(e: String) {}
    @ReactMethod fun removeListeners(c: Int) {}
}
