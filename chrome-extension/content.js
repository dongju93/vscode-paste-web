// 사이트별 셀렉터 상수
const SELECTORS = {
  grok: 'textarea[aria-label*="Grok"]',
  t3: '#chat-input',
  chatgpt: 'div[id="prompt-textarea"]',
  fallback: 'textarea',
};

// 텍스트 입력 시뮬레이션을 위한 공통 함수
function simulateTextInput(inputField, text) {
  inputField.focus();

  // React 상태 업데이트를 위한 이벤트 순서
  const events = [
    { type: 'focus' },
    { type: 'beforeinput', data: text },
    { type: 'input' },
    { type: 'change' },
  ];

  if (inputField.isContentEditable) {
    // contenteditable div의 경우
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(inputField);
    selection.removeAllRanges();
    selection.addRange(range);

    // 현대적인 방법으로 텍스트 삽입 - execCommand 대신 직접 DOM 조작
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);

    // 커서를 텍스트 끝으로 이동
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);

    // React 컴포넌트가 변경을 감지할 수 있도록 input 이벤트 발생
    inputField.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text,
      }),
    );
  } else {
    // textarea 또��� input의 경우
    inputField.select();
    if (inputField.setRangeText) {
      inputField.setRangeText('', 0, inputField.value.length, 'preserve');
      inputField.setRangeText(text, 0, 0, 'end');
    } else {
      inputField.value = text;
    }
  }

  // React 상태 업데이트를 위한 이벤트 발생
  events.forEach((eventConfig) => {
    let event;
    if (eventConfig.type === 'beforeinput') {
      event = new InputEvent(eventConfig.type, {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: eventConfig.data,
      });
    } else if (eventConfig.type === 'input') {
      event = new InputEvent(eventConfig.type, { bubbles: true });
    } else {
      event = new Event(eventConfig.type, { bubbles: true });
    }
    inputField.dispatchEvent(event);
  });
}

function pasteToChat(text, target) {
  // 셀렉터 결정
  const selector = SELECTORS[target] || SELECTORS.fallback;

  const inputField = document.querySelector(selector);
  if (!inputField) {
    console.error(
      `Chat input field not found for ${target}. Selector: ${selector}`,
    );
    return;
  }

  // 공통 텍스트 입력 시뮬레이션 사용
  simulateTextInput(inputField, text);

  console.log(`Successfully pasted text to ${target} chat input`);
}

// Background script에서 온 메시지 리스너
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  try {
    if (message.action === 'pasteToChat') {
      pasteToChat(message.text, message.target);
      sendResponse({ success: true, message: 'Text pasted successfully' });
    } else if (message.action === 'ping') {
      sendResponse({ pong: true, timestamp: Date.now() });
    } else {
      sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Content script error:', error);
    sendResponse({ success: false, error: error.message });
  }
  return true; // 비동기 응답을 위해 true 반환
});

console.log('Content script loaded for Web Chat Paste');
