// Load user's GitHub repositories
async function load_user_github_repos(username) {
  const response = await fetch(`https://api.github.com/users/${username}/repos`);
  const json = await response.json();

  json.forEach(element => {
    const { name, fork, description, language, html_url, homepage } = element;
    const forked = fork ? `<span class="repo_detail">(<b>Forked</b>)</span>` : "";
    const lang = language != null ? language : "";
    const desc = description != null ? description : "";

    document.getElementById('github_repos').innerHTML += `
    <div class="github_repo">
      <a href="${html_url}" target = "_blank" id="js-${name}" class="repo_detail">
        <span class="repo_name">${name.replace(/-/g, " ").replace(/   /g, " - ")} ${forked}</span>
      </a>
      <span class="repo_detail">${desc}</span>
      <span class="repo_detail"><b style="color: ${colors[lang]};">•</b> ${lang}</span>
    </div>
    `;
    if (homepage && name != username) { document.getElementById(`js-${name}`).href = homepage }
  })

  // Changing the favicon
  let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
  link.type = 'image/x-icon';
  link.rel = 'shortcut icon';
  link.href = `https://avatars3.githubusercontent.com/u/${json[0].owner.id}`;
  document.getElementsByTagName('head')[0].appendChild(link);
}

// Wait for the DOM to be loaded before loading the user's profile
window.addEventListener("DOMContentLoaded", () => {
  load_user_github_repos('Vianpyro');
});

const colors = {
  "Batchfile": "#c1f12e",
  "HTML": "#e44b23",
  "Java": "#b07219",
  "JavaScript": "#f1e05a",
  "Python": "#3572a5"
}
