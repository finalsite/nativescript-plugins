import { knownFolders, Property, GridLayout, AddChildFromBuilder, StackLayout, Button, PercentLength, ScrollView, Page, GridUnitType, ItemSpec, action, prompt, inputType } from '@nativescript/core';
import { getRootView } from '@nativescript/core/application';
import { PromptResult } from '@nativescript/core/ui/dialogs/dialogs-common';
import { LoadFinishedEventData, ShouldOverrideUrlLoadEventData, WebViewEventData, WebViewExt } from '@nota/nativescript-webview-ext';

export const htmlProperty = new Property<RichTextEditorCommon, string>({
	name: 'html',
	defaultValue: '',
	affectsLayout: true,
	valueChanged: (target: RichTextEditorCommon, oldValue, newValue) => {
		target.notifyWebViewChange(newValue);
	},
});

const AVAILABLE_COLORS = ['black', 'silver', 'gray', 'white', 'maroon', 'red', 'purple', 'fuchsia', 'green', 'lime', 'olive', 'yellow', 'navy', 'blue', 'teal', 'aqua'];

const MATERIAL_ICON_MAP = {
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

class RichTextEditorToolbar extends GridLayout {
	private _buttonLayout: StackLayout;
	private _editor: WebViewExt;

	constructor(editor) {
		super();

		this._editor = editor;

		this.addColumn(new ItemSpec(1, GridUnitType.STAR));
		this.addColumn(new ItemSpec(1, GridUnitType.AUTO));
		// TODO: should be stylable
		this.backgroundColor = '#F2F2F7';
		this.height = 44;
		this.width = PercentLength.parse('100%');

		const scrollView = new ScrollView();
		scrollView.orientation = 'horizontal';

		this._buttonLayout = new StackLayout();
		this._buttonLayout.orientation = 'horizontal';

		scrollView.content = this._buttonLayout;

		const doneButton = new Button();
		doneButton.text = 'Done';
		doneButton.style.padding = '0 10';

		doneButton.on('tap', () => {
			editor.emitToWebView('done', null);
		});

		this.addChildAtCell(scrollView, 0, 0);
		this.addChildAtCell(doneButton, 0, 1);
	}

	onLoaded() {
		super.onLoaded();

		// if buttons exist here then a custom button list is being used
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

	private createButton(text, command): Button {
		let newButton = new Button();
		newButton.text = MATERIAL_ICON_MAP[text] || text;
		newButton.set('editorCommand', command);
		return newButton;
	}

	public addButton(button: Button): void {
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
		await this._editor.executePromise('saveSelectionPromise()');

		prompt({
			title: 'URL',
			defaultText: 'http://',
			okButtonText: 'Ok',
			cancelButtonText: 'Cancel',
			cancelable: true,
			inputType: inputType.email,
		}).then(async (result: PromptResult) => {
			await this._editor.executePromise('restoreSelectionPromise()');
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

export abstract class RichTextEditorCommon extends WebViewExt implements AddChildFromBuilder {
	hasFocus: boolean;

	private _loadedPromise: Promise<LoadFinishedEventData>;
	private _setEventFromWebView: boolean;
	private _template: string;

	protected _toolbar: RichTextEditorToolbar;
	protected _currentPage: Page;

	protected _originalActionBarStateHidden = false;
	protected _originalHeight: number;
	protected _originalWidth: number;

	constructor() {
		super();

		this._template = 'contenteditable';
		this._setEventFromWebView = false;

		this._toolbar = new RichTextEditorToolbar(this);
	}

	protected toggleParentScrollers(enable: boolean) {
		let parentStroller;
		parentStroller = this.parent;
		while (parentStroller) {
			if (parentStroller instanceof ScrollView) {
				parentStroller.isScrollEnabled = enable;
			}
			parentStroller = parentStroller.parent;
		}
	}

	public onLoaded() {
		super.onLoaded();

		/* already setup so just return */
		if (this._toolbar.parent) return;

		const webViewSrc = encodeURI(`${knownFolders.currentApp().path}/assets/html/${this._template}.html`);

		let pg;
		pg = this.parent;
		while (pg && !(pg instanceof Page)) {
			pg = pg.parent;
		}
		if (!(pg.content instanceof GridLayout)) {
			console.log(`\n********Warning**********\n A root GridLayout is required in order for the RichTextEditor to work correctly\n\n`);
		}
		this._currentPage = pg;

		pg.content.addChild(this._toolbar);

		// prevent navigating to other urls on this webview
		this.on(WebViewExt.shouldOverrideUrlLoadingEvent, (args: ShouldOverrideUrlLoadEventData) => {
			if (!args.url.includes(webViewSrc)) {
				args.cancel = true;
			}
		});

		// listen for change events on the webview and reflect them on the html property
		this.on('input', (event: WebViewEventData) => {
			// TODO: there's probably a better way of doing this
			// we set this so we don't turn around and notify the change right back to the web view
			this._setEventFromWebView = true;
			this.set('html', event.data);
		});

		// TODO: make this more customizable/extendable
		if (this._template === 'contenteditable') {
			this.autoLoadJavaScriptFile('contenteditable', '~/assets/js/contenteditable.js');
		} else {
			this.autoLoadJavaScriptFile('ckeditor4', '~/assets/js/ckeditor4.js');
		}

		this._loadedPromise = this.loadUrl(webViewSrc).then((event: LoadFinishedEventData) => {
			this.emitToWebView('sourceChanged', this.get('html'));
			return event;
		});
	}

	_addChildFromBuilder(name: string, button: Button) {
		if (!(button instanceof Button)) return;
		this._toolbar.addButton(button);
	}

	set template(value: string) {
		this._template = value;
	}

	public async notifyWebViewChange(value: string) {
		if (this._setEventFromWebView) {
			return;
		}

		await this._loadedPromise;
		this.emitToWebView('sourceChanged', value);
		this._setEventFromWebView = false;
	}
}

htmlProperty.register(RichTextEditorCommon);
