package com.egchat.app.modules

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File

/**
 * EGChat — Grabación de audio nativa Android
 * Equivalente al EGChatAudioRecorder.swift de iOS.
 *
 * Codec: AAC 128kbps en archivo .m4a
 * Fuente de audio: VOICE_COMMUNICATION — activa AEC (cancelación de eco)
 *                  y ANS (supresión de ruido) automáticamente.
 *
 * Compatible con la misma API TypeScript que el módulo iOS.
 */
class EGChatAudioRecorder(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "EGChatAudioRecorder"
    }

    private var recorder: MediaRecorder? = null
    private var outputPath: String? = null
    private var startTimeMs: Long = 0L
    private var isRecording = false

    override fun getName(): String = NAME

    @ReactMethod
    fun startRecording(promise: Promise) {
        if (isRecording) {
            promise.reject("ALREADY_RECORDING", "Ya hay una grabación activa")
            return
        }

        try {
            // Archivo de salida en caché de la app
            val cacheDir = reactContext.cacheDir
            val fileName = "egchat_voice_${System.currentTimeMillis()}.m4a"
            val file = File(cacheDir, fileName)
            outputPath = file.absolutePath

            recorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(reactContext)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }

            recorder!!.apply {
                // VOICE_COMMUNICATION activa AEC + AGC + ANS automáticamente
                setAudioSource(MediaRecorder.AudioSource.VOICE_COMMUNICATION)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setAudioSamplingRate(44100)
                setAudioEncodingBitRate(128_000)
                setAudioChannels(1)
                setOutputFile(outputPath)
                prepare()
                start()
            }

            isRecording = true
            startTimeMs = System.currentTimeMillis()

            val result = Arguments.createMap().apply {
                putString("path", outputPath)
                putBoolean("recording", true)
            }
            promise.resolve(result)

        } catch (e: Exception) {
            recorder?.release()
            recorder = null
            isRecording = false
            promise.reject("RECORD_ERROR", e.message ?: "Error al iniciar grabación")
        }
    }

    @ReactMethod
    fun stopRecording(promise: Promise) {
        if (!isRecording || recorder == null) {
            promise.reject("STOP_ERROR", "No hay grabación activa")
            return
        }

        try {
            recorder!!.stop()
            recorder!!.release()
            recorder = null

            val durationSeconds = ((System.currentTimeMillis() - startTimeMs) / 1000).toInt()
            isRecording = false

            val result = Arguments.createMap().apply {
                putString("uri", outputPath)
                putInt("duration", durationSeconds)
                putString("mimeType", "audio/m4a")
            }
            promise.resolve(result)

        } catch (e: Exception) {
            recorder?.release()
            recorder = null
            isRecording = false
            promise.reject("STOP_ERROR", e.message ?: "Error al detener grabación")
        }
    }

    @ReactMethod
    fun cancelRecording() {
        try {
            recorder?.stop()
        } catch (e: Exception) { /* ignorar */ }
        recorder?.release()
        recorder = null
        isRecording = false

        // Eliminar el archivo incompleto
        outputPath?.let { File(it).delete() }
        outputPath = null
    }

    /**
     * Devuelve la amplitud actual 0-32767 para animar la forma de onda.
     * Equivalente al getAmplitude() de iOS (normalizado igual).
     */
    @ReactMethod
    fun getAmplitude(promise: Promise) {
        val amp = try {
            recorder?.maxAmplitude ?: 0
        } catch (e: Exception) {
            0
        }
        promise.resolve(amp)
    }
}
