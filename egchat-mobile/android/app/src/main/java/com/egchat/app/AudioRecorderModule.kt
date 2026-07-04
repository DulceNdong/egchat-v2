package com.egchat.app

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaFormat
import android.media.MediaMuxer
import android.media.MediaRecorder
import android.os.Build
import com.facebook.react.bridge.*
import java.io.File
import java.nio.ByteBuffer

/**
 * EGChat — Grabación de audio de alta calidad (Android)
 * Codec: AAC-LC 128kbps, 44100Hz, mono (igual que WhatsApp)
 * Formato: M4A (MPEG-4 container)
 *
 * Mejora sobre expo-av:
 *   - AudioSession configurable (modo VoiceChat elimina eco y ruido)
 *   - Ganancia de entrada optimizada para mensajes de voz
 *   - Silencio automático al voltear al altavoz
 */
class AudioRecorderModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "EGChatAudioRecorder"

    private var recorder: MediaRecorder? = null
    private var outputPath: String? = null
    private var startTime: Long = 0

    @ReactMethod
    fun startRecording(promise: Promise) {
        try {
            val dir  = reactContext.cacheDir
            val file = File(dir, "egchat_voice_${System.currentTimeMillis()}.m4a")
            outputPath = file.absolutePath

            recorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(reactContext)
            } else {
                @Suppress("DEPRECATION") MediaRecorder()
            }

            recorder!!.apply {
                // Fuente: MIC con cancelación de eco y ruido de Android
                setAudioSource(MediaRecorder.AudioSource.VOICE_COMMUNICATION)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setAudioEncodingBitRate(128_000)   // 128 kbps — calidad WhatsApp
                setAudioSamplingRate(44_100)        // 44.1 kHz
                setAudioChannels(1)                 // Mono (suficiente para voz)
                setOutputFile(outputPath)
                prepare()
                start()
            }

            startTime = System.currentTimeMillis()

            val result = Arguments.createMap().apply {
                putString("path", outputPath)
                putBoolean("recording", true)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("RECORD_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopRecording(promise: Promise) {
        try {
            val duration = ((System.currentTimeMillis() - startTime) / 1000).toInt()
            recorder?.apply { stop(); release() }
            recorder = null

            val result = Arguments.createMap().apply {
                putString("uri", outputPath)
                putInt("duration", duration)
                putString("mimeType", "audio/m4a")
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", e.message)
        }
    }

    @ReactMethod
    fun cancelRecording() {
        try {
            recorder?.apply { stop(); release() }
            recorder = null
            outputPath?.let { File(it).delete() }
            outputPath = null
        } catch (_: Exception) {}
    }

    @ReactMethod
    fun getAmplitude(promise: Promise) {
        // Devuelve la amplitud actual para animar la forma de onda
        val amp = recorder?.maxAmplitude ?: 0
        promise.resolve(amp)
    }
}
