package app.shockwallet;

import android.os.Bundle;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		getBridge().getWebView().setWebChromeClient(new WebChromeClient() {
			@Override
			public boolean onConsoleMessage(ConsoleMessage m) {
				String line = "WV " + m.messageLevel() + ": " + m.message()
						+ " (" + m.sourceId() + ":" + m.lineNumber() + ")";

				// Use System.out/err so R8/ProGuard can't strip it
				if (m.messageLevel() == ConsoleMessage.MessageLevel.ERROR) {
					System.err.println(line);
				} else {
					System.out.println(line);
				}
				return true; // we handled it
			}
		});
	}
}
