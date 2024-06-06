const form = document.getElementById('converter-form');
const videoUrlInput = document.getElementById('video-url');
const bottomContainer = document.getElementById('bottom-container');
const message = document.getElementById('message');
const loading = document.getElementById('loading');

const removeMessage = () => {
  message.innerHTML = '';
  bottomContainer.style.display = 'none';
};

const clearInput = () => {
  videoUrlInput.value = '';
};

const displayMessage = (msg, isError = true) => {
  bottomContainer.style.display = 'flex';
  message.textContent = msg;
  message.classList.toggle('error', isError);
  message.classList.toggle('success', !isError);
  setTimeout(removeMessage, 3000);
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  loading.style.display = 'block';

  try {
    const url = form.getAttribute('action');
    const videoURL = videoUrlInput.value;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoURL }),
    });

    const _data = await response.json();
    if (response.ok && _data.status === 'success')
      displayMessage(`completed successfully!`, false);
    else {
      switch (_data.error) {
        case 'Invalid link':
          displayMessage('Invalid link. Please enter a valid URL.');
          break;
        case 'Video is not available for download':
          displayMessage('Video is not available for download.');
          break;
        case 'Video does not contain audio streams':
          displayMessage('Video does not contain audio streams');
          break;
        default:
          displayMessage(`Failed: ${_data.error}`);
          break;
      }
    }
  } catch (error) {
    displayMessage(`Error: ${error.message}`);
  } finally {
    loading.style.display = 'none';
    clearInput();
  }
});
