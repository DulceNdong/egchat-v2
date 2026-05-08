package com.egchat.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.window.OnBackInvokedCallback;
import android.window.OnBackInvokedDispatcher;

import androidx.activity.OnBackPressedCallback;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int PERMISSION_REQUEST = 100;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Registrar plugins personalizados antes de super.onCreate()
        registerPlugin(AlarmPlugin.class);
        registerPlugin(VoipServicePlugin.class);
        super.onCreate(savedInstanceState);

        // Hacer que la barra de estado sea transparente y el contenido se extienda debajo
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Window window = getWindow();
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.parseColor("#00c8a0")); // mismo color que el header
            window.getDecorView().setSystemUiVisibility(0); // iconos blancos
        }

        // Ocultar barra de navegación inferior (modo inmersivo)
        hideNavigationBar();

        // Restaurar modo inmersivo si el usuario desliza para mostrar las barras
        getWindow().getDecorView().setOnSystemUiVisibilityChangeListener(visibility -> {
            if ((visibility & View.SYSTEM_UI_FLAG_FULLSCREEN) == 0) {
                new Handler().postDelayed(this::hideNavigationBar, 1500);
            }
        });

        // Gesto de atrás predictivo (Android 14+ / API 34+)
        // Registra el callback que intercepta el gesto ANTES de ejecutarlo,
        // permitiendo mostrar una vista previa de la pantalla anterior.
        setupPredictiveBack();

        requestAllPermissions();
        new Handler().postDelayed(this::setupWebViewCameraPermissions, 500);
    }

    /**
     * hideNavigationBar()
     * Oculta SOLO la barra de navegación inferior — NO la barra de estado.
     * Mantiene la barra de estado visible para que el header funcione correctamente.
     * Usa IMMERSIVE_STICKY solo para la barra de navegación, no para fullscreen.
     */
    private void hideNavigationBar() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // Android 11+ — ocultar SOLO barra de navegación, NO la de estado
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                );
            }
        } else {
            // Android 10 y anteriores — ocultar solo navegación, mantener status bar
            int flags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
            // NO incluir SYSTEM_UI_FLAG_FULLSCREEN ni SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            // para que la barra de estado siga visible y el header no quede tapado
            getWindow().getDecorView().setSystemUiVisibility(flags);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // Restaurar modo inmersivo cuando la app recupera el foco
        // (ej: después de cerrar un diálogo del sistema)
        if (hasFocus) {
            hideNavigationBar();
        }
    }

    private void requestAllPermissions() {
        // Lista completa de permisos que EGCHAT necesita
        // Se piden todos al inicio para evitar que funciones fallen silenciosamente
        java.util.List<String> permList = new java.util.ArrayList<>();

        // Cámara y audio — siempre necesarios
        permList.add(Manifest.permission.CAMERA);
        permList.add(Manifest.permission.RECORD_AUDIO);
        permList.add(Manifest.permission.MODIFY_AUDIO_SETTINGS);

        // Almacenamiento — según versión de Android
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // Android 13+ — permisos granulares por tipo de media
            permList.add(Manifest.permission.READ_MEDIA_IMAGES);
            permList.add(Manifest.permission.READ_MEDIA_VIDEO);
            permList.add(Manifest.permission.READ_MEDIA_AUDIO);
        } else {
            // Android 12 y anteriores — permiso de almacenamiento general
            permList.add(Manifest.permission.READ_EXTERNAL_STORAGE);
            if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P) {
                permList.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
            }
        }

        // Contactos — para tarjetas de contacto en chat
        permList.add(Manifest.permission.READ_CONTACTS);
        permList.add(Manifest.permission.WRITE_CONTACTS);

        // Notificaciones — Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permList.add(Manifest.permission.POST_NOTIFICATIONS);
        }

        // Filtrar solo los no concedidos
        java.util.List<String> toRequest = new java.util.ArrayList<>();
        for (String perm : permList) {
            if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
                toRequest.add(perm);
            }
        }

        if (!toRequest.isEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                toRequest.toArray(new String[0]),
                PERMISSION_REQUEST
            );
        }
    }

    private void setupWebViewCameraPermissions() {
        try {
            WebView webView = getBridge().getWebView();
            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    runOnUiThread(() -> request.grant(request.getResources()));
                }
            });
        } catch (Exception e) {
            new Handler().postDelayed(this::setupWebViewCameraPermissions, 500);
        }
    }

    /**
     * setupPredictiveBack()
     * Configura el gesto de atrás predictivo de Android 14+ (API 34+).
     *
     * Estrategia:
     * - Android 14+ (API 34): usa OnBackInvokedDispatcher (API nativa predictiva)
     * - Android 13 y anteriores: usa OnBackPressedCallback (compatibilidad)
     *
     * En ambos casos, el gesto de atrás se delega a JavaScript via evaluateJavascript,
     * permitiendo que la web gestione su propio historial de navegación (vistas/pantallas).
     * Si la web no tiene historial, se cierra la app normalmente.
     */
    private void setupPredictiveBack() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            // Android 14+ — API nativa con vista previa predictiva
            // El sistema muestra automáticamente la animación de vista previa
            // cuando el usuario inicia el gesto de deslizar desde el borde.
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                OnBackInvokedDispatcher.PRIORITY_DEFAULT,
                () -> {
                    // Notificar a JavaScript para que gestione la navegación
                    WebView webView = getBridge().getWebView();
                    if (webView != null) {
                        webView.evaluateJavascript(
                            "window.dispatchEvent(new CustomEvent('egchat-back-gesture', { detail: { predictive: true } }))",
                            result -> {
                                // Si JS devuelve 'false', no hay historial web → cerrar app
                                if ("false".equals(result) || result == null) {
                                    finish();
                                }
                            }
                        );
                    } else {
                        finish();
                    }
                }
            );
        } else {
            // Android 13 y anteriores — OnBackPressedCallback (sin vista previa)
            getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
                @Override
                public void handleOnBackPressed() {
                    WebView webView = getBridge().getWebView();
                    if (webView != null) {
                        webView.evaluateJavascript(
                            "window.dispatchEvent(new CustomEvent('egchat-back-gesture', { detail: { predictive: false } }))",
                            result -> {
                                if ("false".equals(result) || result == null) {
                                    // Sin historial web — comportamiento por defecto
                                    setEnabled(false);
                                    getOnBackPressedDispatcher().onBackPressed();
                                    setEnabled(true);
                                }
                            }
                        );
                    } else {
                        setEnabled(false);
                        getOnBackPressedDispatcher().onBackPressed();
                        setEnabled(true);
                    }
                }
            });
        }
    }
}
