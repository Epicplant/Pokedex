/**
 * Christopher Roy
 * 05/10/2020
 * Section AK: Austin Jenchi
 * Javascript code a pokemon game. The uses a pokedex API to populate a board with pokemon
 * that you can use to fight others which you catch upon defeating.
 */

"use strict";
(function() {
  window.addEventListener("load", init);
  const POKE_IMG = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/";
  const MAX_HEALTH = 100;
  const LOW_HEALTH = 20;
  let yourPokemon;
  let globalGuid;
  let globalPid;

  /**
   * This function ensure all code activates after DOM has finished loading. Furthermore, the
   * current code in init fetches data from a pokedex API which is used for the rest of the
   * game.
   */
  function init() {
    fetch("https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/" +
          "pokedex.php?pokedex=all")
      .then(checkStatus)
      .then(resp => resp.text())
      .then(setupBoard)
      .catch(console.error);
  }

  /**
   * This function boots up the game board and displays all gen 1 pokemon (151) on a board
   * while also connecting a button to each image that shwos that pokemons data.
   * @param {Text} pokemon - A text file that contains pokemon names as well as their short names
   */
  function setupBoard(pokemon) {
    id("start-btn").addEventListener("click", playGame);
    let pokemonNames = pokemon.split("\n");
    for (let i = 0; i < pokemonNames.length; i++) {
      let names = pokemonNames[i].split(":");
      let poke = gen("img");
      poke.id = names[1];
      poke.classList.add("sprite");
      if (names[1] === "charmander" || names[1] === "bulbasaur" || names[1] === "squirtle") {
        poke.classList.add("found");
        poke.addEventListener("click", function() {
          getData(names[1]);
        });
      }
      poke.src = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/sprites/" +
      names[1] + ".png";
      poke.alt = "The pokemon " + names[0] + "in all its glory";
      id("pokedex-view").appendChild(poke);
    }
  }

  /**
   * This function is used to fetch data from a pokedex API that will then be sed
   * to fill out that specific pokemons card on the left side of the screen.
   * @param {String} pokemon - The name of the pokemon who's data is being fetched
   */
  function getData(pokemon) {
    fetch("https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/" +
    "pokedex.php?pokemon=" + pokemon)
      .then(checkStatus)
      .then(resp => resp.json())
      .then(cardSetup)
      .catch(console.error);
  }

  /**
   * This function is called when player 1's pokemon data is to be fetched and prepares
   * that pokemon for battle.
   * @param {JSON} pokeInfo - A JSON file containing all the data of a specific pokemon
   */
  function cardSetup(pokeInfo) {
    id("start-btn").classList.remove("hidden");
    yourPokemon = pokeInfo.shortname;
    data(pokeInfo, "#p1");
  }

  /**
   * This function is used to setup most of the base info for a card including health, name,
   * weakness, etc..
   * @param {JSON} pokeInfo - This pokemons info stored in JSON
   * @param {String} cardType - Either #p1 or #p2, determines which card is being filled out.
   */
  function setCard(pokeInfo, cardType) {
    qs(cardType + " .name").textContent = pokeInfo.name;
    qs(cardType + " .pokepic").src = POKE_IMG + pokeInfo.images.photo;
    qs(cardType + " .type").src = POKE_IMG + pokeInfo.images.typeIcon;
    qs(cardType + " .weakness").src = POKE_IMG + pokeInfo.images.weaknessIcon;
    qs(cardType + " .hp").textContent = pokeInfo.hp + "HP";
    qs(cardType + " .info").textContent = pokeInfo.info.description;
  }

  /**
   * The primary function for filling out a pokemons card. This function primarily sets up the move
   * buttons for a card along with its image.
   * @param {JSON} pokeInfo - This pokemons info stored in JSON
   * @param {String} cardType - Either #p1 or #p2, determines which card is being filled out.
   */
  function data(pokeInfo, cardType) {
    setCard(pokeInfo, cardType);
    let pokeMoves = qs(cardType + " .moves").children;
    for (let i = 0; i < pokeMoves.length; i++) {
      if (pokeInfo.moves[i]) {
        if (pokeInfo.moves[i].dp) {
          pokeMoves[i].querySelector(".dp").textContent = pokeInfo.moves[i].dp + " DP";
        } else {
          pokeMoves[i].querySelector(".dp").textContent = "";
        }
        pokeMoves[i].classList.remove("hidden");
        pokeMoves[i].querySelector(".move").textContent = pokeInfo.moves[i].name;
        pokeMoves[i].querySelector("img").src = POKE_IMG +
                                          "icons/" + pokeInfo.moves[i].type + ".jpg";
      } else {
        pokeMoves[i].classList.add("hidden");
      }
    }
  }

  /**
   * This function sets up the battleboard and hides the starterboard. Furthermore, a post
   * request is made to get data for a randomly selected enemy pokemon for you to fight.
   */
  function playGame() {
    id("pokedex-view").classList.add("hidden");
    id("p2").classList.remove("hidden");
    qs("#p1 .hp-info").classList.remove("hidden");
    id("results-container").classList.remove("hidden");
    id("flee-btn").classList.remove("hidden");
    let moves = qs("#p1 .moves").children;
    for (let i = 0; i < moves.length; i++) {
      moves[i].disabled = false;
    }
    qs("h1").textContent = "Pokemon Battle Mode!";

    let formData = new FormData();
    formData.append("startgame", "true");
    formData.append("mypokemon", yourPokemon);

    gamePost(formData);
  }

  /**
   * A function that changes a players hp based on the move that was made and the players
   * health percentage. Also manipulates hp display directly.
   * @param {JSON} pokeInfo - This pokemons info stored in JSON
   */
  function manipulateHpBar(pokeInfo) {
    let p1hp = pokeInfo.p1["current-hp"];
    let p2hp = pokeInfo.p2["current-hp"];
    qs("#p1 .hp").textContent = p1hp + "HP";
    qs("#p2 .hp").textContent = p2hp + "HP";

    setHP("p1", pokeInfo);
    setHP("p2", pokeInfo);

    if (p1hp === 0) {
      endGame("lost", pokeInfo);
    } else if (p2hp === 0) {
      endGame("won", pokeInfo);
    }
  }

  /**
   * This function calculates hp primarily and determines whether a game is lost or won.
   * Furthermore, this function is responsible for recording all actions made by both players.
   * @param {JSON} pokeInfo - This pokemons info stored in JSON
   */
  function stateOfTheGame(pokeInfo) {
    id("loading").classList.add("hidden");
    id("p1-turn-results").classList.remove("hidden");
    id("p2-turn-results").classList.remove("hidden");
    id("p1-turn-results").textContent = "Player 1 played " +
    pokeInfo.results["p1-move"] + " and " + pokeInfo.results["p1-result"];
    if (pokeInfo.results["p2-result"]) {
      id("p2-turn-results").textContent = "Player 2 played " +
      pokeInfo.results["p2-move"] + " and " + pokeInfo.results["p2-result"];
    } else {
      id("p2-turn-results").textContent = "";
    }
    manipulateHpBar(pokeInfo);
  }

  /**
   * This function activates all move buttons while also being the primary function
   * for all gameplay interactions (i.e. health changes, etc.).
   * @param {JSON} pokeInfo - This pokemons info stored in JSON
   */
  function gamePlay(pokeInfo) {
    globalGuid = pokeInfo.guid;
    globalPid = pokeInfo.pid;
    if (!id("loading").classList.contains("hidden")) {
      stateOfTheGame(pokeInfo);
    } else {
      id("start-btn").classList.add("hidden");
      data(pokeInfo.p2, "#p2");
      let allMoves = qs("#p1 .moves").children;
      for (let i = 0; i < allMoves.length; i++) {
        allMoves[i].disabled = false;
        allMoves[i].addEventListener("click", makeAMove);
      }
      id("flee-btn").addEventListener("click", makeAMove);
    }
  }

  /**
   * This function changes the hp bar of a pokemon (either p1 or p2) while also
   * updating the bar depending on whether it is below .20 or not.
   * @param {String} player - Either p1 or p2 determines whose health changes.
   * @param {JSON} pokeInfo - p1 & p2 info stored in JSON
   */
  function setHP(player, pokeInfo) {
    let HealthBar = pokeInfo[player]["current-hp"] / pokeInfo[player]["hp"];
    if ((HealthBar * MAX_HEALTH) < LOW_HEALTH) {
      qs("#" + player + " .hp-info div").classList.add("low-health");
    }
    qs("#" + player + " .hp-info div").style.width = "" + (HealthBar * MAX_HEALTH) + "%";
  }

  /**
   * This function changes the game based on whether player one won or lost while also
   * hiding buttons such as the flee btn and disabling all other buttons. Makes it so when
   * endgame button is pressed the board resets and adds class found to enemy if player one wins.
   * @param {String} state - Either string "won" or string "lost". Determines the fate of the game.
   * @param {JSON} pokeInfo - This pokemons info stored in JSON
   */
  function endGame(state, pokeInfo) {

    if (state === "won") {
      qs("#p2 .hp-info div").style.width = "0%";
      qs("h1").textContent = "You won!";
      id(pokeInfo.p2.shortname).addEventListener("click", function() {
        getData(pokeInfo.p2.shortname);
      });
      id(pokeInfo.p2.shortname).classList.add("found");
    } else {
      qs("#p1 .hp-info div").style.width = "0%";
      qs("h1").textContent = "You lost!";
    }
    id("endgame").classList.remove("hidden");
    id("flee-btn").classList.add("hidden");
    let p1Buttons = qsa("#p1 .moves button");
    for (let i = 0; i < p1Buttons.length; i++) {
      p1Buttons[i].disabled = true;
    }
    id("endgame").addEventListener("click", function() {
      reset(pokeInfo);
    });
  }

  /**
   * This function resets the board by hiding the gameboard and revealing the starterboard.
   * Hp among other changed values are reset.
   * @param {JSON} pokeInfo - This pokemons info stored in JSON
   */
  function reset(pokeInfo) {
    qs("#p1 .hp-info .health-bar").style.width = "100%";
    qs("#p2 .hp-info .health-bar").style.width = "100%";
    let pokeMoves = qs("#p1 .moves button").children;
    for (let i = 0; i < pokeMoves.length; i++) {
      pokeMoves[i].disabled = true;
    }
    id("endgame").classList.add("hidden");
    qs("#p1 .hp-info div").classList.remove("low-health");
    qs("#p2 .hp-info div").classList.remove("low-health");
    id("results-container").classList.add("hidden");
    id("p1-turn-results").textContent = "";
    id("p2-turn-results").textContent = "";
    id("p2").classList.add("hidden");
    qs("#p1 .hp-info").classList.add("hidden");
    id("start-btn").classList.remove("hidden");
    qs("h1").textContent = "Your Pokedex";
    qs("#p1 .hp").textContent = pokeInfo.p1.hp;
    id("pokedex-view").classList.remove("hidden");
  }

  /**
   * This function is called whenever a move button is clicked in combat. Once a button is pressed.
   * the function deduces what action was made then makes a POST request based on guid, pid, and
   * the move made.
   */
  function makeAMove() {
    id("loading").classList.remove("hidden");
    let trueMove;
    if (this.children.length === 0) {
      trueMove = "flee";
    } else {
      trueMove = (this.children[0].textContent).toLowerCase();
      trueMove = trueMove.replace(/ /g, "");
    }
    let formData = new FormData();
    formData.append("guid", globalGuid);
    formData.append("pid", globalPid);
    formData.append("movename", trueMove);
    gamePost(formData);
  }

  /**
   * This function checks a promises status and depending on whether there is a resolved or
   * rejected state it will accordingly return the response or throw an error.
   * @param {Promise} response - A promise from a fetch which, in thise case, contains
   * data from the last.fm API.
   * @return {Promise} response - Returns the inputted parameter if there was no error
   * @throw {Error} error - A thrown error in string format
   */
  function checkStatus(response) {
    if (response.ok) {
      return response;
    }
    throw Error("Error in request: " + response.statusText);
  }

  /**
   * This function makes a post request and returns game data. This data changes throughout
   * the game based on what move is pressed
   * @param {Form} formData - A form containing information that will be submittd to a server
   * through post
   */
  function gamePost(formData) {
    let URL = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/game.php";
    fetch(URL, {
      method: "POST",
      body: formData
    })
      .then(checkStatus)
      .then(resp => resp.json())
      .then(gamePlay)
      .catch(console.error);
  }

  /**
   * This function accepts an id name and gets said elemeny from the html page index.html.
   * @param {String} idName - A name of an elements id in index.html.
   * @return {Element} - Returns an element with a specific ID.
   */
  function id(idName) {
    return document.getElementById(idName);
  }

  /**
   * This function accepts an element type and gets said list of elements from the
   * html page index.html.
   * @param {String} qsaName - A name of a list of elements in index.html.
   * @return {Element} qsa - Returns a list of a type of element.
   */
  function qsa(qsaName) {
    return document.querySelectorAll(qsaName);
  }

  /**
   * This function accepts the name of an element type and then creates it.
   * @param {String} elName - The name of an element that is to be created.
   * @return {Element} gen - Returns a newly created element.
   */
  function gen(elName) {
    return document.createElement(elName);
  }

  /**
   * This function accepts the name of an element type and returns the first found instance of it.
   * @param {String} qsName - The name of the element you wish to gain access to.
   * @return {Element} qs - Returns a newly created reference to the first instance of
   * a specific element.
   */
  function qs(qsName) {
    return document.querySelector(qsName);
  }

})();