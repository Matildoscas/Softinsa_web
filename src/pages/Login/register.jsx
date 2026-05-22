import React, { useState } from "react";
import { Container, Row, Col, Card, Form, Button, InputGroup, Alert } from "react-bootstrap";
import { Mail, Lock, Eye, EyeOff, ArrowRight, UserRound } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import ImagemLogin from "../../assets/imagem_login.png";

function RegisterPage() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [validated, setValidated] = useState(false);
    
    // Estados para os campos (análogo aos Controllers do Flutter)
    const [formData, setFormData] = useState({
        nome: "",
        email: "",
        password: "",
        confirmPassword: "",
        aceitarTermos: false
    });
    const [error, setError] = useState("");

    const handleSubmit = (event) => {
        event.preventDefault();
        const form = event.currentTarget;

        if (form.checkValidity() === false || formData.password !== formData.confirmPassword || !formData.aceitarTermos) {
            setValidated(true);
            if (formData.password !== formData.confirmPassword) setError("As passwords não coincidem!");
            else if (!formData.aceitarTermos) setError("Deve aceitar os Termos de Serviço!");
            return;
        }

        // Avançar para a área passando os dados (Análogo ao MaterialPageRoute no Flutter)
        navigate("/register-area", { state: formData });
    };

    return (
        <Container fluid className="p-0" style={{ backgroundColor: "#f4f7f6" }}>
            <Row className="g-0">
                <Col md={6} className="d-none d-md-block" style={{ height: '100vh' }}>
                    <img src={ImagemLogin} alt="Registo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </Col>

                <Col md={6} className="d-flex align-items-center justify-content-center">
                    <Card className="border-0 shadow-sm" style={{ width: '100%', maxWidth: '500px', borderRadius: '12px', padding: '2rem' }}>
                        <Card.Body>
                            <div className="text-center mb-4">
                                <h1 style={{ color: "#5d87ff", fontSize: "3rem" }}>Registar</h1>
                                <p className="text-muted">Crie a sua conta</p>
                            </div>

                            {error && <Alert variant="danger">{error}</Alert>}

                            <Form noValidate validated={validated} onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <InputGroup>
                                        <InputGroup.Text className="bg-white text-muted"><UserRound size={18} /></InputGroup.Text>
                                        <Form.Control 
                                            required
                                            placeholder="Nome Completo" 
                                            onChange={(e) => setFormData({...formData, nome: e.target.value})}
                                        />
                                    </InputGroup>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <InputGroup>
                                        <InputGroup.Text className="bg-white text-muted"><Mail size={18} /></InputGroup.Text>
                                        <Form.Control 
                                            required 
                                            type="email" 
                                            placeholder="Email" 
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        />
                                    </InputGroup>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <InputGroup>
                                        <InputGroup.Text className="bg-white text-muted"><Lock size={18} /></InputGroup.Text>
                                        <Form.Control 
                                            required 
                                            type={showPassword ? "text" : "password"} 
                                            placeholder="Password (mín. 6 chars)"
                                            minLength={6}
                                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        />
                                        <InputGroup.Text onClick={() => setShowPassword(!showPassword)} style={{cursor: 'pointer'}}>
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </InputGroup.Text>
                                    </InputGroup>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <InputGroup>
                                        <InputGroup.Text className="bg-white text-muted"><Lock size={18} /></InputGroup.Text>
                                        <Form.Control 
                                            required 
                                            type={showPassword ? "text" : "password"} 
                                            placeholder="Confirme a Password" 
                                            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                        />
                                    </InputGroup>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Check 
                                        type="checkbox"
                                        label="Aceito os Termos e Condições"
                                        required
                                        onChange={(e) => setFormData({...formData, aceitarTermos: e.target.checked})}
                                    />
                                </Form.Group>

                                <Button type="submit" className="w-100" style={{ backgroundColor: '#1d61ff', height: '50px' }}>
                                    Seguinte <ArrowRight size={18} />
                                </Button>

                                <div className="text-center mt-4">
                                    <span className="text-muted small">Já tem conta? </span>
                                    <Link to="/login" className="text-decoration-none fw-bold small" style={{ color: '#1a73e8' }}>Login</Link>
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