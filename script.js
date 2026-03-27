let totalMountsInGame = 0;
let mountLookup = {};
let fullMountsData = []; 

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

fetch('./Data/mounts.json')
    .then(res => res.json())
    .then(data => {
        fullMountsData = data; 
        let count = 0;
        data.forEach(cat => {
            if (cat.subcats) {
                cat.subcats.forEach(sub => {
                    if (sub.items) {
                        sub.items.forEach(m => {
                            count++;
                            if (m.ID) mountLookup[m.ID] = m.icon;
                            if (m.spellid) mountLookup[m.spellid] = m.icon;
                            if (m.itemId) mountLookup[m.itemId] = m.icon;
                        });
                    }
                });
            }
        });
        totalMountsInGame = count;
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
        const mountCount = mountsData.mounts ? mountsData.mounts.length : 0;

        document.getElementById("searchtools").style.display = "none";
        document.getElementById("profile-nav").style.display = "flex";
        
        document.getElementById("char-name").textContent = stats.name;
        document.getElementById("char-level").textContent = stats.level;
        document.getElementById("char-class").textContent = stats.character_class.name;
        document.getElementById("char-race").textContent = stats.race.name;
        document.getElementById("char-ilvl").textContent = stats.equipped_item_level || stats.average_item_level;
        document.getElementById("achievement_points").textContent = stats.achievement_points || 0;
        
        document.querySelectorAll(".game-total-mounts").forEach(el => el.textContent = totalMountsInGame);
        document.querySelectorAll(".total-mountsown").forEach(el => el.textContent = mountCount);

        const mainAsset = media?.assets?.find(a => a.key === "main-raw");
        document.getElementById("char-img").src = mainAsset?.value ?? "";

        // Challenge Logic: Check ownership against the full database
        const ownedIds = new Set(mountsData.mounts.map(m => m.mount.id));
        const mountGrid = document.getElementById("mount-grid-list");
        
        let allMountsHTML = "";
        fullMountsData.forEach(cat => {
            cat.subcats.forEach(sub => {
                sub.items.forEach(m => {
                    const mId = m.ID || m.spellid || m.itemId;
                    const isOwned = ownedIds.has(mId);
                    const icon = m.icon || "inv_misc_questionmark";
                    
                    allMountsHTML += `
                        <li class="mountitem ${isOwned ? 'owned' : 'not-owned'}">
                            <a href="https://www.wowhead.com/mount/${mId}" target="_blank" class="mountlink">
                               <img src="https://render.worldofwarcraft.com/us/icons/56/${icon}.jpg" 
                                    class="wh-icon ${isOwned ? '' : 'greyscale'}">
                               <span>${m.name}</span>
                            </a>
                        </li>`;
                });
            });
        });

        mountGrid.innerHTML = allMountsHTML;
        showTab('overview');

    } catch (err) {
        console.error("Fetch failed:", err);
        alert("Character not found or API error.");
    }
}