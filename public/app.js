let token = null;

async function getToken() {
  const res = await fetch("/token");
  const data = await res.json();
  token = data.token;
}

async function loadCount() {
  const res = await fetch("/count");
  const data = await res.json();
  document.getElementById("count").innerText = data.count;
}

async function sign() {
  const name = document.getElementById("name").value.trim();
  const studentClass = document.getElementById("class").value.trim();

  if (!name || !studentClass) {
    alert("Uzupełnij pola");
    return;
  }

  if (!token) {
    await getToken();
  }

  const res = await fetch("/sign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name,
      studentClass,
      token
    })
  });

  if (res.status === 403) {
    alert("Już podpisałeś lub błąd");
    return;
  }

  if (res.status === 429) {
    alert("Za szybko");
    return;
  }

  document.getElementById("name").value = "";
  document.getElementById("class").value = "";

  await loadCount();
  await getToken();
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadCount();
  await getToken();
});
