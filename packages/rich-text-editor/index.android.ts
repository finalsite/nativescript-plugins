import { Application, Screen } from '@nativescript/core';
import { android as AndroidApp } from '@nativescript/core/application';
import { ad } from '@nativescript/core/utils';
import { RichTextEditorCommon } from './common';

export * from './common';

export class RichTextEditor extends RichTextEditorCommon {
	private onGlobalLayoutListener: android.view.ViewTreeObserver.OnGlobalLayoutListener;
	private static supportVirtualKeyboardCheck;

	initNativeView() {
		super.initNativeView();

		const self = this;

		// TODO: this could probably be some kind of global singleton for all editor instances
		this.onGlobalLayoutListener = new android.view.ViewTreeObserver.OnGlobalLayoutListener({
			onGlobalLayout(): void {
				if (!self.android) {
					return;
				}

				const rect = new android.graphics.Rect();
				self.android.getWindowVisibleDisplayFrame(rect);
				const newKeyboardHeight = (self.getUsableScreenSizeY - rect.bottom) / Screen.mainScreen.scale;

				if (self._lastKeyboardHeight === undefined || newKeyboardHeight !== self._lastKeyboardHeight) {
					self._lastKeyboardHeight = newKeyboardHeight;
					self.notify({ eventName: 'keyboardLayoutChanged', object: self });
				}
			},
		});

		self.android.getViewTreeObserver().addOnGlobalLayoutListener(self.onGlobalLayoutListener);
	}

	disposeNativeView(): void {
		super.disposeNativeView();
		this.android.getViewTreeObserver().removeOnGlobalLayoutListener(this.onGlobalLayoutListener);
		this.onGlobalLayoutListener = undefined;
	}

	get getUsableScreenSizeY(): number {
		const screenSize = new android.graphics.Point();
		AndroidApp.foregroundActivity.getWindowManager().getDefaultDisplay().getSize(screenSize);
		return screenSize.y;
	}

	get viewableHeight(): number {
		const activity = Application.android.foregroundActivity || Application.android.startActivity;
		if (!activity) return 0;
		const rootView = activity.findViewById(android.R.id.content);
		if (!rootView) return 0;

		// if we're in a modal the rootView height doesn't seem to adjust the same way when the keyboard shows
		if (this._currentPage._modalParent) {
			// TODO: 4 is a magic number here that I'm having trouble figuring out why it's needed
			return this.getUsableScreenSizeY / Screen.mainScreen.scale - this._lastKeyboardHeight - rootView.getRootWindowInsets().getStableInsetTop() / Screen.mainScreen.scale + 4;
		}
		return rootView.getHeight() / Screen.mainScreen.scale || 0;
	}
}
