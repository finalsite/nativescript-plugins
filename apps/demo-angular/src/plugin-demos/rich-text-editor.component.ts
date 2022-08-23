import { Component, NgZone } from '@angular/core';
import { DemoSharedRichTextEditor } from '@demo/shared';
import {} from '@finalsite/rich-text-editor';

@Component({
	selector: 'demo-rich-text-editor',
	templateUrl: 'rich-text-editor.component.html',
})
export class RichTextEditorComponent {
	demoShared: DemoSharedRichTextEditor;
	_editorContent: string =
		'<p><img alt="leonardo" height="249" src="https://upload.wikimedia.org/wikipedia/en/e/ed/Leonardo_%28Teenage_Mutant_Ninja_Turtles%29.jpg" style="float:right; margin: 1em" width="150" /></p><h1><strong>Leonardo</strong></h1><p>Nicknamed&nbsp;<strong>Leo</strong>, is a fictional superhero and one of the four main characters in the&nbsp;<a href="https://en.wikipedia.org/wiki/Teenage_Mutant_Ninja_Turtles">Teenage Mutant Ninja Turtles</a>&nbsp;comics and related media.</p><p>He is often depicted wearing a blue bandanna. His&nbsp;<a href="https://en.wikipedia.org/wiki/Signature_weapon">signature weapons</a>&nbsp;are two&nbsp;<a href="https://en.wikipedia.org/wiki/Ninjato">Ninjatos</a>, commonly confused as&nbsp;<a href="https://en.wikipedia.org/wiki/Katanas">Katanas</a>. Leonardo is the eldest brother and the leader of the group. He is the most skilled, the most serious, the most spiritual, the most mature, the most disciplined and the most in-line with Splinter&#39;s teachings and thoughts. Like all of the brothers, he is named after an&nbsp;<a href="https://en.wikipedia.org/wiki/Italian_Renaissance">Italian Renaissance</a>&nbsp;artist, in this case&nbsp;<a href="https://en.wikipedia.org/wiki/Leonardo_da_Vinci">Leonardo da Vinci</a>. Leonardo da Vinci is widely considered the most diversely skilled individual of the Renaissance period, and as such Leonardo is also considered the most diversely skilled ninja turtle. In the Mirage comics, all four of the Turtles wear red masks, but for the creators to tell them apart, he was written and redrawn to have an ocean-blue mask.</p><p><img alt="Raphael" height="231" src="https://upload.wikimedia.org/wikipedia/en/7/72/Raphael_%28Teenage_Mutant_Ninja_Tutles%29.jpg" style="float:left; margin: 1em;" width="150" /></p><h1><strong>Raphael</strong></h1><p>Nicknamed&nbsp;<strong>Raph</strong>, is a fictional&nbsp;<a href="https://en.wikipedia.org/wiki/Superhero">superhero</a>&nbsp;and one of the four main characters of the&nbsp;<em><a href="https://en.wikipedia.org/wiki/Teenage_Mutant_Ninja_Turtles">Teenage Mutant Ninja Turtles</a></em>&nbsp;comics and all related media.&nbsp;He is generally depicted as the second oldest/mid-middle-child of the turtle brothers, but has once been portrayed as the eldest.</p><p>He is usually depicted wearing a red eye mask; in this regard he is the only turtle to retain the color in all media, whereas the others each received a different color. Raphael wields twin&nbsp;<a href="https://en.wikipedia.org/wiki/Sai_(weapon)">sai</a>, the points of which are usually sharpened, as his primary weapon. Raphael is most famous for his temperamental and cynical personality, being short-tempered, aggressive, sullen, maddened, sarcastic, and rebellious.&nbsp;He is portrayed in most interaction as speaking with a&nbsp;<a href="https://en.wikipedia.org/wiki/Brooklyn_accent">Brooklyn accent</a>. It may be a coincidence, but the fact that he has a bad and fiery attitude and temper and the fact that his mask is still red may be linked, since the color red is typically associated with anger.</p><p>The origin of Raphael&#39;s anger is not always fully explored, but in some incarnations appears to stem partly from the realization that they are the only creatures of their kind and ultimately alone. He also has a somewhat rival relationship with his only older brother&nbsp;<a href="https://en.wikipedia.org/wiki/Leonardo_(Teenage_Mutant_Ninja_Turtles)">Leonardo</a>&nbsp;because he is seen as the group&#39;s leader. Raphael also gives his younger and youngest brother&nbsp;<a href="https://en.wikipedia.org/wiki/Michelangelo_(Teenage_Mutant_Ninja_Turtles)">Michelangelo</a>&nbsp;a hard time because of Michelangelo&rsquo;s fiery optimism. He is the second eldest of the turtles, and&nbsp;<a href="https://en.wikipedia.org/wiki/Second-in-command">second-in-command</a>. Like all of the brothers, he is named after a Renaissance artist; in this case, he is named after the 16th-century Italian painter&nbsp;<a href="https://en.wikipedia.org/wiki/Raphael">Raphael</a>.&nbsp;In 2011, Raphael placed 23rd on&nbsp;<a href="https://en.wikipedia.org/wiki/IGN">IGN</a>&#39;s Top 100 Comic Book Heroes,&nbsp;a list that did not feature any of his brothers. He is the only Teenage Turtle brother whose name does not end in the letter &quot;O&quot;.</p><p>[<a href="https://en.wikipedia.org/wiki/Teenage_Mutant_Ninja_Turtles">https://en.wikipedia.org/wiki/Teenage_Mutant_Ninja_Turtles</a>]</p>';

	constructor(private _ngZone: NgZone) {}

	ngOnInit() {
		this.demoShared = new DemoSharedRichTextEditor();
	}

	onViewSource() {
		alert(this._editorContent)
	}

	get editorContent() {
		return this._editorContent;
	}

	set editorContent(content) {
		this._editorContent = content
	}
}
