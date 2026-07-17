import React, { useEffect, useMemo, useState } from "react";
import * as Clipboard from "expo-clipboard";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Mock/Imports do teu ecossistema (Ajusta conforme o teu projeto)
import api from "../../services/api.js";
import BadgeImage, {
  obterImagemBadge,
} from "../../components/badge_image.jsx";

function escaparHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function tornarUrlAbsoluta(url) {
  if (!url) return "";
  const valor = String(url).trim();
  if (valor.startsWith("http://") || valor.startsWith("https://") || valor.startsWith("data:image/")) {
    return valor;
  }
  return valor;
}

function obterIdBadge(badge) {
  return badge?.id || badge?.id_badge_modelo || badge?.badge_id || null;
}

function removerDuplicados(lista) {
  const mapa = new Map();
  (lista || []).forEach((badge) => {
    const idBadge = obterIdBadge(badge);
    if (!idBadge) return;
    const existente = mapa.get(String(idBadge));
    if (!existente) {
      mapa.set(String(idBadge), {
        ...badge,
        id: idBadge,
        nome: badge.nome || badge.nome_badge || "Badge",
        descricao: badge.descricao || badge.descricao_badge_modelo || "",
        imagem_url: badge.imagem_url || badge.imagem || badge.url_imagem || null,
      });
      return;
    }
    mapa.set(String(idBadge), {
      ...existente,
      ...badge,
      nome: existente.nome || badge.nome || badge.nome_badge || "Badge",
      imagem_url: existente.imagem_url || badge.imagem_url || badge.imagem || badge.url_imagem || null,
    });
  });
  return Array.from(mapa.values());
}

function obterUserId(user) {
  return user?.id_utilizador || user?.ID_UTILIZADOR || user?.id || null;
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

export default function ConfiguracaoAssinaturaScreen() {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [badges, setBadges] = useState([]);
  const [config, setConfig] = useState(CONFIG_PADRAO);
  const [copiado, setCopiado] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const storageKey = useMemo(() => {
    const id = obterUserId(user);
    return id ? `softinsa_email_signature_template_${id}` : "softinsa_email_signature_template";
  }, [user]);

  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true);
        const storedUser = await AsyncStorage.getItem("user");
        if (!storedUser) {
          navigation.navigate("Login");
          return;
        }

        const userData = JSON.parse(storedUser);
        const userId = obterUserId(userData);
        if (!userId) {
          navigation.navigate("Login");
          return;
        }

        const [userRes, badgesRes] = await Promise.all([
          api.get(`/utilizadores/${userId}`).catch(() => ({ data: userData })),
          api.get(`/badges/conquistados/${userId}`).catch(() => ({ data: [] })),
        ]);

        const utilizador = userRes?.data || userData;
        const badgesUnicos = removerDuplicados(Array.isArray(badgesRes.data) ? badgesRes.data : []);

        setUser(utilizador);
        setBadges(badgesUnicos);

        const guardada = await AsyncStorage.getItem(`softinsa_email_signature_template_${userId}`);
        let configInicial = CONFIG_PADRAO;

        if (guardada) {
          configInicial = { ...CONFIG_PADRAO, ...JSON.parse(guardada) };
        }

        if (!configInicial.badgePrincipalId && badgesUnicos.length > 0) {
          const primeiroId = String(obterIdBadge(badgesUnicos[0]));
          configInicial = {
            ...configInicial,
            badgePrincipalId: primeiroId,
            badgesSelecionadosIds: [primeiroId],
          };
        }

        setConfig(configInicial);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } opacity: 1;
      setLoading(false);
    }
    carregarDados();
  }, []);

  const dadosAssinatura = useMemo(() => {
    return {
      nome: user?.nome_completo || user?.nome || "Consultor/a Softinsa",
      email: user?.email_softinsa || user?.email || "",
      cargo: user?.departamento || user?.tipo_utilizador || "Consultor/a",
    };
  }, [user]);

  const badgePrincipal = useMemo(() => {
    if (!config.badgePrincipalId && badges.length > 0) return badges[0];
    return badges.find((b) => String(obterIdBadge(b)) === String(config.badgePrincipalId));
  }, [badges, config.badgePrincipalId]);

  const badgesSelecionados = useMemo(() => {
    const ids = Array.isArray(config.badgesSelecionadosIds) ? config.badgesSelecionadosIds.map(String) : [];
    const selecionados = badges.filter((b) => ids.includes(String(obterIdBadge(b))));
    if (config.mostrarVariosBadges) {
      return selecionados.slice(0, Number(config.limiteBadges || 3));
    }
    return badgePrincipal ? [badgePrincipal] : [];
  }, [badges, badgePrincipal, config.badgesSelecionadosIds, config.mostrarVariosBadges, config.limiteBadges]);

  const atualizarConfig = (campo, valor) => {
    setConfig((anterior) => ({ ...anterior, [campo]: valor }));
    setGuardado(false);
  };

  const obterUrlBadge = (badge) => {
    const userId = obterUserId(user);
    const idBadge = obterIdBadge(badge);
    return userId && idBadge ? `https://teudominio.com/badges/${userId}/${idBadge}` : "";
  };

  const gerarAssinaturaTexto = () => {
    const linhas = [];
    if (config.mostrarNome) linhas.push(dadosAssinatura.nome);
    if (config.mostrarCargo) linhas.push(dadosAssinatura.cargo);
    if (config.mostrarEmail && dadosAssinatura.email) linhas.push(dadosAssinatura.email);
    if (badgesSelecionados.length > 0) {
      linhas.push("", "Badges conquistados:");
      badgesSelecionados.forEach((badge) => {
        linhas.push(`- ${badge.nome || badge.nome_badge || "Badge"}`);
        if (config.mostrarLinkBadge) {
          const url = obterUrlBadge(badge);
          if (url) linhas.push(`  ${url}`);
        }
      });
    }
    return linhas.filter(Boolean).join("\n");
  };

  const copiarAssinatura = async () => {
    try {
      const texto = gerarAssinaturaTexto();
      await Clipboard.setStringAsync(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
      Alert.alert("Sucesso", "Assinatura copiada para a área de transferência!");
    } catch (err) {
      Alert.alert("Erro", "Não foi possível copiar.");
    }
  };

  const guardarTemplate = async () => {
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(config));
      setGuardado(true);
      setTimeout(() => setGuardado(false), 1800);
    } catch (err) {
      Alert.alert("Erro", "Não foi possível guardar as configurações.");
    }
  };

  const reporTemplate = () => {
    setConfig(CONFIG_PADRAO);
    Alert.alert("Configuração", "Definições repostas para o padrão.");
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4470AF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.main}>
      {/* Botão Voltar */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="arrow-left" size={16} color="#2563eb" />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.pageHeader}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.eyebrow}>Assinatura de e-mail</Text>
          <Text style={styles.title}>Configuração do template</Text>
          <Text style={styles.subtitle}>
            Define como os teus badges aparecem na assinatura de e-mail e copia o template pronto para uso.
          </Text>
        </View>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="email-outline" size={36} color="white" />
        </View>
      </View>

      {/* Seleção do Template */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Selecione o Template</Text>
        <View style={styles.templateGrid}>
          <TemplateOption
            title="Simples"
            description="Nome, cargo e um badge principal."
            active={config.template === "simples"}
            onClick={() => atualizarConfig("template", "simples")}
          />
          <TemplateOption
            title="Completo"
            description="Dados pessoais, badge e links públicos."
            active={config.template === "completo"}
            onClick={() => atualizarConfig("template", "completo")}
          />
          <TemplateOption
            title="Galeria"
            description="Mostra vários badges conquistados."
            active={config.template === "galeria"}
            onClick={() => {
              atualizarConfig("template", "galeria");
              atualizarConfig("mostrarVariosBadges", true);
            }}
          />
        </View>
      </View>

      {/* Opções de Visibilidade (Checkboxes Adaptadas) */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Opções de visualização</Text>
        <View style={styles.checksGrid}>
          <CheckOption
            label="Mostrar Nome"
            checked={config.mostrarNome}
            onChange={(val) => atualizarConfig("mostrarNome", val)}
          />
          <CheckOption
            label="Mostrar Cargo"
            checked={config.mostrarCargo}
            onChange={(val) => atualizarConfig("mostrarCargo", val)}
          />
          <CheckOption
            label="Mostrar Email"
            checked={config.mostrarEmail}
            onChange={(val) => atualizarConfig("mostrarEmail", val)}
          />
          <CheckOption
            label="Mostrar Logo Empresa"
            checked={config.mostrarLogoSoftinsa}
            onChange={(val) => atualizarConfig("mostrarLogoSoftinsa", val)}
          />
        </View>
      </View>

      {/* Caixa de Texto Simples (Antigo Textarea) */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Texto simples</Text>
        <TextInput
          style={styles.textarea}
          multiline
          editable={false}
          value={gerarAssinaturaTexto()}
        />
        <Text style={styles.smallInfo}>
          Usa esta versão se o cliente de e-mail não aceitar HTML.
        </Text>
      </View>

      {/* Painel de Ações Laterais do Antigo Aside */}
      <View style={styles.card}>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={copiarAssinatura}>
            <MaterialCommunityIcons name="content-copy" size={17} color="white" />
            <Text style={styles.primaryButtonText}>
              {copiado ? "Copiado!" : "Copiar assinatura"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={guardarTemplate}>
            <MaterialCommunityIcons name="content-save" size={17} color="#475569" />
            <Text style={styles.secondaryButtonText}>
              {guardado ? "Guardado!" : "Guardar template"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={reporTemplate}>
            <MaterialCommunityIcons name="refresh" size={17} color="#475569" />
            <Text style={styles.secondaryButtonText}>Repor</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// Subcomponente de Opção de Template
function TemplateOption({ active, title, description, onClick }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onClick={onClick} /* Evento unificado para compatibilidade interna do teu handler */
      onPress={onClick}
      style={[
        styles.templateOption,
        {
          borderColor: active ? "#2563eb" : "#e5e7eb",
          backgroundColor: active ? "#eff6ff" : "white",
        },
      ]}
    >
      <Text style={styles.templateTitle}>{title}</Text>
      <Text style={styles.templateDescription}>{description}</Text>
    </TouchableOpacity>
  );
}

// Subcomponente de Checkbox Adaptado para Mobile
function CheckOption({ label, checked, onChange }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onChange(!checked)}
      style={styles.checkOption}
    >
      <MaterialCommunityIcons
        name={checked ? "checkbox-marked" : "checkbox-blank-outline"}
        size={20}
        color={checked ? "#2563eb" : "#64748b"}
      />
      <Text style={styles.checkLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// Estilos convertidos fielmente a partir do teu objeto CSS original
const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  main: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 30,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f2f5",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  backButtonText: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 7,
  },
  pageHeader: {
    backgroundColor: "#4470AF", // Gradientes lineares puros requerem pacotes adicionais, mantendo uma cor base premium sólida do teu CSS
    borderRadius: 16,
    padding: 20,
    marginBottom: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eyebrow: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    opacity: 0.85,
    fontWeight: "700",
    color: "white",
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "650",
    color: "white",
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.9,
    color: "white",
    marginTop: 8,
    lineHeight: 18,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  templateGrid: {
    flexDirection: "column",
    gap: 10,
  },
  templateOption: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
  },
  templateTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 5,
  },
  templateDescription: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 16,
  },
  checksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  checkOption: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%", // Distribuição em duas colunas perfeitas em ecrãs móveis
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  checkLabel: {
    fontSize: 12,
    color: "#374151",
    flex: 1,
  },
  textarea: {
    width: "100%",
    height: 150,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 12,
    fontSize: 12,
    color: "#475569",
    textAlignVertical: "top", // Garante que o texto começa no topo esquerdo do input no Android
  },
  smallInfo: {
    marginTop: 10,
    color: "#64748b",
    fontSize: 12,
    lineHeight: 16,
  },
  actions: {
    flexDirection: "column",
    gap: 10,
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  secondaryButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#dbe3ef",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryButtonText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "500",
  },
});