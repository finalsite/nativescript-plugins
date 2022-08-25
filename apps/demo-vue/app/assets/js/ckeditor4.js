// bridge interface for a regular content editable div
let nsWebViewBridge;
const waitCKEDITOR = setInterval(function () {
	if (!window.CKEDITOR) return;
	clearInterval(waitCKEDITOR);

	nsWebViewBridge = window.nsWebViewBridge;
	if (nsWebViewBridge) {
		initBridge();
	} else {
		window.addEventListener('ns-bridge-ready', function (e) {
			nsWebViewBridge = e.detail;
			initBridge();
		});
	}
}, 10);

const insertHeadScript = function (src) {
	var externalScript = document.createElement('script');
	externalScript.setAttribute('src', src);
	document.head.appendChild(externalScript);
};

const insertHeadCSS = function (src) {
	var externalCSS = document.createElement('link');
	externalCSS.setAttribute('rel', 'stylesheet');
	externalCSS.setAttribute('type', 'text/css');
	externalCSS.setAttribute('href', src);
	document.head.appendChild(externalCSS);
};

let currentSavedSelection;
const saveSelectionPromise = function () {
	currentSavedSelection = CKEDITOR.instances.editor.getSelection().createBookmarks();
	return Promise.resolve();
};

const restoreSelectionPromise = function () {
	CKEDITOR.instances.editor.getSelection().selectBookmarks(currentSavedSelection);
	return Promise.resolve();
};

const getHtmlPromise = function () {
	return Promise.resolve(CKEDITOR.instances.editor.getData());
};

function initBridge() {
	// android can end up reloading the html a lot and end up in a weird state somehow :/
	if (CKEDITOR.instances.editor) CKEDITOR.instances.editor.destroy();

	const editorDiv = document.getElementById('editor');

	// disable UI things that we're replacing with native buttons
	const editorInstance = CKEDITOR.inline('editor', {
		extraPlugins: 'justify,indentblock,indentlist',
		removePlugins: 'liststyle,tableselection,tabletools,tableresize,contextmenu,toolbar',
		allowedContent: true,
		toolbar: [],
	});

	nsWebViewBridge.on('sourceChanged', function (data) {
		editorInstance.setData(data);
	});

	nsWebViewBridge.on('done', function (data) {
		editorInstance.focusManager.blur(true);
		editorInstance.getSelection().removeAllRanges();
		editorDiv.blur();
	});

	/*
	 * handle regular commands that dont take arguments
	 */
	const CKE_COMMAND_MAP = {
		insertorderedlist: 'numberedlist',
		insertunorderedlist: 'bulletedlist',
	};
	const commonListeners = ['undo', 'redo', 'removeFormat', 'bold', 'underline', 'italic', 'justifyleft', 'justifycenter', 'justifyright', 'insertorderedlist', 'insertunorderedlist', 'outdent', 'indent'];
	commonListeners.forEach((event) => {
		nsWebViewBridge.on(event, (value) => {
			value = value || null;
			event = CKE_COMMAND_MAP[event] || event;
			editorInstance.execCommand(event, false, value);
		});
	});

	/*
	 * Commands that take an argument are usually just CKEDITOR styles applied to selected text
	 */
	const CKE_COMMAND_STYLE_MAP = {
		formatblock: (value) => new CKEDITOR.style({ element: value }),
		createLink: (value) => new CKEDITOR.style({ element: 'a', attributes: { href: value }, type: CKEDITOR.STYLE_INLINE }),
		backcolor: (value) => new CKEDITOR.style({ element: 'span', styles: { 'background-color': value } }),
		fontname: (value) => {
			return new CKEDITOR.style({
				element: 'span',
				styles: { 'font-family': value },
				overrides: [
					{
						element: 'font',
						attributes: { face: null },
					},
				],
			});
		},
		fontsize: (value) => {
			return new CKEDITOR.style({
				element: 'span',
				styles: { 'font-size': value },
				overrides: [
					{
						element: 'font',
						attributes: { size: null },
					},
				],
			});
		},
		forecolor: (value) => {
			return new CKEDITOR.style({
				element: 'span',
				styles: { color: value },
				overrides: [
					{
						element: 'font',
						attributes: { color: null },
					},
				],
			});
		},
	};

	Object.keys(CKE_COMMAND_STYLE_MAP).forEach((event) => {
		nsWebViewBridge.on(event, (value) => {
			if (!value) return;
			editorInstance.applyStyle(CKE_COMMAND_STYLE_MAP[event](value));
		});
	});

	editorInstance.on('instanceReady', () => {
		editorInstance.on(
			'doubleclick',
			function (evt) {
				// TODO: emit this to the native side maybe?
				return false;
			},
			null,
			null,
			1
		); // last param gives this priority

		editorInstance.on('focus', function (event) {
			nsWebViewBridge.emit('focus');
		});

		editorInstance.on('blur', function (event) {
			nsWebViewBridge.emit('blur');
		});

		editorInstance.on('change', function (event) {
			nsWebViewBridge.emit('input', editorInstance.getData());
		});

		nsWebViewBridge.emit('ready');
	});
}
