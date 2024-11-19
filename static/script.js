// Layer data arrays
const layers = {
  0: {
    left: [
      ['ESC', '1', '2', '3', '4', '5'],
      ['TAB', 'Q', 'W', 'E', 'R', 'T'],
      ['CTRL', 'A', 'S', 'D', 'F', 'G'],
      ['SHFT', 'Z', 'X', 'C', 'V', 'B'],
      ['ALT', 'GUI', 'MO1', 'SPACE'],
    ],
    right: [
      ['6', '7', '8', '9', '0', '`'],
      ['Y', 'U', 'I', 'O', 'P', '-'],
      ['H', 'J', 'K', 'L', ';', "'"],
      ['N', 'M', ',', '.', '/', 'SHFT'],
      ['RET', 'MO2', 'BSPC', 'GUI'],
    ],
  },
  1: {
    left: [
      ['ESC', '!', '@', '#', '$', '%'], // Shifted number keys
      ['TAB', 'Q', 'W', 'E', 'R', 'T'], // No change
      ['CTRL', 'A', 'S', 'D', 'F', 'G'], // No change
      ['SHFT', 'Z', 'X', 'C', 'V', 'B'], // No change
      ['ALT', 'GUI', 'MO1', 'SPACE'], // No change
    ],
    right: [
      ['^', '&', '*', '(', ')', '~'], // Shifted number and symbol keys
      ['Y', 'U', 'I', 'O', 'P', '_'], // Punctuation changes
      ['H', 'J', 'K', 'L', ':', '"'], // Punctuation changes
      ['N', 'M', '<', '>', '?', 'SHFT'], // Punctuation changes
      ['RET', 'MO2', 'BSPC', 'GUI'], // No change
    ],
  },
  2: {
    left: [
      ['BTCLR', 'BT0', 'BT1', 'BT2', 'BT3', 'BT4'],
      ['F1', 'F2', '↑', 'F4', 'F5', 'F6'],
      ['`', '←', '↓', '→', '$', '%'],
      ['', '', '', '', '', ''],
      ['ALT', 'GUI', 'MO1', 'SPACE'],
    ],
    right: [
      ['', '', '', '', '', ''],
      ['(', ')', '[', ']', '{', '}'],
      ['*', '/', '+', '-', '=', '\\'],
      ['', '-', '+', '', '', '|'],
      ['RET', 'MO2', 'BSPC', 'GUI'],
    ],
  },
  3: {
    left: [
      ['', '', '', '', '', ''],
      ['`', '1', '2', '3', '4', '5'],
      ['F1', 'F2', 'F3', 'F4', 'F5', 'F6'],
      ['F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
      ['ALT', 'GUI', 'MO1', 'SPACE'],
    ],
    right: [
      ['', '', '', '', '', ''],
      ['6', '7', '8', '9', '0', ''],
      ['', '←', '↓', '↑', '→', ''],
      ['+', '-', '=', '[', ']', '\\'],
      ['RET', 'MO2', 'BSPC', 'GUI'],
    ],
  },
};

// Function to generate HTML for the given layer
function generateHtmlFromLayer(layerData) {
  return layerData
    .map(
      (row) =>
        `<div class="row">` +
        row
          .map((key) => `<div class="key">${key || ''}</div>`)
          .join('') +
        `</div>`
    )
    .join('');
}

// Function to update the keyboard layout
function updateKeyboardLayout(layer) {
  document.getElementById('left-side').innerHTML =
    generateHtmlFromLayer(layers[layer].left);
  document.getElementById('right-side').innerHTML =
    generateHtmlFromLayer(layers[layer].right);
}

// Function to update the keyboard layout
function updateKeyboardLayout(layer) {
  document.getElementById('left-side').innerHTML =
    generateHtmlFromLayer(layers[layer].left);
  document.getElementById('right-side').innerHTML =
    generateHtmlFromLayer(layers[layer].right);
}

// Initialize with the default layer (0)
let currentLayer = 0;
updateKeyboardLayout(currentLayer);

function toggleLayer1() {
  if (currentLayer === 2) {
    currentLayer = 0; // Go back to Layer 0 (default)
  } else {
    currentLayer = 2; // Switch to Layer 2
  }
  updateKeyboardLayout(currentLayer);
}

function toggleLayer2() {
  if (currentLayer === 3) {
    currentLayer = 0; // Go back to Layer 0 (default)
  } else {
    currentLayer = 3; // Switch to Layer 2
  }
  updateKeyboardLayout(currentLayer);
}

// Function to toggle Shift (Layer 1)
function toggleShift() {
  if (currentLayer === 1) {
    currentLayer = 0; // Go back to Layer 0 (default)
  } else {
    currentLayer = 1; // Switch to Layer 1
  }
  updateKeyboardLayout(currentLayer);
}

// WebSocket connection
const socket = new WebSocket('ws://localhost:8080/ws');

socket.onopen = function () {
  console.log('WebSocket connection established.');

  const message = {
    event: 'connect', 
    source: 'frontend',  
  };

  // Send the message to the server
  socket.send(JSON.stringify(message));
};

socket.onmessage = function (event) {
  console.log('Received message: ', event.data);

  // Parse the incoming WebSocket message
  const data = JSON.parse(event.data);

  if (data.event === 'KeyPress') {
    let key = data.key.replace('Key', ''); // Removes 'Key' from key name (e.g., 'AKey' becomes 'A')
    switch (key) {
      case 'Up':
        key = '↑';
        break;
      case 'Left':
        key = '←';
        break;
      case 'Down':
        key = '↓';
        break;
      case 'Right':
        key = '→';
        break;
      case 'Space':
        key = 'SPACE';
        break;
      case 'Enter':
        key = "RET";
        break;
      case 'Backspace':
        key = "BSPC";
        break;
      case 'LControl':
        key = "CTRL";
        break;
      case 'LShift':
        key = "SHFT";
        break
      case 'LAlt':
        key = "ALT";
        break;
      case 'Tab':
        key = "TAB";
        break;
      case 'Escape':
        key = "ESC";
        break;
      case 'LSuper':
        key = "GUI";
        break;
      case 'Backquote':
        console.log(data.shift);
        if (data.shift) {
          key = "~";
        }
        else {
          key = "`";
        }
        break;
      case 'Quote':
        key = "'";
        break;
      case 'Numrow9':
        if (data.shift) {
          key = "(";
        }
        else {
          key = "9";
        }
      case 'Numrow0':
        if (data.shift) {
          key = ")";
        }
        else {
          key = "0";
        }
        break;
      break;
      default:
        break;
    }
      
    highlightKey(key); // Highlight the pressed key
  }

  // Check for F24Key to toggle Layer 2
  if (data.event === 'KeyPress' && data.key === 'F24Key') {
    toggleLayer2(); // Toggle Layer 2 (MO1)
  }
  if (data.event === 'KeyPress' && data.key === 'F23Key') {
    toggleLayer1(); // Toggle Layer 2 (MO1)
  }
  // Check for LShiftKey to toggle Shift (Layer 1)
  if (data.event === 'ShiftPressed') {
    toggleShift(); // Toggle Shift (Layer 1)
  }
  if (data.event === 'ShiftReleased') {
    toggleShift(); // Toggle Shift (Layer 1)
  }
};

socket.onerror = function (error) {
  console.error('WebSocket error: ', error);
};

socket.onclose = function () {
  console.log('WebSocket connection closed.');
};

// Handle toggling Layer 1
document
  .getElementById('toggle-layer-1')
  .addEventListener('click', () => {
    toggleLayer1();
  });

// Handle toggling Layer 2
document
  .getElementById('toggle-layer-2')
  .addEventListener('click', () => {
    toggleLayer2(); // Toggle Layer 2 (MO1)
  });

// Handle toggling Shift layer
document
  .getElementById('toggle-shift')
  .addEventListener('click', () => {
    toggleShift();
  });

function highlightKey(key) {
  // Select all elements with the class 'key'
  const keyElements = document.querySelectorAll('.key');

  // Loop through the key elements and find the one that matches the key string
  keyElements.forEach((keyElement) => {
    if (keyElement.innerText === key) {
      // Add the highlight class to the key element
      keyElement.classList.add('highlight-temporary');

      // Remove the highlight after the animation (500ms)
      setTimeout(() => {
        keyElement.classList.remove('highlight-temporary');
      }, 500);
    }
  });
}
