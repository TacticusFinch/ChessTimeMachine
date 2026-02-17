const SUPABASE_URL = "https://wzzhcqqtlufdsgegfemu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Q3EYYshP5JiOsIOtilSkgw_wx88sxVm";

// 2) Создаём клиент И ДЕЛАЕМ ЕГО ГЛОБАЛЬНЫМ
//    Именно window.supabaseDb — чтобы app.js мог обращаться к той же переменной
window.supabaseDb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Для удобства внутри этого файла — короткая ссылка
const supabaseDb = window.supabaseDb;

// 3) Элементы UI авторизации
const authEmailEl    = document.getElementById("auth-email");
const authPassEl     = document.getElementById("auth-password");
const btnSignup      = document.getElementById("btn-signup");
const btnLogin       = document.getElementById("btn-login");
const btnLogout      = document.getElementById("btn-logout");
const authStatusEl   = document.getElementById("auth-status");

function setAuthStatus(text) {
  if (authStatusEl) authStatusEl.textContent = text;
}

function setLoggedInUI(isLoggedIn, userEmail) {
  if (btnLogout) btnLogout.style.display = isLoggedIn ? "inline-block" : "none";
  if (btnLogin)  btnLogin.style.display  = isLoggedIn ? "none" : "inline-block";
  if (btnSignup) btnSignup.style.display = isLoggedIn ? "none" : "inline-block";

  if (isLoggedIn) {
    setAuthStatus("Вы вошли: " + userEmail);
  } else {
    setAuthStatus("Вы не авторизованы");
  }
}

// 4) ЭТА ФУНКЦИЯ ВЫЗЫВАЕТСЯ ПРИ КАЖДОМ ИЗМЕНЕНИИ СЕССИИ
//    Она "соединяет" auth.js с app.js
function handleAuthChange(session) {
  if (session && session.user) {
    // Пользователь залогинен
    setLoggedInUI(true, session.user.email);

    // Вызываем функцию из app.js, если она существует
    // Она загрузит прогресс и восстановит состояние
    if (typeof window.onUserSignedIn === 'function') {
      window.onUserSignedIn(session.user);
    }
  } else {
    // Пользователь вышел
    setLoggedInUI(false);

    // Вызываем функцию из app.js, если она существует
    if (typeof window.onUserSignedOut === 'function') {
      window.onUserSignedOut();
    }
  }
}



// 7) Выход
if (btnLogout) {
  btnLogout.addEventListener("click", async () => {
    setAuthStatus("Выход...");

    const { error } = await supabaseDb.auth.signOut();
    if (error) {
      setAuthStatus("Ошибка выхода: " + error.message);
      return;
    }

    // handleAuthChange вызовется автоматически через onAuthStateChange ниже
  });
}

// 8) Проверка сессии при открытии страницы
(async () => {
  const { data } = await supabaseDb.auth.getSession();
  handleAuthChange(data.session);
})();

// 9) Подписка: при любом изменении авторизации — обновляем UI и app.js
supabaseDb.auth.onAuthStateChange((_event, session) => {
  handleAuthChange(session);
});

document.addEventListener('DOMContentLoaded', () => {
  // -------- Элементы модалок --------
  const loginModal    = document.getElementById('login-modal');
  const signupModal   = document.getElementById('signup-modal');
  const openLoginBtn  = document.getElementById('open-login-modal');
  const openSignupBtn = document.getElementById('open-signup-modal');
  const closeLoginBtn = document.getElementById('login-modal-close-btn');
  const closeSignupBtn = document.getElementById('signup-modal-close-btn');
  const switchToSignup = document.getElementById('switch-to-signup');
  const switchToLogin  = document.getElementById('switch-to-login');

  // -------- Элементы форм --------
  const loginForm  = document.getElementById('login-form');const signupForm = document.getElementById('signup-form');

  // -------- Утилиты открытия/закрытия --------
  function openModal(modal) {
    modal.removeAttribute('hidden');
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        modal.classList.add('active');
      });
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

  // -------- Открытие --------
  openLoginBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(loginModal);
  });

  openSignupBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(signupModal);
  });

  // -------- Закрытие по кнопке ✕ --------
  closeLoginBtn?.addEventListener('click', () => closeModal(loginModal));
  closeSignupBtn?.addEventListener('click', () => closeModal(signupModal));

  // -------- Закрытие по клику на оверлей --------
  loginModal?.addEventListener('click', (e) => {
    if (e.target === loginModal) closeModal(loginModal);
  });

  signupModal?.addEventListener('click', (e) => {
    if (e.target === signupModal) closeModal(signupModal);
  });

  // -------- Закрытие по Escape --------
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (loginModal?.classList.contains('active'))  closeModal(loginModal);
      if (signupModal?.classList.contains('active')) closeModal(signupModal);
    }
  });

  // -------- Переключение между формами --------
  switchToSignup?.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal(loginModal);
    setTimeout(() => openModal(signupModal), 350);
  });

  switchToLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal(signupModal);
    setTimeout(() => openModal(loginModal), 350);
  });

  // ========================================================
  //  ФОРМА ВХОДА — отправка в Supabase
  // ========================================================
 // ✅ ИСПРАВЛЕНО:
loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email    = document.getElementById('login-email').value.trim();    // ← login-email
    const password = document.getElementById('login-password').value;        // ← login-password
    const errorDiv = document.getElementById('login-error');

    if (errorDiv) { errorDiv.textContent = ''; errorDiv.hidden = true; }

    setAuthStatus('Вход...');

    const { data, error } = await supabaseDb.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        if (errorDiv) {
            errorDiv.textContent = error.message;
            errorDiv.hidden = false;
        }
        setAuthStatus('Ошибка входа: ' + error.message);
        return;
    }

    closeModal(loginModal);
});


  // ========================================================
  //  ФОРМА РЕГИСТРАЦИИ — отправка в Supabase
  // ========================================================
  signupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email    = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const errorDiv = document.getElementById('signup-error');

    if (errorDiv) { errorDiv.textContent = ''; errorDiv.hidden = true; }

    setAuthStatus('Регистрация...');

    const { data, error } = await supabaseDb.auth.signUp({
      email,
      password
    });

    if (error) {
      if (errorDiv) {
        errorDiv.textContent = error.message;
        errorDiv.hidden = false;
      }
      setAuthStatus('Ошибка регистрации: ' + error.message);
      return;
    }

    // Успех
    closeModal(signupModal);setAuthStatus('Готово! Проверь почту (если включено подтверждение).');
  });
});


