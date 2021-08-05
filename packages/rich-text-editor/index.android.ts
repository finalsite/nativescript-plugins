import { Enums, Frame, Page, View, Screen, Application, ScrollView, GridLayout, Label, Color } from '@nativescript/core';
import { android as AndroidApp } from '@nativescript/core/application';
import { ad } from '@nativescript/core/utils';
import { RichTextEditorCommon } from './common';

const ANIMATION_CURVE = Enums.AnimationCurve.cubicBezier(0.32, 0.49, 0.56, 1);
const ANIMATION_DURATION = 370;
const ZINDEX = 99; // zindex for webview to make sure it gets layered in front

export class RichTextEditor extends RichTextEditorCommon {
	private _lastActivityHeight: number;
	private _initialFocusChange: boolean;

	private onGlobalLayoutListener: android.view.ViewTreeObserver.OnGlobalLayoutListener;
	private static supportVirtualKeyboardCheck;

	constructor() {
		super();
		this._toolbar.verticalAlignment = 'top'; // important so that the toolbar y starts at the top
	}

	onLoaded(): void {
		super.onLoaded();

		setTimeout(() => {
			this._toolbar.translateY = this.activityHeight;
		});

		this.on('focus', () => {
			if (this.hasFocus) return;

			this.hasFocus = true;
			this._initialFocusChange = true;
			self.notify({ eventName: 'keyboardLayoutChanged', object: self });
		});
		this.on('blur', () => {
			if (!this.hasFocus) return;

			this.hasFocus = false;
			this._initialFocusChange = true;
			self.notify({ eventName: 'keyboardLayoutChanged', object: self });
		});

		// check if we need to make layout adjustments if we're in focus
		// keyboards can change height all willy nilly
		this.on('keyboardLayoutChanged', () => {
			if (this.hasFocus) {
				if (this._initialFocusChange) {
					this.onInitialFocus();
				}

				const toolbarHeight = this._toolbar.getMeasuredHeight() / Screen.mainScreen.scale;
				this._toolbar.animate({
					translate: { x: 0, y: this.activityHeight - toolbarHeight },
					curve: ANIMATION_CURVE,
					duration: ANIMATION_DURATION,
				});
				this.animate({
					height: this.activityHeight - toolbarHeight,
					width: Screen.mainScreen.widthDIPs,
					curve: ANIMATION_CURVE,
					duration: ANIMATION_DURATION,
				}).then(() => {
					// the height change adjusts what the ending y coordinate needs to be so check it's position after the animation and adjust
					// TODO: there's probably a way to predict this for the animation based on the new height but I can't seem to get it right atm
					const distanceFromTop = this.getLocationRelativeTo(this._currentPage).y;
					if (distanceFromTop !== 0) {
						this.translateY = this.translateY - this.getLocationRelativeTo(this._currentPage.content).y;
					}
				});
			} else {
				if (this._initialFocusChange) {
					this.onInitialBlur();
					this.animate({
						translate: { x: 0, y: 0 },
						height: this._originalHeight,
						width: this._originalWidth,
						curve: ANIMATION_CURVE,
						duration: ANIMATION_DURATION,
					});
				}

				this._toolbar.animate({
					translate: { x: 0, y: this.activityHeight },
					curve: ANIMATION_CURVE,
					duration: ANIMATION_DURATION,
				});
			}
		});

		const self = this;

		// TODO: this could probably be some kind of global singleton for all editor instances
		this.onGlobalLayoutListener = new android.view.ViewTreeObserver.OnGlobalLayoutListener({
			onGlobalLayout(): void {
				if (!self.android) {
					return;
				}

				if (self._lastActivityHeight !== undefined && self.activityHeight !== self._lastActivityHeight) {
					self.notify({ eventName: 'keyboardLayoutChanged', object: self });
				}
				self._lastActivityHeight = self.activityHeight;
			},
		});

		self.android.getViewTreeObserver().addOnGlobalLayoutListener(self.onGlobalLayoutListener);
	}

	get activityHeight(): number {
		const activity = Application.android.foregroundActivity || Application.android.startActivity;
		if (!activity) return 0;
		const rootView = activity.findViewById(android.R.id.content);
		if (!rootView) return 0;
		return rootView.getHeight() / Screen.mainScreen.scale || 0;
	}

	disposeNativeView(): void {
		super.disposeNativeView();
		this.android.getViewTreeObserver().removeOnGlobalLayoutListener(this.onGlobalLayoutListener);
		this.onGlobalLayoutListener = undefined;
	}

	private onInitialFocus(): void {
		this.toggleParentScrollers(false);
		this._originalHeight = this.getMeasuredHeight() / Screen.mainScreen.scale;
		this._originalWidth = this.getMeasuredWidth() / Screen.mainScreen.scale;
		this.style.zIndex = ZINDEX;
		this._originalActionBarStateHidden = this._currentPage.actionBarHidden;
		this._currentPage.actionBarHidden = true;
		this._initialFocusChange = false;
	}

	private onInitialBlur(): void {
		this._currentPage.actionBarHidden = this._originalActionBarStateHidden;
		this.toggleParentScrollers(true);
		this._initialFocusChange = false;
	}

	private applyInitialPosition(): void {
		this._toolbar.translateY = this.activityHeight;
	}
}
