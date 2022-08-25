import { RichTextEditor as Editor } from "..";
import "@nota/nativescript-webview-ext/vue"

const RichTextEditor = {
    install(Vue) {
        Vue.registerElement(
            'RichTextEditor',
            () => Editor,
        );
    }
};
export default RichTextEditor;