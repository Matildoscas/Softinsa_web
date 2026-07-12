import { useState, useEffect } from "react";
import { Button, Spinner, Form, Modal } from "react-bootstrap";
import {
  HiOutlineArrowLeft,
  HiOutlineUpload,
  HiOutlineTrash,
} from "react-icons/hi";
import { BiChevronUp, BiChevronDown, BiMedal } from "react-icons/bi";
import { useNavigate, useLocation, useParams } from "react-router-dom";

import Header from "../../components/Header.jsx";
import RightSidebar from "../../components/RightSidebar.jsx";
import LeftSidebar from "../../components/LeftSidebar.jsx";
import api from "../../services/api.js";
import BadgeImage from "../../components/badge_image.jsx";
import { resolverUrlFicheiro } from "../../utils/fileUrl.js";

const niveis = ["A", "B", "C", "D", "E"];

function obterUtilizadorGuardado() {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}

function extrairErroApi(err, contexto) {
  const status = Number(err?.response?.status || 0);
  const data = err?.response?.data || {};
  const code = String(data?.code || "").trim().toUpperCase();
  const message = String(data?.error || data?.message || "").trim();

  console.error(`[CANDIDATURA][${contexto}]`, {
    status,
    code,
    message,
    method: err?.config?.method,
    url: err?.config?.url,
    response: data,
  });

  return { status, code, message };
}

function mensagemErroCandidatura(err, fallback) {
  const { status, code, message } = extrairErroApi(err, "UI");
  const texto = String(message || "").toLowerCase();

  if (status === 401) {
    return "Sessão expirada ou inválida. Inicia sessão novamente para continuar a candidatura.";
  }

  if (status === 409) {
    if (code === "CANDIDATURA_EM_CURSO" || texto.includes("em curso")) {
      return "Já tens uma candidatura em curso para este badge. Abre o progresso para continuares essa candidatura.";
    }

    if (code === "CANDIDATURA_NAO_EDITAVEL" || texto.includes("não pode ser alterada")) {
      return "Esta candidatura já não está em rascunho, por isso não pode ser alterada.";
    }

    if (code === "CANDIDATURA_NAO_ENVIAVEL" || texto.includes("não pode ser enviada")) {
      return "Esta candidatura já foi enviada ou fechada, por isso não pode ser enviada novamente.";
    }
  }

  if (code === "EVIDENCIAS_INSUFICIENTES" || texto.includes("ficheiros") || texto.includes("requisitos")) {
    return message || "Faltam evidências mínimas para enviar a candidatura.";
  }

  if (code === "BADGE_ATIVO_JA_OBTIDO" || texto.includes("badge ativo")) {
    return message || "Já tens este badge ativo. Só podes voltar a submeter quando expirar.";
  }

  if (code === "REQUISITO_INVALIDO") {
    return message || "Não foi possível associar o ficheiro a um requisito válido. Reabre a candidatura e tenta novamente.";
  }

  if (code === "DADOS_INCOMPLETOS") {
    return message || "Falta informação obrigatória para guardar o rascunho.";
  }

  if (code === "CONFLITO_DADOS") {
    return message || "Foi detetado um conflito ao guardar a candidatura. Atualiza a página e tenta novamente.";
  }

  if (status >= 500) {
    return "O servidor falhou ao processar a candidatura. Tenta novamente em instantes.";
  }

  return message || fallback;
}

function SubmeterEvidenciasPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const idLembrete = location.state?.idLembrete ?? null;

  const voltarPara = location.state?.voltarPara || "/catalogo-badges";

  const textoVoltar = location.state?.textoVoltar || "Voltar";
  const { id } = useParams();
  const utilizador = obterUtilizadorGuardado();
  const userId =
    utilizador?.id_utilizador ||
    utilizador?.ID_UTILIZADOR ||
    utilizador?.id;

  const [badge, setBadge] = useState(null);
  const [candidatura, setCandidatura] = useState(null);
  const [ficheirosPorRequisito, setFicheirosPorRequisito] = useState({});
  const [evidenciasGuardadas, setEvidenciasGuardadas] = useState({});
  const [loading, setLoading] = useState(true);
  const [acaoLoading, setAcaoLoading] = useState(false);
  const [
    autorizaPublicacaoBadge,
    setAutorizaPublicacaoBadge,
  ] = useState(false);

  const [
    linkedinPublicacaoBadge,
    setLinkedinPublicacaoBadge,
  ] = useState("");

  const [mensagemInfo, setMensagemInfo] = useState("");
  const [mostrarModalEnvio, setMostrarModalEnvio] = useState(false);
  const [mensagemModalEnvio, setMensagemModalEnvio] = useState("");
  const [mostrarModalErro, setMostrarModalErro] = useState(false);
  const [mensagemModalErro, setMensagemModalErro] = useState("");
  const [mostrarModalCancelar, setMostrarModalCancelar] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [contextoReabertura, setContextoReabertura] = useState(null);

  const removerDuplicadosComRequisitos = (lista) => {
    const mapa = new Map();

    lista.forEach((linha) => {
    const badgeId = Number(
      linha.id_badge_modelo ||
      linha.id
    );

    if (!badgeId) {
      return;
    }

    const imagem =
      linha.imagem ??
      linha.imagem_url ??
      linha.url_imagem ??
      linha.imagem_badge ??
      null;

    if (!mapa.has(badgeId)) {
      mapa.set(badgeId, {
        ...linha,

        id: badgeId,
        id_badge_modelo:
          badgeId,

        nome:
          linha.nome ||
          linha.nome_badge ||
          "Badge",

        descricao:
          linha.descricao ||
          linha.descricao_badge_modelo ||
          "",

        pontos:
          Number(
            linha.pontos || 0
          ),

        id_nivel:
          linha.id_nivel,

        id_areas:
          linha.id_areas,

        nome_area:
          linha.nome_area ||
          linha.nome_areas ||
          linha.area ||
          "",

        imagem,
        imagem_url:
          imagem,
        url_imagem:
          imagem,
        imagem_badge:
          imagem,

        requisitos: [],
      });
    }

      const badgeAgrupado =
        mapa.get(badgeId);

      if (
        !badgeAgrupado.id_nivel &&
        linha.id_nivel
      ) {
        badgeAgrupado.id_nivel =
          linha.id_nivel;
      }

      if (
        !badgeAgrupado.nome_nivel &&
        linha.nome_nivel
      ) {
        badgeAgrupado.nome_nivel =
          linha.nome_nivel;
      }

      if (
        !badgeAgrupado.id_areas &&
        linha.id_areas
      ) {
        badgeAgrupado.id_areas =
          linha.id_areas;
      }

      if (
        !badgeAgrupado.nome_area &&
        (linha.nome_area ||
          linha.nome_areas ||
          linha.area)
      ) {
        badgeAgrupado.nome_area =
          linha.nome_area ||
          linha.nome_areas ||
          linha.area;
      }

      /*
      * Caso a primeira linha não tenha
      * imagem, mas outra linha do mesmo
      * badge tenha.
      */
      if (
        !badgeAgrupado.imagem &&
        imagem
      ) {
        badgeAgrupado.imagem =
          imagem;

        badgeAgrupado.imagem_url =
          imagem;

        badgeAgrupado.url_imagem =
          imagem;

        badgeAgrupado.imagem_badge =
          imagem;
      }

      if (linha.titulo || linha.nome_requisito || linha.descricao_requisito) {
        const idRequisito =
          linha.id_requisito ||
          linha.id_requisitos;

        const requisitosAtuais =
          badgeAgrupado.requisitos;

        const requisitoJaExiste = requisitosAtuais.some(
          (requisito) => String(requisito.id_requisito) === String(idRequisito),
        );

        if (!requisitoJaExiste) {
          requisitosAtuais.push({
            id_requisito: idRequisito,

            id_requisitos:
              idRequisito,

            titulo:
              linha.titulo ||
              linha.nome_requisito ||
              "Requisito",

            nome: linha.nome_requisito || linha.titulo || "Requisito",

            descricao: linha.descricao_requisito || "",

            link: linha.link_requisito || linha.link || "",
          });
        }
      }
    });
    return Array.from(
      mapa.values()
    );
  };

  function hidratarRascunho(payload) {
    setCandidatura(payload?.candidatura || null);

    const requisitos = Array.isArray(payload?.requisitos)
      ? payload.requisitos
      : [];

    const guardadas = {};

    requisitos.forEach((req, index) => {
      const requisitoKey = getRequisitoKey(req, index);
      guardadas[requisitoKey] = Array.isArray(req.evidencias)
        ? req.evidencias
        : [];
    });

    setEvidenciasGuardadas(guardadas);

    if (requisitos.length > 0) {
      setBadge((anterior) => {
        if (!anterior) {
          return anterior;
        }

        const requisitosNormalizados = requisitos.map((req, index) => ({
          ...req,
          id_requisito:
            req.id_requisito ||
            req.id_requisitos ||
            req.id ||
            index,
          id_requisitos:
            req.id_requisitos ||
            req.id_requisito ||
            req.id ||
            index,
          titulo:
            req.titulo ||
            req.nome_requisito ||
            req.nome ||
            `Requisito ${index + 1}`,
          nome:
            req.nome ||
            req.nome_requisito ||
            req.titulo ||
            `Requisito ${index + 1}`,
          descricao:
            req.descricao ||
            req.descricao_requisito ||
            "",
        }));

        return {
          ...anterior,
          requisitos: requisitosNormalizados,
        };
      });
    }
  }

  async function carregarPagina() {
    if (!userId) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setLoading(true);
      setMensagemInfo("");

      const badgesResponse = await api.get("/badges/todos");
      const dados = Array.isArray(badgesResponse.data)
        ? badgesResponse.data
        : [];
      const badgesAgrupados = removerDuplicadosComRequisitos(dados);
      const selecionado = badgesAgrupados.find(
        (b) => Number(b.id) === Number(id)
      );

      setBadge(selecionado || null);

      if (!selecionado) {
        return;
      }

      const rascunhoResponse = await api.post(
        "/candidaturas/iniciar",
        {
          id_utilizador: userId,
          id_badge_modelo: selecionado.id,
        }
      );

      const reabertura =
        rascunhoResponse.data?.reabertura || null;

      setContextoReabertura(reabertura);

      hidratarRascunho(rascunhoResponse.data);

      if (reabertura) {
        const totalReaproveitado = Number(
          reabertura.total_evidencias_reaproveitadas || 0
        );

        const comentario = String(
          reabertura.comentario_rejeicao || ""
        ).trim();

        setMensagemInfo(
          [
            totalReaproveitado > 0
              ? `Reabertura concluída: ${totalReaproveitado} ${totalReaproveitado === 1 ? "evidência aceite foi" : "evidências aceites foram"} reaproveitada${totalReaproveitado === 1 ? "" : "s"}.`
              : "Reabertura concluída: não foram encontradas evidências aceites para reaproveitar.",
            comentario
              ? `Comentário da rejeição: ${comentario}`
              : "",
          ]
            .filter(Boolean)
            .join("\n")
        );
      } else {
        setMensagemInfo(
          rascunhoResponse.data?.criada
            ? "Candidatura iniciada em modo rascunho. Pode guardar progresso antes de enviar."
            : "Rascunho carregado com sucesso."
        );
      }
    } catch (err) {
      const erro = mensagemErroCandidatura(
        err,
        "Não foi possível abrir o fluxo de candidatura."
      );
      setMensagemModalErro(erro);
      setMostrarModalErro(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarPagina();
  }, [id]);

  useEffect(() => {
    if (!contextoReabertura) {
      return;
    }

    const comentario = String(
      contextoReabertura.comentario_rejeicao || ""
    ).trim();

    if (!comentario) {
      return;
    }

    setMensagemInfo((prev) => {
      if (String(prev || "").includes("Comentário da rejeição:")) {
        return prev;
      }

      const base = String(prev || "").trim();
      return [base, `Comentário da rejeição: ${comentario}`]
        .filter(Boolean)
        .join("\n");
    });
  }, [contextoReabertura]);

  const adicionarFicheiros = (requisitoKey, files) => {
    const novos = Array.from(files || []);

    setFicheirosPorRequisito((prev) => ({
      ...prev,
      [requisitoKey]: [...(prev[requisitoKey] || []), ...novos],
    }));
  };

  const removerFicheiro = (requisitoKey, index) => {
    setFicheirosPorRequisito((prev) => ({
      ...prev,
      [requisitoKey]: (prev[requisitoKey] || []).filter((_, i) => i !== index),
    }));
  };

  const totalFicheirosNovos = Object.values(ficheirosPorRequisito)
    .reduce((total, lista) => total + lista.length, 0);

  const totalFicheirosGuardados = Object.values(evidenciasGuardadas)
    .reduce((total, lista) => total + lista.length, 0);

  const totalFicheiros = totalFicheirosNovos + totalFicheirosGuardados;

  const temRequisitos =
    Array.isArray(badge?.requisitos) && badge.requisitos.length > 0;

  const requisitosComEvidencia =
    temRequisitos
      ? badge.requisitos.filter((req, index) => {
          const requisitoKey = getRequisitoKey(req, index);
          const ficheirosNovos = (ficheirosPorRequisito[requisitoKey] || []).length;
          const ficheirosGuardados = (evidenciasGuardadas[requisitoKey] || []).length;
          return ficheirosNovos + ficheirosGuardados > 0;
        }).length
      : 0;

  const minimoParaEnviar =
    temRequisitos
      ? Math.min(3, badge.requisitos.length)
      : 0;

  const podeEnviar =
    minimoParaEnviar > 0 &&
    totalFicheiros >= minimoParaEnviar &&
    requisitosComEvidencia >= minimoParaEnviar;

  async function guardarDados(silencioso = false) {
    if (!badge || !candidatura || !userId) {
      return;
    }

    try {
      setAcaoLoading(true);

      const formData = new FormData();
      formData.append("id_utilizador", userId);
      formData.append(
        "autoriza_publicacao_badge",
        autorizaPublicacaoBadge ? "true" : "false"
      );
      formData.append(
        "linkedin_publicacao_badge",
        linkedinPublicacaoBadge.trim()
      );

      badge.requisitos.forEach((req, index) => {
        const requisitoKey = getRequisitoKey(req, index);
        const ficheiros = ficheirosPorRequisito[requisitoKey] || [];

        ficheiros.forEach((file) => {
          formData.append("ficheiros", file);
          formData.append(
            "metadados",
            JSON.stringify({
              requisito_key: requisitoKey,
              id_requisito:
                req.id_requisitos ||
                req.id_requisito ||
                req.id ||
                null,
              titulo: req.titulo,
              nome: req.nome,
              descricao: req.descricao || "",
              ficheiro_nome: file.name,
            })
          );
        });
      });

      const response = await api.post(
        `/candidaturas/${candidatura.id_candidatura_pedido}/guardar-dados`,
        formData
      );

      hidratarRascunho(response.data);
      setFicheirosPorRequisito({});
      setMensagemInfo(
        silencioso
          ? ""
          : "Dados guardados na candidatura em rascunho."
      );
    } catch (err) {
      const erro = mensagemErroCandidatura(
        err,
        "Não foi possível guardar o rascunho."
      );
      if (!silencioso) {
        setMensagemModalErro(erro);
        setMostrarModalErro(true);
      }
      throw err;
    } finally {
      setAcaoLoading(false);
    }
  }

  async function enviarCandidatura() {
    if (!candidatura || !userId) {
      return;
    }

    try {
      if (totalFicheirosNovos > 0) {
        await guardarDados(true);
      }

      setAcaoLoading(true);

      await api.post(
        `/candidaturas/${candidatura.id_candidatura_pedido}/enviar`,
        {
          id_utilizador: userId,
          id_lembrete: idLembrete,
        }
      );

      setMensagemModalEnvio(
        idLembrete
          ? "Candidatura enviada. O objetivo está agora em validação."
          : "Candidatura enviada para avaliação com sucesso."
      );

      setMostrarModalEnvio(true);
    } catch (err) {
      setMensagemModalErro(
        mensagemErroCandidatura(
          err,
          "Não foi possível enviar a candidatura."
        )
      );
      setMostrarModalErro(true);
    } finally {
      setAcaoLoading(false);
    }
  }

  async function cancelarCandidatura() {
    if (!candidatura || !userId) {
      return;
    }

    const motivo = String(
      motivoCancelamento || ""
    ).trim();

    if (!motivo) {
      setMensagemModalErro("O motivo do cancelamento é obrigatório.");
      setMostrarModalErro(true);
      return;
    }

    try {
      setAcaoLoading(true);

      await api.post(
        `/candidaturas/${candidatura.id_candidatura_pedido}/cancelar`,
        {
          id_utilizador: userId,
          motivo,
        }
      );

      setMostrarModalCancelar(false);
      setMotivoCancelamento("");
      setMensagemInfo("Candidatura cancelada com sucesso.");
      navigate(voltarPara, { replace: true });
    } catch (err) {
      setMensagemModalErro(
        mensagemErroCandidatura(
          err,
          "Não foi possível cancelar a candidatura."
        )
      );
      setMostrarModalErro(true);
    } finally {
      setAcaoLoading(false);
    }
  }

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!badge) {
    return (
      <div
        style={{
          backgroundColor: "#f7f7f7",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header />

        <div style={{ display: "flex", flex: 1 }}>
          <LeftSidebar />

          <main style={{ flex: 1, padding: "28px 32px" }}>
            <Button
              variant="link"
              className="d-flex align-items-center text-decoration-none p-0 mb-2"
              style={{ color: "#4A5568", fontSize: "1.05rem" }}
              onClick={() => navigate(voltarPara)}
            >
              <HiOutlineArrowLeft className="me-1" />
              <span>{textoVoltar}</span>
            </Button>

            <div className="text-muted mt-4">Badge não encontrado.</div>
          </main>

          <RightSidebar />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#f7f7f7",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <LeftSidebar />

        <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          <Button
            variant="link"
            className="d-flex align-items-center text-decoration-none p-0 mb-2"
            style={{ color: "#4A5568", fontSize: "1.05rem" }}
            onClick={() => navigate(voltarPara)}
          >
            <HiOutlineArrowLeft className="me-1" />
            <span>{textoVoltar}</span>
          </Button>

          <hr className="my-2" />

          <div style={heroCard}>
            <BadgeImage
              badge={badge}
              size={72}
            />

            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#111827",
                marginTop: 10,
              }}
            >
              Submeter Evidências
            </div>

            <div style={{ fontSize: 14, color: "#4470AF", marginTop: 4 }}>
              {badge.nome}
            </div>

            {badge.nome_area && (
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                {badge.nome_area}
              </div>
            )}
          </div>

          <div style={sectionCard}>
            <div style={sectionTitle}>Descrição</div>
            <p style={{ fontSize: 13, color: "#374151", marginTop: 8, marginBottom: 0, lineHeight: 1.65 }}>
              A candidatura é iniciada em modo rascunho. Pode guardar progresso, cancelar com motivo ou enviar quando tiver pelo menos 3 ficheiros distribuídos por 3 requisitos.
            </p>
          </div>

          {mensagemInfo && (
            <div style={infoBox}>{mensagemInfo}</div>
          )}

          <NivelSelector nivelAtual={obterNivelBadge(badge)} />

          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#111827",
                marginBottom: 10,
              }}
            >
              Requisitos e Evidências
            </div>

            {badge.requisitos.length > 0 ? (
              badge.requisitos.map((req, index) => {
                const requisitoKey = getRequisitoKey(req, index);

                return (
                  <RequisitoUploadRow
                    key={requisitoKey}
                    req={req}
                    requisitoKey={requisitoKey}
                    ficheiros={ficheirosPorRequisito[requisitoKey] || []}
                    evidenciasGuardadas={evidenciasGuardadas[requisitoKey] || []}
                    onAddFiles={(files) => adicionarFicheiros(requisitoKey, files)}
                    onRemoveFile={(fileIndex) => removerFicheiro(requisitoKey, fileIndex)}
                    defaultOpen={index === 0}
                  />
                );
              })
            ) : (
              <div style={sectionCard}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>
                  Sem requisitos registados para este badge.
                </span>
              </div>
            )}
          </div>

          <div style={consentimentoCard}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#111827",
                marginBottom: 8,
              }}
            >
              Publicação e partilha do badge
            </div>

            <div
              style={{
                fontSize: 13,
                color: "#475569",
                lineHeight: 1.55,
                marginBottom: 12,
              }}
            >
              Esta autorização permite que,
              caso o badge seja aprovado,
              o teu nome apareça na galeria
              pública como consultor que
              conquistou este badge. Também
              poderás associar um link de
              LinkedIn à publicação.
            </div>

            <Form.Check
              type="checkbox"
              id="autoriza-publicacao-badge"
              checked={autorizaPublicacaoBadge}
              onChange={(event) =>
                setAutorizaPublicacaoBadge(
                  event.target.checked
                )
              }
              label="Autorizo a publicação e partilha pública deste badge caso seja aprovado."
              style={{
                fontSize: 13,
                color: "#111827",
                fontWeight: 500,
                marginBottom: 12,
              }}
            />

            {autorizaPublicacaoBadge && (
              <div>
                <Form.Label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Link LinkedIn opcional
                </Form.Label>

                <Form.Control
                  type="url"
                  placeholder="https://www.linkedin.com/in/o-teu-perfil"
                  value={linkedinPublicacaoBadge}
                  onChange={(event) =>
                    setLinkedinPublicacaoBadge(
                      event.target.value
                    )
                  }
                  style={{
                    height: 40,
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />

                <div
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    marginTop: 6,
                  }}
                >
                  Este link só será mostrado
                  publicamente se o badge for
                  aprovado.
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 14,
              marginBottom: 32,
              flexWrap: "wrap",
            }}
          >
            <button
              style={{
                ...actionBtn,
                background: "#fff5f5",
                color: "#b42318",
                border: "1px solid #fecdca",

                opacity:
                  acaoLoading
                    ? 0.55
                    : 1,

                cursor:
                  acaoLoading
                    ? "not-allowed"
                    : "pointer",
              }}
              disabled={acaoLoading}
              onClick={() => {
                setMotivoCancelamento("");
                setMostrarModalCancelar(true);
              }}
            >
              <HiOutlineTrash size={18} style={{ marginRight: 8 }} />
              Cancelar candidatura
            </button>

            <button
              style={{
                ...actionBtn,
                background: podeEnviar ? "#2e7d32" : actionBtn.background,
                border: podeEnviar ? "1px solid #2e7d32" : actionBtn.border,

                opacity:
                  acaoLoading
                    ? 0.55
                    : 1,

                cursor:
                  acaoLoading
                    ? "not-allowed"
                    : "pointer",
              }}
              disabled={acaoLoading}
              onClick={podeEnviar ? enviarCandidatura : () => guardarDados(false)}
            >
              <HiOutlineUpload size={18} style={{ marginRight: 8 }} />
              {acaoLoading
                ? "A processar..."
                : podeEnviar
                  ? `Enviar Candidatura (${totalFicheiros})`
                  : `Guardar Dados (${totalFicheiros})`}
            </button>
          </div>
        </main>

        <RightSidebar />
      </div>

      <Modal
        show={mostrarModalEnvio}
        onHide={() => {
          setMostrarModalEnvio(false);
          navigate(voltarPara, { replace: true });
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Candidatura enviada</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {mensagemModalEnvio}
        </Modal.Body>

        <Modal.Footer>
          <Button
            onClick={() => {
              setMostrarModalEnvio(false);
              navigate(voltarPara, { replace: true });
            }}
          >
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={mostrarModalErro}
        onHide={() => setMostrarModalErro(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Atenção</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {mensagemModalErro}
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={() => setMostrarModalErro(false)}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={mostrarModalCancelar}
        onHide={() => !acaoLoading && setMostrarModalCancelar(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Cancelar candidatura</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group>
            <Form.Label>Indica o motivo do cancelamento</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={motivoCancelamento}
              onChange={(event) => setMotivoCancelamento(event.target.value)}
              placeholder="Escreve o motivo..."
              disabled={acaoLoading}
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            disabled={acaoLoading}
            onClick={() => setMostrarModalCancelar(false)}
          >
            Voltar
          </Button>

          <Button
            variant="danger"
            disabled={acaoLoading}
            onClick={cancelarCandidatura}
          >
            {acaoLoading ? "A cancelar..." : "Confirmar cancelamento"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

function NivelSelector({ nivelAtual }) {
  return (
    <div style={sectionCard}>
      <div style={sectionTitle}>Nível</div>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        {niveis.map((n) => (
          <div
            key={n}
            style={{
              ...nivelCircle,
              background: n === nivelAtual ? "#F5C518" : "#f0f0f0",
              border:
                n === nivelAtual ? "2px solid #e0a800" : "1.5px solid #d1d5db",
              color: n === nivelAtual ? "#7a5800" : "#374151",
              fontWeight: n === nivelAtual ? 700 : 500,
              boxShadow:
                n === nivelAtual ? "0 2px 8px rgba(245,197,24,0.35)" : "none",
            }}
          >
            {n}
          </div>
        ))}
      </div>
    </div>
  );
}

function RequisitoUploadRow({
  req,
  requisitoKey,
  ficheiros,
  evidenciasGuardadas = [],
  onAddFiles,
  onRemoveFile,
  defaultOpen,
}) {
  const [open, setOpen] = useState(defaultOpen || false);

  return (
    <div style={requisitoCard}>
      <div style={requisitoHeader} onClick={() => setOpen((v) => !v)}>
        <div>
          <span style={{ fontWeight: 600, color: "#111827" }}>
            Requisito {req.titulo}
          </span>
          {" - "}
          <span style={{ color: "#4470AF", fontWeight: 500 }}>{req.nome}</span>
        </div>

        {open ? (
          <BiChevronUp size={22} color="#6b7280" />
        ) : (
          <BiChevronDown size={22} color="#6b7280" />
        )}
      </div>

      {open && (
        <div style={requisitoBody}>
          <div style={{ fontSize: 13, color: "#374151", marginBottom: 10 }}>
            {req.descricao || "Sem descrição."}
          </div>

          {req.link && (
            <div style={{ marginBottom: 10 }}>
              <a
                href={req.link}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#4470AF", fontSize: 13 }}
              >
                {req.link}
              </a>
            </div>
          )}

          {evidenciasGuardadas.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
                Evidências já guardadas
              </div>

              {evidenciasGuardadas.map((evidencia) => (
                <div key={evidencia.id_evidencia} style={fileRow}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
                      {evidencia.nome_ficheiro}
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>
                      Guardado em {new Date(evidencia.data_submissao).toLocaleString("pt-PT")}
                    </div>
                  </div>

                  {evidencia.caminho_ficheiro && (
                    <a
                      href={resolverUrlFicheiro(evidencia.caminho_ficheiro)}
                      target="_blank"
                      rel="noreferrer"
                      style={savedFileLink}
                    >
                      Ver ficheiro
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          <label style={uploadBox}>
            <HiOutlineUpload size={20} />
            <span>Adicionar ficheiros a este requisito</span>

            <input
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                onAddFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>

          {ficheiros.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {ficheiros.map((file, index) => (
                <div key={`${file.name}-${index}`} style={fileRow}>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#111827",
                      }}
                    >
                      {file.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveFile(index)}
                    style={removeFileBtn}
                  >
                    <HiOutlineTrash size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {ficheiros.length === 0 && evidenciasGuardadas.length === 0 && (
            <div style={{ fontSize: 12, color: "#D32F2F", marginTop: 8 }}>
              Este requisito ainda não tem ficheiros anexados.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getRequisitoKey(req, index) {
  return String(
    req.id_requisito || req.id_requisitos || req.titulo || req.nome || index,
  );
}

function obterNivelBadge(badge) {
  if (!badge) {
    return "";
  }

  const candidatos = [
    badge.id_nivel,
    badge.nivel,
    badge.nivel_badge,
    badge.nome_nivel,
    badge.descricao_nivel,
  ];

  const numeroValido =
    candidatos
      .map((valor) => Number(valor))
      .find(
        (valor) =>
          Number.isInteger(valor) &&
          valor >= 1 &&
          valor <= 5
      ) || null;

  if (numeroValido) {
    return nivelParaLetra(numeroValido);
  }

  const texto = candidatos
    .filter(Boolean)
    .map((valor) => String(valor))
    .join(" ")
    .toUpperCase();

  const textoNormalizado = texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (
    textoNormalizado.includes("INICIANTE") ||
    textoNormalizado.includes("JUNIOR")
  ) {
    return "A";
  }

  if (textoNormalizado.includes("INTERMED")) {
    return "B";
  }

  if (
    textoNormalizado.includes("AVANC") ||
    textoNormalizado.includes("SENIOR")
  ) {
    return "C";
  }

  if (
    textoNormalizado.includes("EXPERT") ||
    textoNormalizado.includes("ESPECIALISTA")
  ) {
    return "D";
  }

  if (
    textoNormalizado.includes("MASTER") ||
    textoNormalizado.includes("LIDER DE CONHECIMENTO")
  ) {
    return "E";
  }

  const match = textoNormalizado.match(/(?:NIVEL\s*)?([A-E])\b/);
  return match ? match[1] : "";
}

const consentimentoCard = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 10,
  padding: 18,
  marginTop: 18,
  marginBottom: 18,
};

const infoBox = {
  border: "1px solid #dbeafe",
  background: "#eff6ff",
  color: "#1d4ed8",
  borderRadius: 10,
  padding: 14,
  marginBottom: 16,
  fontSize: 13,
  whiteSpace: "pre-line",
};

const heroCard = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "28px 20px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  marginBottom: 16,
};

const heroIconWrap = {
  width: 90,
  height: 90,
  borderRadius: "50%",
  background: "#eef3fb",
  border: "2px solid #dbe3ef",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 42,
};

const sectionCard = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "16px 20px",
  marginBottom: 16,
};

const sectionTitle = {
  fontSize: 15,
  fontWeight: 600,
  color: "#111827",
};

const requisitoCard = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 10,
  marginBottom: 10,
  overflow: "hidden",
};

const requisitoHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "14px 18px",
  cursor: "pointer",
  fontSize: 13,
  userSelect: "none",
};

const requisitoBody = {
  padding: "10px 18px 16px",
  fontSize: 13,
  color: "#374151",
  borderTop: "1px solid #e5e7eb",
  background: "#fafbff",
};

const uploadBox = {
  border: "1.5px dashed #9ca3af",
  borderRadius: 12,
  padding: "14px 16px",
  background: "white",
  color: "#374151",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontSize: 13,
  fontWeight: 500,
};

const fileRow = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "10px 12px",
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 8,
};

const removeFileBtn = {
  border: "none",
  background: "#FFEBEE",
  color: "#D32F2F",
  borderRadius: 8,
  width: 32,
  height: 32,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const savedFileLink = {
  color: "#1d4ed8",
  fontSize: 12,
  fontWeight: 600,
  textDecoration: "none",
  whiteSpace: "nowrap",
};

const actionBtn = {
  display: "flex",
  alignItems: "center",
  border: "1.5px solid #d1d5db",
  borderRadius: 999,
  padding: "9px 20px",
  fontSize: 14,
  fontWeight: 500,
  background: "white",
  color: "#374151",
  cursor: "pointer",
  boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
};

function nivelParaLetra(idNivel) {
  const nivel = Number(idNivel);

  if (nivel === 1) return "A";
  if (nivel === 2) return "B";
  if (nivel === 3) return "C";
  if (nivel === 4) return "D";
  if (nivel === 5) return "E";

  return "";
}

const nivelCircle = {
  width: 52,
  height: 52,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
  cursor: "default",
  transition: "all 0.15s",
};

export default SubmeterEvidenciasPage;
