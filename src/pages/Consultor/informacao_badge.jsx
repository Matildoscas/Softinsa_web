import { useState, useEffect } from "react";
import { Button, Spinner, Modal } from "react-bootstrap";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { useNavigate, useParams } from "react-router-dom";
import { FaLinkedinIn } from "react-icons/fa";
import { HiOutlineDownload, HiOutlineMail } from "react-icons/hi";
import { BiChevronUp, BiChevronDown, BiMedal } from "react-icons/bi";

import Header from "../../components/Header.jsx";
import RightSidebar from "../../components/RightSidebar.jsx";
import LeftSidebar from "../../components/LeftSidebar.jsx";
import api from "../../services/api.js";
import BadgeImage, {
  obterImagemBadge,
} from "../../components/badge_image.jsx";
import {
  obterBonusBadge,
} from "../../utils/badgeBonus.js";

const niveis = ["A", "B", "C", "D", "E"];

function escaparHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function tornarUrlAbsoluta(url) {
  if (!url) {
    return "";
  }

  const valor =
    String(url).trim();

  if (
    valor.startsWith("http://") ||
    valor.startsWith("https://") ||
    valor.startsWith("data:image/")
  ) {
    return valor;
  }

  if (valor.startsWith("/")) {
    return `${window.location.origin}${valor}`;
  }

  return valor;
}

function candidaturaFinalizada(item) {
  const estado = String(
    item?.estado_geral ||
      item?.estado_final ||
      ""
  )
    .trim()
    .toUpperCase();

  const fase = String(
    item?.fase_geral || ""
  )
    .trim()
    .toUpperCase();

  return (
    estado.includes("REJEIT") ||
    estado.includes("RECUS") ||
    estado.includes("CANCEL") ||
    estado.includes("FINAL") ||
    fase.includes("HISTORICO") ||
    fase.includes("CANCEL") ||
    fase.includes("FINALIZ") ||
    fase.includes("REJEIT") ||
    fase.includes("CONCLUID")
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
    return nivelParaLetra(
      numeroValido
    );
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

  const match = textoNormalizado.match(
    /(?:NIVEL\s*)?([A-E])\b/
  );

  return match
    ? match[1]
    : "";
}

function BadgeDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [badge, setBadge] = useState(null);
  const [relacionados, setRelacionados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [conquistado, setConquistado] = useState(false);
  const [conquistadoBadge, setConquistadoBadge] = useState(null);
  const [desafiosBadge, setDesafiosBadge] = useState([]);
  const [temCandidaturaAberta, setTemCandidaturaAberta] = useState(false);
  const [estadoCandidaturaBadge, setEstadoCandidaturaBadge] = useState("");
  const [ocultarAcaoCandidatura, setOcultarAcaoCandidatura] = useState(false);
  const [mostrarModalInicioCandidatura, setMostrarModalInicioCandidatura] = useState(false);

  const [
    consentimento,
    setConsentimento,
  ] = useState({
    existe: false,
    aceite: false,
    pode_publicar: false,
    consentimento: null,
  });

  const [
    mostrarAssinatura,
    setMostrarAssinatura,
  ] = useState(false);

  const [
    assinaturaCopiada,
    setAssinaturaCopiada,
  ] = useState(false);

  const [
    urlCertificadoAssinatura,
    setUrlCertificadoAssinatura,
  ] = useState("");

  const [
    dadosUtilizador,
    setDadosUtilizador,
  ] = useState(null);

  const [
    linkedinUrl,
    setLinkedinUrl,
  ] = useState("");

  const [
    consentimentoLoading,
    setConsentimentoLoading,
  ] = useState(false);

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
        linha.imagem_url ??
        linha.imagem ??
        linha.url_imagem ??
        linha.imagem_badge ??
        null;

      if (!mapa.has(badgeId)) {
        mapa.set(badgeId, {
          ...linha,

          id: badgeId,

          nome:
            linha.nome ||
            linha.nome_badge ||
            "Badge",

          descricao:
            linha.descricao ||
            linha.descricao_badge_modelo ||
            "",

          pontos:
            Number(linha.pontos || 0),

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
          imagem_url: imagem,
          url_imagem: imagem,

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

      const bonusLinha =
        obterBonusBadge(linha);

      const bonusAtual =
        obterBonusBadge(
          badgeAgrupado
        );

      badgeAgrupado.ganhou_bonus =
        bonusAtual.ganhouBonus ||
        bonusLinha.ganhouBonus;

      badgeAgrupado.pontos_extra =
        Math.max(
          bonusAtual.pontosExtra,
          bonusLinha.pontosExtra
        );

      /*
      * Caso a primeira linha do badge não
      * tenha imagem, mas outra linha tenha.
      */
      if (!badgeAgrupado.imagem && imagem) {
        badgeAgrupado.imagem =
          imagem;

        badgeAgrupado.imagem_url =
          imagem;

        badgeAgrupado.url_imagem =
          imagem;
      }

      if (
        linha.titulo ||
        linha.nome_requisito ||
        linha.descricao_requisito
      ) {
        const idRequisito =
          linha.id_requisito ||
          linha.id_requisitos ||
          linha.titulo ||
          linha.nome_requisito;

        const requisitoExiste =
          badgeAgrupado.requisitos.some(
            (requisito) =>
              String(requisito.id) ===
              String(idRequisito)
          );

        if (!requisitoExiste) {
          badgeAgrupado.requisitos.push({
            id:
              idRequisito ||
              "Requisito",

            titulo:
              linha.nome_requisito ||
              linha.titulo ||
              "Requisito",

            descricao:
              linha.descricao_requisito ||
              "",

            link:
              linha.link_requisito ||
              linha.link ||
              "",
          });
        }
      }
    });

    return Array.from(
      mapa.values()
    );
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
        navigate("/login", { replace: true });
        return;
    }

    const userData = JSON.parse(storedUser);
    const userId = userData.id_utilizador || userData.ID_UTILIZADOR;

    setLoading(true);

    setDadosUtilizador(userData);

    Promise.all([
      api.get("/badges/todos"),

      api.get(`/badges/conquistados/${userId}`),

      api
        .get(
          `/consentimentos-badge/${userId}/${id}`
        )
        .catch(() => ({
          data: {
            existe: false,
            aceite: false,
            pode_publicar: false,
            consentimento: null,
          },
        })),

      api
        .get(`/utilizadores/${userId}`)
        .catch(() => ({
          data: userData,
        })),

      api
        .get(`/candidaturas/${userId}/status-candidaturas`)
        .catch(() => ({
          data: {
            candidaturas: [],
          },
        })),

      api
        .get(`/certificados/pendentes/${userId}`)
        .catch(() => ({
          data: [],
        })),

      api
        .get(`/lembretes/consultor/${userId}`)
        .catch(() => ({
          data: {
            todos: [],
          },
        })),
    ])
        .then(([
          todosRes,
          conquistadosRes,
          consentimentoRes,
          utilizadorRes,
          statusRes,
          pendentesRes,
          lembretesRes,
        ]) => {
          setDadosUtilizador(
            utilizadorRes?.data || userData
          );
        const dados = Array.isArray(todosRes.data) ? todosRes.data : [];
        const badgesAgrupados = removerDuplicadosComRequisitos(dados);

        const badgeSelecionado = badgesAgrupados.find(
            (b) => Number(b.id) === Number(id)
        );

        const conquistadosRaw = Array.isArray(conquistadosRes.data)
            ? conquistadosRes.data
            : [];

        const conquistadosAgrupados =
            removerDuplicadosComRequisitos(conquistadosRaw);

        const badgeConquistado = conquistadosAgrupados.find(
            (b) => Number(b.id) === Number(id)
        );

        const listaStatus =
          Array.isArray(
            statusRes?.data
              ?.candidaturas
          )
            ? statusRes.data
                .candidaturas
            : [];

        const existeCandidaturaAberta =
          listaStatus.some(
            (item) =>
              Number(
                item.id_badge_modelo ||
                  item.id_badge
              ) === Number(id) &&
              !candidaturaFinalizada(item)
          );

        const candidaturaStatusBadge =
          listaStatus.find(
            (item) =>
              Number(
                item.id_badge_modelo ||
                  item.id_badge
              ) === Number(id) &&
              !candidaturaFinalizada(item)
          ) || null;

        const listaPendentes =
          Array.isArray(
            pendentesRes?.data
          )
            ? pendentesRes.data
            : [];

        const existePendenteNoBadge =
          listaPendentes.some(
            (item) =>
              Number(
                item.id_badge_modelo ||
                  item.id_badge
              ) === Number(id)
          );

        const pendenteBadge =
          listaPendentes.find(
            (item) =>
              Number(
                item.id_badge_modelo ||
                  item.id_badge
              ) === Number(id)
          ) || null;

        const estadoCatalogo = String(
          pendenteBadge?.estado_catalogo ||
            ""
        )
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toUpperCase();

        const totalEvidenciasBadge = Number(
          candidaturaStatusBadge?.total_evidencias ||
            0
        );

        const faseGeralBadge = String(
          candidaturaStatusBadge?.fase_geral ||
            ""
        )
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toUpperCase();

        const estadoPedidoBadge = String(
          candidaturaStatusBadge?.estado_candidatura_pedido ||
            ""
        )
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toUpperCase();

        const candidaturaEfetuada =
          estadoCatalogo.includes(
            "CANDIDATURA_EFETUADA"
          ) ||
          faseGeralBadge.includes(
            "AVALIAC"
          ) ||
          faseGeralBadge.includes(
            "SUBMETIDA"
          ) ||
          [
            "PENDENTE",
            "EM_VALIDACAO_TM",
            "EM_VALIDACAO_SLL",
            "EM_VALIDACAO",
          ].includes(
            estadoPedidoBadge
          ) ||
          totalEvidenciasBadge >= 3;

        setTemCandidaturaAberta(
          (existeCandidaturaAberta ||
            existePendenteNoBadge) &&
            !candidaturaEfetuada &&
            !estadoCatalogo.includes(
              "REJEIT"
            ) &&
            !estadoCatalogo.includes(
              "RECUS"
            )
        );

        setOcultarAcaoCandidatura(
          candidaturaEfetuada
        );

        if (
          candidaturaEfetuada
        ) {
          setEstadoCandidaturaBadge(
            "Candidatura efetuada"
          );
        } else if (
          existeCandidaturaAberta ||
          estadoCatalogo.includes(
            "CANDIDATURA_INICIADA"
          )
        ) {
          setEstadoCandidaturaBadge(
            "Candidatura iniciada"
          );
        } else {
          setEstadoCandidaturaBadge("");
        }

        const listaLembretes =
          Array.isArray(
            lembretesRes?.data
              ?.todos
          )
            ? lembretesRes.data
                .todos
            : [];

        const desafiosDoBadge =
          listaLembretes.filter(
            (item) =>
              String(
                item.tipo_lembrete ||
                  ""
              ).toUpperCase() ===
                "DESAFIO_TM" &&
              Number(
                item.id_badge_modelo
              ) === Number(id)
          );

        setDesafiosBadge(
          desafiosDoBadge
        );

        setConquistado(!!badgeConquistado);
        setConquistadoBadge(badgeConquistado || null);
        const dadosConsentimento =
          consentimentoRes?.data || {
            existe: false,
            aceite: false,
            pode_publicar: false,
            consentimento: null,
          };

        setConsentimento(
          dadosConsentimento
        );

        setLinkedinUrl(
          dadosConsentimento
            ?.consentimento
            ?.linkedin_url ||
            ""
        );

        if (!badgeSelecionado) {
            setBadge(null);
            setRelacionados([]);
            return;
        }

        const relacionadosCalc =
        badgesAgrupados
          .filter((b) => {
            const mesmaArea =
              Number(b.id_areas) ===
                Number(
                  badgeSelecionado.id_areas
                ) ||
              b.nome_area ===
                badgeSelecionado.nome_area;

            return (
              mesmaArea &&
              Number(b.id) !==
                Number(
                  badgeSelecionado.id
                )
            );
          })
          .map((relacionado) => {
            const conquistadoRelacionado =
              conquistadosAgrupados.find(
                (item) =>
                  Number(item.id) ===
                  Number(relacionado.id)
              );

            if (
              !conquistadoRelacionado
            ) {
              return relacionado;
            }

            return {
              ...relacionado,
              ...conquistadoRelacionado,

              requisitos:
                relacionado.requisitos,

              nome_area:
                relacionado.nome_area ||
                conquistadoRelacionado
                  .nome_area,
            };
          })
          .slice(0, 3);

        setBadge(badgeSelecionado);
        setRelacionados(relacionadosCalc);
        })
        .catch((err) => {
        console.error("Erro ao carregar detalhe do badge:", err);
        console.error("STATUS:", err.response?.status);
        console.error("BODY:", err.response?.data);
        })
        .finally(() => {
        setLoading(false);
        });
    }, [id, navigate]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!badge) {
    return (
      <div style={{ backgroundColor: "#f7f7f7", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Header />
        <div style={{ display: "flex", flex: 1 }}>
          <LeftSidebar />
          <main style={{ flex: 1, padding: "28px 32px" }}>
            <Button
              variant="link"
              className="d-flex align-items-center text-decoration-none p-0 mb-2"
              style={{ color: "#4A5568", fontSize: "1.05rem" }}
              onClick={() => navigate(-1)}
            >
              <HiOutlineArrowLeft className="me-1" />
              <span>Voltar</span>
            </Button>

            <div className="text-muted mt-4">
              Badge não encontrado.
            </div>
          </main>
          <RightSidebar />
        </div>
      </div>
    );
  }

  const {
    ganhouBonus,
    pontosExtra,
  } = obterBonusBadge(
    conquistadoBadge
  );

  const obterUserId = () => {
  const storedUser =
    localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    const userData =
      JSON.parse(storedUser);

    return (
      userData.id_utilizador ||
      userData.ID_UTILIZADOR ||
      userData.id ||
      null
    );
  } catch {
    return null;
  }
};

const autorizarPublicacao =
  async () => {
    if (!badge) {
      return;
    }

    const userId =
      obterUserId();

    if (!userId) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    try {
      setConsentimentoLoading(
        true
      );

      const response =
        await api.post(
          "/consentimentos-badge/autorizar",
          {
            id_utilizador:
              userId,

            id_badge_modelo:
              badge.id,

            id_candidatura_pedido:
              conquistadoBadge
                ?.id_candidatura_pedido ||
              null,

            linkedin_url:
              linkedinUrl.trim(),
          }
        );

      const atualizado =
        await api.get(
          `/consentimentos-badge/${userId}/${badge.id}`
        );

      setConsentimento(
        atualizado.data
      );

      setLinkedinUrl(
        atualizado.data
          ?.consentimento
          ?.linkedin_url ||
        ""
      );

      alert(
        response.data?.message ||
        "Publicação autorizada."
      );
    } catch (err) {
      console.error(
        "Erro ao autorizar publicação:",
        err
      );

      alert(
        err.response?.data?.error ||
        "Não foi possível autorizar a publicação."
      );
    } finally {
      setConsentimentoLoading(
        false
      );
    }
  };

const revogarPublicacao =
  async () => {
    if (!badge) {
      return;
    }

    const userId =
      obterUserId();

    if (!userId) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    if (
      !window.confirm(
        "Tens a certeza que queres revogar a publicação pública deste badge?"
      )
    ) {
      return;
    }

    try {
      setConsentimentoLoading(
        true
      );

      await api.post(
        "/consentimentos-badge/revogar",
        {
          id_utilizador:
            userId,

          id_badge_modelo:
            badge.id,
        }
      );

      const atualizado =
        await api.get(
          `/consentimentos-badge/${userId}/${badge.id}`
        );

      setConsentimento(
        atualizado.data
      );

      alert(
        "Autorização revogada com sucesso."
      );
    } catch (err) {
      console.error(
        "Erro ao revogar publicação:",
        err
      );

      alert(
        err.response?.data?.error ||
        "Não foi possível revogar a autorização."
      );
    } finally {
      setConsentimentoLoading(
        false
      );
    }
  };

  function confirmarInicioCandidatura() {
    if (temCandidaturaAberta) {
      navigate(`/submeter-evidencias/${badge.id}`);
      return;
    }

    setMostrarModalInicioCandidatura(
      true
    );
  }

  function avancarInicioCandidatura() {
    setMostrarModalInicioCandidatura(
      false
    );
    navigate(`/submeter-evidencias/${badge.id}`);
  }

  const obterUrlPublicaCertificado = async () => {
    const userId = obterUserId();

    if (!userId) {
      return "";
    }

    const idHistoricoDireto =
      conquistadoBadge?.id_candidatura_historico ||
      conquistadoBadge?.id_historico ||
      conquistadoBadge?.idHistorico;

    if (idHistoricoDireto) {
      return `${window.location.origin}/verificar/CERT-${idHistoricoDireto}-${userId}`;
    }

    try {
      const response = await api.get(
        `/certificados/disponiveis/${userId}`
      );

      const lista = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.certificados)
          ? response.data.certificados
          : Array.isArray(response.data?.data)
            ? response.data.data
            : [];

      const certificado = lista.find((item) => {
        const idBadgeCert =
          item.id_badge_modelo ||
          item.id_badge ||
          item.id;

        return Number(idBadgeCert) === Number(badge?.id);
      });

      return certificado?.url_publica || "";
    } catch (err) {
      console.error("Erro ao obter URL pública do certificado:", err);
      return "";
    }
  };

const garantirPublicacaoAutorizada =
  async () => {
    if (
      consentimento?.pode_publicar
    ) {
      return true;
    }

    const confirmar =
      window.confirm(
        "Para partilhar este badge no LinkedIn, o badge ficará público e associado ao teu nome. Queres autorizar a publicação pública?"
      );

    if (!confirmar) {
      return false;
    }

    const userId =
      obterUserId();

    if (!userId) {
      navigate("/login", {
        replace: true,
      });

      return false;
    }

    try {
      setConsentimentoLoading(true);

      await api.post(
        "/consentimentos-badge/autorizar",
        {
          id_utilizador:
            userId,

          id_badge_modelo:
            badge.id,

          id_candidatura_pedido:
            conquistadoBadge
              ?.id_candidatura_pedido ||
            null,

          linkedin_url:
            linkedinUrl.trim(),
        }
      );

      const atualizado =
        await api.get(
          `/consentimentos-badge/${userId}/${badge.id}`
        );

      setConsentimento(
        atualizado.data
      );

      setLinkedinUrl(
        atualizado.data
          ?.consentimento
          ?.linkedin_url ||
        ""
      );

      return true;
    } catch (err) {
      console.error(
        "Erro ao autorizar publicação para LinkedIn:",
        err
      );

      alert(
        err.response?.data?.error ||
        "Não foi possível autorizar a publicação pública do badge."
      );

      return false;
    } finally {
      setConsentimentoLoading(false);
    }
  };

const partilharLinkedin =
  async () => {
    if (!conquistado) {
      alert(
        "Só podes partilhar badges que já conquistaste."
      );

      return;
    }

    if (!badge) {
      alert(
        "Não foi possível carregar os dados do badge."
      );

      return;
    }

    const autorizado =
      await garantirPublicacaoAutorizada();

    if (!autorizado) {
      return;
    }

    const urlBadge =
      obterUrlPublicaBadge();

    if (!urlBadge) {
      alert(
        "Não foi possível gerar o link público do badge."
      );

      return;
    }

    const urlCertificado =
      await obterUrlPublicaCertificado();

    const texto =
      [
        `Conquistei o badge "${badge.nome}" na Softinsa Academy!`,
        "",
        `Badge público: ${urlBadge}`,
        urlCertificado
          ? `Certificado: ${urlCertificado}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

    const linkedinShareUrl =
      `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(texto)}`;

    const janela =
      window.open(
        linkedinShareUrl,
        "_blank",
        "noopener,noreferrer"
      );

    if (!janela) {
      window.location.href =
        linkedinShareUrl;
    }
  };

    const obterUrlPublicaBadge =
  () => {
    const userId =
      obterUserId();

    const idBadge =
      badge?.id ||
      badge?.id_badge_modelo ||
      id;

    if (
      !userId ||
      !idBadge
    ) {
      return "";
    }

    return `${window.location.origin}/badges/${userId}/${idBadge}`;
  };

const copiarLinkPublico =
  async () => {
    const url =
      obterUrlPublicaBadge();

    if (!url) {
      alert(
        "Não foi possível gerar o link público."
      );

      return;
    }

    try {
      await navigator
        .clipboard
        .writeText(url);

      alert(
        "Link público copiado."
      );
    } catch {
      alert(
        "Não foi possível copiar o link."
      );
    }
  };

const abrirBadgePublico =
  () => {
    const userId =
      obterUserId();

    const idBadge =
      badge?.id ||
      badge?.id_badge_modelo ||
      id;

    if (
      !userId ||
      !idBadge
    ) {
      return;
    }

    navigate(
      `/badges/${userId}/${idBadge}`
    );
  };

const obterDadosAssinatura =
  () => {
    const storedUser =
      localStorage.getItem("user");

    let userLocal = {};

    try {
      userLocal =
        storedUser
          ? JSON.parse(storedUser)
          : {};
    } catch {
      userLocal = {};
    }

    const dados =
      dadosUtilizador ||
      userLocal ||
      {};

    const nome =
      dados.nome_completo ||
      dados.nome ||
      dados.name ||
      "Consultor/a Softinsa";

    const email =
      dados.email_softinsa ||
      dados.email ||
      dados.emailSoftinsa ||
      "";

    const cargo =
      dados.departamento ||
      dados.tipo_utilizador ||
      "Consultor/a";

    const area =
      badge?.nome_area ||
      "";

    const cargoCompleto =
      area &&
      !String(cargo)
        .toLowerCase()
        .includes(
          String(area).toLowerCase()
        )
        ? `${cargo} - ${area}`
        : cargo;

    return {
      nome,
      email,
      cargoCompleto,
    };
  };

const gerarAssinaturaTexto =
  () => {
    const {
      nome,
      email,
      cargoCompleto,
    } = obterDadosAssinatura();

    const urlBadge =
      obterUrlPublicaBadge();

    const partes = [
      nome,
      cargoCompleto,
      email,
      "",
      `Badge conquistado: ${badge?.nome || "Badge"}`,
      "Badge verificado pela Softinsa Academy",
      "",
      urlBadge
        ? `Ver badge público: ${urlBadge}`
        : "",
      urlCertificadoAssinatura
        ? `Ver certificado: ${urlCertificadoAssinatura}`
        : "",
    ];

    return partes
      .filter(Boolean)
      .join("\n");
  };

const gerarAssinaturaHtml =
  () => {
    const {
      nome,
      email,
      cargoCompleto,
    } = obterDadosAssinatura();

    const urlBadge =
      obterUrlPublicaBadge();

    const imagemBadge =
      tornarUrlAbsoluta(
        obterImagemBadge(badge)
      );

    const nomeBadge =
      badge?.nome ||
      badge?.nome_badge ||
      "Badge";

    const imagemHtml =
      imagemBadge
        ? `
          <a href="${escaparHtml(urlBadge)}" style="text-decoration:none;">
            <img
              src="${escaparHtml(imagemBadge)}"
              alt="${escaparHtml(nomeBadge)}"
              width="64"
              height="64"
              style="
                width:64px;
                height:64px;
                object-fit:contain;
                border-radius:50%;
                border:1px solid #dbeafe;
                background:#eff6ff;
                padding:6px;
                display:block;
              "
            />
          </a>
        `
        : `
          <div style="
            width:64px;
            height:64px;
            border-radius:50%;
            border:1px solid #dbeafe;
            background:#eff6ff;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:26px;
          ">
            🏅
          </div>
        `;

    return `
      <table cellpadding="0" cellspacing="0" border="0"
        style="
          font-family: Arial, sans-serif;
          color:#111827;
          border-collapse:collapse;
          max-width:520px;
        ">
        <tr>
          <td style="padding-right:14px; vertical-align:top;">
            ${imagemHtml}
          </td>

          <td style="
            vertical-align:top;
            border-left:3px solid #4470AF;
            padding-left:14px;
          ">
            <div style="
              font-size:15px;
              font-weight:bold;
              color:#111827;
              line-height:1.3;
            ">
              ${escaparHtml(nome)}
            </div>

            <div style="
              font-size:13px;
              color:#475569;
              margin-top:2px;
              line-height:1.4;
            ">
              ${escaparHtml(cargoCompleto)}
            </div>

            ${
              email
                ? `
                  <div style="
                    font-size:13px;
                    color:#475569;
                    margin-top:2px;
                  ">
                    ${escaparHtml(email)}
                  </div>
                `
                : ""
            }

            <div style="
              margin-top:10px;
              padding-top:8px;
              border-top:1px solid #e5e7eb;
            ">
              <div style="
                font-size:13px;
                font-weight:bold;
                color:#111827;
              ">
                🏅 ${escaparHtml(nomeBadge)}
              </div>

              <div style="
                font-size:12px;
                color:#64748b;
                margin-top:2px;
              ">
                Badge verificado pela Softinsa Academy
              </div>

              <div style="
                font-size:12px;
                margin-top:6px;
              ">
                ${
                  urlBadge
                    ? `
                      <a href="${escaparHtml(urlBadge)}"
                        style="color:#2563eb; text-decoration:none; font-weight:bold;">
                        Ver badge público
                      </a>
                    `
                    : ""
                }

                ${
                  urlBadge &&
                  urlCertificadoAssinatura
                    ? `
                      <span style="color:#cbd5e1;"> | </span>
                    `
                    : ""
                }

                ${
                  urlCertificadoAssinatura
                    ? `
                      <a href="${escaparHtml(urlCertificadoAssinatura)}"
                        style="color:#16a34a; text-decoration:none; font-weight:bold;">
                        Ver certificado
                      </a>
                    `
                    : ""
                }
              </div>
            </div>
          </td>
        </tr>
      </table>
    `;
  };

const abrirModalAssinatura =
  async () => {
    if (
      !consentimento?.pode_publicar
    ) {
      alert(
        "Para usares este badge numa assinatura de email, tens de autorizar primeiro a publicação pública deste badge."
      );

      return;
    }

    const urlCertificado =
      await obterUrlPublicaCertificado();

    setUrlCertificadoAssinatura(
      urlCertificado || ""
    );

    setAssinaturaCopiada(false);
    setMostrarAssinatura(true);
  };

const copiarAssinatura =
  async () => {
    const html =
      gerarAssinaturaHtml();

    const texto =
      gerarAssinaturaTexto();

    try {
      if (
        navigator.clipboard &&
        window.ClipboardItem
      ) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html":
              new Blob(
                [html],
                {
                  type: "text/html",
                }
              ),

            "text/plain":
              new Blob(
                [texto],
                {
                  type: "text/plain",
                }
              ),
          }),
        ]);
      } else {
        await navigator
          .clipboard
          .writeText(texto);
      }

      setAssinaturaCopiada(true);

      setTimeout(() => {
        setAssinaturaCopiada(false);
      }, 1800);
    } catch (err) {
      console.error(
        "Erro ao copiar assinatura:",
        err
      );

      try {
        await navigator
          .clipboard
          .writeText(texto);

        setAssinaturaCopiada(true);
      } catch {
        alert(
          "Não foi possível copiar a assinatura."
        );
      }
    }
  };

  return (
    <div style={{ backgroundColor: "#f7f7f7", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <LeftSidebar />

        <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          <Button
            variant="link"
            className="d-flex align-items-center text-decoration-none p-0 mb-2"
            style={{ color: "#4A5568", fontSize: "1.05rem" }}
            onClick={() => navigate(-1)}
          >
            <HiOutlineArrowLeft className="me-1" />
            <span>Voltar</span>
          </Button>

          <hr className="my-2" />

          <div
            style={{
              ...heroCard,

              border: ganhouBonus
                ? "2px solid #d4af37"
                : heroCard.border,

              background: ganhouBonus
                ? "#fffdf4"
                : heroCard.background,

              boxShadow: ganhouBonus
                ? "0 0 0 3px rgba(212,175,55,0.12)"
                : "none",
            }}
          >
            <BadgeImage
              badge={badge}
              nome={badge.nome}
              size={72}
            />
            <div style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginTop: 10 }}>
              {badge.nome}
            </div>
            {badge.nome_area && (
              <div style={{ fontSize: 13, color: "#4470AF", marginTop: 4 }}>
                {badge.nome_area}
              </div>
            )}
          </div>

          {ganhouBonus && (
            <div
              style={{
                marginTop: 12,
                padding: "7px 14px",
                background: "#fff7d6",
                color: "#9a6b00",
                border:
                  "1px solid #f0d36b",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              Desafio concluído em tempo recorde
              {" • "}
              +{pontosExtra} pontos extra
            </div>
          )}

          <div style={sectionCard}>
            <div style={sectionTitle}>Descrição</div>
            <p style={{ fontSize: 13, color: "#374151", marginTop: 8, marginBottom: 0, lineHeight: 1.65 }}>
              {badge.descricao || "Sem descrição disponível."}
            </p>
          </div>

          <NivelSelector nivelAtual={obterNivelBadge(badge)} />

          {estadoCandidaturaBadge && (
            <div style={candidaturaEstadoBox}>
              {estadoCandidaturaBadge}
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 10 }}>
              Requisitos do Nível
            </div>

          {desafiosBadge.length > 0 && (
            <div style={sectionCard}>
              <div style={sectionTitle}>Desafios associados a este badge</div>

              {desafiosBadge.map((desafio) => (
                <div key={desafio.id_lembrete} style={desafioItem}>
                  <div style={{ fontWeight: 700, color: "#111827", fontSize: 13 }}>
                    {desafio.titulo || "Desafio de badge"}
                  </div>

                  <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
                    {desafio.descricao || "Sem descrição."}
                  </div>

                  <div style={{ fontSize: 11, color: "#0f766e", marginTop: 6, fontWeight: 700 }}>
                    Estado: {String(desafio.estado_lembrete || "PENDENTE").replace(/_/g, " ")}
                  </div>
                </div>
              ))}

              <button
                type="button"
                style={desafioLinkButton}
                onClick={() => navigate("/desafios")}
              >
                Ver todos os desafios
              </button>
            </div>
          )}

            {badge.requisitos.length > 0 ? (
              badge.requisitos.map((req, i) => (
                <RequisitoRow key={`${req.id}-${i}`} req={req} defaultOpen={i === 0} />
              ))
            ) : (
              <div style={sectionCard}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>
                  Sem requisitos registados para este badge.
                </span>
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 32, flexWrap: "wrap" }}>
            {conquistado ? (
  <>
    <div style={consentimentoInfoBox}>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#111827",
          marginBottom: 6,
        }}
      >
        Publicação pública deste badge
      </div>

      <div
        style={{
          fontSize: 13,
          color:
            consentimento?.pode_publicar
              ? "#166534"
              : "#92400e",
          marginBottom: 10,
        }}
      >
        {consentimento?.pode_publicar
          ? "Autorizada. Este badge pode aparecer publicamente associado ao teu nome."
          : "Não autorizada. Este badge está privado e não aparece associado ao teu nome na galeria pública."}
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          type="url"
          placeholder="Link LinkedIn opcional"
          value={linkedinUrl}
          onChange={(event) =>
            setLinkedinUrl(
              event.target.value
            )
          }
          style={linkedinInput}
        />

        <button
          type="button"
          style={{
            ...actionBtn,
            background:
              "#0a66c2",
            color:
              "white",
            border:
              "1.5px solid #0a66c2",
          }}
          disabled={
            consentimentoLoading
          }
          onClick={
            autorizarPublicacao
          }
        >
          {consentimentoLoading
            ? "A guardar..."
            : consentimento?.pode_publicar
              ? "Atualizar autorização"
              : "Autorizar publicação"}
        </button>

        {consentimento?.pode_publicar && (
          <button
            type="button"
            style={{
              ...actionBtn,
              color:
                "#b91c1c",
              border:
                "1.5px solid #fecaca",
            }}
            disabled={
              consentimentoLoading
            }
            onClick={
              revogarPublicacao
            }
          >
            Revogar
          </button>
        )}
      </div>
    </div>

    {consentimento?.pode_publicar && (
      <div style={publicLinkBox}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: "#111827",
            marginBottom: 6,
          }}
        >
          Link público do badge
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#64748b",
            marginBottom: 10,
            lineHeight: 1.45,
          }}
        >
          Este link pode ser partilhado fora da plataforma.
        </div>

        <div style={publicLinkRow}>
          <input
            readOnly
            value={obterUrlPublicaBadge()}
            style={publicLinkInput}
          />

          <button
            type="button"
            style={publicLinkButton}
            onClick={copiarLinkPublico}
          >
            Copiar
          </button>

          <button
            type="button"
            style={publicLinkButtonSecondary}
            onClick={abrirBadgePublico}
          >
            Abrir
          </button>
        </div>
      </div>
    )}

    <button
      style={actionBtn}
      onClick={
        partilharLinkedin
      }
    >
      <FaLinkedinIn
        size={16}
        color="#0077b5"
        style={{
          marginRight: 8,
        }}
      />
      Partilhar badge no LinkedIn
    </button>

    <button
      style={actionBtn}
      onClick={() =>
        navigate(
          `/certificado/${badge.id}`
        )
      }
    >
      <HiOutlineDownload
        size={17}
        style={{
          marginRight: 8,
        }}
      />
      Obter certificado
    </button>

    <button
      style={actionBtn}
      onClick={abrirModalAssinatura}
    >
      <HiOutlineMail
        size={17}
        style={{
          marginRight: 8,
        }}
      />
      Adicionar Badge à Assinatura
    </button>
  </>
            ) : (
              !ocultarAcaoCandidatura && (
                <button
                  style={actionBtn}
                  onClick={confirmarInicioCandidatura}
                >
                  <BiMedal
                    size={18}
                    style={{
                      marginRight: 8,
                    }}
                  />
                  {temCandidaturaAberta
                    ? "Continuar candidatura"
                    : estadoCandidaturaBadge === "Candidatura rejeitada"
                      ? "Voltar a submeter evidências"
                      : "Submeter Evidências"}
                </button>
              )
            )}
            </div>

          <hr />

          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 14 }}>
              Badges Relacionados
            </div>

            {relacionados.length > 0 ? (
              relacionados.map((b) => (
                <RelatedBadgeRow
                  key={b.id}
                  badge={b}
                  onClick={() => navigate(`/badge-detalhe/${b.id}`)}
                />
              ))
            ) : (
              <div style={sectionCard}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>
                  Sem badges relacionados.
                </span>
              </div>
            )}
          </div>
        </main>

        <RightSidebar />
      </div>

       <Modal
        show={mostrarAssinatura}
        onHide={() =>
          setMostrarAssinatura(false)
        }
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Assinatura de email com badge
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p style={signatureHelp}>
            Copia esta assinatura e cola-a nas definições de assinatura do Gmail, Outlook ou outro cliente de email.
          </p>

          <div style={signaturePreviewBox}>
            <div
              dangerouslySetInnerHTML={{
                __html:
                  gerarAssinaturaHtml(),
              }}
            />
          </div>

          <div style={signatureInstructions}>
            <strong>Como usar:</strong>
            <br />
            1. Clica em “Copiar assinatura”.
            <br />
            2. Abre as definições do teu email.
            <br />
            3. Vai à zona de assinatura.
            <br />
            4. Cola a assinatura e guarda.
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={signatureLabel}>
              Versão em texto simples
            </label>

            <textarea
              readOnly
              value={gerarAssinaturaTexto()}
              style={signatureTextarea}
            />
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() =>
              setMostrarAssinatura(false)
            }
          >
            Fechar
          </Button>

          <Button
            onClick={copiarAssinatura}
            style={{
              background: "#4470AF",
              border: "none",
            }}
          >
            {assinaturaCopiada
              ? "Assinatura copiada!"
              : "Copiar assinatura"}
          </Button>
        </Modal.Footer>
      </Modal>      

      <Modal
        show={mostrarModalInicioCandidatura}
        onHide={() => setMostrarModalInicioCandidatura(false)}
        centered
      >
        <Modal.Header closeButton>
            <Modal.Title>
              {estadoCandidaturaBadge === "Candidatura rejeitada"
                ? "Reabrir candidatura"
                : "Iniciar candidatura"}
            </Modal.Title>
        </Modal.Header>

        <Modal.Body>
            {estadoCandidaturaBadge === "Candidatura rejeitada"
              ? "Esta candidatura foi rejeitada. Ao continuar, vais abrir um novo envio para este badge e podes voltar a submeter as evidências."
              : "Ao continuar, vais iniciar uma candidatura para este badge. Podes guardar progresso e submeter evidências quando estiveres pronto."}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setMostrarModalInicioCandidatura(false)}
          >
            Cancelar
          </Button>

          <Button onClick={avancarInicioCandidatura}>
            {estadoCandidaturaBadge === "Candidatura rejeitada"
              ? "Reabrir candidatura"
              : "Iniciar candidatura"}
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
              border: n === nivelAtual ? "2px solid #e0a800" : "1.5px solid #d1d5db",
              color: n === nivelAtual ? "#7a5800" : "#374151",
              fontWeight: n === nivelAtual ? 700 : 500,
              boxShadow: n === nivelAtual ? "0 2px 8px rgba(245,197,24,0.35)" : "none",
            }}
          >
            {n}
          </div>
        ))}
      </div>
    </div>
  );
}

function RequisitoRow({ req, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false);

  return (
    <div style={requisitoCard}>
      <div style={requisitoHeader} onClick={() => setOpen((v) => !v)}>
        <div>
          <span style={{ fontWeight: 600, color: "#111827" }}>
            Requisito {req.id}
          </span>
          {" - "}
          <span style={{ color: "#4470AF", fontWeight: 500 }}>
            {req.titulo}
          </span>
        </div>

        {open ? (
          <BiChevronUp size={22} color="#6b7280" />
        ) : (
          <BiChevronDown size={22} color="#6b7280" />
        )}
      </div>

      {open && (
        <div style={requisitoBody}>
          <span style={{ fontWeight: 600 }}>{req.id}</span>
          {" - "}
            {req.descricao || "Sem descrição."}

          {req.link && (
            <div style={{ marginTop: 4 }}>
              <a href={req.link} target="_blank" rel="noreferrer" style={{ color: "#4470AF", fontSize: 13 }}>
                {req.link}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RelatedBadgeRow({ badge, onClick }) {
  return (
    <div style={{ ...relatedCard, cursor: "pointer" }} onClick={onClick}>
      <div style={relatedContent}>
        <BadgeImage
          badge={badge}
          nome={badge.nome}
          size={72}
        />

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
            {badge.nome}
          </div>
          <div style={{ fontSize: 12, color: "#4470AF", marginTop: 2 }}>
              {badge.nome_area || "Área não definida"}
          </div>
        </div>

        <div style={pointsBox}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#374151" }}>
            Pontos
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>
            {badge.pontos || 0}
          </div>
        </div>
      </div>

      <div style={statusBar}>Ver detalhes</div>
    </div>
  );
}

function nivelParaLetra(idNivel) {
  const nivel = Number(idNivel);

  if (nivel === 1) return "A";
  if (nivel === 2) return "B";
  if (nivel === 3) return "C";
  if (nivel === 4) return "D";
  if (nivel === 5) return "E";

  return "";
}

const signatureHelp = {
  fontSize: 14,
  color: "#475569",
  lineHeight: 1.6,
  marginBottom: 14,
};

const signaturePreviewBox = {
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  background: "#ffffff",
  padding: 18,
  marginBottom: 14,
  overflowX: "auto",
};

const signatureInstructions = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 14,
  color: "#475569",
  fontSize: 13,
  lineHeight: 1.6,
};

const signatureLabel = {
  fontSize: 13,
  fontWeight: 700,
  color: "#111827",
  marginBottom: 6,
  display: "block",
};

const signatureTextarea = {
  width: "100%",
  minHeight: 110,
  border: "1px solid #d1d5db",
  borderRadius: 10,
  padding: 12,
  fontSize: 12,
  color: "#475569",
  resize: "vertical",
  outline: "none",
};

const desafioItem = {
  border: "1px solid #dbeafe",
  background: "#f8fbff",
  borderRadius: 10,
  padding: 10,
  marginTop: 10,
};

const desafioLinkButton = {
  marginTop: 12,
  border: "none",
  background: "transparent",
  color: "#1d4ed8",
  fontSize: 13,
  fontWeight: 700,
  padding: 0,
  cursor: "pointer",
};

const candidaturaEstadoBox = {
  marginTop: 10,
  marginBottom: 10,
  border: "1px solid #bae6fd",
  background: "#f0f9ff",
  borderRadius: 10,
  padding: "8px 12px",
  color: "#0369a1",
  fontWeight: 700,
  fontSize: 12,
};

const publicLinkBox = {
  width: "100%",
  background: "#f8fafc",
  border: "1px solid #dbeafe",
  borderRadius: 10,
  padding: 16,
  marginBottom: 8,
};

const publicLinkRow = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const publicLinkInput = {
  flex: 1,
  minWidth: 260,
  height: 38,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "0 10px",
  fontSize: 12,
  color: "#475569",
  background: "white",
};

const publicLinkButton = {
  height: 38,
  border: "none",
  borderRadius: 8,
  background: "#2563eb",
  color: "white",
  padding: "0 14px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const publicLinkButtonSecondary = {
  ...publicLinkButton,
  background: "white",
  color: "#2563eb",
  border: "1px solid #bfdbfe",
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

const requisitoCard = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 10,
  marginBottom: 10,
  overflow: "hidden",
};

const consentimentoInfoBox = {
  width: "100%",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 10,
  padding: 16,
  marginBottom: 8,
};

const linkedinInput = {
  height: 38,
  minWidth: 260,
  flex: 1,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "0 12px",
  fontSize: 13,
  color: "#374151",
  outline: "none",
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

const actionBtn = {
  minWidth: 180,
  height: 40,
  padding: "0 16px",

  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  border: "1px solid #d6dbe1",
  borderRadius: 8,

  background: "#f8f9fa",
  color: "#344054",

  fontSize: 14,
  fontWeight: 500,

  cursor: "pointer",

  boxShadow:
    "0 1px 2px rgba(0, 0, 0, 0.05)",

  transition:
    "background-color 0.15s ease, border-color 0.15s ease",
};

const relatedCard = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 10,
  marginBottom: 14,
  overflow: "hidden",
};

const relatedContent = {
  padding: "14px 16px",
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const relatedIcon = {
  width: 52,
  height: 52,
  borderRadius: "50%",
  background: "#eef6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 24,
  flexShrink: 0,
};

const pointsBox = {
  border: "1.5px solid #4470AF",
  borderRadius: 12,
  padding: "6px 10px",
  minWidth: 52,
  textAlign: "center",
  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
};

const statusBar = {
  borderTop: "1px solid #e5e7eb",
  textAlign: "center",
  padding: "6px 0",
  fontSize: 12,
  color: "#3b4a60",
  background: "#fbfdff",
};

export default BadgeDetailPage;
