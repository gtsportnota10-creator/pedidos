// CONFIGURAÇÕES DO SUPABASE (Mantido)
const SUPABASE_URL = 'https://kvhvelquxtcxukpkdabg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2aHZlbHF1eHRjeHVrcGtkYWJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MTk0MDAsImV4cCI6MjA4NDI5NTQwMH0.gVCU4i1M5GGR96bDHExFBMKuDOcpl7khj10zycbky-U';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let listaModelagens = [];

// 1. CARREGAR PERFIL AO ABRIR (Mantido)
async function carregarPerfil() {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('atendente');

    if (email) {
        const { data } = await _supabase
            .from('perfis_usuarios')
            .select('*')
            .eq('email_usuario', email)
            .single();

        if (data) {
            document.getElementById('nome-empresa').innerText = data.nome_empresa;
            document.getElementById('nome-atendente').innerText = `Atendimento: ${data.nome_atendente}`;
            if (data.modelagens) {
                listaModelagens = data.modelagens.split(',').map(item => item.trim());
            }
            if (data.url_logo) {
                const img = document.getElementById('logo-empresa');
                img.src = data.url_logo;
                img.style.display = 'inline-block';
            }
        }
    } else {
        document.getElementById('nome-empresa').innerText = "Vendedor não Identificado";
    }
    adicionarGrupoModelagem();
}

// 2. ADICIONAR UM NOVO GRUPO (Com lógica de "Outra" modelagem)
function adicionarGrupoModelagem() {
    const container = document.getElementById('container-modelagens');
    
    let opcoesHtml = '<option value="">Selecione a modelagem...</option>';
    listaModelagens.forEach(mod => {
        opcoesHtml += `<option value="${mod}">${mod}</option>`;
    });
    // Adiciona a opção para escrita manual
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

// Função para mostrar/esconder o campo de texto manual
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

// 3. ADICIONAR LINHA DE ITEM (Mantido)
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

    tr.querySelectorAll('input').forEach(input => {
        input.addEventListener('focus', function() {
            const wrapper = this.closest('.tabela-wrapper');
            const offsetLeft = this.parentElement.offsetLeft;
            wrapper.scrollTo({ left: offsetLeft - 20, behavior: 'smooth' });
        });
    });
}

// 4. ENVIAR PARA O SUPABASE (Lógica inteligente para Nome da Modelagem)
async function enviarPedido() {
    const params = new URLSearchParams(window.location.search);
    const emailAtendente = params.get('atendente');
    const nome = document.getElementById('clienteNome').value;
    const fone = document.getElementById('clienteTelefone').value;
    const obsGerais = document.getElementById('observacoesGerais').value;

    if (!nome || !fone) {
        alert("Por favor, preencha Nome e WhatsApp.");
        return;
    }

    const btn = document.getElementById('btnFinalizar');
    btn.disabled = true;
    btn.innerText = "⏳ ENVIANDO PEDIDO...";

   

    let conteudo = `NOME;${nome}\nTELEFONE;${fone}\nOBS;${obsGerais}\n`;
    let temItemValido = false;

    document.querySelectorAll('.grupo-modelagem').forEach(grupo => {
        const selectMod = grupo.querySelector('.i-mod-nome');
        const inputManual = grupo.querySelector('.i-mod-manual');
        
        let nomeMod = selectMod.value;
        if (nomeMod === "OUTRA") {
            nomeMod = inputManual.value || "Outra não definida";
        }
        // Garante que o nome da modelagem não tenha ponto e vírgula para não quebrar o sistema
        nomeMod = nomeMod.replace(/;/g, "").trim().toUpperCase();

        grupo.querySelectorAll('.corpo-tabela-itens tr').forEach(row => {
            const item = row.querySelector('.i-nome').value;
            if (item) {
                temItemValido = true;
                const tam = row.querySelector('.i-tam').value;
                const num = row.querySelector('.i-num').value;
                const qtd = row.querySelector('.i-qtd').value;
                const adicional = row.querySelector('.i-adicional').value;

                // O SEGREDO ESTÁ AQUI: Adicionamos a modelagem como a 6ª COLUNA de cada linha
                conteudo += `${item};${tam};${num};${qtd};${adicional};${nomeMod}\n`;
            }
        });
    });



    if (!temItemValido) {
        alert("Adicione pelo menos um item ao pedido.");
        btn.disabled = false;
        btn.innerText = "FINALIZAR PEDIDO";
        return;
    }

    try {
        const { error } = await _supabase
            .from('pedidos_clientes')
            .insert([{ 
                cliente_email: emailAtendente, 
                conteudo_texto: conteudo, 
                status: 'pendente' 
            }]);

        if (error) throw error;
        document.getElementById('formulario-pedido').style.display = 'none';
        document.getElementById('tela-sucesso').style.display = 'block';
        window.scrollTo(0, 0);
    } catch (err) {
        console.error(err);
        alert("Erro ao enviar pedido.");
        btn.disabled = false;
        btn.innerText = "TENTAR NOVAMENTE";
    }
}

window.onload = carregarPerfil;
