import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BiArrowBack,
  BiBadge,
  BiBriefcase,
  BiCalendar,
  BiCheckCircle,
  BiEnvelope,
  BiFile,
  BiIdCard,
  BiLayer,
  BiMedal,
  BiPhone,
  BiSpreadsheet,
  BiTimeFive,
  BiUserCircle,
} from "react-icons/bi";

import {
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import api from "../../services/api.js";

import Header from "../../components/Header.jsx";
import SllLeftSidebar from "../../components/sll_left_sidebar.jsx";
import SllRightSidebar from "../../components/sll_right_sidebar.jsx";

import LogoSoftinsa from "../../assets/logo.png";

/* =========================================================
   UTILIZADOR AUTENTICADO
========================================================= */

function obterUtilizadorGuardado() {
  const guardado =
    localStorage.getItem("user");

  if (!guardado) {
    return null;
  }

  try {
    return JSON.parse(guardado);
  } catch (err) {
    console.error(
      "Erro ao ler utilizador:",
      err
    );

    return null;
  }
}

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function formatarData(data) {
  if (!data) {
    return "Não disponível";
  }

  const date = new Date(data);

  if (Number.isNaN(date.getTime())) {
    return "Não disponível";
  }

  return date.toLocaleDateString(
    "pt-PT",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

function formatarDataHora(data) {
  if (!data) {
    return "Nunca";
  }

  const date = new Date(data);

  if (Number.isNaN(date.getTime())) {
    return "Nunca";
  }

  return date.toLocaleString(
    "pt-PT",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function limparNomeFicheiro(valor) {
  return String(
    valor || "consultor"
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-zA-Z0-9]+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    )
    .toLowerCase();
}

function obterPercentagem(
  progresso
) {
  if (
    progresso === null ||
    progresso === undefined ||
    progresso === ""
  ) {
    return null;
  }

  const numero = Number(
    String(progresso)
      .replace("%", "")
      .replace(",", ".")
  );

  if (Number.isNaN(numero)) {
    return null;
  }

  return Math.min(
    Math.max(numero, 0),
    100
  );
}

function converterBufferImagem(
  imagem
) {
  if (!imagem) {
    return null;
  }

  if (typeof imagem === "string") {
    return imagem;
  }

  if (
    imagem?.type === "Buffer" &&
    Array.isArray(imagem.data)
  ) {
    try {
      const bytes =
        new Uint8Array(
          imagem.data
        );

      let binario = "";

      bytes.forEach((byte) => {
        binario +=
          String.fromCharCode(byte);
      });

      return `data:image/png;base64,${window.btoa(
        binario
      )}`;
    } catch (err) {
      console.error(
        "Erro ao converter imagem:",
        err
      );

      return null;
    }
  }

  return null;
}

function carregarImagemComoDataUrl(
  origem
) {
  return new Promise(
    (resolve, reject) => {
      const imagem = new Image();

      imagem.onload = () => {
        const canvas =
          document.createElement(
            "canvas"
          );

        canvas.width =
          imagem.naturalWidth;

        canvas.height =
          imagem.naturalHeight;

        const contexto =
          canvas.getContext("2d");

        contexto.drawImage(
          imagem,
          0,
          0
        );

        resolve(
          canvas.toDataURL(
            "image/png"
          )
        );
      };

      imagem.onerror = reject;
      imagem.src = origem;
    }
  );
}

/* =========================================================
   NORMALIZAÇÃO
========================================================= */

function normalizarConsultor(
  dados
) {
  const consultor =
    dados?.consultor || dados || {};

  return {
    id_utilizador:
      consultor.id_utilizador ||
      consultor.id ||
      "",

    nome_completo:
      consultor.nome_completo ||
      consultor.nome ||
      "Consultor",

    email:
      consultor.email ||
      consultor.email_softinsa ||
      "Sem email",

    contacto:
      consultor.contacto ||
      "Sem contacto",

    estado_conta:
      consultor.estado_conta ||
      "ATIVO",

    id_areas:
      consultor.id_areas ||
      "",

    nome_area:
      consultor.nome_area ||
      "Sem área associada",

    id_serviceline:
      consultor.id_serviceline ||
      "",

    nome_serviceline:
      consultor.nome_serviceline ||
      dados?.serviceLine
        ?.nome_serviceline ||
      "Service Line",

    data_criacao_conta:
      consultor.data_criacao_conta ||
      null,

    data_entrada_empresa:
      consultor.data_entrada_empresa ||
      null,

    data_entrada_area:
      consultor.data_entrada_area ||
      null,

    ultimo_login:
      consultor.ultimo_login ||
      null,

    progresso_nivel:
      consultor.progresso_nivel ??
      "Sem progresso registado",

    total_badges: Number(
      consultor.total_badges || 0
    ),
  };
}

function normalizarBadge(badge, index) {
  return {
    id:
      badge.id_badge_atribuido ||
      badge.id_badge_modelo ||
      badge.id ||
      index,

    id_badge_atribuido:
      badge.id_badge_atribuido ||
      null,

    id_badge_modelo:
      badge.id_badge_modelo ||
      null,

    nome_badge:
      badge.nome_badge ||
      badge.nome ||
      "Badge sem nome",

    descricao:
      badge.descricao_badge_modelo ||
      badge.descricao ||
      "Sem descrição.",

    nome_nivel:
      badge.nome_nivel ||
      badge.nivel ||
      "Sem nível",

    nome_area:
      badge.nome_area || "",

    pontos: Number(
      badge.pontos || 0
    ),

    data_conquista:
      badge.data_atribuicao ||
      badge.data_conquista ||
      badge.data_obtencao ||
      badge.data_criacao ||
      null,

    imagem:
      converterBufferImagem(
        badge.imagem ||
        badge.imagem_url
      ),
  };
}

function extrairListaBadges(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (
    Array.isArray(data?.badges)
  ) {
    return data.badges;
  }

  if (
    Array.isArray(
      data?.conquistados
    )
  ) {
    return data.conquistados;
  }

  if (
    Array.isArray(data?.dados)
  ) {
    return data.dados;
  }

  return [];
}

/* =========================================================
   PÁGINA
========================================================= */

function InformacaoConsultorSll() {
  const navigate = useNavigate();
  const location = useLocation();

  const voltarPara =
    location.state?.voltarPara ||
    "/sll/consultores";

  const textoVoltar =
    location.state?.textoVoltar ||
    "Voltar à lista de consultores";

  const {
    idConsultor,
  } = useParams();

  const [
    consultor,
    setConsultor,
  ] = useState(null);

  const [badges, setBadges] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    carregarPagina();
  }, [idConsultor]);

  async function carregarPagina() {
    const utilizador =
      obterUtilizadorGuardado();

    const idUtilizadorSll =
      utilizador?.id_utilizador ||
      utilizador?.ID_UTILIZADOR ||
      utilizador?.id;

    if (!idUtilizadorSll) {
      setErro(
        "Não foi possível identificar o Service Line Leader."
      );

      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErro("");

      const resultados =
        await Promise.allSettled([
          api.get(
            `/sll/${idUtilizadorSll}/consultores/${idConsultor}`
          ),

          api.get(
            `/badges/conquistados/${idConsultor}`
          ),
        ]);

      const perfilResultado =
        resultados[0];

      const badgesResultado =
        resultados[1];

      if (
        perfilResultado.status ===
        "rejected"
      ) {
        throw perfilResultado.reason;
      }

      const consultorNormalizado =
        normalizarConsultor(
          perfilResultado.value.data
        );

      setConsultor(
        consultorNormalizado
      );

      if (
        badgesResultado.status ===
        "fulfilled"
      ) {
        const lista =
          extrairListaBadges(
            badgesResultado.value.data
          );

        const badgesNormalizados =
        lista.map(normalizarBadge);

        const badgesSemDuplicados = Array.from(
        new Map(
            badgesNormalizados.map((badge) => [
            String(
                badge.id_badge_atribuido ||
                badge.id_badge_modelo ||
                badge.id
            ),
            badge,
            ])
        ).values()
        );

        setBadges(badgesSemDuplicados);
      } else {
        console.error(
          "Erro ao carregar badges conquistados:",
          badgesResultado.reason
        );

        setBadges([]);
      }
    } catch (err) {
      console.error(
        "Erro ao carregar perfil completo:",
        err
      );

      console.error(
        "STATUS:",
        err.response?.status
      );

      console.error(
        "BODY:",
        err.response?.data
      );

      setConsultor(null);
      setBadges([]);

      setErro(
        err.response?.data?.error ||
        "Não foi possível carregar o perfil do consultor."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const percentagemProgresso =
    useMemo(
      () =>
        obterPercentagem(
          consultor
            ?.progresso_nivel
        ),
      [
        consultor
          ?.progresso_nivel,
      ]
    );

  async function gerarPdf() {
    if (!consultor) {
      return;
    }

    try {
      setErro("");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const logoDataUrl =
        await carregarImagemComoDataUrl(
          LogoSoftinsa
        );

      pdf.addImage(
        logoDataUrl,
        "PNG",
        15,
        12,
        48,
        14
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(20);
      pdf.setTextColor(
        17,
        24,
        39
      );

      pdf.text(
        "Perfil do Consultor",
        15,
        42
      );

      pdf.setFontSize(15);
      pdf.setTextColor(
        37,
        99,
        235
      );

      pdf.text(
        consultor.nome_completo,
        15,
        53
      );

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(10);
      pdf.setTextColor(
        71,
        85,
        105
      );

      pdf.text(
        `Service Line: ${consultor.nome_serviceline}`,
        15,
        61
      );

      autoTable(pdf, {
        startY: 69,

        head: [
          [
            "Campo",
            "Informação",
          ],
        ],

        body: [
          [
            "ID",
            consultor.id_utilizador,
          ],
          [
            "Nome",
            consultor.nome_completo,
          ],
          [
            "Email",
            consultor.email,
          ],
          [
            "Contacto",
            consultor.contacto,
          ],
          [
            "Área",
            consultor.nome_area,
          ],
          [
            "Service Line",
            consultor.nome_serviceline,
          ],
          [
            "Estado da conta",
            consultor.estado_conta,
          ],
          [
            "Entrada na empresa",
            formatarData(
              consultor
                .data_entrada_empresa
            ),
          ],
          [
            "Entrada na área",
            formatarData(
              consultor
                .data_entrada_area
            ),
          ],
          [
            "Último login",
            formatarDataHora(
              consultor.ultimo_login
            ),
          ],
          [
            "Progresso",
            String(
              consultor
                .progresso_nivel
            ),
          ],
          [
            "Badges conquistados",
            consultor.total_badges,
          ],
        ],

        styles: {
          fontSize: 9,
          cellPadding: 4,
          valign: "middle",
        },

        headStyles: {
          fillColor: [
            37,
            99,
            235,
          ],

          textColor: [
            255,
            255,
            255,
          ],

          fontStyle: "bold",
        },

        alternateRowStyles: {
          fillColor: [
            248,
            250,
            252,
          ],
        },

        columnStyles: {
          0: {
            cellWidth: 57,
            fontStyle: "bold",
          },
        },
      });

      if (badges.length > 0) {
        const inicioBadges =
          pdf.lastAutoTable
            .finalY + 13;

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setFontSize(14);
        pdf.setTextColor(
          17,
          24,
          39
        );

        pdf.text(
          "Badges conquistados",
          15,
          inicioBadges
        );

        autoTable(pdf, {
          startY:
            inicioBadges + 6,

          head: [
            [
              "Badge",
              "Nível",
              "Pontos",
              "Data",
            ],
          ],

          body: badges.map(
            (badge) => [
              badge.nome_badge,
              badge.nome_nivel,
              badge.pontos,
              formatarData(
                badge.data_conquista
              ),
            ]
          ),

          styles: {
            fontSize: 8,
            cellPadding: 3,
          },

          headStyles: {
            fillColor: [
              37,
              99,
              235,
            ],

            textColor: [
              255,
              255,
              255,
            ],
          },
        });
      }

      pdf.save(
        `perfil_${limparNomeFicheiro(
          consultor.nome_completo
        )}.pdf`
      );
    } catch (err) {
      console.error(
        "Erro ao gerar PDF:",
        err
      );

      setErro(
        "Não foi possível gerar o PDF."
      );
    }
  }

  function gerarExcel() {
    if (!consultor) {
      return;
    }

    const linhasPerfil = [
      [
        "PERFIL DO CONSULTOR",
        "",
      ],
      [
        "Campo",
        "Informação",
      ],
      [
        "ID",
        consultor.id_utilizador,
      ],
      [
        "Nome",
        consultor.nome_completo,
      ],
      [
        "Email",
        consultor.email,
      ],
      [
        "Contacto",
        consultor.contacto,
      ],
      [
        "Área",
        consultor.nome_area,
      ],
      [
        "Service Line",
        consultor.nome_serviceline,
      ],
      [
        "Estado da conta",
        consultor.estado_conta,
      ],
      [
        "Entrada na empresa",
        formatarData(
          consultor
            .data_entrada_empresa
        ),
      ],
      [
        "Entrada na área",
        formatarData(
          consultor.data_entrada_area
        ),
      ],
      [
        "Último login",
        formatarDataHora(
          consultor.ultimo_login
        ),
      ],
      [
        "Progresso",
        consultor.progresso_nivel,
      ],
      [
        "Total de badges",
        consultor.total_badges,
      ],
      [],
      [
        "BADGES CONQUISTADOS",
      ],
      [
        "Badge",
        "Nível",
        "Pontos",
        "Data de conquista",
      ],
      ...badges.map(
        (badge) => [
          badge.nome_badge,
          badge.nome_nivel,
          badge.pontos,
          formatarData(
            badge.data_conquista
          ),
        ]
      ),
    ];

    const csv =
      linhasPerfil
        .map((linha) =>
          linha
            .map((valor) => {
              const texto = String(
                valor ?? ""
              ).replace(/"/g, '""');

              return `"${texto}"`;
            })
            .join(";")
        )
        .join("\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `perfil_${limparNomeFicheiro(
        consultor.nome_completo
      )}.csv`;

    document.body.appendChild(
      link
    );

    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <div style={pagina}>
      <Header />

      <div style={corpo}>
        <SllLeftSidebar />

        <main style={conteudo}>
        <button
          type="button"
          onClick={() =>
            navigate(voltarPara)
          }
          style={voltarButton}
        >
          <BiArrowBack size={18} />
          {textoVoltar}
        </button>

          <div style={separador} />

          {erro && (
            <div style={erroBox}>
              {erro}
            </div>
          )}

          {isLoading ? (
            <div style={mensagemBox}>
              A carregar perfil do
              consultor...
            </div>
          ) : consultor ? (
            <>
              <div style={cabecalhoPagina}>
                <div>
                  <h1 style={titulo}>
                    Perfil do Consultor
                  </h1>

                  <div style={subtitulo}>
                    Informação detalhada
                    do consultor
                  </div>
                </div>

                <div style={acoesTopo}>
                  <button
                    type="button"
                    onClick={gerarPdf}
                    style={pdfButton}
                  >
                    <BiFile size={17} />
                    Gerar PDF
                  </button>

                  <button
                    type="button"
                    onClick={gerarExcel}
                    style={excelButton}
                  >
                    <BiSpreadsheet
                      size={17}
                    />
                    Gerar Excel
                  </button>
                </div>
              </div>

              <section style={perfilCard}>
                <div style={perfilPrincipal}>
                  <div style={avatar}>
                    <BiUserCircle
                      size={90}
                      color="#6092bf"
                    />
                  </div>

                  <div style={identidade}>
                    <h2 style={nomeConsultor}>
                      {
                        consultor
                          .nome_completo
                      }
                    </h2>

                    <div style={cargo}>
                      Consultor
                    </div>

                    <div style={emailPrincipal}>
                      <BiEnvelope
                        size={16}
                      />

                      {consultor.email}
                    </div>

                    <div style={serviceLineTexto}>
                      {
                        consultor
                          .nome_serviceline
                      }
                    </div>
                  </div>
                </div>

                <div style={estatisticas}>
                  <EstatisticaCard
                    icon={
                      <BiMedal
                        size={25}
                      />
                    }
                    valor={
                      consultor.total_badges
                    }
                    label="Badges conquistados"
                  />

                  <EstatisticaCard
                    icon={
                      <BiCheckCircle
                        size={25}
                      />
                    }
                    valor={
                      consultor.estado_conta
                    }
                    label="Estado da conta"
                  />

                  <EstatisticaCard
                    icon={
                      <BiTimeFive
                        size={25}
                      />
                    }
                    valor={
                      percentagemProgresso !==
                      null
                        ? `${percentagemProgresso}%`
                        : consultor
                            .progresso_nivel
                    }
                    label="Progresso atual"
                  />
                </div>
              </section>

              <section style={detalhesCard}>
                <h2 style={secaoTitulo}>
                  Informações do Consultor
                </h2>

                <div style={detalhesGrid}>
                  <DetalheItem
                    icon={
                      <BiIdCard
                        size={20}
                      />
                    }
                    label="ID do utilizador"
                    value={
                      consultor.id_utilizador
                    }
                  />

                  <DetalheItem
                    icon={
                      <BiEnvelope
                        size={20}
                      />
                    }
                    label="Email"
                    value={consultor.email}
                  />

                  <DetalheItem
                    icon={
                      <BiPhone
                        size={20}
                      />
                    }
                    label="Contacto"
                    value={
                      consultor.contacto
                    }
                  />

                  <DetalheItem
                    icon={
                      <BiBriefcase
                        size={20}
                      />
                    }
                    label="Área"
                    value={
                      consultor.nome_area
                    }
                  />

                  <DetalheItem
                    icon={
                      <BiLayer
                        size={20}
                      />
                    }
                    label="Service Line"
                    value={
                      consultor
                        .nome_serviceline
                    }
                  />

                  <DetalheItem
                    icon={
                      <BiCalendar
                        size={20}
                      />
                    }
                    label="Entrada na empresa"
                    value={formatarData(
                      consultor
                        .data_entrada_empresa
                    )}
                  />

                  <DetalheItem
                    icon={
                      <BiCalendar
                        size={20}
                      />
                    }
                    label="Entrada na área"
                    value={formatarData(
                      consultor
                        .data_entrada_area
                    )}
                  />

                  <DetalheItem
                    icon={
                      <BiTimeFive
                        size={20}
                      />
                    }
                    label="Último login"
                    value={formatarDataHora(
                      consultor
                        .ultimo_login
                    )}
                  />
                </div>

                <div style={progressoArea}>
                  <div style={progressoCabecalho}>
                    <span>
                      Progresso do nível
                    </span>

                    <strong>
                      {
                        consultor
                          .progresso_nivel
                      }
                    </strong>
                  </div>

                  {percentagemProgresso !==
                    null && (
                    <div style={barraFundo}>
                      <div
                        style={{
                          ...barraProgresso,
                          width: `${percentagemProgresso}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </section>

              <section style={badgesCard}>
                <div style={secaoCabecalho}>
                  <div>
                    <h2 style={secaoTitulo}>
                      Badges Conquistados
                    </h2>

                    <div style={secaoSubtitulo}>
                      Total de{" "}
                      {badges.length}{" "}
                      {badges.length === 1
                        ? "badge"
                        : "badges"}
                    </div>
                  </div>

                  <div style={totalBadgesBox}>
                    <BiBadge size={20} />
                    {badges.length}
                  </div>
                </div>

                {badges.length > 0 ? (
                  <div style={badgesGrid}>
                    {badges.map(
                      (badge) => (
                        <BadgeCard
                          key={badge.id}
                          badge={badge}
                        />
                      )
                    )}
                  </div>
                ) : (
                  <div style={semBadges}>
                    Este consultor ainda
                    não conquistou badges.
                  </div>
                )}
              </section>
            </>
          ) : (
            !erro && (
              <div style={mensagemBox}>
                Consultor não encontrado.
              </div>
            )
          )}
        </main>

        <SllRightSidebar />
      </div>
    </div>
  );
}

/* =========================================================
   COMPONENTES
========================================================= */

function EstatisticaCard({
  icon,
  valor,
  label,
}) {
  return (
    <div style={estatisticaCard}>
      <div style={estatisticaIcon}>
        {icon}
      </div>

      <div>
        <div style={estatisticaValor}>
          {valor}
        </div>

        <div style={estatisticaLabel}>
          {label}
        </div>
      </div>
    </div>
  );
}

function DetalheItem({
  icon,
  label,
  value,
}) {
  return (
    <div style={detalheItem}>
      <div style={detalheIcon}>
        {icon}
      </div>

      <div style={detalheConteudo}>
        <div style={detalheLabel}>
          {label}
        </div>

        <div style={detalheValor}>
          {value || "Não disponível"}
        </div>
      </div>
    </div>
  );
}

function BadgeCard({ badge }) {
  return (
    <article style={badgeCard}>
      <div style={badgeImagemBox}>
        {badge.imagem ? (
          <img
            src={badge.imagem}
            alt={badge.nome_badge}
            style={badgeImagem}
          />
        ) : (
          <BiMedal
            size={34}
            color="#2563eb"
          />
        )}
      </div>

      <div style={badgeInfo}>
        <div style={badgeNome}>
          {badge.nome_badge}
        </div>

        <div style={badgeDescricao}>
          {badge.descricao}
        </div>

        <div style={badgeRodape}>
          <span style={nivelBadge}>
            {badge.nome_nivel}
          </span>

          <span style={pontosBadge}>
            {badge.pontos} pts
          </span>
        </div>

        <div style={dataBadge}>
          Conquistado em{" "}
          {formatarData(
            badge.data_conquista
          )}
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   ESTILOS
========================================================= */

const pagina = {
  minHeight: "100vh",
  background: "#f3f4f6",
  display: "flex",
  flexDirection: "column",
};

const corpo = {
  display: "flex",
  flex: 1,
  overflow: "hidden",
};

const conteudo = {
  flex: 1,
  minWidth: 0,
  overflowY: "auto",
  padding: "22px 30px 60px",
};

const voltarButton = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: 0,
  fontSize: 14,
  cursor: "pointer",
};

const separador = {
  height: 1,
  background: "#d1d5db",
  margin: "16px 0 18px",
};

const cabecalhoPagina = {
  maxWidth: 980,
  margin: "0 auto 18px",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 20,
};

const titulo = {
  margin: 0,
  fontSize: 17,
  fontWeight: 800,
  color: "#111827",
};

const subtitulo = {
  marginTop: 4,
  fontSize: 12,
  color: "#64748b",
};

const acoesTopo = {
  display: "flex",
  gap: 10,
};

const pdfButton = {
  minHeight: 42,
  border: "none",
  borderRadius: 9,
  background: "#dc2626",
  color: "white",
  padding: "9px 17px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

const excelButton = {
  minHeight: 42,
  border: "none",
  borderRadius: 9,
  background: "#16a34a",
  color: "white",
  padding: "9px 17px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

const perfilCard = {
  maxWidth: 980,
  margin: "0 auto 18px",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 13,
  padding: "24px",
  display: "grid",
  gridTemplateColumns:
    "minmax(300px, 0.9fr) minmax(450px, 1.1fr)",
  alignItems: "center",
  gap: 30,
};

const perfilPrincipal = {
  display: "flex",
  alignItems: "center",
  gap: 18,
};

const avatar = {
  width: 105,
  height: 105,
  borderRadius: "50%",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const identidade = {
  minWidth: 0,
};

const nomeConsultor = {
  margin: 0,
  fontSize: 15,
  fontWeight: 500,
  color: "#111827",
};

const cargo = {
  display: "inline-flex",
  marginTop: 7,
  background: "#eff6ff",
  color: "#2563eb",
  borderRadius: 999,
  padding: "5px 13px",
  fontSize: 11,
  fontWeight: 600,
};

const emailPrincipal = {
  marginTop: 10,
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "#64748b",
  fontSize: 12,
};

const serviceLineTexto = {
  marginTop: 5,
  color: "#2563eb",
  fontSize: 12,
  fontWeight: 600,
};

const estatisticas = {
  display: "grid",
  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",
  gap: 12,
};

const estatisticaCard = {
  minHeight: 92,
  border: "1px solid #dbeafe",
  borderRadius: 11,
  background: "#f8fafc",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  padding: "12px",
};

const estatisticaIcon = {
  width: 43,
  height: 43,
  borderRadius: "50%",
  background: "#eff6ff",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const estatisticaValor = {
  fontSize: 14,
  fontWeight: 500,
  color: "#111827",
  wordBreak: "break-word",
};

const estatisticaLabel = {
  marginTop: 3,
  fontSize: 9,
  color: "#64748b",
};

const detalhesCard = {
  maxWidth: 980,
  margin: "0 auto 18px",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 13,
  padding: "22px 24px",
};

const secaoTitulo = {
  margin: 0,
  fontSize: 17,
  fontWeight: 800,
  color: "#111827",
};

const secaoSubtitulo = {
  marginTop: 3,
  fontSize: 11,
  color: "#64748b",
};

const detalhesGrid = {
  marginTop: 20,
  display: "grid",
  gridTemplateColumns:
    "repeat(4, minmax(0, 1fr))",
  gap: 18,
};

const detalheItem = {
  minHeight: 72,
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  padding: "12px",
  background: "#f8fafc",
  borderRadius: 9,
};

const detalheIcon = {
  color: "#2563eb",
  marginTop: 2,
  flexShrink: 0,
};

const detalheConteudo = {
  minWidth: 0,
};

const detalheLabel = {
  fontSize: 9,
  color: "#94a3b8",
};

const detalheValor = {
  marginTop: 4,
  color: "#334155",
  fontSize: 11,
  fontWeight: 600,
  wordBreak: "break-word",
};

const progressoArea = {
  marginTop: 22,
  paddingTop: 18,
  borderTop: "1px solid #e5e7eb",
};

const progressoCabecalho = {
  display: "flex",
  justifyContent: "space-between",
  gap: 15,
  color: "#475569",
  fontSize: 12,
};

const barraFundo = {
  width: "100%",
  height: 10,
  borderRadius: 999,
  background: "#e5e7eb",
  overflow: "hidden",
  marginTop: 10,
};

const barraProgresso = {
  height: "100%",
  borderRadius: 999,
  background: "#2563eb",
  transition: "width 0.3s",
};

const badgesCard = {
  maxWidth: 980,
  margin: "0 auto",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 13,
  padding: "22px 24px",
};

const secaoCabecalho = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
  marginBottom: 20,
};

const totalBadgesBox = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  borderRadius: 999,
  background: "#eff6ff",
  color: "#2563eb",
  padding: "7px 13px",
  fontSize: 12,
  fontWeight: 700,
};

const badgesGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: 16,
};

const badgeCard = {
  minHeight: 145,
  border: "1px solid #dbeafe",
  borderRadius: 11,
  background: "#f8fafc",
  padding: "15px",
  display: "grid",
  gridTemplateColumns:
    "72px minmax(0, 1fr)",
  gap: 14,
  alignItems: "center",
};

const badgeImagemBox = {
  width: 70,
  height: 70,
  borderRadius: "50%",
  background: "#eff6ff",
  border: "2px solid #dbeafe",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const badgeImagem = {
  width: "170%",
  height: "170%",
  objectFit: "cover",
  borderRadius: "50%",
};

const badgeInfo = {
  minWidth: 0,
};

const badgeNome = {
  fontSize: 14,
  fontWeight: 700,
  color: "#111827",
};

const badgeDescricao = {
  marginTop: 5,
  color: "#64748b",
  fontSize: 10,
  lineHeight: 1.4,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const badgeRodape = {
  marginTop: 9,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const nivelBadge = {
  background: "#dbeafe",
  color: "#2563eb",
  borderRadius: 999,
  padding: "4px 9px",
  fontSize: 9,
};

const pontosBadge = {
  background: "#fef3c7",
  color: "#92400e",
  borderRadius: 999,
  padding: "4px 9px",
  fontSize: 9,
  fontWeight: 700,
};

const dataBadge = {
  marginTop: 7,
  color: "#94a3b8",
  fontSize: 9,
};

const semBadges = {
  border: "1px dashed #cbd5e1",
  borderRadius: 10,
  padding: 35,
  textAlign: "center",
  color: "#64748b",
  fontSize: 12,
};

const mensagemBox = {
  maxWidth: 980,
  margin: "0 auto",
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 40,
  textAlign: "center",
  color: "#64748b",
};

const erroBox = {
  maxWidth: 980,
  margin: "0 auto 18px",
  background: "#fee2e2",
  border: "1px solid #fecaca",
  borderRadius: 10,
  padding: 12,
  color: "#991b1b",
  fontSize: 13,
};

export default InformacaoConsultorSll;