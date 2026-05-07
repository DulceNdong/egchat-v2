package com.egchat.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

/**
 * VoipForegroundService
 * Servicio en primer plano para VoIP — mantiene la app viva en segundo plano.
 * Android no puede matar un servicio con notificación persistente activa.
 *
 * Iniciado por VoipServicePlugin.startForegroundService()
 * Detenido por VoipServicePlugin.stopForegroundService()
 */
public class VoipForegroundService extends Service {

    public static final String CHANNEL_ID   = "egchat-voip-service";
    public static final String CHANNEL_NAME = "EGCHAT VoIP";
    public static final int    NOTIF_ID     = 8001;

    // Flag estático para que VoipServicePlugin.isRunning() pueda consultarlo
    public static boolean isRunning = false;

    // Acciones del Intent
    public static final String ACTION_START = "com.egchat.app.VOIP_START";
    public static final String ACTION_STOP  = "com.egchat.app.VOIP_STOP";

    // Extras opcionales
    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_TEXT  = "text";

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_NOT_STICKY;

        final String action = intent.getAction();

        if (ACTION_STOP.equals(action)) {
            // Detener el servicio limpiamente
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }

        // ACTION_START (o cualquier otro) — iniciar el foreground service
        final String title = intent.getStringExtra(EXTRA_TITLE) != null
            ? intent.getStringExtra(EXTRA_TITLE)
            : "EGCHAT";
        final String text = intent.getStringExtra(EXTRA_TEXT) != null
            ? intent.getStringExtra(EXTRA_TEXT)
            : "App activa para llamadas";

        createNotificationChannel();
        startForeground(NOTIF_ID, buildNotification(title, text));
        isRunning = true;

        // START_STICKY: Android reinicia el servicio si lo mata por memoria
        return START_STICKY;
    }

    // ── Construcción de la notificación persistente ───────────────────────────

    private Notification buildNotification(String title, String text) {
        // Intent para abrir la app al tocar la notificación
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            piFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, openIntent, piFlags);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setContentIntent(pendingIntent)
            .setOngoing(true)           // no se puede deslizar para cerrar
            .setSilent(true)            // sin sonido — es una notificación de estado
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .build();
    }

    // ── Canal de notificación (Android 8+) ────────────────────────────────────

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW  // LOW = sin sonido, sin vibración
            );
            channel.setDescription("Mantiene EGCHAT activo para recibir llamadas");
            channel.setShowBadge(false);

            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(channel);
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null; // Servicio no vinculado
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        isRunning = false;
        stopForeground(true);
    }
}
