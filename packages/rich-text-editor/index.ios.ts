import { Application, Screen } from '@nativescript/core';
import { RichTextEditorCommon } from './common';

declare const WKWebView: any;

/* need to subclass WKWebView so that we can remove the keyboard accessory view that we don't want */
var RichEditorWebView = WKWebView.extend(
	{
		get inputAccessoryView() {
			return null;
		},
	},
	{
		name: 'RichEditorWebView',
	}
);

export class RichTextEditor extends RichTextEditorCommon {
	private _keyboardNotificationObserver: any;
	private wkWebViewConfiguration: WKWebViewConfiguration; // this is defined in webview-ext createNativeView

	/*
	 * Life cycle events
	 */
	createNativeView() {
		/*
		 * TODO: this super call creates a webview instance that isn't used, could be a performance issue
		 * webview-ext would probably need to be tweaked for this
		 */
		super.createNativeView();

		const webview = new RichEditorWebView({
			frame: CGRectZero,
			configuration: this.wkWebViewConfiguration,
		});
		return webview;
	}

	initNativeView() {
		super.initNativeView();

		this._keyboardNotificationObserver = Application.ios.addNotificationObserver(UIKeyboardWillChangeFrameNotification, (notification) => {
			const newKeyboardHeight = notification.userInfo.valueForKey(UIKeyboardFrameEndUserInfoKey).CGRectValue.size.height + UIApplication.sharedApplication.statusBarFrame.size.height;
			if (newKeyboardHeight === this._lastKeyboardHeight) {
				return;
			}
			this._lastKeyboardHeight = newKeyboardHeight;
			this.notify({ eventName: 'keyboardLayoutChanged', object: this });
		});
	}

	disposeNativeView() {
		/**
		 * duck punch fully disposing the view if we're only detaching the view temporarily for fullscreen
		 * this prevent WebViewExt from removing listeners
		 */
		if (this._detachingView) return;
		Application.ios.removeNotificationObserver(this._keyboardNotificationObserver, UIKeyboardWillChangeFrameNotification);
		super.disposeNativeView();
	}

	/*
	 * End life cycle events
	 */

	get viewableHeight(): number {
		return this._lastKeyboardHeight ? Screen.mainScreen.heightDIPs - this._lastKeyboardHeight : Screen.mainScreen.heightDIPs;
	}
}
