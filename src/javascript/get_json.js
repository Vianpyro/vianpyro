(async () => {
  const response = await fetch('https://api.github.com/users/Vianpyro/repos');
  const json = await response.json();
  console.log(json.length);

  for (let i = 0; i < json.length; i++) {
    document.getElementById('content').innerHTML += `<a href="${json[i].html_url}" id="js-${json[i].name}">${json[i].name}</a><br />`
    if (json[i].homepage && json[i].name != 'Vianpyro') { document.getElementById(`js-${json[i].name}`).href = json[i].homepage }
  }
})()
