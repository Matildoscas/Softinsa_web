import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  BiArrowBack,
  BiFile,
  BiMedal,
  BiSave,
  BiUser,
  BiX,
} from "react-icons/bi";

import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

import { useNavigate } from "react-router-dom";

import api from "../../services/api.js";

import Header from "../../components/Header.jsx";
import SllLeftSidebar from "../../components/sll_left_sidebar.jsx";
import SllRightSidebar from "../../components/sll_right_sidebar.jsx";

import LogoSoftinsa from '../../assets/logo.png';

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
   DATAS
========================================================= */

function obterDataHoje() {
  const data = new Date();

  return data
    .toISOString()
    .split("T")[0];
}

function obterDataInicioPadrao() {
  const data = new Date();

  data.setMonth(
    data.getMonth() - 6
  );

  return data
    .toISOString()
    .split("T")[0];
}

function formatarData(data) {
  if (!data) {
    return "";
  }

  const date = new Date(
    `${data}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return data;
  }

  return date.toLocaleDateString(
    "pt-PT"
  );
}

/* =========================================================
   PÁGINA
========================================================= */

function GerarRelatorioSll() {
  const navigate = useNavigate();

  const relatorioRef =
    useRef(null);

  const pdfRelatorioRef = useRef(null);

  const [
    areaUtilizador,
    setAreaUtilizador,
  ] = useState(null);

  const [
    serviceLine,
    setServiceLine,
  ] = useState(null);

  const [
    dataInicio,
    setDataInicio,
  ] = useState(
    obterDataInicioPadrao()
  );

  const [dataFim, setDataFim] =
    useState(obterDataHoje());

  const [
    relatorio,
    setRelatorio,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isGenerating,
    setIsGenerating,
  ] = useState(false);

  const [erro, setErro] =
    useState("");

  const [mensagem, setMensagem] =
    useState("");

  useEffect(() => {
    carregarAreas();
  }, []);

  async function carregarAreas() {
    const utilizador =
      obterUtilizadorGuardado();

    const idUtilizador =
      utilizador?.id_utilizador ||
      utilizador?.ID_UTILIZADOR ||
      utilizador?.id;

    if (!idUtilizador) {
      setErro(
        "Não foi possível identificar o Service Line Leader."
      );

      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErro("");

      const response = await api.get(
        `/sll/${idUtilizador}/relatorios/areas`
      );

      const dados = response.data;

      setServiceLine(
        dados.serviceLine || null
      );

      setAreaUtilizador(
        dados.area_utilizador ||
          null
      );
    } catch (err) {
      console.error(
        "Erro ao carregar contexto:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar o contexto do relatório."
      );
      setAreaUtilizador(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function gerarRelatorio() {
    if (
      !dataInicio ||
      !dataFim
    ) {
      setErro(
        "Seleciona o período."
      );

      return;
    }

    if (!areaUtilizador?.id_areas) {
      setErro(
        "O utilizador não tem área associada para gerar relatório."
      );

      return;
    }

    if (
      new Date(dataInicio) >
      new Date(dataFim)
    ) {
      setErro(
        "A data inicial não pode ser posterior à data final."
      );

      return;
    }

    const utilizador =
      obterUtilizadorGuardado();

    const idUtilizador =
      utilizador?.id_utilizador ||
      utilizador?.ID_UTILIZADOR ||
      utilizador?.id;

    try {
      setIsGenerating(true);
      setErro("");
      setMensagem("");
      setRelatorio(null);

      const response = await api.post(
        `/sll/${idUtilizador}/relatorios/gerar`,
        {
          data_inicio: dataInicio,
          data_fim: dataFim,
        }
      );

      setRelatorio(response.data);
    } catch (err) {
      console.error(
        "Erro ao gerar relatório:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Não foi possível gerar o relatório."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  /* =======================================================
     GERAR PDF
  ======================================================= */

  async function gerarPdf() {
    if (
        !relatorio ||
        !pdfRelatorioRef.current
    ) {
        setErro(
        "Gera primeiro o relatório."
        );

        return;
    }

    try {
        setErro("");

        const elementoPdf =
        pdfRelatorioRef.current;

        const logo =
        elementoPdf.querySelector(
            '[data-logo-pdf="true"]'
        );

        if (logo && !logo.complete) {
        await new Promise(
            (resolve, reject) => {
            logo.onload = resolve;
            logo.onerror = reject;
            }
        );
        }

        if (document.fonts?.ready) {
        await document.fonts.ready;
        }

        // Dá tempo aos três gráficos do Recharts para renderizarem.
        await new Promise((resolve) =>
        setTimeout(resolve, 400)
        );

        const canvas =
        await html2canvas(
            elementoPdf,
            {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            backgroundColor: "#ffffff",
            logging: false,
            }
        );

        const imagem =
        canvas.toDataURL(
            "image/png"
        );

        const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        });

        const larguraPagina =
        pdf.internal.pageSize.getWidth();

        const alturaPagina =
        pdf.internal.pageSize.getHeight();

        const margem = 7;

        const larguraDisponivel =
        larguraPagina - margem * 2;

        const alturaDisponivel =
        alturaPagina - margem * 2;

        let larguraFinal =
        larguraDisponivel;

        let alturaFinal =
        (
            canvas.height *
            larguraFinal
        ) / canvas.width;

        if (
        alturaFinal >
        alturaDisponivel
        ) {
        alturaFinal =
            alturaDisponivel;

        larguraFinal =
            (
            canvas.width *
            alturaFinal
            ) / canvas.height;
        }

        const x =
        (
            larguraPagina -
            larguraFinal
        ) / 2;

        const y =
        (
            alturaPagina -
            alturaFinal
        ) / 2;

        pdf.addImage(
        imagem,
        "PNG",
        x,
        y,
        larguraFinal,
        alturaFinal
        );

        pdf.save(
        `relatorio_${relatorio.id_relatorio}.pdf`
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

  return (
    <div style={pagina}>
      <Header />

      <div style={corpo}>
        <SllLeftSidebar />

        <main style={conteudo}>
          <button
            type="button"
            onClick={() =>
              navigate("/sll")
            }
            style={voltarButton}
          >
            <BiArrowBack size={18} />
            Voltar
          </button>

          <div style={separador} />

          {!relatorio ? (
            <>
              <div
                style={cabecalhoPagina}
              >
                <h1 style={titulo}>
                  Gerar relatório de badges atribuídos
                </h1>

                <div style={subtitulo}>
                  Service Line:{" "}
                  <strong>
                    {serviceLine
                      ?.nome_serviceline ||
                      "Service Line"}
                  </strong>
                </div>
              </div>

              {erro && (
                <div style={erroBox}>
                  {erro}
                </div>
              )}

              <section
                style={formularioCard}
              >
                <div style={cardTitulo}>
                  <BiUser
                    size={19}
                    color="#2563eb"
                  />

                  Informações do relatório
                </div>

                <div style={formGrid}>
                  <div style={campo}>
                    <label style={label}>
                      Período
                    </label>

                    <div
                      style={periodoGrid}
                    >
                      <input
                        type="date"
                        value={dataInicio}
                        onChange={(
                          event
                        ) =>
                          setDataInicio(
                            event.target
                              .value
                          )
                        }
                        style={input}
                      />

                      <span
                        style={
                          separadorDatas
                        }
                      >
                        —
                      </span>

                      <input
                        type="date"
                        value={dataFim}
                        onChange={(
                          event
                        ) =>
                          setDataFim(
                            event.target
                              .value
                          )
                        }
                        style={input}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={gerarRelatorio}
                  disabled={
                    isGenerating ||
                    !areaUtilizador
                      ?.id_areas ||
                    !dataInicio ||
                    !dataFim
                  }
                  style={{
                    ...gerarButton,

                    opacity:
                      isGenerating ||
                      !areaUtilizador
                        ?.id_areas ||
                      !dataInicio ||
                      !dataFim
                        ? 0.55
                        : 1,

                    cursor:
                      isGenerating ||
                      !areaUtilizador
                        ?.id_areas ||
                      !dataInicio ||
                      !dataFim
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  <BiSave size={18} />

                  {isGenerating
                    ? "A gerar relatório..."
                    : "Gerar relatório"}
                </button>
              </section>
            </>
          ) : (
            <>
              <div
                style={
                  cabecalhoRelatorio
                }
              >
                <div>
                  <h1 style={titulo}>
                    Relatório de badges atribuídos
                  </h1>

                  <div style={subtitulo}>
                    ID: #
                    {
                      relatorio.id_relatorio
                    }
                  </div>

                  <div style={periodoTexto}>
                    {
                      relatorio.area
                        ?.nome_area
                    }{" "}
                    ·{" "}
                    {formatarData(
                      relatorio.periodo
                        .data_inicio
                    )}{" "}
                    a{" "}
                    {formatarData(
                      relatorio.periodo
                        .data_fim
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setRelatorio(null);
                    setMensagem("");
                    setErro("");
                  }}
                  style={alterarButton}
                >
                  Alterar filtros
                </button>
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
                ref={relatorioRef}
                style={previewRelatorio}
                >
                {/* CABEÇALHO COM LOGÓTIPO */}

                <div style={cabecalhoDocumento}>
                    <img
                    src={LogoSoftinsa}
                    alt="Softinsa"
                    data-logo-softinsa="true"
                    style={logoRelatorio}
                    />

                    <div style={informacaoDocumento}>
                    <h2 style={tituloDocumento}>
                      Relatório de Badges Atribuídos
                    </h2>

                    <div style={detalhesDocumento}>
                        Service Line:{" "}
                        <strong>
                        {
                            relatorio.serviceLine
                            ?.nome_serviceline
                        }
                        </strong>
                    </div>

                    <div style={detalhesDocumento}>
                        Período:{" "}
                        {formatarData(
                        relatorio.periodo
                            .data_inicio
                        )}{" "}
                        a{" "}
                        {formatarData(
                        relatorio.periodo
                            .data_fim
                        )}
                    </div>

                    <div style={idDocumento}>
                        Relatório #
                        {relatorio.id_relatorio}
                    </div>
                    </div>
                </div>

                <div style={linhaDocumento} />

                <div style={graficoTopo}>
                  <div style={tituloGraficoUnico}>
                    Badges atribuídos por mês
                    </div>

                    <div style={legenda}>
                    <span style={legendaItem}>
                        <span
                        style={{
                            ...legendaLinha,
                            background: "#111827",
                        }}
                        />

                        Este período
                    </span>

                    <span style={legendaItem}>
                        <span
                        style={{
                            ...legendaLinha,
                            background: "#93c5fd",
                        }}
                        />

                        Ano anterior ao período
                    </span>
                    </div>
                </div>

                {/* GRÁFICO */}

                <div style={graficoBox}>
                    <ResponsiveContainer
                    width="100%"
                    height={290}
                    >
                    <LineChart
                        data={
                        Array.isArray(
                            relatorio.grafico
                        )
                            ? relatorio.grafico
                            : []
                        }
                        margin={{
                        top: 15,
                        right: 25,
                        left: 5,
                        bottom: 5,
                        }}
                    >
                        <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        />

                        <XAxis dataKey="mes" />

                        <YAxis
                        allowDecimals={false}
                        domain={[0, "auto"]}
                        />

                        <Tooltip />

                        <Line
                        type="monotone"
                        dataKey="atribuidas_atual"
                        name="Este período"
                        stroke="#111827"
                        strokeWidth={2}
                        dot={{
                            r: 3,
                        }}
                        activeDot={{
                            r: 5,
                        }}
                        />

                        <Line
                        type="monotone"
                        dataKey="atribuidas_anterior"
                        name="Ano anterior"
                        stroke="#93c5fd"
                        strokeWidth={2}
                        strokeDasharray="5 4"
                        dot={{
                            r: 3,
                        }}
                        activeDot={{
                            r: 5,
                        }}
                        />
                    </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* CARTÕES DE RESUMO */}

                <div style={cardsResumo}>
                    <ResumoCard
                    icon={
                    <BiMedal size={48} />
                    }
                    valor={
                        relatorio.resumo
                    ?.total_atribuidas || 0
                    }
                  label="Badges atribuídos no período"
                    />

                    <ResumoCard
                    icon={
                    <BiUser size={48} />
                    }
                    valor={
                        relatorio.resumo
                    ?.total_aprovadas || 0
                    }
                  label="Candidaturas aprovadas"
                    />

                    <ResumoCard
                    icon={<BiX size={52} />}
                    valor={
                        relatorio.resumo
                        ?.total_rejeitadas || 0
                    }
                    label="Badges recusadas"
                    />
                </div>

                <div style={informacaoRelatorio}>
                    Total de candidaturas submetidas:{" "}
                    <strong>
                    {relatorio.resumo
                        ?.total_submetidas || 0}
                    </strong>
                </div>
                </section>

            <section
            ref={pdfRelatorioRef}
            style={relatorioPdfOculto}
            >
            <div style={cabecalhoPdf}>
                <img
                src={LogoSoftinsa}
                alt="Softinsa"
                data-logo-pdf="true"
                style={logoPdf}
                />

                <div style={informacaoPdf}>
                <h1 style={tituloPdf}>
                  Relatório de Badges Atribuídos
                </h1>

                <div style={detalhePdf}>
                    Service Line:{" "}
                    <strong>
                    {
                        relatorio.serviceLine
                        ?.nome_serviceline
                    }
                    </strong>
                </div>

                <div style={detalhePdf}>
                    Período:{" "}
                    {formatarData(
                    relatorio.periodo
                        .data_inicio
                    )}{" "}
                    a{" "}
                    {formatarData(
                    relatorio.periodo
                        .data_fim
                    )}
                </div>

                <div style={idPdf}>
                    Relatório #
                    {relatorio.id_relatorio}
                </div>
                </div>
            </div>

            <div style={linhaPdf} />

            <div style={legendaPdf}>
                <span style={legendaItem}>
                <span
                    style={{
                    ...legendaLinha,
                    background: "#111827",
                    }}
                />

                Este período
                </span>

                <span style={legendaItem}>
                <span
                    style={{
                    ...legendaLinha,
                    background: "#93c5fd",
                    }}
                />

                Ano anterior ao período
                </span>
            </div>

            <div style={graficosPdfGrid}>
                <GraficoPdf
              titulo="Badges atribuídos"
                dados={relatorio.grafico}
              dataKeyAtual="atribuidas_atual"
              dataKeyAnterior="atribuidas_anterior"
                />
            </div>

            <div style={resumosPdfGrid}>
                <ResumoCard
                icon={
                  <BiMedal size={42} />
                }
                valor={
                    relatorio.resumo
                  ?.total_atribuidas || 0
                }
                label="Badges atribuídos"
                />

                <ResumoCard
                icon={
                  <BiUser size={42} />
                }
                valor={
                    relatorio.resumo
                  ?.total_aprovadas || 0
                }
                label="Candidaturas aprovadas"
                />

                <ResumoCard
                icon={<BiX size={45} />}
                valor={
                    relatorio.resumo
                    ?.total_rejeitadas || 0
                }
                label="Badges recusadas"
                />
            </div>

            <div style={totalPdf}>
                Total de candidaturas submetidas no período: {" "}
                <strong>
                {relatorio.resumo
                    ?.total_submetidas || 0}
                </strong>
            </div>
            </section>

              <div
                style={acoesRelatorio}
              >
                <button
                  type="button"
                  onClick={gerarPdf}
                  style={pdfButton}
                >
                  <BiFile size={18} />
                  Gerar PDF
                </button>
              </div>
            </>
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

function GraficoPdf({
  titulo,
  dados,
  dataKeyAtual,
  dataKeyAnterior,
}) {
  return (
    <div style={graficoPdfCard}>
      <h3 style={graficoPdfTitulo}>
        {titulo}
      </h3>

      <LineChart
        width={390}
        height={230}
        data={
          Array.isArray(dados)
            ? dados
            : []
        }
        margin={{
          top: 14,
          right: 18,
          left: 0,
          bottom: 2,
        }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
        />

        <XAxis
          dataKey="mes"
          tick={{
            fontSize: 11,
          }}
        />

        <YAxis
          allowDecimals={false}
          domain={[0, "auto"]}
          tick={{
            fontSize: 11,
          }}
        />

        <Tooltip />

        <Line
          type="monotone"
          dataKey={dataKeyAtual}
          name="Este período"
          stroke="#111827"
          strokeWidth={2}
          dot={{
            r: 2,
          }}
          isAnimationActive={false}
        />

        <Line
          type="monotone"
          dataKey={dataKeyAnterior}
          name="Ano anterior"
          stroke="#93c5fd"
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={{
            r: 2,
          }}
          isAnimationActive={false}
        />
      </LineChart>
    </div>
  );
}

function ResumoCard({
  icon,
  valor,
  label,
}) {
  return (
    <div style={resumoCard}>
      <div style={resumoIcon}>
        {icon}
      </div>

      <div>
        <div style={resumoValor}>
          {valor}
        </div>

        <div style={resumoLabel}>
          {label}
        </div>
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
  margin: "16px 0 10px",
};

const cabecalhoPagina = {
  maxWidth: 900,
  margin: "0 auto 20px",
};

const cabecalhoRelatorio = {
  maxWidth: 980,
  margin: "0 auto 18px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 20,
};

const titulo = {
  margin: 0,
  fontSize: 17,
  fontWeight: 800,
  color: "#111827",
};

const subtitulo = {
  marginTop: 3,
  fontSize: 12,
  color: "#64748b",
};

const periodoTexto = {
  marginTop: 4,
  fontSize: 12,
  color: "#475569",
};

const formularioCard = {
  maxWidth: 900,
  minHeight: 420,
  margin: "0 auto",
  background: "white",
  border: "1px solid #bfdbfe",
  borderRadius: 12,
  padding: "22px 24px",
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
    "minmax(0, 1fr)",
  gap: 32,
};

const campo = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const label = {
  fontSize: 12,
  color: "#475569",
  fontWeight: 600,
};

const periodoGrid = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 1fr) 22px minmax(0, 1fr)",
  alignItems: "center",
  gap: 5,
};

const separadorDatas = {
  textAlign: "center",
  color: "#64748b",
};

const input = {
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

const gerarButton = {
  width: "100%",
  minHeight: 48,
  border: "none",
  borderRadius: 9,
  background: "#2563eb",
  color: "white",
  marginTop: 26,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontSize: 13,
  fontWeight: 700,
};

const alterarButton = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "white",
  color: "#475569",
  padding: "8px 14px",
  fontSize: 12,
  cursor: "pointer",
};

const previewRelatorio = {
  maxWidth: 980,
  margin: "0 auto",
  background: "white",
  borderRadius: 14,
  padding: "22px 24px 28px",
};

const graficoTopo = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 18,
  flexWrap: "wrap",
};

const tituloGraficoUnico = {
  fontSize: 13,
  fontWeight: 700,
  color: "#111827",
};

const legenda = {
  display: "flex",
  alignItems: "center",
  gap: 18,
  color: "#475569",
  fontSize: 10,
};

const legendaItem = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const legendaLinha = {
  width: 18,
  height: 2,
};

const graficoBox = {
  marginTop: 18,
};

const cardsResumo = {
  display: "grid",
  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",
  gap: 38,
  marginTop: 36,
};

const resumoCard = {
  minHeight: 112,
  border: "1px solid #2563eb",
  borderRadius: 12,
  padding: "14px 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 24,
};

const resumoIcon = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#111827",
};

const resumoValor = {
  fontSize: 19,
  fontWeight: 700,
  color: "#111827",
};

const resumoLabel = {
  marginTop: 5,
  fontSize: 13,
  color: "#111827",
};

const informacaoRelatorio = {
  textAlign: "center",
  marginTop: 24,
  color: "#64748b",
  fontSize: 12,
};

const acoesRelatorio = {
  maxWidth: 980,
  margin: "24px auto 0",
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
};

const pdfButton = {
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

const sucessoBox = {
  maxWidth: 980,
  margin: "0 auto 18px",
  background: "#dcfce7",
  border: "1px solid #bbf7d0",
  borderRadius: 10,
  padding: 12,
  color: "#166534",
  fontSize: 13,
};

const cabecalhoDocumento = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 28,
  marginBottom: 18,
};

const logoRelatorio = {
  width: 165,
  height: "auto",
  objectFit: "contain",
  flexShrink: 0,
};

const informacaoDocumento = {
  flex: 1,
  textAlign: "right",
};

const tituloDocumento = {
  margin: 0,
  color: "#111827",
  fontSize: 21,
  fontWeight: 800,
};

const detalhesDocumento = {
  marginTop: 4,
  color: "#475569",
  fontSize: 11,
};

const idDocumento = {
  marginTop: 6,
  color: "#2563eb",
  fontSize: 10,
  fontWeight: 700,
};

const linhaDocumento = {
  width: "100%",
  height: 1,
  background: "#dbe3ef",
  marginBottom: 20,
};

const relatorioPdfOculto = {
  position: "absolute",
  left: "-10000px",
  top: 0,
  width: 1320,
  minHeight: 760,
  background: "white",
  padding: "34px 42px 30px",
  boxSizing: "border-box",
  fontFamily:
    "Arial, Helvetica, sans-serif",
};

const cabecalhoPdf = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 30,
};

const logoPdf = {
  width: 190,
  height: "auto",
  objectFit: "contain",
};

const informacaoPdf = {
  textAlign: "right",
};

const tituloPdf = {
  margin: 0,
  fontSize: 27,
  fontWeight: 800,
  color: "#111827",
};

const detalhePdf = {
  marginTop: 5,
  fontSize: 13,
  color: "#475569",
};

const idPdf = {
  marginTop: 7,
  fontSize: 12,
  color: "#2563eb",
  fontWeight: 700,
};

const linhaPdf = {
  height: 1,
  background: "#dbe3ef",
  margin: "22px 0 12px",
};

const legendaPdf = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: 22,
  marginBottom: 7,
  color: "#475569",
  fontSize: 11,
};

const graficosPdfGrid = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 18,
  alignItems: "stretch",
};

const graficoPdfCard = {
  border: "1px solid #dbe3ef",
  borderRadius: 10,
  background: "#ffffff",
  padding: "12px 8px 4px",
  overflow: "hidden",
};

const graficoPdfTitulo = {
  margin: "0 0 4px",
  textAlign: "center",
  color: "#111827",
  fontSize: 15,
  fontWeight: 700,
};

const resumosPdfGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",
  gap: 28,
  marginTop: 22,
};

const totalPdf = {
  marginTop: 17,
  textAlign: "center",
  color: "#475569",
  fontSize: 12,
};

export default GerarRelatorioSll;