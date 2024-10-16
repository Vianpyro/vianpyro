const portfolioUsername = "Vianpyro";

const githubRepositories = document.getElementById('github-repos');
const githubUsername = document.getElementById('github-username');
const githubUserProfilePicture = document.getElementById('github-user-profile-picture');
const githubUserBio = document.getElementById('github-user-bio');

async function fetchData(url) {
    const response = await fetch(url);
    return response.json();
}

function updateUserProfile(data, username) {
    const userName = data.name || username;
    githubUsername.innerText = userName;
    githubUsername.href = `https://github.com/${username}`;
    githubUserProfilePicture.src = `https://avatars3.githubusercontent.com/u/${data.id}`;
    document.title = userName;
}

function updateUserBio(data) {
    const userBio = data.bio || '';
    githubUserBio.innerText = `"${userBio}"`;
}

async function fetchGithubColors() {
    const colorsUrl = 'https://raw.githubusercontent.com/ozh/github-colors/master/colors.json';
    return fetchData(colorsUrl);
}

function createRepoElement(repo, colors, username) {
    const { name, fork, description, language, html_url, homepage } = repo;
    const repoDiv = document.createElement('div');
    repoDiv.className = 'github-repo';

    const repoLink = document.createElement('a');
    repoLink.href = html_url;
    repoLink.target = '_blank';
    repoLink.id = `js-${name}`;
    repoLink.className = 'repo-detail';

    const repoNameSpan = document.createElement('span');
    repoNameSpan.className = 'repo-name';
    repoNameSpan.innerHTML = `${name.replace(/-/g, " ").replace(/   /g, " - ")} ${fork ? '<span>(<b>Forked</b>)</span>' : ''}`;
    repoLink.appendChild(repoNameSpan);

    const repoDescSpan = document.createElement('span');
    repoDescSpan.className = 'repo-detail';
    repoDescSpan.innerText = description || '';

    const repoLangSpan = document.createElement('span');
    repoLangSpan.className = 'repo-detail';
    if (language) {
        repoLangSpan.innerHTML = `<b style="color: ${colors[language].color};">•</b> ${language}`;
    }

    repoDiv.appendChild(repoLink);
    repoDiv.appendChild(repoDescSpan);
    repoDiv.appendChild(repoLangSpan);

    if (homepage && name !== username) {
        repoLink.href = homepage;
    }

    return repoDiv;
}

function updateRepositories(repos, colors, username) {
    githubRepositories.innerHTML = '';
    repos.forEach(repo => {
        const repoElement = createRepoElement(repo, colors, username);
        githubRepositories.appendChild(repoElement);
    });
}

function updateFavicon(userId) {
    let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = `https://avatars3.githubusercontent.com/u/${userId}`;
    document.getElementsByTagName('head')[0].appendChild(link);
}

async function loadGithubUserData(username) {
    try {
        const repos = await fetchData(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`);
        const userProfile = await fetchData(`https://api.github.com/user/${repos[0].owner.id}`);
        const userBio = await fetchData(`https://api.github.com/users/${username}`);
        const colors = await fetchGithubColors();

        updateUserProfile(userProfile, username);
        updateUserBio(userBio);
        updateRepositories(repos, colors, username);
        updateFavicon(repos[0].owner.id);
    } catch (err) {
        githubUserProfilePicture.src = "./src/img/octocat.png";
        githubUsername.innerText = username;
        githubRepositories.innerText = 'This user seems not to have any public repository (yet).';
        githubUserBio.innerHTML = "";
        document.title = username;
        console.log(err);
    }
    githubUserProfilePicture.alt = `${username}'s profile picture`;
    githubUsername.href = `https://github.com/${username}`;
}

window.addEventListener("DOMContentLoaded", () => {
    loadGithubUserData(portfolioUsername);
});
