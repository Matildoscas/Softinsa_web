import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BiArrowBack,
  BiBadge,
  BiCertification,
  BiFile,
  BiSpreadsheet,
  BiUser,
} from "react-icons/bi";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { jsPDF } from "jspdf";

import api from "../../services/api.js";
import DebugBadgePanel from "../../components/DebugBadgePanel.jsx";

import Header from "../../components/TM_Header.jsx";
import TmLeftSidebar from "../../components/TM_LeftBar.jsx";
import TmRightSidebar from "../../components/tm_right_sidebar.jsx";

import LogoSoftinsa from "../../assets/logo.png";

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

function normalizarConsultor(
  consultor
) {
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
      "Sem email",

    nome_area:
      consultor.nome_area ||
      "Sem area",

    total_badges_aprovados:
      Number(
        consultor
          .total_badges_aprovados ||
          0
      ),
  };
}

function normalizarBadge(badge) {
  return {
    id_candidatura_historico:
      badge
        .id_candidatura_historico ||
      "",

    id_badge_modelo:
      badge.id_badge_modelo ||
      "",

    nome_badge:
      badge.nome_badge ||
      "Badge sem nome",

    nome_nivel:
      badge.nome_nivel ||
      "Sem nivel",

    pontos: Number(
      badge.pontos || 0
    ),

    data_conquista:
      badge.data_entrada_historico ||
      badge.data_avaliacao_sll ||
      null,

    imagem:
      badge.imagem ||
      null,

    debug: badge.debug || null,
  };
}

function formatarData(data) {
  if (!data) {
    return new Date().toLocaleDateString(
      "pt-PT",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  }

  const date = new Date(data);

  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleDateString(
      "pt-PT",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
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
    valor || "certificado"
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

function criarCodigoVerificacao(
  certificado
) {
  if (
    certificado.codigo_verificacao
  ) {
    return certificado.codigo_verificacao;
  }

  const historico = String(
    certificado.id_candidatura_historico ||
      0
  ).padStart(6, "0");

  const utilizador = String(
    certificado.id_utilizador || 0
  ).padStart(4, "0");

  return `SL-${historico}-${utilizador}`;
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

function GerarCertificadoTm() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    talentManager,
    setTalentManager,
  ] = useState(null);

  const [
    consultores,
    setConsultores,
  ] = useState([]);

  const [badges, setBadges] =
    useState([]);

  const [
    idConsultor,
    setIdConsultor,
  ] = useState("");

  const [
    idHistorico,
    setIdHistorico,
  ] = useState("");

  const [
    certificadoPreview,
    setCertificadoPreview,
  ] = useState(null);

  const [
    isLoadingConsultores,
    setIsLoadingConsultores,
  ] = useState(true);

  const [
    isLoadingBadges,
    setIsLoadingBadges,
  ] = useState(false);

  const [
    isPreparing,
    setIsPreparing,
  ] = useState(false);

  const [erro, setErro] =
    useState("");

  const [mensagem, setMensagem] =
    useState("");

  useEffect(() => {
    carregarConsultores();
  }, []);

  async function carregarConsultores() {
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
      setIsLoadingConsultores(true);
      setErro("");

      const response =
        await api.get(
          `/tm/${idUtilizador}/certificados/consultores`
        );

      const dados =
        response.data || {};

      setTalentManager(
        dados.talentManager ||
          null
      );

      const lista =
        Array.isArray(
          dados.consultores
        )
          ? dados.consultores.map(
              normalizarConsultor
            )
          : [];

      setConsultores(lista);
    } catch (err) {
      console.error(
        "Erro ao carregar consultores:",
        err
      );

      setConsultores([]);

      setErro(
        err.response?.data?.error ||
          "Nao foi possivel carregar os consultores."
      );
    } finally {
      setIsLoadingConsultores(
        false
      );
    }
  }

  async function carregarBadges(
    novoIdConsultor
  ) {
    const utilizador =
      obterUtilizadorGuardado();

    const idUtilizador =
      utilizador?.id_utilizador ||
      utilizador?.ID_UTILIZADOR ||
      utilizador?.id;

    if (
      !novoIdConsultor ||
      !idUtilizador
    ) {
      setBadges([]);
      return;
    }

    try {
      setIsLoadingBadges(true);
      setErro("");
      setMensagem("");
      setCertificadoPreview(null);

      const response =
        await api.get(
          `/tm/${idUtilizador}/certificados/consultores/${novoIdConsultor}/badges`
        );

      const lista =
        Array.isArray(
          response.data?.badges
        )
          ? response.data.badges.map(
              normalizarBadge
            )
          : [];

      setBadges(lista);

      if (lista.length === 1) {
        setIdHistorico(
          String(
            lista[0]
              .id_candidatura_historico
          )
        );
      }
    } catch (err) {
      console.error(
        "Erro ao carregar badges:",
        err
      );

      setBadges([]);

      setErro(
        err.response?.data?.error ||
          "Nao foi possivel carregar os badges aprovados do consultor."
      );
    } finally {
      setIsLoadingBadges(false);
    }
  }

  function alterarConsultor(event) {
    const valor =
      event.target.value;

    setIdConsultor(valor);
    setIdHistorico("");
    setBadges([]);
    setMensagem("");
    setErro("");
    setCertificadoPreview(null);

    if (valor) {
      carregarBadges(valor);
    }
  }

  function alterarBadge(event) {
    setIdHistorico(
      event.target.value
    );

    setMensagem("");
    setErro("");
    setCertificadoPreview(null);
  }

  const badgeSelecionado =
    useMemo(
      () =>
        badges.find(
          (badge) =>
            String(
              badge
                .id_candidatura_historico
            ) ===
            String(idHistorico)
        ) || null,
      [
        badges,
        idHistorico,
      ]
    );

  async function prepararCertificado() {
    if (
      !idConsultor ||
      !idHistorico
    ) {
      setErro(
        "Seleciona um consultor e um badge."
      );

      return;
    }

    const utilizador =
      obterUtilizadorGuardado();

    const idUtilizador =
      utilizador?.id_utilizador ||
      utilizador?.ID_UTILIZADOR ||
      utilizador?.id;

    if (!idUtilizador) {
      setErro(
        "Nao foi possivel identificar o Talent Manager."
      );

      return;
    }

    try {
      setIsPreparing(true);
      setErro("");
      setMensagem("");

      const response =
        await api.get(
          `/tm/${idUtilizador}/certificados/historico/${idHistorico}`
        );

      const certificado =
        response.data?.certificado ||
        null;

      if (!certificado) {
        setErro(
          "Nao foi possivel obter os dados do certificado."
        );

        return;
      }

      setCertificadoPreview(
        certificado
      );
    } catch (err) {
      console.error(
        "Erro ao preparar certificado:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Nao foi possivel preparar o certificado."
      );
    } finally {
      setIsPreparing(false);
    }
  }

  async function gerarPdf() {
    if (!certificadoPreview) {
      setErro(
        "Prepara primeiro o certificado."
      );

      return;
    }

    try {
      setErro("");

      const certificado =
        certificadoPreview;

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const largura =
        pdf.internal.pageSize.getWidth();

      const altura =
        pdf.internal.pageSize.getHeight();

      const codigo =
        criarCodigoVerificacao(
          certificado
        );

      const logoDataUrl =
        await carregarImagemComoDataUrl(
          LogoSoftinsa
        );

      pdf.setDrawColor(
        37,
        99,
        235
      );

      pdf.setLineWidth(1.4);

      pdf.rect(
        10,
        10,
        largura - 20,
        altura - 20
      );

      pdf.setDrawColor(
        191,
        219,
        254
      );

      pdf.setLineWidth(0.5);

      pdf.rect(
        15,
        15,
        largura - 30,
        altura - 30
      );

      pdf.addImage(
        logoDataUrl,
        "PNG",
        largura / 2 - 24,
        22,
        48,
        14
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setTextColor(
        17,
        24,
        39
      );

      pdf.setFontSize(25);

      pdf.text(
        "Certificado de Competencias",
        largura / 2,
        54,
        {
          align: "center",
        }
      );

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(13);

      pdf.setTextColor(
        71,
        85,
        105
      );

      pdf.text(
        "Certificamos que",
        largura / 2,
        76,
        {
          align: "center",
        }
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(21);

      pdf.setTextColor(
        37,
        99,
        235
      );

      pdf.text(
        certificado.nome_completo,
        largura / 2,
        91,
        {
          align: "center",
          maxWidth: largura - 50,
        }
      );

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(12);

      pdf.setTextColor(
        71,
        85,
        105
      );

      pdf.text(
        `Consultor - Service Line: ${certificado.nome_serviceline}`,
        largura / 2,
        102,
        {
          align: "center",
        }
      );

      pdf.text(
        "concluiu com sucesso o badge",
        largura / 2,
        119,
        {
          align: "center",
        }
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(18);

      pdf.setTextColor(
        17,
        24,
        39
      );

      pdf.text(
        `${certificado.nome_badge} - Nivel ${certificado.nome_nivel}`,
        largura / 2,
        134,
        {
          align: "center",
          maxWidth: largura - 50,
        }
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
        `Area: ${certificado.nome_area}`,
        largura / 2,
        146,
        {
          align: "center",
        }
      );

      pdf.text(
        `Data de emissao: ${formatarData(
          certificado.data_entrada_historico ||
            certificado.data_avaliacao_sll
        )}`,
        35,
        165
      );

      pdf.text(
        `Codigo de verificacao: ${codigo}`,
        35,
        174
      );

      pdf.setDrawColor(
        100,
        116,
        139
      );

      pdf.line(
        43,
        altura - 37,
        105,
        altura - 37
      );

      pdf.line(
        largura - 105,
        altura - 37,
        largura - 43,
        altura - 37
      );

      pdf.setFontSize(10);

      pdf.text(
        "Service Line Leader",
        74,
        altura - 29,
        {
          align: "center",
        }
      );

      pdf.text(
        "Talent Manager",
        largura - 74,
        altura - 29,
        {
          align: "center",
        }
      );

      pdf.setFontSize(8);

      pdf.text(
        `Certificado n.o ${certificado.id_candidatura_historico}`,
        20,
        altura - 15
      );

      pdf.text(
        `${certificado.pontos || 0} pontos`,
        largura - 20,
        altura - 15,
        {
          align: "right",
        }
      );

      const nomeFicheiro =
        limparNomeFicheiro(
          `${certificado.nome_completo}_${certificado.nome_badge}`
        );

      pdf.save(
        `certificado_${nomeFicheiro}.pdf`
      );
    } catch (err) {
      console.error(
        "Erro ao gerar PDF:",
        err
      );

      setErro(
        "Nao foi possivel gerar o PDF."
      );
    }
  }

  function gerarExcel() {
    if (!certificadoPreview) {
      setErro(
        "Prepara primeiro o certificado."
      );

      return;
    }

    const certificado =
      certificadoPreview;

    const codigo =
      criarCodigoVerificacao(
        certificado
      );

    const linhas = [
      [
        "Campo",
        "Informacao",
      ],
      [
        "Consultor",
        certificado.nome_completo,
      ],
      [
        "Email",
        certificado.email,
      ],
      [
        "Service Line",
        certificado.nome_serviceline,
      ],
      [
        "Area",
        certificado.nome_area,
      ],
      [
        "Badge",
        certificado.nome_badge,
      ],
      [
        "Nivel",
        certificado.nome_nivel,
      ],
      [
        "Pontos",
        certificado.pontos || 0,
      ],
      [
        "Data de emissao",
        formatarData(
          certificado.data_entrada_historico ||
            certificado.data_avaliacao_sll
        ),
      ],
      [
        "Codigo de verificacao",
        codigo,
      ],
    ];

    const csv = linhas
      .map((linha) =>
        linha
          .map((valor) => {
            const texto = String(
              valor ?? ""
            ).replace(
              /"/g,
              '""'
            );

            return `"${texto}"`;
          })
          .join(";")
      )
      .join("\n");

    const blob = new Blob(
      [
        "\uFEFF" + csv,
      ],
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
      `certificado_${limparNomeFicheiro(
        certificado.nome_completo
      )}.csv`;

    document.body.appendChild(
      link
    );

    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  const textoVoltar =
    location.state?.textoVoltar ||
    "Voltar atras";

  const lidarComVoltar = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/tm");
    }
  };

  return (
    <div style={pagina}>
      <Header />

      <div style={corpo}>
        <TmLeftSidebar />

        <main style={conteudo}>
          <button
            type="button"
            onClick={lidarComVoltar}
            style={voltarButton}
          >
            <BiArrowBack size={18} />
            {textoVoltar}
          </button>

          <div style={separador} />

          <div style={paginaInterna}>
            <div style={cabecalhoPagina}>
              <h1 style={titulo}>
                Gerar Certificado
              </h1>

              <div style={subtitulo}>
                Especializacao:{" "}
                <strong>
                  {talentManager
                    ?.especializacao_tm ||
                    "Talent Manager"}
                </strong>
              </div>

              <div style={badgeNumero}>
                {badgeSelecionado
                  ? `Badge #${badgeSelecionado.id_candidatura_historico}`
                  : "Seleciona um badge conquistado"}
              </div>
            </div>

            {erro && (
              <div style={erroBox}>
                {erro}
              </div>
            )}

            {mensagem && (
              <div style={sucessoBox}>
                {mensagem}
              </div>
            )}

            <section
              style={certificadoCard}
            >
              <div style={cardTitulo}>
                <BiCertification
                  size={20}
                  color="#2563eb"
                />
                Informacoes do Certificado
              </div>

              <div style={formGrid}>
                <div style={campo}>
                  <label style={label}>
                    <BiUser size={16} />
                    Nome do consultor
                  </label>

                  <select
                    value={idConsultor}
                    onChange={alterarConsultor}
                    disabled={
                      isLoadingConsultores
                    }
                    style={select}
                  >
                    <option value="">
                      {isLoadingConsultores
                        ? "A carregar consultores..."
                        : consultores.length ===
                            0
                          ? "Nao existem consultores disponiveis"
                          : "Selecionar consultor"}
                    </option>

                    {consultores.map(
                      (consultor) => (
                        <option
                          key={
                            consultor.id_utilizador
                          }
                          value={
                            consultor.id_utilizador
                          }
                        >
                          {
                            consultor.nome_completo
                          }{" "}
                          -{" "}
                          {
                            consultor
                              .total_badges_aprovados
                          }{" "}
                          {consultor
                            .total_badges_aprovados ===
                          1
                            ? "badge"
                            : "badges"}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div style={campo}>
                  <label style={label}>
                    <BiBadge size={16} />
                    Badge conquistado pelo
                    consultor
                  </label>

                  <select
                    value={idHistorico}
                    onChange={alterarBadge}
                    disabled={
                      !idConsultor ||
                      isLoadingBadges
                    }
                    style={select}
                  >
                    <option value="">
                      {!idConsultor
                        ? "Seleciona primeiro o consultor"
                        : isLoadingBadges
                          ? "A carregar badges..."
                          : badges.length ===
                              0
                            ? "O consultor nao tem badges aprovados"
                            : "Selecionar badge"}
                    </option>

                    {badges.map(
                      (badge) => (
                        <option
                          key={
                            badge
                              .id_candidatura_historico
                          }
                          value={
                            badge
                              .id_candidatura_historico
                          }
                        >
                          {badge.nome_badge} -{" "}
                          {badge.nome_nivel} -{" "}
                          {formatarData(
                            badge.data_conquista
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {badgeSelecionado && (
                <div
                  style={
                    badgeSelecionadoCard
                  }
                >
                  <div
                    style={imagemBadgeBox}
                  >
                    {badgeSelecionado.imagem ? (
                      <img
                        src={
                          badgeSelecionado.imagem
                        }
                        alt={
                          badgeSelecionado
                            .nome_badge
                        }
                        style={imagemBadge}
                      />
                    ) : (
                      <BiCertification
                        size={32}
                        color="#2563eb"
                      />
                    )}
                  </div>

                  <div>
                    <div style={nomeBadge}>
                      {
                        badgeSelecionado
                          .nome_badge
                      }
                    </div>

                    <div style={dadosBadge}>
                      Nivel{" "}
                      {
                        badgeSelecionado
                          .nome_nivel
                      }{" "}
                      .{" "}
                      {
                        badgeSelecionado
                          .pontos
                      }{" "}
                      pontos . conquistado em{" "}
                      {formatarData(
                        badgeSelecionado
                          .data_conquista
                      )}
                    </div>

                    <DebugBadgePanel
                      badge={
                        badgeSelecionado
                      }
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={
                  prepararCertificado
                }
                disabled={
                  !idConsultor ||
                  !idHistorico ||
                  isPreparing
                }
                style={{
                  ...gerarButton,

                  opacity:
                    !idConsultor ||
                    !idHistorico ||
                    isPreparing
                      ? 0.55
                      : 1,

                  cursor:
                    !idConsultor ||
                    !idHistorico ||
                    isPreparing
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                <BiCertification
                  size={18}
                />

                {isPreparing
                  ? "A preparar certificado..."
                  : "Pre-visualizar certificado"}
              </button>
            </section>

            {certificadoPreview && (
              <CertificadoPreview
                certificado={
                  certificadoPreview
                }
                onPdf={gerarPdf}
                onExcel={
                  gerarExcel
                }
                onAlterar={() => {
                  setCertificadoPreview(
                    null
                  );
                }}
              />
            )}
          </div>
        </main>

        <TmRightSidebar />
      </div>
    </div>
  );
}

function CertificadoPreview({
  certificado,
  onPdf,
  onExcel,
  onAlterar,
}) {
  const codigo =
    criarCodigoVerificacao(
      certificado
    );

  return (
    <section style={previewWrapper}>
      <div style={previewTopo}>
        <h2 style={previewTitulo}>
          Pre-visualizacao do
          Certificado
        </h2>

        <button
          type="button"
          onClick={onAlterar}
          style={alterarButton}
        >
          Alterar selecao
        </button>
      </div>

      <div style={certificadoPreviewStyle}>
        <img
          src={LogoSoftinsa}
          alt="Softinsa"
          style={logoCertificado}
        />

        <h1 style={tituloCertificado}>
          Certificado de Competencias
        </h1>

        <div style={certificamosTexto}>
          Certificamos que:
        </div>

        <div style={nomeCertificado}>
          {certificado.nome_completo}
        </div>

        <div style={cargoCertificado}>
          Consultor - Service Line:{" "}
          <strong>
            {
              certificado.nome_serviceline
            }
          </strong>
        </div>

        <div style={conclusaoTexto}>
          Concluiu com sucesso o badge:
        </div>

        <div style={badgeCertificado}>
          {certificado.nome_badge} - Nivel{" "}
          {certificado.nome_nivel}
        </div>

        <div style={informacoesCertificado}>
          <div>
            <strong>Area:</strong>{" "}
            {certificado.nome_area}
          </div>

          <div>
            <strong>
              Data de emissao:
            </strong>{" "}
            {formatarData(
              certificado.data_entrada_historico ||
                certificado.data_avaliacao_sll
            )}
          </div>

          <div>
            <strong>
              Codigo de verificacao:
            </strong>{" "}
            {codigo}
          </div>
        </div>

        <div style={assinaturas}>
          <div style={assinatura}>
            <div
              style={linhaAssinatura}
            />

            <div>
              Service Line Leader
            </div>
          </div>

          <div style={assinatura}>
            <div
              style={linhaAssinatura}
            />

            <div>
              Talent Manager
            </div>
          </div>
        </div>

        <div style={acoesCertificado}>
          <button
            type="button"
            onClick={onPdf}
            style={pdfPreviewButton}
          >
            <BiFile size={17} />
            Gerar PDF
          </button>

          <button
            type="button"
            onClick={onExcel}
            style={excelPreviewButton}
          >
            <BiSpreadsheet
              size={17}
            />
            Gerar Excel
          </button>
        </div>
      </div>
    </section>
  );
}

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

const paginaInterna = {
  width: "100%",
  boxSizing: "border-box",
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
  width: "100%",
  marginBottom: 22,
};

const titulo = {
  margin: 0,
  fontSize: 21,
  fontWeight: 800,
  color: "#111827",
};

const subtitulo = {
  marginTop: 4,
  fontSize: 12,
  color: "#64748b",
};

const badgeNumero = {
  marginTop: 3,
  fontSize: 11,
  color: "#374151",
};

const certificadoCard = {
  width: "100%",
  minHeight: 370,
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #bfdbfe",
  borderRadius: 12,
  padding: "22px 24px",
  boxShadow:
    "0 2px 6px rgba(15,23,42,0.04)",
};

const cardTitulo = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 14,
  fontWeight: 700,
  color: "#334155",
  marginBottom: 22,
};

const formGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: 20,
};

const campo = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  minWidth: 0,
};

const label = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  color: "#475569",
  fontWeight: 600,
};

const select = {
  width: "100%",
  height: 44,
  border: "1px solid #dbe3ef",
  borderRadius: 9,
  padding: "0 12px",
  background: "white",
  color: "#111827",
  outline: "none",
  boxSizing: "border-box",
  fontSize: 13,
};

const badgeSelecionadoCard = {
  marginTop: 20,
  border: "1px solid #dbeafe",
  borderRadius: 10,
  background: "#f8fafc",
  padding: "13px 15px",
  display: "flex",
  alignItems: "center",
  gap: 13,
};

const imagemBadgeBox = {
  width: 56,
  height: 56,
  borderRadius: "50%",
  background: "#eff6ff",
  border: "2px solid #dbeafe",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  flexShrink: 0,
};

const imagemBadge = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  borderRadius: "50%",
};

const nomeBadge = {
  fontSize: 14,
  fontWeight: 700,
  color: "#111827",
};

const dadosBadge = {
  marginTop: 4,
  fontSize: 11,
  color: "#64748b",
};

const gerarButton = {
  width: "100%",
  minHeight: 48,
  border: "none",
  borderRadius: 9,
  background: "#2563eb",
  color: "white",
  marginTop: 24,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontSize: 13,
  fontWeight: 700,
};

const previewWrapper = {
  width: "100%",
  marginTop: 26,
};

const previewTopo = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 18,
  marginBottom: 12,
};

const previewTitulo = {
  margin: 0,
  fontSize: 18,
  fontWeight: 800,
  color: "#111827",
};

const alterarButton = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "white",
  color: "#475569",
  padding: "8px 13px",
  fontSize: 12,
  cursor: "pointer",
};

const certificadoPreviewStyle = {
  width: "100%",
  minHeight: 650,
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #bfdbfe",
  borderRadius: 12,
  padding: "38px 64px 24px",
  textAlign: "center",
  boxShadow:
    "0 3px 8px rgba(15,23,42,0.08)",
};

const logoCertificado = {
  width: 170,
  height: "auto",
  objectFit: "contain",
};

const tituloCertificado = {
  margin: "18px 0 0",
  fontSize: 29,
  fontWeight: 800,
  color: "#111827",
};

const certificamosTexto = {
  marginTop: 52,
  fontSize: 18,
  color: "#374151",
};

const nomeCertificado = {
  marginTop: 12,
  fontSize: 25,
  fontWeight: 800,
  color: "#2563eb",
};

const cargoCertificado = {
  marginTop: 7,
  fontSize: 15,
  color: "#475569",
};

const conclusaoTexto = {
  marginTop: 40,
  fontSize: 18,
  color: "#374151",
};

const badgeCertificado = {
  marginTop: 12,
  fontSize: 22,
  fontWeight: 700,
  color: "#111827",
};

const informacoesCertificado = {
  marginTop: 42,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 10,
  maxWidth: 650,
  marginLeft: "auto",
  marginRight: "auto",
  color: "#374151",
  fontSize: 14,
  textAlign: "left",
};

const assinaturas = {
  marginTop: 72,
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: 90,
  maxWidth: 700,
  marginLeft: "auto",
  marginRight: "auto",
};

const assinatura = {
  color: "#334155",
  fontSize: 13,
};

const linhaAssinatura = {
  height: 1,
  background: "#64748b",
  marginBottom: 9,
};

const acoesCertificado = {
  marginTop: 46,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  flexWrap: "wrap",
};

const pdfPreviewButton = {
  minHeight: 42,
  border: "none",
  borderRadius: 9,
  background: "#dc2626",
  color: "white",
  padding: "9px 18px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const excelPreviewButton = {
  minHeight: 42,
  border: "none",
  borderRadius: 9,
  background: "#16a34a",
  color: "white",
  padding: "9px 18px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const erroBox = {
  width: "100%",
  boxSizing: "border-box",
  marginBottom: 18,
  background: "#fee2e2",
  border: "1px solid #fecaca",
  borderRadius: 10,
  padding: 12,
  color: "#991b1b",
  fontSize: 13,
};

const sucessoBox = {
  width: "100%",
  boxSizing: "border-box",
  marginBottom: 18,
  background: "#dcfce7",
  border: "1px solid #bbf7d0",
  borderRadius: 10,
  padding: 12,
  color: "#166534",
  fontSize: 13,
};

export default GerarCertificadoTm;
