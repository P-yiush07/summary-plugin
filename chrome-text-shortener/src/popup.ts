interface LoginResponse {
  accessToken: string;
}

interface ShortenResponse {
  shortenedText: string;
}

document.addEventListener('DOMContentLoaded', () => {
  const authForms = document.getElementById('authForms');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const content = document.getElementById('content');
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const showSignup = document.getElementById('showSignup');
  const showLogin = document.getElementById('showLogin');
  const loginEmail = document.getElementById('loginEmail') as HTMLInputElement;
  const loginPassword = document.getElementById('loginPassword') as HTMLInputElement;
  const signupEmail = document.getElementById('signupEmail') as HTMLInputElement;
  const signupPassword = document.getElementById('signupPassword') as HTMLInputElement;
  const selectedTextElement = document.getElementById('selectedText');
  const shortenedTextElement = document.getElementById('shortenedText');
  const shortenBtn = document.getElementById('shortenBtn') as HTMLButtonElement;
  const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
  const loadingElement = document.getElementById('loading');
  const logoutBtn = document.getElementById('logoutBtn');

  function showContent() {
    if (authForms && content) {
      authForms.style.display = 'none';
      content.style.display = 'block';
    }
  }

  function showAuthForms() {
    if (authForms && content) {
      authForms.style.display = 'flex';
      content.style.display = 'none';
      showLoginForm();
    }
  }

  function showLoginForm() {
    if (loginForm && signupForm) {
      loginForm.style.display = 'block';
      signupForm.style.display = 'none';
    }
  }

  function showSignupForm() {
    if (loginForm && signupForm) {
      loginForm.style.display = 'none';
      signupForm.style.display = 'block';
    }
  }

  function updateSelectedText() {
    chrome.storage.local.get(['selectedText', 'shortenedText'], (result) => {
      if (selectedTextElement && shortenedTextElement && shortenBtn && resetBtn) {
        if (result.shortenedText) {
          selectedTextElement.style.display = 'none';
          shortenedTextElement.textContent = result.shortenedText;
          shortenedTextElement.style.display = 'block';
          shortenBtn.style.display = 'none';
          resetBtn.style.display = 'block';
        } else if (result.selectedText) {
          selectedTextElement.textContent = result.selectedText;
          selectedTextElement.style.display = 'block';
          shortenedTextElement.style.display = 'none';
          shortenBtn.style.display = 'block';
          shortenBtn.disabled = false;
          resetBtn.style.display = 'none';
        } else {
          selectedTextElement.textContent = 'No text selected';
          selectedTextElement.style.display = 'block';
          shortenedTextElement.style.display = 'none';
          shortenBtn.style.display = 'block';
          shortenBtn.disabled = true;
          resetBtn.style.display = 'none';
        }
      }
    });
  }

  // Check for access token when popup opens
  chrome.storage.local.get(['accessToken'], (result) => {
    if (result.accessToken) {
      showContent();
      updateSelectedText();
    } else {
      showAuthForms();
    }
  });

  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      const email = loginEmail.value;
      const password = loginPassword.value;

      fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      .then(response => response.json())
      .then((data: LoginResponse) => {
        if (data.accessToken) {
          chrome.storage.local.set({ accessToken: data.accessToken }, () => {
            showContent();
            updateSelectedText();
          });
        } else {
          alert('Login failed');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Login failed');
      });
    });
  }

  if (signupBtn) {
    signupBtn.addEventListener('click', () => {
      const email = signupEmail.value;
      const password = signupPassword.value;

      fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      .then(response => {
        if (response.ok) {
          alert('Signup successful. Please log in.');
          showLoginForm();
        } else {
          alert('Signup failed');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Signup failed');
      });
    });
  }

  if (showSignup) {
    showSignup.addEventListener('click', showSignupForm);
  }

  if (showLogin) {
    showLogin.addEventListener('click', showLoginForm);
  }

  if (shortenBtn && resetBtn && loadingElement && shortenedTextElement && selectedTextElement) {
    shortenBtn.addEventListener('click', () => {
      console.log('Shorten button clicked');

      chrome.storage.local.get(['accessToken', 'selectedText'], (result) => {
        if (result.accessToken && result.selectedText) {
          loadingElement.style.display = 'block';
          shortenBtn.style.display = 'none';
          selectedTextElement.style.display = 'none';
          shortenedTextElement.style.display = 'none';

          fetch('http://localhost:3000/shorten', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${result.accessToken}`
            },
            body: JSON.stringify({ text: result.selectedText }),
          })
          .then(response => response.json())
          .then((data: ShortenResponse) => {
            shortenedTextElement.textContent = data.shortenedText;
            shortenedTextElement.style.display = 'block';
            resetBtn.style.display = 'block';
            chrome.storage.local.set({ shortenedText: data.shortenedText });
          })
          .catch(error => {
            console.error('Error:', error);
            alert('Failed to shorten text');
          })
          .finally(() => {
            loadingElement.style.display = 'none';
          });
        }
      });
    });

    resetBtn.addEventListener('click', () => {
      console.log('Reset button clicked');
      chrome.storage.local.remove(['shortenedText', 'selectedText'], () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          if (tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "clearSelection"});
          }
        });
        window.close();
      });
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      chrome.storage.local.remove(['accessToken', 'selectedText', 'shortenedText'], () => {
        console.log('User logged out');
        showAuthForms();
      });
    });
  }

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && (changes.selectedText || changes.shortenedText)) {
      updateSelectedText();
    }
  });
});

console.log('Popup script loaded');