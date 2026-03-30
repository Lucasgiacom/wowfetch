let totalMountsInGame = 0;
let mountLookup = {};
let fullMountsData = [];

// 1. Improved Tab Logic
function showTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    const buttons = document.querySelectorAll('.nav-btn');
    
    tabs.forEach(tab => tab.style.display = 'none');
    buttons.forEach(btn => btn.classList.remove('active'));

    const targetTab = document.getElementById(tabName + '-tab');
    if (targetTab) {
        targetTab.style.display = 'block';
    }
    

    const activeBtn = Array.from(buttons).find(btn => 
        btn.getAttribute('onclick')?.includes(`'${tabName}'`) || 
        btn.getAttribute('onclick')?.includes(`"${tabName}"`)
    );
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
    .then(res => {
        if (!res.ok) throw new Error("Could not find mounts.json");
        return res.json();
    })
    .then(data => {
        fullMountsData = data;
        let count = 0;
        
        
        data.forEach(cat => {
            if (!cat.subcats) return;
            cat.subcats.forEach(sub => {
                if (!sub.items) return;
                sub.items.forEach(m => {
                    count++;
                    const id = m.ID || m.spellid || m.itemId;
                    if (id) mountLookup[id] = m.icon;
                });
            });
        });
        
        totalMountsInGame = count;
        const btn = document.getElementById("search-button");
        if (btn) btn.disabled = false;
        console.log(`Loaded ${count} mounts from JSON.`);
    })
    .catch(err => {
        console.error("Initialization Error:", err);
        alert("Failed to load mount database. Check console for path errors.");
    });


async function loadFullProfile() {
    const realmInput = document.getElementById("realm").value.trim();
    const nameInput = document.getElementById("name").value.trim();

    if (!realmInput || !nameInput) {
        alert("Please enter both Name and Realm");
        return;
    }

    
    const realmEsc = encodeURIComponent(realmInput.toLowerCase().replace(/\s+/g, '-'));
    const nameEsc = encodeURIComponent(nameInput.toLowerCase());
    const baseUrl = "https://wowapilucas-g3emdxe8dpfxdhe0.eastus-01.azurewebsites.net/api/wow";

    try {
        const [stats, media, mountsData, equipData] = await Promise.all([
            fetch(`${baseUrl}/character/${realmEsc}/${nameEsc}`).then(r => r.json()),
            fetch(`${baseUrl}/media/${realmEsc}/${nameEsc}`).then(r => r.json()),
            fetch(`${baseUrl}/mounts/${realmEsc}/${nameEsc}`).then(r => r.json()),
            fetch(`${baseUrl}/equipment/${realmEsc}/${nameEsc}`).then(r => r.json())
        ]);

       
        const slotMapping = {
            "HEAD": "slot-head", "NECK": "slot-neck", "SHOULDER": "slot-shoulders",
            "BACK": "slot-back", "CHEST": "slot-chest", "SHIRT": "slot-shirt",
            "TABARD": "slot-tabard", "WRIST": "slot-wrist", "HANDS": "slot-hands",
            "WAIST": "slot-waist", "LEGS": "slot-legs", "FEET": "slot-feet",
            "FINGER_1": "slot-finger1", "FINGER_2": "slot-finger2",
            "TRINKET_1": "slot-trinket1", "TRINKET_2": "slot-trinket2",
            "MAIN_HAND": "slot-mainhand",
            "OFF_HAND": "slot-offhand"
        };

        document.querySelectorAll('.gear-slot').forEach(slot => slot.innerHTML = '');

        if (equipData?.equipped_items) {
            equipData.equipped_items.forEach(item => {
                const slotId = slotMapping[item.slot.type];
                const slotEl = document.getElementById(slotId);
                if (!slotEl) return;
                const quality = item.quality?.type?.toLowerCase() ?? 'common';
                slotEl.innerHTML = `
                    <a href="https://www.wowhead.com/item=${item.item.id}"
                       data-wh-icon-size="large"
                       class="item-link border-${quality}">
                    </a>`;
            });
        }

        // Tell Wowhead to re-scan the DOM and process all the new anchors we just
        // injected. Without this, Wowhead only scans on initial page load and misses
        // everything added dynamically after that.
        if (window.$WowheadPower) window.$WowheadPower.refreshLinks();

        
        const mountCount = mountsData.mounts ? mountsData.mounts.length : 0;
        document.getElementById("searchtools").style.display = "none";
        document.getElementById("profile-nav").style.display = "flex";
        
        document.getElementById("char-name").textContent = stats.name || nameInput;
        document.getElementById("char-level").textContent = stats.level || "??";
        document.getElementById("char-class").textContent = stats.character_class?.name || "";
        document.getElementById("char-race").textContent = stats.race?.name || "";
        document.getElementById("char-ilvl").textContent = stats.equipped_item_level || stats.average_item_level || 0;
        document.getElementById("achievement_points").textContent = stats.achievement_points || 0;
        
        document.querySelectorAll(".game-total-mounts").forEach(el => el.textContent = totalMountsInGame);
        document.querySelectorAll(".total-mountsown").forEach(el => el.textContent = mountCount);

        const mainAsset = media?.assets?.find(a => a.key === "main-raw") || media?.assets?.find(a => a.key === "inset");
        document.getElementById("char-img").src = mainAsset?.value ?? "";

    
        const ownedIds = new Set(mountsData.mounts.map(m => m.mount.id));
        const mountGrid = document.getElementById("mount-grid-list");
        
        let allMountsHTML = "";
        fullMountsData.forEach(cat => {
            if (!cat.subcats) return;
            cat.subcats.forEach(sub => {
                if (!sub.items) return;
                sub.items.forEach(m => {
                    
                    const mId = m.ID || m.spellid || m.itemId;
                    const isOwned = ownedIds.has(mId); 
                    const icon = m.icon || "inv_misc_questionmark";
                    
                    allMountsHTML += `
                        <li class="mountitem ${isOwned ? 'owned' : 'not-owned'}">
                            <a href="https://www.wowhead.com/mount/${mId}" target="_blank" class="mountlink">
                               <img src="https://wow.zamimg.com/images/wow/icons/large/${icon}.jpg"
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
        console.error("Profile Load Error:", err);
        alert("Error: Character not found, API is down, or the Realm name is misspelled.");
    }
}