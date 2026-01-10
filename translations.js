const translations = {
  ru: {
    // Header & Navigation
    search: "Поиск аниме...",
    profile: "Профиль",
    randomizer: "Рандомайзер",
    game: "Угадай аниме",
    more: "Ещё",
    back: "← Назад",
    
    // Index page
    noResults: "Ничего не найдено.",
    loading: "Загрузка...",
    loadMore: "Показать ещё",
    watchAnime: "Смотреть аниме",
    
    // Anime watch page
    description: "Описание",
    year: "Год",
    episodes: "Эпизоды",
    score: "Рейтинг",
    studio: "Студия",
    type: "Тип",
    status: "Статус",
    season: "Сезон",
    genres: "Жанры",
    noDescription: "Описание отсутствует.",
    
    // Randomizer
    getRandom: "Рандомное аниме",
    watched: "Смотрел",
    notWatched: "Не смотрел",
    lives: "Жизней",
    settings: "Настройки",
    noAnimeFound: "Аниме не найдено",
    restartRound: "Начать раунд заново",
    notWatchedTitle: "Ты не смотрел аниме",
    
    // Game pages
    gameTitle: "Угадай аниме",
    gameYesBtn: "Смотрел",
    gameNoBtn: "Не смотрел",
    gameScore: "Очки",
    gameRestart: "Начать заново",
    haveForgotten: "Забыл аниме",
    
    // Footer
    copyright: "© 2025 AnimeFound"
  },
  en: {
    // Header & Navigation
    search: "Search anime...",
    profile: "Profile",
    randomizer: "Randomizer",
    game: "Guess Anime",
    more: "More",
    back: "← Back",
    
    // Index page
    noResults: "No results found.",
    loading: "Loading...",
    loadMore: "Load More",
    watchAnime: "Watch Anime",
    
    // Anime watch page
    description: "Description",
    year: "Year",
    episodes: "Episodes",
    score: "Rating",
    studio: "Studio",
    type: "Type",
    status: "Status",
    season: "Season",
    genres: "Genres",
    noDescription: "No description available.",
    
    // Randomizer
    getRandom: "Get Random Anime",
    watched: "Watched",
    notWatched: "Not Watched",
    lives: "Lives",
    settings: "Settings",
    noAnimeFound: "No anime found",
    restartRound: "Start a new round",
    notWatchedTitle: "You haven't watched these anime",
    
    // Game pages
    gameTitle: "Guess Anime",
    gameYesBtn: "Watched",
    gameNoBtn: "Haven't watched",
    gameScore: "Score",
    gameRestart: "Start over",
    haveForgotten: "Forgotten anime",
    
    // Footer
    copyright: "© 2025 AnimeFound"
  }
};

let currentLang = localStorage.getItem('language') || 'ru';

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('language', lang);
  updatePageLanguage();
}

function t(key) {
  return translations[currentLang][key] || translations['ru'][key] || key;
}

function updatePageLanguage() {
  // Получаем все элементы с атрибутом data-i18n
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    element.textContent = t(key);
  });
  
  // Получаем все input placeholders с атрибутом data-i18n-placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    element.placeholder = t(key);
  });
  
  // Обновляем язык html элемента
  document.documentElement.lang = currentLang;
}

document.addEventListener('DOMContentLoaded', updatePageLanguage);
