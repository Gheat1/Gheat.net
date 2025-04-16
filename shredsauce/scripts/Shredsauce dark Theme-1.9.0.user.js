// ==UserScript==
// @name         Shredsauce dark Theme
// @namespace    stylish
// @version      1.9.0
// @description  All-black dark theme for Shredsauce website by Gheat – Combined Menu with collapsible Tools, SLVSH, and Settings HUD
// @include      *://shredsauce.com/*
// @include      *://suikagame.io/shredsauce/*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @license      All Rights Reserved
// @downloadURL https://update.greasyfork.org/scripts/532035/Shredsauce%20dark%20Theme.user.js
// @updateURL https://update.greasyfork.org/scripts/532035/Shredsauce%20dark%20Theme.meta.js
// ==/UserScript==

(function() {
  const style = document.createElement('style');
  style.innerText = `
    body, html { background-color: #000 !important; color: #fff !important; }
    mobileContainer, #webContainer, .scroll-section, .carousel, .navbar, footer, #contentContainer, #playerContainerOverlay {
      background-color: #000 !important; color: #fff !important;
    }
    button, .btn, .flickity-button, .playButton, #playButton { background-color: #333 !important; color: #fff !important; border: 1px solid #555 !important; }
    button:hover, .btn:hover, .flickity-button:hover, .playButton:hover, #playButton:hover { background-color: #444 !important; }
    .navbar, .navbar nav ul li a, .social-icons a, .dropdown-content a, .logoContainer img, .videoOverlayLogo { filter: brightness(0) invert(1) !important; }
    #playContainerInfoBox, .updateTitle, .text, .leaderboardContainer, .skyscraperContainer, .pull-right, .clearfix { background-color: #000 !important; color: #fff !important; }
    img, video, .carousel img, .flickity-button svg, .videoOverlayLogo { filter: brightness(0.8) !important; }
    #playIcon path { fill: #fff !important; }
    a, a:link, a:visited { color: #66ccff !important; } a:hover { color: #00aaff !important; }
    [class*="ad"], .ad-container, #div-gpt-ad, .banner-ad, .myAds { display: none !important; }
    *:not(#gheat-menu):not(#slvsh-hud):not(#gheat-tools-popup):not(#gheat-menu-sections):not(#gheat-tools-section):not(#gheat-slvsh-section):not(#gheat-settings-hud):not(#webContainer):not(.scroll-section):not(#playerContainerOverlay):not(.navbar):not(footer):not(#contentContainer):not(body):not(html) {
      background-color: transparent !important;
    }
    #gheat-message {
      position: fixed; bottom: 10px; right: 20px; font-size: 12px; color: #aaa; font-family: monospace; z-index: 99999;
    }
    #leaderboardContainer, #skyscraperContainer,
    div[class*="8p7p6pdb282"] { display: none !important; }
  `;
  document.head.appendChild(style);

  // Delete unwanted elements
  window.addEventListener('load', () => {
    const msg = document.createElement('div');
    msg.id = 'gheat-message';
    msg.innerText = 'https://sites.google.com/view/shredhub/home - Gheat';
    document.body.appendChild(msg);
    const allowedIds = [
      'webContainer', 'mobileContainer', 'gheat-message', 'gheat-menu',
      'gheat-menu-header', 'gheat-menu-sections',
      'gheat-tools-popup', 'gheat-tools-section', 'gheat-slvsh-section',
      'gheat-settings-hud',
      'slvsh-hud', 'slvsh-p1-bg', 'slvsh-p2-bg',
      'butta-edit', 'butta-video'
    ];
    function nukeUnwanted() {
      Array.from(document.body.children).forEach(el => {
        if (!allowedIds.includes(el.id)) { el.remove(); }
      });
    }
    setTimeout(() => {
      allowedIds.push('gheat-menu');
      nukeUnwanted();
      const observer = new MutationObserver(() => { nukeUnwanted(); });
      observer.observe(document.body, { childList: true, subtree: true });
    }, 2500);
  });
})();

// Update theme message and YouTube section
window.addEventListener('load', () => {
  const titleDiv = document.querySelector('.updateTitle');
  if (titleDiv) titleDiv.textContent = '';
  const msgContainer = document.querySelector('.text');
  if (msgContainer) {
    msgContainer.innerHTML = `
      <em>sites.google.com/view/shredhub</em><br>
      <em>April 6 2025</em><br><br>
      Thank you for using my theme<br><br>
      - Gheat
    `;
    const ytSection = document.createElement('div');
    ytSection.id = 'butta-edit';
    ytSection.style.marginTop = '30px';
    ytSection.style.textAlign = 'center';
    ytSection.style.color = '#fff';
    ytSection.style.fontFamily = 'Arial, sans-serif';
    ytSection.innerHTML = `
      <h2 style="margin-bottom: 10px; font-size: 16px; text-align: left;">Butta Park shredsauce edit by Gheat</h2>
      <div style="width: 520px; height: 292px; margin-right: auto;">
        <iframe id="butta-video" width="520" height="292"
          src="https://www.youtube.com/embed/moFxyVw-L78"
          title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write;
          encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
      </div>
    `;
    msgContainer.appendChild(ytSection);
  }
});

// Replace video
window.addEventListener('load', () => {
  const video = document.querySelector('video.video');
  const source = video ? video.querySelector('source') : null;
  if (source) { source.src = 'https://files.catbox.moe/nmgerh.mp4'; video.load(); }
});

///////////////////////////////////////////////////////////////////
//////////////////////////Gheat Menu///////////////////////////////
///////////////////////////////////////////////////////////////////
window.addEventListener('load', () => {
  // Main Menu container
  const menu = document.createElement('div');
  menu.id = 'gheat-menu';
  Object.assign(menu.style, {
    position: 'fixed',
    top: '50%',
    right: '20px',
    transform: 'translate(100%, -50%)',
    color: 'white',
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    borderRadius: '16px',
    zIndex: '99999',
    textAlign: 'center',
    width: 'max-content',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(12px) saturate(140%)',
    WebkitBackdropFilter: 'blur(12px) saturate(140%)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255,255,255,0.1)',
    opacity: '0',
    transition: 'opacity 0.5s ease, transform 0.5s ease'
  });
  setTimeout(() => {
    menu.style.opacity = '1';
    menu.style.transform = 'translate(0, -50%)';
  }, 300);
  document.body.appendChild(menu);

  // Content wrapper for fading inner content
  const contentWrapper = document.createElement('div');
  contentWrapper.style.opacity = '0';
  contentWrapper.style.transition = 'opacity 0.4s ease';
  menu.appendChild(contentWrapper);
  setTimeout(() => { contentWrapper.style.opacity = '1'; }, 200);

  // Main Menu header with buttons and container for sub panels
  contentWrapper.innerHTML = `
    <div id="gheat-menu-header" style="display: flex; flex-direction: column; align-items: center; width: 100%;">
      <div style="font-weight: bold; font-size: 16px; margin-bottom: 12px;">✦ Gheat Menu ✦</div>
      <div class="menu-item" style="margin: 5px 0; width: 100%; text-align: center;">
        <button id="cheatBtn" style="padding: 6px 12px; width: 140px; border: none; border-radius: 6px; background: #444; color: white; cursor: pointer;">
          Cheat Sheet
        </button>
      </div>
      <div class="menu-item" style="margin: 5px 0; width: 100%; text-align: center;">
        <button id="toolsBtn" style="padding: 6px 12px; width: 140px; border: none; border-radius: 6px; background: #444; color: white; cursor: pointer;">
          Tools
        </button>
        <div id="gheat-tools-section" style="
          display: none;
          flex-direction: column;
          align-items: center;
          opacity: 0;
          transform: translateY(-10px);
          transition: opacity 0.3s ease, transform 0.3s ease;
          margin-top: 5px;
          width: 100%;
          text-align: center;
        ">
          <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">✦ Tools ✦</div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
            <button id="btnCustomTextures" style="padding: 6px 12px; width: 140px; border: none; border-radius: 6px; background: #444; color: white; cursor: pointer;">
              Custom Textures Extension
            </button>
            <button id="btnIsItDown" style="padding: 6px 12px; width: 140px; border: none; border-radius: 6px; background: #444; color: white; cursor: pointer;">
              Checking...
            </button>
            <button id="btnBeta" style="padding: 6px 12px; width: 140px; border: none; border-radius: 6px; background: #444; color: white; cursor: pointer;">
              Beta
            </button>
            <button id="btnSettings" style="padding: 6px 12px; width: 140px; border: none; border-radius: 6px; background: #444; color: white; cursor: pointer;">
              Settings
            </button>
          </div>
        </div>
      </div>
      <div class="menu-item" style="margin: 5px 0; width: 100%; text-align: center;">
        <button id="slvshBtn" style="padding: 6px 12px; width: 140px; border: none; border-radius: 6px; background: #444; color: white; cursor: pointer;">
          SLVSH
        </button>
        <div id="gheat-slvsh-section" style="
          display: none;
          opacity: 0;
          transform: translateY(-10px);
          transition: opacity 0.3s ease, transform 0.3s ease;
          margin-top: 5px;
          width: 100%;
          text-align: center;
        ">
          <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">✦ Slvsh Cup ✦</div>
          <div style="margin-bottom: 8px;"><strong>Skier 1 - </strong><span id="p1Letters"></span></div>
          <div style="margin-bottom: 8px;"><strong>Skier 2 - </strong><span id="p2Letters"></span></div>
          <div style="margin-bottom: 8px; display: flex; gap: 4px; justify-content: center;">
            <button id="slvshBtnPlus1" style="padding:4px 8px; border:none; border-radius:4px; background:#555; color:white; cursor:pointer;">SK1 +</button>
            <button id="slvshBtnMinus1" style="padding:4px 8px; border:none; border-radius:4px; background:#555; color:white; cursor:pointer;">SK1 -</button>
          </div>
          <div style="margin-bottom: 8px; display: flex; gap: 4px; justify-content: center;">
            <button id="slvshBtnPlus2" style="padding:4px 8px; border:none; border-radius:4px; background:#555; color:white; cursor:pointer;">SK2 +</button>
            <button id="slvshBtnMinus2" style="padding:4px 8px; border:none; border-radius:4px; background:#555; color:white; cursor:pointer;">SK2 -</button>
          </div>
        </div>
      </div>
    </div>
  `;

  ///////////////////////////////////////////////////////////////////
  // Event Handlers for Main Menu Buttons
  ///////////////////////////////////////////////////////////////////
  document.getElementById('cheatBtn').onclick = () => {
    window.open('https://sites.google.com/view/shredhub/cheats', '_blank');
  };

  // Toggle Tools panel
  document.getElementById('toolsBtn').onclick = () => {
    const toolsPanel = document.getElementById('gheat-tools-section');
    if (toolsPanel.style.display === 'none' || toolsPanel.style.display === '') {
      toolsPanel.style.display = 'block';
      requestAnimationFrame(() => {
        toolsPanel.style.opacity = '1';
        toolsPanel.style.transform = 'translateY(0)';
      });
    } else {
      toolsPanel.style.opacity = '0';
      toolsPanel.style.transform = 'translateY(-10px)';
      setTimeout(() => { toolsPanel.style.display = 'none'; }, 300);
    }
  };

  // Toggle SLVSH panel
  document.getElementById('slvshBtn').onclick = () => {
    const slvshPanel = document.getElementById('gheat-slvsh-section');
    if (slvshPanel.style.display === 'none' || slvshPanel.style.display === '') {
      slvshPanel.style.display = 'block';
      requestAnimationFrame(() => {
        slvshPanel.style.opacity = '1';
        slvshPanel.style.transform = 'translateY(0)';
      });
    } else {
      slvshPanel.style.opacity = '0';
      slvshPanel.style.transform = 'translateY(-10px)';
      setTimeout(() => { slvshPanel.style.display = 'none'; }, 300);
    }
  };

  ///////////////////////////////////////////////////////////////////
  // SLVSH Score Buttons Logic
  ///////////////////////////////////////////////////////////////////
  const p1Letters = document.getElementById('p1Letters');
  const p2Letters = document.getElementById('p2Letters');
  document.getElementById('slvshBtnPlus1').onclick = function() {
    if (p1Letters.textContent.length < 5) {
      p1Letters.textContent += 'SLVSH'[p1Letters.textContent.length];
    }
    this.blur();
  };
  document.getElementById('slvshBtnMinus1').onclick = function() {
    p1Letters.textContent = p1Letters.textContent.slice(0, -1);
    this.blur();
  };
  document.getElementById('slvshBtnPlus2').onclick = function() {
    if (p2Letters.textContent.length < 5) {
      p2Letters.textContent += 'SLVSH'[p2Letters.textContent.length];
    }
    this.blur();
  };
  document.getElementById('slvshBtnMinus2').onclick = function() {
    p2Letters.textContent = p2Letters.textContent.slice(0, -1);
    this.blur();
  };

  ///////////////////////////////////////////////////////////////////
  // Tools Section Event Handlers
  ///////////////////////////////////////////////////////////////////
  document.getElementById('btnCustomTextures').onclick = () => {
    window.open("https://sites.google.com/view/shredhub/tutorials", "_blank");
  };

  // Is It Down status check – if any response is received before 8 sec, it says UP.
  function checkStatus() {
    const btn = document.getElementById('btnIsItDown');
    if (!btn) return;
    btn.textContent = "Checking...";
    GM_xmlhttpRequest({
      method: "GET",
      url: "https://shredsauce.com/test.php",
      timeout: 8000,
      ontimeout: () => { btn.textContent = "DOWN ❌"; },
      onload: (resp) => { btn.textContent = "UP ✅"; },
      onerror: (err) => { btn.textContent = "DOWN ❌"; console.error("Status check error:", err); }
    });
  }
  document.getElementById('btnIsItDown').onclick = checkStatus;
  checkStatus();

  // Settings HUD
  document.getElementById('btnSettings').onclick = () => {
    let settingsHud = document.getElementById('gheat-settings-hud');
    if (!settingsHud) {
      settingsHud = document.createElement('div');
      settingsHud.id = 'gheat-settings-hud';
      settingsHud.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(40, 40, 40, 0.75);
        backdrop-filter: blur(12px) saturate(130%);
        -webkit-backdrop-filter: blur(12px) saturate(130%);
        border: 1px solid rgba(255,255,255,0.08);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        border-radius: 16px;
        padding: 20px;
        z-index: 100000;
        text-align: center;
        width: 220px;
        display: none;
        opacity: 0;
        transition: opacity 0.3s ease, transform 0.3s ease;
      `;
      settingsHud.innerHTML = `
        <div style="font-weight: bold; font-size: 16px; margin-bottom: 12px;">✦ Settings ✦</div>
        <button style="margin:5px; padding:6px 12px; width: 180px; border:none; border-radius:6px; background:#444; color:white; cursor:pointer;">settings in the works</button>
        <button style="margin:5px; padding:6px 12px; width: 180px; border:none; border-radius:6px; background:#444; color:white; cursor:pointer;">settings in the works</button>
        <button id="settingsCloseBtn" style="margin:5px; padding:6px 12px; width: 180px; border:none; border-radius:6px; background:#800; color:white; cursor:pointer;">
          Close Settings
        </button>
      `;
      document.body.appendChild(settingsHud);
      document.getElementById('settingsCloseBtn').onclick = () => {
        settingsHud.style.opacity = '0';
        settingsHud.style.transform = 'translateY(-10px)';
        setTimeout(() => { settingsHud.style.display = 'none'; }, 300);
      };
    }
    if (settingsHud.style.display === 'block') {
      settingsHud.style.opacity = '0';
      settingsHud.style.transform = 'translateY(-10px)';
      setTimeout(() => { settingsHud.style.display = 'none'; }, 300);
    } else {
      settingsHud.style.display = 'block';
      requestAnimationFrame(() => {
        settingsHud.style.opacity = '1';
        settingsHud.style.transform = 'translateY(0)';
      });
    }
  };

  // Beta button
 document.getElementById('btnBeta').onclick = () => {
  const proceed = confirm("Switching to the Beta version will reload the page. Do you want to continue?");
  if (proceed) {
    window.location.href = "https://shredsauce.com/beta";
  }
};
// --- Add Update Check at the Bottom of the Gheat Menu ---

const currentVersion = "1.9.0"; // <-- Set your current version here

GM_xmlhttpRequest({
  method: "GET",
  url: "https://update.greasyfork.org/scripts/532035/Shredsauce%20dark%20Theme.meta.js",
  onload: function(response) {
    if (response.status === 200) {
      // Extract the version string from the meta file using a regex
      const metaText = response.responseText;
      const versionMatch = metaText.match(/@version\s+([^\s]+)/i);
      if (versionMatch && versionMatch[1]) {
        const newVersion = versionMatch[1].trim();
        // If the version in the meta file does NOT equal our current version, consider that an update.
        if (newVersion !== currentVersion) {
          // Create the update button
          const updateBtn = document.createElement("button");
          updateBtn.textContent = "Update available!";
          updateBtn.style.cssText = "margin-top: 10px; padding: 6px 12px; width: 140px; border: none; border-radius: 6px; background: #800; color: white; cursor: pointer;";
          updateBtn.onclick = () => {
            window.open("https://greasyfork.org/en/scripts/532035-shredsauce-dark-theme", "_blank");
          };
          // Append the update button at the bottom of your main content wrapper or menu
          // (If you already defined `contentWrapper` in your Gheat Menu creation code, you can append it there)
          contentWrapper.appendChild(updateBtn);
        }
      }
    }
  },
  onerror: function(err) {
    console.error("Error checking update:", err);
  }
});
});