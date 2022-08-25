import Vue from 'nativescript-vue'

import Home from './components/Home'

import RichTextEditor from "@finalsite/rich-text-editor/vue"
RichTextEditor.install(Vue)

new Vue({
  render: (h) => h('frame', [h(Home)]),
}).$start()
