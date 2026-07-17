import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Form, Button, InputGroup, Alert, Spinner } from "react-bootstrap";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api"; // Importa a instância do Axios configurada anteriormente
import ImagemLogin from "../../assets/imagem_login.png";
import {
  definirUtilizadorAnalytics,
} from "../../services/firebaseAnalytics";
import {
  consumirAvisoSessaoExpirada,
} from "../../services/api.js";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [avisoSessao, setAvisoSessao] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRecuperacao, setShowRecuperacao] = useState(false);
  const [passoRecuperacao, setPassoRecuperacao] = useState("email");
  const [recuperacaoLoading, setRecuperacaoLoading] = useState(false);
  const [recuperacaoError, setRecuperacaoError] = useState("");
  const [recuperacaoInfo, setRecuperacaoInfo] = useState("");
  const [recuperacaoEmail, setRecuperacaoEmail] = useState("");
  const [recuperacaoCodigo, setRecuperacaoCodigo] = useState("");
  const [recuperacaoNovaPassword, setRecuperacaoNovaPassword] = useState("");
  const [recuperacaoConfirmarPassword, setRecuperacaoConfirmarPassword] = useState("");
  const [showRecuperacaoPassword, setShowRecuperacaoPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const expirou = consumirAvisoSessaoExpirada();

    if (expirou) {
      setAvisoSessao(true);
    }
  }, []);

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

    setLoading(true);

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
        String(data.token),
      );

      localStorage.setItem(
        "authToken",
        String(data.token),
      );

      localStorage.setItem(
        "jwt",
        String(data.token),
      );

      setAvisoSessao(false);

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
    } finally {
      setLoading(false);
    }
  };

  const abrirRecuperacao = () => {
    const emailNormalizado = email
      .trim()
      .replaceAll(" ", "")
      .toLowerCase();

    setRecuperacaoEmail(emailNormalizado);
    setRecuperacaoCodigo("");
    setRecuperacaoNovaPassword("");
    setRecuperacaoConfirmarPassword("");
    setRecuperacaoError("");
    setRecuperacaoInfo("");
    setPassoRecuperacao("email");
    setShowRecuperacaoPassword(false);
    setShowRecuperacao(true);
  };

  const pedirCodigoRecuperacao = async () => {
    const emailNormalizado = recuperacaoEmail
      .trim()
      .replaceAll(" ", "")
      .toLowerCase();

    if (!emailNormalizado) {
      setRecuperacaoError("Indique um email válido.");
      return;
    }

    setRecuperacaoLoading(true);
    setRecuperacaoError("");
    setRecuperacaoInfo("");

    try {
      await api.post("/auth/forgot-password/request", {
        email: emailNormalizado,
      });

      setRecuperacaoEmail(emailNormalizado);
      setRecuperacaoInfo("Enviámos um código de 6 dígitos para o seu email.");
      setPassoRecuperacao("codigo");
    } catch (err) {
      setRecuperacaoError(
        err.response?.data?.error ||
          "Não foi possível enviar o código."
      );
    } finally {
      setRecuperacaoLoading(false);
    }
  };

  const validarCodigoRecuperacao = async () => {
    const codigo = String(recuperacaoCodigo || "")
      .replace(/\s+/g, "")
      .trim();

    if (!/^\d{6}$/.test(codigo)) {
      setRecuperacaoError("O código deve ter 6 dígitos.");
      return;
    }

    setRecuperacaoLoading(true);
    setRecuperacaoError("");
    setRecuperacaoInfo("");

    try {
      await api.post("/auth/forgot-password/verify", {
        email: recuperacaoEmail,
        codigo,
      });

      setRecuperacaoCodigo(codigo);
      setRecuperacaoInfo("Código válido. Defina agora a nova password.");
      setPassoRecuperacao("password");
    } catch (err) {
      setRecuperacaoError(
        err.response?.data?.error ||
          "Código inválido."
      );
    } finally {
      setRecuperacaoLoading(false);
    }
  };

  const redefinirPassword = async () => {
    if (!recuperacaoNovaPassword || !recuperacaoConfirmarPassword) {
      setRecuperacaoError("Preencha os campos de password.");
      return;
    }

    if (recuperacaoNovaPassword.length < 6) {
      setRecuperacaoError("A nova password deve ter pelo menos 6 caracteres.");
      return;
    }

    if (recuperacaoNovaPassword !== recuperacaoConfirmarPassword) {
      setRecuperacaoError("As passwords não coincidem.");
      return;
    }

    setRecuperacaoLoading(true);
    setRecuperacaoError("");
    setRecuperacaoInfo("");

    try {
      await api.post("/auth/forgot-password/reset", {
        email: recuperacaoEmail,
        codigo: recuperacaoCodigo,
        nova_password: recuperacaoNovaPassword,
      });

      setRecuperacaoInfo("Password redefinida com sucesso.");
      setPassoRecuperacao("sucesso");
      setPassword("");
    } catch (err) {
      setRecuperacaoError(
        err.response?.data?.error ||
          "Não foi possível redefinir a password."
      );
    } finally {
      setRecuperacaoLoading(false);
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

              {avisoSessao && (
                <Alert variant="warning" className="mb-3">
                  Tempo de sessão acabou.
                </Alert>
              )}

              {error && !showRecuperacao && <Alert variant="danger">{error}</Alert>}

              {!showRecuperacao ? (
              <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3">
                  <InputGroup>
                    <InputGroup.Text className="bg-white"><Mail size={18} /></InputGroup.Text>
                    <Form.Control 
                      type="email" 
                      placeholder="Email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading} 
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
                      disabled={loading} 
                    />
                    <InputGroup.Text 
                      style={{ cursor: loading ? 'not-allowed' : 'pointer' }} 
                      onClick={() => !loading && setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </InputGroup.Text>
                  </InputGroup>
                </Form.Group>

                {/* BOTÃO DINÂMICO COM ANIMAÇÃO */}
                <Button 
                  type="submit"
                  variant="primary" 
                  disabled={loading} 
                  className="w-100 d-flex align-items-center justify-content-center gap-2 mb-5" 
                  style={{ 
                    backgroundColor: '#1d61ff', 
                    border: 'none', 
                    borderRadius: '8px', 
                    height: '50px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    opacity: loading ? 0.7 : 1 
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

                <div className="text-center mt-2">
                  <button
                    type="button"
                    onClick={abrirRecuperacao}
                    disabled={loading}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#1a73e8",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      cursor: loading ? "not-allowed" : "pointer",
                      padding: 0,
                    }}
                  >
                    Esqueci-me da password
                  </button>
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
                <Button
                  type="button"
                  variant="outline-secondary"
                  className="w-100 mt-2"
                  disabled={loading}
                  onClick={() => navigate("/microsite")}
                >
                  Conhecer o Microsite
                </Button>
              </Form>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <h4 style={{ color: "#1d61ff", fontWeight: 700 }}>Recuperar password</h4>
                    <p className="text-muted mb-0">Insira os dados para recuperar o acesso.</p>
                  </div>

                  {recuperacaoError && (
                    <Alert variant="danger">{recuperacaoError}</Alert>
                  )}

                  {recuperacaoInfo && (
                    <Alert variant="success">{recuperacaoInfo}</Alert>
                  )}

                  {passoRecuperacao === "email" && (
                    <>
                      <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          type="email"
                          placeholder="Insira o email da conta"
                          value={recuperacaoEmail}
                          onChange={(e) => setRecuperacaoEmail(e.target.value)}
                          disabled={recuperacaoLoading}
                        />
                      </Form.Group>

                      <Button
                        type="button"
                        className="w-100"
                        onClick={pedirCodigoRecuperacao}
                        disabled={recuperacaoLoading}
                      >
                        {recuperacaoLoading ? "A enviar..." : "Enviar código"}
                      </Button>
                    </>
                  )}

                  {passoRecuperacao === "codigo" && (
                    <>
                      <Form.Group className="mb-3">
                        <Form.Label>Código de 6 dígitos</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="000000"
                          value={recuperacaoCodigo}
                          onChange={(e) => setRecuperacaoCodigo(e.target.value)}
                          disabled={recuperacaoLoading}
                        />
                      </Form.Group>

                      <div className="d-flex gap-2">
                        <Button
                          type="button"
                          variant="outline-secondary"
                          className="w-50"
                          onClick={() => setPassoRecuperacao("email")}
                          disabled={recuperacaoLoading}
                        >
                          Voltar
                        </Button>

                        <Button
                          type="button"
                          className="w-50"
                          onClick={validarCodigoRecuperacao}
                          disabled={recuperacaoLoading}
                        >
                          {recuperacaoLoading ? "A validar..." : "Validar código"}
                        </Button>
                      </div>
                    </>
                  )}

                  {passoRecuperacao === "password" && (
                    <>
                      <Form.Group className="mb-3">
                        <Form.Label>Nova password</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type={showRecuperacaoPassword ? "text" : "password"}
                            placeholder="Nova password"
                            value={recuperacaoNovaPassword}
                            onChange={(e) => setRecuperacaoNovaPassword(e.target.value)}
                            disabled={recuperacaoLoading}
                          />
                          <InputGroup.Text
                            style={{ cursor: recuperacaoLoading ? "not-allowed" : "pointer" }}
                            onClick={() =>
                              !recuperacaoLoading &&
                              setShowRecuperacaoPassword((prev) => !prev)
                            }
                          >
                            {showRecuperacaoPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </InputGroup.Text>
                        </InputGroup>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Confirmar nova password</Form.Label>
                        <Form.Control
                          type={showRecuperacaoPassword ? "text" : "password"}
                          placeholder="Confirmar nova password"
                          value={recuperacaoConfirmarPassword}
                          onChange={(e) => setRecuperacaoConfirmarPassword(e.target.value)}
                          disabled={recuperacaoLoading}
                        />
                      </Form.Group>

                      <Button
                        type="button"
                        className="w-100"
                        onClick={redefinirPassword}
                        disabled={recuperacaoLoading}
                      >
                        {recuperacaoLoading ? "A guardar..." : "Guardar nova password"}
                      </Button>
                    </>
                  )}

                  {passoRecuperacao === "sucesso" && (
                    <Button
                      type="button"
                      className="w-100"
                      onClick={() => {
                        setShowRecuperacao(false);
                        setPassoRecuperacao("email");
                        setRecuperacaoCodigo("");
                        setRecuperacaoNovaPassword("");
                        setRecuperacaoConfirmarPassword("");
                        setRecuperacaoError("");
                        setRecuperacaoInfo("");
                      }}
                    >
                      Ir para login
                    </Button>
                  )}

                  {passoRecuperacao !== "sucesso" && (
                    <Button
                      type="button"
                      variant="link"
                      className="w-100 mt-3"
                      onClick={() => {
                        setShowRecuperacao(false);
                        setRecuperacaoError("");
                        setRecuperacaoInfo("");
                      }}
                      disabled={recuperacaoLoading}
                    >
                      Voltar ao login
                    </Button>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default LoginPage;