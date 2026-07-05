import {
  useEffect,
  useState,
} from "react";

import {
  BiArrowBack,
  BiBadgeCheck,
  BiCalendar,
  BiCheck,
  BiChevronDown,
  BiChevronUp,
  BiDownload,
  BiEnvelope,
  BiFile,
  BiMedal,
  BiSpreadsheet,
  BiTimeFive,
  BiUserCircle,
  BiX,
} from "react-icons/bi";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import api from "../../services/api.js";

import Header from "../../components/Header.jsx";
import TmLeftSidebar from "../../components/tm_left_sidebar.jsx";
import TmRightSidebar from "../../components/tm_right_sidebar.jsx";

/* =========================================================
   UTILIZADOR
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

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
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

function limparNomeFicheiro(valor) {
  return String(
    valor || "candidatura"
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

function obterUrlFicheiro(caminho) {
  if (!caminho) {
    return "";
  }

  if (
    /^https?:\/\//i.test(caminho)
  ) {
    return caminho;
  }

  const baseUrl = String(
    api.defaults.baseURL || ""
  ).replace(/\/api\/?$/, "");

  return `${baseUrl}${
    caminho.startsWith("/")
      ? ""
      : "/"
  }${caminho}`;
}

function obterEstadoVisual(estado) {
  const valor = String(
    estado || ""
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toUpperCase();

  if (valor.includes("APROV")) {
    return {
      texto: "Aprovado",
      background: "#dcfce7",
      color: "#15803d",
      border: "#86efac",
      icon: <BiCheck size={18} />,
    };
  }

  if (
    valor.includes("REJEIT") ||
    valor.includes("RECUS")
  ) {
    return {
      texto: "Recusado",
      background: "#fee2e2",
      color: "#dc2626",
      border: "#fca5a5",
      icon: <BiX size={18} />,
    };
  }

  return {
    texto: estado || "Sem estado",
    background: "#fef3c7",
    color: "#a16207",
    border: "#fde68a",
    icon: <BiTimeFive size={18} />,
  };
}

/* =========================================================
   PÁGINA
========================================================= */

function DetalheHistoricoTm() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    idHistorico,
  } = useParams();

  const [dados, setDados] =
    useState(null);

  const [
    requisitoAberto,
    setRequisitoAberto,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [erro, setErro] =
    useState("");

  const voltarPara =
    location.state?.voltarPara ||
    "/tm/historico";

  const textoVoltar =
    location.state?.textoVoltar ||
    "Voltar ao histórico";

  useEffect(() => {
    carregarDetalhe();
  }, [idHistorico]);

  async function carregarDetalhe() {
    const utilizador =
      obterUtilizadorGuardado();

    const idUtilizador =
      utilizador?.id_utilizador ||
      utilizador?.ID_UTILIZADOR ||
      utilizador?.id;

    if (!idUtilizador) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    try {
      setIsLoading(true);
      setErro("");

      const response =
        await api.get(
          `/tm/${idUtilizador}/historico/${idHistorico}`
        );

      setDados(response.data);

      setRequisitoAberto(
        response.data
          ?.requisitos?.[0]
          ?.id_requisitos ||
          null
      );
    } catch (err) {
      console.error(
        "Erro ao carregar detalhe do histórico:",
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

      setDados(null);

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar os detalhes da candidatura."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const historico =
    dados?.historico;

  const candidatura =
    dados?.candidatura;

  const consultor =
    dados?.consultor;

  const badge =
    dados?.badge;

  const avaliadores =
    dados?.avaliadores;

  const requisitos =
    Array.isArray(
      dados?.requisitos
    )
      ? dados.requisitos
      : [];

  const estadoFinal =
    obterEstadoVisual(
      historico?.estado_final
    );

  function gerarPdf() {
    if (!dados) {
      return;
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(18);

    pdf.text(
      "Detalhes da Candidatura",
      14,
      17
    );

    pdf.setFontSize(13);
    pdf.setTextColor(
      37,
      99,
      235
    );

    pdf.text(
      badge?.nome_badge ||
        "Badge",
      14,
      27
    );

    pdf.setTextColor(
      17,
      24,
      39
    );

    autoTable(pdf, {
      startY: 34,

      head: [
        [
          "Campo",
          "Informação",
        ],
      ],

      body: [
        [
          "Consultor",
          consultor?.nome_completo ||
            "",
        ],
        [
          "Email",
          consultor?.email || "",
        ],
        [
          "Área",
          badge?.nome_area ||
            consultor?.nome_area ||
            "",
        ],
        [
          "Service Line",
          badge?.nome_serviceline ||
            "",
        ],
        [
          "Estado final",
          estadoFinal.texto,
        ],
        [
          "Data de submissão",
          formatarData(
            historico?.data_submissao
          ),
        ],
        [
          "Avaliação TM",
          formatarData(
            historico
              ?.data_avaliacao_tm
          ),
        ],
        [
          "Avaliação SLL",
          formatarData(
            historico
              ?.data_avaliacao_sll
          ),
        ],
        [
          "Requisitos completos",
          historico
            ?.numero_requisitos_completos ??
            0,
        ],
        [
          "Requisitos em falta",
          historico
            ?.numero_requisitos_faltantes ??
            0,
        ],
        [
          "Duração",
          historico?.duracao_dias ===
          null
            ? "Não disponível"
            : `${historico.duracao_dias} dia(s)`,
        ],
        [
          "Motivo final",
          historico
            ?.motivo_estado_final ||
            "Sem comentário",
        ],
      ],

      styles: {
        fontSize: 9,
        cellPadding: 4,
      },

      headStyles: {
        fillColor: [
          37,
          99,
          235,
        ],
      },

      columnStyles: {
        0: {
          cellWidth: 55,
          fontStyle: "bold",
        },
      },
    });

    if (requisitos.length > 0) {
      const inicio =
        pdf.lastAutoTable.finalY +
        10;

      pdf.setFontSize(13);

      pdf.text(
        "Requisitos",
        14,
        inicio
      );

      autoTable(pdf, {
        startY: inicio + 5,

        head: [
          [
            "Requisito",
            "Estado",
            "Evidências",
          ],
        ],

        body: requisitos.map(
          (requisito, index) => [
            `${index + 1} - ${
              requisito.titulo ||
              requisito.nome_requisito
            }`,

            obterEstadoVisual(
              requisito.estado_requisito
            ).texto,

            requisito.evidencias
              ?.map(
                (evidencia) =>
                  evidencia.nome_ficheiro ||
                  "Evidência"
              )
              .join(", ") ||
              "Sem evidências",
          ]
        ),

        styles: {
          fontSize: 8,
        },

        headStyles: {
          fillColor: [
            37,
            99,
            235,
          ],
        },
      });
    }

    pdf.save(
      `candidatura_${limparNomeFicheiro(
        consultor?.nome_completo
      )}.pdf`
    );
  }

  function gerarExcel() {
    if (!dados) {
      return;
    }

    const linhas = [
      [
        "DETALHES DA CANDIDATURA",
      ],
      [
        "Consultor",
        consultor?.nome_completo,
      ],
      [
        "Email",
        consultor?.email,
      ],
      [
        "Badge",
        badge?.nome_badge,
      ],
      [
        "Nível",
        badge?.nome_nivel,
      ],
      [
        "Área",
        badge?.nome_area,
      ],
      [
        "Service Line",
        badge?.nome_serviceline,
      ],
      [
        "Estado final",
        estadoFinal.texto,
      ],
      [
        "Submissão",
        formatarData(
          historico?.data_submissao
        ),
      ],
      [
        "Avaliação TM",
        formatarData(
          historico
            ?.data_avaliacao_tm
        ),
      ],
      [
        "Avaliação SLL",
        formatarData(
          historico
            ?.data_avaliacao_sll
        ),
      ],
      [
        "Requisitos completos",
        historico
          ?.numero_requisitos_completos,
      ],
      [
        "Requisitos em falta",
        historico
          ?.numero_requisitos_faltantes,
      ],
      [
        "Motivo final",
        historico
          ?.motivo_estado_final,
      ],
      [],
      [
        "REQUISITOS",
      ],
      [
        "Número",
        "Requisito",
        "Estado",
        "Evidências",
      ],
      ...requisitos.map(
        (requisito, index) => [
          index + 1,

          requisito.titulo ||
            requisito.nome_requisito,

          obterEstadoVisual(
            requisito.estado_requisito
          ).texto,

          requisito.evidencias
            ?.map(
              (evidencia) =>
                evidencia.nome_ficheiro
            )
            .join(", ") ||
            "Sem evidências",
        ]
      ),
    ];

    const csv = linhas
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
      `candidatura_${limparNomeFicheiro(
        consultor?.nome_completo
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
        <TmLeftSidebar />

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

          <div style={cabecalhoPagina}>
            <div>
              <h1 style={tituloPagina}>
                Detalhes da Candidatura
              </h1>

              <div style={subtituloPagina}>
                Informação completa da
                avaliação do badge
              </div>
            </div>

            <div style={acoesExportacao}>
              <button
                type="button"
                onClick={gerarExcel}
                style={excelButton}
              >
                <BiSpreadsheet
                  size={17}
                />
                Excel
              </button>

              <button
                type="button"
                onClick={gerarPdf}
                style={pdfButton}
              >
                <BiFile size={17} />
                PDF
              </button>
            </div>
          </div>

          {erro && (
            <div style={erroBox}>
              {erro}
            </div>
          )}

          {isLoading ? (
            <div style={mensagemBox}>
              A carregar detalhes...
            </div>
          ) : dados ? (
            <>
              <section style={perfilCard}>
                <h2 style={tituloCard}>
                  Perfil do Consultor
                </h2>

                <div style={perfilGrid}>
                  <div style={identidade}>
                    <div style={avatar}>
                      <BiUserCircle
                        size={76}
                        color="#6092bf"
                      />
                    </div>

                    <div style={nomeConsultor}>
                      {
                        consultor
                          ?.nome_completo
                      }
                    </div>

                    <span style={cargoBadge}>
                      Consultor
                    </span>
                  </div>

                  <div style={informacoesGrid}>
                    <InfoItem
                      icon={
                        <BiEnvelope
                          size={18}
                        />
                      }
                      label="Email"
                      value={
                        consultor?.email
                      }
                    />

                    <InfoItem
                      icon={
                        <BiCalendar
                          size={18}
                        />
                      }
                      label="Entrada na empresa"
                      value={formatarData(
                        consultor
                          ?.data_entrada_empresa
                      )}
                    />

                    <InfoItem
                      icon={
                        <BiMedal
                          size={18}
                        />
                      }
                      label="Área"
                      value={
                        consultor
                          ?.nome_area
                      }
                    />

                    <InfoItem
                      icon={
                        <BiBadgeCheck
                          size={18}
                        />
                      }
                      label="Estado final"
                      value={
                        estadoFinal.texto
                      }
                    />
                  </div>
                </div>
              </section>

              <section style={badgeCard}>
                <div style={badgeImagemBox}>
                  {badge?.imagem ? (
                    <img
                      src={badge.imagem}
                      alt={
                        badge.nome_badge
                      }
                      style={badgeImagem}
                    />
                  ) : (
                    <BiMedal
                      size={38}
                      color="#2563eb"
                    />
                  )}
                </div>

                <div style={badgeInfo}>
                  <div style={badgeNome}>
                    {badge?.nome_badge}

                    {badge?.nome_nivel
                      ? ` - ${badge.nome_nivel}`
                      : ""}
                  </div>

                  <div style={badgeDescricao}>
                    {
                      badge
                        ?.descricao_badge_modelo
                    }
                  </div>

                  <div style={chipsLinha}>
                    <span style={chip}>
                      {badge?.nome_area ||
                        "Sem área"}
                    </span>

                    <span style={chip}>
                      {badge
                        ?.nome_serviceline ||
                        "Sem Service Line"}
                    </span>

                    <span style={chipPontos}>
                      {badge?.pontos || 0} pts
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    ...estadoFinalBox,
                    background:
                      estadoFinal.background,
                    color:
                      estadoFinal.color,
                    border:
                      `1px solid ${estadoFinal.border}`,
                  }}
                >
                  {estadoFinal.icon}
                  {estadoFinal.texto}
                </div>
              </section>

              <section style={decisoesCard}>
                <h2 style={tituloCard}>
                  Avaliação da Candidatura
                </h2>

                <div style={decisoesGrid}>
                  <AvaliadorCard
                    titulo="Talent Manager"
                    nome={
                      avaliadores
                        ?.talentManager
                        ?.nome_completo
                    }
                    email={
                      avaliadores
                        ?.talentManager
                        ?.email
                    }
                    data={historico
                      ?.data_avaliacao_tm}
                    estado={
                      candidatura
                        ?.estado_candidaturatm
                    }
                    comentario={
                      candidatura
                        ?.comentarios_tm
                    }
                  />

                  <AvaliadorCard
                    titulo="Service Line Leader"
                    nome={
                      avaliadores
                        ?.serviceLineLeader
                        ?.nome_completo
                    }
                    email={
                      avaliadores
                        ?.serviceLineLeader
                        ?.email
                    }
                    data={historico
                      ?.data_avaliacao_sll}
                    estado={
                      candidatura
                        ?.estado_candidaturasll
                    }
                    comentario={
                      candidatura
                        ?.comentarios_sll
                    }
                  />
                </div>

                {historico
                  ?.motivo_estado_final && (
                  <div style={motivoFinalBox}>
                    <strong>
                      Motivo do estado final
                    </strong>

                    <p>
                      {
                        historico
                          .motivo_estado_final
                      }
                    </p>
                  </div>
                )}
              </section>

              <section>
                <h2 style={tituloRequisitos}>
                  Requisitos e Evidências
                </h2>

                {requisitos.length > 0 ? (
                  requisitos.map(
                    (
                      requisito,
                      index
                    ) => (
                      <RequisitoHistoricoCard
                        key={
                          requisito.id_requisitos
                        }
                        requisito={
                          requisito
                        }
                        numero={index + 1}
                        aberto={
                          requisitoAberto ===
                          requisito.id_requisitos
                        }
                        onToggle={() =>
                          setRequisitoAberto(
                            requisitoAberto ===
                              requisito.id_requisitos
                              ? null
                              : requisito.id_requisitos
                          )
                        }
                      />
                    )
                  )
                ) : (
                  <div style={mensagemBox}>
                    Não existem requisitos
                    registados.
                  </div>
                )}
              </section>

              <section style={resumoCard}>
                <h2 style={tituloCard}>
                  Resumo Final
                </h2>

                <div style={resumoGrid}>
                  <ResumoItem
                    label="Requisitos completos"
                    value={
                      historico
                        ?.numero_requisitos_completos ||
                      0
                    }
                  />

                  <ResumoItem
                    label="Requisitos em falta"
                    value={
                      historico
                        ?.numero_requisitos_faltantes ||
                      0
                    }
                  />

                  <ResumoItem
                    label="Duração do processo"
                    value={
                      historico
                        ?.duracao_dias ===
                      null
                        ? "Não disponível"
                        : `${historico.duracao_dias} dia(s)`
                    }
                  />

                  <ResumoItem
                    label="Data de expiração"
                    value={
                      badge?.data_validade
                        ? formatarData(
                            badge.data_validade
                          )
                        : estadoFinal.texto ===
                            "Recusado"
                          ? "Não aplicável"
                          : "Sem data"
                    }
                  />
                </div>

                <div
                  style={{
                    ...barraEstadoFinal,
                    background:
                      estadoFinal.background,
                    color:
                      estadoFinal.color,
                    border:
                      `1px solid ${estadoFinal.border}`,
                  }}
                >
                  {estadoFinal.icon}
                  {estadoFinal.texto}
                </div>
              </section>
            </>
          ) : (
            <div style={mensagemBox}>
              Candidatura não encontrada.
            </div>
          )}
        </main>

        <TmRightSidebar />
      </div>
    </div>
  );
}

/* =========================================================
   COMPONENTES
========================================================= */

function InfoItem({
  icon,
  label,
  value,
}) {
  return (
    <div style={infoItem}>
      <div style={infoIcon}>
        {icon}
      </div>

      <div>
        <div style={infoLabel}>
          {label}
        </div>

        <div style={infoValue}>
          {value || "Não disponível"}
        </div>
      </div>
    </div>
  );
}

function AvaliadorCard({
  titulo,
  nome,
  email,
  data,
  estado,
  comentario,
}) {
  const estadoVisual =
    obterEstadoVisual(estado);

  return (
    <article style={avaliadorCard}>
      <div style={avaliadorTopo}>
        <div style={avaliadorAvatar}>
          <BiUserCircle
            size={39}
            color="#6092bf"
          />
        </div>

        <div style={{ flex: 1 }}>
          <div style={avaliadorTipo}>
            {titulo}
          </div>

          <div style={avaliadorNome}>
            {nome || "Não disponível"}
          </div>

          <div style={avaliadorEmail}>
            {email || "Sem email"}
          </div>
        </div>

        <div
          style={{
            ...avaliadorEstado,
            background:
              estadoVisual.background,
            color:
              estadoVisual.color,
          }}
        >
          {estadoVisual.texto}
        </div>
      </div>

      <div style={avaliadorData}>
        Avaliado em:{" "}
        {formatarData(data)}
      </div>

      <div style={comentarioAvaliador}>
        <strong>Comentário</strong>

        <p>
          {comentario ||
            "Não foi registado nenhum comentário."}
        </p>
      </div>
    </article>
  );
}

function RequisitoHistoricoCard({
  requisito,
  numero,
  aberto,
  onToggle,
}) {
  const estado =
    obterEstadoVisual(
      requisito.estado_requisito
    );

  return (
    <article style={requisitoCard}>
      <button
        type="button"
        onClick={onToggle}
        style={requisitoHeader}
      >
        <div style={requisitoTituloArea}>
          <strong>
            Requisito {numero}
          </strong>

          <span>
            -{" "}
            {requisito.titulo ||
              requisito.nome_requisito}
          </span>

          <span
            style={{
              ...requisitoEstado,
              background:
                estado.background,
              color: estado.color,
            }}
          >
            {estado.texto}
          </span>
        </div>

        {aberto ? (
          <BiChevronUp size={21} />
        ) : (
          <BiChevronDown size={21} />
        )}
      </button>

      {aberto && (
        <div style={requisitoBody}>
          <div style={blocoTexto}>
            <strong>Descrição</strong>

            <p>
              {requisito
                .descricao_requisito ||
                "Sem descrição."}
            </p>
          </div>

          {requisito.evidencias
            ?.length > 0 ? (
            requisito.evidencias.map(
              (evidencia) => (
                <div
                  key={
                    evidencia.id_evidencia
                  }
                  style={evidenciaBloco}
                >
                  <div style={blocoTexto}>
                    <strong>
                      Evidência apresentada
                    </strong>

                    <p>
                      {evidencia.descricao ||
                        "Sem descrição."}
                    </p>
                  </div>

                  <div style={documentoCard}>
                    <BiFile
                      size={20}
                      color="#64748b"
                    />

                    <div style={documentoInfo}>
                      <div style={documentoNome}>
                        {evidencia.nome_ficheiro ||
                          "Documento"}
                      </div>

                      <div style={documentoFormato}>
                        {evidencia.formato_ficheiro ||
                          "Ficheiro"}
                      </div>
                    </div>

                    {evidencia.caminho_ficheiro && (
                      <a
                        href={obterUrlFicheiro(
                          evidencia.caminho_ficheiro
                        )}
                        target="_blank"
                        rel="noreferrer"
                        style={visualizarLink}
                      >
                        <BiDownload
                          size={16}
                        />
                        Visualizar
                      </a>
                    )}
                  </div>
                </div>
              )
            )
          ) : (
            <div style={semEvidencias}>
              Não existem evidências
              associadas a este requisito.
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function ResumoItem({
  label,
  value,
}) {
  return (
    <div style={resumoItem}>
      <div style={resumoValor}>
        {value}
      </div>

      <div style={resumoLabel}>
        {label}
      </div>
    </div>
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
  margin: "16px 0 20px",
};

const cabecalhoPagina = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 20,
  marginBottom: 22,
};

const tituloPagina = {
  margin: 0,
  color: "#111827",
  fontSize: 21,
  fontWeight: 800,
};

const subtituloPagina = {
  marginTop: 4,
  color: "#64748b",
  fontSize: 12,
};

const acoesExportacao = {
  display: "flex",
  gap: 10,
};

const excelButton = {
  minHeight: 40,
  border: "none",
  borderRadius: 8,
  background: "#16a34a",
  color: "white",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: "8px 18px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const pdfButton = {
  minHeight: 40,
  border: "none",
  borderRadius: 8,
  background: "#dc2626",
  color: "white",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: "8px 18px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const perfilCard = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "19px 22px",
  marginBottom: 18,
};

const tituloCard = {
  margin: "0 0 15px",
  color: "#111827",
  fontSize: 16,
  fontWeight: 700,
};

const perfilGrid = {
  display: "grid",
  gridTemplateColumns:
    "190px minmax(0, 1fr)",
  gap: 28,
  alignItems: "center",
};

const identidade = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const avatar = {
  width: 87,
  height: 87,
  borderRadius: "50%",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const nomeConsultor = {
  marginTop: 8,
  color: "#111827",
  fontSize: 14,
  fontWeight: 600,
};

const cargoBadge = {
  marginTop: 5,
  background: "#dbeafe",
  color: "#2563eb",
  borderRadius: 999,
  padding: "4px 17px",
  fontSize: 10,
};

const informacoesGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: 20,
};

const infoItem = {
  display: "flex",
  alignItems: "flex-start",
  gap: 9,
};

const infoIcon = {
  color: "#6092bf",
  marginTop: 2,
};

const infoLabel = {
  color: "#94a3b8",
  fontSize: 10,
};

const infoValue = {
  marginTop: 2,
  color: "#334155",
  fontSize: 12,
  fontWeight: 500,
};

const badgeCard = {
  width: "100%",
  boxSizing: "border-box",
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: 12,
  padding: "16px 20px",
  display: "grid",
  gridTemplateColumns:
    "64px minmax(0, 1fr) 155px",
  gap: 18,
  alignItems: "center",
  marginBottom: 18,
};

const badgeImagemBox = {
  width: 60,
  height: 60,
  borderRadius: "50%",
  background: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const badgeImagem = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
};

const badgeInfo = {
  minWidth: 0,
};

const badgeNome = {
  color: "#2563eb",
  fontSize: 15,
  fontWeight: 600,
};

const badgeDescricao = {
  marginTop: 4,
  color: "#64748b",
  fontSize: 11,
  lineHeight: 1.5,
};

const chipsLinha = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  flexWrap: "wrap",
  marginTop: 8,
};

const chip = {
  background: "#dbeafe",
  color: "#2563eb",
  borderRadius: 5,
  padding: "4px 8px",
  fontSize: 9,
};

const chipPontos = {
  background: "#fef3c7",
  color: "#92400e",
  borderRadius: 5,
  padding: "4px 8px",
  fontSize: 9,
  fontWeight: 600,
};

const estadoFinalBox = {
  minHeight: 42,
  borderRadius: 9,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 600,
};

const decisoesCard = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "18px 20px",
  marginBottom: 20,
};

const decisoesGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: 18,
};

const avaliadorCard = {
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  background: "#f8fafc",
  padding: "14px 16px",
};

const avaliadorTopo = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const avaliadorAvatar = {
  width: 45,
  height: 45,
  borderRadius: "50%",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const avaliadorTipo = {
  color: "#2563eb",
  fontSize: 10,
  fontWeight: 600,
};

const avaliadorNome = {
  color: "#111827",
  fontSize: 12,
  fontWeight: 600,
};

const avaliadorEmail = {
  color: "#64748b",
  fontSize: 9,
};

const avaliadorEstado = {
  borderRadius: 999,
  padding: "4px 9px",
  fontSize: 9,
  fontWeight: 600,
};

const avaliadorData = {
  marginTop: 10,
  color: "#64748b",
  fontSize: 10,
};

const comentarioAvaliador = {
  marginTop: 9,
  borderTop: "1px solid #e2e8f0",
  paddingTop: 9,
  color: "#334155",
  fontSize: 11,
};

const motivoFinalBox = {
  marginTop: 16,
  border: "1px solid #fecaca",
  borderRadius: 9,
  background: "#fff1f2",
  padding: "12px 14px",
  color: "#9f1239",
  fontSize: 12,
};

const tituloRequisitos = {
  margin: "0 0 12px",
  color: "#111827",
  fontSize: 16,
  fontWeight: 700,
};

const requisitoCard = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  overflow: "hidden",
  marginBottom: 14,
};

const requisitoHeader = {
  width: "100%",
  border: "none",
  background: "white",
  padding: "16px 18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  cursor: "pointer",
  textAlign: "left",
};

const requisitoTituloArea = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  flexWrap: "wrap",
  color: "#111827",
  fontSize: 13,
};

const requisitoEstado = {
  marginLeft: 10,
  borderRadius: 999,
  padding: "4px 10px",
  fontSize: 9,
  fontWeight: 600,
};

const requisitoBody = {
  borderTop: "1px solid #e5e7eb",
  padding: "16px 18px 18px",
};

const blocoTexto = {
  color: "#111827",
  fontSize: 12,
  lineHeight: 1.5,
};

const evidenciaBloco = {
  marginTop: 14,
};

const documentoCard = {
  marginTop: 8,
  minHeight: 53,
  border: "1px solid #dbe3ef",
  borderRadius: 9,
  background: "#f8fafc",
  padding: "9px 12px",
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const documentoInfo = {
  flex: 1,
  minWidth: 0,
};

const documentoNome = {
  color: "#334155",
  fontSize: 11,
  fontWeight: 600,
};

const documentoFormato = {
  color: "#94a3b8",
  fontSize: 9,
};

const visualizarLink = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  color: "#2563eb",
  fontSize: 11,
  textDecoration: "none",
};

const semEvidencias = {
  marginTop: 12,
  background: "#f8fafc",
  border: "1px dashed #cbd5e1",
  borderRadius: 8,
  padding: 14,
  color: "#64748b",
  fontSize: 11,
};

const resumoCard = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "18px 20px",
  marginTop: 20,
};

const resumoGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(4, minmax(0, 1fr))",
  gap: 16,
};

const resumoItem = {
  minHeight: 76,
  border: "1px solid #e2e8f0",
  borderRadius: 9,
  background: "#f8fafc",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 10,
  textAlign: "center",
};

const resumoValor = {
  color: "#2563eb",
  fontSize: 16,
  fontWeight: 800,
};

const resumoLabel = {
  marginTop: 4,
  color: "#64748b",
  fontSize: 10,
};

const barraEstadoFinal = {
  minHeight: 45,
  marginTop: 18,
  borderRadius: 9,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  fontSize: 13,
  fontWeight: 600,
};

const erroBox = {
  background: "#fee2e2",
  border: "1px solid #fecaca",
  borderRadius: 10,
  padding: 12,
  color: "#991b1b",
  marginBottom: 18,
  fontSize: 13,
};

const mensagemBox = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 40,
  textAlign: "center",
  color: "#64748b",
};

export default DetalheHistoricoTm;