/**
 * RouteSaver — Auth Page Logic (Login & Register)
 */
(function () {
  'use strict';

  // If already logged in, redirect to dashboard
  if (localStorage.getItem('rs_token')) {
    window.location.href = '/dashboard';
    return;
  }

  function showError(msg) {
    const el = document.getElementById('errorMsg');
    el.textContent = msg;
    el.hidden = false;
  }

  function hideError() {
    const el = document.getElementById('errorMsg');
    el.hidden = true;
  }

  function setLoading(btn, loading) {
    if (loading) {
      btn.dataset.originalText = btn.textContent;
      btn.innerHTML = '<span class="spinner"></span>';
      btn.disabled = true;
    } else {
      btn.textContent = btn.dataset.originalText;
      btn.disabled = false;
    }
  }

  // ---- Login ----
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      if (!email || !password) {
        return showError('Preencha todos os campos.');
      }

      setLoading(submitBtn, true);

      try {
        await API.login(email, password);
        window.location.href = '/dashboard';
      } catch (err) {
        showError(err.message);
      } finally {
        setLoading(submitBtn, false);
      }
    });
  }

  // ---- Register ----
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError();

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const submitBtn = registerForm.querySelector('button[type="submit"]');

      if (!name || !email || !password || !confirmPassword) {
        return showError('Preencha todos os campos.');
      }

      if (password !== confirmPassword) {
        return showError('As senhas não conferem.');
      }

      if (password.length < 6) {
        return showError('A senha deve ter no mínimo 6 caracteres.');
      }

      setLoading(submitBtn, true);

      try {
        await API.register(name, email, password);
        window.location.href = '/dashboard';
      } catch (err) {
        showError(err.message);
      } finally {
        setLoading(submitBtn, false);
      }
    });
  }
})();
