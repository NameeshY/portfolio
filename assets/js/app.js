const fmt = n => n.toLocaleString();
const h = (tag, attrs={}, html="") => {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v]) => e.setAttribute(k,v));
  e.innerHTML = html; return e;
};

async function fetchRepos(username){
  const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&type=owner&sort=updated`,
    { headers:{ "Accept":"application/vnd.github+json" }});
  if(!res.ok) throw new Error("GitHub API rate-limited or user not found.");
  const repos = await res.json();
  return repos.filter(r=>!r.fork && !r.archived);
}

function renderFeatured(list, mountId){
  const mount = document.getElementById(mountId);
  if(!mount) return;
  mount.innerHTML = "";
  list.forEach(f=>{
    const img = f.image ? `<img class="thumb" src="${f.image}" alt="${f.title} thumbnail">`
                        : `<div class="thumb">🗂️ ${f.title}</div>`;
    const topics = (f.topics||[]).slice(0,6).map(t=>`<span class="topic">${t}</span>`).join("");
    const url = `https://github.com/NameeshY/${f.name}`;
    mount.appendChild(h("article",{class:"card"},
      `${img}
       <h4 style="margin:4px 0 2px">${f.title}</h4>
       <p class="muted" style="min-height:44px">${f.desc}</p>
       <div class="topics">${topics}</div>
       <div class="btnrow">
         <a class="btn primary" href="${url}" target="_blank">Code</a>
       </div>`));
  });
}

function buildLanguageList(repos){
  const select = document.getElementById("language");
  if(!select) return;
  const set = new Set(repos.map(r=>r.language).filter(Boolean));
  [...set].sort().forEach(l=>{
    const o=document.createElement("option"); o.value=l; o.textContent=`Language: ${l}`; select.appendChild(o);
  });
}

function renderRepos(repos){
  const grid = document.getElementById("repos");
  if(!grid) return;
  grid.innerHTML = "";
  repos.forEach(r=>{
    const topics = (r.topics||[]).slice(0,6).map(t=>`<span class="topic">${t}</span>`).join("");
    const home = r.homepage ? `<a class="btn" href="${r.homepage}" target="_blank">Live</a>` : "";
    grid.appendChild(h("article",{class:"card"},
      `<h4><a href="${r.html_url}" target="_blank">${r.name}</a></h4>
       <p class="muted" style="min-height:42px">${r.description ?? "—"}</p>
       <div class="meta"><span>★ ${fmt(r.stargazers_count)}</span>
         <span>${r.language ?? ""}</span>
         <span>Updated ${new Date(r.updated_at).toLocaleDateString()}</span>
       </div>
       <div class="topics" style="margin-top:8px">${topics}</div>
       <div class="btnrow" style="margin-top:10px">
         <a class="btn primary" href="${r.html_url}" target="_blank">Code</a>${home}
       </div>`));
  });
}

function applyFilters(base){
  const q = (document.getElementById("search")?.value || "").toLowerCase();
  const lang = document.getElementById("language")?.value || "all";
  const sort = document.getElementById("sort")?.value || "stars";

  let list = base.filter(r =>
    (!q || r.name.toLowerCase().includes(q) || (r.description||"").toLowerCase().includes(q)) &&
    (lang==="all" || r.language===lang)
  );
  if(sort==="stars") list.sort((a,b)=>b.stargazers_count-a.stargazers_count);
  if(sort==="updated") list.sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at));
  if(sort==="name") list.sort((a,b)=>a.name.localeCompare(b.name));
  renderRepos(list);
}

async function bootProjectsPage({username, featured}){
  document.getElementById('yr').textContent=new Date().getFullYear();
  try{
    const repos = await fetchRepos(username);
    buildLanguageList(repos);
    renderFeatured(featured,"featured");
    document.getElementById("sort").value="stars";
    applyFilters(repos);
    document.getElementById("search").addEventListener("input",()=>applyFilters(repos));
    document.getElementById("language").addEventListener("change",()=>applyFilters(repos));
    document.getElementById("sort").addEventListener("change",()=>applyFilters(repos));
  }catch(e){
    document.getElementById("repos").innerHTML = `<div class="card"><strong>Oops:</strong> ${e.message}</div>`;
  }
}
