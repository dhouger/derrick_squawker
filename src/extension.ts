'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as Twitter from 'twitter';
import { open } from 'inspector';

// Track current webview panel
let currentPanel: vscode.WebviewPanel | undefined = undefined;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('squawker.start', 
    () => {
        const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
        
        if (currentPanel) {
            // If there is already a Squawker panel, show it
            currentPanel.reveal(columnToShowIn);
        }
        else {
            currentPanel = vscode.window.createWebviewPanel(
                'squawker',
                'Squawker',
                vscode.ViewColumn.One,
    
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                } // Webview options
            );
    
            currentPanel.webview.html = getWebviewContent();
    
            // Message handling from the webview
            currentPanel.webview.onDidReceiveMessage(message => {
                switch (message.command) {
                    case 'squawk':
                        postToTwitter(message.text);
                        return;
                }
            }, undefined, context.subscriptions);

            // Dispose the currentPanel when Squawker is closed
            currentPanel.onDidDispose(() => {
                currentPanel = undefined;
            }, null, context.subscriptions);
        }
    }));
}

// Return the WebView HTML for the extension
function getWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Squawker</title>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
    </head>
    <body style="background-color: rgba(30,30,30,1);">
        <div class="container">
            <h1 class="text-center text-info">Welcome to Squawker!</h1>
            <p class="text-center text-white">Type something in the box below to Squawk something!</p>
        </div>
        <div class="container">
            <div class="input-group mb-3">
                <input type="text" class="form-control" placeholder="Text you want to Squawk!" id="squawkerText">
                <div class="input-group-append input-group-addon">
                    <button type="button" class="btn btn-outline-info" id="sendSquawk">Squawk!</button>
                </div>
            </div>
        </div>

        <script>
            (function() {
                const vscode = acquireVsCodeApi();
                const input = document.getElementById('squawkerText');
                const button = document.getElementById('sendSquawk');

                button.onclick = function () {
                    vscode.postMessage({
                        command: 'squawk',
                        text: input.value
                    });
                };
            }());
        </script>
    </body>
    </html>`;
}

// Send a post to twitter using squawkers user settings
function postToTwitter(text: string) {
    if (text.length > 0) {
        var consumerKey = vscode.workspace.getConfiguration('squawker').get('consumerKey');
        var consumerSecret = vscode.workspace.getConfiguration('squawker').get('consumerSecret');
        var accessTokenKey = vscode.workspace.getConfiguration('squawker').get('accessTokenKey');
        var accessTokenSecret = vscode.workspace.getConfiguration('squawker').get('accessTokenSecret');

        if (!!consumerKey && !!consumerSecret && !!accessTokenKey && !!accessTokenSecret) {
            // initialize a Twitter client
            var client = new Twitter({
                consumer_key: consumerKey,
                consumer_secret: consumerSecret,
                access_token_key: accessTokenKey,
                access_token_secret: accessTokenSecret
            });

            client.post('statuses/update', {status: text})
                .then(function (tweet) {
                    vscode.window.showInformationMessage('Successfully Squawked!', 'Link')
                    .then(selectedAction => {
                        if (selectedAction === 'Link') {
                            vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('https://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str));
                        }
                    });
                })
                .catch(function (error) {
                    vscode.window.showErrorMessage('There was a problem with your Squawk!', 'Check Output:Log(Window) for details');
                    throw error;
                });
        }
        else {
            if (!consumerKey) {
                vscode.window.showErrorMessage('Missing: Twitter consumer key.', 'Open Settings')
                .then(selectedAction => {
                    vscode.commands.executeCommand('workbench.action.openSettings');
                });
            }

            if (!consumerSecret) {
                vscode.window.showErrorMessage('Missing: Twitter consumer secret.', 'Open Settings')
                .then(selectedAction => {
                    vscode.commands.executeCommand('workbench.action.openSettings');
                });
            }

            if (!accessTokenKey) {
                vscode.window.showErrorMessage('Missing: Twitter access token key.', 'Open Settings')
                .then(selectedAction => {
                    vscode.commands.executeCommand('workbench.action.openSettings');
                });
            }

            if (!accessTokenSecret) {
                vscode.window.showErrorMessage('Missing: Twitter access token secret.', 'Open Settings')
                .then(selectedAction => {
                    vscode.commands.executeCommand('workbench.action.openSettings');
                });
            }
        }
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}