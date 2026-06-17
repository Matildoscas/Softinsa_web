import React, { useState } from "react";
import { Container, Row, Col, Card, Form, Button, InputGroup, Alert } from "react-bootstrap";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api"; 
import ImagemLogin from "../../assets/imagem_login.png";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Preencha o email e a password!");
      return;
    }

    try {
      // Chamada à API
      const response = await api.post("/auth/login", { email, password });

      console.log("DADOS QUE A API MANDOU PRO LOGIN:", response.data);

      const data = response.data;

      if (data.token) {
        localStorage.setItem("token", data.token);

        const apiUser = response.data.user;

        // CORREÇÃO: LER EM MINÚSCULAS CONFORME VEM NO CONSOLE LOG
        const userEmail = apiUser.email || apiUser.email_utilizador || apiUser.EMAIL_SOFTINSA;
        const userCargo = apiUser.cargo || 'TALENT_MANAGER'; // Forçamos TALENT_MANAGER temporariamente para teste

        const utilizadorSeguro = {
          id_utilizador: data.user?.id_utilizador || data.user?.ID_UTILIZADOR,
          email: data.user?.email || data.user?.EMAIL,
          nome: data.user?.nome_completo || data.user?.NOME_COMPLETO || data.user?.nome,
          nome_completo: data.user?.nome_completo || data.user?.NOME_COMPLETO,
          contacto: data.user?.contacto || data.user?.CONTACTO || "",
          estado_conta: data.user?.estado_conta || data.user?.ESTADO_CONTA,
          tipo_utilizador:
            data.user?.tipo_utilizador ||
            data.user?.TIPO_UTILIZADOR ||
            data.user?.cargo ||
            data.user?.CARGO ||
            "",
        };
        console.log("UTILIZADOR SEGURO:", utilizadorSeguro);

        // Salva os dados limpos do utilizador
        localStorage.setItem("user", JSON.stringify(utilizadorSeguro));

        const tipo = String(utilizadorSeguro.tipo_utilizador).toLowerCase();

        if (tipo.includes("admin") || tipo.includes("administrador")) {
          navigate("/admin");
        } else {
          navigate("/pag_consultor");
        }
      }
    } catch (err) {
      console.error("Erro na tentativa de login:", err);
      
      if (err.response && err.response.status === 403) {
        setError("Confirme o seu email antes de iniciar sessão.");
      } else {
        // Puxa dinamicamente a mensagem de erro tratada no teu backend
        setError(err.response?.data?.message || err.response?.data?.error || "Email ou password incorretos!");
      }
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
                    />
                    <InputGroup.Text style={{ cursor: 'pointer' }} onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </InputGroup.Text>
                  </InputGroup>
                </Form.Group>

                <Button 
                  type="submit"
                  variant="primary" 
                  className="w-100 d-flex align-items-center justify-content-center gap-2 mb-5" 
                  style={{ 
                    backgroundColor: '#1d61ff', 
                    border: 'none', 
                    borderRadius: '8px', 
                    height: '50px',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                >
                  Entrar <ArrowRight size={18} />
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