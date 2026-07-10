import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Server, 
  FileText, 
  Settings, 
  ChevronDown, 
  Menu, 
  Bell, 
  LogOut, 
  Search, 
  UserPlus, 
  Edit3, 
  Trash2, 
  X, 
  Check,
  Shield
} from 'lucide-react';
import api from './api'; // Importa a sua configuração do Axios do ficheiro api.js

export default function AccountManagement() {
  // Estados para dados da tabela e filtros
  const [accounts, setAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Estados para o Modal de Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' ou 'edit'
  const [currentUser, setCurrentUser] = useState({ id: '', name: '', email: '', role: 'Admin', status: 'Active' });

  // Carregar os dados das contas da API
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      // Exemplo de integração real com a sua API:
      // const response = await api.get('/admin/accounts');
      // setAccounts(response.data);

      // Dados estáticos temporários para desenvolvimento baseados no layout do sistema
      setAccounts([
        { id: 1, name: 'Jane Doe', email: 'jane.doe@company.com', role: 'Super Admin', status: 'Active', lastLogin: '2024-09-20, 03:33 PM' },
        { id: 2, name: 'Alex Smith', email: 'alex.smith@company.com', role: 'Admin', status: 'Active', lastLogin: '2024-09-19, 11:20 AM' },
        { id: 3, name: 'Carlos Santos', email: 'carlos.santos@company.com', role: 'Support', status: 'Inactive', lastLogin: '2024-08-15, 06:45 PM' },
        { id: 4, name: 'Marta Rodrigues', email: 'marta.r@company.com', role: 'Admin', status: 'Suspended', lastLogin: '2024-09-10, 09:12 AM' },
        { id: 5, name: 'David Vance', email: 'david.v@company.com', role: 'Analyst', status: 'Active', lastLogin: '2024-09-20, 02:15 PM' },
      ]);
    } catch (error) {
      console.error("Erro ao carregar contas:", error);
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal para nova conta
  const openCreateModal = () => {
    setModalMode('create');
    setCurrentUser({ id: '', name: '', email: '', role: 'Admin', status: 'Active' });
    setIsModalOpen(true);
  };

  // Abrir modal para editar conta existente
  const openEditModal = (user) => {
    setModalMode('edit');
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  // Guardar dados (Criar ou Atualizar) via API
  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        // Exemplo API: await api.post('/admin/accounts', currentUser);
        const newId = accounts.length ? Math.max(...accounts.map(a => a.id)) + 1 : 1;
        setAccounts([...accounts, { ...currentUser, id: newId, lastLogin: 'Never' }]);
      } else {
        // Exemplo API: await api.put(`/admin/accounts/${currentUser.id}`, currentUser);
        setAccounts(accounts.map(a => a.id === currentUser.id ? currentUser : a));
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao guardar utilizador:", error);
    }
  };

  // Eliminar uma conta
  const handleDeleteAccount = async (id) => {
    if (window.confirm("Tem a certeza que deseja eliminar esta conta de administrador?")) {
      try {
        // Exemplo API: await api.delete(`/admin/accounts/${id}`);
        setAccounts(accounts.filter(a => a.id !== id));
      } catch (error) {
        console.error("Erro ao eliminar conta:", error);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  // Filtrar contas com base na barra de pesquisa
  const filteredAccounts = accounts.filter(account => 
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.dashboardContainer}>
      
      {/* 1. SIDEBAR LATERAL */}
      <aside style={styles.sidebar}>
        <div style={styles.logoArea}>ADMIN DASHBOARD</div>
        
        <div style={styles.userCard}>
          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" alt="Avatar" style={styles.avatar} />
          <div style={styles.userInfoContainer}>
            <span style={styles.userName}>Jane Doe</span>
            <span style={styles.userRole}>Super Admin</span>
          </div>
          <ChevronDown size={16} color="#9ca3af" style={{ marginLeft: 'auto' }} />
        </div>

        <nav style={styles.navMenu}>
          <div style={styles.navItem}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </div>
          <div style={{ ...styles.navItem, ...styles.navItemActive }}>
            <Users size={18} />
            <span>Users & Accounts</span>
          </div>
          <div style={styles.navItemDropdown}>
            <div style={styles.navItemSplit}>
              <Server size={18} />
              <span>Services</span>
            </div>
            <ChevronDown size={14} />
          </div>
          <div style={styles.navItem}>
            <FileText size={18} />
            <span>Logs</span>
          </div>
          <div style={styles.navItemDropdown}>
            <div style={styles.navItemSplit}>
              <Settings size={18} />
              <span>Settings</span>
            </div>
            <ChevronDown size={14} />
          </div>
        </nav>
      </aside>

      {/* 2. ÁREA PRINCIPAL */}
      <main style={styles.mainContent}>
        
        {/* Barra Superior */}
        <header style={styles.topbar}>
          <button style={styles.iconButton}><Menu size={20} color="#ffffff" /></button>
          <div style={styles.topbarActions}>
            <div style={styles.notificationWrapper}>
              <button style={styles.iconButton}><Bell size={20} color="#ffffff" /></button>
              <span style={styles.notificationDot}></span>
            </div>
            <button onClick={handleLogout} style={{ ...styles.iconButton, ...styles.logoutButton }}>
              <LogOut size={20} color="#ffffff" />
            </button>
          </div>
        </header>

        {/* Conteúdo da Gestão de Contas */}
        <div style={styles.pageContent}>
          
          <div style={styles.headerRow}>
            <div>
              <h1 style={styles.pageTitle}>Account Management</h1>
              <p style={styles.pageSubtitle}>Gerencie as credenciais, permissões e níveis de acesso dos administradores do sistema.</p>
            </div>
            
            {/* Botão Criar Conta */}
            <button onClick={openCreateModal} style={styles.btnCreate}>
              <UserPlus size={16} style={{ marginRight: 8 }} /> Add New Account
            </button>
          </div>

          {/* Barra de Filtros e Pesquisa */}
          <div style={styles.filterSection}>
            <div style={styles.searchWrapper}>
              <Search size={16} style={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Pesquisar por nome, email ou cargo..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>

          {/* Tabela de Contas */}
          <section style={styles.tableSection}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Administrator</th>
                  <th style={styles.th}>Email Address</th>
                  <th style={styles.th}>Role / Permission</th>
                  <th style={styles.th}>Last Login</th>
                  <th style={styles.th}>Status</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => (
                  <tr key={account.id} style={styles.tableRow}>
                    <td style={styles.td}>
                      <div style={styles.tableUserCell}>
                        <div style={styles.tableAvatarPlaceholder}>
                          {account.name.charAt(0)}
                        </div>
                        <span style={{ fontWeight: '500' }}>{account.name}</span>
                      </div>
                    </td>
                    <td style={styles.td}>{account.email}</td>
                    <td style={styles.td}>
                      <span style={styles.roleContainer}>
                        <Shield size={12} style={{ marginRight: 6, color: '#3b82f6' }} />
                        {account.role}
                      </span>
                    </td>
                    <td style={styles.td}>{account.lastLogin}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        ...(account.status === 'Active' && styles.badgeActive),
                        ...(account.status === 'Inactive' && styles.badgeInactive),
                        ...(account.status === 'Suspended' && styles.badgeSuspended),
                      }}>
                        {account.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionButtonsContainer}>
                        <button onClick={() => openEditModal(account)} style={styles.btnTableEdit}>
                          <Edit3 size={13} />
                        </button>
                        <button onClick={() => handleDeleteAccount(account.id)} style={styles.btnTableDelete}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAccounts.length === 0 && (
                  <tr>
                    <td colSpan="6" style={styles.emptyRow}>Nenhum administrador encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </div>
      </main>

      {/* 3. MODAL DINÂMICO (CRIAR / EDITAR CONTA) */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {modalMode === 'create' ? 'Create Admin Account' : 'Edit Admin Account'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={currentUser.name} 
                  onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})}
                  style={styles.input}
                  placeholder="Ex: John Doe"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={currentUser.email} 
                  onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                  style={styles.input}
                  placeholder="john.doe@company.com"
                />
              </div>

              <div style={styles.formRow}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Role / Level</label>
                  <select 
                    value={currentUser.role} 
                    onChange={(e) => setCurrentUser({...currentUser, role: e.target.value})}
                    style={styles.select}
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Admin">Admin</option>
                    <option value="Support">Support</option>
                    <option value="Analyst">Analyst</option>
                  </select>
                </div>

                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Account Status</label>
                  <select 
                    value={currentUser.status} 
                    onChange={(e) => setCurrentUser({...currentUser, status: e.target.value})}
                    style={styles.select}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={styles.btnCancel}>
                  Cancel
                </button>
                <button type="submit" style={styles.btnSave}>
                  <Check size={16} style={{ marginRight: 6 }} /> Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Estilos baseados na mesma estrutura Dark Theme unificada
const styles = {
  dashboardContainer: {
    display: 'flex',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#1a1f26',
    color: '#f3f4f6',
    fontFamily: 'Inter, system-ui, sans-serif',
    margin: 0,
    overflowX: 'hidden',
  },
  sidebar: {
    width: '260px',
    backgroundColor: '#13171c',
    borderRight: '1px solid #222933',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    boxSizing: 'border-box',
  },
  logoArea: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '32px',
    paddingLeft: '8px',
    letterSpacing: '1px',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#1c222b',
    borderRadius: '12px',
    marginBottom: '32px',
    border: '1px solid #2a3342',
  },
  avatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    objectFit: 'cover',
    marginRight: '12px',
  },
  userInfoContainer: { display: 'flex', flexDirection: 'column' },
  userName: { fontSize: '14px', fontWeight: '600', color: '#ffffff' },
  userRole: { fontSize: '11px', color: '#9ca3af' },
  navMenu: { display: 'flex', flexDirection: 'column', gap: '8px' },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#9ca3af',
  },
  navItemActive: { backgroundColor: '#232a35', color: '#ffffff', fontWeight: '500' },
  navItemDropdown: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderRadius: '10px',
    color: '#9ca3af',
    fontSize: '14px',
  },
  navItemSplit: { display: 'flex', alignItems: 'center', gap: '12px' },
  mainContent: { flex: 1, display: 'flex', flexDirection: 'column' },
  topbar: {
    height: '70px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    backgroundColor: '#13171c',
    borderBottom: '1px solid #222933',
  },
  topbarActions: { display: 'flex', alignItems: 'center', gap: '16px' },
  iconButton: { background: 'none', border: 'none', cursor: 'pointer', padding: '6px' },
  logoutButton: { backgroundColor: '#232a35', borderRadius: '8px', display: 'flex', alignItems: 'center', padding: '6px' },
  notificationWrapper: { position: 'relative' },
  notificationDot: { position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%' },
  
  // Layout Conteúdo Geral
  pageContent: { padding: '32px', flex: 1 },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' },
  pageTitle: { fontSize: '26px', fontWeight: '700', color: '#ffffff', margin: 0 },
  pageSubtitle: { fontSize: '14px', color: '#9ca3af', marginTop: '6px', margin: 0 },
  
  btnCreate: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
  },

  // Barra de Pesquisa
  filterSection: { marginBottom: '20px' },
  searchWrapper: { position: 'relative', width: '100%', maxWidth: '400px' },
  searchIcon: { position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)', color: '#6b7280' },
  searchInput: {
    width: '100%',
    backgroundColor: '#13171c',
    border: '1px solid #222933',
    borderRadius: '10px',
    padding: '11px 16px 11px 42px',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
  },

  // Tabela de Dados
  tableSection: {
    backgroundColor: '#1c222b',
    borderRadius: '16px',
    border: '1px solid #222933',
    overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' },
  th: {
    padding: '16px 24px',
    backgroundColor: '#13171c',
    color: '#9ca3af',
    fontWeight: '600',
    borderBottom: '1px solid #222933',
    textTransform: 'uppercase',
    fontSize: '11px',
    letterSpacing: '0.5px',
  },
  tableRow: { borderBottom: '1px solid #222933' },
  td: { padding: '14px 24px', color: '#cbd5e1', verticalAlign: 'middle' },
  tableUserCell: { display: 'flex', alignItems: 'center', gap: '12px', color: '#ffffff' },
  tableAvatarPlaceholder: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#2a3342',
    color: '#3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '12px',
  },
  roleContainer: { display: 'flex', alignItems: 'center', fontSize: '13px', color: '#ffffff' },
  
  // Status Badges
  statusBadge: { padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', display: 'inline-block' },
  badgeActive: { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' },
  badgeInactive: { backgroundColor: 'rgba(107, 114, 128, 0.15)', color: '#9ca3af' },
  badgeSuspended: { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
  
  actionButtonsContainer: { display: 'flex', gap: '8px', justifyContent: 'center' },
  btnTableEdit: { background: '#222933', border: '1px solid #2a3342', color: '#3b82f6', padding: '6px', borderRadius: '6px', cursor: 'pointer' },
  btnTableDelete: { background: '#222933', border: '1px solid #2a3342', color: '#ef4444', padding: '6px', borderRadius: '6px', cursor: 'pointer' },
  emptyRow: { padding: '32px', textAlign: 'center', color: '#6b7280' },

  // Estilos do Modal Pop-up Overlay
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  modalCard: {
    backgroundColor: '#1c222b',
    border: '1px solid #2a3342',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '500px',
    padding: '24px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  modalTitle: { fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0 },
  modalCloseBtn: { background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  formRow: { display: 'flex', gap: '16px' },
  label: { fontSize: '12px', color: '#9ca3af', fontWeight: '500' },
  input: {
    backgroundColor: '#13171c', border: '1px solid #222933', borderRadius: '8px',
    padding: '10px 14px', color: '#ffffff', fontSize: '13px', outline: 'none'
  },
  select: {
    backgroundColor: '#13171c', border: '1px solid #222933', borderRadius: '8px',
    padding: '10px 14px', color: '#ffffff', fontSize: '13px', outline: 'none', cursor: 'pointer'
  },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' },
  btnCancel: { backgroundColor: 'transparent', border: '1px solid #222933', color: '#9ca3af', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  btnSave: { backgroundColor: '#3b82f6', border: 'none', color: '#ffffff', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center' }
};