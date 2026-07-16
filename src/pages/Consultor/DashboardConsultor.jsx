import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Card,
  Button,
  Spinner,
  Modal,
    ProgressBar,
} from "react-bootstrap";
import { BiMedal, BiStar, BiUserCircle, BiGrid, BiMenu } from 'react-icons/bi';
import { useNavigate, Link } from 'react-router-dom';
import api, { buildUploadUrl } from '../../services/api.js'; // Garante que o caminho está correto

// Importação dos teus componentes estruturais
import Header from '../../components/Header.jsx';
import RightSidebar from '../../components/RightSidebar.jsx';
import LeftSidebar from '../../components/LeftSidebar.jsx';

import {
  EVENTO_NOTIFICACOES_ATUALIZADAS,
  emitirAtualizacaoNotificacoes,
  filtrarNotificacoesMarco,
  formatarTituloNotificacao,
  notificacaoNaoLida,
  obterConteudoNotificacao,
  obterIconeMarco,
  obterIdNotificacao,
  obterTipoNotificacao,
} from "../../utils/notificacoesUtils.js";

import {
    obterPontosTotaisBadge,
} from "../../utils/badgeBonus.js";

const MAX_BADGES_OBTIDOS_VISIVEIS = 3;

function detetarMimeImagem(bytes) {
    if (!bytes || bytes.length < 4) return "image/png";

    if (bytes[0] === 0xff && bytes[1] === 0xd8) {
        return "image/jpeg";
    }

    if (
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47
    ) {
        return "image/png";
    }

    if (
        bytes[0] === 0x47 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46
    ) {
        return "image/gif";
    }

    if (
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46
    ) {
        return "image/webp";
    }

    return "image/png";
}

function bytesParaBase64(bytes) {
    let binary = "";

    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, chunk);
    }

    return window.btoa(binary);
}

function normalizarImagemSrc(imagem) {
    if (!imagem) return null;

    if (typeof imagem === "string") {
        const valor = imagem.trim();

        if (!valor) return null;

        if (
            valor.startsWith("http://") ||
            valor.startsWith("https://") ||
            valor.startsWith("data:image/")
        ) {
            return valor;
        }

        if (valor.startsWith("\\x")) {
            const hex = valor.slice(2);
            const bytes = [];

            for (let i = 0; i < hex.length; i += 2) {
                bytes.push(parseInt(hex.substr(i, 2), 16));
            }

            const mime = detetarMimeImagem(bytes);
            return `data:${mime};base64,${bytesParaBase64(bytes)}`;
        }

        return valor;
    }

    if (imagem.type === "Buffer" && Array.isArray(imagem.data)) {
        const bytes = imagem.data;

        const texto = new TextDecoder("utf-8").decode(new Uint8Array(bytes)).trim();

        if (
            texto.startsWith("http://") ||
            texto.startsWith("https://") ||
            texto.startsWith("data:image/")
        ) {
            return texto;
        }

        const mime = detetarMimeImagem(bytes);
        return `data:${mime};base64,${bytesParaBase64(bytes)}`;
    }

    if (Array.isArray(imagem)) {
        const bytes = imagem;

        const texto = new TextDecoder("utf-8").decode(new Uint8Array(bytes)).trim();

        if (
            texto.startsWith("http://") ||
            texto.startsWith("https://") ||
            texto.startsWith("data:image/")
        ) {
            return texto;
        }

        const mime = detetarMimeImagem(bytes);
        return `data:${mime};base64,${bytesParaBase64(bytes)}`;
    }

    return null;
}

function normalizarBooleano(valor) {
    if (typeof valor === "boolean") {
        return valor;
    }

    if (typeof valor === "number") {
        return valor === 1;
    }

    const texto = String(valor ?? "")
        .trim()
        .toLowerCase();

    return [
        "true",
        "t",
        "1",
        "sim",
        "yes",
    ].includes(texto);
}

function obterChaveMarcosCelebrados(idUtilizador) {
    return `marcos_celebrados_${idUtilizador}`;
}

function obterMarcosCelebrados(idUtilizador) {
    if (!idUtilizador) {
        return new Set();
    }

    try {
        const guardado = localStorage.getItem(
            obterChaveMarcosCelebrados(idUtilizador)
        );

        const lista = guardado
            ? JSON.parse(guardado)
            : [];

        return new Set(
            Array.isArray(lista)
                ? lista.map(String)
                : []
        );
    } catch {
        return new Set();
    }
}

function guardarMarcoCelebrado(idUtilizador, idNotificacao) {
    if (!idUtilizador || !idNotificacao) {
        return;
    }

    const celebrados =
        obterMarcosCelebrados(idUtilizador);

    celebrados.add(
        String(idNotificacao)
    );

    localStorage.setItem(
        obterChaveMarcosCelebrados(idUtilizador),
        JSON.stringify(
            Array.from(celebrados)
        )
    );
}

function normalizarBadge(badge) {
    const imagemSrc = normalizarImagemSrc(
        badge.imagem_url ||
        badge.imagem ||
        badge.url_imagem
    );

    const pontosExtra = Number(
        badge.pontos_extra ??
        badge.pontos_bonus ??
        0
    );

    const ganhouBonus =
        normalizarBooleano(
            badge.ganhou_bonus ??
            badge.premio_atribuido
        ) ||
        pontosExtra > 0;

    return {
        ...badge,

        imagem_url: imagemSrc,
        imagem: imagemSrc,

        ganhou_bonus: ganhouBonus,
        pontos_extra: pontosExtra,
    };
}

function obterFotoPerfilSrc(user) {
  const foto =
    user?.foto_perfil ||
    user?.FOTO_PERFIL ||
    user?.foto ||
    user?.imagem ||
    null;

  if (!foto) {
    return null;
  }

  return buildUploadUrl(foto);
}

function WelcomeProfilePhoto({ user, size = 72 }) {
  const [erroImagem, setErroImagem] = useState(false);

  const fotoSrc = obterFotoPerfilSrc(user);

  if (!fotoSrc || erroImagem) {
    return (
      <div
        style={{
          ...welcomePhotoWrapper,
          width: size,
          height: size,
        }}
      >
        <BiUserCircle
          size={Math.round(size * 0.72)}
          color="rgba(255,255,255,0.85)"
        />
      </div>
    );
  }

  return (
    <div
      style={{
        ...welcomePhotoWrapper,
        width: size,
        height: size,
      }}
    >
      <img
        src={fotoSrc}
        alt="Foto de perfil"
        style={welcomePhotoImage}
        onError={() => setErroImagem(true)}
      />
    </div>
  );
}

function DashboardConsultor() {
    const navigate = useNavigate();
    
    // Estados para os dados da BD
    const [user, setUser] = useState(null);
    const [progressoBadges, setProgressoBadges] = useState([]);
    const [progressoLearningPaths, setProgressoLearningPaths] = useState([]);
    const [recomendados, setRecomendados] = useState([]);
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({ total_badges: 0, total_pontos: 0 });
    const [
    userId,
    setUserId,
    ] = useState(null);

    const [
    marcos,
    setMarcos,
    ] = useState([]);

    const [
    marcoCelebracao,
    setMarcoCelebracao,
    ] = useState(null);

    const [
    mostrarCelebracao,
    setMostrarCelebracao,
    ] = useState(false);

    const marcosMostradosRef =
    useRef(new Set());

    const carregarMarcos =
        useCallback(
            async (
            idUtilizador,
            {
                mostrarModal =
                false,
            } = {}
            ) => {
            if (!idUtilizador) {
                setMarcos([]);
                return;
            }

            try {
                const response =
                await api.get(
                    `/notificacoes/${idUtilizador}`
                );

                const lista =
                Array.isArray(response.data)
                    ? response.data
                    : [];

                const marcosEncontrados =
                filtrarNotificacoesMarco(
                    lista
                );

                setMarcos(
                marcosEncontrados
                );

                if (!mostrarModal) {
                return;
                }

                const marcosCelebrados =
                    obterMarcosCelebrados(
                        idUtilizador
                    );

                const novoMarcoNaoLido =
                    marcosEncontrados.find(
                        (notificacao) => {
                            const id =
                                String(
                                    obterIdNotificacao(
                                        notificacao
                                    )
                                );

                            return (
                                notificacaoNaoLida(
                                    notificacao
                                ) &&
                                !marcosMostradosRef
                                    .current
                                    .has(id) &&
                                !marcosCelebrados
                                    .has(id)
                            );
                        }
                    );

                if (novoMarcoNaoLido) {
                const id =
                    String(
                    obterIdNotificacao(
                        novoMarcoNaoLido
                    )
                    );

                marcosMostradosRef
                    .current
                    .add(id);

                setMarcoCelebracao(
                    novoMarcoNaoLido
                );

                setMostrarCelebracao(
                    true
                );
                }
            } catch (err) {
                console.error(
                "[MARCOS] Erro ao carregar marcos:",
                err
                );
            }
            },
            []
        );

    useEffect(() => {
        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
            setLoading(false);
            navigate("/login", { replace: true });
            return;
        }

        const userData = JSON.parse(storedUser);
        setUser(userData);

        const userId =
            userData.id_utilizador ||
            userData.ID_UTILIZADOR ||
            userData.id;
        setUserId(userId);

        if (!userId) {
            console.error("ID do utilizador não encontrado:", userData);
            setLoading(false);
            navigate("/login", { replace: true });
            return;
        }

        setLoading(true);

        Promise.all([
            api.get(`/badges/conquistados/${userId}`),
            api.get(`/badges/recomendados/${userId}`),
            api
                .get(`/badges/progresso/${userId}`)
                .catch((err) => {
                    console.error(
                        "Erro ao carregar progresso das Learning Paths:",
                        err.response?.data || err.message
                    );

                    return { data: [] };
                }),
            api.get(
            `/utilizadores/dashboard/${userId}`
            )
        ])
            .then(
            ([
                progressoRes,
                recomendadosRes,
                learningPathsRes,
                dashboardRes,
            ]) => {
                console.log(
                    "BADGES CONQUISTADOS — API:",
                    progressoRes.data
                );

                const progressoNormalizado =
                    Array.isArray(
                        progressoRes.data
                    )
                        ? progressoRes.data.map(
                            normalizarBadge
                        )
                        : [];

                console.table(
                    progressoNormalizado.map(
                        (badge) => ({
                            id:
                                badge.id_badge_modelo ||
                                badge.id,

                            nome:
                                badge.nome_badge ||
                                badge.nome,

                            ganhou_bonus:
                                badge.ganhou_bonus,

                            pontos_extra:
                                badge.pontos_extra,

                            pontos_base:
                                badge.pontos,
                        })
                    )
                );

                const recomendadosNormalizados =
                    Array.isArray(
                        recomendadosRes.data
                    )
                        ? recomendadosRes.data.map(
                            normalizarBadge
                        )
                        : [];

                const badgesUnicos =
                    Array.from(
                        progressoNormalizado.reduce(
                            (mapa, badge) => {
                                const idBadge =
                                    badge.id ||
                                    badge.id_badge_modelo ||
                                    badge.badge_id;

                                const chave =
                                    String(idBadge);

                                const existente =
                                    mapa.get(chave);

                                if (!existente) {
                                    mapa.set(
                                        chave,
                                        badge
                                    );

                                    return mapa;
                                }

                                mapa.set(chave, {
                                    ...existente,
                                    ...badge,

                                    ganhou_bonus:
                                        Boolean(
                                            existente.ganhou_bonus
                                        ) ||
                                        Boolean(
                                            badge.ganhou_bonus
                                        ),

                                    pontos_extra:
                                        Math.max(
                                            Number(
                                                existente.pontos_extra ||
                                                0
                                            ),

                                            Number(
                                                badge.pontos_extra ||
                                                0
                                            )
                                        ),
                                });

                                return mapa;
                            },
                            new Map()
                        ).values()
                    );

                console.table(
                    badgesUnicos.map(
                        (badge) => ({
                            nome:
                                badge.nome_badge ||
                                badge.nome,

                            ganhou_bonus:
                                badge.ganhou_bonus,

                            pontos_extra:
                                badge.pontos_extra,
                        })
                    )
                );

                setProgressoBadges(
                    badgesUnicos
                );

                setProgressoLearningPaths(
                    Array.isArray(learningPathsRes.data)
                        ? learningPathsRes.data
                        : []
                );

                setRecomendados(
                    recomendadosNormalizados
                );

                setStats({
                    total_badges: Number(
                        dashboardRes.data
                            .total_badges ||
                        0
                    ),

                    total_pontos: badgesUnicos.reduce(
                        (total, badge) =>
                            total +
                            obterPontosTotaisBadge(
                                badge
                            ),
                        0
                    ),
                });

                carregarMarcos(
                userId,
                {
                    mostrarModal:
                    true,
                }
                );
            }
        )
            .catch(err => {
                console.error("Erro ao carregar dados:", err);
                console.error("STATUS:", err.response?.status);
                console.error("BODY:", err.response?.data);
            })
            .finally(() => {
                setLoading(false);
            });

    }, [navigate, carregarMarcos]);

    useEffect(() => {
        if (!userId) {
            return undefined;
        }

        const atualizar =
            () => {
            carregarMarcos(
                userId,
                {
                mostrarModal:
                    true,
                }
            );
            };

        window.addEventListener(
            EVENTO_NOTIFICACOES_ATUALIZADAS,
            atualizar
        );

        return () => {
            window.removeEventListener(
            EVENTO_NOTIFICACOES_ATUALIZADAS,
            atualizar
            );
        };
        }, [
        userId,
        carregarMarcos,
    ]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    const fecharCelebracao =
        async () => {
            const notificacao =
            marcoCelebracao;

            setMostrarCelebracao(
            false
            );

            setMarcoCelebracao(
            null
            );

            const idNotificacao =
            obterIdNotificacao(
                notificacao
            );

            if (idNotificacao && userId) {
                guardarMarcoCelebrado(
                    userId,
                    idNotificacao
                );

                marcosMostradosRef
                    .current
                    .add(
                        String(idNotificacao)
                    );
            }

            if (
            !idNotificacao ||
            !userId
            ) {
            return;
            }

            try {
            await api.patch(
                `/notificacoes/${idNotificacao}/lida`,
                {
                id_utilizador:
                    userId,
                }
            );

            setMarcos(
                (anteriores) =>
                anteriores.map(
                    (item) => {
                    const idItem =
                        obterIdNotificacao(
                        item
                        );

                    if (
                        String(idItem) !==
                        String(idNotificacao)
                    ) {
                        return item;
                    }

                    return {
                        ...item,
                        lida: true,
                        lido: true,
                        estado_leitura:
                        "LIDA",
                        estado_notificacao:
                        "LIDA",
                    };
                    }
                )
            );

            emitirAtualizacaoNotificacoes();
            } catch (err) {
            console.error(
                "[MARCOS] Erro ao marcar marco como visto:",
                err
            );
            }
        };

    return (
        <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />

            <div style={{ display: 'flex', flex: 1 }}>
                <LeftSidebar />

                <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                    
                    {/* Welcome Card Dinâmico */}
                    <Card className="border-0 mb-3" style={{ background: '#3b6fd4', borderRadius: 12 }}>
                        <Card.Body className="p-4 d-flex justify-content-between align-items-center text-white">
                            <div>
                                <h5 className="fw-semibold mb-3" style={{ textAlign: 'left' }}>
                                    Bom dia, {user?.nome_completo || user?.nome || "Utilizador"}!
                                </h5>
                                <div className="d-flex gap-2">
                                    <div style={cardStyleBase}>
                                        <BiMedal size={25}/>
                                        <div>
                                            <div style={{ fontSize: 10, opacity: 0.8 }}>Badges</div>
                                            {/* Usa o stats vindo da dashboard */}
                                            <div style={{ fontWeight: 600 }}>Tem {stats.total_badges} badges</div>
                                        </div>
                                    </div>
                                    <div style={cardStyleBase}>
                                        <BiStar size={25}/>
                                        <div>
                                            <div style={{ fontSize: 10, opacity: 0.8 }}>Pontos totais</div>
                                            {/* Usa o stats vindo da dashboard */}
                                            <div style={{ fontWeight: 600 }}>{stats.total_pontos} pontos</div>
                                        </div>
                                    </div>
                                    <Link to="/lembretes" style={{ ...cardStyleBase, cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
                                        <BiUserCircle size={25}/>
                                        <div style={{ fontWeight: 600 }}>Lembretes</div>
                                    </Link>
                                </div>
                            </div>
                            <WelcomeProfilePhoto user={user} size={72} />
                        </Card.Body>
                    </Card>

                    <div
                    className="d-flex justify-content-center mb-4"
                    >
                    <Button
                        variant="light"
                        onClick={() =>
                        navigate("/catalogo-badges")
                        }
                        className="d-flex align-items-center justify-content-center gap-2"
                        style={dashboardCatalogButton}
                    >
                        <BiGrid size={18} />
                        Catálogo de Badges
                    </Button>
                    </div>

                    <MarcosDashboard
                        marcos={marcos}
                    />

                    {/* Seção: Badges com Progresso */}
                    <BadgeSection 
                        title="Progresso de Learning Paths"
                        sub={`${progressoLearningPaths.length} learning path(s)`}
                        onVerTodos={() => navigate('/progresso')}
                    >
                        {progressoLearningPaths.length > 0 ? (
                            progressoLearningPaths.map((lp, i) => {
                                const percentagem = Number(lp.percentagem || 0);

                                return (
                                    <div
                                        key={lp.id_learningpaths || lp.nome_learningpath || i}
                                        style={learningPathProgressCard}
                                    >
                                        <div style={learningPathProgressTitle}>
                                            {lp.nome_learningpath || "Learning Path"}
                                        </div>

                                        <ProgressBar
                                            now={percentagem}
                                            style={{ height: 8, marginTop: 8 }}
                                        />

                                        <div style={learningPathProgressMeta}>
                                            {Number(lp.badges_conquistados || 0)} / {Number(lp.total_badges || 0)} badges concluídos • {percentagem}%
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-muted small ms-2 mb-0">
                                Sem learning paths disponíveis de momento.
                            </p>
                        )}
                    </BadgeSection>

                    <BadgeSection 
                        title="Badges Obtidos" 
                        sub={`Tem ${progressoBadges.length} badge(s)`}
                        onVerTodos={() => navigate('/catalogo-badges')}
                    >
                        {progressoBadges.length > 0 ? (
                            progressoBadges
                                .slice(0, MAX_BADGES_OBTIDOS_VISIVEIS)
                                .map((b, i) => (
                                <BadgeCard
                                    key={b.id || b.id_badge_modelo || i}
                                    name={b.nome || b.nome_badge || "Badge"}
                                    desc={b.descricao || b.descricao_badge_modelo || ""}
                                    points={obterPontosTotaisBadge(b)}
                                    imageUrl={b.imagem_url || b.imagem || b.url_imagem}
                                    progress={b.progress || b.progresso || 0}
                                    conquistado={true}
                                    ganhouBonus={b.ganhou_bonus}
                                    pontosExtra={b.pontos_extra}
                                    onClick={() => navigate(`/badge-detalhe/${b.id || b.id_badge_modelo}`)}
                                    dateConquered={
                                        b.data_atribuicao
                                            ? `Conquistado a ${new Date(b.data_atribuicao).toLocaleDateString("pt-PT")}`
                                            : "Conquistado recentemente"
                                    }
                                />
                                ))
                            ) : (
                            <p className="text-muted small ms-2">
                                Não tem badges em progresso de momento.
                            </p>
                            )}
                    </BadgeSection>

                    {/* Seção: Recomendação */}
                    <BadgeSection title="Recomendação de badge" sub="Baseado no seu perfil e área:" onVerTodos={() => navigate('/catalogo-badges')}>
                        {recomendados.length > 0 ? (
                            recomendados.map((b, i) => (
                                <BadgeCard 
                                    key={b.id || b.id_badge_modelo || i}
                                    name={b.nome || b.nome_badge || "Badge"} 
                                    desc={b.descricao || b.descricao_badge_modelo || ""} 
                                    points={b.pontos || 0}
                                    imageUrl={b.imagem_url || b.imagem || b.url_imagem}
                                    dateConquered={b.tempo_limite ? "⚠️ Pontos em Dobro (Tempo Limite)" : "Por Conquistar"} 
                                    onClick={() => navigate(`/badge-detalhe/${b.id || b.id_badge_modelo}`)}
                                />
                            ))
                        ) : (
                            <p className="text-muted small ms-2 mb-0">
                                Sem recomendações disponíveis de momento.
                            </p>
                        )}
                    </BadgeSection>
                </div>

                <RightSidebar />
            </div>

            <MarcoCelebracaoModal
                show={mostrarCelebracao}
                marco={marcoCelebracao}
                onClose={fecharCelebracao}
            />
        </div>
    );
}

// Estilo auxiliar para os mini-cards do Header Azul
const cardStyleBase = { 
    background: 'rgba(255,255,255,0.2)', 
    borderRadius: 8, 
    padding: '6px 12px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: 6, 
    fontSize: 12, 
    textAlign: 'left'
};

// --- COMPONENTES AUXILIARES (BadgeSection e BadgeCard) ---
// (Mantive a estrutura visual que enviaste, apenas injetando as props)

function BadgeSection({ title, sub, children, onVerTodos }) {
    return (
        <div className="mb-4">
            <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{title}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{sub}</div>
                </div>
                <div onClick={onVerTodos} style={{ fontSize: 12, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>                   
                    <BiMenu size={14} /> Ver Todos
                </div>
            </div>
            {children}
        </div>
    );
}

function BadgeCard({ 
    name, 
    desc, 
    points, 
    imageUrl,
    progress, 
    dateConquered, 
    conquistado = false, 
    ganhouBonus = false,
    pontosExtra = 0,
    onClick 
}) {
    return (
        <div 
            style={{ 
                background: "white", 
                border: ganhouBonus
                    ? "2px solid #d4af37"
                    : "1px solid #e5e7eb",
                borderRadius: 12, 
                marginBottom: 10, 
                overflow: 'hidden', 
                cursor: 'pointer',
                boxShadow: ganhouBonus
                    ? "0 0 0 3px rgba(212, 175, 55, 0.12)"
                    : "none"
            }} 
            onClick={onClick}
        >
            <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 20 }}>
                <BadgeImage imageUrl={imageUrl} size={70} />

                <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                            {name}
                        </div>

                        {ganhouBonus && (
                            <span
                                style={{
                                    background: "#fff7d6",
                                    color: "#9a6b00",
                                    border: "1px solid #f0d36b",
                                    borderRadius: 999,
                                    padding: "4px 10px",
                                    fontSize: 11,
                                    fontWeight: 700
                                }}
                            >
                                Tempo recorde
                            </span>
                        )}
                    </div>

                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                        {desc}
                    </div>

                    {progress !== undefined && progress > 0 && (
                        <div className="mt-2">
                            <div 
                                style={{ 
                                    width: '100%', 
                                    height: 6, 
                                    background: '#e5e7eb', 
                                    borderRadius: 999,
                                    overflow: 'hidden'
                                }}
                            >
                                <div 
                                    style={{ 
                                        width: `${progress}%`, 
                                        height: '100%', 
                                        background: '#2563eb' 
                                    }} 
                                />
                            </div>

                            <div style={{ fontSize: 10, color: '#6b7280', textAlign: 'right' }}>
                                {progress}%
                            </div>
                        </div>
                    )}
                </div>

                <div 
                    style={{ 
                        border: ganhouBonus
                            ? "1.5px solid #d4af37"
                            : "1.5px solid #d1d5db",
                        borderRadius: 10, 
                        padding: '8px 12px', 
                        textAlign: 'center', 
                        minWidth: 78,
                        background: ganhouBonus ? "#fffdf4" : "white"
                    }}
                >
                    <div
                        style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: ganhouBonus ? "#9a6b00" : "#111827"
                        }}
                    >
                        Pontos
                    </div>

                    <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>
                        {points}
                    </div>

                    {ganhouBonus && pontosExtra > 0 && (
                        <div
                            style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: "#d4a017",
                                marginTop: 2
                            }}
                        >
                            +{pontosExtra} extra
                        </div>
                    )}
                </div>
            </div>

            {dateConquered && (
                <div
                    style={{
                        borderTop: "1px solid #e5e7eb",
                        padding: "6px",
                        backgroundColor: ganhouBonus ? "#fffdf4" : "#fafafa",
                        textAlign: "center",
                        fontSize: 11,
                        color: ganhouBonus ? "#9a6b00" : (conquistado ? "#2E7D32" : "#65696f"),
                        fontWeight: 600,
                    }}
                >
                    {dateConquered}
                    {ganhouBonus && pontosExtra > 0
                        ? ` • Recebeste +${pontosExtra} pontos extra`
                        : ""}
                </div>
            )}
        </div>
    );
}

function BadgeImage({ imageUrl, size = 70 }) {
    const src = normalizarImagemSrc(imageUrl);
    const hasImage = src && String(src).trim() !== "";

    if (!hasImage) {
        return (
            <div
                style={{
                    width: size,
                    height: size,
                    borderRadius: "50%",
                    background: "#eff6ff",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexShrink: 0,
                    border: "1px solid #dbeafe",
                }}
            >
                <BiMedal size={size * 0.45} color="#f59e0b" />
            </div>
        );
    }

    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: "50%",
                background: "#eff6ff",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexShrink: 0,
                border: "1px solid #dbeafe",
                overflow: "hidden",
            }}
        >
            <img
                src={src}
                alt="Badge"
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    padding: 6,
                }}
                onError={(e) => {
                    console.error("Erro ao carregar imagem do badge:", src);

                    e.currentTarget.style.display = "none";

                    const parent = e.currentTarget.parentElement;

                    if (parent) {
                        parent.innerHTML = `
                            <div style="
                                width: 100%;
                                height: 100%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: #f59e0b;
                                font-size: 30px;
                            ">
                                🏅
                            </div>
                        `;
                    }
                }}
            />
        </div>
    );
}

function MarcosDashboard({
  marcos,
}) {
  const lista =
    Array.isArray(marcos)
      ? marcos.slice(0, 3)
      : [];

  if (lista.length === 0) {
    return null;
  }

  return (
    <div style={marcosBox}>
      <div style={marcosHeader}>
        <div>
          <div style={marcosTitle}>
            Marcos alcançados
          </div>

          <div style={marcosSubtitle}>
            Celebrações importantes do teu percurso.
          </div>
        </div>

        <span style={marcosCount}>
          {marcos.length}
        </span>
      </div>

      <div style={marcosGrid}>
        {lista.map(
          (marco, index) => (
            <MarcoMiniCard
              key={
                obterIdNotificacao(
                  marco
                ) || index
              }
              marco={marco}
            />
          )
        )}
      </div>
    </div>
  );
}

function MarcoMiniCard({
  marco,
}) {
  const tipo =
    obterTipoNotificacao(
      marco
    );

  return (
    <div style={marcoMiniCard}>
      <div style={marcoMiniIcon}>
        {obterIconeMarco(tipo)}
      </div>

      <div style={{ flex: 1 }}>
        <div style={marcoMiniTitle}>
          {formatarTituloNotificacao(
            tipo
          )}
        </div>

        <div style={marcoMiniText}>
          {obterConteudoNotificacao(
            marco
          )}
        </div>
      </div>
    </div>
  );
}

function MarcoCelebracaoModal({
  show,
  marco,
  onClose,
}) {
  if (!marco) {
    return null;
  }

  const tipo =
    obterTipoNotificacao(
      marco
    );

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      backdrop="static"
      contentClassName="marco-celebracao-content"
    >
      <div style={celebracaoContainer}>
        <button
          type="button"
          onClick={onClose}
          style={celebracaoCloseButton}
          aria-label="Fechar celebração"
        >
          ×
        </button>

        <div style={celebracaoTopGlow} />

        <div style={celebracaoIcon}>
          {obterIconeMarco(tipo)}
        </div>

        <div style={celebracaoBadge}>
          Marco alcançado
        </div>

        <h4 style={celebracaoTitle}>
          {formatarTituloNotificacao(
            tipo
          )}
        </h4>

        <p style={celebracaoText}>
          {obterConteudoNotificacao(
            marco
          )}
        </p>

        <Button
          onClick={onClose}
          style={celebracaoButton}
        >
          Celebrar!
        </Button>
      </div>

      <style>
        {`
          .marco-celebracao-content {
            border: none !important;
            border-radius: 28px !important;
            overflow: hidden !important;
            background: transparent !important;
            box-shadow: 0 24px 70px rgba(15, 23, 42, 0.35) !important;
          }
        `}
      </style>
    </Modal>
  );
}

const dashboardCatalogButton = {
  minWidth: 220,
  height: 40,
  padding: "0 18px",

  border: "1px solid #d6dbe1",
  borderRadius: 8,

  background: "#f8f9fa",
  color: "#344054",

  fontSize: 14,
  fontWeight: 500,

  boxShadow:
    "0 1px 2px rgba(0, 0, 0, 0.05)",

  transition:
    "background-color 0.15s ease, border-color 0.15s ease",
};

const learningPathProgressCard = {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
};

const learningPathProgressTitle = {
    fontSize: 13,
    fontWeight: 700,
    color: "#111827",
};

const learningPathProgressMeta = {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 6,
};

const marcosBox = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 18,
  marginBottom: 24,
  boxShadow:
    "0 2px 8px rgba(15, 23, 42, 0.04)",
};

const marcosHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 14,
};

const marcosTitle = {
  fontSize: 15,
  fontWeight: 800,
  color: "#111827",
};

const marcosSubtitle = {
  fontSize: 12,
  color: "#64748b",
  marginTop: 2,
};

const marcosCount = {
  minWidth: 28,
  height: 28,
  borderRadius: 999,
  background: "#eff6ff",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  fontWeight: 800,
};

const marcosGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const marcoMiniCard = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  border: "1px solid #dbeafe",
  background:
    "linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)",
  borderRadius: 12,
  padding: 14,
};

const marcoMiniIcon = {
  width: 42,
  height: 42,
  borderRadius: "50%",
  background: "#2563eb",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 22,
  flexShrink: 0,
};

const marcoMiniTitle = {
  fontSize: 13,
  fontWeight: 800,
  color: "#111827",
  marginBottom: 4,
};

const marcoMiniText = {
  fontSize: 12,
  color: "#475569",
  lineHeight: 1.35,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const celebracaoContainer = {
  position: "relative",
  textAlign: "center",
  padding: "42px 34px 34px",
  background:
    "radial-gradient(circle at top, #dbeafe 0%, #ffffff 48%, #f8fafc 100%)",
  borderRadius: 28,
  overflow: "hidden",
};

const celebracaoTopGlow = {
  position: "absolute",
  top: -90,
  left: "50%",
  transform: "translateX(-50%)",
  width: 220,
  height: 220,
  borderRadius: "50%",
  background:
    "rgba(37, 99, 235, 0.16)",
  filter: "blur(4px)",
  pointerEvents: "none",
};

const celebracaoCloseButton = {
  position: "absolute",
  top: 16,
  right: 18,
  width: 32,
  height: 32,
  borderRadius: "50%",
  border: "none",
  background: "rgba(15, 23, 42, 0.06)",
  color: "#475569",
  fontSize: 24,
  lineHeight: "28px",
  cursor: "pointer",
  zIndex: 2,
};

const celebracaoIcon = {
  position: "relative",
  zIndex: 1,
  width: 104,
  height: 104,
  borderRadius: "50%",
  background:
    "linear-gradient(135deg, #2563eb, #60a5fa)",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 52,
  margin: "0 auto 18px",
  boxShadow:
    "0 18px 40px rgba(37, 99, 235, 0.32)",
  border: "6px solid rgba(255, 255, 255, 0.75)",
};

const celebracaoBadge = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "5px 12px",
  borderRadius: 999,
  background: "#eff6ff",
  color: "#1d4ed8",
  fontSize: 12,
  fontWeight: 800,
  marginBottom: 12,
};

const celebracaoTitle = {
  fontSize: 24,
  fontWeight: 900,
  color: "#0f172a",
  marginBottom: 10,
  lineHeight: 1.2,
};

const celebracaoText = {
  fontSize: 14,
  color: "#475569",
  lineHeight: 1.65,
  margin: "0 auto 26px",
  maxWidth: 390,
};

const celebracaoButton = {
  background:
    "linear-gradient(135deg, #2563eb, #1d4ed8)",
  border: "none",
  borderRadius: 999,
  padding: "11px 28px",
  fontWeight: 800,
  boxShadow:
    "0 12px 24px rgba(37, 99, 235, 0.25)",
};

const welcomePhotoWrapper = {
  borderRadius: "50%",
  background: "rgba(255,255,255,0.17)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  border: "3px solid rgba(255,255,255,0.45)",
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.18)",
  flexShrink: 0,
};

const welcomePhotoImage = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

export default DashboardConsultor;