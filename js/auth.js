// 1) Вставь сюда значения из Supabase Project Settings → API
const SUPABASE_URL = "https://wzzhcqqtlufdsgegfemu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Q3EYYshP5JiOsIOtilSkgw_wx88sxVm";

// 2) Создаём клиент
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 3) Элементы UI
const emailEl = document.getElementById("auth-email");
const passEl = document.getElementById("auth-password");

const btnSignup = document.getElementById("btn-signup");
const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");

const statusEl = document.getElementById("auth-status");

function setStatus(text) {
  statusEl.textContent = text;
}

function setLoggedInUI(isLoggedIn, userEmail) {
  btnLogout.style.display = isLoggedIn ? "inline-block" : "none";
  btnLogin.style.display = isLoggedIn ? "none" : "inline-block";
  btnSignup.style.display = isLoggedIn ? "none" : "inline-block";

  if (isLoggedIn) {
    setStatus(`Вы вошли: ${userEmail}`);
  } else {
    setStatus("Вы не авторизованы");
  }
}

// 4) Регистрация
btnSignup.addEventListener("click", async () => {
  const email = emailEl.value.trim();
  const password = passEl.value;

  setStatus("Регистрация...");

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) {
    setStatus("Ошибка регистрации: " + error.message);
    return;
  }

  // Если включено подтверждение email — пользователь появится, но сессии может не быть до подтверждения
  setStatus("Готово. Проверь почту (если включено подтверждение).");
});

// 5) Вход
btnLogin.addEventListener("click", async () => {
  const email = emailEl.value.trim();
  const password = passEl.value;

  setStatus("Вход...");

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    setStatus("Ошибка входа: " + error.message);
    return;
  }

  setLoggedInUI(true, data.user.email);
});

// 6) Выход
btnLogout.addEventListener("click", async () => {
  setStatus("Выход...");

  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    setStatus("Ошибка выхода: " + error.message);
    return;
  }

  setLoggedInUI(false);
});

// 7) Проверка текущей сессии при открытии страницы
(async () => {
  const { data } = await supabaseClient.auth.getSession();
  const session = data.session;

  if (session?.user) {
    setLoggedInUI(true, session.user.email);
  } else {
    setLoggedInUI(false);
  }
})();

// 8) Подписка на изменения авторизации (логин/логаут/обновление токена)
supabaseClient.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    setLoggedInUI(true, session.user.email);
  } else {
    setLoggedInUI(false);
  }
});