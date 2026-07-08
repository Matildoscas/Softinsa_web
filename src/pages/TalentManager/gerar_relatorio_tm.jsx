import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  BiArrowBack,
  BiCheck,
  BiFile,
  BiMedal,
  BiSave,
  BiSend,
  BiUser,
  BiX,
} from "react-icons/bi";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  useNavigate,
} from "react-router-dom";

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

import api from "../../services/api.js";

import Header from "../../components/Header.jsx";
import TmLeftSidebar from "../../components/tm_left_sidebar.jsx";
import TmRightSidebar from "../../components/tm_right_sidebar.jsx";

import LogoSoftinsa from "../../assets/logo.png";

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
   DATAS
========================================================= */

function paraInputDate(data) {
  const ano =
    data.getFullYear();

  const mes = String(
    data.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    data.getDate()
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function formatarData(data) {
  if (!data) {
    return "Não disponível";
  }

  const date =
    new Date(`${data}T12:00:00`);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return data;
  }

  return date.toLocaleDateString(
    "pt-PT"
  );
}

/* =========================================================
   GRÁFICOS
========================================================= */

const graficoConfig = {
  SUBMETIDAS: {
    titulo:
      "Total de Badges Submetidas",

    atual:
      "submetidas_atual",

    anterior:
      "submetidas_anterior",
  },

  APROVADAS: {
    titulo:
      "Total de badges aprovadas",

    atual:
      "aprovadas_atual",

    anterior:
      "aprovadas_anterior",
  },

  REJEITADAS: {
    titulo:
      "Total de badges recusadas",

    atual:
      "rejeitadas_atual",

    anterior:
      "rejeitadas_anterior",
  },
};

/* =========================================================
   PÁGINA
========================================================= */

function GerarRelatorioTm() {
  const navigate =
    useNavigate();

  const pdfRef =
    useRef(null);

  const [
    serviceLines,
    setServiceLines,
  ] = useState([]);

  const [
    especializacao,
    setEspecializacao,
  ] = useState("");

  const [
    idServiceLine,
    setIdServiceLine,
  ] = useState("");

  const hoje = new Date();

  const seisMesesAntes =
    new Date(
      hoje.getFullYear(),
      hoje.getMonth() - 6,
      1
    );

  const [
    dataInicio,
    setDataInicio,
  ] = useState(
    paraInputDate(
      seisMesesAntes
    )
  );

  const [
    dataFim,
    setDataFim,
  ] = useState(
    paraInputDate(hoje)
  );

  const [
    relatorio,
    setRelatorio,
  ] = useState(null);

  const [
    graficoSelecionado,
    setGraficoSelecionado,
  ] = useState("SUBMETIDAS");

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    isLoadingDados,
    setIsLoadingDados,
  ] = useState(true);

  const [
    isExporting,
    setIsExporting,
  ] = useState(false);

  const [
    isSending,
    setIsSending,
  ] = useState(false);

  const [erro, setErro] =
    useState("");

  const [mensagem, setMensagem] =
    useState("");

  useEffect(() => {
    carregarServiceLines();
  }, []);

  async function carregarServiceLines() {
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
      setIsLoadingDados(true);
      setErro("");

      const response =
        await api.get(
          `/tm/${idUtilizador}/relatorios/service-lines`
        );

      const dados =
        response.data || {};

      setEspecializacao(
        dados.talentManager
          ?.especializacao_tm ||
          ""
      );

      const lista =
        Array.isArray(
          dados.serviceLines
        )
          ? dados.serviceLines
          : [];

      setServiceLines(lista);

      if (lista.length > 0) {
        setIdServiceLine(
          String(
            lista[0]
              .id_serviceline
          )
        );
      }
    } catch (err) {
      console.error(
        "Erro ao carregar Service Lines:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar as Service Lines."
      );
    } finally {
      setIsLoadingDados(false);
    }
  }

  function alterarFormulario(
    setter,
    valor
  ) {
    setter(valor);

    setRelatorio(null);
    setMensagem("");
    setErro("");
  }

  async function gerarRelatorio() {
    const utilizador =
      obterUtilizadorGuardado();

    const idUtilizador =
      utilizador?.id_utilizador ||
      utilizador?.ID_UTILIZADOR ||
      utilizador?.id;

    if (
      !dataInicio ||
      !dataFim ||
      !idServiceLine
    ) {
      setErro(
        "Preenche o período e a Service Line."
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

    try {
      setIsLoading(true);
      setErro("");
      setMensagem("");
      setRelatorio(null);

      const response =
        await api.post(
          `/tm/${idUtilizador}/relatorios/gerar`,
          {
            id_serviceline:
              idServiceLine,

            data_inicio:
              dataInicio,

            data_fim:
              dataFim,
          }
        );

      setRelatorio(
        response.data
      );

      setGraficoSelecionado(
        "SUBMETIDAS"
      );

      setMensagem(
        "Relatório gerado. Confirma a pré-visualização antes de enviar ou gerar o PDF."
      );
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
      setIsLoading(false);
    }
  }

  async function enviarParaSll() {
    if (!relatorio) {
      return;
    }

    const utilizador =
      obterUtilizadorGuardado();

    const idUtilizador =
      utilizador?.id_utilizador ||
      utilizador?.ID_UTILIZADOR ||
      utilizador?.id;

    try {
      setIsSending(true);
      setErro("");
      setMensagem("");

      const response =
        await api.post(
          `/tm/${idUtilizador}/relatorios/enviar`,
          {
            relatorio,
          }
        );

      setMensagem(
        response.data?.message ||
          "Relatório enviado ao Service Line Leader."
      );
    } catch (err) {
      console.error(
        "Erro ao enviar relatório:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Não foi possível enviar o relatório."
      );
    } finally {
      setIsSending(false);
    }
  }

  async function gerarPdf() {
    if (
      !relatorio ||
      !pdfRef.current
    ) {
      return;
    }

    try {
      setIsExporting(true);
      setErro("");

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      await new Promise(
        (resolve) =>
          setTimeout(resolve, 350)
      );

      const canvas =
        await html2canvas(
          pdfRef.current,
          {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            backgroundColor:
              "#ffffff",
            logging: false,
            windowWidth: 1200,
          }
        );

      const imagem =
        canvas.toDataURL(
          "image/png"
        );

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const larguraPagina =
        pdf.internal.pageSize
          .getWidth();

      const alturaPagina =
        pdf.internal.pageSize
          .getHeight();

      const margem = 8;

      const larguraImagem =
        larguraPagina -
        margem * 2;

      const alturaImagem =
        canvas.height *
        (
          larguraImagem /
          canvas.width
        );

      const alturaUtil =
        alturaPagina -
        margem * 2;

      let deslocamento = 0;
      let paginaAtual = 0;

      while (
        deslocamento <
        alturaImagem
      ) {
        if (paginaAtual > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          imagem,
          "PNG",
          margem,
          margem -
            deslocamento,
          larguraImagem,
          alturaImagem
        );

        deslocamento +=
          alturaUtil;

        paginaAtual += 1;
      }

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
    } finally {
      setIsExporting(false);
    }
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
              navigate("/tm")
            }
            style={voltarButton}
          >
            <BiArrowBack size={18} />
            Voltar
          </button>

          <div style={separador} />

          <div style={cabecalhoPagina}>
            <h1 style={tituloPagina}>
              Gerar relatório
            </h1>

            <div style={subtituloPagina}>
              {especializacao
                ? `Especialização: ${especializacao}`
                : "Relatório do Talent Manager"}
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

          <section style={formularioCard}>
            <div style={tituloFormulario}>
              <BiUser
                size={18}
                color="#2563eb"
              />

              Informações do relatório
            </div>

            {isLoadingDados ? (
              <div style={mensagemForm}>
                A carregar dados...
              </div>
            ) : (
              <>
                <div style={formularioGrid}>
                  <div style={campo}>
                    <label style={label}>
                      Período
                    </label>

                    <div style={periodoLinha}>
                      <input
                        type="date"
                        value={dataInicio}
                        onChange={(event) =>
                          alterarFormulario(
                            setDataInicio,
                            event.target.value
                          )
                        }
                        style={input}
                      />

                      <span style={traco}>
                        —
                      </span>

                      <input
                        type="date"
                        value={dataFim}
                        onChange={(event) =>
                          alterarFormulario(
                            setDataFim,
                            event.target.value
                          )
                        }
                        style={input}
                      />
                    </div>
                  </div>

                  <div style={campo}>
                    <label style={label}>
                      Service Line
                    </label>

                    <select
                      value={idServiceLine}
                      onChange={(event) =>
                        alterarFormulario(
                          setIdServiceLine,
                          event.target.value
                        )
                      }
                      style={input}
                    >
                      {serviceLines.length ===
                      0 ? (
                        <option value="">
                          Sem Service Lines disponíveis
                        </option>
                      ) : (
                        serviceLines.map(
                          (serviceLine) => (
                            <option
                              key={
                                serviceLine.id_serviceline
                              }
                              value={
                                serviceLine.id_serviceline
                              }
                            >
                              {
                                serviceLine.nome_serviceline
                              }
                            </option>
                          )
                        )
                      )}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={gerarRelatorio}
                  disabled={
                    isLoading ||
                    serviceLines.length ===
                      0
                  }
                  style={{
                    ...gerarButton,

                    opacity:
                      isLoading ||
                      serviceLines.length ===
                        0
                        ? 0.6
                        : 1,
                  }}
                >
                  <BiSave size={18} />

                  {isLoading
                    ? "A gerar..."
                    : "Gerar relatório"}
                </button>
              </>
            )}
          </section>

          {relatorio && (
            <>
              <section style={previewCard}>
                <div style={cabecalhoPreview}>
                  <div>
                    <h2 style={tituloPreview}>
                      Pré-visualização do relatório
                    </h2>

                    <div style={idPreview}>
                      ID:{" "}
                      {
                        relatorio.id_relatorio
                      }
                    </div>
                  </div>

                  <div style={acoesPreview}>
                    <button
                      type="button"
                      onClick={enviarParaSll}
                      disabled={isSending}
                      style={enviarButton}
                    >
                      <BiSend size={17} />

                      {isSending
                        ? "A enviar..."
                        : "Enviar para SLL"}
                    </button>

                    <button
                      type="button"
                      onClick={gerarPdf}
                      disabled={isExporting}
                      style={pdfButton}
                    >
                      <BiFile size={17} />

                      {isExporting
                        ? "A gerar..."
                        : "Gerar PDF"}
                    </button>
                  </div>
                </div>

                <div style={documentoPreview}>
                  <CabecalhoDocumento
                    relatorio={relatorio}
                  />

                  <AbasGrafico
                    selecionado={
                      graficoSelecionado
                    }
                    onSelecionar={
                      setGraficoSelecionado
                    }
                  />

                  <LegendaGrafico />

                  <div style={graficoBox}>
                    <GraficoRelatorio
                      tipo={
                        graficoSelecionado
                      }
                      dados={
                        relatorio.grafico
                      }
                    />
                  </div>

                  <CardsResumo
                    resumo={
                      relatorio.resumo
                    }
                  />

                  <div style={totalSubmetidas}>
                    Total de candidaturas
                    submetidas:{" "}
                    <strong>
                      {
                        relatorio
                          .resumo
                          .total_submetidas
                      }
                    </strong>
                  </div>
                </div>
              </section>

              {/* CONTEÚDO FORA DO ECRÃ PARA O PDF */}

              <section
                ref={pdfRef}
                style={documentoPdf}
              >
                <CabecalhoDocumento
                  relatorio={relatorio}
                />

                {[
                  "SUBMETIDAS",
                  "APROVADAS",
                  "REJEITADAS",
                ].map((tipo) => (
                  <div
                    key={tipo}
                    style={graficoPdfSecao}
                  >
                    <h3 style={tituloGraficoPdf}>
                      {
                        graficoConfig[tipo]
                          .titulo
                      }
                    </h3>

                    <LegendaGrafico />

                    <GraficoRelatorio
                      tipo={tipo}
                      dados={
                        relatorio.grafico
                      }
                      fixo
                    />
                  </div>
                ))}

                <CardsResumo
                  resumo={
                    relatorio.resumo
                  }
                />

                <div style={totalSubmetidasPdf}>
                  Total de candidaturas
                  submetidas:{" "}
                  <strong>
                    {
                      relatorio
                        .resumo
                        .total_submetidas
                    }
                  </strong>
                </div>
              </section>
            </>
          )}
        </main>

        <TmRightSidebar />
      </div>
    </div>
  );
}

/* =========================================================
   COMPONENTES DO RELATÓRIO
========================================================= */

function CabecalhoDocumento({
  relatorio,
}) {
  return (
    <>
      <div style={cabecalhoDocumento}>
        <img
          src={LogoSoftinsa}
          alt="Softinsa"
          style={logoRelatorio}
        />

        <div style={informacaoDocumento}>
          <h2 style={tituloDocumento}>
            Relatório de Badges
          </h2>

          <div style={detalhesDocumento}>
            Talent Manager:{" "}
            <strong>
              {
                relatorio
                  .talentManager
                  .nome_completo
              }
            </strong>
          </div>

          <div style={detalhesDocumento}>
            Especialização:{" "}
            <strong>
              {
                relatorio
                  .talentManager
                  .especializacao_tm
              }
            </strong>
          </div>

          <div style={detalhesDocumento}>
            Service Line:{" "}
            <strong>
              {
                relatorio
                  .serviceLine
                  .nome_serviceline
              }
            </strong>
          </div>

          <div style={detalhesDocumento}>
            Período:{" "}
            {formatarData(
              relatorio
                .periodo
                .data_inicio
            )}{" "}
            a{" "}
            {formatarData(
              relatorio
                .periodo
                .data_fim
            )}
          </div>

          <div style={idDocumento}>
            Relatório{" "}
            {
              relatorio.id_relatorio
            }
          </div>
        </div>
      </div>

      <div style={linhaDocumento} />
    </>
  );
}

function AbasGrafico({
  selecionado,
  onSelecionar,
}) {
  return (
    <div style={abasGrafico}>
      {Object.entries(
        graficoConfig
      ).map(([chave, config]) => (
        <button
          key={chave}
          type="button"
          onClick={() =>
            onSelecionar(chave)
          }
          style={{
            ...graficoTab,

            color:
              selecionado === chave
                ? "#111827"
                : "#94a3b8",

            borderBottom:
              selecionado === chave
                ? "3px solid #2563eb"
                : "3px solid transparent",

            fontWeight:
              selecionado === chave
                ? 700
                : 400,
          }}
        >
          {config.titulo}
        </button>
      ))}
    </div>
  );
}

function LegendaGrafico() {
  return (
    <div style={legenda}>
      <div style={legendaItem}>
        <span
          style={{
            ...legendaLinha,
            background: "#111827",
          }}
        />

        Este período
      </div>

      <div style={legendaItem}>
        <span
          style={{
            ...legendaLinha,
            background: "#93c5fd",
          }}
        />

        Ano anterior ao período
      </div>
    </div>
  );
}

function GraficoRelatorio({
  tipo,
  dados,
  fixo = false,
}) {
  const config =
    graficoConfig[tipo];

  const grafico = (
    <LineChart
      width={fixo ? 1080 : undefined}
      height={fixo ? 260 : undefined}
      data={dados}
      margin={{
        top: 14,
        right: 26,
        left: 4,
        bottom: 4,
      }}
    >
      <CartesianGrid
        strokeDasharray="4 4"
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
        tick={{
          fontSize: 11,
        }}
      />

      <Tooltip />

      <Line
        type="monotone"
        dataKey={config.atual}
        stroke="#111827"
        strokeWidth={2.5}
        dot={{
          r: 4,
          fill: "#ffffff",
          strokeWidth: 2,
        }}
        activeDot={{
          r: 5,
        }}
        isAnimationActive={false}
      />

      <Line
        type="monotone"
        dataKey={config.anterior}
        stroke="#93c5fd"
        strokeWidth={2}
        strokeDasharray="5 5"
        dot={{
          r: 3,
          fill: "#ffffff",
          strokeWidth: 2,
        }}
        isAnimationActive={false}
      />
    </LineChart>
  );

  if (fixo) {
    return grafico;
  }

  return (
    <ResponsiveContainer
      width="100%"
      height="100%"
    >
      {grafico}
    </ResponsiveContainer>
  );
}

function CardsResumo({ resumo }) {
  return (
    <div style={cardsResumo}>
      <ResumoCard
        icon={
          <BiCheck size={46} />
        }
        valor={
          resumo.total_aprovadas
        }
        texto="Badges aprovadas pelo TM"
      />

      <ResumoCard
        icon={
          <BiMedal size={46} />
        }
        valor={
          resumo.total_atribuidas
        }
        texto="Badges atribuídos neste período"
      />

      <ResumoCard
        icon={<BiX size={48} />}
        valor={
          resumo.total_rejeitadas
        }
        texto="Badges recusadas"
      />
    </div>
  );
}

function ResumoCard({
  icon,
  valor,
  texto,
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

        <div style={resumoTexto}>
          {texto}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ESTILOS DA PÁGINA
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
  padding: "22px 30px 70px",
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
  marginBottom: 18,
};

const tituloPagina = {
  margin: 0,
  color: "#111827",
  fontSize: 21,
  fontWeight: 800,
};

const subtituloPagina = {
  marginTop: 3,
  color: "#64748b",
  fontSize: 12,
};

const formularioCard = {
  width: "100%",
  minHeight: 280,
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "21px 22px",
  marginBottom: 26,
};

const tituloFormulario = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  color: "#334155",
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 20,
};

const formularioGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: 30,
};

const campo = {
  minWidth: 0,
};

const label = {
  display: "block",
  color: "#475569",
  fontSize: 11,
  marginBottom: 7,
};

const periodoLinha = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 1fr) 20px minmax(0, 1fr)",
  gap: 8,
  alignItems: "center",
};

const traco = {
  textAlign: "center",
  color: "#64748b",
};

const input = {
  width: "100%",
  height: 43,
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "white",
  padding: "0 12px",
  color: "#334155",
  outline: "none",
  fontSize: 12,
};

const gerarButton = {
  width: "100%",
  minHeight: 47,
  border: "none",
  borderRadius: 8,
  background: "#2563eb",
  color: "white",
  marginTop: 25,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 9,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const mensagemForm = {
  color: "#64748b",
  fontSize: 12,
};

const previewCard = {
  width: "100%",
  boxSizing: "border-box",
  marginTop: 20,
};

const cabecalhoPreview = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 20,
  marginBottom: 15,
};

const tituloPreview = {
  margin: 0,
  color: "#111827",
  fontSize: 20,
  fontWeight: 800,
};

const idPreview = {
  marginTop: 3,
  color: "#64748b",
  fontSize: 11,
};

const acoesPreview = {
  display: "flex",
  gap: 11,
};

const enviarButton = {
  minHeight: 41,
  border: "1px solid #2563eb",
  borderRadius: 8,
  background: "#dbeafe",
  color: "#1d4ed8",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: "8px 16px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const pdfButton = {
  minHeight: 41,
  border: "1px solid #94a3b8",
  borderRadius: 8,
  background: "#cbd5e1",
  color: "#1e293b",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: "8px 16px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const documentoPreview = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "28px 34px",
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

const abasGrafico = {
  display: "flex",
  alignItems: "center",
  gap: 18,
  flexWrap: "wrap",
};

const graficoTab = {
  border: "none",
  background: "transparent",
  padding: "9px 7px",
  cursor: "pointer",
  fontSize: 11,
};

const legenda = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: 22,
  margin: "10px 0",
};

const legendaItem = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  color: "#475569",
  fontSize: 10,
};

const legendaLinha = {
  width: 23,
  height: 3,
  display: "inline-block",
};

const graficoBox = {
  width: "100%",
  height: 290,
  minHeight: 290,
  marginTop: 8,
};

const cardsResumo = {
  display: "grid",
  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",
  gap: 28,
  marginTop: 28,
};

const resumoCard = {
  minHeight: 120,
  border: "1px solid #2563eb",
  borderRadius: 12,
  padding: "15px 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 22,
};

const resumoIcon = {
  color: "#111827",
  flexShrink: 0,
};

const resumoValor = {
  color: "#111827",
  fontSize: 17,
  fontWeight: 800,
};

const resumoTexto = {
  marginTop: 6,
  color: "#334155",
  fontSize: 12,
  lineHeight: 1.4,
};

const totalSubmetidas = {
  marginTop: 28,
  textAlign: "center",
  color: "#64748b",
  fontSize: 12,
};

const totalSubmetidasPdf = {
  marginTop: 24,
  textAlign: "center",
  color: "#64748b",
  fontSize: 14,
};

/* =========================================================
   PDF FORA DO ECRÃ
========================================================= */

const documentoPdf = {
  position: "fixed",
  left: "-10000px",
  top: 0,
  width: 1200,
  boxSizing: "border-box",
  background: "white",
  padding: 45,
  zIndex: -1,
};

const graficoPdfSecao = {
  width: "100%",
  marginBottom: 35,
  pageBreakInside: "avoid",
};

const tituloGraficoPdf = {
  margin: "0 0 8px",
  color: "#111827",
  fontSize: 17,
  fontWeight: 800,
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

export default GerarRelatorioTm;