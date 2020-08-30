async function load_user_data(user) {
    const response = await fetch(`https://api.github.com/users/${user}/repos`);
    const json = await response.json();
    console.log(json.length);
  
    for (let i = 0; i < json.length; i++) {
      document.getElementById('content').innerHTML += `<a href="${json[i].html_url}" target = "_blank" id="js-${json[i].name}">${json[i].name}</a><br />`
      if (json[i].homepage && json[i].name != user) { document.getElementById(`js-${json[i].name}`).href = json[i].homepage }
    }

    // Changing the favicon
    let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = `https://avatars3.githubusercontent.com/u/${json[0].owner.id}`;
    document.getElementsByTagName('head')[0].appendChild(link);
}
window.addEventListener("DOMContentLoaded", (event) => {
  load_user_data('Vianpyro');
});