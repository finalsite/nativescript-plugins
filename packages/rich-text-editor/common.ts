import { knownFolders, Enums, Property, GridLayout, AddChildFromBuilder, StackLayout, Button, PercentLength, ScrollView, Page, GridUnitType, ItemSpec, action, prompt, inputType, LayoutBase, Screen, ContentView, Label, CSSType, path, ViewBase } from '@nativescript/core';
import { PromptResult } from '@nativescript/core/ui/dialogs/dialogs-common';
import { LoadFinishedEventData, ShouldOverrideUrlLoadEventData, WebViewEventData, WebViewExt } from '@nota/nativescript-webview-ext';

import { RichTextEditor } from '.';

export const htmlProperty = new Property<RichTextEditorCommon, string>({
	name: 'html',
	defaultValue: '',
	affectsLayout: true,
	valueChanged: (target: RichTextEditorCommon, oldValue, newValue) => {
		target.notifyWebViewChange(newValue);
	},
});

const ANIMATION_DURATION = 370;
const ANIMATION_CURVE = Enums.AnimationCurve.cubicBezier(0.5, 0, 0.45, 1);
const AVAILABLE_COLORS = ['black', 'silver', 'gray', 'white', 'maroon', 'red', 'purple', 'fuchsia', 'green', 'lime', 'olive', 'yellow', 'navy', 'blue', 'teal', 'aqua'];

interface IconMap {
	[key: string]: string;
}

const MATERIAL_ICON_MAP: IconMap = {
	undo: String.fromCharCode(0xe166),
	redo: String.fromCharCode(0xe15a),
	clear: String.fromCharCode(0xe239),
	bold: String.fromCharCode(0xe238),
	underline: String.fromCharCode(0xe249),
	italic: String.fromCharCode(0xe23f),
	link: String.fromCharCode(0xe157),
	format: String.fromCharCode(0xe165),
	font: String.fromCharCode(0xe167),
	size: String.fromCharCode(0xe245),
	color: String.fromCharCode(0xe40a),
	background: String.fromCharCode(0xe243),
	left: String.fromCharCode(0xe236),
	center: String.fromCharCode(0xe234),
	right: String.fromCharCode(0xe237),
	ol: String.fromCharCode(0xe242),
	ul: String.fromCharCode(0xe241),
	outdent: String.fromCharCode(0xe23d),
	indent: String.fromCharCode(0xe23e),
};

export module RichTextEditorConfig {
	export let defaultBridge: string = '~/assets/js/contenteditable.js';
	export let defaultHeadJS: string;
	export let defaultHeadCSS: string;
}

let activeRichTextEditor: RichTextEditor;
export function getActiveRichTextEditor(): RichTextEditor {
	return activeRichTextEditor;
}

@CSSType('RichTextEditor')
export abstract class RichTextEditorCommon extends WebViewExt implements AddChildFromBuilder {
	hasFocus: boolean;

	private _loadedPromise: Promise<LoadFinishedEventData>;
	private _bridge: string;
	private _headJS: string;
	private _headCSS: string;
	private _webViewSrc: string;
	private _placeholder: ContentView;

	protected _toolbar: RichTextEditorToolbar;
	protected _currentPage: Page;
	protected _detachingView = false;
	protected _lastKeyboardHeight: number;

	protected _rootLayout: GridLayout;
	protected _originalActionBarStateHidden = false;
	protected _originalHeight: number;
	protected _originalWidth: number;
	protected _originalX: number;
	protected _originalY: number;
	protected _originalParent: LayoutBase;
	protected _originalParentIndex: number;

	constructor() {
		super();

		this._bridge = RichTextEditorConfig.defaultBridge;
		this._headJS = RichTextEditorConfig.defaultHeadJS;
		this._headCSS = RichTextEditorConfig.defaultHeadCSS;
		this._toolbar = new RichTextEditorToolbar(this);
		this._placeholder = new ContentView();
	}

	abstract get viewableHeight(): number;

	get toolbarHeight(): number {
		return this._toolbar.getMeasuredHeight() / Screen.mainScreen.scale;
	}

	set bridge(value: string) {
		this._bridge = value;
	}

	createNativeView() {
		return super.createNativeView();
	}

	initNativeView() {
		super.initNativeView();
	}

	public onLoaded() {
		super.onLoaded();
		if (this.hasFocus) {
			this.on('done', this.onDone);
			this.on('keyboardLayoutChanged', this.onKeyboardLayoutChanged);
		} else {
			this.on('focus', this.onInitialFocus);
		}
		this.on(WebViewExt.shouldOverrideUrlLoadingEvent, this.onOverrideURLLoading); // prevent navigating to other urls on this webview
		this.on('ready', this.onReady);

		this._ensureLayout();
	}

	public onUnloaded() {
		this.off('done', this.onDone);
		this.off('focus', this.onInitialFocus);
		this.off('keyboardLayoutChanged', this.onKeyboardLayoutChanged);
		this.off(WebViewExt.shouldOverrideUrlLoadingEvent, this.onOverrideURLLoading);
		this.off('ready', this.onReady);
		this._loadedPromise = null;

		super.onUnloaded();
	}

	public _addChildFromBuilder(name: string, button: Label) {
		if (!(button instanceof Label)) return;
		this._toolbar.addButton(button);
	}

	public async notifyWebViewChange(value: string) {
		this.emitToWebView('sourceChanged', value);
	}

	public saveSelection(): Promise<void> {
		return this.executePromise('saveSelectionPromise()');
	}

	public restoreSelection(): Promise<void> {
		return this.executePromise('restoreSelectionPromise()');
	}

	private onOverrideURLLoading = (args: ShouldOverrideUrlLoadEventData) => {
		if (!args.url.includes(this._webViewSrc)) {
			args.cancel = true;
		}
	};

	/**
	 * this is for the initial focus of the editor when it goes full screen
	 */
	private onInitialFocus = () => {
		if (this.hasFocus) return;
		this.hasFocus = true;
		activeRichTextEditor = this;

		this._originalHeight = this.getMeasuredHeight() / Screen.mainScreen.scale;
		this._originalWidth = this.getMeasuredWidth() / Screen.mainScreen.scale;
		this._originalActionBarStateHidden = this._currentPage.actionBarHidden;
		this._currentPage.actionBarHidden = true;
		this.verticalAlignment = 'top';

		const startingPosition = this.getLocationOnScreen();
		this._originalX = startingPosition.x;
		this._originalY = startingPosition.y;

		this._swapParent();
		this.translateX = this._originalX;
		this.translateY = this._originalY;
		this.width = this._originalWidth;
		this.height = this._originalHeight;

		this.focus();
		this.notify({ eventName: 'keyboardLayoutChanged', object: this });
	};

	/**
	 * done button was pressed and we're returning to the original state
	 */
	private onDone = async () => {
		if (!this.hasFocus) return;
		this.hasFocus = false;

		const htmlContent = await this.executePromise('getHtmlPromise()');

		this._currentPage.actionBarHidden = this._originalActionBarStateHidden;

		this.animate({
			translate: { x: this._originalX, y: this._originalY },
			height: this._originalHeight,
			width: this._originalWidth,
			curve: ANIMATION_CURVE,
			duration: ANIMATION_DURATION,
		}).finally(() => {
			// ios cancels the animation for some reason sometimes so we need to use 'finally' to make sure these things happen
			this.translateX = 0;
			this.translateY = 0;
			this._swapParent();
			this.set('html', htmlContent);
		});

		this._toolbar.animate({
			translate: { x: 0, y: Screen.mainScreen.heightDIPs + this.toolbarHeight },
			curve: ANIMATION_CURVE,
			duration: ANIMATION_DURATION,
		});
	};

	/**
	 * when editor is in focus we adjust the toolbar position and the fullscreen height based on the keyboard height
	 */
	private onKeyboardLayoutChanged = () => {
		if (!this.hasFocus) return;

		this._toolbar.animate({
			translate: { x: 0, y: this.viewableHeight - this.toolbarHeight },
			curve: ANIMATION_CURVE,
			duration: ANIMATION_DURATION,
		});

		this.animate({
			translate: { x: 0, y: 0 },
			height: this.viewableHeight - this.toolbarHeight,
			width: Screen.mainScreen.widthDIPs,
			curve: ANIMATION_CURVE,
			duration: ANIMATION_DURATION,
		});
	};

	/**
	 * making sure required elements are in place
	 */
	private _ensureLayout() {
		/* already done with initial setup so just return */
		if (this._originalParent) return;
		this._originalParent = this.parent as LayoutBase;

		let finder: ViewBase = this.parent;
		let pg: Page = finder as Page;

		console.log("[common.ts] here: ", finder)

		while (finder && !(finder instanceof Page)) {
			finder = finder.parent;
		}

		console.log("[common.ts] here: ", finder)

		if (!(pg.content instanceof GridLayout)) {
			console.log(`\n********Warning**********\n A root GridLayout is required in order for the RichTextEditor to work correctly\n\n`);
		}
		// this._currentPage = pg;
		// this._rootLayout = pg.content as GridLayout;
		// this._rootLayout.addChild(this._toolbar);
		this._webViewSrc = encodeURI(`${knownFolders.currentApp().path}/assets/html/default.html`);

		// this.addHeadAssets();
		// this.autoLoadJavaScriptFile('editorBridgeFile', this._bridge);

		this._loadedPromise = this.loadUrl(this._webViewSrc);
	}

	private addHeadAssets() {
		if (this._headJS) {
			this._headJS.split(/\s*,\s*/).forEach((url) => {
				this.autoExecuteJavaScript(`insertHeadScript('${url}')`, url);
			});
		}

		if (this._headCSS) {
			this._headCSS.split(/\s*,\s*/).forEach((url) => {
				this.autoExecuteJavaScript(`insertHeadCSS('${url}')`, url);
			});
		}
	}

	private onReady = () => {
		this.notifyWebViewChange(this.get('html'));
	};

	/*
	 * switch the parent view to be the root view, makes positioning and giving the view focus more reliable
	 */
	private _swapParent() {
		if (this._originalParent === this._rootLayout) return;
		this._detachingView = true;
		if (this.parent === this._originalParent) {
			this._originalParentIndex = this._originalParent.getChildIndex(this);
			this._originalParent.removeChild(this);

			// stick a placeholder where the webview was so things don't jump around quite as much
			this._placeholder.height = this._originalHeight;
			this._placeholder.width = this._originalWidth;
			this._originalParent.insertChild(this._placeholder, this._originalParentIndex);

			this._rootLayout.addChild(this);
		} else {
			this._rootLayout.removeChild(this);
			this._originalParent.removeChild(this._placeholder);
			this._originalParent.insertChild(this, this._originalParentIndex);
		}
		this._detachingView = false;
	}
}

@CSSType('RichTextEditorToolbar')
class RichTextEditorToolbar extends GridLayout {
	[key: string]: any;

	private _buttonLayout: StackLayout;
	private _editor: RichTextEditorCommon;

	constructor(editor: RichTextEditorCommon) {
		super();

		this._editor = editor;

		// TODO: should be stylable
		this.backgroundColor = '#F2F2F7';
		this.width = PercentLength.parse('100%');
		this.verticalAlignment = 'top';
		this.padding = 0;
		this.margin = 0;
		this.translateY = Screen.mainScreen.heightDIPs + this.getMeasuredHeight();

		this.addColumn(new ItemSpec(1, GridUnitType.STAR));
		this.addColumn(new ItemSpec(1, GridUnitType.AUTO));

		const scrollView = new ScrollView();
		scrollView.orientation = 'horizontal';

		this._buttonLayout = new StackLayout();
		this._buttonLayout.verticalAlignment = 'top';
		this._buttonLayout.orientation = 'horizontal';

		scrollView.content = this._buttonLayout;

		const doneButton = new Label();
		doneButton.text = 'Done';
		doneButton.padding = '5 10';
		doneButton.verticalAlignment = 'middle';
		doneButton.fontSize = 18;

		doneButton.on('tap', () => {
			this._editor.notify({ eventName: 'done', object: this });
			editor.emitToWebView('done', null);
		});

		this.addChildAtCell(scrollView, 0, 0);
		this.addChildAtCell(doneButton, 0, 1);
	}

	onLoaded() {
		super.onLoaded();

		// if buttons exist here then a custom button list is being used or buttons were already loaded
		if (this._buttonLayout.getChildrenCount()) return;

		this.addButton(this.createButton('undo', 'undo'));
		this.addButton(this.createButton('redo', 'redo'));
		this.addButton(this.createButton('clear', 'removeFormat'));
		this.addButton(this.createButton('bold', 'bold'));
		this.addButton(this.createButton('underline', 'underline'));
		this.addButton(this.createButton('italic', 'italic'));
		this.addButton(this.createButton('link', 'link'));
		this.addButton(this.createButton('format', 'format'));
		this.addButton(this.createButton('font', 'font'));
		this.addButton(this.createButton('size', 'fontSize'));
		this.addButton(this.createButton('color', 'foreColor'));
		this.addButton(this.createButton('background', 'backColor'));
		this.addButton(this.createButton('left', 'justifyleft'));
		this.addButton(this.createButton('center', 'justifycenter'));
		this.addButton(this.createButton('right', 'justifyright'));
		this.addButton(this.createButton('ol', 'insertorderedlist'));
		this.addButton(this.createButton('ul', 'insertunorderedlist'));
		this.addButton(this.createButton('outdent', 'outdent'));
		this.addButton(this.createButton('indent', 'indent'));
	}

	private createButton(text: string, command: string): Button {
		let newButton = new Label();
		newButton.text = MATERIAL_ICON_MAP[text] || text;
		newButton.set('editorCommand', command);
		return newButton;
	}

	public addButton(button: Label): void {
		const editorCommand = button.get('editorCommand');

		button.className = `rie_button rie_button_${editorCommand} ${button.className || ''}`;

		// defining own tap handler takes precedence over predefined commands
		if (!button.get('tap') && editorCommand) {
			// check if we want to handle this with something native first, otherwise pass the command through to the webview
			if (this[editorCommand]) {
				button.on('tap', this[editorCommand]);
			} else {
				button.on('tap', () => {
					this._editor.emitToWebView(editorCommand, null);
				});
			}
		}
		this._buttonLayout.addChild(button);
	}

	/*
	 * Editor commands that need additional UI
	 */
	private link = async () => {
		// we lose selection/focus when we do the prompt so we need to save it and restore it later
		await this._editor.saveSelection();

		prompt({
			title: 'URL',
			defaultText: 'http://',
			okButtonText: 'Ok',
			cancelButtonText: 'Cancel',
			cancelable: true,
			inputType: inputType.email,
		}).then(async (result: PromptResult) => {
			await this._editor.restoreSelection();
			if (result.result) {
				this._editor.emitToWebView('createLink', result.text);
			}
		});
	};

	private format = () => {
		action({
			message: 'Formatting',
			actions: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'blockquote'],
			cancelButtonText: 'Cancel',
			cancelable: true,
		}).then((selectedFormat) => {
			this._editor.emitToWebView('formatblock', selectedFormat);
		});
	};

	private font = () => {
		action({
			message: 'Font',
			actions: ['Arial, Helvetica, sans-serif', 'Comic Sans MS, cursive', 'Courier New, Courier, monospace', 'Georgia, serif', 'Lucida Sans Unicode, Lucida Grande, sans-serif', 'Tahoma, Geneva, sans-serif', 'Times New Roman, Times, serif', 'Trebuchet MS, Helvetica, sans-serif', 'Verdana, Geneva, sans-serif'],
			cancelButtonText: 'Cancel',
			cancelable: true,
		}).then((selectedFont) => {
			this._editor.emitToWebView('fontname', selectedFont);
		});
	};

	private fontSize = () => {
		action({
			message: 'Font Size',
			actions: ['8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '20px', '22px', '24px', '26px', '28px', '36px', '48px', '72px'],
			cancelButtonText: 'Cancel',
			cancelable: true,
		}).then((selectedSize) => {
			this._editor.emitToWebView('fontsize', selectedSize);
		});
	};

	private foreColor = () => {
		action({
			message: 'Font Color',
			actions: AVAILABLE_COLORS,
			cancelButtonText: 'Cancel',
			cancelable: true,
		}).then((selectedColor) => {
			this._editor.emitToWebView('forecolor', selectedColor);
		});
	};

	private backColor = () => {
		action({
			message: 'Background Color',
			actions: AVAILABLE_COLORS,
			cancelButtonText: 'Cancel',
			cancelable: true,
		}).then((selectedColor) => {
			this._editor.emitToWebView('backcolor', selectedColor);
		});
	};
}

htmlProperty.register(RichTextEditorCommon);
