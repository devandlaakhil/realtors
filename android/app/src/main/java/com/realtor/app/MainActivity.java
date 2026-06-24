package com.realtor.app;

import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;
import com.razorpay.Checkout;

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    Checkout.preload(getApplicationContext());
    WebView.setWebContentsDebuggingEnabled(true);
  }
}
