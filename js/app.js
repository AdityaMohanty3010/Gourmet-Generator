const RAPIDAPI_KEY = "18ce297497msh72abc077c3d9891p190415jsneadb68c0e692";
document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const ingredientInput = document.getElementById("ingredient-input");
  const generateBtn = document.getElementById("generate-btn");
  const recipeList = document.getElementById("recipe-list");
  const searchHistoryList = document.getElementById("search-history-list");
  const favoritesList = document.getElementById("favorites-list");
  const clearHistoryBtn = document.getElementById("clear-history-btn");
  const clearFavoritesBtn = document.getElementById("clear-favorites-btn");
  const recipeModal = document.getElementById("recipe-modal");
  const modalRecipeContent = document.getElementById("modal-recipe-content");
  const closeModalBtn = document.getElementById("close-modal");
  const addToFavoritesBtn = document.getElementById("add-to-favorites");
  const toast = document.getElementById("toast");

  // Retrieve stored data
  let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  let currentRecipe = null;

  // --- Toast Notification Function ---
  function showToast(message) {
    toast.textContent = message;
    toast.style.opacity = "1";
    setTimeout(() => {
      toast.style.opacity = "0";
    }, 3000);
  }

  // --- Search History Functions ---
  function saveSearchTerm(term) {
    let history = JSON.parse(localStorage.getItem("searchHistory")) || [];
    if (!history.some(t => t.toLowerCase() === term.toLowerCase())) {
      history.push(term);
      localStorage.setItem("searchHistory", JSON.stringify(history));
      loadSearchHistory();
    }
  }

  function loadSearchHistory() {
    searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];
    displaySearchHistory();
  }

  function displaySearchHistory() {
    searchHistoryList.innerHTML = "";
    if (searchHistory.length === 0) {
      searchHistoryList.innerHTML = "<p>No search history yet.</p>";
      return;
    }
    searchHistory.forEach(term => {
      const termDiv = document.createElement("div");
      termDiv.classList.add("history-item");
      termDiv.textContent = term;
      termDiv.addEventListener("click", () => {
        ingredientInput.value = term;
        fetchRecipes(term);
      });
      searchHistoryList.appendChild(termDiv);
    });
  }

  function clearSearchHistory() {
    if (confirm("Are you sure you want to clear the search history?")) {
      localStorage.removeItem("searchHistory");
      searchHistory = [];
      displaySearchHistory();
      showToast("Search history cleared.");
    }
  }

  // --- Favorites Functions ---
  function loadFavorites() {
    favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    displayFavorites();
  }

  function displayFavorites() {
    favoritesList.innerHTML = "";
    if (favorites.length === 0) {
      favoritesList.innerHTML = "<p>No favorites added yet.</p>";
      return;
    }
    favorites.forEach(recipe => {
      const favDiv = document.createElement("div");
      favDiv.classList.add("favorite-item");
      favDiv.innerHTML = `
        <img src="${recipe.thumbnail_url}" alt="${recipe.name}">
        <h5>${recipe.name}</h5>
      `;
      favDiv.addEventListener("click", () => {
        openModal(recipe);
      });
      favoritesList.appendChild(favDiv);
    });
  }

  function addFavorite(recipe) {
    let favs = JSON.parse(localStorage.getItem("favorites")) || [];
    if (favs.some(fav => fav.id === recipe.id)) {
      showToast("Already in favorites");
      return;
    }
    favs.push(recipe);
    localStorage.setItem("favorites", JSON.stringify(favs));
    loadFavorites();
    showToast("Recipe added to favorites!");
  }

  function removeFavorite(recipe) {
    let favs = JSON.parse(localStorage.getItem("favorites")) || [];
    favs = favs.filter(fav => fav.id !== recipe.id);
    localStorage.setItem("favorites", JSON.stringify(favs));
    loadFavorites();
    showToast("Recipe removed from favorites!");
  }

  function clearFavorites() {
    if (confirm("Are you sure you want to clear all favorites?")) {
      localStorage.removeItem("favorites");
      favorites = [];
      displayFavorites();
      showToast("All favorites cleared.");
    }
  }

  // --- Recipe Fetch & Display Functions ---
  function fetchRecipes(input) {
    const query = encodeURIComponent(input);
    recipeList.innerHTML = "<p>Loading recipes...</p>";
    
    const url = `https://tasty.p.rapidapi.com/recipes/list?from=0&size=5&q=${query}`;
    
    fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-host": "tasty.p.rapidapi.com",
        "x-rapidapi-key": RAPIDAPI_KEY
      }
    })
      .then(response => response.json())
      .then(data => {
        if (!data.results || data.results.length === 0) {
          recipeList.innerHTML = `<p>No recipes found for "${input}".</p>`;
          return;
        }
        displayRecipesList(data.results);
      })
      .catch(error => {
        console.error("Error fetching recipes:", error);
        recipeList.innerHTML = "<p>Error loading recipes. Please try again.</p>";
      });
  }

  function displayRecipesList(recipes) {
    recipeList.innerHTML = "";
    recipes.forEach(recipe => {
      const itemDiv = document.createElement("div");
      itemDiv.classList.add("recipe-item");
      itemDiv.innerHTML = `
        <img src="${recipe.thumbnail_url}" alt="${recipe.name}">
        <h4>${recipe.name}</h4>
      `;
      itemDiv.addEventListener("click", () => {
        openModal(recipe);
      });
      recipeList.appendChild(itemDiv);
    });
  }

  // --- Modal & Recipe Details Functions ---
  function openModal(recipe) {
    console.log("Opening modal for recipe:", recipe);
    currentRecipe = recipe;
    if (!recipe.id) {
      console.error("Recipe ID is missing. Cannot fetch details.");
      modalRecipeContent.innerHTML = `
        <h3>${recipe.name}</h3>
        <img src="${recipe.thumbnail_url}" alt="${recipe.name}">
        <p>No detailed information available.</p>
      `;
      addToFavoritesBtn.textContent = "Add to Favorites";
      recipeModal.style.display = "block";
      return;
    }
    
    const detailUrl = `https://tasty.p.rapidapi.com/recipes/get-more-info?id=${recipe.id}`;
    
    fetch(detailUrl, {
      method: "GET",
      headers: {
        "x-rapidapi-host": "tasty.p.rapidapi.com",
        "x-rapidapi-key": RAPIDAPI_KEY
      }
    })
      .then(response => response.json())
      .then(details => {
        let instructionsHtml = "";
        if (details.instructions && details.instructions.length > 0) {
          instructionsHtml = `<ol>${details.instructions.map(step => `<li>${step.display_text}</li>`).join("")}</ol>`;
        } else {
          instructionsHtml = "<p>No instructions available.</p>";
        }

        const favs = JSON.parse(localStorage.getItem("favorites")) || [];
        const isFavorite = favs.some(fav => fav.id === recipe.id);
        const favButtonLabel = isFavorite ? "Remove from Favorites" : "Add to Favorites";

        modalRecipeContent.innerHTML = `
          <img src="${recipe.thumbnail_url}" alt="${recipe.name}">
          <h3>${recipe.name}</h3>
          <p><strong>Description:</strong> ${recipe.description || "No description available."}</p>
          <h4>Instructions:</h4>
          ${instructionsHtml}
        `;
        addToFavoritesBtn.textContent = favButtonLabel;

        addToFavoritesBtn.onclick = () => {
          if (isFavorite) {
            removeFavorite(recipe);
          } else {
            addFavorite(recipe);
          }
          openModal(recipe);
        };

        recipeModal.style.display = "block";
      })
      .catch(error => {
        console.error("Error fetching recipe details:", error);
        modalRecipeContent.innerHTML = `
          <h3>${recipe.name}</h3>
          <img src="${recipe.thumbnail_url}" alt="${recipe.name}">
          <p>No detailed instructions available.</p>
        `;
        addToFavoritesBtn.textContent = "Add to Favorites";
        addToFavoritesBtn.onclick = () => {
          addFavorite(recipe);
          openModal(recipe);
        };
        recipeModal.style.display = "block";
      });
  }

  function shareRecipe(recipe) {
    const recipeText = `
Recipe: ${recipe.name}
Description: ${recipe.description || "No description available."}
    `;
    navigator.clipboard.writeText(recipeText)
      .then(() => showToast("Recipe details copied!"))
      .catch(err => {
        console.error("Error copying to clipboard:", err);
        showToast("Failed to copy recipe details.");
      });
  }

  // --- Modal Close Handling ---
  closeModalBtn.addEventListener("click", () => {
    recipeModal.style.display = "none";
  });
  
  window.addEventListener("click", (event) => {
    if (event.target === recipeModal) {
      recipeModal.style.display = "none";
    }
  });

  // --- Event Listeners for Input Actions ---
  generateBtn.addEventListener("click", () => {
    const ingredient = ingredientInput.value.trim();
    if (!ingredient) {
      showToast("Please enter at least one ingredient!");
      return;
    }
    saveSearchTerm(ingredient);
    fetchRecipes(ingredient);
    ingredientInput.value = "";
  });

  clearHistoryBtn.addEventListener("click", clearSearchHistory);
  clearFavoritesBtn.addEventListener("click", clearFavorites);

  // --- Load Stored Data on Page Load ---
  loadSearchHistory();
  loadFavorites();
});
