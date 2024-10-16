const portfolioUsername = "Vianpyro";

const githubRepositories = document.getElementById('github-repos');
const githubUsername = document.getElementById('github-username');
const githubUserUrl = document.getElementById('github-user-url');
const githubUserProfilePicture = document.getElementById('github-user-profile-picture');
const githubUserBio = document.getElementById('github-user-bio');

// Load user's GitHub repositories
async function loadGithubUserData(username) {
    // Clear the page
    githubRepositories.innerHTML = '';

    try {
        var response = await fetch(`https://api.github.com/users/${username}/repos`);
        const json = await response.json();

        // Load the title and image
        response = await fetch(`https://api.github.com/user/${json[0].owner.id}`);
        var data = await response.json();
        const userName = data.name != null ? data.name : username;
        githubUsername.innerText = userName;
        githubUsername.href = `https://github.com/${username}`;
        githubUserProfilePicture.src = `https://avatars3.githubusercontent.com/u/${json[0].owner.id}`;
        document.title = userName;

        // Load the bio
        response = await fetch(`https://api.github.com/users/${username}`);
        data = await response.json();
        const userBio = data.bio != null ? data.bio : '';
        githubUserBio.innerText = `"${userBio}"`;

        // Load the colors
        response = await fetch('https://raw.githubusercontent.com/ozh/github-colors/master/colors.json');
        const colors = await response.json();

        // Load the page
        json.forEach(element => {
            const { name, fork, description, language, htmlUrl, homepage } = element;
            const forked = fork ? `<span>(<b>Forked</b>)</span>` : "";
            const lang = language ? `<b style="color: ${colors[language].color};">•</b> ${language}` : "";
            const desc = description != null ? description : "";

            githubRepositories.innerHTML += `
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
        githubUserProfilePicture.src = "./src/img/octocat.png";
        githubUsername.innerText = username;
        githubRepositories.innerText = 'This user seems not to have any public repository (yet).';
        githubRepositories.style.textAlign = 'center'
        githubUserBio.innerHTML = "";
        document.title = username;
        console.log(err);
    }
    githubUserProfilePicture.alt = `${username}'s profile picture`;
    githubUsername.href = `https://github.com/${username}`;
}

// Wait for the DOM to be loaded before loading the user's profile
window.addEventListener("DOMContentLoaded", () => {
    loadGithubUserData(portfolioUsername);
});
