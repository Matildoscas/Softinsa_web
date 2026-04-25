import React, { useState } from "react";
import { Container, Row, Col, Card, Form, Button, InputGroup } from "react-bootstrap";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, LayoutList } from "lucide-react";
import ImagemLogin from "./assets/imagem_login.png";

function AreaPage() {
  // Elementos do combo box, alterar quando ligar á base de dados
  const areas = ["Hybrid Cloud", "Applications Operations", "Sourcing and Talent Management"];

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
                <h1 style={{ color: "#5d87ff", fontSize: "3rem" }}>Áreas</h1>
                <p className="text-muted">Escolha a sua área</p>
              </div>

              <hr className="mx-n4 border-top opacity-100 mb-3" style={{ borderColor: '#e0e0e0' }} />

              <Form>
                <Form.Group className="mb-3">
                  <InputGroup style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #ced4da' }}>

                    <InputGroup.Text className="bg-white border-0 text-muted">
                        <LayoutList size={18} />
                    </InputGroup.Text>

                    <Form.Select className="border-0 ps-0" style={{ boxShadow: 'none',  borderRadius: '0'}} onChange={(e) => console.log(e.target.value)}>
                        {areas.map((areas, index) => (
                        <option key={index} value={areas.toLowerCase()}>
                            {areas}
                        </option>
                        ))}
                    </Form.Select>
                  
                  </InputGroup>
                </Form.Group>

                <div className="d-flex gap-2 mb-5"> {/* 'gap-3' cria o espaço entre os botões */}
                    <Button 
                        variant="primary" 
                        className="w-100 d-flex align-items-center justify-content-center gap-2" 
                        style={{ 
                        backgroundColor: '#87888b', 
                        border: 'none', 
                        borderRadius: '8px', 
                        height: '50px',
                        fontSize: '1rem',
                        fontWeight: '600'
                        }}
                    >
                        <ArrowLeft size={18} /> Voltar
                    </Button>

                    <Button 
                        variant="primary" 
                        className="w-100 d-flex align-items-center justify-content-center gap-2" 
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
                    </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AreaPage;