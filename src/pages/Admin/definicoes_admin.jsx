import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  BiArrowBack,
  BiChevronRight,
  BiEnvelope,
  BiIdCard,
  BiShield,
} from "react-icons/bi";

import {
  HiOutlineCamera,
  HiOutlineDocumentText,
  HiOutlineLockClosed,
  HiOutlineLogout,
  HiOutlinePhone,
  HiOutlineTrash,
  HiOutlineUser,
} from "react-icons/hi";

import Header from "../../components/Header.jsx";
import AdminLeftSidebar from "../../components/admin_left_sidebar.jsx";
import AdminRightSidebar from "../../components/admin_right_sidebar.jsx";

import api, {
  buildUploadUrl,
} from "../../services/api.js";

function obterUtilizadorGuardado() {
  const guardado =
    localStorage.getItem("user");

  if (!guardado) {
    return null;
  }

  try {
    return JSON.parse(guardado);
  } catch {
    return null;
  }
}

function DefinicoesAdminPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] =
    useState(null);

  const [nome, setNome] =
    useState("");

  const [contacto, setContacto] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [
    emailSoftinsa,
    setEmailSoftinsa,
  ] = useState("");

  const [
    estadoConta,
    setEstadoConta,
  ] = useState("");

  const [
    emailVerificado,
    setEmailVerificado,
  ] = useState(false);

  const [
    aceitouTermos,
    setAceitouTermos,
  ] = useState(false);

  const [
    entidadesGeridas,
    setEntidadesGeridas,
  ] = useState("");

  const [
    intervencoes,
    setIntervencoes,
  ] = useState(0);

  const [
    fotoPerfil,
    setFotoPerfil,
  ] = useState(null);

  const [
    ficheiroFoto,
    setFicheiroFoto,
  ] = useState(null);

  const [
    previewFoto,
    setPreviewFoto,
  ] = useState(null);

  const [
    receberNotificacoes,
    setReceberNotificacoes,
  ] = useState(true);

  const [
    passwordAtual,
    setPasswordAtual,
  ] = useState("");

  const [
    novaPassword,
    setNovaPassword,
  ] = useState("");

  const [
    confirmarPassword,
    setConfirmarPassword,
  ] = useState("");

  const [
    showTermos,
    setShowTermos,
  ] = useState(false);

  const [
    showDeleteModal,
    setShowDeleteModal,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    isUploadingFoto,
    setIsUploadingFoto,
  ] = useState(false);

  const [
    isChangingPassword,
    setIsChangingPassword,
  ] = useState(false);

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  const [erro, setErro] =
    useState("");

  const [
    mensagem,
    setMensagem,
  ] = useState("");

  const textoVoltar =
    location.state?.textoVoltar ||
    "Voltar ao dashboard";

  useEffect(() => {
    carregarAdmin();
  }, []);

  function getUserId() {
    return (
      user?.id_utilizador ||
      user?.ID_UTILIZADOR ||
      user?.id
    );
  }

  function atualizarLocalStorageGlobal(
    dadosAtualizados = {}
  ) {
    const userFinal = {
      ...user,
      ...dadosAtualizados,

      id_utilizador:
        dadosAtualizados.id_utilizador ||
        dadosAtualizados.ID_UTILIZADOR ||
        user?.id_utilizador,

      nome_completo:
        dadosAtualizados.nome_completo ||
        dadosAtualizados.NOME_COMPLETO ||
        nome,

      nome:
        dadosAtualizados.nome_completo ||
        dadosAtualizados.NOME_COMPLETO ||
        nome,

      contacto:
        dadosAtualizados.contacto ??
        dadosAtualizados.CONTACTO ??
        contacto,

      email:
        dadosAtualizados.email ||
        dadosAtualizados.EMAIL ||
        email,

      email_softinsa:
        dadosAtualizados.email_softinsa ||
        dadosAtualizados.EMAIL_SOFTINSA ||
        emailSoftinsa,

      estado_conta:
        dadosAtualizados.estado_conta ||
        dadosAtualizados.ESTADO_CONTA ||
        estadoConta,

      foto_perfil:
        dadosAtualizados.foto_perfil ||
        dadosAtualizados.FOTO_PERFIL ||
        fotoPerfil,

      receber_notificacoes:
        dadosAtualizados.receber_notificacoes ??
        dadosAtualizados.RECEBER_NOTIFICACOES ??
        receberNotificacoes,

      tipo_utilizador:
        user?.tipo_utilizador ||
        "Administrador",
    };

    localStorage.setItem(
      "user",
      JSON.stringify(userFinal)
    );

    setUser(userFinal);
  }

  async function carregarAdmin() {
    const userData =
      obterUtilizadorGuardado();

    if (!userData) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    const userId =
      userData.id_utilizador ||
      userData.ID_UTILIZADOR ||
      userData.id;

    if (!userId) {
      localStorage.clear();

      navigate("/login", {
        replace: true,
      });

      return;
    }

    setUser(userData);

    try {
      setIsLoading(true);
      setErro("");

      const response =
        await api.get(
          `/utilizadores/${userId}/admin`
        );

      const admin =
        response.data || {};

      const userAtualizado = {
        ...userData,
        ...admin,
        tipo_utilizador:
          admin.tipo_utilizador ||
          "Administrador",
      };

      atualizarLocalStorageGlobal(
        userAtualizado
      );

      setNome(
        admin.nome_completo ||
          admin.NOME_COMPLETO ||
          userData.nome_completo ||
          ""
      );

      setContacto(
        admin.contacto ??
          admin.CONTACTO ??
          userData.contacto ??
          ""
      );

      setEmail(
        admin.email ||
          admin.EMAIL ||
          userData.email ||
          ""
      );

      setEmailSoftinsa(
        admin.email_softinsa ||
          admin.EMAIL_SOFTINSA ||
          userData.email_softinsa ||
          ""
      );

      setEstadoConta(
        admin.estado_conta ||
          admin.ESTADO_CONTA ||
          userData.estado_conta ||
          ""
      );

      setEmailVerificado(
        Boolean(
          admin.email_verificado ??
            admin.EMAIL_VERIFICADO ??
            false
        )
      );

      setAceitouTermos(
        Boolean(
          admin.aceitou_termos ??
            admin.ACEITOU_TERMOS ??
            false
        )
      );

      setEntidadesGeridas(
        admin.entidades_geridas ||
          admin.ENTIDADES_GERIDAS ||
          ""
      );

      setIntervencoes(
        Number(
          admin.entervencoes ||
            admin.ENTERVENCOES ||
            0
        )
      );

      setFotoPerfil(
        admin.foto_perfil ||
          admin.FOTO_PERFIL ||
          userData.foto_perfil ||
          null
      );

      setReceberNotificacoes(
        admin.receber_notificacoes ??
          admin.RECEBER_NOTIFICACOES ??
          userData.receber_notificacoes ??
          true
      );
    } catch (err) {
      console.error(
        "Erro ao carregar definições do Admin:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar os dados da conta."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function lidarComVoltar() {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/admin");
    }
  }

  function handleFotoChange(event) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setFicheiroFoto(file);
    setPreviewFoto(
      URL.createObjectURL(file)
    );

    setErro("");
    setMensagem("");
  }

  async function handleUploadFoto() {
    const id = getUserId();

    if (!ficheiroFoto || !id) {
      return;
    }

    try {
      setIsUploadingFoto(true);
      setErro("");
      setMensagem("");

      const formData =
        new FormData();

      formData.append(
        "foto",
        ficheiroFoto
      );

      const response =
        await api.put(
          `/utilizadores/${id}/foto`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

      const dadosAtualizados =
        response.data?.utilizador ||
        response.data?.dados ||
        response.data ||
        {};

      const novaFoto =
        dadosAtualizados.foto_perfil ||
        dadosAtualizados.FOTO_PERFIL ||
        fotoPerfil;

      setFotoPerfil(novaFoto);

      atualizarLocalStorageGlobal({
        ...dadosAtualizados,
        foto_perfil: novaFoto,
      });

      setFicheiroFoto(null);
      setPreviewFoto(null);

      setMensagem(
        "Foto de perfil atualizada com sucesso."
      );
    } catch (err) {
      console.error(
        "Erro ao enviar foto:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Erro ao fazer upload da foto."
      );
    } finally {
      setIsUploadingFoto(false);
    }
  }

  async function handleGuardarPerfil(event) {
    event.preventDefault();

    const id = getUserId();

    setErro("");
    setMensagem("");

    if (!id) {
      setErro(
        "Sessão inválida. Inicia sessão novamente."
      );

      localStorage.clear();

      navigate("/login", {
        replace: true,
      });

      return;
    }

    if (!nome.trim()) {
      setErro(
        "O nome completo é obrigatório."
      );

      return;
    }

    try {
      setIsSaving(true);

      const response =
        await api.put(
          `/utilizadores/${id}/perfil`,
          {
            nome_completo:
              nome.trim(),
            contacto:
              String(contacto || "").trim(),
          }
        );

      const utilizadorAtualizado =
        response.data?.utilizador ||
        response.data ||
        {};

      atualizarLocalStorageGlobal(
        utilizadorAtualizado
      );

      setMensagem(
        "Dados pessoais atualizados com sucesso."
      );
    } catch (err) {
      console.error(
        "Erro ao guardar perfil:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Não foi possível guardar as alterações."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleNotificacoes(
    valorNovo
  ) {
    const valorAnterior =
      receberNotificacoes;

    setReceberNotificacoes(
      valorNovo
    );

    setErro("");
    setMensagem("");

    try {
      const response =
        await api.put(
          "/utilizadores/definicoes/notificacoes",
          {
            receber: valorNovo,
          }
        );

      const dadosAtualizados =
        response.data?.dados ||
        response.data?.utilizador ||
        {};

      atualizarLocalStorageGlobal({
        ...dadosAtualizados,
        receber_notificacoes:
          valorNovo,
      });

      setMensagem(
        "Preferência de notificações atualizada."
      );
    } catch (err) {
      console.error(
        "Erro ao atualizar notificações:",
        err
      );

      setReceberNotificacoes(
        valorAnterior
      );

      setErro(
        err.response?.data?.error ||
          "Não foi possível atualizar a preferência."
      );
    }
  }

  async function handleAlterarPassword() {
    const id = getUserId();

    setErro("");
    setMensagem("");

    if (
      !id ||
      !passwordAtual ||
      !novaPassword
    ) {
      setErro(
        "Preenche a password atual e a nova password."
      );

      return;
    }

    if (
      novaPassword !== confirmarPassword
    ) {
      setErro(
        "As passwords não coincidem."
      );

      return;
    }

    try {
      setIsChangingPassword(true);

      await api.put(
        `/utilizadores/${id}/password`,
        {
          password_atual:
            passwordAtual,
          nova_password:
            novaPassword,
        }
      );

      setPasswordAtual("");
      setNovaPassword("");
      setConfirmarPassword("");

      setMensagem(
        "Password alterada com sucesso."
      );
    } catch (err) {
      console.error(
        "Erro ao alterar password:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Erro ao alterar password."
      );
    } finally {
      setIsChangingPassword(false);
    }
  }

  function handleTerminarSessao() {
    localStorage.clear();

    navigate("/login", {
      replace: true,
    });
  }

  /*async function confirmarDesativarConta() {
    const id = getUserId();

    if (!id) {
      return;
    }

    try {
      setIsDeleting(true);

      await api.put(
        `/utilizadores/${id}/desativar`
      );

      localStorage.clear();

      navigate("/login", {
        replace: true,
      });
    } catch (err) {
      console.error(
        "Erro ao desativar conta:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Erro ao desativar conta."
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  }*/

  if (isLoading) {
    return (
      <div style={pagina}>
        <Header />

        <div style={corpo}>
          <AdminLeftSidebar />

          <main style={mainStyle}>
            <div style={loadingBox}>
              A carregar definições...
            </div>
          </main>

          <AdminRightSidebar />
        </div>
      </div>
    );
  }

  return (
    <div style={pagina}>
      <Header />

      <div style={corpo}>
        <AdminLeftSidebar />

        <main style={mainStyle}>
          <button
            type="button"
            onClick={lidarComVoltar}
            style={voltarButton}
          >
            <BiArrowBack size={18} />
            {textoVoltar}
          </button>

          <div style={separador} />

          <div style={cabecalhoPagina}>
            <div style={tituloPagina}>
              Definições do Administrador
            </div>

            <div style={subtituloPagina}>
              Gere os teus dados pessoais, segurança e preferências da conta
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

          <div style={columnsLayout}>
            <div style={leftCol}>
              <SectionCard titulo="Foto de Perfil">
                <div style={fotoRow}>
                  <div style={avatarContainer}>
                    {previewFoto ||
                    fotoPerfil ? (
                      <img
                        src={
                          previewFoto ||
                          buildUploadUrl(
                            fotoPerfil
                          )
                        }
                        alt="Perfil"
                        style={avatarImg}
                      />
                    ) : (
                      <div
                        style={
                          avatarPlaceholder
                        }
                      >
                        {nome
                          ? nome
                              .charAt(0)
                              .toUpperCase()
                          : "A"}
                      </div>
                    )}

                    <label style={cameraOverlay}>
                      <HiOutlineCamera
                        size={20}
                        color="white"
                      />

                      <input
                        type="file"
                        accept="image/*"
                        onChange={
                          handleFotoChange
                        }
                        style={{
                          display: "none",
                        }}
                      />
                    </label>
                  </div>

                  <div>
                    <div style={fotoTitle}>
                      Alterar imagem de perfil
                    </div>

                    <div style={fotoDesc}>
                      Formatos aceites: JPG, PNG.
                    </div>

                    {ficheiroFoto && (
                      <button
                        type="button"
                        onClick={
                          handleUploadFoto
                        }
                        disabled={
                          isUploadingFoto
                        }
                        style={saveFotoBtn}
                      >
                        {isUploadingFoto
                          ? "A enviar..."
                          : "Confirmar Foto"}
                      </button>
                    )}
                  </div>
                </div>
              </SectionCard>

              <SectionCard titulo="Dados Pessoais">
                <form
                  onSubmit={
                    handleGuardarPerfil
                  }
                >
                  <FieldGroup
                    label="Nome completo"
                    icon={
                      <HiOutlineUser
                        size={17}
                      />
                    }
                    value={nome}
                    onChange={(e) =>
                      setNome(
                        e.target.value
                      )
                    }
                  />

                  <FieldGroup
                    label="Contacto"
                    icon={
                      <HiOutlinePhone
                        size={17}
                      />
                    }
                    type="tel"
                    value={contacto}
                    onChange={(e) =>
                      setContacto(
                        e.target.value
                      )
                    }
                  />

                  <div style={duasColunas}>
                    <ReadOnlyField
                      label="E-mail pessoal"
                      value={
                        email ||
                        "Sem e-mail"
                      }
                      icon={
                        <BiEnvelope
                          size={16}
                        />
                      }
                    />

                    <ReadOnlyField
                      label="E-mail Softinsa"
                      value={
                        emailSoftinsa ||
                        "Não definido"
                      }
                      icon={
                        <BiEnvelope
                          size={16}
                        />
                      }
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      ...primaryBtn,
                      opacity: isSaving
                        ? 0.7
                        : 1,
                    }}
                    disabled={isSaving}
                  >
                    {isSaving
                      ? "A guardar..."
                      : "Guardar alterações"}
                  </button>
                </form>
              </SectionCard>

              <SectionCard titulo="Segurança">
                <FieldGroup
                  label="Password atual"
                  icon={
                    <HiOutlineLockClosed
                      size={17}
                    />
                  }
                  type="password"
                  value={passwordAtual}
                  onChange={(e) =>
                    setPasswordAtual(
                      e.target.value
                    )
                  }
                />

                <FieldGroup
                  label="Nova password"
                  icon={
                    <HiOutlineLockClosed
                      size={17}
                    />
                  }
                  type="password"
                  value={novaPassword}
                  onChange={(e) =>
                    setNovaPassword(
                      e.target.value
                    )
                  }
                />

                <FieldGroup
                  label="Confirmar nova password"
                  icon={
                    <HiOutlineLockClosed
                      size={17}
                    />
                  }
                  type="password"
                  value={
                    confirmarPassword
                  }
                  onChange={(e) =>
                    setConfirmarPassword(
                      e.target.value
                    )
                  }
                />

                <button
                  type="button"
                  style={{
                    ...primaryBtn,
                    opacity:
                      isChangingPassword
                        ? 0.7
                        : 1,
                  }}
                  onClick={
                    handleAlterarPassword
                  }
                  disabled={
                    isChangingPassword
                  }
                >
                  {isChangingPassword
                    ? "A alterar..."
                    : "Alterar password"}
                </button>
              </SectionCard>
            </div>

            <div style={rightCol}>
              <SectionCard titulo="Estado da Conta">
                <ReadOnlyField
                  label="Estado da conta"
                  value={
                    estadoConta ||
                    "Não definido"
                  }
                  icon={
                    <BiShield size={16} />
                  }
                />

                <ReadOnlyField
                  label="E-mail verificado"
                  value={
                    emailVerificado
                      ? "Sim"
                      : "Não"
                  }
                  icon={
                    <BiEnvelope
                      size={16}
                    />
                  }
                />

                <ReadOnlyField
                  label="Termos aceites"
                  value={
                    aceitouTermos
                      ? "Sim"
                      : "Não"
                  }
                  icon={
                    <HiOutlineDocumentText
                      size={16}
                    />
                  }
                />
              </SectionCard>

              <SectionCard titulo="Dados Administrativos">
                <ReadOnlyField
                  label="Entidades geridas"
                  value={
                    entidadesGeridas ||
                    "Não definido"
                  }
                  icon={
                    <BiIdCard size={16} />
                  }
                />

                <ReadOnlyField
                  label="Intervenções"
                  value={intervencoes}
                  icon={
                    <BiShield size={16} />
                  }
                />
              </SectionCard>

              <SectionCard titulo="Preferências de Notificações">
                <div style={preferenceRow}>
                  <div style={{ flex: 1 }}>
                    <div style={preferenceTitle}>
                      Receber notificações
                    </div>

                    <div style={preferenceDesc}>
                      Permitir alertas dentro da plataforma.
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={
                      receberNotificacoes
                    }
                    onChange={(e) =>
                      handleToggleNotificacoes(
                        e.target.checked
                      )
                    }
                    style={toggleStyle}
                  />
                </div>
              </SectionCard>

              <SectionCard titulo="Conta">
                <OptionRow
                  icon={
                    <HiOutlineDocumentText
                      size={18}
                    />
                  }
                  titulo="Termos e Serviços"
                  subtitulo="Rever condições de utilização"
                  onTap={() =>
                    setShowTermos(true)
                  }
                  color="#2563eb"
                />

                <OptionRow
                  icon={
                    <HiOutlineLogout
                      size={18}
                    />
                  }
                  titulo="Terminar sessão"
                  subtitulo="Voltar à página de login"
                  onTap={handleTerminarSessao}
                  color="#f59e0b"
                />

                {/*<OptionRow
                  icon={
                    <HiOutlineTrash
                      size={18}
                    />
                  }
                  titulo="Desativar conta"
                  subtitulo="A conta ficará inativa"
                  onTap={() =>
                    setShowDeleteModal(
                      true
                    )
                  }
                  color="#ef4444"
                  noBorder
                />*/}
              </SectionCard>
            </div>
          </div>

          {showTermos && (
            <ModalBase
              onClose={() =>
                setShowTermos(false)
              }
            >
              <div style={modalTitle}>
                Termos e Serviços
              </div>

              <div style={modalBody}>
                Ao utilizar a plataforma como Administrador, assumes a responsabilidade pela gestão de contas, badges, áreas, service lines, learning paths, políticas e configurações globais da Softinsa Academy.
              </div>

              <div style={modalActions}>
                <button
                  type="button"
                  style={secondaryBtn}
                  onClick={() =>
                    setShowTermos(false)
                  }
                >
                  Fechar
                </button>
              </div>
            </ModalBase>
          )}

          {/*{showDeleteModal && (
            <ModalBase
              onClose={() =>
                setShowDeleteModal(
                  false
                )
              }
            >
              <div style={modalTitle}>
                Desativar conta
              </div>

              <div style={modalBody}>
                Tens a certeza que queres desativar a tua conta de Administrador?
              </div>

              <div style={modalActions}>
                <button
                  type="button"
                  style={secondaryBtn}
                  onClick={() =>
                    setShowDeleteModal(
                      false
                    )
                  }
                  disabled={isDeleting}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  style={{
                    ...dangerBtn,
                    opacity: isDeleting
                      ? 0.7
                      : 1,
                  }}
                  onClick={
                    confirmarDesativarConta
                  }
                  disabled={isDeleting}
                >
                  {isDeleting
                    ? "A desativar..."
                    : "Sim, desativar"}
                </button>
              </div>
            </ModalBase>
          )}*/}
        </main>

        <AdminRightSidebar />
      </div>
    </div>
  );
}

function SectionCard({
  titulo,
  children,
}) {
  return (
    <div style={sectionCard}>
      <div style={sectionTitle}>
        {titulo}
      </div>

      <div style={{ marginTop: 16 }}>
        {children}
      </div>
    </div>
  );
}

function FieldGroup({
  label,
  icon,
  type = "text",
  value,
  onChange,
  placeholder,
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={fieldLabel}>
        {label}
      </label>

      <div style={inputWrap}>
        <span style={inputIcon}>
          {icon}
        </span>

        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={
            placeholder || label
          }
          style={inputStyle}
        />
      </div>
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  icon,
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={fieldLabel}>
        {label}
      </label>

      <div style={disabledInputWrap}>
        <span style={inputIcon}>
          {icon}
        </span>

        <span>{value}</span>
      </div>
    </div>
  );
}

function OptionRow({
  icon,
  titulo,
  subtitulo,
  onTap,
  color = "#2563eb",
  noBorder,
}) {
  const [hovered, setHovered] =
    useState(false);

  return (
    <>
      <div
        style={{
          ...optionRow,
          background: hovered
            ? "#f8fafc"
            : "transparent",
          cursor: "pointer",
        }}
        onClick={onTap}
        onMouseEnter={() =>
          setHovered(true)
        }
        onMouseLeave={() =>
          setHovered(false)
        }
      >
        <div
          style={{
            ...optionIconCircle,
            background: `${color}18`,
          }}
        >
          <span
            style={{
              color,
              display: "flex",
            }}
          >
            {icon}
          </span>
        </div>

        <div
          style={{
            flex: 1,
            marginLeft: 12,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color,
            }}
          >
            {titulo}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#9ca3af",
              marginTop: 2,
            }}
          >
            {subtitulo}
          </div>
        </div>

        <BiChevronRight
          size={20}
          color="#d1d5db"
        />
      </div>

      {!noBorder && (
        <hr style={optionDivider} />
      )}
    </>
  );
}

function ModalBase({
  children,
  onClose,
}) {
  return (
    <div
      style={modalOverlay}
      onClick={onClose}
    >
      <div
        style={modalBox}
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        {children}
      </div>
    </div>
  );
}

const pagina = {
  backgroundColor: "#f3f4f6",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
};

const corpo = {
  display: "flex",
  flex: 1,
  overflow: "hidden",
};

const mainStyle = {
  flex: 1,
  minWidth: 0,
  overflowY: "auto",
  padding: "22px 30px 60px",
  backgroundColor: "#f3f4f6",
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
  marginBottom: 24,
};

const tituloPagina = {
  fontSize: 22,
  fontWeight: 800,
  color: "#111827",
};

const subtituloPagina = {
  fontSize: 12,
  color: "#64748b",
  marginTop: 4,
};

const columnsLayout = {
  display: "flex",
  gap: 24,
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const leftCol = {
  flex: "1 1 440px",
  minWidth: 320,
};

const rightCol = {
  flex: "0 1 370px",
  minWidth: 300,
};

const sectionCard = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "20px 22px",
  marginBottom: 20,
};

const sectionTitle = {
  fontSize: 15,
  fontWeight: 700,
  color: "#111827",
  borderBottom: "1px solid #f0f0f0",
  paddingBottom: 10,
};

const fieldLabel = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 6,
};

const inputWrap = {
  display: "flex",
  alignItems: "center",
  background: "#f8fafc",
  border: "1.5px solid #e5e7eb",
  borderRadius: 10,
  padding: "0 12px",
  height: 44,
};

const disabledInputWrap = {
  display: "flex",
  alignItems: "center",
  background: "#eef2f6",
  border: "1.5px solid #e2e8f0",
  borderRadius: 10,
  padding: "0 12px",
  minHeight: 44,
  color: "#64748b",
  fontSize: 13,
  fontWeight: 500,
};

const inputIcon = {
  color: "#9ca3af",
  display: "flex",
  alignItems: "center",
  marginRight: 10,
  flexShrink: 0,
};

const inputStyle = {
  flex: 1,
  border: "none",
  background: "transparent",
  fontSize: 14,
  color: "#111827",
  outline: "none",
};

const duasColunas = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const primaryBtn = {
  width: "100%",
  padding: "10px 0",
  borderRadius: 10,
  border: "none",
  background: "#2563eb",
  color: "white",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  marginTop: 4,
};

const fotoRow = {
  display: "flex",
  alignItems: "center",
  gap: 20,
  marginBottom: 12,
};

const avatarContainer = {
  position: "relative",
  width: 82,
  height: 82,
  borderRadius: "50%",
  overflow: "hidden",
  border: "2px solid #e5e7eb",
  background: "#f3f4f6",
  flexShrink: 0,
};

const avatarImg = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const avatarPlaceholder = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 26,
  fontWeight: 800,
  color: "#9ca3af",
};

const cameraOverlay = {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  height: "30%",
  background: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const fotoTitle = {
  fontSize: 14,
  fontWeight: 700,
  color: "#374151",
};

const fotoDesc = {
  fontSize: 12,
  color: "#6b7280",
  marginTop: 2,
};

const saveFotoBtn = {
  marginTop: 8,
  padding: "6px 12px",
  background: "#10b981",
  color: "white",
  border: "none",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const preferenceRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const preferenceTitle = {
  fontSize: 13,
  fontWeight: 700,
  color: "#374151",
};

const preferenceDesc = {
  fontSize: 11,
  color: "#6b7280",
  marginTop: 2,
  lineHeight: 1.3,
};

const toggleStyle = {
  width: 42,
  height: 22,
  accentColor: "#2563eb",
  cursor: "pointer",
};

const optionRow = {
  display: "flex",
  alignItems: "center",
  padding: "10px 6px",
  transition: "background 0.12s",
  borderRadius: 8,
};

const optionIconCircle = {
  width: 38,
  height: 38,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const optionDivider = {
  border: "none",
  borderTop: "1px solid #f0f0f0",
  margin: "2px 0",
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalBox = {
  background: "white",
  borderRadius: 14,
  padding: "28px 32px",
  maxWidth: 460,
  width: "90%",
  boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
};

const modalTitle = {
  fontSize: 17,
  fontWeight: 700,
  color: "#111827",
  marginBottom: 14,
};

const modalBody = {
  fontSize: 14,
  color: "#374151",
  lineHeight: 1.65,
  marginBottom: 22,
};

const modalActions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};

const secondaryBtn = {
  padding: "8px 20px",
  borderRadius: 8,
  border: "1.5px solid #d1d5db",
  background: "white",
  color: "#374151",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
};

const dangerBtn = {
  padding: "8px 20px",
  borderRadius: 8,
  border: "none",
  background: "#ef4444",
  color: "white",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const erroBox = {
  background: "#fee2e2",
  color: "#991b1b",
  border: "1px solid #fecaca",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 13,
  marginBottom: 16,
};

const sucessoBox = {
  background: "#dcfce7",
  color: "#166534",
  border: "1px solid #bbf7d0",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 13,
  marginBottom: 16,
};

const loadingBox = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 24,
  fontSize: 14,
  color: "#64748b",
};

export default DefinicoesAdminPage;