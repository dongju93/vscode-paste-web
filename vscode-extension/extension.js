"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const WebSocket = require("ws");
// 에러를 안전하게 문자열로 변환하는 유틸 함수
function getErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
// WebSocket 서버 관리 클래스
class WebChatPasteServer {
    constructor() {
        this.wss = null;
        this.clients = [];
        this.port = 8765;
    }
    start() {
        return new Promise((resolve, reject) => {
            if (this.wss) {
                console.log("WebSocket server already running");
                resolve();
                return;
            }
            try {
                this.wss = new WebSocket.WebSocketServer({ port: this.port });
                this.wss.on("connection", (ws) => {
                    this.clients.push(ws);
                    ws.on("close", () => {
                        this.clients = this.clients.filter((client) => client !== ws);
                        console.log("Chrome extension disconnected");
                    });
                    this.showMessage("Chrome extension connected to WebSocket server.");
                    console.log("Chrome extension connected");
                });
                this.wss.on("error", (error) => {
                    const errorMsg = getErrorMessage(error);
                    console.error("WebSocket server error:", error);
                    vscode.window.showErrorMessage(`WebSocket server error: ${errorMsg}`);
                    reject(error);
                });
                console.log(`WebSocket server started on ws://localhost:${this.port}`);
                this.showMessage(`WebSocket server started on port ${this.port}`);
                resolve();
            }
            catch (error) {
                const errorMsg = getErrorMessage(error);
                console.error("Failed to start WebSocket server:", error);
                vscode.window.showErrorMessage(`Failed to start WebSocket server: ${errorMsg}`);
                reject(error);
            }
        });
    }
    stop() {
        if (this.wss) {
            this.wss.close();
            this.wss = null;
            this.clients = [];
            this.showMessage("WebSocket server stopped.");
        }
    }
    isRunning() {
        return this.wss !== null;
    }
    getClientCount() {
        return this.clients.length;
    }
    broadcastMessage(message) {
        let sentCount = 0;
        const messageStr = JSON.stringify(message);
        this.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
                sentCount++;
            }
        });
        return sentCount;
    }
    showMessage(message) {
        vscode.window.showInformationMessage(message);
    }
}
let server;
function activate(context) {
    console.log('Web Chat Paste extension is now active!');
    server = new WebChatPasteServer();
    // 확장 활성화 시 자동으로 서버 시작
    server.start().catch((error) => {
        console.error("Failed to start WebSocket server during activation:", error);
    });
    // 연결 명령어: WebSocket 서버 시작 (수동 재시작용)
    const disposableConnect = vscode.commands.registerCommand("webChatPaste.connect", async () => {
        if (server.isRunning()) {
            vscode.window.showInformationMessage("Server already running.");
            return;
        }
        try {
            await server.start();
        }
        catch (error) {
            const errorMsg = getErrorMessage(error);
            vscode.window.showErrorMessage(`Failed to start server: ${errorMsg}`);
        }
    });
    // 복사 명령어: 선택 텍스트를 연결된 클라이언트에 전송
    const disposableCopy = vscode.commands.registerCommand("webChatPaste.copyToChat", () => {
        console.log("copyToChat 명령어 실행됨");
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            console.log("활성 텍스트 에디터가 없음");
            vscode.window.showWarningMessage("No active text editor.");
            return;
        }
        const selection = editor.selection;
        let text = editor.document.getText(selection);
        if (!text) {
            text = editor.document.getText(); // 선택 없으면 전체 파일
        }
        const clientCount = server.getClientCount();
        console.log(`전송할 텍스트 길이: ${text.length}`);
        console.log(`연결된 클라이언트 수: ${clientCount}`);
        if (clientCount === 0) {
            console.log("클라이언트 연결 없음");
            vscode.window.showWarningMessage("No clients connected. Ensure browser extension is connected.");
            return;
        }
        const messageData = { text };
        console.log("메시지 전송 시작");
        const sentCount = server.broadcastMessage(messageData);
        console.log(`메시지 전송 완료 - ${sentCount}개 클라이언트에 전송됨`);
        vscode.window.showInformationMessage(`Text sent to chat (${sentCount} clients).`);
    });
    context.subscriptions.push(disposableConnect, disposableCopy);
}
function deactivate() {
    if (server) {
        server.stop();
    }
}
//# sourceMappingURL=extension.js.map