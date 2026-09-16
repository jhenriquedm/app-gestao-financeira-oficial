package com.gestaofinanceira.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeFileManagerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
