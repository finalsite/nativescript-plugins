import { Enums, Frame, Page, View, Screen } from '@nativescript/core';
import { android as AndroidApp } from '@nativescript/core/application';
import { ad } from '@nativescript/core/utils';
import { RichTextEditorCommon } from './common';

export class RichTextEditor extends RichTextEditorCommon {
	private startPositionY: number;
	private lastHeight: number;
	private navbarHeight: number;
	private navbarHeightWhenKeyboardOpen: number;
	private isNavbarVisible: boolean;
	private lastKeyboardHeight: number;
	private onGlobalLayoutListener: android.view.ViewTreeObserver.OnGlobalLayoutListener;
	private thePage: any;
	private static supportVirtualKeyboardCheck;

	// private onScrollChangedListener: android.view.ViewTreeObserver.OnScrollChangedListener;

	constructor() {
		super();
		this.verticalAlignment = 'top';
	}

	onLoaded(): void {
		super.onLoaded();

		setTimeout(() => this.applyInitialPosition(), 300);

		setTimeout(() => {
			const prepFocusEvents = (forView) => {
				forView.on('focus', () => {
					this.hasFocus = true;
					if (self.lastKeyboardHeight) {
						this.showToolbar(this._toolbar);
					}
				});

				forView.on('blur', () => {
					this.hasFocus = false;
					this.hideToolbar(this._toolbar);
				});
			};

			let pg;
			if (Frame.topmost()) {
				pg = Frame.topmost().currentPage;
			} else {
				pg = this._toolbar;
				while (pg && !(pg instanceof Page)) {
					pg = pg.parent;
				}
			}
			this.thePage = pg;
			prepFocusEvents(this._webView);
		}, 500);

		const self = this;

		this.onGlobalLayoutListener = new android.view.ViewTreeObserver.OnGlobalLayoutListener({
			onGlobalLayout(): void {
				// this can happen during livesync - no problemo
				if (!self.android) {
					return;
				}

				const rect = new android.graphics.Rect();
				self.android.getWindowVisibleDisplayFrame(rect);

				const newKeyboardHeight = (RichTextEditor.getUsableScreenSizeY() - rect.bottom) / Screen.mainScreen.scale;
				if (newKeyboardHeight <= 0 && self.lastKeyboardHeight === undefined) {
					return;
				}

				if (newKeyboardHeight === self.lastKeyboardHeight) {
					return;
				}

				// TODO see if orientation needs to be accounted for: https://github.com/siebeprojects/samples-keyboardheight/blob/c6f8aded59447748266515afeb9c54cf8e666610/app/src/main/java/com/siebeprojects/samples/keyboardheight/KeyboardHeightProvider.java#L163
				self.lastKeyboardHeight = newKeyboardHeight;

				if (self.hasFocus) {
					if (newKeyboardHeight <= 0) {
						self.hideToolbar(self._toolbar);
					} else {
						self.showToolbar(self._toolbar);
					}
				}
			},
		});

		self.android.getViewTreeObserver().addOnGlobalLayoutListener(self.onGlobalLayoutListener);
	}

	disposeNativeView(): void {
		super.disposeNativeView();
		this.android.getViewTreeObserver().removeOnGlobalLayoutListener(this.onGlobalLayoutListener);
		// this.content.android.getViewTreeObserver().removeOnScrollChangedListener(this.onScrollChangedListener);
		this.onGlobalLayoutListener = undefined;
		// this.onScrollChangedListener = undefined;
	}

	private showToolbar(parent): void {
		let navbarHeight = this.isNavbarVisible ? 0 : this.navbarHeight;

		// some devices (Samsung S8) with a hidden virtual navbar show the navbar when the keyboard is open, so subtract its height
		if (!this.isNavbarVisible) {
			const isNavbarVisibleWhenKeyboardOpen = this.thePage.getMeasuredHeight() < RichTextEditor.getUsableScreenSizeY() && (RichTextEditor.isVirtualNavbarHidden_butShowsWhenKeyboardIsOpen() || RichTextEditor.hasPermanentMenuKey());
			if (isNavbarVisibleWhenKeyboardOpen) {
				// caching for (very minor) performance reasons
				if (!this.navbarHeightWhenKeyboardOpen) {
					this.navbarHeightWhenKeyboardOpen = RichTextEditor.getNavbarHeightWhenKeyboardOpen();
				}
				navbarHeight = this.navbarHeightWhenKeyboardOpen;
			}
		}

		const animateToY = this.startPositionY - this.lastKeyboardHeight - this.lastHeight / Screen.mainScreen.scale - navbarHeight;

		parent
			.animate({
				translate: { x: 0, y: animateToY },
				curve: Enums.AnimationCurve.cubicBezier(0.32, 0.49, 0.56, 1),
				duration: 370,
			})
			.then(() => {});
	}

	private hideToolbar(parent): void {
		const animateToY = this.startPositionY + this.navbarHeight;
		parent
			.animate({
				translate: { x: 0, y: animateToY },
				curve: Enums.AnimationCurve.cubicBezier(0.32, 0.49, 0.56, 1),
				duration: 370,
			})
			.then(() => {});
	}

	private applyInitialPosition(): void {
		if (this.startPositionY !== undefined) {
			return;
		}

		const parent = <View>this._toolbar;

		// at this point, topmost().currentPage is null, so do it like this:
		this.thePage = parent;
		while (!this.thePage && !this.thePage.frame) {
			this.thePage = this.thePage.parent;
		}

		const loc = parent.getLocationOnScreen();
		if (!loc) {
			return;
		}
		const y = loc.y;
		const newHeight = parent.getMeasuredHeight();

		// this is the bottom navbar - which may be hidden by the user.. so figure out its actual height
		this.navbarHeight = RichTextEditor.getNavbarHeight();
		this.isNavbarVisible = !!this.navbarHeight;

		this.startPositionY = Screen.mainScreen.heightDIPs - y - (this.isNavbarVisible ? this.navbarHeight : 0);

		if (this.lastHeight === undefined) {
			parent.translateY = this.startPositionY + this.navbarHeight;
		} else if (this.lastHeight !== newHeight) {
			parent.translateY = this.startPositionY + this.navbarHeight;
		}
		this.lastHeight = newHeight;
	}

	private static getNavbarHeight() {
		// detect correct height from: https://shiv19.com/how-to-get-android-navbar-height-nativescript-vanilla/
		const context = <android.content.Context>ad.getApplicationContext();
		let navBarHeight = 0;
		let windowManager = context.getSystemService(android.content.Context.WINDOW_SERVICE);
		let d = windowManager.getDefaultDisplay();

		let realDisplayMetrics = new android.util.DisplayMetrics();
		d.getRealMetrics(realDisplayMetrics);

		let realHeight = realDisplayMetrics.heightPixels;
		let realWidth = realDisplayMetrics.widthPixels;

		let displayMetrics = new android.util.DisplayMetrics();
		d.getMetrics(displayMetrics);

		let displayHeight = displayMetrics.heightPixels;
		let displayWidth = displayMetrics.widthPixels;

		if (realHeight - displayHeight > 0) {
			// Portrait
			navBarHeight = realHeight - displayHeight;
		} else if (realWidth - displayWidth > 0) {
			// Landscape
			navBarHeight = realWidth - displayWidth;
		}

		// Convert to device independent pixels and return
		return navBarHeight / context.getResources().getDisplayMetrics().density;
	}

	private static getNavbarHeightWhenKeyboardOpen() {
		const resources = (<android.content.Context>ad.getApplicationContext()).getResources();
		const resourceId = resources.getIdentifier('navigation_bar_height', 'dimen', 'android');
		if (resourceId > 0) {
			return resources.getDimensionPixelSize(resourceId) / Screen.mainScreen.scale;
		}
		return 0;
	}

	private static hasPermanentMenuKey() {
		return android.view.ViewConfiguration.get(<android.content.Context>ad.getApplicationContext()).hasPermanentMenuKey();
	}

	private static isVirtualNavbarHidden_butShowsWhenKeyboardIsOpen(): boolean {
		if (RichTextEditor.supportVirtualKeyboardCheck !== undefined) {
			return RichTextEditor.supportVirtualKeyboardCheck;
		}
		const SAMSUNG_NAVIGATION_EVENT = 'navigationbar_hide_bar_enabled';
		try {
			// eventId is 1 in case the virtual navbar is hidden (but it shows when the keyboard opens)
			RichTextEditor.supportVirtualKeyboardCheck = android.provider.Settings.Global.getInt(AndroidApp.foregroundActivity.getContentResolver(), SAMSUNG_NAVIGATION_EVENT) === 1;
		} catch (e) {
			// non-Samsung devices throw a 'SettingNotFoundException'
			console.log('>> e: ' + e);
			RichTextEditor.supportVirtualKeyboardCheck = false;
		}
		return RichTextEditor.supportVirtualKeyboardCheck;
	}

	private static getUsableScreenSizeY(): number {
		const screenSize = new android.graphics.Point();
		AndroidApp.foregroundActivity.getWindowManager().getDefaultDisplay().getSize(screenSize);
		return screenSize.y;
	}
}
