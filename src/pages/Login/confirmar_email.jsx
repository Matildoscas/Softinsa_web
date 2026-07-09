import {
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Row,
  Spinner,
} from "react-bootstrap";

import {
  CheckCircle,
  Mail,
  XCircle,
} from "lucide-react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import api from "../../services/api";
import ImagemLogin from "../../assets/imagem_login.png";

function ConfirmarEmailPage() {
  const navigate =
    useNavigate();

  const [
    searchParams,
  ] = useSearchParams();

  const token =
    searchParams.get("token");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    sucesso,
    setSucesso,
  ] = useState(false);

  const [
    mensagem,
    setMensagem,
  ] = useState("");

  const [
    utilizador,
    setUtilizador,
  ] = useState(null);

  useEffect(() => {
    if (!token) {
      setSucesso(false);
      setMensagem(
        "Token de confirmação em falta."
      );
      setLoading(false);
      return;
    }

    api
      .get(
        `/auth/verificar-email?token=${encodeURIComponent(token)}`
      )
      .then((res) => {
        setSucesso(true);

        setMensagem(
          res.data?.message ||
          "Email confirmado com sucesso."
        );

        setUtilizador(
          res.data?.utilizador ||
          null
        );
      })
      .catch((err) => {
        setSucesso(false);

        setMensagem(
          err.response?.data?.error ||
          "Não foi possível confirmar o email."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  return (
    <Container
      fluid
      className="p-0"
      style={{
        backgroundColor: "#f4f7f6",
        minHeight: "100vh",
      }}
    >
      <Row className="g-0">
        <Col
          md={6}
          className="d-none d-md-block"
          style={{ height: "100vh" }}
        >
          <img
            src={ImagemLogin}
            alt="Confirmação de email"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </Col>

        <Col
          md={6}
          className="d-flex align-items-center justify-content-center"
        >
          <Card
            className="border-0 shadow-sm"
            style={{
              width: "100%",
              maxWidth: "520px",
              borderRadius: "12px",
              padding: "2rem",
            }}
          >
            <Card.Body className="text-center">
              {loading ? (
                <>
                  <Spinner
                    animation="border"
                    variant="primary"
                    className="mb-3"
                  />

                  <h3>
                    A confirmar email...
                  </h3>

                  <p className="text-muted">
                    Aguarde um momento.
                  </p>
                </>
              ) : sucesso ? (
                <>
                  <CheckCircle
                    size={64}
                    color="#16a34a"
                    className="mb-3"
                  />

                  <h2
                    style={{
                      color: "#111827",
                      fontWeight: 700,
                    }}
                  >
                    Email confirmado
                  </h2>

                  <Alert
                    variant="success"
                    className="mt-3"
                  >
                    {mensagem}
                  </Alert>

                  <div
                    style={{
                      background: "#f8fafc",
                      border:
                        "1px solid #e5e7eb",
                      borderRadius: 10,
                      padding: 16,
                      marginTop: 18,
                      textAlign: "left",
                    }}
                  >
                    <div
                      className="d-flex align-items-center gap-2 mb-2"
                      style={{
                        fontWeight: 700,
                        color: "#111827",
                      }}
                    >
                      <Mail size={18} />
                      Email institucional
                    </div>

                    <div
                      style={{
                        color: "#4470AF",
                        fontWeight: 700,
                        wordBreak: "break-all",
                      }}
                    >
                      {utilizador?.email_softinsa ||
                        "Email institucional ativado."}
                    </div>

                    <div
                      className="text-muted mt-2"
                      style={{
                        fontSize: 13,
                      }}
                    >
                      A partir de agora, use este email para iniciar sessão.
                    </div>
                  </div>

                  <Button
                    className="w-100 mt-4"
                    style={{
                      backgroundColor: "#1d61ff",
                      border: "none",
                      height: "48px",
                      fontWeight: 600,
                    }}
                    onClick={() =>
                      navigate("/login")
                    }
                  >
                    Ir para o login
                  </Button>
                </>
              ) : (
                <>
                  <XCircle
                    size={64}
                    color="#dc2626"
                    className="mb-3"
                  />

                  <h2
                    style={{
                      color: "#111827",
                      fontWeight: 700,
                    }}
                  >
                    Não foi possível confirmar
                  </h2>

                  <Alert
                    variant="danger"
                    className="mt-3"
                  >
                    {mensagem}
                  </Alert>

                  <Button
                    className="w-100 mt-3"
                    variant="outline-primary"
                    onClick={() =>
                      navigate("/register")
                    }
                  >
                    Voltar ao registo
                  </Button>

                  <Button
                    className="w-100 mt-2"
                    style={{
                      backgroundColor: "#1d61ff",
                      border: "none",
                    }}
                    onClick={() =>
                      navigate("/login")
                    }
                  >
                    Ir para o login
                  </Button>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ConfirmarEmailPage;