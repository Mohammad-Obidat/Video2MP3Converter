const form = document.getElementById('converter-form');
const videoUrlInput = document.getElementById('video-url');
const message = document.getElementById('message');
const loading = document.getElementById('loading');

const removeMessage = () => {
  message.innerHTML = '';
};

const clearInput = () => {
  videoUrlInput.value = '';
};

const displayMessage = (msg, isError = false) => {
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

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success') {
        displayMessage('Conversion completed!');
      } else {
        displayMessage(`Conversion failed: ${data.error}`, true);
      }
    } else {
      displayMessage('Conversion failed. Please try again.', true);
    }
  } catch (error) {
    displayMessage(`Error: ${error.message}`, true);
  } finally {
    loading.style.display = 'none';
    clearInput();
  }
});
