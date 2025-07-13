# VS Code Web Chat Paste

VS Code 편집기의 코드를 웹 브라우저에서 실행 중인 특정 채팅 서비스(Grok, T3.chat, ChatGPT)의 입력창에 직접 붙여넣을 수 있게 해주는 통합 확장 프로그램입니다.

## 주요 기능

- **실시간 코드 전송**: VS Code에서 선택한 코드나 전체 파일을 단축키 한 번으로 웹 채팅창에 즉시 전송합니다.
- **자동 대상 탐지**: Chrome 확장 프로그램이 현재 활성화된 탭을 감지하여 `Grok`, `T3.chat`, `ChatGPT` 중 적절한 대상에 맞게 동작합니다.
- **안정적인 연결**: WebSocket을 통해 VS Code와 Chrome 브라우저가 통신하며, 연결이 끊어지면 자동으로 재연결을 시도합니다.
- **지능적인 텍스트 주입**: 단순 붙여넣기가 아닌, 실제 사용자 입력처럼 텍스트를 주입하여 React와 같은 최신 웹 프레임워크로 만들어진 사이트에서도 안정적으로 동작합니다.

## 동작 원리

이 프로젝트는 **VS Code 확장 프로그램**과 **Chrome 확장 프로그램**의 조합으로 동작하며, WebSocket을 통해 실시간으로 통신합니다.

1.  **VS Code 확인**: 활성화 시 `ws://localhost:8765` 주소로 WebSocket 서버를 실행하여 Chrome 확장의 연결을 대기합니다.
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
2.  VS Code 에서 `F5` 키를 눌러 확장 프로그램을 디버그 모드로 실행합니다.

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

## 보안 개선 사항

1. 암호화되지 않은 WebSocket 통신

   - 문제점
     - VS Code 확장과 Chrome 확장은 암호화되지 않은 ws://localhost:8765 프로토콜을 통해 통신합니다.
     - 이 통신은 평문(plain text)으로 이루어집니다.
   - 위협 시나리오
     - 로컬 데이터 스니핑(Sniffing): 사용자 컴퓨터에 악성코드가 있거나, 동일한 네트워크의 다른 사용자가 특수한 방법으로 로컬 트래픽을 감시할 경우, VS Code에서 웹으로 전송되는 모든 코드나 텍스트를 가로챌 수 있습니다.
   - 민감 정보 유출
     - 만약 사용자가 실수로 API 키, 비밀번호, 개인 정보, 회사의 중요한 소스 코드 등을 복사하여 전송하면, 이 정보가 그대로 노출될 수 있습니다.
   - 개선 방안
     - wss:// (WebSocket Secure) 프로토콜을 사용해야 합니다.
     - 이를 위해서는 localhost에 대한 자체 서명된(self-signed) SSL/TLS 인증서를 생성하고, VS Code 서버와 Chrome 클라이언트 양쪽에서 이를 신뢰하도록 설정해야 합니다.
     - 구현이 복잡해지지만, 통신 채널을 암호화하여 중간자 공격(Man-in-the-Middle)을 방지할 수 있습니다.

2. 인증되지 않은 클라이언트 연결 허용

   - 문제점
     - VS Code의 WebSocket 서버는 localhost:8765에 연결을 시도하는 어떤 클라이언트든 연결을 허용합니다.
     - 연결 주체가 정말로 의도된 Chrome 확장인지 확인하는 절차가 없습니다.
   - 위협 시나리오
     - 악성 클라이언트 연결: 사용자 컴퓨터의 다른 악성 프로그램(예: 다른 브라우저 확장, 데스크톱 앱)이 이 WebSocket 서버에 먼저 연결할 수 있습니다.
     - 이 경우, 사용자가 전송하는 코드가 악성 프로그램으로 전송되어 외부로 유출될 수 있습니다.
   - 개선 방안
     - 인증 토큰 도입
       1. VS Code 확장이 시작될 때마다 임의의 보안 토큰(secret token)을 생성합니다.
       2. 사용자가 이 토큰을 VS Code에서 복사하여 Chrome 확장의 설정 페이지에 한 번 붙여넣도록 안내합니다.
       3. Chrome 확장은 WebSocket에 연결할 때 이 토큰을 함께 전송하고, 서버는 토큰이 일치하는 클라이언트의 연결만 허용합니다.

3. 콘텐츠 스크립트의 텍스트 주입 방식

   - 문제점
     - content.js는 background.js로부터 받은 텍스트를 웹 페이지의 입력창(textarea 또는 contenteditable div)에 주입합니다.
     - 현재 코드는 inputField.value나 document.createTextNode를 사용하여 비교적 안전하게 텍스트를 처리하고 있지만, 만약 이 로직이 innerHTML을 사용하도록 변경된다면 심각한 문제가 발생할 수 있습니다.
   - 위협 시나리오 (현재 코드는 안전하지만, 잠재적 위험)
     - 자체 XSS (Self-XSS)
       - 만약 사용자가 `<script>alert('XSS')</script>`와 같은 악성 스크립트가 포함된 코드를 복사하고, content.js가 이를 innerHTML을 통해 주입한다면, 해당 스크립트가 grok.com이나 chatgpt.com과 같은 사이트의 컨텍스트에서 실행될 수 있습니다.
       - 이는 세션 쿠키 탈취 등 더 큰 공격으로 이어질 수 있습니다.
     - 다행히 현재 `content.js` 코드는 `simulateTextInput` 함수 내에서 텍스트를 안전하게 처리하여 이 위험을 방지하고 있습니다.
     - 하지만 향후 기능 추가 시 주의가 필요합니다.
   - 개선 방안
     - 현재의 안전한 방식을 유지하고, 절대로 `innerHTML`을 사용하여 외부로부터 받은 텍스트를 주입하지 않도록 코드 주석 등으로 명확히 경고해야 합니다.
     - 모든 텍스트는 순수 텍스트로 취급되어야 합니다.
