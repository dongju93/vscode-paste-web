# VS Code Web Chat Paste

VS Code 편집기의 코드를 웹 브라우저에서 실행 중인 특정 채팅 서비스(Grok, T3.chat, ChatGPT)의 입력창에 직접 붙여넣을 수 있게 해주는 통합 확장 프로그램입니다.

## 주요 기능

- **실시간 코드 전송**: VS Code에서 선택한 코드나 전체 파일을 단축키 한 번으로 웹 채팅창에 즉시 전송합니다.
- **자동 대상 탐지**: Chrome 확장 프로그램이 현재 활성화된 탭을 감지하여 `Grok`, `T3.chat`, `ChatGPT` 중 적절한 대상에 맞게 동작합니다.
- **안정적인 연결**: WebSocket을 통해 VS Code와 Chrome 브라우저가 통신하며, 연결이 끊어지면 자동으로 재연결을 시도합니다.
- **지능적인 텍스트 주입**: 단순 붙여넣기가 아닌, 실제 사용자 입력처럼 텍스트를 주입하여 React와 같은 최신 웹 프레임워크로 만들어진 사이트에서도 안정적으로 동작합니다.

## 동작 원리

이 프로젝트는 **VS Code 확장 프로그램**과 **Chrome 확장 프로그램**의 조합으로 동작하며, WebSocket을 통해 실시간으로 통신합니다.

1.  **VS Code 확���**: 활성화 시 `ws://localhost:8765` 주소로 WebSocket 서버를 실행하여 Chrome 확장의 연결을 대기합니다.
2.  **사용자 액션**: 사용자가 VS Code에서 코드를 선택하고 단축키(`Ctrl+Cmd+C` on macOS, `Ctrl+Alt+C` on Windows/Linux)를 누르거나 `Web Chat Paste: Copy to Chat` 명령을 실행합니다.
3.  **코드 전송**: 선택된 텍스트가 WebSocket을 통해 연결된 **Chrome 확장**으로 전송됩니다.
4.  **Chrome 확장**:
    - `background.js`가 메시지를 수신하고 현재 활성 탭이 지원되는 사이트(grok.com, t3.chat, chatgpt.com)인지 확인합니다.
    - 지원되는 사이트일 경우, `content.js` 스크립트가 해당 페이지의 채팅 입력창을 찾아 VS Code로부터 받은 텍스트를 주입합니다.

## 구성 요소

- **`vscode-extension/`**: VS Code 내에서 WebSocket 서버를 구동하고, 사용자가 복사한 텍스트를 Chrome으로 전송하는 역할을 합니다.
- **`chrome-extension/`**: VS Code의 WebSocket 서버에 연결하고, 수신된 텍스트를 특정 웹 페이지의 채팅창에 주입하는 역할을 합니다.

## 설치 및 사용법

### 1. VS Code 확장 프로그램

1.  `vscode-extension` 디렉터리에서 의존성을 설치합니다.
    ```bash
    cd vscode-extension
    pnpm install
    ```
2.  VS Code���서 `F5` 키를 눌러 확장 프로그램을 디버그 모드로 실행합니다.

### 2. Chrome 확장 프로그램

1.  Chrome 브라우저에서 `chrome://extensions` 페이지를 엽니다.
2.  **개발자 모드(Developer mode)**를 활성화합니다.
3.  **'압축해제된 확장 프로그램을 로드합니다(Load unpacked)'** 버튼을 클릭하고 `chrome-extension` 디렉터리를 선택합니다.

### 사용하기

1.  VS Code와 Chrome 확장이 모두 실행된 상태에서 지원되는 채팅 사이트(Grok, T3.chat, ChatGPT)를 엽니다.
2.  VS Code에서 전송할 코드를 선택합니다. (선택하지 않으면 현재 파일 전체가 대상이 됩니다.)
3.  단축키 `Ctrl+Cmd+C` (macOS) 또는 `Ctrl+Alt+C` (Windows/Linux)를 누릅니다.
4.  웹 브라우저의 채팅 입력창에 코드가 자동으로 붙여넣어지는 것을 확인합니다.

## 개발 명령어

### VS Code 확장

```bash
cd vscode-extension

# 의존성 설치
pnpm install

# TypeScript 컴파일
pnpm run compile

# 실시간 컴파일 (감시 모드)
pnpm run watch

# 확장 프로그램 패키징
pnpm run vscode:package
```

### Chrome 확장

Chrome 확장은 별도의 빌드 과정이 필요하지 않습니다. `chrome-extension/` 폴더를 Chrome 개발자 모드에서 직접 로드하여 사용합니다.