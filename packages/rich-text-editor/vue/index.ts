import { RichTextEditor as Editor } from "..";

const RichTextEditor = {
    install(Vue) {
        Vue.registerElement(
            'RichTextEditor',
            () => Editor,
        );
    }
};
export default RichTextEditor;