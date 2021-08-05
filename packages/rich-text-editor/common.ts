import { knownFolders, Observable, View, Property, EventData, GridLayout, ContentView, AddChildFromBuilder, StackLayout, Button, PercentLength, AbsoluteLayout, ScrollView, Page, Frame, Length, GridUnitType, ItemSpec } from '@nativescript/core';
import { getRootView } from '@nativescript/core/application';
import { LoadFinishedEventData, ShouldOverrideUrlLoadEventData, WebViewEventData, WebViewExt } from '@nota/nativescript-webview-ext';

export const htmlProperty = new Property<RichTextEditorCommon, string>({
	name: 'html',
	defaultValue: '',
	affectsLayout: true,
	valueChanged: (target: RichTextEditorCommon, oldValue, newValue) => {
		target.notifyWebViewChange(newValue);
	},
});

class RichTextEditorToolbar extends GridLayout {
	constructor(editor) {
		super();

		this.addColumn(new ItemSpec(1, GridUnitType.STAR));
		this.addColumn(new ItemSpec(1, GridUnitType.AUTO));
		this.backgroundColor = '#F2F2F7';
		this.height = 44;
		this.width = PercentLength.parse('100%');

		const scrollView = new ScrollView();
		scrollView.orientation = 'horizontal';

		const buttonLayout = new StackLayout();
		buttonLayout.orientation = 'horizontal';

		scrollView.content = buttonLayout;

		const doneButton = new Button();
		doneButton.text = 'Done';
		doneButton.style.padding = '0 10 0 5';

		doneButton.on('tap', () => {
			editor.emitToWebView('done', null);
		});

		this.addChildAtCell(scrollView, 0, 0);
		this.addChildAtCell(doneButton, 0, 1);

		// TODO: figure out a way to build out the buttons in a more customizable way
		const boldButton = new Button();
		boldButton.className = 'icon editor-btn';
		boldButton.text = String.fromCharCode(0xe238);
		boldButton.on('tap', () => {
			editor.emitToWebView('bold', null);
		});
		buttonLayout.addChild(boldButton);

		const underlineButton = new Button();
		underlineButton.className = 'icon editor-btn';
		underlineButton.text = String.fromCharCode(0xe249);
		underlineButton.on('tap', () => {
			editor.emitToWebView('underline', null);
		});
		buttonLayout.addChild(underlineButton);

		const italicButton = new Button();
		italicButton.className = 'icon editor-btn';
		italicButton.text = String.fromCharCode(0xe23f);
		italicButton.on('tap', () => {
			editor.emitToWebView('italic', null);
		});
		buttonLayout.addChild(italicButton);
	}
}

export abstract class RichTextEditorCommon extends WebViewExt {
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
