package com.gestaofinanceira.app;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "NativeFileManager")
public class NativeFileManagerPlugin extends Plugin {

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", true);
        ret.put("platform", "android");
        call.resolve(ret);
    }

    private byte[] getBytesFromContent(String content) {
        if (content != null && content.startsWith("data:") && content.contains(";base64,")) {
            try {
                String base64Part = content.substring(content.indexOf(";base64,") + 8);
                return android.util.Base64.decode(base64Part, android.util.Base64.DEFAULT);
            } catch (Exception e) {
                // Fallback caso ocorra erro na decodificação
                return content.getBytes(StandardCharsets.UTF_8);
            }
        }
        return content != null ? content.getBytes(StandardCharsets.UTF_8) : new byte[0];
    }

    @PluginMethod
    public void saveToDownloads(PluginCall call) {
        String fileName = call.getString("fileName");
        String content = call.getString("content");
        String mimeType = call.getString("mimeType", "text/plain");

        if (fileName == null || content == null) {
            call.reject("Parâmetros 'fileName' e 'content' são obrigatórios.");
            return;
        }

        try {
            byte[] fileBytes = getBytesFromContent(content);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10+ (API 29+): Scoped Storage oficial para pasta Download
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
                values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);

                Uri uri = getContext().getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) {
                    call.reject("Não foi possível registrar o arquivo no diretório Downloads do dispositivo.");
                    return;
                }

                try (OutputStream os = getContext().getContentResolver().openOutputStream(uri)) {
                    if (os == null) {
                        call.reject("Falha ao abrir canal de gravação do arquivo.");
                        return;
                    }
                    os.write(fileBytes);
                    os.flush();
                }

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("folder", "Download");
                ret.put("fileName", fileName);
                ret.put("uri", uri.toString());
                ret.put("message", "Arquivo salvo diretamente na pasta Download do seu telefone!");
                call.resolve(ret);
            } else {
                // Android 9 ou inferior
                File downloadDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!downloadDir.exists()) {
                    downloadDir.mkdirs();
                }
                File file = new File(downloadDir, fileName);
                try (FileOutputStream fos = new FileOutputStream(file)) {
                    fos.write(fileBytes);
                    fos.flush();
                }

                MediaScannerConnection.scanFile(
                    getContext(),
                    new String[]{file.getAbsolutePath()},
                    new String[]{mimeType},
                    null
                );

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("folder", "Download");
                ret.put("fileName", fileName);
                ret.put("uri", Uri.fromFile(file).toString());
                ret.put("message", "Arquivo salvo diretamente na pasta Download do seu telefone!");
                call.resolve(ret);
            }
        } catch (Exception e) {
            call.reject("Erro ao salvar o arquivo na pasta Download: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void chooseFolderAndSave(PluginCall call) {
        String fileName = call.getString("fileName");
        String content = call.getString("content");
        String mimeType = call.getString("mimeType", "text/plain");

        if (fileName == null || content == null) {
            call.reject("Parâmetros 'fileName' e 'content' são obrigatórios.");
            return;
        }

        try {
            Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType(mimeType);
            intent.putExtra(Intent.EXTRA_TITLE, fileName);

            startActivityForResult(call, intent, "pickerCallback");
        } catch (Exception e) {
            call.reject("Erro ao abrir seletor de pastas do Android: " + e.getMessage(), e);
        }
    }

    @ActivityCallback
    private void pickerCallback(PluginCall call, ActivityResult result) {
        if (call == null) return;

        if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
            Uri uri = result.getData().getData();
            if (uri != null) {
                String content = call.getString("content");
                if (content == null) {
                    call.reject("Conteúdo do arquivo não fornecido.");
                    return;
                }

                try (OutputStream os = getContext().getContentResolver().openOutputStream(uri)) {
                    if (os == null) {
                        call.reject("Falha ao abrir o local selecionado para salvar.");
                        return;
                    }
                    os.write(getBytesFromContent(content));
                    os.flush();

                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    ret.put("uri", uri.toString());
                    ret.put("message", "Arquivo salvo com sucesso na pasta escolhida!");
                    call.resolve(ret);
                    return;
                } catch (Exception e) {
                    call.reject("Erro ao gravar no local selecionado: " + e.getMessage(), e);
                    return;
                }
            }
        }
        call.reject("Ação cancelada pelo usuário.");
    }
}
