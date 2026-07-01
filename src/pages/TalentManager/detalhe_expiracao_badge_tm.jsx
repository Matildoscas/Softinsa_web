import {
  useEffect,
  useState,
} from "react";

import {
  BiArrowBack,
  BiBell,
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

import Header from "../../components/header.jsx";
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
    valor || "badge"
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

function obterEstadoRequisito(estado) {
  const valor = String(
    estado || ""
  ).toUpperCase();

  if (valor === "APROVADO") {
    return {
      texto: "Aprovado",
      background: "#dcfce7",
      color: "#15803d",
    };
  }

  if (valor === "REJEITADO") {
    return {
      texto: "Rejeitado",
      background: "#fee2e2",
      color: "#b91c1c",
    };
  }

  if (valor === "SEM_HISTORICO") {
    return {
      texto: "Sem avaliação associada",
      background: "#e2e8f0",
      color: "#475569",
    };
  }

  return {
    texto: "Pendente",
    background: "#fef3c7",
    color: "#a16207",
  };
}

function obterUrgencia(dias) {
  if (dias === null) {
    return {
      texto: "Sem data definida",
      background: "#e2e8f0",
      color: "#475569",
      border: "#cbd5e1",
    };
  }

  if (dias < 0) {
    return {
      texto: `Expirado há ${Math.abs(
        dias
      )} dia(s)`,
      background: "#fee2e2",
      color: "#b91c1c",
      border: "#fca5a5",
    };
  }

  if (dias <= 7) {
    return {
      texto:
        dias === 0
          ? "Expira hoje"
          : `Expira em ${dias} dia(s)`,

      background: "#fee2e2",
      color: "#dc2626",
      border: "#fca5a5",
    };
  }

  if (dias <= 30) {
    return {
      texto: `Expira em ${dias} dias`,
      background: "#fef3c7",
      color: "#a16207",
      border: "#fde68a",
    };
  }

  return {
    texto: `Expira em ${dias} dias`,
    background: "#dbeafe",
    color: "#2563eb",
    border: "#93c5fd",
  };
}

/* =========================================================
   PÁGINA
========================================================= */

function DetalheExpiracaoBadgeTm() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    idBadgeAtribuido,
  } = useParams();

  const [dados, setDados] =
    useState(null);

  const [
    requisitoAberto,
    setRequisitoAberto,
  ] = useState(null);

  const [
    aNotificar,
    setANotificar,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [erro, setErro] =
    useState("");

  const [mensagem, setMensagem] =
    useState("");

  const voltarPara =
    location.state?.voltarPara ||
    "/tm/expiracao";

  const textoVoltar =
    location.state?.textoVoltar ||
    "Voltar aos badges em expiração";

  useEffect(() => {
    carregarDetalhe();
  }, [idBadgeAtribuido]);

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
          `/tm/${idUtilizador}/expiracao/${idBadgeAtribuido}/detalhes`
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
        "Erro ao carregar detalhes da expiração:",
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
          "Não foi possível carregar os detalhes do badge."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function notificarConsultor() {
    const utilizador =
      obterUtilizadorGuardado();

    const idUtilizador =
      utilizador?.id_utilizador ||
      utilizador?.ID_UTILIZADOR ||
      utilizador?.id;

    try {
      setANotificar(true);
      setErro("");
      setMensagem("");

      const response =
        await api.post(
          `/tm/${idUtilizador}/expiracao/${idBadgeAtribuido}/notificar-consultor`
        );

      setMensagem(
        response.data?.message ||
          "Consultor notificado com sucesso."
      );
    } catch (err) {
      console.error(
        "Erro ao notificar consultor:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Não foi possível notificar o consultor."
      );
    } finally {
      setANotificar(false);
    }
  }

  const consultor =
    dados?.consultor;

  const badge =
    dados?.badge;

  const historico =
    dados?.historico;

  const avaliadores =
    dados?.avaliadores;

  const requisitos =
    Array.isArray(
      dados?.requisitos
    )
      ? dados.requisitos
      : [];

  const possuiHistorico =
    Boolean(
      dados?.possui_historico
    );

  const urgencia =
    obterUrgencia(
      badge?.dias_restantes ??
        null
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
      "Detalhes da Expiração do Badge",
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
          "Badge",
          badge?.nome_badge || "",
        ],
        [
          "Nível",
          badge?.nome_nivel ||
            "Sem nível",
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
          "Data de atribuição",
          formatarData(
            badge?.data_atribuicao
          ),
        ],
        [
          "Data de validade",
          formatarData(
            badge?.data_validade
          ),
        ],
        [
          "Estado da expiração",
          urgencia.texto,
        ],
        [
          "Histórico associado",
          possuiHistorico
            ? "Sim"
            : "Não",
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
          cellWidth: 58,
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

            obterEstadoRequisito(
              requisito.estado_requisito
            ).texto,

            requisito.evidencias
              ?.map(
                (evidencia) =>
                  evidencia.nome_ficheiro ||
                  "Documento"
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
      `expiracao_${limparNomeFicheiro(
        badge?.nome_badge
      )}.pdf`
    );
  }

  function gerarExcel() {
    if (!dados) {
      return;
    }

    const linhas = [
      [
        "DETALHES DA EXPIRAÇÃO",
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
        "Data de atribuição",
        formatarData(
          badge?.data_atribuicao
        ),
      ],
      [
        "Data de validade",
        formatarData(
          badge?.data_validade
        ),
      ],
      [
        "Estado da expiração",
        urgencia.texto,
      ],
      [
        "Possui histórico",
        possuiHistorico
          ? "Sim"
          : "Não",
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

          obterEstadoRequisito(
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
      `expiracao_${limparNomeFicheiro(
        badge?.nome_badge
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
                Detalhes da Expiração
              </h1>

              <div style={subtituloPagina}>
                Informação completa do
                badge atribuído
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

          {mensagem && (
            <div style={sucessoBox}>
              <BiCheck size={17} />
              {mensagem}
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
                        <BiTimeFive
                          size={18}
                        />
                      }
                      label="Estado da conta"
                      value={
                        consultor
                          ?.estado_conta ||
                        "Não disponível"
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
                      size={40}
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

                    <span style={pontosChip}>
                      {badge?.pontos || 0} pts
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    ...urgenciaBox,

                    background:
                      urgencia.background,

                    color:
                      urgencia.color,

                    border:
                      `1px solid ${urgencia.border}`,
                  }}
                >
                  <BiTimeFive size={20} />

                  <div>
                    <div style={urgenciaTitulo}>
                      {urgencia.texto}
                    </div>

                    <div style={urgenciaData}>
                      {formatarData(
                        badge?.data_validade
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section style={datasCard}>
                <h2 style={tituloCard}>
                  Dados da atribuição
                </h2>

                <div style={datasGrid}>
                  <ResumoItem
                    label="Data de atribuição"
                    value={formatarData(
                      badge?.data_atribuicao
                    )}
                  />

                  <ResumoItem
                    label="Data de validade"
                    value={formatarData(
                      badge?.data_validade
                    )}
                  />

                  <ResumoItem
                    label="Dias restantes"
                    value={
                      badge?.dias_restantes ===
                      null
                        ? "Sem data"
                        : `${badge.dias_restantes} dia(s)`
                    }
                  />

                  <ResumoItem
                    label="Histórico associado"
                    value={
                      possuiHistorico
                        ? "Sim"
                        : "Não"
                    }
                  />
                </div>
              </section>

              {possuiHistorico ? (
                <section style={avaliacaoCard}>
                  <h2 style={tituloCard}>
                    Avaliação que atribuiu o
                    badge
                  </h2>

                  <div style={avaliadoresGrid}>
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
                      estado={
                        historico
                          ?.estado_candidaturatm
                      }
                      comentario={
                        historico
                          ?.comentarios_tm
                      }
                      data={
                        historico
                          ?.data_avaliacao_tm
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
                      estado={
                        historico
                          ?.estado_candidaturasll
                      }
                      comentario={
                        historico
                          ?.comentarios_sll
                      }
                      data={
                        historico
                          ?.data_avaliacao_sll
                      }
                    />
                  </div>
                </section>
              ) : (
                <div style={semHistoricoBox}>
                  Este badge não possui uma
                  candidatura ou histórico de
                  aprovação associado. Isto pode
                  acontecer quando o badge foi
                  atribuído manualmente.
                </div>
              )}

              <section>
                <h2 style={tituloRequisitos}>
                  Requisitos do Badge
                </h2>

                {requisitos.length > 0 ? (
                  requisitos.map(
                    (
                      requisito,
                      index
                    ) => (
                      <RequisitoCard
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
                    Este badge não possui
                    requisitos registados.
                  </div>
                )}
              </section>

              <section style={notificacaoCard}>
                <div>
                  <h2 style={tituloCard}>
                    Notificar o consultor
                  </h2>

                  <div style={notificacaoTexto}>
                    Será enviada uma notificação
                    ao consultor a informar que o
                    badge está próximo da data de
                    expiração.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={notificarConsultor}
                  disabled={aNotificar}
                  style={notificarButton}
                >
                  <BiBell size={18} />

                  {aNotificar
                    ? "A notificar..."
                    : "Notificar Consultor"}
                </button>
              </section>
            </>
          ) : (
            <div style={mensagemBox}>
              Badge não encontrado.
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

function AvaliadorCard({
  titulo,
  nome,
  email,
  estado,
  comentario,
  data,
}) {
  return (
    <article style={avaliadorCard}>
      <div style={avaliadorTopo}>
        <div style={avaliadorAvatar}>
          <BiUserCircle
            size={39}
            color="#6092bf"
          />
        </div>

        <div>
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
      </div>

      <div style={avaliadorEstado}>
        Estado:{" "}
        <strong>
          {estado || "Não disponível"}
        </strong>
      </div>

      <div style={avaliadorData}>
        Avaliado em:{" "}
        {formatarData(data)}
      </div>

      <div style={comentarioBox}>
        <strong>Comentário</strong>

        <p>
          {comentario ||
            "Sem comentário registado."}
        </p>
      </div>
    </article>
  );
}

function RequisitoCard({
  requisito,
  numero,
  aberto,
  onToggle,
}) {
  const estado =
    obterEstadoRequisito(
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
              ...estadoRequisito,

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
              Não existem evidências associadas
              a este requisito.
            </div>
          )}
        </div>
      )}
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
    "64px minmax(0, 1fr) 210px",
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

const pontosChip = {
  background: "#fef3c7",
  color: "#92400e",
  borderRadius: 5,
  padding: "4px 8px",
  fontSize: 9,
  fontWeight: 600,
};

const urgenciaBox = {
  minHeight: 55,
  borderRadius: 9,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "9px 12px",
  textAlign: "center",
};

const urgenciaTitulo = {
  fontSize: 12,
  fontWeight: 700,
};

const urgenciaData = {
  marginTop: 2,
  fontSize: 9,
};

const datasCard = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "18px 20px",
  marginBottom: 18,
};

const datasGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(4, minmax(0, 1fr))",
  gap: 16,
};

const resumoItem = {
  minHeight: 75,
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
  fontSize: 15,
  fontWeight: 800,
};

const resumoLabel = {
  marginTop: 4,
  color: "#64748b",
  fontSize: 10,
};

const avaliacaoCard = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "18px 20px",
  marginBottom: 20,
};

const avaliadoresGrid = {
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
  marginTop: 11,
  color: "#334155",
  fontSize: 10,
};

const avaliadorData = {
  marginTop: 5,
  color: "#64748b",
  fontSize: 10,
};

const comentarioBox = {
  marginTop: 9,
  borderTop: "1px solid #e2e8f0",
  paddingTop: 9,
  color: "#334155",
  fontSize: 11,
};

const semHistoricoBox = {
  width: "100%",
  boxSizing: "border-box",
  background: "#f8fafc",
  border: "1px dashed #94a3b8",
  borderRadius: 12,
  padding: "18px 20px",
  marginBottom: 20,
  color: "#64748b",
  fontSize: 12,
  lineHeight: 1.55,
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

const estadoRequisito = {
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

const notificacaoCard = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "18px 20px",
  marginTop: 20,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 25,
};

const notificacaoTexto = {
  color: "#64748b",
  fontSize: 11,
};

const notificarButton = {
  minWidth: 230,
  minHeight: 45,
  border: "none",
  borderRadius: 8,
  background: "#2563eb",
  color: "white",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "9px 17px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
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

const sucessoBox = {
  background: "#dcfce7",
  border: "1px solid #bbf7d0",
  borderRadius: 10,
  padding: 12,
  color: "#166534",
  marginBottom: 18,
  fontSize: 13,
  display: "flex",
  alignItems: "center",
  gap: 7,
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

export default DetalheExpiracaoBadgeTm;