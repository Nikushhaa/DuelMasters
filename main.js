import { gameEngine } from "./core/gameEngine.js";
import {
  initBattleUI,
  renderBattle,
  renderFullLog,
  appendLogLines,
  playHitAnimation,
} from "./ui/battleUI.js";
import { initShopUI, renderShop } from "./ui/shopUI.js";

function renderAll(state) {
  renderBattle(state);
  renderShop(state);
}

function init() {
  initBattleUI();

  initShopUI({
    onBuy: (playerKey, weaponId) =>
      gameEngine.buyWeapon(playerKey, weaponId),

    onStartRound: () => gameEngine.startRound(),

    onNextRound: () => gameEngine.nextRound(),

    onReset: () => {
      if (confirm("Reset match and clear saved progress?")) {
        gameEngine.resetMatch();
      }
    },

    onKnifeToggle: (checked) =>
      gameEngine.toggleKnifeRound(checked),
  });

  // =========================
  // ENGINE EVENTS
  // =========================

  gameEngine.on("stateChanged", (state) => {
    renderAll(state);
  });

  gameEngine.on("roundStarted", (state) => {
    renderFullLog(state.log);
  });

  gameEngine.on("shotFired", (event) => {
    playHitAnimation(event);

    const log = gameEngine.getState().log;
    appendLogLines([log[log.length - 1]]);
  });

  gameEngine.on("roundEnded", () => {
    const log = gameEngine.getState().log;
    appendLogLines([log[log.length - 1]]);
  });

  gameEngine.on("matchEnded", ({ winner }) => {
    const log = gameEngine.getState().log;
    appendLogLines([log[log.length - 1]]);

    setTimeout(() => {
      alert(
        `${winner === "p1" ? "Player 1" : "Player 2"} wins the match!`
      );
    }, 50);
  });

  // =========================
  // CONTROLS
  // =========================

  const p1Btn = document.getElementById("p1-fire-btn");
  const p2Btn = document.getElementById("p2-fire-btn");

  p1Btn?.addEventListener("click", () => gameEngine.fire("p1"));
  p2Btn?.addEventListener("click", () => gameEngine.fire("p2"));

  document.addEventListener("keydown", (e) => {
    if (e.repeat) return;

    if (e.key.toLowerCase() === "f") {
      gameEngine.fire("p1");
    }

    if (e.key.toLowerCase() === "j") {
      gameEngine.fire("p2");
    }
  });

  // =========================
  // INIT GAME (IMPORTANT FIX)
  // =========================

  setTimeout(() => {
    gameEngine.init({ maxRounds: 5 });

    // auto ensure round starts
    if (gameEngine.getState().phase === "shopping") {
      gameEngine.startRound();
    }

    renderFullLog(gameEngine.getState().log);
    renderAll(gameEngine.getState());
  }, 0);
}

document.addEventListener("DOMContentLoaded", init);