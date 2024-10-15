// Load user's GitHub repositories
async function loadGithubUserData(username) {
  // Clear the page
  document.getElementById('github-repos').innerHTML = '';


  try {
    var response = await fetch(`https://api.github.com/users/${username}/repos`);
    const json = await response.json();

    // Load the title and image
    response = await fetch(`https://api.github.com/user/${json[0].owner.id}`);
    var data = await response.json();
    const userName = data.name != null ? data.name : username;
    document.getElementById('github-username').innerHTML = userName;
    document.getElementById('github-user-url').href = `https://github.com/${username}`;
    document.getElementById('github-user-profile-picture').src = `https://avatars3.githubusercontent.com/u/${json[0].owner.id}`;
    document.title = userName;

    // Load the bio
    response = await fetch(`https://api.github.com/users/${username}`);
    data = await response.json();
    const userBio = data.bio != null ? data.bio : '';
    document.getElementById('github-user-bio').innerHTML = `"${userBio}"`;

    // Load the colors
    response = await fetch('https://raw.githubusercontent.com/ozh/github-colors/master/colors.json');
    const colors = await response.json();

    // Load the page
    json.forEach(element => {
      const { name, fork, description, language, htmlUrl, homepage } = element;
      const forked = fork ? `<span>(<b>Forked</b>)</span>` : "";
      const lang = language ? `<b style="color: ${colors[language].color};">•</b> ${language}` : "";
      const desc = description != null ? description : "";

      document.getElementById('github-repos').innerHTML += `
      <div class="github-repo">
        <a href="${htmlUrl}" target = "_blank" id="js-${name}" class="repo-detail">
          <span class="repo-name">${name.replace(/-/g, " ").replace(/   /g, " - ")} ${forked}</span>
        </a>
        <span class="repo-detail">${desc}</span>
        <span class="repo-detail">${lang}</span>
        </div>
        `;
      if (homepage && name != username) { document.getElementById(`js-${name}`).href = homepage };
    })
    // Changing the favicon
    let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = `https://avatars3.githubusercontent.com/u/${json[0].owner.id}`;
    document.getElementsByTagName('head')[0].appendChild(link);
  } catch (err) {
    document.getElementById('github-user-profile-picture').src = "./src/img/octocat.png";
    document.getElementById('github-username').innerHTML = username;
    document.getElementById('github-repos').innerHTML = 'This user seems not to have any public repository (yet).';
    document.getElementById('github-repos').style.textAlign = 'center'
    document.getElementById('github-user-bio').innerHTML = "";
    document.title = username;
    console.log(err);
  }
  document.getElementById('github-user-profile-picture').alt = `${username}'s profile picture`;
  document.getElementById('github-username-url').href = `https://github.com/${username}`;
}

// Wait for the DOM to be loaded before loading the user's profile
window.addEventListener("DOMContentLoaded", () => {
  loadGithubUserData('Vianpyro');
});

async function secretCommandLoadUsername(newUsername) {
  loadGithubUserData(newUsername);
}
