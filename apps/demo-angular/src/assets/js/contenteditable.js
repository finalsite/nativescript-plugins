// bridge interface for a regular content editable div

alert("Hello from contenteditable")

const nsWebViewBridge = window.nsWebViewBridge;

if (nsWebViewBridge) {
	initBridge();
} else {
	window.addEventListener('ns-bridge-ready', function (e) {
		const nsWebViewBridge = e.detail;
		initBridge();
	});
}

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
	const editorInstance = document.getElementById('editor');
	const range = window.getSelection().getRangeAt(0);
	const preSelectionRange = range.cloneRange();
	preSelectionRange.selectNodeContents(editorInstance);
	preSelectionRange.setEnd(range.startContainer, range.startOffset);
	const start = preSelectionRange.toString().length;

	currentSavedSelection = {
		start: start,
		end: start + range.toString().length,
	};
	return Promise.resolve();
};

const restoreSelectionPromise = function () {
	const editorInstance = document.getElementById('editor');
	let charIndex = 0,
		range = document.createRange();
	range.setStart(editorInstance, 0);
	range.collapse(true);
	let nodeStack = [editorInstance],
		node,
		foundStart = false,
		stop = false;

	while (!stop && (node = nodeStack.pop())) {
		if (node.nodeType == 3) {
			const nextCharIndex = charIndex + node.length;
			if (!foundStart && currentSavedSelection.start >= charIndex && currentSavedSelection.start <= nextCharIndex) {
				range.setStart(node, currentSavedSelection.start - charIndex);
				foundStart = true;
			}
			if (foundStart && currentSavedSelection.end >= charIndex && currentSavedSelection.end <= nextCharIndex) {
				range.setEnd(node, currentSavedSelection.end - charIndex);
				stop = true;
			}
			charIndex = nextCharIndex;
		} else {
			let i = node.childNodes.length;
			while (i--) {
				nodeStack.push(node.childNodes[i]);
			}
		}
	}

	const sel = window.getSelection();
	sel.removeAllRanges();
	sel.addRange(range);

	return Promise.resolve();
};

const getHtmlPromise = function () {
	const editorInstance = document.getElementById('editor');
	return Promise.resolve(editorInstance.innerHTML);
};

function initBridge() {
	const editorInstance = document.getElementById('editor');

	editorInstance.addEventListener(
		'blur',
		() => {
			nsWebViewBridge.emit('blur');
		},
		false
	);
	editorInstance.addEventListener(
		'focus',
		() => {
			nsWebViewBridge.emit('focus');
		},
		false
	);
	editorInstance.addEventListener(
		'input',
		() => {
			nsWebViewBridge.emit('input', editorInstance.innerHTML);
		},
		false
	);

	nsWebViewBridge.on('sourceChanged', function (data) {
		editorInstance.innerHTML = data;
	});

	nsWebViewBridge.on('focus', function () {
		editorInstance.focus();
	});

	nsWebViewBridge.on('done', function () {
		window.getSelection().removeAllRanges();
		editorInstance.blur();
	});

	nsWebViewBridge.on('fontsize', (value) => {
		document.execCommand('fontsize', false, '7');
		const fontElements = document.getElementsByTagName('font');
		for (let i = 0, len = fontElements.length; i < len; ++i) {
			if (fontElements[i].size == '7') {
				fontElements[i].removeAttribute('size');
				fontElements[i].style.fontSize = value;
			}
		}
		editorInstance.dispatchEvent(new Event('input'));
	});

	nsWebViewBridge.on('fontname', (value) => {
		document.execCommand('fontsize', false, '7');
		const fontElements = document.getElementsByTagName('font');
		for (let i = 0, len = fontElements.length; i < len; ++i) {
			if (fontElements[i].size == '7') {
				fontElements[i].removeAttribute('size');
				fontElements[i].style.fontFamily = value;
			}
		}
		editorInstance.dispatchEvent(new Event('input'));
	});

	const commonListeners = ['undo', 'redo', 'removeFormat', 'bold', 'underline', 'italic', 'justifyleft', 'justifycenter', 'justifyright', 'insertorderedlist', 'insertunorderedlist', 'outdent', 'indent', 'createLink', 'formatblock', 'forecolor', 'backcolor'];
	commonListeners.forEach((event) => {
		nsWebViewBridge.on(event, (value) => {
			value = value || null;
			document.execCommand(event, false, value);
		});
	});

	nsWebViewBridge.emit('ready');
}
