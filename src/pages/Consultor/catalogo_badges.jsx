import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Button,
  Form,
  Spinner,
} from "react-bootstrap";

import {
  HiOutlineArrowLeft,
} from "react-icons/hi";

import {
  BiMedal,
} from "react-icons/bi";

import {
  useNavigate,
} from "react-router-dom";

import Header from
  "../../components/Header.jsx";

import RightSidebar from
  "../../components/RightSidebar.jsx";

import LeftSidebar from
  "../../components/LeftSidebar.jsx";

import BadgeImage from
  "../../components/badge_image.jsx";

import api from
  "../../services/api.js";

import {
  obterBonusBadge,
  removerBadgesDuplicados,
} from "../../utils/badgeBonus.js";

import useCandidaturasRealtime from
  "../../hooks/useCandidaturasRealtime.js";

function CatalogoBadgesPage() {
  const navigate =
    useNavigate();

  const [
    badges,
    setBadges,
  ] = useState([]);

  const [
    conquistados,
    setConquistados,
  ] = useState([]);

  const [
    pendentes,
    setPendentes,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    userId,
    setUserId,
  ] = useState(null);

  const [
    pesquisa,
    setPesquisa,
  ] = useState("");

  const [
    areaFiltro,
    setAreaFiltro,
  ] = useState("");

  const [
    nivelFiltro,
    setNivelFiltro,
  ] = useState("");

  const [
    ordenacaoArea,
    setOrdenacaoArea,
  ] = useState("az");

  const [
    paginaAtual,
    setPaginaAtual,
  ] = useState(1);

  const [
    mensagensRealtime,
    setMensagensRealtime,
  ] = useState({});

  const badgesPorPagina = 5;

  /*
   * Carrega:
    * - catálogo;
   * - badges conquistados;
   * - candidaturas pendentes.
   *
    * Esta função também é usada quando
    * chega uma atualização Socket.IO.
   */
  const carregarCatalogo =
    useCallback(
      async (
        idUtilizador,
        {
          silencioso = false,
        } = {}
      ) => {
        const id =
          Number(idUtilizador);

        if (
          !Number.isInteger(id) ||
          id <= 0
        ) {
          return;
        }

        if (!silencioso) {
          setLoading(true);
        }

        try {
          const [
            todosResponse,
            conquistadosResponse,
            pendentesResponse,
          ] = await Promise.all([
            api.get(
              "/badges/todos"
            ),

            api.get(
              `/badges/conquistados/${id}`
            ),

            api.get(
              `/certificados/pendentes/${id}`
            ),
          ]);

          const listaTodos =
            removerBadgesDuplicados(
              Array.isArray(
                todosResponse.data
              )
                ? todosResponse.data
                : []
            );

          const listaConquistados =
            removerBadgesDuplicados(
              Array.isArray(
                conquistadosResponse.data
              )
                ? conquistadosResponse.data
                : []
            );

          const listaPendentes =
            Array.isArray(
              pendentesResponse.data
            )
              ? pendentesResponse.data
              : [];

          setBadges(
            listaTodos
          );

          setConquistados(
            listaConquistados
          );

          setPendentes(
            listaPendentes
          );
        } catch (err) {
          console.error(
            "[CATÁLOGO] Erro ao carregar:",
            err
          );

          if (!silencioso) {
            setMensagensRealtime(
              {
                _erro_catalogo:
                  "Não foi possível carregar o catálogo de badges.",
              }
            );
          }
        } finally {
          if (!silencioso) {
            setLoading(false);
          }
        }
      },
      []
    );

  /*
       * Obtém o utilizador autenticado.
   */
  useEffect(() => {
    const storedUser =
      localStorage.getItem(
        "user"
      );

    if (!storedUser) {
      navigate(
        "/login",
        {
          replace: true,
        }
      );

      return;
    }

    try {
      const userData =
        JSON.parse(
          storedUser
        );

      const id =
        Number(
          userData.id_utilizador ||
          userData.ID_UTILIZADOR
        );

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        navigate(
          "/login",
          {
            replace: true,
          }
        );

        return;
      }

      setUserId(id);

      carregarCatalogo(id);
    } catch (err) {
      console.error(
        "[CATÁLOGO] Utilizador inválido:",
        err
      );

      navigate(
        "/login",
        {
          replace: true,
        }
      );
    }
  }, [
    navigate,
    carregarCatalogo,
  ]);

  /*
   * Quando o backend informa que uma
   * candidatura mudou de estado:
   *
   * 1. apresenta a mensagem;
   * 2. volta a carregar os dados oficiais.
   */
  const tratarAtualizacaoRealtime =
    useCallback(
      async (evento) => {
        console.log(
          "[CATÁLOGO] Evento recebido:",
          evento
        );

        const badgeId =
          Number(
            evento?.id_badge_modelo
          );

        /*
          * Só coloca a mensagem no card
        * quando o evento identifica
        * corretamente o badge.
        */
        if (
          Number.isInteger(
            badgeId
          ) &&
          badgeId > 0
        ) {
          setMensagensRealtime(
            (anteriores) => ({
              ...anteriores,

              [badgeId]:
                evento?.mensagem ||
                "O estado desta candidatura foi atualizado.",
            })
          );
        }

        /*
        * Atualiza os dados oficiais:
        * pendentes, conquistados e estados.
        */
        if (userId) {
          await carregarCatalogo(
            userId,
            {
              silencioso: true,
            }
          );
        }
      },
      [
        userId,
        carregarCatalogo,
      ]
    );

  useCandidaturasRealtime({
    idUtilizador:
      userId,

    onAtualizar:
      tratarAtualizacaoRealtime,
  });

  /*
   * Procura uma candidatura pendente
   * correspondente ao badge.
   */
  const getPendenteDoBadge =
    useCallback(
      (badgeId) => {
        return pendentes.find(
          (pedido) =>
            Number(
              pedido.id_badge_modelo
            ) ===
            Number(badgeId)
        );
      },
      [
        pendentes,
      ]
    );

  /*
   * Procura o badge conquistado.
   */
  const getConquistadoDoBadge =
    useCallback(
      (badgeId) => {
        return conquistados.find(
          (badge) =>
            Number(
              badge.id ||
              badge.id_badge_modelo
            ) ===
            Number(badgeId)
        );
      },
      [
        conquistados,
      ]
    );

  /*
       * Lista das áreas disponíveis.
   */
  const areasDisponiveis =
    useMemo(
      () => {
        return [
          ...new Set(
            badges
              .map(
                (badge) =>
                  badge.nome_area ||
                  badge.nome_areas ||
                  badge.area
              )
              .filter(Boolean)
          ),
        ].sort(
          (a, b) =>
            String(a)
              .localeCompare(
                String(b),
                "pt-PT"
              )
        );
      },
      [
        badges,
      ]
    );

  /*
   * Pesquisa, filtros e ordenação.
   */
  const badgesFiltrados =
    useMemo(
      () => {
        const termo =
          pesquisa
            .trim()
            .toLowerCase();

        return badges
          .filter(
            (badge) => {
              const nome =
                String(
                  badge.nome ||
                  badge.nome_badge ||
                  ""
                );

              const descricao =
                String(
                  badge.descricao ||
                  badge
                    .descricao_badge_modelo ||
                  ""
                );

              const area =
                String(
                  badge.nome_area ||
                  badge.nome_areas ||
                  badge.area ||
                  ""
                );

              const correspondePesquisa =
                !termo ||
                nome
                  .toLowerCase()
                  .includes(termo) ||
                descricao
                  .toLowerCase()
                  .includes(termo) ||
                area
                  .toLowerCase()
                  .includes(termo);

              const correspondeArea =
                !areaFiltro ||
                area ===
                  areaFiltro;

              const correspondeNivel =
                !nivelFiltro ||
                Number(
                  badge.id_nivel
                ) ===
                  Number(
                    nivelFiltro
                  );

              return (
                correspondePesquisa &&
                correspondeArea &&
                correspondeNivel
              );
            }
          )
          .sort(
            (a, b) => {
              const areaA =
                String(
                  a.nome_area ||
                  a.nome_areas ||
                  a.area ||
                  ""
                );

              const areaB =
                String(
                  b.nome_area ||
                  b.nome_areas ||
                  b.area ||
                  ""
                );

              const nomeA =
                String(
                  a.nome ||
                  a.nome_badge ||
                  ""
                );

              const nomeB =
                String(
                  b.nome ||
                  b.nome_badge ||
                  ""
                );

              if (
                ordenacaoArea ===
                "za"
              ) {
                const compararArea =
                  areaB.localeCompare(
                    areaA,
                    "pt-PT"
                  );

                if (
                  compararArea !== 0
                ) {
                  return compararArea;
                }

                return nomeB.localeCompare(
                  nomeA,
                  "pt-PT"
                );
              }

              const compararArea =
                areaA.localeCompare(
                  areaB,
                  "pt-PT"
                );

              if (
                compararArea !== 0
              ) {
                return compararArea;
              }

              return nomeA.localeCompare(
                nomeB,
                "pt-PT"
              );
            }
          );
      },
      [
        badges,
        pesquisa,
        areaFiltro,
        nivelFiltro,
        ordenacaoArea,
      ]
    );

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        badgesFiltrados.length /
        badgesPorPagina
      )
    );

  const inicio =
    (
      paginaAtual - 1
    ) *
    badgesPorPagina;

  const badgesPaginaAtual =
    badgesFiltrados.slice(
      inicio,
      inicio +
        badgesPorPagina
    );

  /*
   * Volta à página 1 quando os filtros
   * são alterados.
   */
  useEffect(() => {
    setPaginaAtual(1);
  }, [
    pesquisa,
    areaFiltro,
    nivelFiltro,
    ordenacaoArea,
  ]);

  /*
   * Garante que a página atual continua
   * válida depois de uma atualização
   * em tempo real.
   */
  useEffect(() => {
    if (
      paginaAtual >
      totalPaginas
    ) {
      setPaginaAtual(
        totalPaginas
      );
    }
  }, [
    paginaAtual,
    totalPaginas,
  ]);

  return (
    <div
      style={{
        backgroundColor:
          "#f7f7f7",

        minHeight:
          "100vh",

        display:
          "flex",

        flexDirection:
          "column",
      }}
    >
      <Header />

      <div
        style={{
          display:
            "flex",

          flex:
            1,

          overflow:
            "hidden",
        }}
      >
        <LeftSidebar />

        <main
          style={{
            flex:
              1,

            overflowY:
              "auto",

            padding:
              "28px 32px",
          }}
        >
          <Button
            variant="link"
            className="
              d-flex
              align-items-center
              text-decoration-none
              p-0
              mb-2
            "
            style={{
              color:
                "#4A5568",

              fontSize:
                "1.05rem",
            }}
            onClick={() =>
              navigate(
                "/pag_consultor"
              )
            }
          >
            <HiOutlineArrowLeft
              className="me-1"
            />

            <span>
              Voltar
            </span>
          </Button>

          <hr
            className="my-2"
          />

          <div
            className="
              d-flex
              justify-content-between
              align-items-start
              flex-wrap
              gap-3
              mb-4
            "
          >
            <div>
              <h5
                className="
                  fw-bold
                  mb-0
                "
              >
                Catálogo de Badges
              </h5>

              <div
                style={{
                  fontSize:
                    13,

                  color:
                    "#4b5563",
                }}
              >
                Há{" "}
                {
                  badgesFiltrados.length
                }{" "}
                Badges disponíveis
              </div>
            </div>

            <div
              className="
                d-flex
                flex-wrap
                gap-3
              "
            >
              <div>
                <div
                  style={
                    filterLabel
                  }
                >
                  Pesquisar
                </div>

                <Form.Control
                  type="search"
                  placeholder="Nome, descrição ou área"
                  value={pesquisa}
                  onChange={(event) =>
                    setPesquisa(
                      event.target.value
                    )
                  }
                  style={
                    filterInput
                  }
                />
              </div>

              <div>
                <div
                  style={
                    filterLabel
                  }
                >
                  Filtrar por Área
                </div>

                <div
                  className="
                    d-flex
                    gap-2
                  "
                >
                  <Form.Select
                    value={
                      areaFiltro
                    }
                    onChange={(
                      event
                    ) =>
                      setAreaFiltro(
                        event.target
                          .value
                      )
                    }
                    style={
                      filterInput
                    }
                  >
                    <option value="">
                      Todas as áreas
                    </option>

                    {areasDisponiveis.map(
                      (area) => (
                        <option
                          key={area}
                          value={area}
                        >
                          {area}
                        </option>
                      )
                    )}
                  </Form.Select>

                  <Form.Select
                    value={
                      ordenacaoArea
                    }
                    onChange={(
                      event
                    ) =>
                      setOrdenacaoArea(
                        event.target
                          .value
                      )
                    }
                    style={{
                      ...filterInput,
                      width:
                        130,
                    }}
                  >
                    <option value="az">
                      Área A-Z
                    </option>

                    <option value="za">
                      Área Z-A
                    </option>
                  </Form.Select>
                </div>
              </div>

              <div>
                <div
                  style={
                    filterLabel
                  }
                >
                  Filtrar por Nível
                </div>

                <Form.Select
                  value={
                    nivelFiltro
                  }
                  onChange={(
                    event
                  ) =>
                    setNivelFiltro(
                      event.target
                        .value
                    )
                  }
                  style={{
                    ...filterInput,
                    width:
                      180,
                  }}
                >
                  <option value="">
                    Todos
                  </option>

                  <option value="1">
                    Nível A
                  </option>

                  <option value="2">
                    Nível B
                  </option>

                  <option value="3">
                    Nível C
                  </option>

                  <option value="4">
                    Nível D
                  </option>

                  <option value="5">
                    Nível E
                  </option>
                </Form.Select>
              </div>
            </div>
          </div>

          {loading ? (
            <div
              className="
                d-flex
                justify-content-center
                align-items-center
              "
              style={{
                minHeight:
                  300,
              }}
            >
              <Spinner
                animation="border"
                style={{
                  color:
                    "#4470AF",
                }}
              />
            </div>
          ) : badgesPaginaAtual.length ===
            0 ? (
            <div
              style={{
                background:
                  "white",

                border:
                  "1px solid #dbe3ef",

                borderRadius:
                  10,

                padding:
                  40,

                textAlign:
                  "center",

                color:
                  "#667085",
              }}
            >
              Não foram encontrados
              badges com os filtros
              selecionados.
            </div>
          ) : (
            badgesPaginaAtual.map(
              (
                badge,
                index
              ) => {
                const badgeId =
                  Number(
                    badge.id ||
                    badge
                      .id_badge_modelo
                  );

                const conquistadoBadge =
                  getConquistadoDoBadge(
                    badgeId
                  );

                const conquistado =
                  Boolean(
                    conquistadoBadge
                  );

                const pendente =
                  getPendenteDoBadge(
                    badgeId
                  );

                return (
                  <CatalogoBadgeRow
                    key={
                      badgeId ||
                      index
                    }

                    badge={badge}

                    conquistado={
                      conquistado
                    }

                    conquistadoBadge={
                      conquistadoBadge
                    }

                    pendente={
                      pendente
                    }

                    mensagemRealtime={
                      mensagensRealtime[
                        badgeId
                      ] || ""
                    }

                    onClick={() =>
                      navigate(
                        `/badge-detalhe/${badgeId}`
                      )
                    }
                  />
                );
              }
            )
          )}

          <PaginacaoCatalogo
            paginaAtual={
              paginaAtual
            }
            totalPaginas={
              totalPaginas
            }
            onAnterior={() =>
              setPaginaAtual(
                (pagina) =>
                  Math.max(
                    1,
                    pagina - 1
                  )
              )
            }
            onProxima={() =>
              setPaginaAtual(
                (pagina) =>
                  Math.min(
                    totalPaginas,
                    pagina + 1
                  )
              )
            }
            onSelecionarPagina={
              setPaginaAtual
            }
          />

          <div
            className="
              d-flex
              justify-content-center
              mt-4
              mb-4
            "
          >
            <Button
              variant="light"
              className="
                d-flex
                align-items-center
                justify-content-center
                gap-2
              "
              style={{
                minWidth:
                  175,

                height:
                  40,

                border:
                  "1px solid #d6dbe1",

                borderRadius:
                  8,

                background:
                  "#f8f9fa",

                color:
                  "#344054",

                fontSize:
                  14,

                fontWeight:
                  500,

                boxShadow:
                  "0 1px 2px rgba(0,0,0,0.04)",
              }}
              onClick={() =>
                navigate(
                  "/meus_badges"
                )
              }
            >
              <BiMedal
                size={18}
              />

              Os seus Badges
            </Button>
          </div>
        </main>

        <RightSidebar />
      </div>
    </div>
  );
}

function CatalogoBadgeRow({
  badge,
  conquistado,
  conquistadoBadge,
  pendente,
  mensagemRealtime,
  onClick,
}) {
  const nome =
    badge.nome ||
    badge.nome_badge ||
    "Badge";

  const descricao =
    badge.descricao ||
    badge
      .descricao_badge_modelo ||
    "";

  const pontos =
    Number(
      badge.pontos ||
      0
    );

  const area =
    badge.nome_area ||
    badge.nome_areas ||
    badge.area ||
    "";

  const {
    ganhouBonus,
    pontosExtra,
  } = obterBonusBadge(
    conquistadoBadge
  );

  const bonusAtivo =
    conquistado &&
    ganhouBonus;

  const mensagemSocket =
  String(
    mensagemRealtime || ""
  ).trim();

  const pendenteTemEvidencias =
    Number(
      pendente?.total_evidencias_submetidas ||
        pendente?.total_evidencias_enviadas ||
        pendente?.total_evidencias ||
        0
    ) > 0 ||
    Boolean(
      pendente?.data_submissao
    );

  const estadoPendenteLegivel =
    pendente
      ? pendenteTemEvidencias
        ? "Candidatura efetuada"
        : "Candidatura iniciada"
      : "";

  const estadoNormal =
    conquistado
      ? conquistadoBadge
          ?.data_atribuicao
        ? `Conquistado a ${new Date(
            conquistadoBadge
              .data_atribuicao
          ).toLocaleDateString(
            "pt-PT"
          )}`
        : "Conquistado recentemente"
      : pendente
        ? estadoPendenteLegivel
        : "Por Conquistar";

  /*
  * Quando existe uma mensagem recebida
  * em tempo real, ela substitui o texto
  * curto do estado.
  */
  const estadoBase =
    mensagemSocket ||
    estadoNormal;

  const estadoTexto =
    bonusAtivo &&
    pontosExtra > 0
      ? `${estadoBase} • +${pontosExtra} pontos extra`
      : estadoBase;

  const corEstado =
    bonusAtivo
      ? "#9a6b00"
      : conquistado
        ? "#2E7D32"
        : pendente
          ? "#EF6C00"
          : "#3b4a60";

  return (
    <div
      style={{
        ...badgeCard,

        cursor:
          "pointer",

        border:
          bonusAtivo
            ? "2px solid #d4af37"
            : badgeCard.border,

        boxShadow:
          bonusAtivo
            ? "0 0 0 3px rgba(212,175,55,0.12)"
            : "none",
      }}
      onClick={onClick}
    >
      <div
        style={
          badgeContent
        }
      >
        <BadgeImage
          badge={badge}
          size={72}
        />

        <div
          style={{
            flex:
              1,
          }}
        >
          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                10,

              flexWrap:
                "wrap",
            }}
          >
            <div
              style={{
                fontSize:
                  15,

                fontWeight:
                  600,

                color:
                  "#111827",
              }}
            >
              {nome}
            </div>

            {bonusAtivo && (
              <span
                style={{
                  background:
                    "#fff7d6",

                  color:
                    "#9a6b00",

                  border:
                    "1px solid #f0d36b",

                  borderRadius:
                    999,

                  padding:
                    "3px 9px",

                  fontSize:
                    11,

                  fontWeight:
                    700,
                }}
              >
                Desafio concluído
              </span>
            )}
          </div>

          <div
            style={{
              fontSize:
                12,

              color:
                "#344563",

              marginTop:
                4,
            }}
          >
            {descricao}

            {area && (
              <div
                style={{
                  fontSize:
                    12,

                  color:
                    "#4470AF",

                  marginTop:
                    3,
                }}
              >
                {area}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            ...pointsBox,

            border:
              bonusAtivo
                ? "1.5px solid #d4af37"
                : pointsBox.border,

            background:
              bonusAtivo
                ? "#fffdf4"
                : "white",
          }}
        >
          <div
            style={{
              fontSize:
                10,

              fontWeight:
                600,

              color:
                bonusAtivo
                  ? "#9a6b00"
                  : "#111827",
            }}
          >
            Pontos
          </div>

          <div
            style={{
              fontSize:
                17,

              fontWeight:
                700,
            }}
          >
            {pontos}
          </div>

          {bonusAtivo &&
            pontosExtra > 0 && (
              <div
                style={{
                  fontSize:
                    11,

                  fontWeight:
                    700,

                  color:
                    "#d4a017",

                  whiteSpace:
                    "nowrap",
                }}
              >
                +{pontosExtra} extra
              </div>
            )}
        </div>
      </div>

      <div
        style={{
          ...statusBar,

          color:
            corEstado,

          background:
            bonusAtivo
              ? "#fffdf4"
              : statusBar
                  .background,
        }}
      >
        {estadoTexto}
      </div>
    </div>
  );
}

function PaginacaoCatalogo({
  paginaAtual,
  totalPaginas,
  onAnterior,
  onProxima,
  onSelecionarPagina,
}) {
  if (
    totalPaginas <= 1
  ) {
    return null;
  }

  const disabledAnterior =
    paginaAtual === 1;

  const disabledProxima =
    paginaAtual ===
    totalPaginas;

  const criarPaginasVisiveis =
    () => {
      if (
        totalPaginas <= 5
      ) {
        return Array.from(
          {
            length:
              totalPaginas,
          },
          (
            _,
            index
          ) =>
            index + 1
        );
      }

      if (
        paginaAtual <= 3
      ) {
        return [
          1,
          2,
          3,
          4,
          "...",
          totalPaginas,
        ];
      }

      if (
        paginaAtual >=
        totalPaginas - 2
      ) {
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
    <div
      style={{
        display:
          "flex",

        justifyContent:
          "center",

        marginTop:
          24,

        marginBottom:
          24,
      }}
    >
      <div
        style={{
          display:
            "flex",

          alignItems:
            "center",

          gap:
            4,

          background:
            "white",

          border:
            "1px solid #dfe3e8",

          borderRadius:
            9,

          padding:
            5,

          boxShadow:
            "0 1px 2px rgba(0,0,0,0.03)",
        }}
      >
        <button
          type="button"
          onClick={
            onAnterior
          }
          disabled={
            disabledAnterior
          }
          aria-label="Página anterior"
          style={{
            ...paginationButton,

            color:
              disabledAnterior
                ? "#cbd0d6"
                : "#5f6b7a",

            cursor:
              disabledAnterior
                ? "not-allowed"
                : "pointer",

            background:
              disabledAnterior
                ? "#fafafa"
                : "white",
          }}
        >
          ‹
        </button>

        {paginasVisiveis.map(
          (
            pagina,
            index
          ) => {
            if (
              pagina ===
              "..."
            ) {
              return (
                <div
                  key={
                    `ellipsis-${index}`
                  }
                  style={{
                    width:
                      30,

                    height:
                      32,

                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    color:
                      "#8a94a3",

                    fontSize:
                      13,
                  }}
                >
                  ...
                </div>
              );
            }

            const ativa =
              Number(
                pagina
              ) ===
              Number(
                paginaAtual
              );

            return (
              <button
                key={pagina}
                type="button"
                onClick={() =>
                  onSelecionarPagina(
                    Number(
                      pagina
                    )
                  )
                }
                aria-current={
                  ativa
                    ? "page"
                    : undefined
                }
                style={{
                  ...paginationButton,

                  background:
                    ativa
                      ? "#e8edf3"
                      : "white",

                  color:
                    ativa
                      ? "#1f2937"
                      : "#667085",

                  borderColor:
                    ativa
                      ? "#d6dce4"
                      : "transparent",

                  fontWeight:
                    ativa
                      ? 700
                      : 500,

                  cursor:
                    "pointer",
                }}
              >
                {pagina}
              </button>
            );
          }
        )}

        <div
          style={{
            minWidth:
              42,

            padding:
              "0 6px",

            textAlign:
              "center",

            color:
              "#667085",

            fontSize:
              12,

            fontWeight:
              500,
          }}
        >
          {paginaAtual}/
          {totalPaginas}
        </div>

        <button
          type="button"
          onClick={
            onProxima
          }
          disabled={
            disabledProxima
          }
          aria-label="Página seguinte"
          style={{
            ...paginationButton,

            color:
              disabledProxima
                ? "#cbd0d6"
                : "#5f6b7a",

            cursor:
              disabledProxima
                ? "not-allowed"
                : "pointer",

            background:
              disabledProxima
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

const filterLabel = {
  fontSize:
    13,

  color:
    "#374151",

  marginBottom:
    6,
};

const filterInput = {
  width:
    260,

  height:
    42,

  borderRadius:
    10,

  border:
    "1px solid #dbeafe",
};

const badgeCard = {
  background:
    "white",

  border:
    "1px solid #dbe3ef",

  borderRadius:
    10,

  marginBottom:
    14,

  overflow:
    "hidden",
};

const badgeContent = {
  padding:
    "18px 12px",

  display:
    "flex",

  alignItems:
    "center",

  gap:
    18,
};

const pointsBox = {
  border:
    "1.5px solid #4470AF",

  borderRadius:
    12,

  padding:
    "8px 10px",

  minWidth:
    52,

  textAlign:
    "center",

  boxShadow:
    "0 2px 5px rgba(0,0,0,0.15)",
};

const statusBar = {
  borderTop:
    "1px solid #e5e7eb",

  textAlign:
    "center",

  padding:
    "8px 14px",

  fontSize:
    12,

  lineHeight:
    1.45,

  background:
    "#fbfdff",

  whiteSpace:
    "normal",

  overflowWrap:
    "anywhere",
};

const paginationButton = {
  width:
    34,

  height:
    32,

  border:
    "1px solid transparent",

  borderRadius:
    6,

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  fontSize:
    14,

  lineHeight:
    1,

  padding:
    0,

  transition:
    "background-color 0.15s ease, border-color 0.15s ease",
};

export default CatalogoBadgesPage;
