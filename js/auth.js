const SUPABASE_URL = "https://wzzhcqqtlufdsgegfemu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Q3EYYshP5JiOsIOtilSkgw_wx88sxVm";

window.supabaseDb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseDb = window.supabaseDb;

// ========== ТОСТ-УВЕДОМЛЕНИЯ ==========
function showToast(message, type = 'success', duration = 3000) {
  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toast-text');
  if (!toast || !toastText) return;

  // Иконка в зависимости от типа
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    logout: '👋'
  };

  toast.querySelector('.toast-icon').textContent = icons[type] || '✅';
  toastText.textContent = message;

  // Убираем все типы, ставим нужный
  toast.className = 'toast toast-' + type;
  toast.removeAttribute('hidden');

  // Показываем
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Прячем через N секунд
  clearTimeout(toast._hideTimeout);
  toast._hideTimeout = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.setAttribute('hidden', ''), 400);
  }, duration);
}

// ========== ПРИВЕТСТВЕННЫЙ ЭКРАН ==========
function showWelcome(email) {
  // Создаём оверлей
  const overlay = document.createElement('div');
  overlay.className = 'welcome-overlay';
  overlay.innerHTML = `
    <div class="welcome-card">
      <div class="welcome-emoji">🎉</div>
      <h2>Добро пожаловать!</h2>
      <p>${email}</p>
    </div>
  `;
  document.body.appendChild(overlay);

  requestAnimationFrame(() => overlay.classList.add('active'));

  // Закрытие по клику или автоматически через 2 сек
  const close = () => {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 300);
  };

  overlay.addEventListener('click', close);
  setTimeout(close, 2500);
}

// ========== UI АВТОРИЗАЦИИ ==========
const authStatusEl = document.getElementById('auth-status');

function setAuthStatus(text) {
  if (authStatusEl) authStatusEl.textContent = text;
}

function setLoggedInUI(isLoggedIn, userEmail) {
  const guestControls = document.getElementById('guest-controls');
  const userControls  = document.getElementById('user-controls');
  const emailDisplay  = document.getElementById('user-email-display');
  const avatarEl      = document.getElementById('user-avatar');

  if (guestControls) guestControls.style.display = isLoggedIn ? 'none' : 'flex';
  if (userControls)  userControls.style.display  = isLoggedIn ? 'flex' : 'none';

  if (isLoggedIn && userEmail) {
    // Показываем email или первую букву в аватаре
    if (emailDisplay) emailDisplay.textContent = userEmail;
    if (avatarEl) {
      const firstLetter = userEmail.charAt(0).toUpperCase();
      avatarEl.textContent = firstLetter;
    }
    setAuthStatus('Вы вошли: ' + userEmail);
  } else {
    setAuthStatus('');
  }
}

// ========== ОБРАБОТКА ИЗМЕНЕНИЙ АВТОРИЗАЦИИ ==========
let previousSession = null; // Чтобы отличить «вход» от «уже был залогинен»

function handleAuthChange(session, isInitial = false) {
  if (session && session.user) {
    const email = session.user.email;
    setLoggedInUI(true, email);

    // Если это НЕ начальная загрузка — значит пользователь только что вошёл
    if (!isInitial && !previousSession) {
      showToast(`Вы вошли как ${email}`, 'success');
      showWelcome(email);
    }

    previousSession = session;

    if (typeof window.onUserSignedIn === 'function') {
      window.onUserSignedIn(session.user);
    }
  } else {
    // Если был залогинен и вышел — показываем тост
    if (previousSession) {
      showToast('Вы вышли из аккаунта', 'logout');
    }

    previousSession = null;
    setLoggedInUI(false);

    if (typeof window.onUserSignedOut === 'function') {
      window.onUserSignedOut();
    }
  }
}

// ========== ВЫХОД ==========
document.getElementById('btn-logout')?.addEventListener('click', async () => {
  setAuthStatus('Выход...');
  const { error } = await supabaseDb.auth.signOut();
  if (error) {
    showToast('Ошибка выхода: ' + error.message, 'error');
  }
});

// ========== ИНИЦИАЛИЗАЦИЯ ==========
(async () => {
  const { data } = await supabaseDb.auth.getSession();
  handleAuthChange(data.session, true); // true = начальная загрузка
})();

supabaseDb.auth.onAuthStateChange((_event, session) => {
  handleAuthChange(session, false);
});

// ========== МОДАЛКИ И ФОРМЫ ==========
document.addEventListener('DOMContentLoaded', () => {
  const loginModal  = document.getElementById('login-modal');
  const signupModal = document.getElementById('signup-modal');
  const loginForm   = document.getElementById('login-form');
  const signupForm  = document.getElementById('signup-form');

  function openModal(modal) {
    modal.removeAttribute('hidden');
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => modal.classList.add('active'));
    });
  }

  function closeModal(modal) {
    modal.classList.remove('active');
    modal.addEventListener('transitionend', function handler() {
      modal.setAttribute('hidden', '');
      document.body.classList.remove('modal-open');
      modal.removeEventListener('transitionend', handler);
    });
  }

  // Открытие
  document.getElementById('open-login-modal')?.addEventListener('click', (e) => {
    e.preventDefault(); openModal(loginModal);
  });
  document.getElementById('open-signup-modal')?.addEventListener('click', (e) => {
    e.preventDefault(); openModal(signupModal);
  });

  // Закрытие
  document.getElementById('login-modal-close-btn')?.addEventListener('click', () => closeModal(loginModal));
  document.getElementById('signup-modal-close-btn')?.addEventListener('click', () => closeModal(signupModal));

  loginModal?.addEventListener('click', (e) => { if (e.target === loginModal) closeModal(loginModal); });
  signupModal?.addEventListener('click', (e) => { if (e.target === signupModal) closeModal(signupModal); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (loginModal?.classList.contains('active'))  closeModal(loginModal);
      if (signupModal?.classList.contains('active')) closeModal(signupModal);
    }
  });

  // Переключение
  document.getElementById('switch-to-signup')?.addEventListener('click', (e) => {
    e.preventDefault(); closeModal(loginModal); setTimeout(() => openModal(signupModal), 350);
  });
  document.getElementById('switch-to-login')?.addEventListener('click', (e) => {
    e.preventDefault(); closeModal(signupModal); setTimeout(() => openModal(loginModal), 350);
  });

  // ========== ФОРМА ВХОДА ==========
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    if (errorDiv) { errorDiv.textContent = ''; errorDiv.hidden = true; }

    // Показываем загрузку на кнопке
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Вход...';
    submitBtn.disabled = true;

    const { data, error } = await supabaseDb.auth.signInWithPassword({ email, password });

    submitBtn.textContent = originalText;
    submitBtn.disabled = false;

    if (error) {
      if (errorDiv) { errorDiv.textContent = error.message; errorDiv.hidden = false; }
      showToast('Ошибка входа: ' + error.message, 'error');
      return;
    }

    closeModal(loginModal);
    // Тост и приветствие покажутся из handleAuthChange
  });

  // ========== ФОРМА РЕГИСТРАЦИИ ==========
  signupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const errorDiv = document.getElementById('signup-error');
    const submitBtn = signupForm.querySelector('button[type="submit"]');

    if (errorDiv) { errorDiv.textContent = ''; errorDiv.hidden = true; }

    const originalText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Регистрация...';
    submitBtn.disabled = true;

    const { data, error } = await supabaseDb.auth.signUp({ email, password });

    submitBtn.textContent = originalText;
    submitBtn.disabled = false;

    if (error) {
      if (errorDiv) { errorDiv.textContent = error.message; errorDiv.hidden = false; }
      showToast('Ошибка: ' + error.message, 'error');
      return;
    }

    closeModal(signupModal);
    showToast('Проверьте почту для подтверждения!', 'info', 5000);
  });
});