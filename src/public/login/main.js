document.getElementById("btn_login").addEventListener("click", btnLogin);
document.getElementById("btn_signup").addEventListener("click", btnSignup);

function btnLogin() {
  const email = document.getElementById("email_login").value;
  const password = document.getElementById("password_login").value;

  fetch("/api/auth/login", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: email, password: password }),
  })
    .then((response) => {
      return response.json();
    })
    .then((response) => {
      if (response.status === 200) {
        sessionStorage.setItem("user", response.token);
        setTimeout(() => {
          location.pathname = "/radar/";
        }, 3000);
        document.getElementById("login_error").innerHTML = "Success";
        document.getElementById("login_error").style.color = "white";
        document.getElementById("login_error").style.display = "block";
      } else {
        if (response.status === "fail") {
          document.getElementById("login_error").innerHTML = response.message;
          document.getElementById("login_error").style.display = "block";
        }
        if (response.status === 400) {
          const errors = [];
          response.errors.forEach((element) => {
            errors.push(element.msg);
          });
          console.log(errors.join("<br>"));
          document.getElementById("login_error").innerHTML =
            errors.join("<br>");
          document.getElementById("login_error").style.display = "block";
        }
      }
    });
}

function btnSignup() {
  const name = document.getElementById("email_signup").value;
  const email = document.getElementById("email_signup").value;
  const password = document.getElementById("password_signup").value;
  const passwordConfirm = document.getElementById(
    "passwordConfirm_signup"
  ).value;

  fetch("/api/auth/signup", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: name,
      email: email,
      password: password,
      passwordConfirm: passwordConfirm,
    }),
  })
    .then((response) => {
      return response.json();
    })
    .then((response) => {
      if (response.status === 201) {
        setTimeout(() => {
          location.pathname = "/login/";
        }, 3000);
        document.getElementById("signup_error").innerHTML = "Success";
        document.getElementById("signup_error").style.color = "white";
        document.getElementById("signup_error").style.display = "block";
      } else {
        if (response.status === "fail") {
          document.getElementById("signup_error").innerHTML = response.message;
          document.getElementById("signup_error").style.display = "block";
        }
        if (response.status === 400) {
          const errors = [];
          response.errors.forEach((element) => {
            errors.push(element.msg);
          });
          console.log(errors.join("<br>"));
          document.getElementById("signup_error").innerHTML =
            errors.join("<br>");
          document.getElementById("signup_error").style.display = "block";
        }
      }
    });
}
