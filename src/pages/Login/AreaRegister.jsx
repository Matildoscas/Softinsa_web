import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, InputGroup, Spinner, Alert } from "react-bootstrap";
import { LayoutList, ArrowRight, ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api.js";
import ImagemLogin from "../../assets/imagem_login.png";

function AreaPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const dadosIniciais = location.state; // Recebe os dados do Register.jsx 

    const [areas, setAreas] = useState([]);
    const [selectedAreaId, setSelectedAreaId] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    // Carregar áreas da API
    useEffect(() => {
        api.get("/areas")
            .then(res => {
                // Validação de Segurança: Garante que o que guardamos é um array.
                // Se res.data for um array, usa-o. Se for um objeto com propriedade data, usa essa propriedade.
                if (Array.isArray(res.data)) {
                    setAreas(res.data);
                } else if (res.data && Array.isArray(res.data.data)) {
                    setAreas(res.data.data);
                } else {
                    setAreas([]); // Fallback para não quebrar o .map()
                }
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

        if (!selectedAreaId) {
            setMessage({ type: "warning", text: "Selecione uma área!" });
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                nome: dadosIniciais?.nome, 
                email: dadosIniciais?.email,
                password: dadosIniciais?.password,
                aceitar_termos: dadosIniciais?.aceitar_termos || dadosIniciais?.aceitarTermos,
                id_area: parseInt(selectedAreaId, 10)
            };

            console.log("Enviando Payload Final:", payload);

            await api.post("/auth/register", payload);
            setMessage({ type: "success", text: "Conta criada! Verifique o seu email." });
            
            // Aguarda 3 segundos para o utilizador ler o aviso e manda para o login
            setTimeout(() => navigate("/login"), 3000);
        } catch (err) {
            setMessage({ 
                type: "danger", 
                text: err.response?.data?.message || err.response?.data?.error || "Erro no registo." 
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
                                                
                                                {/* Proteção adicional com operador opcional (?) e validação de Array */}
                                                {Array.isArray(areas) && areas.map((area) => (
                                                    <option 
                                                        key={area?.id_area || area?.id} 
                                                        value={area?.id_area || area?.id}
                                                    >
                                                        {area?.nome_area || area?.nome || "Área sem nome"}
                                                    </option>
                                                ))}
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