import React, { useState } from "react"; // 1. Importar o useState aqui
import { Container, Row, Col, Card, Form, Button, InputGroup } from "react-bootstrap";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react"; // 2. Importar EyeOff
import ImagemLogin from "./assets/imagem_login.png";

function LoginPage() {
  // 3. A lógica DEVE ficar aqui dentro
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container fluid className="p-0" style={{ backgroundColor: "#f4f7f6" }}>
      <Row className="g-0">
        {/* Lado Esquerdo: Imagem */}
        <Col md={6} className="d-none d-md-block" style={{ height: '100vh' }}>
          <img 
            src={ImagemLogin} 
            alt="Imagem Login" 
            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
          />
        </Col>

        {/* Lado Direito: Formulário */}
        <Col md={6} className="d-flex align-items-center justify-content-center" style={{ height: '100vh' }}>
          <Card 
            className="border-0 shadow-sm" 
            style={{ width: '100%', maxWidth: '500px', borderRadius: '12px', padding: '2rem' }}
          >
            <Card.Body>
              <div className="text-center mb-4">
                <h1 style={{ color: "#5d87ff", fontSize: "3rem" }}>Login</h1>
                <p className="text-muted">Faça login na sua conta</p>
              </div>

              <hr className="mx-n4 border-top opacity-100 mb-3" style={{ borderColor: '#e0e0e0' }} />

              <Form>
                <Form.Group className="mb-3">
                  <InputGroup style={{ borderRadius: '8px', overflow: 'hidden' }}>
                    <InputGroup.Text className="bg-white border-end-0 text-muted">
                      <Mail size={18} />
                    </InputGroup.Text>
                    <Form.Control 
                      type="email" 
                      placeholder="Email" 
                      className="border-start-0 ps-0"
                      style={{ boxShadow: 'none', height: '45px' }}
                    />
                  </InputGroup>
                </Form.Group>

                {/* Password com a lógica corrigida */}
                <Form.Group className="mb-2">
                  <InputGroup style={{ borderRadius: '8px', overflow: 'hidden' }}>
                    <InputGroup.Text className="bg-white border-end-0 text-muted">
                      <Lock size={18} />
                    </InputGroup.Text>

                    <Form.Control 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Password" 
                      className="border-start-0 border-end-0 ps-0"
                      style={{ boxShadow: 'none', height: '45px' }}
                    />

                    <InputGroup.Text 
                      className="bg-white border-start-0 text-muted" 
                      style={{ cursor: 'pointer' }}
                      onClick={togglePasswordVisibility}
                    >
                      {/* Condicional para trocar o ícone */}
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </InputGroup.Text>
                  </InputGroup>
                </Form.Group>

                <div className="mb-4 text-start">
                  <a href="#" className="text-decoration-none fw-bold" style={{ fontSize: '0.85rem', color: '#1a73e8' }}>
                    Esqueceu a password?
                  </a>
                </div>

                <Button 
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
                  <a href="#" className="text-decoration-none fw-bold small" style={{ color: '#1a73e8' }}>
                    Registar
                  </a>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default LoginPage;