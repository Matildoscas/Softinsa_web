import { useState } from "react";
import { Card, Button, ProgressBar, Spinner, Nav } from 'react-bootstrap';
import { BiMedal, BiStar, BiUserCircle, BiGrid, BiMenu, BiUser, BiBell, BiSearch, BiLogOut, BiTrendingUp, BiTrendingDown, BiDotsHorizontalRounded } from 'react-icons/bi';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

// ─── STATIC DATA (substituir por chamadas à API quando BD estiver disponível) ───

// api.get(`/dashboard/admin`) → statsData
const statsData = {
    total_consultores: 215,
    total_consultores_trend: "+8% este mês",
    total_badges_atribuidos: 945,
    total_badges_trend: "+12% esta semana",
    total_badges: 73,
    total_badges2_trend: "+5% esta semana",
};

// api.get(`/utilizadores/admin-info`) → adminUser
const adminUser = {
    nome_completo: "Administrador",
    total_consultores: 145,
    service_line_leaders: 15,
    talent_managers: 4,
    total_badges: 78,
};

// api.get(`/charts/consultores-anuais`) → lineChartData
const lineChartData = [
    { mes: 'Jan', este_ano: 100, ano_passado: 80 },
    { mes: 'Fev', este_ano: 130, ano_passado: 95 },
    { mes: 'Mar', este_ano: 120, ano_passado: 110 },
    { mes: 'Abr', este_ano: 160, ano_passado: 130 },
    { mes: 'Mai', este_ano: 210, ano_passado: 150 },
    { mes: 'Jun', este_ano: 190, ano_passado: 170 },
    { mes: 'Jul', este_ano: 260, ano_passado: 200 },
];

// api.get(`/charts/consultores-por-area`) → barChartData
const barChartData = [
    { area: 'Hybrid Cloud', total: 55 },
    { area: 'App Operations', total: 92 },
    { area: 'Sourcing & Talent', total: 68 },
];

// api.get(`/charts/atividade-consultores`) → pieData
const pieData = [
    { name: 'Consultores Ativos', value: 91.5 },
    { name: 'Consultores Inativos', value: 8.5 },
];
const PIE_COLORS = ['#2563eb', '#93c5fd'];

// api.get(`/notificacoes/admin/recentes`) → notifications
const notifications = [
    { id: 1, titulo: 'Editou Políticas de RGPD', tempo: 'Agora', icon: 'settings' },
    { id: 2, titulo: 'Atualizou um perfil de acesso', tempo: '59 minutos atrás', icon: 'user' },
    { id: 3, titulo: 'Resolveu problemas técnicos', tempo: '10 horas atrás', icon: 'settings' },
];

// api.get(`/utilizadores/top-badges`) → topUtilizadores
const topUtilizadores = [
    { id: 1, nome: 'Patricia Mendes', cargo: 'Talent Manager', badges: 15 },
    { id: 2, nome: 'Fernando Costa', cargo: 'Consultor', badges: 12 },
    { id: 3, nome: 'Miguel Silva', cargo: 'Consultor', badges: 5 },
];

// ─── LEFT SIDEBAR (Admin) ────────────────────────────────────────────────────

const adminMenuItems = [
    { label: 'Main Page', to: '/admin' },
    {
        label: 'Gestão de contas', to: '#', children: [
            { label: 'Gestão de Learning Paths', to: '/admin/learning-paths' },
            { label: 'Gestão de Service Lines', to: '/admin/service-lines' },
            { label: 'Gestão de Areas', to: '/admin/areas' },
            { label: 'Gestão de Badges', to: '/admin/badges' },
            { label: 'Informações Gerénricas e Avisos', to: '/admin/avisos' },
            { label: 'Políticas de RGPD', to: '/admin/rgpd' },
        ]
    },
    { label: 'Configurar notificações', to: '/admin/notificacoes' },
];

function AdminLeftSidebar() {
    const [openGroups, setOpenGroups] = useState(['Gestão de contas']);

    const toggle = (label) => {
        setOpenGroups(prev =>
            prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
        );
    };

    return (
        <div style={{ width: 240, background: 'white', borderRight: '1px solid #e5e7eb', padding: '10px 0', flexShrink: 0, overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px 14px' }}>
                <BiUserCircle size={28} color="#6b7280" />
                <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Administrador</span>
            </div>
            <div style={{ fontSize: 9, fontWeight: 600, color: '#9ca3af', padding: '0 16px 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pages</div>

            {adminMenuItems.map((item) => (
                <div key={item.label}>
                    {item.children ? (
                        <>
                            <div
                                onClick={() => toggle(item.label)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '8px 16px', fontSize: 13, color: '#4b5563', cursor: 'pointer',
                                    userSelect: 'none'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <BiGrid size={15} />
                                    <span>{item.label}</span>
                                </div>
                                <span style={{ fontSize: 10 }}>{openGroups.includes(item.label) ? '▲' : '▼'}</span>
                            </div>
                            {openGroups.includes(item.label) && item.children.map(child => (
                                <NavLink
                                    key={child.label}
                                    to={child.to}
                                    style={({ isActive }) => ({
                                        display: 'block', padding: '6px 16px 6px 36px', fontSize: 12,
                                        color: isActive ? '#2563eb' : '#6b7280', textDecoration: 'none',
                                        background: isActive ? '#eff6ff' : 'transparent',
                                        borderRight: isActive ? '3px solid #2563eb' : '3px solid transparent',
                                    })}
                                >
                                    {child.label}
                                </NavLink>
                            ))}
                        </>
                    ) : (
                        <NavLink
                            to={item.to}
                            end
                            style={({ isActive }) => ({
                                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                                fontSize: 13, textDecoration: 'none', color: isActive ? '#2563eb' : '#4b5563',
                                backgroundColor: isActive ? '#eff6ff' : 'transparent',
                                borderRight: isActive ? '3px solid #2563eb' : '3px solid transparent',
                                fontWeight: isActive ? 600 : 400,
                            })}
                        >
                            <BiGrid size={16} />
                            <span>{item.label}</span>
                        </NavLink>
                    )}
                </div>
            ))}
        </div>
    );
}

// ─── HEADER ──────────────────────────────────────────────────────────────────

function AdminHeader() {
    const navigate = useNavigate();

    const handleLogout = () => {
        // api: localStorage.clear() + navigate('/login')
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', height: 52, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16, flexShrink: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 18, color: '#111827', letterSpacing: '-0.5px' }}>
                <span style={{ color: '#111827' }}>SOFT</span><span style={{ color: '#2563eb' }}>INSA</span>
            </span>

            <div style={{ position: 'relative', marginLeft: 20, flex: 1, maxWidth: 500 }}>
                <BiSearch size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                <input
                    type="text"
                    placeholder="Pesquisar..."
                    style={{
                        paddingLeft: 32, paddingRight: 12, height: 34, border: '1px solid #e5e7eb',
                        borderRadius: 10, fontSize: 14, width: '100%', outline: 'none',
                        color: '#374151', background: '#f9fafb'
                    }}
                />
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <BiBell size={18} color="white" />
                </div>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <BiUserCircle size={20} color="white" />
                </div>
            </div>
        </div>
    );
}

// ─── RIGHT SIDEBAR ───────────────────────────────────────────────────────────

function AdminRightSidebar() {
    return (
        <div style={{ width: 260, background: 'white', borderLeft: '1px solid #e5e7eb', padding: 16, flexShrink: 0, overflowY: 'auto' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#2563eb', marginBottom: 12 }}>Notificações</div>

            {notifications.map(n => (
                <div key={n.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', marginBottom: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <BiUser size={14} color="#2563eb" />
                    </div>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{n.titulo}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{n.tempo}</div>
                    </div>
                </div>
            ))}

            <div style={{ textAlign: 'right', marginTop: 4 }}>
                <a href="/admin/notificacoes" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>Ver todas as notificações</a>
            </div>

            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '20px 0 12px' }}>Top Utilizadores</div>

            {topUtilizadores.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <BiUserCircle size={24} color="#6b7280" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{u.nome}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>Cargo: {u.cargo}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{u.badges} badges</div>
                    </div>
                </div>
            ))}

            <div style={{ textAlign: 'center', marginTop: 8 }}>
                <a href="/admin/utilizadores" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <BiGrid size={14} /> Ver Todos
                </a>
            </div>
        </div>
    );
}

// ─── STAT CARD ───────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, trend, positive = true }) {
    return (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{value}</div>
                <div style={{ fontSize: 13, color: '#374151' }}>{label}</div>
                {trend && (
                    <div style={{ fontSize: 11, color: positive ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', gap: 2, marginTop: 2 }}>
                        {positive ? <BiTrendingUp size={13} /> : <BiTrendingDown size={13} />} {trend}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── CHART TAB SELECTOR ──────────────────────────────────────────────────────

function ChartTabs({ tabs, active, onChange }) {
    return (
        <div style={{ display: 'flex', gap: 0 }}>
            {tabs.map(t => (
                <button
                    key={t}
                    onClick={() => onChange(t)}
                    style={{
                        border: 'none', background: 'none', fontSize: 13, padding: '4px 10px',
                        color: active === t ? '#111827' : '#9ca3af',
                        fontWeight: active === t ? 600 : 400,
                        borderBottom: active === t ? '2px solid #2563eb' : '2px solid transparent',
                        cursor: 'pointer'
                    }}
                >
                    {t}
                </button>
            ))}
        </div>
    );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

function PaginaPrincipalAdmin() {
    const [activeTab, setActiveTab] = useState('Total Consultores');

    const chartLineKey = activeTab === 'Total Consultores'
        ? { key: 'este_ano', label: 'Este ano' }
        : activeTab === 'Total Learning Paths'
            ? { key: 'este_ano', label: 'Este ano' }
            : { key: 'este_ano', label: 'Este ano' };

    return (
        <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <AdminHeader />

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <AdminLeftSidebar />

                <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

                    {/* Welcome Card */}
                    <Card className="border-0 mb-4" style={{ background: '#1e3a6e', borderRadius: 12 }}>
                        <Card.Body className="p-4 text-white">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h5 style={{ fontWeight: 600, marginBottom: 16 }}>Bom dia, {adminUser.nome_completo}!</h5>
                                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                        <WelcomeStat icon={<BiUserCircle size={20} />} label="Consultores" value={`Tem ${adminUser.total_consultores} consultores`} />
                                        <WelcomeStat icon={<BiUser size={20} />} label="Service Line Leaders" value={`Tem ${adminUser.service_line_leaders} S.L.L`} />
                                        <WelcomeStat icon={<BiUser size={20} />} label="Talent Managers" value={`Tem ${adminUser.talent_managers} T.M.`} />
                                        <WelcomeStat icon={<BiMedal size={20} />} label="Badges" value={`Tem ${adminUser.total_badges} badges`} />
                                        <button style={{
                                            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                                            borderRadius: 8, padding: '6px 14px', color: 'white', fontSize: 12,
                                            fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                                        }}>
                                            <BiGrid size={16} /> Pedidos Badges
                                        </button>
                                    </div>
                                </div>
                                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <BiUserCircle size={50} color="rgba(255,255,255,0.8)" />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Stat Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                        <StatCard
                            icon={<BiUserCircle size={26} color="#2563eb" />}
                            label="Consultores"
                            value={statsData.total_consultores}
                            trend={statsData.total_consultores_trend}
                        />
                        <StatCard
                            icon={<BiMedal size={26} color="#2563eb" />}
                            label="Badges atribuídos"
                            value={statsData.total_badges_atribuidos}
                            trend={statsData.total_badges_trend}
                        />
                        <StatCard
                            icon={<BiStar size={26} color="#2563eb" />}
                            label="Total Badges"
                            value={statsData.total_badges}
                            trend={statsData.total_badges2_trend}
                        />
                    </div>

                    {/* Charts Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 24 }}>

                        {/* Line Chart */}
                        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <ChartTabs
                                    tabs={['Total Consultores', 'Total Learning Paths', 'Badges atribuídos']}
                                    active={activeTab}
                                    onChange={setActiveTab}
                                />
                                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#6b7280' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span style={{ width: 24, height: 2, background: '#2563eb', display: 'inline-block', borderRadius: 2 }} /> Este ano
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span style={{ width: 24, height: 2, background: '#d1d5db', display: 'inline-block', borderRadius: 2, borderStyle: 'dashed' }} /> Ano Passado
                                    </span>
                                </div>
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={lineChartData}>
                                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="este_ano" stroke="#2563eb" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="ano_passado" stroke="#d1d5db" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Pie Chart */}
                        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Atividade dos Consultores</div>
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" startAngle={90} endAngle={-270}>
                                        {pieData.map((entry, index) => (
                                            <Cell key={index} fill={PIE_COLORS[index]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v) => `${v}%`} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                                {pieData.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#374151' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[i], display: 'inline-block' }} />
                                            {item.name}
                                        </span>
                                        <span style={{ fontWeight: 600 }}>{item.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Bar + Area breakdown */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                        {/* Bar Chart */}
                        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Total de consultores em cada área</div>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={barChartData} barSize={36}>
                                    <XAxis dataKey="area" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                    <Tooltip />
                                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                        {barChartData.map((_, i) => (
                                            <Cell key={i} fill={i === 1 ? '#06b6d4' : i === 2 ? '#111827' : '#93c5fd'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Area breakdown list */}
                        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Detalhes por Área</div>
                            {[
                                { area: 'Hybrid Cloud – LowCode (Outsystems)', total: 55, color: '#93c5fd' },
                                { area: 'Application Operations, DevSecOps & IT Automation – DevOps', total: 92, color: '#06b6d4' },
                                { area: 'Sourcing & Talent Management Sourcing & Talent Management', total: 68, color: '#111827' },
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                                    <span style={{ fontSize: 12, color: '#374151', flex: 1 }}>{item.area}</span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{item.total}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                <AdminRightSidebar />
            </div>
        </div>
    );
}

// ─── SMALL HELPER ────────────────────────────────────────────────────────────

function WelcomeStat({ icon, label, value }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 12px',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 12
        }}>
            {icon}
            <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 10, opacity: 0.8 }}>{label}</div>
                <div style={{ fontWeight: 600 }}>{value}</div>
            </div>
        </div>
    );
}

export default PaginaPrincipalAdmin;