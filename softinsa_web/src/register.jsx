import React, { useState } from "react";
import { Container, Row, Col, Card, Form, Button, InputGroup } from "react-bootstrap";
import { Mail, Lock, Eye, EyeOff, ArrowRight, UserRound } from "lucide-react";
import ImagemLogin from "./assets/imagem_login.png";

function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const [validated, setValidated] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleSubmit = (event) => {
    const form = event.currentTarget;
    
    // Verifica se as passwords coincidem MANUALMENTE antes do check global
    if (password !== confirmPassword) {
        event.preventDefault();
        event.stopPropagation();
        alert("As passwords não coincidem!");
    } else if (form.checkValidity() === false) {
        event.preventDefault();
        event.stopPropagation();
    }

    setValidated(true);
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
                <h1 style={{ color: "#5d87ff", fontSize: "3rem" }}>Registar</h1>
                <p className="text-muted">Crie a sua conta</p>
              </div>

              <hr className="mx-n4 border-top opacity-100 mb-3" style={{ borderColor: '#e0e0e0' }} />

              <Form noValidate validated={validated} onSubmit={handleSubmit}> 

                <Form.Group className="mb-3">
                  <InputGroup style={{ borderRadius: '8px', overflow: 'hidden' }}>
                    <InputGroup.Text className="bg-white border-end-0 text-muted">
                      <UserRound size={18} />
                    </InputGroup.Text>
                    <Form.Control 
                      type="text" 
                      placeholder="Nome Completo" 
                      className="border-start-0 ps-0"
                      style={{ boxShadow: 'none', height: '45px' }}
                    />
                  </InputGroup>
                </Form.Group>

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

                {/* Campo Password */}
                <Form.Group className="mb-2">
                    <InputGroup hasValidation style={{ borderRadius: '8px', overflow: 'hidden' }}>
                    <InputGroup.Text className="bg-white border-end-0 text-muted">
                        <Lock size={18} />
                    </InputGroup.Text>
                    
                    <Form.Control 
                        required // Ativa validação nativa
                        type={showPassword ? "text" : "password"} 
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border-start-0 border-end-0 ps-0"
                    />
                    
                    {/* O ícone do olho aqui... */}
                    </InputGroup>
                </Form.Group>

                {/* Campo Confirmar Password */}
                <Form.Group className="mb-3">
                    <InputGroup hasValidation style={{ borderRadius: '8px', overflow: 'hidden' }}>
                    <InputGroup.Text className="bg-white border-end-0 text-muted">
                        <Lock size={18} />
                    </InputGroup.Text>
                    
                    <Form.Control 
                        required
                        pattern={password}
                        type={showPassword ? "text" : "password"} 
                        placeholder="Confirme a Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="border-start-0 border-end-0 ps-0"
                        isInvalid={validated && password !== confirmPassword}
                    />

                    <Form.Control.Feedback type="invalid">
                        As passwords têm de ser iguais.
                    </Form.Control.Feedback>
                    </InputGroup>
                </Form.Group>

                <Form.Group className="mb-4 text-start" controlId="formBasicCheckbox">
                    <Form.Check 
                        type="checkbox"
                        id="termos-checkbox"
                        label={
                        <span>
                            Aceito os{' '}
                            <a 
                            href="/termos" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-decoration-none fw-bold"
                            style={{ color: '#1a73e8' }}
                            onClick={(e) => e.stopPropagation()} // Importante!
                            >
                            Termos e Condições
                            </a>
                        </span>
                        }
                    />
                </Form.Group>

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
                  Registar <ArrowRight size={18} />
                </Button>

                <div className="text-center">
                  <span className="text-muted small">Já tem conta? </span>
                  <a href="#" className="text-decoration-none fw-bold small" style={{ color: '#1a73e8' }}>
                    Login
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

export default RegisterPage;