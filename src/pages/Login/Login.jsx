import React, { useState } from "react";
import { Container, Row, Col, Card, Form, Button, InputGroup, Alert, Spinner } from "react-bootstrap";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api"; // Importa a instância do Axios configurada anteriormente
import ImagemLogin from "../../assets/imagem_login.png";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Preencha o email e a password!");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      const data = response.data;

      if (data.token) {
        localStorage.setItem("token", data.token);

        const apiUser = data.user || {};
        const utilizadorSeguro = {
          id_utilizador: apiUser.id_utilizador || apiUser.ID_UTILIZADOR || data.id_utilizador || data.ID_UTILIZADOR,
          nome_completo: apiUser.nome_completo || apiUser.NOME_COMPLETO || data.nome_completo || data.NOME_COMPLETO,
          email: apiUser.email || apiUser.EMAIL || data.email || data.EMAIL,
          email_softinsa: apiUser.email_softinsa || apiUser.EMAIL_SOFTINSA || data.email_softinsa || data.EMAIL_SOFTINSA,
          estado_conta: apiUser.estado_conta || apiUser.ESTADO_CONTA || data.estado_conta || data.ESTADO_CONTA,
          tipo_utilizador: apiUser.tipo_utilizador || data.tipo_utilizador || "utilizador",
        };

        localStorage.setItem("user", JSON.stringify(utilizadorSeguro));

        const tipo = String(utilizadorSeguro.tipo_utilizador || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");

        if (tipo.includes("administrador") || tipo.includes("admin")) {
          navigate("/admin");
        } else if (tipo.includes("talent_manager") || tipo.includes("talentmanager")) {
          navigate("/talent_manager");
        } else if (tipo.includes("consultor")) {
          navigate("/pag_consultor");
        } else {
          navigate("/pag_consultor");
        }
      } else {
        setError(data.message || data.error || "Erro ao iniciar sessão.");
      }
    } catch (err) {
      console.error("Erro na tentativa de login:", err);

      if (err.response?.status === 403) {
        setError("Confirme o seu email antes de iniciar sessão.");
      } else {
        setError(err.response?.data?.message || err.response?.data?.error || "Email ou password incorretos!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="p-0" style={{ backgroundColor: "#f4f7f6" }}>
      <Row className="g-0">
        <Col md={6} className="d-none d-md-block" style={{ height: '100vh' }}>
          <img src={ImagemLogin} alt="Login" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </Col>

        <Col md={6} className="d-flex align-items-center justify-content-center">
          <Card className="border-0 shadow-sm" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <Card.Body>
              <div className="text-center mb-4">
                <h1 style={{ color: "#5d87ff", fontSize: "3rem" }}>Login</h1>
                <p className="text-muted">Bem-vindo à Softinsa</p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3">
                  <InputGroup>
                    <InputGroup.Text className="bg-white"><Mail size={18} /></InputGroup.Text>
                    <Form.Control 
                      type="email" 
                      placeholder="Email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading} // 🔒 Bloqueia o campo durante o loading
                    />
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-3">
                  <InputGroup>
                    <InputGroup.Text className="bg-white"><Lock size={18} /></InputGroup.Text>
                    <Form.Control 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading} // 🔒 Bloqueia o campo durante o loading
                    />
                    <InputGroup.Text 
                      style={{ cursor: loading ? 'not-allowed' : 'pointer' }} 
                      onClick={() => !loading && setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </InputGroup.Text>
                  </InputGroup>
                </Form.Group>

                {/* 🏁 BOTÃO DINÂMICO COM ANIMAÇÃO */}
                <Button 
                  type="submit"
                  variant="primary" 
                  disabled={loading} // 🔒 Desativa o clique para evitar duplo envio
                  className="w-100 d-flex align-items-center justify-content-center gap-2 mb-5" 
                  style={{ 
                    backgroundColor: '#1d61ff', 
                    border: 'none', 
                    borderRadius: '8px', 
                    height: '50px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    opacity: loading ? 0.7 : 1 // Efeito visual de desativado
                  }}
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />
                      <span>A iniciar sessão...</span>
                    </>
                  ) : (
                    <>
                      Entrar <ArrowRight size={18} />
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <span className="text-muted small">Não tem uma conta? </span>
                  <a href="/register" className="text-decoration-none fw-bold small" style={{ color: '#1a73e8' }}>
                    Registar
                  </a>
                </div>
                
                <Button
                  type="button"
                  variant="outline-primary"
                  className="w-100 mt-3"
                  disabled={loading} 
                  onClick={() => navigate("/galeria-badges")}
                >
                  Ver galeria de badges
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default LoginPage;