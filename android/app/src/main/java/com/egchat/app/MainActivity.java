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

        requestAllPermissions();
        new Handler().postDelayed(this::setupWebViewCameraPermissions, 500);
    }

    /**
     * hideNavigationBar()
     * Oculta la barra de navegación inferior en todas las versiones de Android.
     *
     * Android 11+ (API 30): usa WindowInsetsController (API moderna)
     * Android 10 y anteriores: usa SYSTEM_UI_FLAG_IMMERSIVE_STICKY (API legacy)
     *
     * IMMERSIVE_STICKY: la barra reaparece temporalmente al deslizar desde el borde
     * y se vuelve a ocultar automáticamente sin que el usuario tenga que tocar nada.
     */
    private void hideNavigationBar() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // Android 11+ — API moderna con WindowInsetsController
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                // Ocultar barra de navegación Y barra de estado
                controller.hide(WindowInsets.Type.navigationBars() | WindowInsets.Type.statusBars());
                // BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE:
                // Al deslizar desde el borde aparece temporalmente y se vuelve a ocultar sola
                controller.setSystemBarsBehavior(
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                );
            }
        } else {
            // Android 10 y anteriores — API legacy con flags
            int flags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION   // ocultar barra de navegación
                | View.SYSTEM_UI_FLAG_FULLSCREEN         // ocultar barra de estado
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;  // restaurar automáticamente
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
        String[] permissions;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions = new String[]{
                Manifest.permission.CAMERA,
                Manifest.permission.RECORD_AUDIO,
                Manifest.permission.READ_MEDIA_IMAGES,
                Manifest.permission.READ_MEDIA_VIDEO
            };
        } else {
            permissions = new String[]{
                Manifest.permission.CAMERA,
                Manifest.permission.RECORD_AUDIO,
                Manifest.permission.READ_EXTERNAL_STORAGE,
                Manifest.permission.WRITE_EXTERNAL_STORAGE
            };
        }

        boolean allGranted = true;
        for (String perm : permissions) {
            if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
                allGranted = false;
                break;
            }
        }

        if (!allGranted) {
            ActivityCompat.requestPermissions(this, permissions, PERMISSION_REQUEST);
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
}
