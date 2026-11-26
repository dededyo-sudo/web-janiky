# Clínica Janiky — Site oficial

Site institucional da **Janiky Clínica Geral** (Maxixe, Inhambane, Moçambique), com a assistente virtual **Fada**.

## Estrutura
```
index.html        Página única (serviços, sobre, ecografia 4D, marcações, FAQ, contactos)
css/style.css     Estilos (azul #1468C7 / verde #22A45D)
js/main.js        Menu, animações e formulário de marcação → WhatsApp
js/fada.js        Chatbot Fada (regras, sem servidor)
assets/           Logótipo e avatar da Fada (SVG)
vercel.json       Configuração da Vercel
```

## Actualizar dados
- **Contactos, horário, serviços e preços da Fada:** objecto `CLINICA` no topo de `js/fada.js`.
- **Número de WhatsApp do formulário:** constante `WHATSAPP` em `js/main.js`.
- **Textos do site:** `index.html`.

## Como funciona a marcação
O formulário e a Fada montam a mensagem e abrem o WhatsApp da clínica (+258 87 000 0060) com o pedido preenchido. Não há base de dados.

## Executar localmente
Abra `index.html` no navegador, ou: `npx serve .`

## Publicação
Site estático — a Vercel publica automaticamente cada `git push` para `main`.
