package com.egchat.app;

import android.content.Intent;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * VoipServicePlugin
 * Plugin Capacitor que expone startForegroundService() y stopForegroundService() a JavaScript.
 *
 * Uso desde JS/TS:
 *   import { registerPlugin } from '@capacitor/core';
 *   const VoipService = registerPlugin('VoipServicePlugin');
 *   await VoipService.startForegroundService({ title: 'EGCHAT', text: 'App activa para llamadas' });
 *   await VoipService.stopForegroundService();
 */
@CapacitorPlugin(name = "VoipServicePlugin")
public class VoipServicePlugin extends Plugin {

    /**
     * startForegroundService({ title?, text? })
     * Inicia el Foreground Service con una notificación persistente.
     * Android no puede matar la app mientras este servicio esté activo.
     */
    @PluginMethod
    public void startForegroundService(PluginCall call) {
        String title = call.getString("title", "EGCHAT");
        String text  = call.getString("text",  "App activa para llamadas");

        Intent intent = new Intent(getContext(), VoipForegroundService.class);
        intent.setAction(VoipForegroundService.ACTION_START);
        intent.putExtra(VoipForegroundService.EXTRA_TITLE, title);
        intent.putExtra(VoipForegroundService.EXTRA_TEXT,  text);

        // API 26+: startForegroundService() en lugar de startService()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }

        JSObject result = new JSObject();
        result.put("started", true);
        call.resolve(result);
    }

    /**
     * stopForegroundService()
     * Detiene el Foreground Service y elimina la notificación persistente.
     * Llamar cuando el usuario cuelga la llamada o cierra sesión.
     */
    @PluginMethod
    public void stopForegroundService(PluginCall call) {
        Intent intent = new Intent(getContext(), VoipForegroundService.class);
        intent.setAction(VoipForegroundService.ACTION_STOP);
        getContext().startService(intent);

        JSObject result = new JSObject();
        result.put("stopped", true);
        call.resolve(result);
    }

    /**
     * isRunning()
     * Comprueba si el servicio está activo.
     * Nota: en Android no hay una API directa para esto sin ActivityManager,
     * usamos un flag estático en el servicio como alternativa limpia.
     */
    @PluginMethod
    public void isRunning(PluginCall call) {
        JSObject result = new JSObject();
        result.put("running", VoipForegroundService.isRunning);
        call.resolve(result);
    }
}
