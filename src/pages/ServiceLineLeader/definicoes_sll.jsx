import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  HiOutlineArrowLeft,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineLockClosed,
  HiOutlineDocumentText,
  HiOutlineLogout,
  HiOutlineTrash,
} from "react-icons/hi";

import {
  BiChevronRight,
} from "react-icons/bi";

import Header from "../../components/Header.jsx";
import SllLeftSidebar from "../../components/sll_left_sidebar.jsx";
import SllRightSidebar from "../../components/sll_right_sidebar.jsx";

import api from "../../services/api.js";

/* =========================================================
   PÁGINA
========================================================= */

function DefinicoesSllPage() {
  const navigate = useNavigate();

  const [user, setUser] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  /* Dados pessoais */

  const [nome, setNome] =
    useState("");

  const [contacto, setContacto] =
    useState("");

  const [isSaving, setIsSaving] =
    useState(false);

  /* Password */

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
    isChangingPassword,
    setIsChangingPassword,
  ] = useState(false);

  /* Modais */

  const [
    showTermos,
    setShowTermos,
  ] = useState(false);

  const [
    showDeleteModal,
    setShowDeleteModal,
  ] = useState(false);

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  /* Mensagens */

  const [erro, setErro] =
    useState("");

  const [mensagem, setMensagem] =
    useState("");

  /* =======================================================
     CARREGAR UTILIZADOR
  ======================================================= */

  useEffect(() => {
    carregarUtilizador();
  }, []);

  async function carregarUtilizador() {
    const storedUser =
      localStorage.getItem("user");

    if (!storedUser) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    let userData;

    try {
      userData =
        JSON.parse(storedUser);
    } catch (err) {
      console.error(
        "Erro ao ler utilizador guardado:",
        err
      );

      localStorage.clear();

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

    setNome(
      userData.nome_completo ||
        userData.nome ||
        ""
    );

    setContacto(
      userData.contacto || ""
    );

    try {
      setIsLoading(true);
      setErro("");

      const response = await api.get(
        `/utilizadores/${userId}`
      );

      const utilizador =
        response.data || {};

      const userAtualizado = {
        ...userData,
        ...utilizador,

        id_utilizador:
          utilizador.id_utilizador ||
          utilizador.ID_UTILIZADOR ||
          userData.id_utilizador ||
          userId,

        nome:
          utilizador.nome_completo ||
          utilizador.NOME_COMPLETO ||
          utilizador.nome ||
          userData.nome ||
          "",

        nome_completo:
          utilizador.nome_completo ||
          utilizador.NOME_COMPLETO ||
          userData.nome_completo ||
          userData.nome ||
          "",

        email:
          utilizador.email_softinsa ||
          utilizador.EMAIL_SOFTINSA ||
          utilizador.email ||
          utilizador.EMAIL ||
          userData.email ||
          "",

        contacto:
          utilizador.contacto ??
          utilizador.CONTACTO ??
          userData.contacto ??
          "",

        estado_conta:
          utilizador.estado_conta ||
          utilizador.ESTADO_CONTA ||
          userData.estado_conta ||
          "",

        tipo_utilizador:
          userData.tipo_utilizador ||
          "Service Line Leader",
      };

      localStorage.setItem(
        "user",
        JSON.stringify(
          userAtualizado
        )
      );

      setUser(userAtualizado);

      setNome(
        userAtualizado.nome_completo ||
          userAtualizado.nome ||
          ""
      );

      setContacto(
        userAtualizado.contacto ||
          ""
      );
    } catch (err) {
      console.error(
        "Erro ao carregar dados do SLL:",
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

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar os dados da conta."
      );
    } finally {
      setIsLoading(false);
    }
  }

  /* =======================================================
     ID DO UTILIZADOR
  ======================================================= */

  function getUserId() {
    return (
      user?.id_utilizador ||
      user?.ID_UTILIZADOR ||
      user?.id
    );
  }

  /* =======================================================
     ATUALIZAR LOCAL STORAGE
  ======================================================= */

  function atualizarLocalStorage(
    utilizadorAtualizado = {}
  ) {
    const userFinal = {
      ...user,

      id_utilizador:
        utilizadorAtualizado.id_utilizador ||
        utilizadorAtualizado.ID_UTILIZADOR ||
        user?.id_utilizador,

      email:
        utilizadorAtualizado.email_softinsa ||
        utilizadorAtualizado.EMAIL_SOFTINSA ||
        utilizadorAtualizado.email ||
        utilizadorAtualizado.EMAIL ||
        user?.email,

      nome:
        utilizadorAtualizado.nome_completo ||
        utilizadorAtualizado.NOME_COMPLETO ||
        utilizadorAtualizado.nome ||
        nome,

      nome_completo:
        utilizadorAtualizado.nome_completo ||
        utilizadorAtualizado.NOME_COMPLETO ||
        utilizadorAtualizado.nome ||
        nome,

      contacto:
        utilizadorAtualizado.contacto ??
        utilizadorAtualizado.CONTACTO ??
        contacto,

      estado_conta:
        utilizadorAtualizado.estado_conta ||
        utilizadorAtualizado.ESTADO_CONTA ||
        user?.estado_conta,

      tipo_utilizador:
        user?.tipo_utilizador ||
        "Service Line Leader",
    };

    localStorage.setItem(
      "user",
      JSON.stringify(userFinal)
    );

    setUser(userFinal);
  }

  /* =======================================================
     GUARDAR PERFIL
  ======================================================= */

  async function handleGuardarPerfil() {
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

      const response = await api.put(
        `/utilizadores/${id}/perfil`,
        {
          nome_completo:
            nome.trim(),

          contacto:
            contacto.trim(),
        }
      );

      const utilizadorAtualizado =
        response.data?.utilizador ||
        response.data ||
        {};

      atualizarLocalStorage(
        utilizadorAtualizado
      );

      setMensagem(
        "Dados pessoais atualizados com sucesso."
      );
    } catch (err) {
      console.error(
        "Erro ao atualizar perfil:",
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

      setErro(
        err.response?.data?.error ||
          "Não foi possível atualizar os dados."
      );
    } finally {
      setIsSaving(false);
    }
  }

  /* =======================================================
     ALTERAR PASSWORD
  ======================================================= */

  async function handleAlterarPassword() {
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

    if (
      !passwordAtual ||
      !novaPassword ||
      !confirmarPassword
    ) {
      setErro(
        "Preenche todos os campos da password."
      );

      return;
    }

    if (
      novaPassword !==
      confirmarPassword
    ) {
      setErro(
        "A nova password e a confirmação não coincidem."
      );

      return;
    }

    if (novaPassword.length < 6) {
      setErro(
        "A nova password deve ter pelo menos 6 caracteres."
      );

      return;
    }

    if (
      passwordAtual === novaPassword
    ) {
      setErro(
        "A nova password deve ser diferente da password atual."
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

      console.error(
        "STATUS:",
        err.response?.status
      );

      console.error(
        "BODY:",
        err.response?.data
      );

      setErro(
        err.response?.data?.error ||
          "Não foi possível alterar a password."
      );
    } finally {
      setIsChangingPassword(false);
    }
  }

  /* =======================================================
     TERMINAR SESSÃO
  ======================================================= */

  function handleTerminarSessao() {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    navigate("/login", {
      replace: true,
    });
  }

  /* =======================================================
     DESATIVAR CONTA
  ======================================================= */

  async function confirmarExcluirConta() {
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

    try {
      setIsDeleting(true);

      await api.put(
        `/utilizadores/${id}/desativar`
      );

      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );

      navigate("/login", {
        replace: true,
        state: {
          mensagem:
            "Conta desativada com sucesso.",
        },
      });
    } catch (err) {
      console.error(
        "Erro ao desativar conta:",
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

      setErro(
        err.response?.data?.error ||
          "Não foi possível desativar a conta."
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (isLoading && !user) {
    return (
      <div style={pagina}>
        <Header />

        <div style={corpo}>
          <SllLeftSidebar />

          <main style={mainStyle}>
            <div style={loadingBox}>
              A carregar definições...
            </div>
          </main>

          <SllRightSidebar />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  /* =======================================================
     JSX
  ======================================================= */

  return (
    <div style={pagina}>
      <Header />

      <div style={corpo}>
        <SllLeftSidebar />

        <main style={mainStyle}>
          <button
            type="button"
            style={backBtn}
            onClick={() =>
              navigate("/sll")
            }
          >
            <HiOutlineArrowLeft
              style={{
                marginRight: 6,
              }}
            />

            Voltar ao dashboard
          </button>

          <div style={separador} />

          <div style={cabecalhoPagina}>
            <div style={tituloPagina}>
              Definições do Service Line
              Leader
            </div>

            <div style={subtituloPagina}>
              Gere os teus dados pessoais,
              segurança e preferências da
              conta
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
            {/* COLUNA ESQUERDA */}

            <div style={leftCol}>
              <SectionCard titulo="Dados Pessoais">
                <FieldGroup
                  label="Nome completo"
                  icon={
                    <HiOutlineUser
                      size={17}
                    />
                  }
                  value={nome}
                  onChange={(event) => {
                    setNome(
                      event.target.value
                    );

                    setErro("");
                    setMensagem("");
                  }}
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
                  onChange={(event) => {
                    setContacto(
                      event.target.value
                    );

                    setErro("");
                    setMensagem("");
                  }}
                />

                <button
                  type="button"
                  style={{
                    ...primaryBtn,

                    opacity:
                      isSaving
                        ? 0.7
                        : 1,

                    cursor:
                      isSaving
                        ? "not-allowed"
                        : "pointer",
                  }}
                  onClick={
                    handleGuardarPerfil
                  }
                  disabled={isSaving}
                >
                  {isSaving
                    ? "A guardar..."
                    : "Guardar alterações"}
                </button>
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
                  onChange={(event) => {
                    setPasswordAtual(
                      event.target.value
                    );

                    setErro("");
                    setMensagem("");
                  }}
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
                  onChange={(event) => {
                    setNovaPassword(
                      event.target.value
                    );

                    setErro("");
                    setMensagem("");
                  }}
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
                  onChange={(event) => {
                    setConfirmarPassword(
                      event.target.value
                    );

                    setErro("");
                    setMensagem("");
                  }}
                />

                <button
                  type="button"
                  style={{
                    ...primaryBtn,

                    opacity:
                      isChangingPassword
                        ? 0.7
                        : 1,

                    cursor:
                      isChangingPassword
                        ? "not-allowed"
                        : "pointer",
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

            {/* COLUNA DIREITA */}

            <div style={rightCol}>
              <SectionCard titulo="Informação da Conta">
                <AccountInfo
                  label="Nome"
                  value={
                    user.nome_completo ||
                    user.nome ||
                    "Não disponível"
                  }
                />

                <AccountInfo
                  label="Email"
                  value={
                    user.email ||
                    user.email_softinsa ||
                    "Não disponível"
                  }
                />

                <AccountInfo
                  label="Tipo de conta"
                  value="Service Line Leader"
                />

                <AccountInfo
                  label="Estado"
                  value={
                    user.estado_conta ||
                    "ATIVO"
                  }
                />
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
                  color="#4470AF"
                />

                <OptionRow
                  icon={
                    <HiOutlineLogout
                      size={18}
                    />
                  }
                  titulo="Terminar sessão"
                  subtitulo="Voltar à página de login"
                  onTap={
                    handleTerminarSessao
                  }
                  color="#f59e0b"
                />

                <OptionRow
                  icon={
                    <HiOutlineTrash
                      size={18}
                    />
                  }
                  titulo="Excluir conta"
                  subtitulo="A conta ficará INATIVA"
                  onTap={() =>
                    setShowDeleteModal(
                      true
                    )
                  }
                  color="#ef4444"
                  noBorder
                />
              </SectionCard>
            </div>
          </div>

          {/* MODAL TERMOS */}

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
                Ao utilizar esta aplicação,
                aceita os termos de utilização
                da plataforma Softinsa Badges.
                Os dados são utilizados para a
                gestão de candidaturas,
                validação de badges,
                certificados, relatórios e
                progresso profissional.
                <br />
                <br />
                Enquanto Service Line Leader,
                pode consultar e gerir
                informações relacionadas com
                os consultores pertencentes à
                sua Service Line.
                <br />
                <br />
                A conta pode ser desativada
                pelo utilizador e reativada
                apenas por um administrador.
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

          {/* MODAL DESATIVAR CONTA */}

          {showDeleteModal && (
            <ModalBase
              onClose={() => {
                if (!isDeleting) {
                  setShowDeleteModal(
                    false
                  );
                }
              }}
            >
              <div style={modalTitle}>
                Excluir conta
              </div>

              <div style={modalBody}>
                Tem a certeza de que
                pretende excluir a sua conta
                de Service Line Leader?
                <br />
                <br />
                A conta ficará{" "}
                <strong>INATIVA</strong> e
                apenas um administrador poderá
                reativá-la.
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

                    opacity:
                      isDeleting
                        ? 0.7
                        : 1,

                    cursor:
                      isDeleting
                        ? "not-allowed"
                        : "pointer",
                  }}
                  onClick={
                    confirmarExcluirConta
                  }
                  disabled={isDeleting}
                >
                  {isDeleting
                    ? "A excluir..."
                    : "Sim, excluir"}
                </button>
              </div>
            </ModalBase>
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

function SectionCard({
  titulo,
  children,
}) {
  return (
    <section style={sectionCard}>
      <div style={sectionTitle}>
        {titulo}
      </div>

      <div style={sectionContent}>
        {children}
      </div>
    </section>
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
    <div style={fieldGroup}>
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
          autoComplete={
            type === "password"
              ? "new-password"
              : "off"
          }
        />
      </div>
    </div>
  );
}

function AccountInfo({
  label,
  value,
}) {
  return (
    <div style={accountInfo}>
      <div style={accountLabel}>
        {label}
      </div>

      <div style={accountValue}>
        {value}
      </div>
    </div>
  );
}

function OptionRow({
  icon,
  titulo,
  subtitulo,
  onTap,
  color = "#4470AF",
  noBorder = false,
}) {
  const [hovered, setHovered] =
    useState(false);

  return (
    <>
      <button
        type="button"
        style={{
          ...optionRow,

          background:
            hovered
              ? "#f7f8fb"
              : "transparent",
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
              alignItems: "center",
            }}
          >
            {icon}
          </span>
        </div>

        <div style={optionText}>
          <div
            style={{
              ...optionTitle,
              color,
            }}
          >
            {titulo}
          </div>

          <div style={optionSubtitle}>
            {subtitulo}
          </div>
        </div>

        <BiChevronRight
          size={20}
          color="#d1d5db"
        />
      </button>

      {!noBorder && (
        <div style={optionDivider} />
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
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   ESTILOS
========================================================= */

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

const loadingBox = {
  minHeight: 300,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#64748b",
  fontSize: 14,
};

const backBtn = {
  display: "flex",
  alignItems: "center",
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#2563eb",
  fontSize: 14,
  padding: 0,
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
  borderBottom:
    "1px solid #f0f0f0",
  paddingBottom: 10,
};

const sectionContent = {
  marginTop: 16,
};

const fieldGroup = {
  marginBottom: 14,
};

const fieldLabel = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 6,
  letterSpacing: "0.02em",
};

const inputWrap = {
  display: "flex",
  alignItems: "center",
  background: "#f8fafc",
  border:
    "1.5px solid #e5e7eb",
  borderRadius: 10,
  padding: "0 12px",
  height: 44,
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
  minWidth: 0,
  border: "none",
  background: "transparent",
  fontSize: 14,
  color: "#111827",
  outline: "none",
};

const primaryBtn = {
  width: "100%",
  minHeight: 43,
  borderRadius: 10,
  border: "none",
  background: "#2563eb",
  color: "white",
  fontSize: 14,
  fontWeight: 600,
  marginTop: 4,
};

const accountInfo = {
  padding: "10px 0",
  borderBottom:
    "1px solid #f1f5f9",
};

const accountLabel = {
  fontSize: 10,
  color: "#94a3b8",
};

const accountValue = {
  marginTop: 3,
  fontSize: 13,
  color: "#334155",
  fontWeight: 600,
  overflowWrap: "anywhere",
};

const optionRow = {
  width: "100%",
  border: "none",
  display: "flex",
  alignItems: "center",
  padding: "10px 6px",
  transition:
    "background 0.12s",
  cursor: "pointer",
  borderRadius: 8,
  textAlign: "left",
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

const optionText = {
  flex: 1,
  marginLeft: 12,
};

const optionTitle = {
  fontSize: 14,
  fontWeight: 600,
};

const optionSubtitle = {
  fontSize: 12,
  color: "#9ca3af",
  marginTop: 2,
};

const optionDivider = {
  height: 1,
  background: "#f0f0f0",
  margin: "2px 0",
};

const erroBox = {
  background: "#fee2e2",
  border: "1px solid #fecaca",
  borderRadius: 10,
  padding: 12,
  color: "#991b1b",
  fontSize: 13,
  marginBottom: 18,
};

const sucessoBox = {
  background: "#dcfce7",
  border: "1px solid #bbf7d0",
  borderRadius: 10,
  padding: 12,
  color: "#166534",
  fontSize: 13,
  marginBottom: 18,
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background:
    "rgba(15, 23, 42, 0.42)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  zIndex: 1000,
};

const modalBox = {
  background: "white",
  borderRadius: 14,
  padding: "28px 32px",
  maxWidth: 470,
  width: "100%",
  boxShadow:
    "0 18px 45px rgba(15, 23, 42, 0.22)",
};

const modalTitle = {
  fontSize: 18,
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
  minHeight: 39,
  padding: "8px 20px",
  borderRadius: 8,
  border:
    "1.5px solid #d1d5db",
  background: "white",
  color: "#374151",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
};

const dangerBtn = {
  minHeight: 39,
  padding: "8px 20px",
  borderRadius: 8,
  border: "none",
  background: "#ef4444",
  color: "white",
  fontSize: 14,
  fontWeight: 600,
};

export default DefinicoesSllPage;