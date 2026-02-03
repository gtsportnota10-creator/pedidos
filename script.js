// CONFIGURAÇÕES DO SUPABASE
const SUPABASE_URL = 'https://kvhvelquxtcxukpkdabg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2aHZlbHF1eHRjeHVrcGtkYWJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MTk0MDAsImV4cCI6MjA4NDI5NTQwMH0.gVCU4i1M5GGR96bDHExFBMKuDOcpl7khj10zycbky-U';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let listaModelagens = [];
let listaTecidos = []; 

// FUNÇÃO AUXILIAR PARA PEGAR O E-MAIL (LIMPO OU COMPLETO)
function obterEmailVendedor() {
    const params = new URLSearchParams(window.location.search);
    // Tenta pegar o 'id' (do link novo) ou 'atendente' (do link antigo)
    let vendedorId = params.get('id') || params.get('atendente');

    if (vendedorId) {
        // Retorna o ID limpo e em minúsculo para evitar erros
        return vendedorId.trim().toLowerCase();
    }
    
    return null;
}

async function carregarPerfil() {
    const identificador = obterEmailVendedor();

    if (identificador) {
        // USAMOS ILIKE PARA BUSCAR O NOME DENTRO DO E-MAIL
        // Exemplo: se identificador for "gtsportnota10", ele acha "gtsportnota10@gmail.com"
        const { data, error } = await _supabase
            .from('perfis_usuarios')
            .select('*')
            .ilike('email_usuario', `%${identificador}%`) 
            .maybeSingle(); // maybeSingle evita erros se não encontrar nada

        if (data) {
            // Se achou, preenche os campos
            document.getElementById('nome-empresa').innerText = data.nome_empresa;
            document.getElementById('nome-atendente').innerText = `Atendimento: ${data.nome_atendente}`;
            
            // Carrega Modelagens
            if (data.modelagens) {
                listaModelagens = data.modelagens.split(',').map(item => item.trim());
            }

            // Carrega Tecidos
            if (data.tecidos) {
                listaTecidos = data.tecidos.split(',').map(item => item.trim());
            }
            
            popularSelectTecido();

            // Carrega a Logo
            if (data.url_logo) {
                const img = document.getElementById('logo-empresa');
                img.src = data.url_logo;
                img.style.display = 'inline-block';
            }
        } else {
            // Caso o banco de dados não retorne nenhum registro
            document.getElementById('nome-empresa').innerText = "Vendedor não Identificado";
            popularSelectTecido();
        }
    } else {
        document.getElementById('nome-empresa').innerText = "Link Inválido";
        popularSelectTecido();
    }
    adicionarGrupoModelagem();
}
// Preenche o Select de Tecidos
function popularSelectTecido() {
    const select = document.getElementById('clienteTecidoSelect');
    if(!select) return;

    let html = '<option value="">Selecione o tecido...</option>';
    listaTecidos.forEach(tec => {
        if(tec) html += `<option value="${tec}">${tec}</option>`;
    });
    html += `<option value="OUTRA">➕ Outro (Escrever manualmente)</option>`;
    select.innerHTML = html;
}

// Mostra/Esconde campo manual do Tecido
function alternarTecidoManual(select) {
    const campoManual = document.getElementById('clienteTecidoManual');
    if (select.value === "OUTRA") {
        campoManual.style.display = "block";
        campoManual.focus();
    } else {
        campoManual.style.display = "none";
        campoManual.value = ""; 
    }
}

// 2. ADICIONAR UM NOVO GRUPO (Modelagem)
function adicionarGrupoModelagem() {
    const container = document.getElementById('container-modelagens');
    
    let opcoesHtml = '<option value="">Selecione a modelagem...</option>';
    listaModelagens.forEach(mod => {
        opcoesHtml += `<option value="${mod}">${mod}</option>`;
    });
    opcoesHtml += `<option value="OUTRA">➕ Outra (Escrever manualmente)</option>`;

    const div = document.createElement('div');
    div.className = 'grupo-modelagem';
    div.innerHTML = `
        <div class="header-modelagem">
            <label class="label-modelagem">Modelagem</label>
            <div class="row-modelagem">
                <select class="i-mod-nome" onchange="alternarCampoManual(this)" style="font-weight: bold;">
                    ${opcoesHtml}
                </select>
                <button type="button" class="btn-del-header" onclick="this.closest('.grupo-modelagem').remove()">✕</button>
            </div>
            <input type="text" class="i-mod-manual" placeholder="Qual o nome da modelagem?" 
                   style="display:none; margin-top: 10px; border-style: dashed; border-color: #3b82f6;">
        </div>
        
        <div class="tabela-wrapper">
            <table>
                <thead>
                    <tr>
                        <th style="width: 30%;">Nome</th>
                        <th style="width: 15%;">Tamanho</th>
                        <th style="width: 15%;">Número</th>
                        <th style="width: 15%;">Quantidade</th>
                        <th style="width: 25%;">Adicional</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody class="corpo-tabela-itens"></tbody>
            </table>
        </div>
        <button type="button" class="btn-add-item" onclick="adicionarLinhaItem(this)">+ Adicionar Item nesta Modelagem</button>
    `;
    container.appendChild(div);
    adicionarLinhaItem(div.querySelector('.btn-add-item'));
}

function alternarCampoManual(select) {
    const campoManual = select.closest('.header-modelagem').querySelector('.i-mod-manual');
    if (select.value === "OUTRA") {
        campoManual.style.display = "block";
        campoManual.focus();
    } else {
        campoManual.style.display = "none";
        campoManual.value = ""; 
    }
}

// 3. ADICIONAR LINHA DE ITEM
function adicionarLinhaItem(botao) {
    const corpo = botao.closest('.grupo-modelagem').querySelector('.corpo-tabela-itens');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="i-nome" placeholder="Nome"></td>
        <td><input type="text" class="i-tam" placeholder="G" oninput="this.value = this.value.toUpperCase()"></td>
        <td><input type="text" class="i-num" placeholder="Nº"></td>
        <td><input type="number" class="i-qtd" value="1"></td>
        <td><input type="text" class="i-adicional" placeholder="Conjunto"></td>
        <td><button class="btn-del" onclick="this.closest('tr').remove()">✕</button></td>
    `;
    corpo.appendChild(tr);
}

// 4. ENVIAR PARA O SUPABASE
async function enviarPedido() {
    const identificador = obterEmailVendedor();
    const nome = document.getElementById('clienteNome').value.trim();
    const fone = document.getElementById('clienteTelefone').value.trim();
    const obsGerais = document.getElementById('observacoesGerais').value.trim();

    const selectTec = document.getElementById('clienteTecidoSelect');
    const inputTecManual = document.getElementById('clienteTecidoManual');
    let tecidoFinal = (selectTec.value === "OUTRA") ? inputTecManual.value : selectTec.value;

    if (!nome || !fone || !tecidoFinal) {
        alert("Por favor, preencha Nome, WhatsApp e Tecido.");
        return;
    }

    const btn = document.getElementById('btnFinalizar');
    btn.disabled = true;
    btn.innerText = "⏳ ENVIANDO...";

    try {
        const { data: perfil } = await _supabase
            .from('perfis_usuarios')
            .select('email_usuario')
            .ilike('email_usuario', `%${identificador}%`)
            .maybeSingle();

        const emailReal = perfil ? perfil.email_usuario : identificador;

        let conteudo = `NOME;${nome.toUpperCase()}\n`;
        conteudo += `TELEFONE;${fone}\n`;
        conteudo += `TECIDO;${tecidoFinal.toUpperCase()}\n`;
        conteudo += `OBS;${obsGerais}\n`;

        let temItemValido = false;
        const grupos = document.querySelectorAll('.grupo-modelagem');

        grupos.forEach(grupo => {
            const selectMod = grupo.querySelector('.i-mod-nome');
            const inputManual = grupo.querySelector('.i-mod-manual');
            let nomeMod = (selectMod.value === "OUTRA") ? inputManual.value : selectMod.value;
            nomeMod = (nomeMod || "PADRÃO").replace(/;/g, "").trim().toUpperCase();

            grupo.querySelectorAll('.corpo-tabela-itens tr').forEach(row => {
                const item = row.querySelector('.i-nome').value.trim();
                const tam = row.querySelector('.i-tam').value.trim().toUpperCase();
                const qtd = row.querySelector('.i-qtd').value.trim();
                
                // --- NOVA LÓGICA DE VALIDAÇÃO ---
                // Aceita se tiver o nome do item OU se tiver tamanho e quantidade
                if (item !== "" || (tam !== "" && qtd !== "")) {
                    temItemValido = true;
                    
                    const num = row.querySelector('.i-num').value.trim() || "0";
                    const adicional = row.querySelector('.i-adicional').value.trim() || "";
                    
                    // Se o item estiver vazio, salvamos como "ITEM" ou apenas vazio
                    const nomeItemFinal = item ? item.toUpperCase() : "ITEM";
                    
                    conteudo += `${nomeItemFinal};${tam};${num};${qtd};${adicional};${nomeMod}\n`;
                }
            });
        });

        if (!temItemValido) {
            alert("Adicione pelo menos um item ou tamanho/quantidade.");
            btn.disabled = false;
            btn.innerText = "FINALIZAR PEDIDO";
            return;
        }

        const { error } = await _supabase
            .from('pedidos_clientes')
            .insert([{ 
                cliente_email: emailReal, 
                conteudo_texto: conteudo, 
                status: 'pendente' 
            }]);

        if (error) throw error;

        document.getElementById('formulario-pedido').style.display = 'none';
        document.getElementById('tela-sucesso').style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
        console.error(err);
        alert("Erro ao enviar pedido. Verifique sua conexão.");
        btn.disabled = false;
        btn.innerText = "TENTAR NOVAMENTE";
    }
}
