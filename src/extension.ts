// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
export function activate(context: vscode.ExtensionContext) {

  require('./definitionProvider')(context);
  require('./descHelper')(context);

  // let helper = new DescHelper(context);

  // const showHover = vscode.workspace.getConfiguration().get('vscodePluginDemo.showHover');

  // if (window.activeTextEditor) {
  //   helper.updateAction(window.activeTextEditor);
  // }
}

// this method is called when your extension is deactivated
export function deactivate() { }
