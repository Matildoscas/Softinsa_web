import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, InputGroup, Spinner, Alert } from "react-bootstrap";
import { LayoutList, ArrowRight, ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import ImagemLogin from "../../assets/imagem_login.png";

function AreaPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const dadosIniciais = location.state; // Recebe os dados do RegisterPage 

    const [areas, setAreas] = useState([]);
    const [selectedAreaId, setSelectedAreaId] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const obterIdArea = (area) => {
        return (
            area.id_areas ??
            area.id_area ??
            area.id
        );
    };

    // Carregar áreas da API (Equivalente ao _carregarAreas do Flutter) 
    useEffect(() => {
        api.get("/areas")
            .then(res => {
                setAreas(res.data);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error("Erro na requisição das áreas:", err);
                setMessage({ type: "danger", text: "Erro ao carregar áreas da API." });
                setAreas([]); // Garante array vazio em caso de erro de rede
                setIsLoading(false);
            });
        }, []);

    const handleFinalizar = async () => {
        console.log("Dados recebidos da página anterior:", dadosIniciais);
        console.log("ID da Área selecionada:", selectedAreaId);

        const idAreaNumerico =
            Number(selectedAreaId);

        if (
            !selectedAreaId ||
            Number.isNaN(idAreaNumerico)
        ) {
            setMessage({
            type: "warning",
            text: "Selecione uma área válida!",
            });

            return;
        }

        if (
            !dadosIniciais?.nome ||
            !dadosIniciais?.email ||
            !dadosIniciais?.password
        ) {
            setMessage({
            type: "danger",
            text: "Dados do registo em falta. Volte atrás e preencha novamente.",
            });

            return;
        }

        setIsSaving(true);

        try {
            const payload = {
            nome: dadosIniciais.nome,
            email: dadosIniciais.email,
            password: dadosIniciais.password,
            aceitar_termos: dadosIniciais.aceitarTermos,
            id_area: idAreaNumerico,
            };

            console.log("Enviando Payload Final:", payload);

            await api.post("/auth/register", payload);

            setMessage({
            type: "success",
            text:
                "Conta criada com sucesso! Enviámos um email de confirmação. Confirme o email antes de iniciar sessão.",
            });

            setTimeout(() => navigate("/login"), 5000);
        } catch (err) {
            setMessage({
            type: "danger",
            text:
                err.response?.data?.error ||
                "Erro no registo.",
            });
        } finally {
            setIsSaving(false);
        }
        };

    return (
        <Container fluid className="p-0" style={{ backgroundColor: "#f4f7f6" }}>
            <Row className="g-0">
                <Col md={6} className="d-none d-md-block" style={{ height: '100vh' }}>
                    <img src={ImagemLogin} alt="Áreas" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </Col>

                <Col md={6} className="d-flex align-items-center justify-content-center">
                    <Card className="border-0 shadow-sm" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
                        <Card.Body>
                            <div className="text-center mb-4">
                                <h1 style={{ color: "#5d87ff", fontSize: "3rem" }}>Área</h1>
                                <p className="text-muted">Escolha a sua área de atuação</p>
                            </div>

                            {message.text && <Alert variant={message.type}>{message.text}</Alert>}

                            {isLoading ? (
                                <div className="text-center"><Spinner animation="border" /></div>
                            ) : (
                                <Form>
                                    <Form.Group className="mb-4">
                                        <InputGroup>
                                            <InputGroup.Text className="bg-white"><LayoutList size={18} /></InputGroup.Text>
                                            <Form.Select 
                                                value={selectedAreaId} 
                                                onChange={(e) => setSelectedAreaId(e.target.value)}
                                            >
                                                <option value="">Selecione uma área...</option>
                                                    {areas.map((area) => {
                                                    const idArea =
                                                        obterIdArea(area);

                                                    return (
                                                        <option
                                                        key={idArea}
                                                        value={idArea}
                                                        >
                                                        {area.nome_area || area.nome}
                                                        </option>
                                                    );
                                                })}
                                            </Form.Select>
                                        </InputGroup>
                                    </Form.Group>

                                    <div className="d-flex gap-2">
                                        <Button 
                                            variant="secondary" 
                                            className="w-100 d-flex align-items-center justify-content-center gap-2"
                                            onClick={() => navigate(-1)}
                                        >
                                            <ArrowLeft size={18} /> Voltar
                                        </Button>

                                        <Button 
                                            disabled={isSaving}
                                            className="w-100 d-flex align-items-center justify-content-center gap-2"
                                            style={{ backgroundColor: '#1d61ff' }}
                                            onClick={handleFinalizar}
                                        >
                                            {isSaving ? <Spinner size="sm" /> : <>Concluir <ArrowRight size={18} /></>}
                                        </Button>
                                    </div>
                                </Form>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default AreaPage;