package com.egchat.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * AlarmPlugin
 * Plugin Capacitor que expone scheduleAlarm() y cancelAlarm() a JavaScript.
 *
 * Uso desde JS:
 *   import { registerPlugin } from '@capacitor/core';
 *   const AlarmPlugin = registerPlugin('AlarmPlugin');
 *   await AlarmPlugin.scheduleAlarm({ triggerTimeInMillis: Date.now() + 60000 });
 */
@CapacitorPlugin(name = "AlarmPlugin")
public class AlarmPlugin extends Plugin {

    /**
     * scheduleAlarm({ triggerTimeInMillis, title?, body?, chatId?, alarmId? })
     *
     * Programa una alarma que supera las restricciones del modo Doze.
     * - API >= 23: usa setAndAllowWhileIdle() — se ejecuta aunque el dispositivo esté en Doze
     * - API < 23:  usa set() estándar
     *
     * @param call PluginCall con los parámetros desde JavaScript
     */
    @PluginMethod
    public void scheduleAlarm(PluginCall call) {
        // Leer parámetros
        Long triggerTimeInMillis = call.getLong("triggerTimeInMillis");
        if (triggerTimeInMillis == null || triggerTimeInMillis <= 0) {
            call.reject("triggerTimeInMillis es requerido y debe ser > 0");
            return;
        }

        String title   = call.getString("title",   "EGCHAT");
        String body    = call.getString("body",    "Tienes una notificación");
        String chatId  = call.getString("chatId",  "");
        int    alarmId = call.getInt("alarmId",    (int)(System.currentTimeMillis() % Integer.MAX_VALUE));

        Context context = getContext();

        // Construir el Intent para AlarmReceiver
        Intent intent = new Intent(context, AlarmReceiver.class);
        intent.putExtra("title",    title);
        intent.putExtra("body",     body);
        intent.putExtra("chat_id",  chatId);
        intent.putExtra("alarm_id", alarmId);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context,
            alarmId,
            intent,
            flags
        );

        AlarmManager alarmManager =
            (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

        if (alarmManager == null) {
            call.reject("AlarmManager no disponible en este dispositivo");
            return;
        }

        // Programar la alarma según la versión de Android
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            // API 23+ — setAndAllowWhileIdle supera el modo Doze
            // Para llamadas críticas usar setExactAndAllowWhileIdle
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,  // RTC_WAKEUP despierta el CPU
                triggerTimeInMillis,
                pendingIntent
            );
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            // API 19-22 — setExact para mayor precisión
            alarmManager.setExact(
                AlarmManager.RTC_WAKEUP,
                triggerTimeInMillis,
                pendingIntent
            );
        } else {
            // API < 19 — set estándar
            alarmManager.set(
                AlarmManager.RTC_WAKEUP,
                triggerTimeInMillis,
                pendingIntent
            );
        }

        // Responder a JavaScript con éxito
        JSObject result = new JSObject();
        result.put("scheduled", true);
        result.put("alarmId",   alarmId);
        result.put("triggerAt", triggerTimeInMillis);
        call.resolve(result);
    }

    /**
     * cancelAlarm({ alarmId })
     * Cancela una alarma previamente programada.
     */
    @PluginMethod
    public void cancelAlarm(PluginCall call) {
        Integer alarmId = call.getInt("alarmId");
        if (alarmId == null) {
            call.reject("alarmId es requerido");
            return;
        }

        Context context = getContext();
        Intent intent = new Intent(context, AlarmReceiver.class);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context, alarmId, intent, flags
        );

        AlarmManager alarmManager =
            (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

        if (alarmManager != null) {
            alarmManager.cancel(pendingIntent);
            pendingIntent.cancel();
        }

        JSObject result = new JSObject();
        result.put("cancelled", true);
        result.put("alarmId",   alarmId);
        call.resolve(result);
    }
}
