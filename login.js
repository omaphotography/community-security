// ==========================
// SUPABASE LOGIN CONFIG
// ==========================

const SUPABASE_URL =
  "https://nnwfhnrpkdoqianaaemn.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_sKRS_umIWmrTQUSvftyYEA_Y7Sr6kvH"; // use same anon key as your project

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

// ==========================
// ELEMENTS
// ==========================

const emailInput =
  document.getElementById("email");

const passwordInput =
  document.getElementById("password");

const errorBox =
  document.getElementById("error");

const loginBtn =
  document.querySelector("button");

// ==========================
// AUTO REDIRECT IF LOGGED IN
// ==========================

(async function checkSession() {

  const { data } =
    await supabaseClient.auth.getSession();

  if (data.session) {

    window.location.href =
      "admin.html";

  }

})();

// ==========================
// LOGIN FUNCTION
// ==========================

async function login() {

  const email =
    emailInput.value.trim();

  const password =
    passwordInput.value.trim();

  if (!email || !password) {

    errorBox.textContent =
      "Please enter email and password";

    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent =
    "Logging in...";

  errorBox.textContent = "";

  try {

    const { data, error } =
      await supabaseClient.auth.signInWithPassword(
        {
          email,
          password
        }
      );

    if (error) {

      throw error;

    }

    // Save simple session flag (optional)
    localStorage.setItem(
      "admin_logged_in",
      "true"
    );

    // Redirect to admin dashboard
    window.location.href =
      "dashboard.html";

  } catch (error) {

    console.error(error);

    errorBox.textContent =
      error.message ||
      "Login failed";

  } finally {

    loginBtn.disabled = false;
    loginBtn.textContent =
      "Login";

  }

}

// ==========================
// ENTER KEY SUPPORT
// ==========================

document.addEventListener(
  "keydown",
  (e) => {

    if (e.key === "Enter") {

      login();

    }

  }
);