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
  Form,
  InputGroup,
  Row,
  Spinner,
} from "react-bootstrap";

import {
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  UserRound,
  XCircle,
} from "lucide-react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import api from "../../services/api";
import ImagemLogin from "../../assets/imagem_login.png";

function AtivarContaPage() {
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
    ativando,
    setAtivando,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    sucesso,
    setSucesso,
  ] = useState("");

  const [
    utilizador,
    setUtilizador,
  ] = useState(null);

  const [
    areas,
    setAreas,
  ] = useState([]);

  const [
    form,
    setForm,
  ] = useState({
    password_temporaria: "",
    nova_password: "",
    confirmar_password: "",
    id_area: "",
  });

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  useEffect(() => {
    async function carregar() {
      if (!token) {
        setErro(
          "Token de ativação em falta."
        );
        setLoading(false);
        return;
      }

      try {
        const validacao =
          await api.get(
            `/auth/ativacao-admin/validar?token=${encodeURIComponent(token)}`
          );

        const user =
          validacao.data?.utilizador;

        setUtilizador(user);

        if (
          user?.tipo_utilizador ===
          "Consultor"
        ) {
          const areasRes =
            await api.get("/areas");

          const lista =
            Array.isArray(areasRes.data)
              ? areasRes.data
              : [];

          setAreas(lista);

          setForm((prev) => ({
            ...prev,
            id_area:
              user.id_areas
                ? String(user.id_areas)
                : "",
          }));
        }
      } catch (err) {
        setErro(
          err.response?.data?.error ||
          "Link de ativação inválido ou expirado."
        );
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [token]);

  const set =
    (field) =>
    (value) => {
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  function obterIdArea(area) {
    return (
      area.id_areas ??
      area.ID_AREAS ??
      area.id_area ??
      area.id
    );
  }

  async function handleAtivar(e) {
    e.preventDefault();

    setErro("");
    setSucesso("");

    if (
      !form.password_temporaria ||
      !form.nova_password ||
      !form.confirmar_password
    ) {
      setErro(
        "Preencha a password temporária e a nova password."
      );

      return;
    }

    if (
      form.nova_password.length < 6
    ) {
      setErro(
        "A nova password deve ter pelo menos 6 caracteres."
      );

      return;
    }

    if (
      form.nova_password !==
      form.confirmar_password
    ) {
      setErro(
        "As passwords não coincidem."
      );

      return;
    }

    if (
      form.nova_password ===
      form.password_temporaria
    ) {
      setErro(
        "A nova password tem de ser diferente da password temporária."
      );

      return;
    }

    if (
      utilizador?.tipo_utilizador ===
        "Consultor" &&
      !form.id_area
    ) {
      setErro(
        "Escolha a sua área."
      );

      return;
    }

    try {
      setAtivando(true);

      const res =
        await api.post(
          "/auth/ativacao-admin/confirmar",
          {
            token,
            password_temporaria:
              form.password_temporaria,
            nova_password:
              form.nova_password,
            id_area:
              form.id_area
                ? Number(form.id_area)
                : null,
          }
        );

      setSucesso(
        res.data?.message ||
        "Conta ativada com sucesso."
      );

      setUtilizador(
        res.data?.utilizador ||
        utilizador
      );
    } catch (err) {
      setErro(
        err.response?.data?.error ||
        "Não foi possível ativar a conta."
      );
    } finally {
      setAtivando(false);
    }
  }

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
            alt="Ativar conta"
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
              maxWidth: "540px",
              borderRadius: "12px",
              padding: "2rem",
            }}
          >
            <Card.Body>
              {loading ? (
                <div className="text-center">
                  <Spinner
                    animation="border"
                    variant="primary"
                    className="mb-3"
                  />

                  <h3>
                    A validar convite...
                  </h3>
                </div>
              ) : erro && !utilizador ? (
                <div className="text-center">
                  <XCircle
                    size={64}
                    color="#dc2626"
                    className="mb-3"
                  />

                  <h2>
                    Link inválido
                  </h2>

                  <Alert
                    variant="danger"
                    className="mt-3"
                  >
                    {erro}
                  </Alert>

                  <Button
                    className="w-100 mt-3"
                    onClick={() =>
                      navigate("/login")
                    }
                  >
                    Ir para login
                  </Button>
                </div>
              ) : sucesso ? (
                <div className="text-center">
                  <CheckCircle
                    size={64}
                    color="#16a34a"
                    className="mb-3"
                  />

                  <h2>
                    Conta ativada
                  </h2>

                  <Alert
                    variant="success"
                    className="mt-3"
                  >
                    {sucesso}
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
                    <strong>
                      Email institucional:
                    </strong>

                    <div
                      style={{
                        color: "#4470AF",
                        fontWeight: 700,
                        marginTop: 6,
                        wordBreak: "break-all",
                      }}
                    >
                      {
                        utilizador?.email_softinsa
                      }
                    </div>
                  </div>

                  <Button
                    className="w-100 mt-4"
                    style={{
                      backgroundColor: "#1d61ff",
                      border: "none",
                      height: 48,
                    }}
                    onClick={() =>
                      navigate("/login")
                    }
                  >
                    Ir para login
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <h1
                      style={{
                        color: "#5d87ff",
                        fontSize: "2.7rem",
                      }}
                    >
                      Ativar Conta
                    </h1>

                    <p className="text-muted">
                      Confirme a password temporária e defina a sua nova password.
                    </p>
                  </div>

                  {erro && (
                    <Alert variant="danger">
                      {erro}
                    </Alert>
                  )}

                  <div
                    style={{
                      background: "#f8fafc",
                      border:
                        "1px solid #e5e7eb",
                      borderRadius: 10,
                      padding: 14,
                      marginBottom: 18,
                    }}
                  >
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <UserRound size={18} />
                      <strong>
                        {
                          utilizador
                            ?.nome_completo
                        }
                      </strong>
                    </div>

                    <div
                      className="d-flex align-items-center gap-2"
                      style={{
                        color: "#64748b",
                        fontSize: 13,
                      }}
                    >
                      <Mail size={16} />
                      {utilizador?.email}
                    </div>

                    <div
                      style={{
                        color: "#4470AF",
                        fontSize: 13,
                        fontWeight: 700,
                        marginTop: 8,
                      }}
                    >
                      Email Softinsa previsto:{" "}
                      {
                        utilizador
                          ?.email_softinsa_previsto
                      }
                    </div>
                  </div>

                  <Form onSubmit={handleAtivar}>
                    <Form.Group className="mb-3">
                      <InputGroup>
                        <InputGroup.Text className="bg-white">
                          <Lock size={18} />
                        </InputGroup.Text>

                        <Form.Control
                          required
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          placeholder="Password temporária"
                          value={
                            form.password_temporaria
                          }
                          onChange={(e) =>
                            set(
                              "password_temporaria"
                            )(e.target.value)
                          }
                        />

                        <InputGroup.Text
                          onClick={() =>
                            setShowPassword(
                              !showPassword
                            )
                          }
                          style={{
                            cursor: "pointer",
                          }}
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </InputGroup.Text>
                      </InputGroup>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <InputGroup>
                        <InputGroup.Text className="bg-white">
                          <Lock size={18} />
                        </InputGroup.Text>

                        <Form.Control
                          required
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          placeholder="Nova password"
                          minLength={6}
                          value={
                            form.nova_password
                          }
                          onChange={(e) =>
                            set(
                              "nova_password"
                            )(e.target.value)
                          }
                        />
                      </InputGroup>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <InputGroup>
                        <InputGroup.Text className="bg-white">
                          <Lock size={18} />
                        </InputGroup.Text>

                        <Form.Control
                          required
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          placeholder="Confirmar nova password"
                          value={
                            form.confirmar_password
                          }
                          onChange={(e) =>
                            set(
                              "confirmar_password"
                            )(e.target.value)
                          }
                        />
                      </InputGroup>
                    </Form.Group>

                    {utilizador?.tipo_utilizador ===
                      "Consultor" && (
                      <Form.Group className="mb-4">
                        <Form.Select
                          value={form.id_area}
                          onChange={(e) =>
                            set("id_area")(
                              e.target.value
                            )
                          }
                        >
                          <option value="">
                            Escolha a sua área...
                          </option>

                          {areas.map((area) => {
                            const id =
                              obterIdArea(area);

                            return (
                              <option
                                key={id}
                                value={id}
                              >
                                {area.nome_area ||
                                  area.nome ||
                                  "Área"}
                              </option>
                            );
                          })}
                        </Form.Select>
                      </Form.Group>
                    )}

                    <Button
                      type="submit"
                      disabled={ativando}
                      className="w-100"
                      style={{
                        backgroundColor:
                          "#1d61ff",
                        border: "none",
                        height: 50,
                      }}
                    >
                      {ativando ? (
                        <Spinner size="sm" />
                      ) : (
                        "Ativar conta"
                      )}
                    </Button>
                  </Form>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AtivarContaPage;