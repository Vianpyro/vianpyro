// Load user's GitHub repositories
async function load_user_github_data(username) {
  // Clear the page
  document.getElementById('github_repos').innerHTML = ''
  
  
  try {
    var response = await fetch(`https://api.github.com/users/${username}/repos`);
    const json = await response.json();
        
    // Fill the user name title and image
    response = await fetch(`https://api.github.com/user/${json[0].owner.id}`);
    const data = await response.json();
    const user_name = data.name != null ? data.name : username;
    document.getElementById('github_username').innerHTML = user_name
    document.getElementById('github_user_url').href = `https://github.com/${username}`
    document.getElementById('github_user_profile_picture').src = `https://avatars3.githubusercontent.com/u/${json[0].owner.id}`
    document.title = user_name

    // Load the colors
    response = await fetch('https://raw.githubusercontent.com/ozh/github-colors/master/colors.json');
    const colors = await response.json();

    // Load the page
    json.forEach(element => {
      const { name, fork, description, language, html_url, homepage } = element;
      const forked = fork ? `<span>(<b>Forked</b>)</span>` : "";
      const lang = language ? `<b style="color: ${colors[language].color};">•</b> ${language}` : "";
      const desc = description != null ? description : "";
  
      document.getElementById('github_repos').innerHTML += `
      <div class="github_repo">
        <a href="${html_url}" target = "_blank" id="js-${name}" class="repo_detail">
          <span class="repo_name">${name.replace(/-/g, " ").replace(/   /g, " - ")} ${forked}</span>
        </a>
        <span class="repo_detail">${desc}</span>
        <a href="${colors[language].url}" target="_blank" >
          <span class="repo_detail">${lang}</span>
        </a>
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
  } catch {
    document.getElementById('github_username').innerHTML = username
    document.getElementById('github_repos').innerHTML = 'This user seems not to have any public repository (yet).'
    document.title = username
  }
  
}

// Wait for the DOM to be loaded before loading the user's profile
window.addEventListener("DOMContentLoaded", () => {
  load_user_github_data('Vianpyro');
});

async function secret_command_load_username(new_username) {
  load_user_github_data(new_username);
}
