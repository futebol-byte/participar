// ============================================================
// CONFIGURAÇÃO GERAL
// ============================================================
const TOTAL_VAGAS = 12;
const VAGAS_POR_TIME = { goleiro: 1, jogadores: 5 };
const COLLECTION_NAME = "participantes";

const els = {
  form: document.getElementById("confirmForm"),
  nome: document.getElementById("nome"),
  posicao: document.getElementById("posicao"),
  submitBtn: document.getElementById("submitBtn"),
  formMsg: document.getElementById("formMsg"),
  filledCount: document.getElementById("filledCount"),
  lotadaBanner: document.getElementById("lotadaBanner"),
  gridAzul: document.getElementById("grid-azul"),
  gridVermelho: document.getElementById("grid-vermelho"),
  waitlistSection: document.getElementById("waitlistSection"),
  waitlistItems: document.getElementById("waitlistItems"),
};

let isFull = false; // updated on every snapshot, gates submissions client-side

// ============================================================
// MONTAGEM DOS TIMES A PARTIR DA LISTA ORDENADA POR CHEGADA
// ============================================================
function montarTimes(participantes) {
  const times = {
    azul: { goleiro: null, jogadores: [] },
    vermelho: { goleiro: null, jogadores: [] },
  };
  const filaDeEspera = [];

  for (const p of participantes) {
    if (p.posicao === "Goleiro") {
      if (!times.azul.goleiro) {
        times.azul.goleiro = p;
      } else if (!times.vermelho.goleiro) {
        times.vermelho.goleiro = p;
      } else {
        filaDeEspera.push(p);
      }
    } else {
      const azulCheio = times.azul.jogadores.length >= VAGAS_POR_TIME.jogadores;
      const vermelhoCheio = times.vermelho.jogadores.length >= VAGAS_POR_TIME.jogadores;

      if (azulCheio && vermelhoCheio) {
        filaDeEspera.push(p);
      } else if (azulCheio) {
        times.vermelho.jogadores.push(p);
      } else if (vermelhoCheio) {
        times.azul.jogadores.push(p);
      } else if (times.azul.jogadores.length <= times.vermelho.jogadores.length) {
        times.azul.jogadores.push(p);
      } else {
        times.vermelho.jogadores.push(p);
      }
    }
  }

  return { times, filaDeEspera };
}

function contarPreenchidas(times) {
  return (
    (times.azul.goleiro ? 1 : 0) +
    (times.vermelho.goleiro ? 1 : 0) +
    times.azul.jogadores.length +
    times.vermelho.jogadores.length
  );
}

// ============================================================
// RENDERIZAÇÃO
// ============================================================
function formatarHora(timestamp) {
  if (!timestamp || !timestamp.toDate) return "agora";
  const data = timestamp.toDate();
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function jerseyHTML({ numero, cor, pessoa, role, isGoleiro }) {
  const preenchida = Boolean(pessoa);
  const classes = ["jersey", cor, preenchida ? "filled" : "empty"];
  if (isGoleiro) classes.push("goleiro-slot");

  const nome = preenchida ? escapeHTML(pessoa.nome) : "Vaga livre";
  const hora = preenchida ? formatarHora(pessoa.timestamp) : "";

  return `
    <div class="${classes.join(" ")}">
      <span class="jersey-num">${numero}</span>
      <span class="jersey-role">${role}</span>
      <span class="jersey-name">${nome}</span>
      ${hora ? `<span class="jersey-time">${hora}</span>` : ""}
    </div>
  `;
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function renderTime(container, cor, timeData) {
  let html = jerseyHTML({
    numero: 1,
    cor,
    pessoa: timeData.goleiro,
    role: "Goleiro",
    isGoleiro: true,
  });

  for (let i = 0; i < VAGAS_POR_TIME.jogadores; i++) {
    html += jerseyHTML({
      numero: i + 2,
      cor,
      pessoa: timeData.jogadores[i] || null,
      role: "Linha",
      isGoleiro: false,
    });
  }

  container.innerHTML = html;
}

function renderFilaDeEspera(fila) {
  if (fila.length === 0) {
    els.waitlistSection.hidden = true;
    return;
  }
  els.waitlistSection.hidden = false;
  els.waitlistItems.innerHTML = fila
    .map(
      (p) => `
      <li>
        <span>${escapeHTML(p.nome)} · ${escapeHTML(p.posicao)}</span>
        <span>${formatarHora(p.timestamp)}</span>
      </li>`
    )
    .join("");
}

function renderTudo(participantes) {
  const { times, filaDeEspera } = montarTimes(participantes);
  const preenchidas = contarPreenchidas(times);

  renderTime(els.gridAzul, "azul", times.azul);
  renderTime(els.gridVermelho, "vermelho", times.vermelho);
  renderFilaDeEspera(filaDeEspera);

  els.filledCount.textContent = preenchidas;

  isFull = preenchidas >= TOTAL_VAGAS;
  els.lotadaBanner.hidden = !isFull;

  els.nome.disabled = isFull;
  els.posicao.disabled = isFull;
  els.submitBtn.disabled = isFull;
  els.submitBtn.textContent = isFull ? "Partida lotada" : "Já fiz o pagamento";
}

// ============================================================
// SINCRONIZAÇÃO EM TEMPO REAL COM O FIRESTORE
// ============================================================
db.collection(COLLECTION_NAME)
  .orderBy("timestamp", "asc")
  .onSnapshot(
    (snapshot) => {
      const participantes = snapshot.docs.map((doc) => doc.data());
      renderTudo(participantes);
    },
    (erro) => {
      console.error("Erro ao sincronizar lista:", erro);
      setFormMsg("Não foi possível carregar a lista em tempo real. Recarregue a página.", "error");
    }
  );

// ============================================================
// ENVIO DO FORMULÁRIO
// ============================================================
function setFormMsg(texto, tipo) {
  els.formMsg.textContent = texto;
  els.formMsg.className = "form-msg" + (tipo ? " " + tipo : "");
}

els.form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (isFull) {
    setFormMsg("Partida lotada — não é possível confirmar mais presenças.", "error");
    return;
  }

  const nome = els.nome.value.trim();
  const posicao = els.posicao.value;

  if (!nome) {
    setFormMsg("Digite seu nome.", "error");
    return;
  }
  if (!posicao) {
    setFormMsg("Selecione sua posição.", "error");
    return;
  }

  els.submitBtn.disabled = true;
  els.submitBtn.textContent = "Confirmando...";
  setFormMsg("", "");

  try {
    await db.collection(COLLECTION_NAME).add({
      nome,
      posicao,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });

    els.form.reset();
    setFormMsg("Presença confirmada! Seu nome já aparece na lista abaixo para todo mundo.", "success");
  } catch (erro) {
    console.error("Erro ao confirmar presença:", erro);
    setFormMsg("Erro ao confirmar. Tente novamente em instantes.", "error");
  } finally {
    if (!isFull) {
      els.submitBtn.disabled = false;
      els.submitBtn.textContent = "Já fiz o pagamento";
    }
  }
});
