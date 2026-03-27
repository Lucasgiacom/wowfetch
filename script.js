function filterMounts() {
    const query = document.getElementById("mount-search").value.toLowerCase();
    const items = document.querySelectorAll(".mountitem");

    items.forEach(item => {
        const name = item.querySelector("span").textContent.toLowerCase();
        if (name.includes(query)) {
            item.style.display = "flex";
        } else {
            item.style.display = "none";
        }
    });
}

let mountLookup = {};

fetch('/Data/mounts.json')
    .then(res => res.json())
    .then(data => {
        data.forEach(cat => {
            if (cat.subcats) {
                cat.subcats.forEach(sub => {
                    sub.items.forEach(m => {
                        if (m.ID) mountLookup[m.ID] = m.icon;
                        if (m.spellId) mountLookup[m.spellId] = m.icon;
                        if (m.itemId) mountLookup[m.itemId] = m.icon;
                    });
                });
            }
        });
        console.log("Mount lookup table ready. Sample:", Object.entries(mountLookup).slice(0, 5));
        
        const btn = document.getElementById("search-button");
        if (btn) btn.disabled = false;
    })
    .catch(err => console.error("Error loading JSON:", err));

async function loadFullProfile() {
    const realm = document.getElementById("realm").value.trim();
    const name = document.getElementById("name").value.trim();
    const display = document.getElementById("character-info");

    if (!display || !realm || !name) return;

    const realmEsc = encodeURIComponent(realm.toLowerCase());
    const nameEsc = encodeURIComponent(name.toLowerCase());

    try {
        const [statsRes, mediaRes, mountsRes] = await Promise.all([
            fetch(`https://wowapilucas-g3emdxe8dpfxdhe0.eastus-01.azurewebsites.net/api/wow/character/${realmEsc}/${nameEsc}`),
            fetch(`https://wowapilucas-g3emdxe8dpfxdhe0.eastus-01.azurewebsites.net/api/wow/media/${realmEsc}/${nameEsc}`),
            fetch(`https://wowapilucas-g3emdxe8dpfxdhe0.eastus-01.azurewebsites.net/api/wow/mounts/${realmEsc}/${nameEsc}`)
        ]);

        const stats = await statsRes.json();
        const media = await mediaRes.json();
        const mountsData = await mountsRes.json();

        document.getElementById("searchtools").style.display = "none";
        const mainAsset = media?.assets?.find(a => a.key === "main-raw");
        const renderUrl = mainAsset?.value ?? "";

        const mountListHtml = mountsData.mounts.map(m => {
            const mId = m.mount.id;
            const mName = m.mount.name;

            const iconName = mountLookup[mId] || "inv_misc_questionmark";
            const iconUrl = `https://render.worldofwarcraft.com/us/icons/56/${iconName}.jpg`;

            return `
                <li class="mountitem">
                    <a href="https://www.wowhead.com/mount/${mId}" target="_blank" class="mountlink">
                       <img src="${iconUrl}" 
                            class="wh-icon" 
                            loading="lazy" 
                            onerror="this.src='https://render.worldofwarcraft.com/us/icons/56/inv_misc_questionmark.jpg'">
                       <span>${mName}</span>
                    </a>
                </li>`;
        }).join('');

        display.innerHTML = `
            <div class="main">
                <h2>${stats.name}</h2>
                <p><strong>Level:</strong> ${stats.level}<br>
                <strong>Class:</strong> ${stats.character_class.name}<br>
                <strong>Race:</strong> ${stats.race.name}<br>
                <strong>Achievement Points:</strong> ${stats.achievement_points}<br>
                <strong>Item Level:</strong> ${stats.average_item_level}<br>
                <strong>Total Mounts:</strong> ${mountsData.mounts.length}</p>
            </div>
            <div class="imageframe">
                <img src="${renderUrl}" class="characterimg">
            </div>
            <div class="mountsec">
                <h2 style="color: white;">Mounts Collection</h2>
                <div class="mountsearch">
                    <input type="text" id="mount-search" placeholder="Search mounts..." oninput="filterMounts()">
                </div>
                <ul class="mount-grid">${mountListHtml}</ul>
            </div>
        `;

        if (window.$WowheadPower) window.$WowheadPower.refreshLinks();

    } catch (err) {
        console.error(err);
        display.innerHTML = `<p style='color:red'>${err.message}</p>`;
    }
}