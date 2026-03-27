function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(tabName + '-tab').style.display = 'block';
    
    const activeBtn = Array.from(document.querySelectorAll('.nav-btn'))
                           .find(btn => btn.getAttribute('onclick').includes(tabName));
    if (activeBtn) activeBtn.classList.add('active');
}

function filterMounts() {
    const query = document.getElementById("mountSearch").value.toLowerCase();
    const items = document.querySelectorAll(".mountitem");

    items.forEach(item => {
        const name = item.querySelector("span").textContent.toLowerCase();
        item.style.display = name.includes(query) ? "flex" : "none";
    });
}

let mountLookup = {};

fetch('./Data/mounts.json')
    .then(res => res.json())
    .then(data => {
        data.forEach(cat => {
            if (cat.subcats) {
                cat.subcats.forEach(sub => {
                    sub.items.forEach(m => {
                        if (m.ID) mountLookup[m.ID] = m.icon;
                        if (m.spellid) mountLookup[m.spellid] = m.icon;
                        if (m.itemId) mountLookup[m.itemId] = m.icon;
                    });
                });
            }
        });
        const btn = document.getElementById("search-button");
        if (btn) btn.disabled = false;
    })
    .catch(err => console.error("Error loading JSON:", err));

async function loadFullProfile() {
    const realm = document.getElementById("realm").value.trim();
    const name = document.getElementById("name").value.trim();

    if (!realm || !name) {
        alert("Please enter both Name and Realm");
        return;
    }

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
        document.getElementById("profile-nav").style.display = "flex";
        
        document.getElementById("char-name").textContent = stats.name;
        document.getElementById("char-level").textContent = stats.level;
        document.getElementById("char-class").textContent = stats.character_class.name;
        document.getElementById("char-race").textContent = stats.race.name;
        document.getElementById("char-ilvl").textContent = stats.equipped_item_level || stats.average_item_level;
        document.getElementById("achievement_points").textContent = stats.achievement_points || 0;
        document.getElementById("total-mounts").textContent = mountsData.mounts.length;
        document.getElementById("total-mounts-tab").textContent = mountsData.mounts.length;
        
        const mainAsset = media?.assets?.find(a => a.key === "main-raw");
        document.getElementById("char-img").src = mainAsset?.value ?? "";

        const mountGrid = document.getElementById("mount-grid-list");
        mountGrid.innerHTML = mountsData.mounts.map(m => {
            const mId = m.mount.id;
            const icon = mountLookup[mId] || "inv_misc_questionmark";
            return `
                <li class="mountitem">
                    <a href="https://www.wowhead.com/mount/${mId}" target="_blank" class="mountlink">
                       <img src="https://render.worldofwarcraft.com/us/icons/56/${icon}.jpg" class="wh-icon">
                       <span>${m.mount.name}</span>
                    </a>
                </li>`;
        }).join('');

        showTab('overview');

    } catch (err) {
        console.error("Fetch failed:", err);
        alert("Character not found or API error.");
    }
}