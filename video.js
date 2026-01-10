/*
  video.js
  - Mapping for Rezka.ag videos by animeId
  - Keys = animeId, values = rezka.ag URL or video slug
  - When clicking watch button, navigates to anime-watch.html with rezka URL
*/

// Mapping: paste Rezka.ag URLs here. Keys = animeId, values = rezka_url
// Example: '16498': 'https://rezka.ag/animation/search/?q=Attack%20on%20Titan'
window.rezkaMap = {
  // Examples / template:
  '16498': 'https://rezka.ag/animation/adventures/1973-ataka-titanov-tv-1-2013.html', // Attack on Titan
  '1535': 'https://rezka.ag/animation/456-death-note.html', // Death Note
  '5114': 'https://rezka.ag/animation/adventures/1973-ataka-titanov-tv-1-2013.html', // Fullmetal Alchemist: Brotherhood
  '30276': '', // One Punch Man
  '20': '', // Naruto
  '38000': '', // Demon Slayer (Kimetsu no Yaiba)
  '40748': '', // Jujutsu Kaisen
  '31964': '', // My Hero Academia (Boku no Hero Academia)
  '9253': '', // Steins;Gate
  '1': '', // Cowboy Bebop
  // Add more entries like: '12345': 'https://rezka.ag/animation/...'
};

(function () {
  function getBadgesData(box) {
    let episodes = '', score = '', year = '';
    box.querySelectorAll('.badge').forEach(badge => {
      const t = badge.textContent.trim();
      if (t.includes('eps')) episodes = t.replace(' eps', '').trim();
      else if (t.includes('⭐')) score = t.replace('⭐', '').trim();
      else if (!isNaN(t)) year = t.trim();
    });
    return { episodes, score, year };
  }

  function enhanceIndexPage() {
    const boxes = document.querySelectorAll && document.querySelectorAll('.anime-box');
    if (!boxes || boxes.length === 0) return;
    boxes.forEach(box => {
      const animeId = box.dataset && box.dataset.animeId;
      const rezkaUrl = (animeId && window.rezkaMap && window.rezkaMap[animeId]) ? window.rezkaMap[animeId] : '';
      if (animeId) box.dataset.rezkaUrl = rezkaUrl || '';

      const oldBtn = box.querySelector && box.querySelector('.watch-btn');
      if (!oldBtn) return;

      // Clone to remove existing listeners (optimistic removal)
      const newBtn = oldBtn.cloneNode(true);
      newBtn.addEventListener('click', function (e) {
        e.stopPropagation();

        // Save state (same shape as existing code)
        const state = {
          searchQuery: document.getElementById('searchInput') ? document.getElementById('searchInput').value : '',
          currentLang: window.currentLang || 'en',
          scrollPos: window.scrollY,
          animeHTML: document.getElementById('animeContainer') ? document.getElementById('animeContainer').innerHTML : '',
          currentPage: window.currentPage || 1
        };
        sessionStorage.setItem('animeFoundState', JSON.stringify(state));

        // Build params from card DOM
        const title = box.querySelector('.anime-title') ? box.querySelector('.anime-title').textContent : '';
        const desc = box.querySelector('.anime-desc') ? box.querySelector('.anime-desc').textContent : '';
        const img = box.querySelector('.anime-img') ? box.querySelector('.anime-img').src : '';
        const { episodes, score, year } = getBadgesData(box);

        const params = new URLSearchParams({
          title: title || '',
          desc: desc || '',
          img: img || '',
          year: year || '',
          episodes: episodes || '',
          score: score || ''
        });

        if (rezkaUrl) {
          params.set('rezka_url', rezkaUrl);
        } else if (animeId) {
          // Fallback: pass the animeId (the anime-watch page will attempt to resolve it via window.rezkaMap)
          params.set('id', animeId);
        }

        window.location.href = `anime-watch.html?${params.toString()}`;
      });

      oldBtn.parentNode.replaceChild(newBtn, oldBtn);
    });
  }

  // On pages where cards exist
  document.addEventListener('DOMContentLoaded', () => {
    try { enhanceIndexPage(); } catch (e) { /* ignore */ }
  });

  // Expose simple helper for anime-watch page
  window.__resolveRezkaUrl = function (maybeId) {
    if (!maybeId) return '';
    if (window.rezkaMap && window.rezkaMap[maybeId]) return window.rezkaMap[maybeId];
    return '';
  };
})();
