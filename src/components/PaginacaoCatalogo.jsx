function PaginacaoCatalogo({
  paginaAtual,
  totalPaginas,
  onAnterior,
  onProxima,
  onSelecionarPagina,
}) {
  if (totalPaginas <= 1) {
    return null;
  }

  const disabledAnterior =
    paginaAtual === 1;

  const disabledProxima =
    paginaAtual === totalPaginas;

  const criarPaginasVisiveis = () => {
    if (totalPaginas <= 5) {
      return Array.from(
        { length: totalPaginas },
        (_, index) => index + 1
      );
    }

    if (paginaAtual <= 3) {
      return [
        1,
        2,
        3,
        4,
        "...",
        totalPaginas,
      ];
    }

    if (paginaAtual >= totalPaginas - 2) {
      return [
        1,
        "...",
        totalPaginas - 3,
        totalPaginas - 2,
        totalPaginas - 1,
        totalPaginas,
      ];
    }

    return [
      1,
      "...",
      paginaAtual - 1,
      paginaAtual,
      paginaAtual + 1,
      "...",
      totalPaginas,
    ];
  };

  const paginasVisiveis =
    criarPaginasVisiveis();

  return (
    <div style={paginationWrapper}>
      <div style={paginationBox}>
        <button
          type="button"
          onClick={onAnterior}
          disabled={disabledAnterior}
          style={{
            ...paginationButton,
            color: disabledAnterior
              ? "#cbd0d6"
              : "#5f6b7a",
            cursor: disabledAnterior
              ? "not-allowed"
              : "pointer",
            background: disabledAnterior
              ? "#fafafa"
              : "white",
          }}
        >
          ‹
        </button>

        {paginasVisiveis.map((pagina, index) => {
          if (pagina === "...") {
            return (
              <div
                key={`ellipsis-${index}`}
                style={paginationEllipsis}
              >
                ...
              </div>
            );
          }

          const ativa =
            Number(pagina) === Number(paginaAtual);

          return (
            <button
              key={pagina}
              type="button"
              onClick={() =>
                onSelecionarPagina(Number(pagina))
              }
              style={{
                ...paginationButton,
                background: ativa
                  ? "#e8edf3"
                  : "white",
                color: ativa
                  ? "#1f2937"
                  : "#667085",
                borderColor: ativa
                  ? "#d6dce4"
                  : "transparent",
                fontWeight: ativa ? 700 : 500,
                cursor: "pointer",
              }}
            >
              {pagina}
            </button>
          );
        })}

        <div style={paginationCounter}>
          {paginaAtual}/{totalPaginas}
        </div>

        <button
          type="button"
          onClick={onProxima}
          disabled={disabledProxima}
          style={{
            ...paginationButton,
            color: disabledProxima
              ? "#cbd0d6"
              : "#5f6b7a",
            cursor: disabledProxima
              ? "not-allowed"
              : "pointer",
            background: disabledProxima
              ? "#fafafa"
              : "white",
          }}
        >
          ›
        </button>
      </div>
    </div>
  );
}

const paginationWrapper = {
  display: "flex",
  justifyContent: "center",
  marginTop: 24,
  marginBottom: 24,
};

const paginationBox = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  background: "white",
  border: "1px solid #dfe3e8",
  borderRadius: 9,
  padding: 5,
  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
};

const paginationButton = {
  width: 34,
  height: 32,
  border: "1px solid transparent",
  borderRadius: 6,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  lineHeight: 1,
  padding: 0,
  transition:
    "background-color 0.15s ease, border-color 0.15s ease",
};

const paginationEllipsis = {
  width: 30,
  height: 32,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#8a94a3",
  fontSize: 13,
};

const paginationCounter = {
  minWidth: 42,
  padding: "0 6px",
  textAlign: "center",
  color: "#667085",
  fontSize: 12,
  fontWeight: 500,
};

export default PaginacaoCatalogo;