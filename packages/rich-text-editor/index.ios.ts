import { Application, Enums, Frame, Screen, ScrollView, StackLayout, View } from '@nativescript/core';
import { RichTextEditorCommon } from './common';

const ANIMATION_DURATION_IN = 380;
const ANIMATION_DURATION_OUT = 250;
const ANIMATION_CURVE = Enums.AnimationCurve.cubicBezier(0.5, 0, 0.45, 1);

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
	private toolbarStartY: number;
	private lastToolbarHeight: number;
	private lastKeyboardHeight: number;

	private _keyboardNotificationObserver: any;

	private wkWebViewConfiguration: WKWebViewConfiguration; // this is defined in webview-ext createNativeView

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
			const newKeyboardHeight = notification.userInfo.valueForKey(UIKeyboardFrameEndUserInfoKey).CGRectValue.size.height;
			if (newKeyboardHeight === this.lastKeyboardHeight) {
				return;
			}

			const isFirstAnimation = this.lastKeyboardHeight === undefined;
			this.lastKeyboardHeight = newKeyboardHeight;

			if (!isFirstAnimation && this.hasFocus) {
				this._toolbar.translateY = this.toolbarStartY - newKeyboardHeight - this.lastToolbarHeight / Screen.mainScreen.scale;
			}
		});

		// toolbar could probably be subclassed and this handled in onLayout there
		this._toolbar.on('layoutChanged', () => {
			const newHeight = this._toolbar.getMeasuredHeight() / Screen.mainScreen.scale;

			if (newHeight === this.lastToolbarHeight) {
				return;
			}

			this.toolbarStartY = Screen.mainScreen.heightDIPs - this._toolbar.getLocationOnScreen().y;
			this._toolbar.translateY = this.toolbarStartY;
			this.lastToolbarHeight = newHeight;
		});

		this.on('blur', () => {
			this.hasFocus = true;
			this.toggleParentScrollers(true);
			this._currentPage.actionBarHidden = this._originalActionBarStateHidden;

			const animateToY = this.toolbarStartY;
			this._toolbar.animate({
				translate: { x: 0, y: animateToY },
				curve: ANIMATION_CURVE,
				duration: ANIMATION_DURATION_OUT,
			});
			this.animate({
				translate: { x: 0, y: 0 },
				height: this._originalHeight,
				width: this._originalWidth,
				curve: ANIMATION_CURVE,
				duration: ANIMATION_DURATION_IN,
			});
		});

		this.on('focus', () => {
			this.hasFocus = true;

			this.toggleParentScrollers(false);

			this._originalActionBarStateHidden = this._currentPage.actionBarHidden;
			if (this._originalActionBarStateHidden) {
				this.animateViewsIn();
			} else {
				// need to wait for layoutchange after hiding the action bar
				this._toolbar.once('layoutChanged', this.animateViewsIn);
				this._currentPage.actionBarHidden = true;
			}
		});
	}

	animateViewsIn = () => {
		const yScreenChange = Screen.mainScreen.heightDIPs - this._toolbar.getLocationOnScreen().y; // this should be 0 if the actionbar wasn't removed and nothing shifted
		const animateToY = this.toolbarStartY - this.lastKeyboardHeight - this.lastToolbarHeight + yScreenChange;
		this._toolbar.animate({
			translate: { x: 0, y: animateToY },
			curve: ANIMATION_CURVE,
			duration: ANIMATION_DURATION_IN,
		});

		this._originalWidth = this.getMeasuredWidth() / Screen.mainScreen.scale;
		this._originalHeight = this.getMeasuredHeight() / Screen.mainScreen.scale;

		const relativeTopY = this._currentPage.getSafeAreaInsets().top / Screen.mainScreen.scale - this.getLocationOnScreen().y;

		this.animate({
			translate: { x: 0, y: relativeTopY },
			height: Screen.mainScreen.heightDIPs - this.lastKeyboardHeight - this.lastToolbarHeight - yScreenChange,
			width: Screen.mainScreen.widthDIPs,
			curve: ANIMATION_CURVE,
			duration: ANIMATION_DURATION_IN,
		});
	};

	disposeNativeView() {
		Application.ios.removeNotificationObserver(this._keyboardNotificationObserver, UIKeyboardWillChangeFrameNotification);
		super.disposeNativeView();
	}
}
