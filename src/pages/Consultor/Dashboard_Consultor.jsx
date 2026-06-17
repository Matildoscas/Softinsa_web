import { useState, useEffect } from "react";
import { Card, Button, Spinner } from 'react-bootstrap';
import { BiMedal, BiStar, BiUserCircle, BiGrid, BiMenu } from 'react-icons/bi';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api.js'; // Garante que o caminho está correto

// Importação dos teus componentes estruturais
import Header from '../../components/header.jsx';
import RightSidebar from '../../components/right_sidebar.jsx';
import LeftSidebar from '../../components/left_sidebar.jsx';
//import ImagemBadge from '../../assets/Cybersecurity_Badge.png';

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

function normalizarBadge(badge) {
    const imagemSrc = normalizarImagemSrc(
        badge.imagem_url || badge.imagem || badge.url_imagem
    );

    return {
        ...badge,
        imagem_url: imagemSrc,
        imagem: imagemSrc,
    };
}

function PaginaPrincipal() {
    const navigate = useNavigate();
    
    // Estados para os dados da BD
    const [user, setUser] = useState(null);
    const [progressoBadges, setProgressoBadges] = useState([]);
    const [recomendados, setRecomendados] = useState([]);
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({ total_badges: 0, total_pontos: 0 });

    useEffect(() => {
        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
            setLoading(false);
            navigate("/login", { replace: true });
            return;
        }

        const userData = JSON.parse(storedUser);
        setUser(userData);

        const userId = userData.id_utilizador || userData.ID_UTILIZADOR;

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
            api.get(`/dashboard/${userId}`)
        ])
            .then(([progressoRes, recomendadosRes, dashboardRes]) => {
                const progressoNormalizado = progressoRes.data.map(normalizarBadge);
                const recomendadosNormalizados = recomendadosRes.data.map(normalizarBadge);

                console.log("BADGES CONQUISTADOS:", progressoNormalizado);
                console.log("BADGES RECOMENDADOS:", recomendadosNormalizados);

                const badgesUnicos = progressoNormalizado.filter(
                    (badge, index, self) => {
                        const idBadge = badge.id || badge.id_badge_modelo || badge.badge_id;

                        return index === self.findIndex((b) => {
                            const outroId = b.id || b.id_badge_modelo || b.badge_id;
                            return outroId === idBadge;
                        });
                    }
                );

                setProgressoBadges(badgesUnicos);
                setRecomendados(recomendadosNormalizados);

                setProgressoBadges(badgesUnicos);
                setRecomendados(recomendadosRes.data);

                setStats({
                    total_badges: Number(dashboardRes.data.total_badges || 0),
                    total_pontos: Number(dashboardRes.data.total_pontos || 0)
                });
            })
            .catch(err => {
                console.error("Erro ao carregar dados:", err);
                console.error("STATUS:", err.response?.status);
                console.error("BODY:", err.response?.data);
            })
            .finally(() => {
                setLoading(false);
            });

    }, [navigate]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
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
                            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <BiUserCircle size={50} color="rgba(255,255,255,0.8)" />
                            </div>
                        </Card.Body>
                    </Card>

                    <div className="text-center mb-4">
                        <Button variant="white" onClick={() => navigate('/catalogo-badges')} className="rounded-pill px-4 shadow-sm border d-flex align-items-center gap-2 mx-auto" style={{ fontSize: 15, fontWeight: 600 }}>
                            <BiGrid size={20} /> Catálogo de Badges
                        </Button>
                    </div>

                    {/* Seção: Badges com Progresso */}
                    <BadgeSection 
                        title="Badges Obtidos" 
                        sub={`Tem ${progressoBadges.length} badge(s)`}
                        onVerTodos={() => navigate('/catalogo-badges')}
                    >
                        {progressoBadges.length > 0 ? (
                            progressoBadges.map((b, i) => (
                                <BadgeCard
                                    key={b.id || b.id_badge_modelo || i}
                                    name={b.nome || b.nome_badge || "Badge"}
                                    desc={b.descricao || b.descricao_badge_modelo || ""}
                                    points={b.pontos || 0}
                                    imageUrl={b.imagem_url || b.imagem || b.url_imagem}
                                    progress={b.progress || b.progresso || 0}
                                    conquistado={true}
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
                        {recomendados.map((b, i) => (
                            <BadgeCard 
                                key={b.id || b.id_badge_modelo || i}
                                name={b.nome || b.nome_badge || "Badge"} 
                                desc={b.descricao || b.descricao_badge_modelo || ""} 
                                points={b.pontos || 0}
                                imageUrl={b.imagem_url || b.imagem || b.url_imagem}
                                dateConquered={b.tempo_limite ? "⚠️ Pontos em Dobro (Tempo Limite)" : "Por Conquistar"} 
                                onClick={() => navigate(`/badge-detalhe/${b.id || b.id_badge_modelo}`)}
                            />
                        ))}
                    </BadgeSection>
                </div>

                <RightSidebar />
            </div>
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
    onClick 
}) {
    return (
        <div 
            style={{ 
                background: "white", 
                border: "1px solid #e5e7eb", 
                borderRadius: 12, 
                marginBottom: 10, 
                overflow: 'hidden', 
                cursor: 'pointer' 
            }} 
            onClick={onClick}
        >
            <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 20 }}>
                <BadgeImage imageUrl={imageUrl} size={70} />

                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                        {name}
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
                        border: '1.5px solid #d1d5db', 
                        borderRadius: 10, 
                        padding: '5px 10px', 
                        textAlign: 'center', 
                        minWidth: 60 
                    }}
                >
                    <div style={{ fontSize: 10, fontWeight: 600 }}>Pontos</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{points}</div>
                </div>
            </div>

            {dateConquered && (
                <div
                    style={{
                        borderTop: "1px solid #e5e7eb",
                        padding: "6px",
                        backgroundColor: "#fafafa",
                        textAlign: "center",
                        fontSize: 11,
                        color: conquistado ? "#2E7D32" : "#65696f",
                        fontWeight: 600,
                    }}
                >
                    {dateConquered}
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

export default PaginaPrincipal;