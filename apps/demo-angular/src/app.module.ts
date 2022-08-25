import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptModule } from '@nativescript/angular';

import {WebViewExtModule} from "@nota/nativescript-webview-ext/angular"

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HomeComponent } from './home.component';

@NgModule({
	schemas: [NO_ERRORS_SCHEMA],
	declarations: [AppComponent, HomeComponent],
	bootstrap: [AppComponent],
	imports: [NativeScriptModule, AppRoutingModule, WebViewExtModule],
})
export class AppModule {}
