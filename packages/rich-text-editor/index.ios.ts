import { Application, Enums, Screen } from '@nativescript/core';
import { RichTextEditorCommon } from './common';

declare const IQKeyboardManager: any;

const ANIMATION_DURATION_IN = 380;
const ANIMATION_DURATION_OUT = 250;
const ANIMATION_CURVE = Enums.AnimationCurve.cubicBezier(0.5, 0, 0.45, 1);

export class RichTextEditor extends RichTextEditorCommon {
	private startPositionY: number;
	private lastHeight: number;
	private lastKeyboardHeight: number;

	private _keyboardNotificationObserver: any;

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
				this._toolbar.translateY = this.startPositionY - newKeyboardHeight - this.lastHeight / Screen.mainScreen.scale;
			}
		});

		const hasIQKeyboardManagerInstalled = typeof IQKeyboardManager !== 'undefined';
		const iqKeyboardManagerOriginalDistance = hasIQKeyboardManagerInstalled ? IQKeyboardManager.sharedManager().keyboardDistanceFromTextField : 0;

		this._webView.on('blur', () => {
			this.hasFocus = true;
			if (hasIQKeyboardManagerInstalled) {
				IQKeyboardManager.sharedManager().keyboardDistanceFromTextField = iqKeyboardManagerOriginalDistance;
			}

			const animateToY = this.startPositionY;
			this._toolbar.animate({
				translate: { x: 0, y: animateToY },
				curve: ANIMATION_CURVE,
				duration: ANIMATION_DURATION_OUT,
			});
		});

		this._webView.on('focus', () => {
			this.hasFocus = true;

			if (hasIQKeyboardManagerInstalled) {
				IQKeyboardManager.sharedManager().keyboardDistanceFromTextField = iqKeyboardManagerOriginalDistance + this._toolbar.height;
			}

			const animateToY = this.startPositionY - this.lastKeyboardHeight - this.lastHeight / Screen.mainScreen.scale;
			this._toolbar.animate({
				translate: { x: 0, y: animateToY },
				curve: ANIMATION_CURVE,
				duration: ANIMATION_DURATION_IN,
			});
		});
	}

	disposeNativeView() {
		Application.ios.removeNotificationObserver(this._keyboardNotificationObserver, UIKeyboardWillChangeFrameNotification);
		super.disposeNativeView();
	}

	onLayout(left: number, top: number, right: number, bottom: number): void {
		super.onLayout(left, top, right, bottom);

		const newHeight = this._toolbar.getMeasuredHeight();
		if (newHeight === this.lastHeight) {
			return;
		}

		const { y } = this._toolbar.getLocationOnScreen() || { x: 0, y: newHeight };
		this.startPositionY = Screen.mainScreen.heightDIPs - y + 40 - newHeight / Screen.mainScreen.scale;

		if (this.lastHeight === undefined) {
			this._toolbar.translateY = this.startPositionY;
		} else if (this.lastHeight !== newHeight) {
			this._toolbar.translateY = this.startPositionY;
		}
		this.lastHeight = newHeight;
	}
}
