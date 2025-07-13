# Web Chat Paste - VS Code 확장 프로그램

VS Code의 텍스트를 웹 채팅창으로 전송하는 확장 프로그램입니다. Chrome 확장 프로그램과 연동하여 동작합니다.

## 주요 기능

- **WebSocket 서버**:

  - 확장 프로그램이 활성화되면(VS Code 시작 시) 자동으로 `ws://localhost:8765` 포트에서 WebSocket 서버를 시작합니다.
  - Chrome 확장 프로그램과의 연결을 관리합니다.

- **텍스트 전송**:
  - `Web Chat Paste: Copy to Chat` 명령어를 제공합니다.
  - 기본 단축키 `Ctrl+Cmd+C` (macOS) 또는 `Ctrl+Alt+C` (Windows/Linux)를 지원합니다.
  - 에디터에서 텍스트를 선택하고 명령을 실행하면 해당 텍스트가 연결된 모든 Chrome 확장 프로그램 클라이언트로 전송됩니다.
  - 선택된 텍스트가 없으면 현재 활성화된 파일의 전체 내용이 전송됩니다.
