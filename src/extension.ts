// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {
  window, TextEditorSelectionChangeEvent,
} from "vscode";
import { DescHelper } from './descHelper';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed


export function activate(context: vscode.ExtensionContext) {

  let activeEditor: vscode.TextEditor;
  let helper = new DescHelper();
  var timeout: NodeJS.Timer;

  require('./jumpToDefinition')(context);

  function updateAction(str?: string) {
    const uri = activeEditor.document.uri;
    if (uri.scheme !== 'file' || !uri.path.endsWith('package.json')) {
      return;
    }
    triggerUpdate();
  }

  // Get the active editor for the first time and initialise the regex
  if (vscode.window.activeTextEditor) {
    activeEditor = vscode.window.activeTextEditor;
    updateAction();
  }



  // * Handle active file changed
  vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor) {
      activeEditor = editor;
    }
  }, null, context.subscriptions);


  // * Handle file contents changed
  vscode.workspace.onDidChangeTextDocument(event => {
    console.log(event);
    // Trigger updates if the text was changed in the same document
    if (activeEditor && event.document === activeEditor.document) {
      updateAction();
    } else {

    }
  }, null, context.subscriptions);


  window.onDidChangeTextEditorSelection((event: TextEditorSelectionChangeEvent) => {
    updateAction();
  }, null, context.subscriptions);


  function triggerUpdate() {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      helper.addDesc(activeEditor);
    }, 200);
  }
}

// this method is called when your extension is deactivated
export function deactivate() { }
