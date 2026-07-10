import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineArrowLeft } from "react-icons/hi";
import {
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineLockClosed,
  HiOutlineDocumentText,
  HiOutlineLogout,
  HiOutlineTrash,
  HiOutlineCamera,
} from "react-icons/hi";
import { BiChevronRight, BiBriefcase, BiEnvelope } from "react-icons/bi";

// Componentes Estruturais da Versão 1
import Header from "../../components/Header.jsx";
import TmLeftSidebar from "../../components/tm_left_sidebar.jsx";
import TmRightSidebar from "../../components/tm_right_sidebar.jsx";
import api, { buildUploadUrl } from "../../services/api.js";

/* =========================================================
   FUNÇÃO AUXILIAR DE AUTENTICAÇÃO (Evita erros de import)
========================================================= */
function obterUtilizadorGuardado() {
  const guardado = localStorage.getItem("user");
  if (!guardado) return null;
  try {
    return JSON.parse(guardado);
  } catch (err) {
    console.error("Erro ao ler utilizador do localStorage:", err);
    return null;
  }
}

function TM_DefinicoesPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // 📝 Dados Pessoais & Corporativos (Estados trazidos e adaptados da Versão 2)
  const [nome, setNome] = useState("");
  const [contacto, setContacto] = useState("");
  const [emailBD, setEmailBD] = useState("");
  const [especializacao, setEspecializacao] = useState("");
  const [estadoConta, setEstadoConta] = useState("");
  const [estadoTm, setEstadoTm] = useState("");

  // Controladores de Foto e Salvamento (Versão 1)
  const [fotoPerfil, setFotoPerfil] = useState(null); 
  const [ficheiroFoto, setFicheiroFoto] = useState(null); 
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingFoto, setIsUploadingFoto] = useState(false);

  // Segurança (Versão 1)
  const [passwordAtual, setPasswordAtual] = useState("");
  const [novaPassword, setNovaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Preferências de Notificação (Versão 1)
  const [notificacoesEmail, setNotificacoesEmail] = useState(true);
  const [notificacoesPlataforma, setNotificacoesPlataforma] = useState(true);

  // Modais de Controle (Versão 1)
  const [showTermos, setShowTermos] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const userData = obterUtilizadorGuardado();

    if (!userData) {
      navigate("/login", { replace: true });
      return;
    }

    const userId = userData.id_utilizador || userData.ID_UTILIZADOR || userData.id;
    setUser(userData);
    
    // Valores base iniciais vindos do localStorage por segurança
    setNome(userData.nome_completo || userData.nome || "");
    setContacto(userData.contacto || "");
    setFotoPerfil(userData.foto_perfil || null);
    setNotificacoesEmail(userData.notificacoes_email ?? true);
    setNotificacoesPlataforma(userData.notificacoes_plataforma ?? true);

    // 🔄 Rota de carregamento de dados da VERSÃO 2
    api.get(`/tm/${userId}/definicoes`)
      .then((res) => {
        const informacao = res.data || {};

        // Atualiza os estados específicos da Versão 2
        setNome(informacao.nome_completo || "");
        setContacto(informacao.contacto || "");
        setEmailBD(informacao.email || userData.email || "");
        setEspecializacao(informacao.especializacao_tm || "");
        setEstadoConta(informacao.estado_conta || "");
        setEstadoTm(informacao.estado_tm || "");

        // Mantém sincronizado o localStorage global
        const userAtualizado = {
          ...userData,
          nome_completo: informacao.nome_completo,
          contacto: informacao.contacto,
          especializacao_tm: informacao.especializacao_tm,
          estado_conta: informacao.estado_conta,
          estado_tm: informacao.estado_tm,
        };
        localStorage.setItem("user", JSON.stringify(userAtualizado));
        setUser(userAtualizado);
      })
      .catch((err) => {
        console.error("Erro ao carregar definições do TM (Versão 2):", err);
      });
  }, [navigate]);

  const getUserId = () => {
    return user?.id_utilizador || user?.ID_UTILIZADOR || user?.id;
  };

  const atualizarLocalStorageGlobal = (utilizadorAtualizado) => {
    const novoUserObj = {
      ...user,
      nome_completo: utilizadorAtualizado.nome_completo || nome,
      contacto: utilizadorAtualizado.contacto || contacto,
      foto_perfil: utilizadorAtualizado.foto_perfil ?? user?.foto_perfil,
      notificacoes_email: utilizadorAtualizado.notificacoes_email ?? notificacoesEmail,
      notificacoes_plataforma: utilizadorAtualizado.notificacoes_plataforma ?? notificacoesPlataforma,
    };
    localStorage.setItem("user", JSON.stringify(novoUserObj));
    setUser(novoUserObj);
  };

  // 📸 Upload de Foto (Mantido da Versão 1)
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFicheiroFoto(file);
      setFotoPerfil(URL.createObjectURL(file));
    }
  };

  const handleUploadFoto = async () => {
    const id = getUserId();
    if (!ficheiroFoto || !id) return;

    try {
      setIsUploadingFoto(true);
      const formData = new FormData();
      formData.append("foto", ficheiroFoto);

      const response = await api.put(`/utilizadores/${id}/foto`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const dadosAtualizados = response.data?.utilizador || response.data;
      atualizarLocalStorageGlobal(dadosAtualizados);
      setFicheiroFoto(null);
      alert("Foto de perfil atualizada!");
    } catch (err) {
      console.error("Erro ao enviar foto:", err);
      alert(err.response?.data?.error || "Erro ao fazer upload da foto.");
    } finally {
      setIsUploadingFoto(false);
    }
  };

  // 💾 Guardar Perfil com a Lógica e Endpoint da VERSÃO 2
  const handleGuardarPerfil = async (e) => {
    if (e) e.preventDefault();
    const id = getUserId();
    
    if (!nome.trim()) {
      alert("O nome completo é obrigatório.");
      return;
    }

    try {
      setIsSaving(true);
      // Rota e Payload da Versão 2
      const response = await api.put(`/tm/${id}/definicoes`, {
        nome_completo: nome.trim(),
        contacto: contacto.trim(),
      });

      const utilizadorAtualizado = response.data?.utilizador || {};
      atualizarLocalStorageGlobal(utilizadorAtualizado);
      alert(response.data?.message || "Definições atualizadas com sucesso.");
    } catch (err) {
      console.error("Erro ao guardar definições:", err);
      alert(err.response?.data?.error || "Não foi possível guardar as definições.");
    } finally {
      setIsSaving(false);
    }
  };

  // 🌟 Preferências (Versão 1)
  const handleTogglePreference = async (tipo, valorNovo) => {
    const id = getUserId();
    if (!id) return;

    const novoEmail = tipo === "email" ? valorNovo : notificacoesEmail;
    const novaPlataforma = tipo === "plataforma" ? valorNovo : notificacoesPlataforma;

    try {
      const response = await api.put(`/utilizadores/${id}/preferencias`, {
        notificacoes_email: novoEmail,
        notificacoes_plataforma: novaPlataforma
      });
      const dadosAtualizados = response.data?.utilizador || response.data;
      atualizarLocalStorageGlobal(dadosAtualizados);
    } catch (err) {
      console.error("Erro ao guardar preferência:", err);
    }
  };

  // 🔐 Alterar Password (Versão 1)
  const handleAlterarPassword = async () => {
    const id = getUserId();
    if (!id || !passwordAtual || !novaPassword) return;
    if (novaPassword !== confirmarPassword) {
      alert("As passwords não coincidem.");
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
      alert(err.response?.data?.error || "Erro ao alterar password.");
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
    if (!id) return;

    try {
      setIsDeleting(true);
      await api.put(`/utilizadores/${id}/desativar`);
      localStorage.clear();
      navigate("/login", { replace: true });
    } catch (err) {
      alert("Erro ao excluir conta.");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#f0f2f5", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <TmLeftSidebar />

        <main style={mainStyle}>
          <button style={backBtn} onClick={() => navigate(-1)}>
            <HiOutlineArrowLeft style={{ marginRight: 6 }} />
            Voltar
          </button>

          <hr style={{ borderColor: "#e5e7eb", margin: "8px 0 24px" }} />

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>
              Definições de Talent Manager
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 3 }}>
              Gere os teus dados de avaliador, segurança e canais de alertas
            </div>
          </div>

          <div style={columnsLayout}>
            <div style={leftCol}>
              
              {/* Foto de Perfil (Versão 1) */}
              <SectionCard titulo="Foto de Perfil">
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 12 }}>
                  <div style={avatarContainer}>
                    {fotoPerfil ? (
                      <img src={buildUploadUrl(fotoPerfil)} alt="Perfil" style={avatarImg} />
                    ) : (
                      <div style={avatarPlaceholder}>
                        {nome ? nome.charAt(0).toUpperCase() : "TM"}
                      </div>
                    )}
                    <label style={cameraOverlay}>
                      <HiOutlineCamera size={20} color="white" />
                      <input type="file" accept="image/*" onChange={handleFotoChange} style={{ display: "none" }} />
                    </label>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Alterar imagem de perfil</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Formatos aceites: JPG, PNG.</div>
                    
                    {ficheiroFoto && (
                      <button onClick={handleUploadFoto} disabled={isUploadingFoto} style={saveFotoBtn}>
                        {isUploadingFoto ? "A enviar..." : "✓ Confirmar Foto"}
                      </button>
                    )}
                  </div>
                </div>
              </SectionCard>

              {/* 🌟 FORMULÁRIO DE DADOS PESSOAIS DA VERSÃO 2 (Integrado no Design da Versão 1) */}
              <SectionCard titulo="Dados Pessoais & Corporativos">
                <form onSubmit={handleGuardarPerfil}>
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

                  {/* Campos Corporativos Desativados da Versão 2 */}
                  <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                    <div style={{ flex: 1 }}>
                      <label style={fieldLabel}>E-mail Institucional</label>
                      <div style={{...disabledInputWrap, fontSize: 12}}>{emailBD || user?.email || "Sem e-mail"}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={fieldLabel}>Especialização</label>
                      <div style={disabledInputWrap}>{especializacao || "Não definida"}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                    <div style={{ flex: 1 }}>
                      <label style={fieldLabel}>Estado da Conta</label>
                      <div style={disabledInputWrap}>{estadoConta || "Não definido"}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={fieldLabel}>Estado de Talent Manager</label>
                      <div style={disabledInputWrap}>{estadoTm || "Não definido"}</div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    style={{ ...primaryBtn, opacity: isSaving ? 0.7 : 1 }} 
                    disabled={isSaving}
                  >
                    {isSaving ? "A guardar..." : "Guardar alterações"}
                  </button>
                </form>
              </SectionCard>

              {/* Segurança (Versão 1) */}
              <SectionCard titulo="Segurança">
                <FieldGroup label="Password atual" icon={<HiOutlineLockClosed size={17} />} type="password" value={passwordAtual} onChange={(e) => setPasswordAtual(e.target.value)} />
                <FieldGroup label="Nova password" icon={<HiOutlineLockClosed size={17} />} type="password" value={novaPassword} onChange={(e) => setNovaPassword(e.target.value)} />
                <FieldGroup label="Confirmar nova password" icon={<HiOutlineLockClosed size={17} />} type="password" value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} />

                <button style={{ ...primaryBtn, opacity: isChangingPassword ? 0.7 : 1 }} onClick={handleAlterarPassword} disabled={isChangingPassword}>
                  {isChangingPassword ? "A alterar..." : "Alterar password"}
                </button>
              </SectionCard>
            </div>

            <div style={rightCol}>
              {/* Preferências de Notificações (Versão 1) */}
              <SectionCard titulo="Preferências de Notificações">
                <div style={preferenceRow}>
                  <div style={{ flex: 1 }}>
                    <div style={preferenceTitle}>Notificações por E-mail</div>
                    <div style={preferenceDesc}>Receber alertas diretamente na tua caixa de correio eletrónico.</div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notificacoesEmail} 
                    onChange={(e) => {
                      const v = e.target.checked;
                      setNotificacoesEmail(v);
                      handleTogglePreference("email", v);
                    }} 
                    style={toggleStyle}
                  />
                </div>

                <div style={{ ...preferenceRow, border: "none", paddingBottom: 0 }}>
                  <div style={{ flex: 1 }}>
                    <div style={preferenceTitle}>Notificações na Plataforma</div>
                    <div style={preferenceDesc}>Permitir alertas visuais dentro do sistema e do teu painel.</div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notificacoesPlataforma} 
                    onChange={(e) => {
                      const v = e.target.checked;
                      setNotificacoesPlataforma(v);
                      handleTogglePreference("plataforma", v);
                    }} 
                    style={toggleStyle}
                  />
                </div>
              </SectionCard>

              {/* Gestão de Conta (Versão 1) */}
              <SectionCard titulo="Conta">
                <OptionRow icon={<HiOutlineDocumentText size={18} />} titulo="Termos e Serviços" subtitulo="Rever condições de utilização" onTap={() => setShowTermos(true)} color="#4470AF" />
                <OptionRow icon={<HiOutlineLogout size={18} />} titulo="Terminar sessão" subtitulo="Voltar à página de login" onTap={handleTerminarSessao} color="#f59e0b" />
                <OptionRow icon={<HiOutlineTrash size={18} />} titulo="Excluir conta" subtitulo="A conta ficará INATIVA" onTap={() => setShowDeleteModal(true)} color="#ef4444" noBorder />
              </SectionCard>
            </div>
          </div>

          {/* Modais de Suporte */}
          {showTermos && (
            <ModalBase onClose={() => setShowTermos(false)}>
              <div style={modalTitle}>Termos e Serviços</div>
              <div style={modalBody}>
                Ao utilizar esta aplicação na qualidade de Talent Manager, assume o compromisso de gerir e validar as candidaturas a badges em conformidade com as políticas internas.
              </div>
              <div style={modalActions}>
                <button style={secondaryBtn} onClick={() => setShowTermos(false)}>Fechar</button>
              </div>
            </ModalBase>
          )}

          {showDeleteModal && (
            <ModalBase onClose={() => setShowDeleteModal(false)}>
              <div style={modalTitle}>Excluir conta</div>
              <div style={modalBody}>Tem a certeza que deseja desativar a sua conta de Talent Manager?</div>
              <div style={modalActions}>
                <button style={secondaryBtn} onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>Cancelar</button>
                <button style={{ ...dangerBtn, opacity: isDeleting ? 0.7 : 1 }} onClick={confirmarExcluirConta} disabled={isDeleting}>Sim, desativar</button>
              </div>
            </ModalBase>
          )}
        </main>

        <TmRightSidebar />
      </div>
    </div>
  );
}

/* =========================================================
   SUB-COMPONENTES AUXILIARES & ESTILOS GLOBAIS
========================================================= */
function SectionCard({ titulo, children }) { return <div style={sectionCard}><div style={sectionTitle}>{titulo}</div><div style={{ marginTop: 16 }}>{children}</div></div>; }
function FieldGroup({ label, icon, type = "text", value, onChange, placeholder }) { return <div style={{ marginBottom: 14 }}><label style={fieldLabel}>{label}</label><div style={inputWrap}><span style={inputIcon}>{icon}</span><input type={type} value={value} onChange={onChange} placeholder={placeholder || label} style={inputStyle} /></div></div>; }
function OptionRow({ icon, titulo, subtitulo, onTap, color = "#4470AF", noBorder }) { const [hovered, setHovered] = useState(false); return <><div style={{ ...optionRow, background: hovered ? "#f7f8fb" : "transparent", cursor: "pointer", borderRadius: 8 }} onClick={onTap} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}><div style={{ ...optionIconCircle, background: color + "18" }}><span style={{ color, display: "flex", alignItems: "center" }}>{icon}</span></div><div style={{ flex: 1, marginLeft: 12 }}><div style={{ fontSize: 14, fontWeight: 600, color }}>{titulo}</div><div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{subtitulo}</div></div><BiChevronRight size={20} color="#d1d5db" /></div>{!noBorder && <hr style={{ border: "none", borderTop: "1px solid #f0f0f0", margin: "2px 0" }} />}</>; }
function ModalBase({ children, onClose }) { return <div style={modalOverlay} onClick={onClose}><div style={modalBox} onClick={(e) => e.stopPropagation()}>{children}</div></div>; }

const mainStyle = { flex: 1, overflowY: "auto", padding: "28px 32px", backgroundColor: "#f7f7f7", minHeight: "100vh" };
const backBtn = { display: "flex", alignItems: "center", background: "none", border: "none", cursor: "pointer", color: "#4A5568", fontSize: "1.05rem", padding: 0, marginBottom: 8 };
const sectionCard = { background: "white", border: "1px solid #dbe3ef", borderRadius: 12, padding: "20px 22px", marginBottom: 20 };
const sectionTitle = { fontSize: 15, fontWeight: 700, color: "#111827", borderBottom: "1px solid #f0f0f0", paddingBottom: 10 };
const fieldLabel = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6, letterSpacing: "0.02em" };
const inputWrap = { display: "flex", alignItems: "center", background: "#f7f7f7", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "0 12px", height: 44 };
const disabledInputWrap = { display: "flex", alignItems: "center", background: "#eef2f6", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "0 12px", height: 44, color: "#64748b", fontSize: 14, fontWeight: 500 };
const inputIcon = { color: "#9ca3af", display: "flex", alignItems: "center", marginRight: 10, flexShrink: 0 };
const inputStyle = { flex: 1, border: "none", background: "transparent", fontSize: 14, color: "#111827", outline: "none" };
const primaryBtn = { width: "100%", padding: "10px 0", borderRadius: 10, border: "none", background: "#4470AF", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 4 };
const optionRow = { display: "flex", alignItems: "center", padding: "10px 6px", transition: "background 0.12s" };
const optionIconCircle = { width: 38, height: 38, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const columnsLayout = { display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" };
const leftCol = { flex: "1 1 420px", minWidth: 320 };
const rightCol = { flex: "0 1 360px", minWidth: 300 };
const modalOverlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalBox = { background: "white", borderRadius: 14, padding: "28px 32px", maxWidth: 460, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" };
const modalTitle = { fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 14 };
const modalBody = { fontSize: 14, color: "#374151", lineHeight: 1.65, marginBottom: 22 };
const modalActions = { display: "flex", justifyContent: "flex-end", gap: 10 };
const secondaryBtn = { padding: "8px 20px", borderRadius: 8, border: "1.5px solid #d1d5db", background: "white", color: "#374151", fontSize: 14, fontWeight: 500, cursor: "pointer" };
const dangerBtn = { padding: "8px 20px", borderRadius: 8, border: "none", background: "#ef4444", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer" };

const avatarContainer = { position: "relative", width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: "2px solid #e5e7eb", background: "#f3f4f6", flexShrink: 0 };
const avatarImg = { width: "100%", height: "100%", objectFit: "cover" };
const avatarPlaceholder = { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "#9ca3af" };
const cameraOverlay = { position: "absolute", bottom: 0, left: 0, right: 0, height: "30%", background: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "0.2s" };
const saveFotoBtn = { marginTop: 8, padding: "6px 12px", background: "#10b981", color: "white", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" };
const preferenceRow = { display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, marginBottom: 14, borderBottom: "1px solid #f0f0f0" };
const preferenceTitle = { fontSize: 13, fontWeight: 600, color: "#374151" };
const preferenceDesc = { fontSize: 11, color: "#6b7280", marginTop: 2, lineHeight: 1.3 };
const toggleStyle = { width: 40, height: 20, accentColor: "#4470AF", cursor: "pointer" };

export default TM_DefinicoesPage;