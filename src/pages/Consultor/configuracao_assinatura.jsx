import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Button,
  Card,
  Form,
  Spinner,
} from "react-bootstrap";

import {
  BiArrowBack,
  BiCopy,
  BiEnvelope,
  BiMedal,
  BiRefresh,
  BiSave,
} from "react-icons/bi";

import {
  useNavigate,
} from "react-router-dom";

import Header from "../../components/Header.jsx";
import LeftSidebar from "../../components/LeftSidebar.jsx";
import RightSidebar from "../../components/RightSidebar.jsx";
import BadgeImage, {
  obterImagemBadge,
} from "../../components/badge_image.jsx";
import api from "../../services/api.js";

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

function obterIdBadge(badge) {
  return (
    badge?.id ||
    badge?.id_badge_modelo ||
    badge?.badge_id ||
    null
  );
}

function removerDuplicados(lista) {
  const mapa =
    new Map();

  (lista || []).forEach((badge) => {
    const idBadge =
      obterIdBadge(badge);

    if (!idBadge) {
      return;
    }

    const existente =
      mapa.get(String(idBadge));

    if (!existente) {
      mapa.set(String(idBadge), {
        ...badge,

        id:
          idBadge,

        nome:
          badge.nome ||
          badge.nome_badge ||
          "Badge",

        descricao:
          badge.descricao ||
          badge.descricao_badge_modelo ||
          "",

        imagem_url:
          badge.imagem_url ||
          badge.imagem ||
          badge.url_imagem ||
          null,
      });

      return;
    }

    mapa.set(String(idBadge), {
      ...existente,
      ...badge,

      nome:
        existente.nome ||
        badge.nome ||
        badge.nome_badge ||
        "Badge",

      imagem_url:
        existente.imagem_url ||
        badge.imagem_url ||
        badge.imagem ||
        badge.url_imagem ||
        null,
    });
  });

  return Array.from(
    mapa.values()
  );
}

function obterUserId(user) {
  return (
    user?.id_utilizador ||
    user?.ID_UTILIZADOR ||
    user?.id ||
    null
  );
}

const CONFIG_PADRAO = {
  template: "completo",

  mostrarNome: true,
  mostrarCargo: true,
  mostrarEmail: true,
  mostrarLogoSoftinsa: true,
  mostrarImagemBadge: true,
  mostrarLinkBadge: true,
  mostrarVariosBadges: false,

  limiteBadges: 3,
  badgePrincipalId: "",
  badgesSelecionadosIds: [],
};

function ConfiguracaoAssinaturaPage() {
  const navigate =
    useNavigate();

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    user,
    setUser,
  ] = useState(null);

  const [
    badges,
    setBadges,
  ] = useState([]);

  const [
    config,
    setConfig,
  ] = useState(CONFIG_PADRAO);

  const [
    copiado,
    setCopiado,
  ] = useState(false);

  const [
    guardado,
    setGuardado,
  ] = useState(false);

  const storageKey =
    useMemo(() => {
      const id =
        obterUserId(user);

      return id
        ? `softinsa_email_signature_template_${id}`
        : "softinsa_email_signature_template";
    }, [user]);

  useEffect(() => {
    const storedUser =
      localStorage.getItem("user");

    if (!storedUser) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    let userData = null;

    try {
      userData =
        JSON.parse(storedUser);
    } catch {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    const userId =
      obterUserId(userData);

    if (!userId) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    setLoading(true);

    Promise.all([
      api
        .get(`/utilizadores/${userId}`)
        .catch(() => ({
          data: userData,
        })),

      api
        .get(`/badges/conquistados/${userId}`)
        .catch(() => ({
          data: [],
        })),
    ])
      .then(([userRes, badgesRes]) => {
        const utilizador =
          userRes?.data ||
          userData;

        const badgesUnicos =
          removerDuplicados(
            Array.isArray(badgesRes.data)
              ? badgesRes.data
              : []
          );

        setUser(utilizador);
        setBadges(badgesUnicos);

        const guardada =
          localStorage.getItem(
            `softinsa_email_signature_template_${userId}`
          );

        let configInicial =
          CONFIG_PADRAO;

        if (guardada) {
          try {
            configInicial = {
              ...CONFIG_PADRAO,
              ...JSON.parse(guardada),
            };
          } catch {
            configInicial =
              CONFIG_PADRAO;
          }
        }

        if (
          !configInicial.badgePrincipalId &&
          badgesUnicos.length > 0
        ) {
          configInicial = {
            ...configInicial,
            badgePrincipalId:
              String(
                obterIdBadge(
                  badgesUnicos[0]
                )
              ),
            badgesSelecionadosIds: [
              String(
                obterIdBadge(
                  badgesUnicos[0]
                )
              ),
            ],
          };
        }

        setConfig(configInicial);
      })
      .catch((err) => {
        console.error(
          "Erro ao carregar configuraÃ§Ã£o da assinatura:",
          err
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  const dadosAssinatura =
    useMemo(() => {
      const nome =
        user?.nome_completo ||
        user?.nome ||
        "Consultor/a Softinsa";

      const email =
        user?.email_softinsa ||
        user?.email ||
        "";

      const cargo =
        user?.departamento ||
        user?.tipo_utilizador ||
        "Consultor/a";

      return {
        nome,
        email,
        cargo,
      };
    }, [user]);

  const badgePrincipal =
    useMemo(() => {
      if (
        !config.badgePrincipalId &&
        badges.length > 0
      ) {
        return badges[0];
      }

      return badges.find(
        (badge) =>
          String(obterIdBadge(badge)) ===
          String(config.badgePrincipalId)
      );
    }, [
      badges,
      config.badgePrincipalId,
    ]);

  const badgesSelecionados =
    useMemo(() => {
      const ids =
        Array.isArray(
          config.badgesSelecionadosIds
        )
          ? config.badgesSelecionadosIds.map(String)
          : [];

      const selecionados =
        badges.filter((badge) =>
          ids.includes(
            String(obterIdBadge(badge))
          )
        );

      if (
        config.mostrarVariosBadges
      ) {
        return selecionados.slice(
          0,
          Number(config.limiteBadges || 3)
        );
      }

      return badgePrincipal
        ? [badgePrincipal]
        : [];
    }, [
      badges,
      badgePrincipal,
      config.badgesSelecionadosIds,
      config.mostrarVariosBadges,
      config.limiteBadges,
    ]);

  const atualizarConfig =
    (campo, valor) => {
      setConfig((anterior) => ({
        ...anterior,
        [campo]: valor,
      }));

      setGuardado(false);
    };

  const alternarBadgeSelecionado =
    (idBadge) => {
      const idString =
        String(idBadge);

      setConfig((anterior) => {
        const atuais =
          Array.isArray(
            anterior.badgesSelecionadosIds
          )
            ? anterior.badgesSelecionadosIds.map(String)
            : [];

        const existe =
          atuais.includes(idString);

        const novos =
          existe
            ? atuais.filter(
                (id) => id !== idString
              )
            : [...atuais, idString];

        return {
          ...anterior,
          badgesSelecionadosIds:
            novos,
        };
      });

      setGuardado(false);
    };

  const obterUrlBadge =
    (badge) => {
      const userId =
        obterUserId(user);

      const idBadge =
        obterIdBadge(badge);

      if (
        !userId ||
        !idBadge
      ) {
        return "";
      }

      return `${window.location.origin}/badges/${userId}/${idBadge}`;
    };

  const gerarHtmlBadge =
    (badge) => {
      if (!badge) {
        return "";
      }

      const nomeBadge =
        badge.nome ||
        badge.nome_badge ||
        "Badge";

      const urlBadge =
        obterUrlBadge(badge);

      const imagem =
        tornarUrlAbsoluta(
          obterImagemBadge(badge)
        );

      const imagemHtml =
        config.mostrarImagemBadge && imagem
          ? `
            <a href="${escaparHtml(urlBadge)}" style="text-decoration:none;">
              <img
                src="${escaparHtml(imagem)}"
                alt="${escaparHtml(nomeBadge)}"
                width="54"
                height="54"
                style="
                  width:54px;
                  height:54px;
                  object-fit:contain;
                  border-radius:50%;
                  border:1px solid #dbeafe;
                  background:#eff6ff;
                  padding:5px;
                  display:block;
                "
              />
            </a>
          `
          : `
            <div style="
              width:54px;
              height:54px;
              border-radius:50%;
              border:1px solid #dbeafe;
              background:#eff6ff;
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:24px;
            ">
              ðŸ…
            </div>
          `;

      return `
        <tr>
          <td style="padding:8px 10px 8px 0; vertical-align:middle;">
            ${imagemHtml}
          </td>

          <td style="padding:8px 0; vertical-align:middle;">
            <div style="
              font-size:13px;
              font-weight:bold;
              color:#111827;
              line-height:1.35;
            ">
              ${escaparHtml(nomeBadge)}
            </div>

            <div style="
              font-size:12px;
              color:#64748b;
              margin-top:2px;
            ">
              Badge verificado pela Softinsa Academy
            </div>

            ${
              config.mostrarLinkBadge && urlBadge
                ? `
                  <div style="font-size:12px; margin-top:4px;">
                    <a href="${escaparHtml(urlBadge)}"
                      style="color:#2563eb; text-decoration:none; font-weight:bold;">
                      Ver badge pÃºblico
                    </a>
                  </div>
                `
                : ""
            }
          </td>
        </tr>
      `;
    };

  const gerarAssinaturaHtml =
    () => {
      const badgesHtml =
        badgesSelecionados
          .map(gerarHtmlBadge)
          .join("");

      const isSimples =
        config.template === "simples";

      const isGaleria =
        config.template === "galeria";

      return `
        <table cellpadding="0" cellspacing="0" border="0"
          style="
            font-family: Arial, sans-serif;
            color:#111827;
            border-collapse:collapse;
            max-width:${isGaleria ? "620px" : "540px"};
          ">
          <tr>
            ${
              config.mostrarLogoSoftinsa
                ? `
                  <td style="
                    padding-right:14px;
                    vertical-align:top;
                    border-right:3px solid #4470AF;
                  ">
                    <div style="
                      width:72px;
                      height:72px;
                      border-radius:14px;
                      background:#eff6ff;
                      color:#4470AF;
                      display:flex;
                      align-items:center;
                      justify-content:center;
                      font-weight:bold;
                      font-size:15px;
                      border:1px solid #dbeafe;
                    ">
                      Softinsa
                    </div>
                  </td>
                `
                : ""
            }

            <td style="
              vertical-align:top;
              padding-left:${config.mostrarLogoSoftinsa ? "14px" : "0"};
            ">
              ${
                config.mostrarNome
                  ? `
                    <div style="
                      font-size:15px;
                      font-weight:bold;
                      color:#111827;
                      line-height:1.3;
                    ">
                      ${escaparHtml(dadosAssinatura.nome)}
                    </div>
                  `
                  : ""
              }

              ${
                config.mostrarCargo
                  ? `
                    <div style="
                      font-size:13px;
                      color:#475569;
                      margin-top:2px;
                      line-height:1.4;
                    ">
                      ${escaparHtml(dadosAssinatura.cargo)}
                    </div>
                  `
                  : ""
              }

              ${
                config.mostrarEmail &&
                dadosAssinatura.email
                  ? `
                    <div style="
                      font-size:13px;
                      color:#475569;
                      margin-top:2px;
                    ">
                      ${escaparHtml(dadosAssinatura.email)}
                    </div>
                  `
                  : ""
              }

              ${
                !isSimples
                  ? `
                    <div style="
                      margin-top:10px;
                      padding-top:8px;
                      border-top:1px solid #e5e7eb;
                    ">
                      <div style="
                        font-size:12px;
                        color:#64748b;
                        margin-bottom:4px;
                      ">
                        Badges conquistados
                      </div>

                      <table cellpadding="0" cellspacing="0" border="0"
                        style="border-collapse:collapse;">
                        ${badgesHtml}
                      </table>
                    </div>
                  `
                  : badgePrincipal
                    ? `
                      <div style="
                        margin-top:10px;
                        padding-top:8px;
                        border-top:1px solid #e5e7eb;
                      ">
                        <table cellpadding="0" cellspacing="0" border="0"
                          style="border-collapse:collapse;">
                          ${gerarHtmlBadge(badgePrincipal)}
                        </table>
                      </div>
                    `
                    : ""
              }
            </td>
          </tr>
        </table>
      `;
    };

  const gerarAssinaturaTexto =
    () => {
      const linhas = [];

      if (config.mostrarNome) {
        linhas.push(
          dadosAssinatura.nome
        );
      }

      if (config.mostrarCargo) {
        linhas.push(
          dadosAssinatura.cargo
        );
      }

      if (
        config.mostrarEmail &&
        dadosAssinatura.email
      ) {
        linhas.push(
          dadosAssinatura.email
        );
      }

      if (badgesSelecionados.length > 0) {
        linhas.push("");
        linhas.push("Badges conquistados:");

        badgesSelecionados.forEach((badge) => {
          const nomeBadge =
            badge.nome ||
            badge.nome_badge ||
            "Badge";

          linhas.push(
            `- ${nomeBadge}`
          );

          if (config.mostrarLinkBadge) {
            const url =
              obterUrlBadge(badge);

            if (url) {
              linhas.push(
                `  ${url}`
              );
            }
          }
        });
      }

      return linhas
        .filter(Boolean)
        .join("\n");
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

        setCopiado(true);

        setTimeout(() => {
          setCopiado(false);
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

          setCopiado(true);
        } catch {
          alert(
            "NÃ£o foi possÃ­vel copiar a assinatura."
          );
        }
      }
    };

  const guardarTemplate =
    () => {
      localStorage.setItem(
        storageKey,
        JSON.stringify(config)
      );

      setGuardado(true);

      setTimeout(() => {
        setGuardado(false);
      }, 1800);
    };

  const reporTemplate =
    () => {
      const primeiroBadge =
        badges[0];

      const novaConfig = {
        ...CONFIG_PADRAO,
        badgePrincipalId:
          primeiroBadge
            ? String(
                obterIdBadge(primeiroBadge)
              )
            : "",
        badgesSelecionadosIds:
          primeiroBadge
            ? [
                String(
                  obterIdBadge(primeiroBadge)
                ),
              ]
            : [],
      };

      setConfig(novaConfig);

      localStorage.setItem(
        storageKey,
        JSON.stringify(novaConfig)
      );
    };

  if (loading) {
    return (
      <div
        className="
          d-flex
          justify-content-center
          align-items-center
        "
        style={{
          height: "100vh",
        }}
      >
        <Spinner
          animation="border"
          variant="primary"
        />
      </div>
    );
  }

  return (
    <div style={page}>
      <Header />

      <div style={layout}>
        <LeftSidebar />

        <main style={main}>
          <button
            type="button"
            style={backButton}
            onClick={() =>
              navigate(-1)
            }
          >
            <BiArrowBack size={18} />
            Voltar
          </button>

          <div style={pageHeader}>
            <div>
              <div style={eyebrow}>
                Assinatura de e-mail
              </div>

              <h1 style={title}>
                ConfiguraÃ§Ã£o do template
              </h1>

              <p style={subtitle}>
                Define como os teus badges aparecem na assinatura de e-mail e copia o template pronto para usar no Gmail, Outlook ou outro cliente.
              </p>
            </div>

            <div style={headerIcon}>
              <BiEnvelope size={34} />
            </div>
          </div>

          <div style={grid}>
            <section style={leftColumn}>
              <Card
                className="border-0 mb-3"
                style={card}
              >
                <Card.Body>
                  <h5 style={sectionTitle}>
                    Template
                  </h5>

                  <div style={templateGrid}>
                    <TemplateOption
                      active={
                        config.template ===
                        "simples"
                      }
                      title="Simples"
                      description="Nome, cargo e um badge principal."
                      onClick={() =>
                        atualizarConfig(
                          "template",
                          "simples"
                        )
                      }
                    />

                    <TemplateOption
                      active={
                        config.template ===
                        "completo"
                      }
                      title="Completo"
                      description="Dados pessoais, badge e links pÃºblicos."
                      onClick={() =>
                        atualizarConfig(
                          "template",
                          "completo"
                        )
                      }
                    />

                    <TemplateOption
                      active={
                        config.template ===
                        "galeria"
                      }
                      title="Galeria"
                      description="Mostra vÃ¡rios badges conquistados."
                      onClick={() => {
                        atualizarConfig(
                          "template",
                          "galeria"
                        );
                        atualizarConfig(
                          "mostrarVariosBadges",
                          true
                        );
                      }}
                    />
                  </div>
                </Card.Body>
              </Card>

              <Card
                className="border-0 mb-3"
                style={card}
              >
                <Card.Body>
                  <h5 style={sectionTitle}>
                    Campos visÃ­veis
                  </h5>

                  <div style={checksGrid}>
                    <CheckOption
                      label="Mostrar nome"
                      checked={
                        config.mostrarNome
                      }
                      onChange={(valor) =>
                        atualizarConfig(
                          "mostrarNome",
                          valor
                        )
                      }
                    />

                    <CheckOption
                      label="Mostrar cargo/departamento"
                      checked={
                        config.mostrarCargo
                      }
                      onChange={(valor) =>
                        atualizarConfig(
                          "mostrarCargo",
                          valor
                        )
                      }
                    />

                    <CheckOption
                      label="Mostrar e-mail"
                      checked={
                        config.mostrarEmail
                      }
                      onChange={(valor) =>
                        atualizarConfig(
                          "mostrarEmail",
                          valor
                        )
                      }
                    />

                    <CheckOption
                      label="Mostrar Softinsa"
                      checked={
                        config.mostrarLogoSoftinsa
                      }
                      onChange={(valor) =>
                        atualizarConfig(
                          "mostrarLogoSoftinsa",
                          valor
                        )
                      }
                    />

                    <CheckOption
                      label="Mostrar imagem do badge"
                      checked={
                        config.mostrarImagemBadge
                      }
                      onChange={(valor) =>
                        atualizarConfig(
                          "mostrarImagemBadge",
                          valor
                        )
                      }
                    />

                    <CheckOption
                      label="Mostrar link pÃºblico"
                      checked={
                        config.mostrarLinkBadge
                      }
                      onChange={(valor) =>
                        atualizarConfig(
                          "mostrarLinkBadge",
                          valor
                        )
                      }
                    />

                    <CheckOption
                      label="Mostrar vÃ¡rios badges"
                      checked={
                        config.mostrarVariosBadges
                      }
                      onChange={(valor) =>
                        atualizarConfig(
                          "mostrarVariosBadges",
                          valor
                        )
                      }
                    />
                  </div>
                </Card.Body>
              </Card>

              <Card
                className="border-0 mb-3"
                style={card}
              >
                <Card.Body>
                  <h5 style={sectionTitle}>
                    Badges do template
                  </h5>

                  {badges.length === 0 ? (
                    <p style={muted}>
                      Ainda nÃ£o tens badges conquistados para adicionar Ã  assinatura.
                    </p>
                  ) : (
                    <>
                      <Form.Group className="mb-3">
                        <Form.Label style={label}>
                          Badge principal
                        </Form.Label>

                        <Form.Select
                          value={
                            config.badgePrincipalId
                          }
                          onChange={(event) =>
                            atualizarConfig(
                              "badgePrincipalId",
                              event.target.value
                            )
                          }
                        >
                          {badges.map((badge) => (
                            <option
                              key={obterIdBadge(badge)}
                              value={obterIdBadge(badge)}
                            >
                              {badge.nome ||
                                badge.nome_badge ||
                                "Badge"}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label style={label}>
                          Limite de badges
                        </Form.Label>

                        <Form.Select
                          value={
                            config.limiteBadges
                          }
                          onChange={(event) =>
                            atualizarConfig(
                              "limiteBadges",
                              Number(
                                event.target.value
                              )
                            )
                          }
                          disabled={
                            !config.mostrarVariosBadges
                          }
                        >
                          <option value={1}>
                            1 badge
                          </option>
                          <option value={2}>
                            2 badges
                          </option>
                          <option value={3}>
                            3 badges
                          </option>
                          <option value={4}>
                            4 badges
                          </option>
                          <option value={5}>
                            5 badges
                          </option>
                        </Form.Select>
                      </Form.Group>

                      <div style={badgeList}>
                        {badges.map((badge) => {
                          const idBadge =
                            String(
                              obterIdBadge(badge)
                            );

                          const selecionado =
                            config.badgesSelecionadosIds
                              ?.map(String)
                              .includes(idBadge);

                          return (
                            <button
                              key={idBadge}
                              type="button"
                              style={{
                                ...badgeOption,
                                borderColor:
                                  selecionado
                                    ? "#2563eb"
                                    : "#e5e7eb",
                                background:
                                  selecionado
                                    ? "#eff6ff"
                                    : "white",
                              }}
                              onClick={() =>
                                alternarBadgeSelecionado(
                                  idBadge
                                )
                              }
                            >
                              <BadgeImage
                                badge={badge}
                                size={44}
                              />

                              <span style={badgeOptionText}>
                                {badge.nome ||
                                  badge.nome_badge ||
                                  "Badge"}
                              </span>

                              <span
                                style={{
                                  ...badgeCheck,
                                  background:
                                    selecionado
                                      ? "#2563eb"
                                      : "#e5e7eb",
                                }}
                              >
                                {selecionado
                                  ? "âœ“"
                                  : ""}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>
            </section>

            <aside style={rightColumn}>
              <Card
                className="border-0 mb-3"
                style={card}
              >
                <Card.Body>
                  <div style={previewHeader}>
                    <div>
                      <h5 style={sectionTitle}>
                        PrÃ©-visualizaÃ§Ã£o
                      </h5>

                      <p style={muted}>
                        Esta Ã© a assinatura que serÃ¡ copiada.
                      </p>
                    </div>
                  </div>

                  <div style={previewBox}>
                    <div
                      dangerouslySetInnerHTML={{
                        __html:
                          gerarAssinaturaHtml(),
                      }}
                    />
                  </div>

                  <div style={actions}>
                    <Button
                      style={primaryButton}
                      onClick={
                        copiarAssinatura
                      }
                    >
                      <BiCopy size={17} />
                      {copiado
                        ? "Copiado!"
                        : "Copiar assinatura"}
                    </Button>

                    <Button
                      variant="light"
                      style={secondaryButton}
                      onClick={
                        guardarTemplate
                      }
                    >
                      <BiSave size={17} />
                      {guardado
                        ? "Guardado!"
                        : "Guardar template"}
                    </Button>

                    <Button
                      variant="light"
                      style={secondaryButton}
                      onClick={
                        reporTemplate
                      }
                    >
                      <BiRefresh size={17} />
                      Repor
                    </Button>
                  </div>
                </Card.Body>
              </Card>

              <Card
                className="border-0"
                style={card}
              >
                <Card.Body>
                  <h5 style={sectionTitle}>
                    Texto simples
                  </h5>

                  <textarea
                    readOnly
                    value={gerarAssinaturaTexto()}
                    style={textarea}
                  />

                  <p style={smallInfo}>
                    Usa esta versÃ£o se o cliente de e-mail nÃ£o aceitar HTML.
                  </p>
                </Card.Body>
              </Card>
            </aside>
          </div>
        </main>

        <RightSidebar />
      </div>
    </div>
  );
}

function TemplateOption({
  active,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...templateOption,
        borderColor:
          active
            ? "#2563eb"
            : "#e5e7eb",
        background:
          active
            ? "#eff6ff"
            : "white",
      }}
    >
      <div style={templateTitle}>
        {title}
      </div>

      <div style={templateDescription}>
        {description}
      </div>
    </button>
  );
}

function CheckOption({
  label,
  checked,
  onChange,
}) {
  return (
    <label style={checkOption}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
      />

      <span>
        {label}
      </span>
    </label>
  );
}

const page = {
  backgroundColor: "#f0f2f5",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
};

const layout = {
  display: "flex",
  flex: 1,
  overflow: "hidden",
};

const main = {
  flex: 1,
  overflowY: "auto",
  padding: "24px 28px 40px",
};

const backButton = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  gap: 7,
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  marginBottom: 14,
};

const pageHeader = {
  background:
    "linear-gradient(135deg, #4470AF, #2563eb)",
  color: "white",
  borderRadius: 16,
  padding: 24,
  marginBottom: 22,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
};

const eyebrow = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 0.8,
  opacity: 0.85,
  fontWeight: 700,
  marginBottom: 4,
};

const title = {
  fontSize: 25,
  fontWeight: 650,
  margin: 0,
};

const subtitle = {
  fontSize: 14,
  opacity: 0.9,
  margin: "8px 0 0",
  maxWidth: 720,
  lineHeight: 1.55,
};

const headerIcon = {
  width: 72,
  height: 72,
  borderRadius: "50%",
  background: "rgba(255,255,255,0.18)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const grid = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 1fr) 430px",
  gap: 22,
  alignItems: "start",
};

const leftColumn = {
  minWidth: 0,
};

const rightColumn = {
  minWidth: 0,
};

const card = {
  borderRadius: 14,
  boxShadow:
    "0 2px 10px rgba(15,23,42,0.05)",
};

const sectionTitle = {
  fontSize: 16,
  fontWeight: 700,
  color: "#111827",
  marginBottom: 12,
};

const templateGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(170px, 1fr))",
  gap: 12,
};

const templateOption = {
  border: "1.5px solid #e5e7eb",
  borderRadius: 12,
  padding: 14,
  textAlign: "left",
  cursor: "pointer",
};

const templateTitle = {
  fontSize: 14,
  fontWeight: 600,
  color: "#111827",
  marginBottom: 5,
};

const templateDescription = {
  fontSize: 12,
  color: "#64748b",
  lineHeight: 1.45,
};

const checksGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 10,
};

const checkOption = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  color: "#374151",
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "10px 12px",
  cursor: "pointer",
};

const label = {
  fontSize: 13,
  fontWeight: 400,
  color: "#374151",
};

const badgeList = {
  display: "flex",
  flexDirection: "column",
  gap: 9,
};

const badgeOption = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 10,
  border: "1.5px solid #e5e7eb",
  borderRadius: 12,
  padding: 10,
  cursor: "pointer",
  textAlign: "left",
};

const badgeOptionText = {
  flex: 1,
  fontSize: 13,
  fontWeight: 700,
  color: "#111827",
};

const badgeCheck = {
  width: 22,
  height: 22,
  borderRadius: "50%",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  fontWeight: 500,
};

const previewHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
};

const previewBox = {
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  background: "white",
  padding: 18,
  overflowX: "auto",
  marginBottom: 14,
};

const actions = {
  display: "flex",
  flexDirection: "column",
  gap: 9,
};

const primaryButton = {
  background: "#2563eb",
  border: "none",
  borderRadius: 999,
  padding: "10px 18px",
  fontWeight: 400,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const secondaryButton = {
  border: "1px solid #dbe3ef",
  borderRadius: 999,
  padding: "10px 18px",
  fontWeight: 400,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const textarea = {
  width: "100%",
  minHeight: 170,
  border: "1px solid #d1d5db",
  borderRadius: 10,
  padding: 12,
  fontSize: 12,
  color: "#475569",
  outline: "none",
  resize: "vertical",
};

const muted = {
  color: "#64748b",
  fontSize: 13,
  lineHeight: 1.5,
  margin: 0,
};

const smallInfo = {
  marginTop: 10,
  color: "#64748b",
  fontSize: 12,
  lineHeight: 1.5,
};

export default ConfiguracaoAssinaturaPage;
