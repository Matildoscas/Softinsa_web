import { Container, Button } from 'react-bootstrap';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

// Importação dos componentes estruturais corrigidos
import Header from '../../components/Header.jsx';
import RightSidebar from '../../components/RightSidebar.jsx';
import LeftSidebar from '../../components/LeftSidebar.jsx';

function LembretePage() {
    const navigate = useNavigate();
    
    return (
        <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Navbar */}
            <Header />

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <LeftSidebar />

                {/* Main Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                    {/* Botão voltar ajustado para regressar à Dashboard principal */}
                    <Button 
                        variant="link" 
                        className="d-flex align-items-center text-decoration-none p-0 mb-3"
                        style={{ color: '#4A5568', fontSize: '1.1rem' }}
                        onClick={() => navigate('/pag_consultor')}
                    >
                        <HiOutlineArrowLeft className="me-1" />
                        <span style={{ fontWeight: '400' }}>Voltar</span>
                    </Button>

                    <LembreteSection>
                        <LembreteCard 
                            name="Ana Maria" 
                            title="Atualizou o perfil de acesso" 
                            desc="Automation & Deployment (CI/CD)" 
                            meta="Script Initiate · Nível A" 
                            time="35 minutos atrás" 
                        />
                    </LembreteSection>
                </div>

                {/* Right Panel */}
                <RightSidebar />
                
            </div>
        </div>
    );
}

function LembreteCard({ name, title, desc, meta, time }) {
  return (
    <div className="d-flex bg-white border rounded px-4 py-3 mb-2 gap-3" style={{ alignItems: "stretch" }}>

      {/* Esquerda: Avatar + meta + tempo */}
      <div className="d-flex flex-column align-items-center gap-1" style={{ minWidth: 80 }}>
        <div
          className="rounded-circle bg-secondary-subtle d-flex align-items-center justify-content-center"
          style={{ width: 44, height: 44 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="#8a96a8" viewBox="0 0 24 24">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
          </svg>
        </div>
        <span className="text-muted text-center" style={{ fontSize: "0.72rem", lineHeight: 1.4 }}>{meta}</span>
        <span className="text-secondary text-center" style={{ fontSize: "0.70rem" }}>{time}</span>
      </div>

      {/* Divisor vertical */}
      <div className="border-start" />

      {/* Centro: Título + Descrição */}
      <div className="flex-grow-1 d-flex flex-column justify-content-center">
        <div className="fw-semibold text-dark" style={{ fontSize: "0.9rem" }}>{title}</div>
        <div className="text-muted" style={{ fontSize: "0.82rem" }}>{desc}</div>
      </div>

      {/* Abrir alinhado em baixo */}
      <div className="d-flex align-items-end">
        <a href="#" className="text-primary small text-decoration-none">Abrir</a>
      </div>

    </div>
  );
}

function LembreteSection({ children }) {
  return <div>{children}</div>;
}

export default LembretePage;