async function loadFullProfile() {
    const realm = document.getElementById("realm").value.trim();
    const name = document.getElementById("name").value.trim();
    
    // 1. Get the display element
    const display = document.getElementById("character-info");

    // 2. Safety Check: If display is missing, stop immediately and log it
    if (!display) {
        console.error("CRITICAL: Element 'character-info' not found in HTML!");
        return; 
    }

    if (!realm || !name) {
        display.innerHTML = "<p style='color:red'>Enter both realm and character name.</p>";
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

        if (!statsRes.ok || !mediaRes.ok || !mountsRes.ok) {
            throw new Error(`Character status ${statsRes.status}, media status ${mediaRes.status}, Mounts Status ${mountsRes.status}`);
        }

        const stats = await statsRes.json();
        const media = await mediaRes.json();
        const mountsData = await mountsRes.json();
        console.log("mounts found:", mountsData.mounts);

        document.getElementById("searchtools").style.display ="none";   
        
        const mainAsset = media?.assets?.find(a => a.key === "main-raw");
        const renderUrl = mainAsset?.value ?? "";
        
        if (!renderUrl) {
            console.warn("No 'main' asset found. Available assets:", media?.assets?.map(a => a.key));
        }

        const mountListHtml = mountsData.mounts
    .map(m => {
        const mountId = m.mount.id; 
        const mountName = m.mount.name;
        const wowheadUrl = `https://www.wowhead.com/mount/${mountId}`;

        return `
            <li class="mountitem">
                <a href="${wowheadUrl}"
                target="_blank"
                class="mountlink" 
                rel="nofollow"
                data-wowhead="mount=${mountId}">
                ${mountName}
                </a>
            </li>`;
    })
    .join('');

        display.innerHTML = `   
            <div class="main">
                <h2>${stats.name}</h2>
                <div>
                    <p><strong>Level:</strong> ${stats.level}</p>
                    <p><strong>Class:</strong> ${stats.character_class.name}</p>
                    <p><strong>Race:</strong> ${stats.race.name}</p>
                    <p><strong>Item Level:</strong> ${stats.average_item_level}</p>
                    <p><strong>Achievement Points:</strong> ${stats.achievement_points}</p>
                    <p><strong>Total Mounts Collected:</strong> ${mountsData.mounts.length}</p>
                </div>
            </div>
            <div class="imageframe">
            <img src="${renderUrl}" class="characterimg">
            </div>
            <div class="mountsec">
                <h2 class="main" style="color: white;">Mounts Collection</h2>
                <ul class="mount-grid">
                    ${mountListHtml}
                    </ul>
                    </div>
        `;

        if (window.$WowheadPower){
            window.$WowheadPower.refreshLinks();
        }

        setTimeout(() => {
            if(window.$WowheadPower){
                window.$WowheadPower.refreshLinks();
            }
        }, 200);

    } catch (err) {
        console.error(err);
        display.innerHTML = `<p style='color:red'>${err.message}</p>`;
    }
}