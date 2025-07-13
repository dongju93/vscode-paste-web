// chrome-extension/background.js

let socket;
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;
const reconnectDelay = 3000; // 3초

/**
 * WebSocket 서버에 연결을 시도합니다.
 * 이미 연결 중이거나 연결된 상태이면 아무 작업도 하지 않습니다.
 */
function connectToServer() {
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    console.log('WebSocket is already open or connecting.');
    return;
  }

  console.log('Attempting to connect to WebSocket server...');
  socket = new WebSocket('ws://localhost:8765');

  socket.onopen = () => {
    console.log('Connected to VSCode WebSocket server');
    reconnectAttempts = 0; // 연결 성공 시 재시도 횟수 초기화
  };

  socket.onmessage = handleWebSocketMessage;

  socket.onclose = (event) => {
    console.log(
      `WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}`,
    );
    attemptReconnect();
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error.message);
    // onclose가 자동으로 호출되므�� 여기서 재연결을 시도하지 않습니다.
  };
}

/**
 * 서버 재연결을 시도합니다.
 */
function attemptReconnect() {
  if (reconnectAttempts < maxReconnectAttempts) {
    reconnectAttempts++;
    console.log(
      `Attempting to reconnect... (${reconnectAttempts}/${maxReconnectAttempts})`,
    );
    setTimeout(connectToServer, reconnectDelay);
  } else {
    console.log(
      'Max reconnection attempts reached. Please check if the VSCode WebSocket server is running.',
    );
  }
}

/**
 * WebSocket 메시지를 비동기적으로 처리합니다.
 * @param {MessageEvent} event
 */
async function handleWebSocketMessage(event) {
  console.log('Raw message received:', event.data);
  try {
    const { text } = JSON.parse(event.data);
    console.log(`=== Processing Message ===`);
    console.log(`Text length: ${text ? text.length : 0}`);

    // 활성 탭 확인
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!activeTab) {
      console.error('No active tab found');
      return;
    }

    const { id: tabId, url: activeUrl } = activeTab;
    console.log(`=== Auto Target Detection ===`);
    console.log(`Active URL: '${activeUrl}'`);

    // URL에 따라 자동으로 타겟 결정
    let detectedTarget = null;
    if (activeUrl?.includes('grok.com')) {
      detectedTarget = 'grok';
    } else if (activeUrl?.includes('t3.chat')) {
      detectedTarget = 't3';
    } else if (activeUrl?.includes('chatgpt.com')) {
      detectedTarget = 'chatgpt';
    }

    console.log(`Detected target: '${detectedTarget}'`);

    if (detectedTarget) {
      console.log(`✅ Supported site detected - proceeding with injection`);
      await ensureContentScript(tabId);
      await sendMessageToContentScript(tabId, text, detectedTarget);
    } else {
      console.log(`❌ Unsupported site`);
      const errorMessage = `Unsupported site: '${activeUrl}'. Please navigate to a supported site first.`;
      console.error(errorMessage);
      // WebSocket으로 에러 응답 보내기
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            error: 'Unsupported site. Please navigate to a supported site.',
            activeUrl: activeUrl,
            supportedSites: ['grok.com', 't3.chat', 'chatgpt.com'],
          }),
        );
      }
    }
  } catch (error) {
    console.error('Failed to process message or send to tab:', error);
  }
}

/**
 * 콘텐츠 스크립트가 탭에 주입되었는지 확인하고, 없으면 주입합니다.
 * @param {number} tabId
 */
async function ensureContentScript(tabId) {
  try {
    // ping을 보내서 content script가 있는지 확인
    await chrome.tabs.sendMessage(tabId, { action: 'ping' });
  } catch (error) {
    // "Could not establish connection" 오류는 content script가 없다는 의미
    if (
      error.message.includes('Could not establish connection') ||
      error.message.includes('Receiving end does not exist')
    ) {
      console.log('Content script not found, injecting...');
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js'],
      });
      // 스크립트가 로드될 시간을 잠시 줍니다.
      await new Promise((resolve) => setTimeout(resolve, 100));
      console.log('Content script injected successfully.');
    } else {
      console.error('Error checking for content script:', error);
      throw error; // 다른 종류의 오류는 다시 던집니다.
    }
  }
}

/**
 * 콘텐츠 스크립트로 메시지를 전송합니다.
 * @param {number} tabId
 * @param {string} text
 * @param {string} target
 */
async function sendMessageToContentScript(tabId, text, target) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      action: 'pasteToChat',
      text,
      target,
    });
    console.log('Message sent successfully:', response);
  } catch (error) {
    console.error('Failed to send message to content script:', error.message);
    throw error;
  }
}

// 확장 프로그램이 설치되거나 업데이트될 때 연결 시작
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated.');
  connectToServer();
});

// 브라우저가 시작될 때 연결 시작
chrome.runtime.onStartup.addListener(() => {
  console.log('Browser startup.');
  connectToServer();
});
