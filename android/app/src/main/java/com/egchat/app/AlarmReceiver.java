package com.egchat.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.PowerManager;

import androidx.core.app.NotificationCompat;

/**
 * AlarmReceiver
 * Se dispara cuando AlarmManager ejecuta la alarma programada.
 * Funciona incluso en modo Doze (setAndAllowWhileIdle).
 */
public class AlarmReceiver extends BroadcastReceiver {

    private static final String CHANNEL_ID   = "egchat-alarms";
    private static final String CHANNEL_NAME = "EGCHAT Alarmas";
    private static final int    NOTIF_ID     = 9001;

    @Override
    public void onReceive(Context context, Intent intent) {

        // Adquirir WakeLock para mantener el CPU activo mientras procesamos
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wl = pm.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "egchat:AlarmWakeLock"
        );
        wl.acquire(10_000L); // máximo 10 segundos

        try {
            // Leer datos del intent
            String title   = intent.getStringExtra("title");
            String body    = intent.getStringExtra("body");
            String chatId  = intent.getStringExtra("chat_id");
            int    alarmId = intent.getIntExtra("alarm_id", NOTIF_ID);

            if (title == null) title = "EGCHAT";
            if (body  == null) body  = "Tienes una notificación pendiente";

            // Crear canal de notificación (Android 8+)
            NotificationManager nm =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Alarmas programadas de EGCHAT");
                channel.enableVibration(true);
                channel.setVibrationPattern(new long[]{0, 250, 250, 250});
                nm.createNotificationChannel(channel);
            }

            // Intent para abrir la app al tocar la notificación
            Intent openIntent = new Intent(context, MainActivity.class);
            openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            if (chatId != null) openIntent.putExtra("chat_id", chatId);

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pi = PendingIntent.getActivity(context, alarmId, openIntent, flags);

            // Construir y mostrar la notificación
            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setAutoCancel(true)
                .setContentIntent(pi)
                .setVibrate(new long[]{0, 250, 250, 250});

            nm.notify(alarmId, builder.build());

            // Disparar evento JavaScript para que la app reaccione
            // (si la app está en foreground, el WebView lo recibirá)
            Intent jsEvent = new Intent("com.egchat.app.ALARM_FIRED");
            jsEvent.putExtra("title",    title);
            jsEvent.putExtra("body",     body);
            jsEvent.putExtra("chat_id",  chatId);
            jsEvent.putExtra("alarm_id", alarmId);
            context.sendBroadcast(jsEvent);

        } finally {
            wl.release();
        }
    }
}
