import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineArrowLeft } from "react-icons/hi";
import {
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineLockClosed,
  HiOutlineDocumentText,
  HiOutlineLogout,
  HiOutlineTrash,
  HiOutlinePhotograph,
} from "react-icons/hi";
import { BiChevronRight } from "react-icons/bi";

import Header from "../../components/Header.jsx";
import LeftSidebar from "../../components/LeftSidebar.jsx";
import RightSidebar from "../../components/RightSidebar.jsx";
import api, { buildUploadUrl } from "../../services/api.js";

function DefinicoesConsultorPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);

  const [nome, setNome] = useState("");
  const [contacto, setContacto] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [isSavingFoto, setIsSavingFoto] = useState(false);

  const [passwordAtual, setPasswordAtual] = useState("");
  const [novaPassword, setNovaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [showTermos, setShowTermos] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      navigate("/login", { replace: true });
      return;
    }

    const userData = JSON.parse(storedUser);
    const userId = userData.id_utilizador || userData.ID_UTILIZADOR;

    setUser(userData);
    setNome(userData.nome_completo || userData.nome || "");
    setContacto("");
    if (userData.foto_perfil) {
      setFotoPreview(buildUploadUrl(userData.foto_perfil));
    }

    api.get(`/utilizadores/${userId}`)
      .then((res) => {
        const utilizador = res.data;

        const userAtualizado = {
          ...userData,
          ...utilizador,
          nome:
            utilizador.nome_completo ||
            utilizador.nome ||
            userData.nome,
          nome_completo:
            utilizador.nome_completo ||
            userData.nome_completo,
          contacto:
            utilizador.contacto || "",
            foto_perfil:
              utilizador.foto_perfil ||
              utilizador.FOTO_PERFIL ||
              userData.foto_perfil ||
              null,
        };
        

        localStorage.setItem("user", JSON.stringify(userAtualizado));

        setUser(userAtualizado);
        setNome(userAtualizado.nome_completo || userAtualizado.nome || "");
        setContacto(userAtualizado.contacto || "");
        setFotoPreview(
          userAtualizado.foto_perfil
            ? buildUploadUrl(userAtualizado.foto_perfil)
            : null
        );

      })
      .catch((err) => {
        console.error("Erro ao carregar utilizador:", err);
      });
  }, [navigate]);

  const getUserId = () => {
    return user?.id_utilizador || user?.ID_UTILIZADOR;
  };

  const atualizarLocalStorage = (utilizadorAtualizado) => {
    const userAtualizado = {
      ...user,
      id_utilizador:
        utilizadorAtualizado.id_utilizador ||
        utilizadorAtualizado.ID_UTILIZADOR ||
        user.id_utilizador,
      email:
        utilizadorAtualizado.email ||
        utilizadorAtualizado.EMAIL ||
        user.email,
      nome:
        utilizadorAtualizado.nome_completo ||
        utilizadorAtualizado.NOME_COMPLETO ||
        utilizadorAtualizado.nome ||
        user.nome,
      nome_completo:
        utilizadorAtualizado.nome_completo ||
        utilizadorAtualizado.NOME_COMPLETO ||
        user.nome_completo,
      contacto:
        utilizadorAtualizado.contacto ??
        utilizadorAtualizado.CONTACTO ??
        contacto,
      estado_conta:
        utilizadorAtualizado.estado_conta ||
        utilizadorAtualizado.ESTADO_CONTA ||
        user.estado_conta,
      foto_perfil:
        utilizadorAtualizado.foto_perfil ||
        utilizadorAtualizado.FOTO_PERFIL ||
        user.foto_perfil ||
        null,
    };

    localStorage.setItem("user", JSON.stringify(userAtualizado));
    setUser(userAtualizado);
  };

  function handleEscolherFoto(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    const tiposPermitidos = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];

    if (!tiposPermitidos.includes(file.type)) {
      alert("A imagem deve ser PNG, JPG, JPEG ou WEBP.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("A imagem não pode ter mais de 2MB.");
      return;
    }

    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  }

  async function handleGuardarFoto() {
    const id = getUserId();

    if (!id) {
      alert("Sessão inválida. Faça login novamente.");
      navigate("/login", { replace: true });
      return;
    }

    if (!fotoFile) {
      alert("Escolhe uma imagem primeiro.");
      return;
    }

    try {
      setIsSavingFoto(true);

      const formData = new FormData();
      formData.append("foto", fotoFile);

      const response = await api.put(
        `/utilizadores/${id}/foto`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const dadosFoto =
        response.data?.dados ||
        response.data?.utilizador ||
        response.data;

      const fotoPerfilAtualizada =
        dadosFoto.foto_perfil ||
        dadosFoto.FOTO_PERFIL ||
        dadosFoto.foto ||
        null;

      const userAtualizado = {
        ...user,
        foto_perfil: fotoPerfilAtualizada,
      };

      localStorage.setItem("user", JSON.stringify(userAtualizado));
      setUser(userAtualizado);
      setFotoFile(null);

      setFotoPreview(
        fotoPerfilAtualizada
          ? buildUploadUrl(fotoPerfilAtualizada)
          : fotoPreview
      );

      alert("Foto de perfil atualizada com sucesso.");
    } catch (err) {
      console.error("Erro ao atualizar foto:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      alert(
        err.response?.data?.error ||
          "Erro ao atualizar foto de perfil."
      );
    } finally {
      setIsSavingFoto(false);
    }
  }

  const handleGuardarPerfil = async () => {
    const id = getUserId();

    if (!id) {
      alert("Sessão inválida. Faça login novamente.");
      navigate("/login", { replace: true });
      return;
    }

    if (!nome.trim()) {
      alert("O nome é obrigatório.");
      return;
    }

    try {
      setIsSaving(true);

      const response = await api.put(`/utilizadores/${id}/perfil`, {
        nome_completo: nome.trim(),
        contacto: contacto.trim(),
      });

      const utilizadorAtualizado =
        response.data?.utilizador || response.data;

      atualizarLocalStorage(utilizadorAtualizado);

      alert("Dados atualizados com sucesso.");
    } catch (err) {
      console.error("Erro ao atualizar perfil:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      alert(
        err.response?.data?.error ||
          "Erro ao atualizar dados."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAlterarPassword = async () => {
    const id = getUserId();

    if (!id) {
      alert("Sessão inválida. Faça login novamente.");
      navigate("/login", { replace: true });
      return;
    }

    if (!passwordAtual || !novaPassword || !confirmarPassword) {
      alert("Preencha todos os campos da password.");
      return;
    }

    if (novaPassword !== confirmarPassword) {
      alert("As passwords não coincidem.");
      return;
    }

    if (novaPassword.length < 6) {
      alert("A nova password deve ter pelo menos 6 caracteres.");
      return;
    }

    try {
      setIsChangingPassword(true);

      await api.put(`/utilizadores/${id}/password`, {
        password_atual: passwordAtual,
        nova_password: novaPassword,
      });

      setPasswordAtual("");
      setNovaPassword("");
      setConfirmarPassword("");

      alert("Password alterada com sucesso.");
    } catch (err) {
      console.error("Erro ao alterar password:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      alert(
        err.response?.data?.error ||
          "Erro ao alterar password."
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleTerminarSessao = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const confirmarExcluirConta = async () => {
    const id = getUserId();

    if (!id) {
      alert("Sessão inválida. Faça login novamente.");
      navigate("/login", { replace: true });
      return;
    }

    try {
      setIsDeleting(true);

      await api.put(`/utilizadores/${id}/desativar`);

      localStorage.clear();

      alert("Conta desativada com sucesso.");
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Erro ao excluir conta:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      alert(
        err.response?.data?.error ||
          "Erro ao excluir conta."
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: "#f0f2f5",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <LeftSidebar />

        <main style={mainStyle}>
          <button style={backBtn} onClick={() => navigate(-1)}>
            <HiOutlineArrowLeft style={{ marginRight: 6 }} />
            Voltar
          </button>

          <hr style={{ borderColor: "#e5e7eb", margin: "8px 0 24px" }} />

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>
              Definições da Conta
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 3 }}>
              Gere os teus dados pessoais, segurança e preferências
            </div>
          </div>

          <div style={columnsLayout}>
            <div style={leftCol}>
              <SectionCard titulo="Dados Pessoais">
                <FieldGroup
                  label="Nome completo"
                  icon={<HiOutlineUser size={17} />}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />

                <FieldGroup
                  label="Contacto"
                  icon={<HiOutlinePhone size={17} />}
                  type="tel"
                  value={contacto}
                  onChange={(e) => setContacto(e.target.value)}
                />

                <button
                  style={{
                    ...primaryBtn,
                    opacity: isSaving ? 0.7 : 1,
                    cursor: isSaving ? "not-allowed" : "pointer",
                  }}
                  onClick={handleGuardarPerfil}
                  disabled={isSaving}
                >
                  {isSaving ? "A guardar..." : "Guardar alterações"}
                </button>
              </SectionCard>

              <SectionCard titulo="Segurança">
                <FieldGroup
                  label="Password atual"
                  icon={<HiOutlineLockClosed size={17} />}
                  type="password"
                  value={passwordAtual}
                  onChange={(e) => setPasswordAtual(e.target.value)}
                />

                <FieldGroup
                  label="Nova password"
                  icon={<HiOutlineLockClosed size={17} />}
                  type="password"
                  value={novaPassword}
                  onChange={(e) => setNovaPassword(e.target.value)}
                />

                <FieldGroup
                  label="Confirmar nova password"
                  icon={<HiOutlineLockClosed size={17} />}
                  type="password"
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                />

                <button
                  style={{
                    ...primaryBtn,
                    opacity: isChangingPassword ? 0.7 : 1,
                    cursor: isChangingPassword ? "not-allowed" : "pointer",
                  }}
                  onClick={handleAlterarPassword}
                  disabled={isChangingPassword}
                >
                  {isChangingPassword
                    ? "A alterar..."
                    : "Alterar password"}
                </button>
              </SectionCard>
            </div>

            <div style={rightCol}>
              <SectionCard titulo="Foto de Perfil">
                <div style={fotoContainer}>
                  <div style={fotoPreviewBox}>
                    {fotoPreview ? (
                      <img
                        src={fotoPreview}
                        alt="Foto de perfil"
                        style={fotoPreviewImg}
                      />
                    ) : (
                      <HiOutlineUser size={46} color="#9ca3af" />
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={fotoTitle}>
                      Atualizar fotografia
                    </div>

                    <div style={fotoSubText}>
                      Usa uma imagem PNG, JPG ou WEBP até 2MB.
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      style={{ display: "none" }}
                      onChange={handleEscolherFoto}
                    />

                    <button
                      type="button"
                      style={secondaryPhotoBtn}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <HiOutlinePhotograph size={16} />
                      Escolher foto
                    </button>
                  </div>
                </div>

                {fotoFile && (
                  <button
                    style={{
                      ...primaryBtn,
                      opacity: isSavingFoto ? 0.7 : 1,
                      cursor: isSavingFoto ? "not-allowed" : "pointer",
                      marginTop: 14,
                    }}
                    onClick={handleGuardarFoto}
                    disabled={isSavingFoto}
                  >
                    {isSavingFoto ? "A guardar foto..." : "Guardar foto"}
                  </button>
                )}
              </SectionCard>
              <SectionCard titulo="Conta">
                <OptionRow
                  icon={<HiOutlineDocumentText size={18} />}
                  titulo="Termos e Serviços"
                  subtitulo="Rever condições de utilização"
                  onTap={() => setShowTermos(true)}
                  color="#4470AF"
                />

                <OptionRow
                  icon={<HiOutlineLogout size={18} />}
                  titulo="Terminar sessão"
                  subtitulo="Voltar à página de login"
                  onTap={handleTerminarSessao}
                  color="#f59e0b"
                />

                <OptionRow
                  icon={<HiOutlineTrash size={18} />}
                  titulo="Excluir conta"
                  subtitulo="A conta ficará INATIVA"
                  onTap={() => setShowDeleteModal(true)}
                  color="#ef4444"
                  noBorder
                />
              </SectionCard>
            </div>
          </div>

          {showTermos && (
            <ModalBase onClose={() => setShowTermos(false)}>
              <div style={modalTitle}>Termos e Serviços</div>

              <div style={modalBody}>
                Ao utilizar esta aplicação, aceita os termos de utilização da
                plataforma Softinsa Badges. Os dados são utilizados para gestão
                de candidaturas, badges, certificados e progresso profissional.
                A conta pode ser desativada pelo utilizador e reativada apenas
                por um administrador.
              </div>

              <div style={modalActions}>
                <button
                  style={secondaryBtn}
                  onClick={() => setShowTermos(false)}
                >
                  Fechar
                </button>
              </div>
            </ModalBase>
          )}

          {showDeleteModal && (
            <ModalBase onClose={() => setShowDeleteModal(false)}>
              <div style={modalTitle}>Excluir conta</div>

              <div style={modalBody}>
                Tem a certeza que deseja excluir a sua conta? A conta ficará{" "}
                <strong>INATIVA</strong> e só o administrador poderá
                reativá-la.
              </div>

              <div style={modalActions}>
                <button
                  style={secondaryBtn}
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                >
                  Cancelar
                </button>

                <button
                  style={{
                    ...dangerBtn,
                    opacity: isDeleting ? 0.7 : 1,
                    cursor: isDeleting ? "not-allowed" : "pointer",
                  }}
                  onClick={confirmarExcluirConta}
                  disabled={isDeleting}
                >
                  {isDeleting ? "A excluir..." : "Sim, excluir"}
                </button>
              </div>
            </ModalBase>
          )}
        </main>

        <RightSidebar />
      </div>
    </div>
  );
}

function SectionCard({ titulo, children }) {
  return (
    <div style={sectionCard}>
      <div style={sectionTitle}>{titulo}</div>
      <div style={{ marginTop: 16 }}>{children}</div>
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
      <label style={fieldLabel}>{label}</label>

      <div style={inputWrap}>
        <span style={inputIcon}>{icon}</span>

        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder || label}
          style={inputStyle}
        />
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
  noBorder,
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <div
        style={{
          ...optionRow,
          background: hovered ? "#f7f8fb" : "transparent",
          cursor: "pointer",
          borderRadius: 8,
        }}
        onClick={onTap}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          style={{
            ...optionIconCircle,
            background: color + "18",
          }}
        >
          <span style={{ color, display: "flex", alignItems: "center" }}>
            {icon}
          </span>
        </div>

        <div style={{ flex: 1, marginLeft: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color }}>
            {titulo}
          </div>

          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
            {subtitulo}
          </div>
        </div>

        <BiChevronRight size={20} color="#d1d5db" />
      </div>

      {!noBorder && (
        <hr
          style={{
            border: "none",
            borderTop: "1px solid #f0f0f0",
            margin: "2px 0",
          }}
        />
      )}
    </>
  );
}

function ModalBase({ children, onClose }) {
  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalBox} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

const mainStyle = {
  flex: 1,
  overflowY: "auto",
  padding: "28px 32px",
  backgroundColor: "#f7f7f7",
  minHeight: "100vh",
};

const backBtn = {
  display: "flex",
  alignItems: "center",
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#4A5568",
  fontSize: "1.05rem",
  padding: 0,
  marginBottom: 8,
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
  letterSpacing: "0.02em",
};

const inputWrap = {
  display: "flex",
  alignItems: "center",
  background: "#f7f7f7",
  border: "1.5px solid #e5e7eb",
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
  border: "none",
  background: "transparent",
  fontSize: 14,
  color: "#111827",
  outline: "none",
};

const primaryBtn = {
  width: "100%",
  padding: "10px 0",
  borderRadius: 10,
  border: "none",
  background: "#4470AF",
  color: "white",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  marginTop: 4,
};

const optionRow = {
  display: "flex",
  alignItems: "center",
  padding: "10px 6px",
  transition: "background 0.12s",
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

const columnsLayout = {
  display: "flex",
  gap: 24,
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const leftCol = {
  flex: "1 1 420px",
  minWidth: 320,
};

const rightCol = {
  flex: "0 1 360px",
  minWidth: 300,
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

const fotoContainer = {
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const fotoPreviewBox = {
  width: 76,
  height: 76,
  borderRadius: "50%",
  background: "#f3f4f6",
  border: "2px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  flexShrink: 0,
};

const fotoPreviewImg = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const fotoTitle = {
  fontSize: 14,
  fontWeight: 700,
  color: "#111827",
  marginBottom: 4,
};

const fotoSubText = {
  fontSize: 12,
  color: "#6b7280",
  lineHeight: 1.4,
  marginBottom: 10,
};

const secondaryPhotoBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: "1px solid #cbd5e1",
  background: "white",
  color: "#4470AF",
  borderRadius: 9,
  padding: "8px 12px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

export default DefinicoesConsultorPage;