import React, { useState } from "react";
import { Container, Row, Col, Card, Form, Button, InputGroup, Alert } from "react-bootstrap";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api.js"; // Importa a instância do Axios configurada anteriormente
import ImagemLogin from "../../assets/imagem_login.png";
import {
  definirUtilizadorAnalytics,
} from "../../services/firebaseAnalytics";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    const emailNormalizado = email
      .trim()
      .replaceAll(" ", "")
      .toLowerCase();

    if (
      !emailNormalizado ||
      !password
    ) {
      setError(
        "Preencha o email e a password!",
      );

      return;
    }

    try {
      const response = await api.post(
        "/auth/login",
        {
          email: emailNormalizado,
          password,
        },
      );

      console.log(
        "DADOS RECEBIDOS NO LOGIN:",
        response.data,
      );

      const data = response.data;

      if (
        !data?.token ||
        !data?.user
      ) {
        setError(
          "O servidor não devolveu os dados do utilizador.",
        );

        return;
      }

      const utilizadorSeguro = {
        id_utilizador:
          data.user.id_utilizador ??
          data.user.ID_UTILIZADOR,

        email:
          data.user.email ??
          data.user.EMAIL,

        nome:
          data.user.nome_completo ??
          data.user.NOME_COMPLETO ??
          data.user.nome ??
          "",

        nome_completo:
          data.user.nome_completo ??
          data.user.NOME_COMPLETO ??
          "",

        contacto:
          data.user.contacto ??
          data.user.CONTACTO ??
          "",

        estado_conta:
          data.user.estado_conta ??
          data.user.ESTADO_CONTA,

        tipo_utilizador:
          data.user.tipo_utilizador ??
          data.user.TIPO_UTILIZADOR ??
          data.user.cargo ??
          data.user.CARGO ??
          "",
      };

      localStorage.setItem(
        "token",
        data.token,
      );

      localStorage.setItem(
        "user",
        JSON.stringify(
          utilizadorSeguro,
        ),
      );

      // Só agora, depois do login correto,
      // o Analytics é iniciado.
      await definirUtilizadorAnalytics(
        utilizadorSeguro.id_utilizador,
      );

      const tipo = String(
        utilizadorSeguro.tipo_utilizador ??
        "",
      )
        .trim()
        .toLowerCase();

      console.log(
        "TIPO DE UTILIZADOR DETETADO:",
        tipo,
      );

      if (
        tipo.includes("administrador") ||
        tipo === "admin"
      ) {
        navigate(
          "/admin",
          {
            replace: true,
          },
        );

        return;
      }

      if (
        tipo.includes(
          "service line leader",
        ) ||
        tipo === "sll" ||
        tipo === "service line"
      ) {
        navigate(
          "/sll",
          {
            replace: true,
          },
        );

        return;
      }

      if (
        tipo.includes("talent manager") ||
        tipo === "tm"
      ) {
        navigate(
          "/tm",
          {
            replace: true,
          },
        );

        return;
      }

      if (
        tipo.includes("consultor")
      ) {
        navigate(
          "/pag_consultor",
          {
            replace: true,
          },
        );

        return;
      }

      setError(
        `O tipo de utilizador "${utilizadorSeguro.tipo_utilizador}" não possui uma página associada.`,
      );
    } catch (err) {
      console.error(
        "Erro no login:",
        err,
      );

      if (
        err.response?.status === 403
      ) {
        setError(
          "Confirme o seu email antes de iniciar sessão.",
        );
      } else {
        setError(
          err.response?.data?.error ??
          err.response?.data?.message ??
          "Email ou password incorretos!",
        );
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