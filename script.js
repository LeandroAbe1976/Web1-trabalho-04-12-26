// ==========================================
// 1. CHAVEAMENTO E PERSISTÊNCIA DE DADOS
// ==========================================
let movimentacoes = [];
let contas = [];
let caixinhas = [];
let corridas = [];
let custoPorKm = 0;
let modoCusto = 'auto';
let insumos = [];
let produtos = [];
let idInsumoEmEdicao = null;
let custos = [];
let abastecimentos = [];
let orcamentos = [];
let modulos = { motorista: false, comercio: false, chapeacao: false };
let usuarioLogado = null;
let idEmEdicao = null;

// ==========================================
// 2. SISTEMA DE LOGIN, CADASTRO E RECUPERAÇÃO
// ==========================================
const PERGUNTAS = {
    animal: "Qual o nome do seu animal de estimação na infância?",
    professor: "Qual o nome do professor(a) que você mais gostava?",
    amigo: "Qual o nome do seu melhor amigo(a) na infância?",
    comida: "Qual a comida ou fruta que você mais gostava na infância?"
};

let usuarioRecuperacao = null;
let respostaConfirmada = false;

// Padroniza a resposta: minúsculas, sem acentos e sem NENHUM espaço
function normalizarTexto(texto) {
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '');
}

// Gera o hash SHA-256 (o usuário entra como "sal" para o hash ser único por pessoa)
async function gerarHash(usuario, segredo) {
    const bytes = new TextEncoder().encode(`${usuario}:${segredo}`);
    const buffer = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

function buscarUsuario(usuario) {
    const dados = localStorage.getItem(`user_${usuario}`);
    return dados ? JSON.parse(dados) : null;
}

function trocarTelaAuth(idAlvo) {
    document.querySelector('#secao-login').style.display = 'none';
    document.querySelector('#secao-cadastro').style.display = 'none';
    document.querySelector('#secao-recuperar').style.display = 'none';
    document.querySelector(`#${idAlvo}`).style.display = 'block';

    document.querySelector('#form-recuperar').reset();
    document.querySelector('#rec-usuario').disabled = false;
    document.querySelector('#rec-nova-senha').required = false;
    document.querySelector('#bloco-desafio-seguranca').style.display = 'none';
    document.querySelector('#bloco-nova-senha').style.display = 'none';
    document.querySelector('#btn-recuperar-acao').textContent = "Verificar Usuário";
    usuarioRecuperacao = null;
    respostaConfirmada = false;
}

document.querySelector('#link-ir-cadastro').addEventListener('click', (e) => {
    e.preventDefault();
    trocarTelaAuth('secao-cadastro');
});

document.querySelector('#link-ir-recuperar').addEventListener('click', (e) => {
    e.preventDefault();
    trocarTelaAuth('secao-recuperar');
});

document.querySelectorAll('.link-voltar-login').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        trocarTelaAuth('secao-login');
    });
});

// ---------- CADASTRO ----------
document.querySelector('#form-cadastro').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.querySelector('#cad-usuario').value.trim().toLowerCase();
    const pass = document.querySelector('#cad-senha').value;
    const pergunta = document.querySelector('#cad-pergunta').value;
    const resposta = normalizarTexto(document.querySelector('#cad-resposta').value);

    if (buscarUsuario(user)) {
        alert("Este nome de usuário já existe!");
        return;
    }
    if (resposta === '') {
        alert("Informe uma resposta de segurança válida.");
        return;
    }

    const dadosUsuario = {
        usuario: user,
        senhaHash: await gerarHash(user, pass),
        perguntaChave: pergunta,
        respostaHash: await gerarHash(user, resposta)
    };

    localStorage.setItem(`user_${user}`, JSON.stringify(dadosUsuario));
    alert("Conta criada com sucesso! Faça seu login.");
    document.querySelector('#form-cadastro').reset();
    trocarTelaAuth('secao-login');
});

// ---------- LOGIN ----------
document.querySelector('#form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.querySelector('#login-usuario').value.trim().toLowerCase();
    const pass = document.querySelector('#login-senha').value;

    const dados = buscarUsuario(user);
    if (dados && dados.senhaHash === await gerarHash(user, pass)) {
        logarNoSistema(user);
        return;
    }
    alert("Usuário ou senha incorretos!");
});

// ---------- RECUPERAÇÃO (3 etapas: usuário -> resposta -> nova senha) ----------
document.querySelector('#form-recuperar').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnAcao = document.querySelector('#btn-recuperar-acao');

    if (!usuarioRecuperacao) {
        const user = document.querySelector('#rec-usuario').value.trim().toLowerCase();
        const dados = buscarUsuario(user);
        if (!dados) {
            alert("Usuário não encontrado!");
            return;
        }
        usuarioRecuperacao = dados;
        document.querySelector('#texto-pergunta-seguranca').innerHTML =
            `<strong>Pergunta cadastrada:</strong><br>${PERGUNTAS[dados.perguntaChave]}`;
        document.querySelector('#bloco-desafio-seguranca').style.display = 'block';
        document.querySelector('#rec-usuario').disabled = true;
        btnAcao.textContent = "Confirmar Resposta";

    } else if (!respostaConfirmada) {
        const resposta = normalizarTexto(document.querySelector('#rec-resposta').value);
        const hash = await gerarHash(usuarioRecuperacao.usuario, resposta);

        if (hash === usuarioRecuperacao.respostaHash) {
            respostaConfirmada = true;
            document.querySelector('#bloco-desafio-seguranca').style.display = 'none';
            document.querySelector('#bloco-nova-senha').style.display = 'block';
            document.querySelector('#rec-nova-senha').required = true;
            btnAcao.textContent = "Salvar Nova Senha";
        } else {
            alert("❌ Resposta de segurança incorreta! Tente novamente.");
        }

    } else {
        const novaSenha = document.querySelector('#rec-nova-senha').value;
        if (novaSenha.length < 4) {
            alert("A senha precisa ter no mínimo 4 caracteres.");
            return;
        }
        usuarioRecuperacao.senhaHash = await gerarHash(usuarioRecuperacao.usuario, novaSenha);
        localStorage.setItem(`user_${usuarioRecuperacao.usuario}`, JSON.stringify(usuarioRecuperacao));
        alert("✅ Senha redefinida com sucesso! Faça seu login.");
        trocarTelaAuth('secao-login');
    }
});

// ---------- SESSÃO ----------
function logarNoSistema(usuario) {
    usuarioLogado = usuario;
    sessionStorage.setItem('usuario_logado', usuario);
    movimentacoes = JSON.parse(localStorage.getItem(`fluxo_caixa_${usuario}`)) || [];
    contas = JSON.parse(localStorage.getItem(`contas_pagar_${usuario}`)) || [];
    caixinhas = JSON.parse(localStorage.getItem(`caixinhas_${usuario}`)) || [];
    corridas = JSON.parse(localStorage.getItem(`corridas_${usuario}`)) || [];
    custoPorKm = parseFloat(localStorage.getItem(`custo_km_${usuario}`)) || 0;
    modoCusto = localStorage.getItem(`modo_custo_${usuario}`) || 'auto';
    insumos = JSON.parse(localStorage.getItem(`insumos_${usuario}`)) || [];
    produtos = JSON.parse(localStorage.getItem(`produtos_${usuario}`)) || [];
    modulos = { motorista: false, comercio: false, chapeacao: false, ...JSON.parse(localStorage.getItem(`modulos_${usuario}`)) };
    custos = JSON.parse(localStorage.getItem(`custos_${usuario}`)) || [];
    abastecimentos = JSON.parse(localStorage.getItem(`abastecimentos_${usuario}`)) || [];
    orcamentos = JSON.parse(localStorage.getItem(`orcamentos_${usuario}`)) || [];
    aplicarModulos();

    document.querySelector('#container-autenticacao').style.display = 'none';
    document.querySelector('#app-principal').style.display = 'block';
    atualizarSistema();
}

document.querySelector('#btn-logout').addEventListener('click', () => {
    sessionStorage.removeItem('usuario_logado');
    usuarioLogado = null;
    movimentacoes = [];
    contas = [];
    caixinhas = [];
    corridas = [];
    insumos = [];
    produtos = [];
    custos = [];
    abastecimentos = [];
    orcamentos = [];
    idEmEdicao = null;

    document.querySelector('#app-principal').style.display = 'none';
    document.querySelector('#container-autenticacao').style.display = 'flex';
    document.querySelector('#form-login').reset();
    trocarTelaAuth('secao-login');
});

// ==========================================
// 3. EVENTOS DE INTERFACE DO FLUXO DE CAIXA
// ==========================================
const seletorPerfil = document.querySelector('#perfil');
const grupoSubperfil = document.querySelector('#grupo-subperfil');
const seletorSubperfil = document.querySelector('#subperfil');
const formFinanceiro = document.querySelector('#form-financeiro');
const formContas = document.querySelector('#form-contas');

seletorPerfil.addEventListener('change', () => {
    if (seletorPerfil.value === 'Profissional') {
        grupoSubperfil.style.display = 'block';
        seletorSubperfil.setAttribute('required', 'true');
    } else {
        grupoSubperfil.style.display = 'none';
        seletorSubperfil.removeAttribute('required');
        seletorSubperfil.value = '';
    }
});

// ==========================================
// 4. MÓDULO 1: OPERAÇÕES DO FLUXO DE CAIXA (CRUD)
// ==========================================
formFinanceiro.addEventListener('submit', (e) => {
    e.preventDefault();

    const novaMovimentacao = {
        id: idEmEdicao || Date.now(),
        perfil: seletorPerfil.value,
        subperfil: seletorSubperfil.value || "Pessoal",
        data: document.querySelector('#data').value,
        descricao: document.querySelector('#descricao').value,
        tipo: document.querySelector('#tipo').value,
        categoria: document.querySelector('#categoria').value,
        valor: lerMoeda(document.querySelector('#valor').value),
        pagamento: document.querySelector('#pagamento').value,
        origem: document.querySelector('#tipo').value === 'Receita' && !document.querySelector('#grupo-origem').style.display
            ? document.querySelector('#origem').value : undefined
    };

    if (idEmEdicao) {
        movimentacoes = movimentacoes.map(m => m.id === idEmEdicao
            ? { ...novaMovimentacao, separado: m.separado, corridaId: m.corridaId, orcamentoId: m.orcamentoId, custoId: m.custoId, abastecimentoId: m.abastecimentoId }
            : m);
        idEmEdicao = null;
        document.querySelector('#btn-salvar').textContent = "Salvar Registro";
    atualizarGrupoSeparar();
        document.querySelector('#btn-cancelar').style.display = 'none';
    } else {
        if (novaMovimentacao.tipo === 'Receita') {
            novaMovimentacao.separado = separarParaCaixinha(
                novaMovimentacao.valor,
                parseFloat(document.querySelector('#sep-pct').value),
                document.querySelector('#sep-caixinha').value,
                document.querySelector('#sep-nome').value
            ) || undefined;
        }
        movimentacoes.push(novaMovimentacao);
    }

    salvarMovimentacoes();
    formFinanceiro.reset();
    grupoSubperfil.style.display = 'none';
    
    atualizarSistema();
});

function deletarMovimentacao(id) {
    movimentacoes = movimentacoes.filter(m => m.id !== id);
    salvarMovimentacoes();
    atualizarSistema();
}

function iniciarEdicaoMovimentacao(id) {
    const item = movimentacoes.find(m => m.id === id);
    if (!item) return;

    idEmEdicao = item.id;
    seletorPerfil.value = item.perfil;
    
    if (item.perfil === 'Profissional') {
        grupoSubperfil.style.display = 'block';
        seletorSubperfil.value = item.subperfil;
    } else {
        grupoSubperfil.style.display = 'none';
    }

    document.querySelector('#data').value = item.data;
    document.querySelector('#descricao').value = item.descricao;
    document.querySelector('#tipo').value = item.tipo;
    document.querySelector('#categoria').value = item.categoria;
    definirMoeda('#valor', item.valor);
    document.querySelector('#pagamento').value = item.pagamento || 'Pix';
    document.querySelector('#origem').value = item.origem || 'Uber';

    document.querySelector('#btn-salvar').textContent = "Atualizar";
    atualizarGrupoSeparar();
    document.querySelector('#btn-cancelar').style.display = 'inline-block';
}

document.querySelector('#btn-cancelar').addEventListener('click', () => {
    idEmEdicao = null;
    formFinanceiro.reset();
    grupoSubperfil.style.display = 'none';
    document.querySelector('#btn-salvar').textContent = "Salvar Registro";
    atualizarGrupoSeparar();
    document.querySelector('#btn-cancelar').style.display = 'none';
});

// ==========================================
// 5. MÓDULO 2: AGENDA DE CONTAS (CRUD)
// ==========================================
const seletorRecorrencia = document.querySelector('#conta-recorrencia');
const grupoDataFinal = document.querySelector('#grupo-data-final');

seletorRecorrencia.addEventListener('change', () => {
    const recorrente = seletorRecorrencia.value === 'mensal';
    grupoDataFinal.style.display = recorrente ? 'block' : 'none';
    document.querySelector('#conta-data-final').required = recorrente;
});

formContas.addEventListener('submit', (e) => {
    e.preventDefault();

    const descricao = document.querySelector('#conta-descricao').value;
    const valor = lerMoeda(document.querySelector('#conta-valor').value);
    const vencimento = document.querySelector('#conta-vencimento').value;
    const alerta = parseInt(document.querySelector('#conta-alerta').value);
    const dataFinal = document.querySelector('#conta-data-final').value;

    let datas = [vencimento];
    if (seletorRecorrencia.value === 'mensal') {
        if (dataFinal < vencimento) {
            alert("A data final deve ser igual ou depois do primeiro vencimento.");
            return;
        }
        datas = [];
        for (let n = 0; n < 120; n++) {
            const data = somarMeses(vencimento, n);
            if (data > dataFinal) break;
            datas.push(data);
        }
    }

    datas.forEach((data, i) => {
        contas.push({
            id: Date.now() + i,
            descricao: datas.length > 1 ? `${descricao} (${i + 1}/${datas.length})` : descricao,
            valor,
            vencimento: data,
            alerta,
            status: "Pendente"
        });
    });

    salvarContas();
    formContas.reset();
    grupoDataFinal.style.display = 'none';
    atualizarSistema();
});

function confirmarPagamentoConta(id) {
    contas = contas.map(c => {
        if (c.id === id) {
            c.status = "Paga";
            
            movimentacoes.push({
                id: Date.now(),
                perfil: "Geral",
                subperfil: "Geral",
                data: new Date().toISOString().split('T')[0],
                descricao: `[PAGO] ${c.descricao}`,
                tipo: "Despesa",
                categoria: "Contas Agendadas",
                valor: c.valor
            });
        }
        return c;
    });

    salvarContas();
    salvarMovimentacoes();
    atualizarSistema();
}

function deletarConta(id) {
    contas = contas.filter(c => c.id !== id);
    salvarContas();
    atualizarSistema();
}

// ==========================================
// 6. RENDERIZAÇÃO (READ)
// ==========================================
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(dataISO) {
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

function atualizarSistema() {
    renderizarMovimentacoes();
    renderizarContas();
    renderizarResumo();
    renderizarAlertas();
    renderizarDiagnostico();
    renderizarCaixinhas();
    renderizarCorridas();
    renderizarInsumos();
    renderizarProdutos();
    renderizarCustos();
    renderizarAbastecimentos();
    renderizarPagamentos();
    renderizarResultadoModulo('comercio');
    renderizarResultadoModulo('chapeacao');
    renderizarCardsApps();
    renderizarOrcamentos();
    atualizarSelectsSeparacao();
    atualizarGrupoSeparar();
}

function renderizarMovimentacoes() {
    const corpo = document.querySelector('#lista-movimentacoes');
    corpo.innerHTML = '';

    movimentacoes.forEach(m => {
        const tr = document.createElement('tr');
        const classe = m.tipo === 'Receita' ? 'texto-verde' : 'texto-vermelho';
        tr.innerHTML = `
            <td>${formatarData(m.data)}</td>
            <td>${escaparHTML(m.descricao)}<br><small>${escaparHTML(m.categoria)}${m.origem ? ' · ' + escaparHTML(m.origem) : ''}${m.pagamento ? ' · ' + escaparHTML(m.pagamento) : ''}</small></td>
            <td>${m.tipo}</td>
            <td class="${classe}">${formatarMoeda(m.valor)}${m.separado ? `<br><small>separado ${formatarMoeda(m.separado)} → disponível ${formatarMoeda(m.valor - m.separado)}</small>` : ''}</td>
            <td>
                <button class="btn-edit" onclick="iniciarEdicaoMovimentacao(${m.id})">Editar</button>
                <button class="btn-danger" onclick="deletarMovimentacao(${m.id})">Excluir</button>
            </td>`;
        corpo.appendChild(tr);
    });
}

function renderizarContas() {
    const corpo = document.querySelector('#lista-contas');
    corpo.innerHTML = '';

    [...contas].sort((a, b) => a.vencimento.localeCompare(b.vencimento)).forEach(c => {
        const tr = document.createElement('tr');
        const paga = c.status === 'Paga';
        tr.innerHTML = `
            <td>${formatarData(c.vencimento)}</td>
            <td>${escaparHTML(c.descricao)}</td>
            <td>${formatarMoeda(c.valor)}</td>
            <td><span class="${paga ? 'status-paga' : 'status-pendente'}">${c.status}</span></td>
            <td>
                ${paga ? '' : `<button class="btn-success" onclick="confirmarPagamentoConta(${c.id})">Pagar</button>`}
                <button class="btn-danger" onclick="deletarConta(${c.id})">Excluir</button>
            </td>`;
        corpo.appendChild(tr);
    });
}

function renderizarResumo() {
    const entradas = movimentacoes
        .filter(m => m.tipo === 'Receita')
        .reduce((soma, m) => soma + m.valor, 0);
    const saidas = movimentacoes
        .filter(m => m.tipo === 'Despesa')
        .reduce((soma, m) => soma + m.valor, 0);
    const saldo = entradas - saidas;

    document.querySelector('#total-entradas').textContent = formatarMoeda(entradas);
    document.querySelector('#total-saidas').textContent = formatarMoeda(saidas);

    const elSaldo = document.querySelector('#saldo-liquido');
    elSaldo.textContent = formatarMoeda(saldo);
    elSaldo.className = saldo >= 0 ? 'texto-verde' : 'texto-vermelho';
}

function renderizarAlertas() {
    const painel = document.querySelector('#painel-alertas');
    const lista = document.querySelector('#lista-alertas-mensagens');
    lista.innerHTML = '';

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    let total = 0;

    contas.filter(c => c.status === 'Pendente').forEach(c => {
        const venc = new Date(c.vencimento + 'T00:00:00');
        const dias = Math.round((venc - hoje) / 86400000);
        let classe = '';
        let texto = '';

        if (dias < 0) {
            classe = 'alerta-perigo';
            texto = `🚨 "${c.descricao}" está VENCIDA há ${Math.abs(dias)} dia(s)!`;
        } else if (dias === 0) {
            classe = 'alerta-perigo';
            texto = `⏰ "${c.descricao}" vence HOJE!`;
        } else if (dias <= c.alerta) {
            classe = 'alerta-atencao';
            texto = `⚠️ "${c.descricao}" vence em ${dias} dia(s).`;
        }

        if (classe) {
            const div = document.createElement('div');
            div.className = `mensagem-alerta ${classe}`;
            div.textContent = texto;
            lista.appendChild(div);
            total++;
        }
    });

    painel.style.display = total > 0 ? 'block' : 'none';
}

// ==========================================
// 6B. RECORRÊNCIA, CAIXINHAS, MOTORISTA E DIAGNÓSTICO
// ==========================================
function escaparHTML(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

function calcularSaldo() {
    return movimentacoes.reduce((soma, m) => soma + (m.tipo === 'Receita' ? m.valor : -m.valor), 0);
}

function mesAtual() {
    const h = new Date();
    return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}`;
}

function arredondar(valor) {
    return Math.round(valor * 100) / 100;
}

function salvarCaixinhas() {
    localStorage.setItem(`caixinhas_${usuarioLogado}`, JSON.stringify(caixinhas));
}

function salvarCorridas() {
    localStorage.setItem(`corridas_${usuarioLogado}`, JSON.stringify(corridas));
}

// ---------- Contas recorrentes (ex: financiamento com data final) ----------
function somarMeses(dataISO, meses) {
    const [ano, mes, dia] = dataISO.split('-').map(Number);
    const total = (mes - 1) + meses;
    const novoAno = ano + Math.floor(total / 12);
    const novoMes = total % 12;
    const ultimoDia = new Date(novoAno, novoMes + 1, 0).getDate();
    const novoDia = Math.min(dia, ultimoDia);
    return `${novoAno}-${String(novoMes + 1).padStart(2, '0')}-${String(novoDia).padStart(2, '0')}`;
}

// ---------- Caixinhas ----------
const formCaixinha = document.querySelector('#form-caixinha');

formCaixinha.addEventListener('submit', (e) => {
    e.preventDefault();
    caixinhas.push({
        id: Date.now(),
        nome: document.querySelector('#caixinha-nome').value.trim(),
        meta: lerMoeda(document.querySelector('#caixinha-meta').value),
        guardado: 0
    });
    salvarCaixinhas();
    formCaixinha.reset();
    atualizarSistema();
});

function movimentarCaixinha(id, sinal) {
    const valor = lerMoeda(document.querySelector(`#valor-caixinha-${id}`).value);
    if (!valor || valor <= 0) {
        alert("Informe um valor maior que zero.");
        return;
    }
    caixinhas = caixinhas.map(c => {
        if (c.id !== id) return c;
        if (sinal < 0 && valor > c.guardado) {
            alert("Você não pode retirar mais do que o valor guardado.");
            return c;
        }
        return { ...c, guardado: arredondar(c.guardado + sinal * valor) };
    });
    salvarCaixinhas();
    atualizarSistema();
}

function deletarCaixinha(id) {
    const caixinha = caixinhas.find(c => c.id === id);
    if (!caixinha) return;
    if (!confirm(`Excluir a caixinha "${caixinha.nome}"?`)) return;
    caixinhas = caixinhas.filter(c => c.id !== id);
    salvarCaixinhas();
    atualizarSistema();
}

function renderizarCaixinhas() {
    const lista = document.querySelector('#lista-caixinhas');
    lista.innerHTML = '';

    const totalGuardado = caixinhas.reduce((soma, c) => soma + c.guardado, 0);
    document.querySelector('#resumo-caixinhas').textContent =
        `Guardado nas caixinhas: ${formatarMoeda(totalGuardado)} | Saldo livre: ${formatarMoeda(calcularSaldo() - totalGuardado)}`;

    if (caixinhas.length === 0) {
        lista.innerHTML = '<p class="vazio">Nenhuma caixinha ainda. Crie uma reserva de emergência, uma para manutenção do veículo ou qualquer objetivo seu.</p>';
        return;
    }

    caixinhas.forEach(c => {
        const pct = c.meta > 0 ? Math.min(100, Math.round(c.guardado / c.meta * 100)) : 0;
        const div = document.createElement('div');
        div.className = 'caixinha';
        div.innerHTML = `
            <div class="caixinha-topo">
                <span>${escaparHTML(c.nome)}</span>
                <span>${formatarMoeda(c.guardado)}${c.meta > 0 ? ' / ' + formatarMoeda(c.meta) : ''}</span>
            </div>
            ${c.meta > 0 ? `<div class="barra"><div class="barra-preenchida" style="width:${pct}%"></div></div>
                <small>${pct >= 100 ? '🎉 Meta atingida!' : pct + '% da meta'}</small>` : ''}
            <div class="caixinha-acoes">
                <input type="text" inputmode="numeric" data-moeda id="valor-caixinha-${c.id}" placeholder="Valor 0,00">
                <button class="btn-success" onclick="movimentarCaixinha(${c.id}, 1)">Guardar</button>
                <button class="btn-edit" onclick="movimentarCaixinha(${c.id}, -1)">Retirar</button>
                <button class="btn-danger" onclick="deletarCaixinha(${c.id})">Excluir</button>
            </div>`;
        lista.appendChild(div);
    });
}

// ---------- Diagnóstico: como está o fluxo ----------
function renderizarDiagnostico() {
    const lista = document.querySelector('#lista-diagnostico');
    lista.innerHTML = '';
    const adicionar = (classe, texto) => {
        const div = document.createElement('div');
        div.className = `mensagem-alerta ${classe}`;
        div.textContent = texto;
        lista.appendChild(div);
    };

    const doMes = movimentacoes.filter(m => m.data.startsWith(mesAtual()));
    const entradas = doMes.filter(m => m.tipo === 'Receita').reduce((s, m) => s + m.valor, 0);
    const saidas = doMes.filter(m => m.tipo === 'Despesa').reduce((s, m) => s + m.valor, 0);

    if (entradas === 0 && saidas === 0) {
        adicionar('alerta-info', '📝 Ainda não há lançamentos neste mês.');
    } else if (entradas === 0) {
        adicionar('alerta-perigo', `🔴 Neste mês só há saídas (${formatarMoeda(saidas)}) e nenhuma entrada.`);
    } else {
        const pct = Math.round(saidas / entradas * 100);
        if (pct <= 70) {
            adicionar('alerta-sucesso', `✅ Neste mês você gastou ${pct}% do que entrou. Sobram ${formatarMoeda(entradas - saidas)}.`);
        } else if (pct <= 100) {
            adicionar('alerta-atencao', `⚠️ Neste mês você já gastou ${pct}% do que entrou. Pouca folga: cuidado com novos gastos.`);
        } else {
            adicionar('alerta-perigo', `🔴 Neste mês você gastou ${pct}% do que entrou: saiu mais do que entrou.`);
        }
    }

    const limite = new Date();
    limite.setHours(0, 0, 0, 0);
    limite.setDate(limite.getDate() + 30);
    const aPagar = contas
        .filter(c => c.status === 'Pendente' && new Date(c.vencimento + 'T00:00:00') <= limite)
        .reduce((soma, c) => soma + c.valor, 0);
    const saldoLivre = calcularSaldo() - caixinhas.reduce((soma, c) => soma + c.guardado, 0);

    if (aPagar > 0) {
        if (saldoLivre >= aPagar) {
            adicionar('alerta-info', `📅 Contas até os próximos 30 dias: ${formatarMoeda(aPagar)}. Seu saldo livre cobre.`);
        } else {
            adicionar('alerta-atencao', `📅 Contas até os próximos 30 dias: ${formatarMoeda(aPagar)}. Faltam ${formatarMoeda(aPagar - saldoLivre)} no saldo livre.`);
        }
    }

    if (caixinhas.length === 0) {
        adicionar('alerta-info', '💡 Que tal criar uma caixinha de reserva de emergência?');
    }
}

// ---------- Módulos (o usuário ativa o que combina com ele) ----------
const NOMES_MODULOS = ['motorista', 'comercio', 'chapeacao'];

function aplicarModulos() {
    NOMES_MODULOS.forEach(nome => {
        document.querySelector(`#modulo-${nome}`).style.display = modulos[nome] ? '' : 'none';
        document.querySelector(`#mod-${nome}`).checked = !!modulos[nome];
    });
}

NOMES_MODULOS.forEach(nome => {
    document.querySelector(`#mod-${nome}`).addEventListener('change', (e) => {
        modulos[nome] = e.target.checked;
        localStorage.setItem(`modulos_${usuarioLogado}`, JSON.stringify(modulos));
        aplicarModulos();
    });
});

// ---------- Comércio: insumos, custo e lucro por produto ----------
// Para cada unidade de compra, quanto vale 1 unidade de uso na unidade da compra
const UNIDADES = {
    kg: { kg: 1, g: 0.001 },
    g: { g: 1, kg: 1000 },
    L: { L: 1, ml: 0.001 },
    ml: { ml: 1, L: 1000 },
    un: { un: 1 }
};

const formInsumo = document.querySelector('#form-insumo');

function salvarInsumos() {
    localStorage.setItem(`insumos_${usuarioLogado}`, JSON.stringify(insumos));
}

function salvarProdutos() {
    localStorage.setItem(`produtos_${usuarioLogado}`, JSON.stringify(produtos));
}

function dataHoje() {
    return `${mesAtual()}-${String(new Date().getDate()).padStart(2, '0')}`;
}

function formatarCustoUnitario(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function insumoEmUso(id) {
    return produtos.some(p => p.itens.some(i => i.insumoId === id));
}

function cancelarEdicaoInsumo() {
    idInsumoEmEdicao = null;
    formInsumo.reset();
    document.querySelector('#insumo-unidade').disabled = false;
    document.querySelector('#btn-salvar-insumo').textContent = 'Salvar Insumo';
    document.querySelector('#btn-cancelar-insumo').style.display = 'none';
}

formInsumo.addEventListener('submit', (e) => {
    e.preventDefault();
    const dados = {
        nome: document.querySelector('#insumo-nome').value.trim(),
        preco: lerMoeda(document.querySelector('#insumo-preco').value),
        qtd: parseFloat(document.querySelector('#insumo-qtd').value),
        unidade: document.querySelector('#insumo-unidade').value
    };

    if (idInsumoEmEdicao) {
        insumos = insumos.map(i => i.id === idInsumoEmEdicao ? { ...i, ...dados } : i);
    } else {
        insumos.push({ id: Date.now(), ...dados });
    }

    // A compra também vira uma saída no fluxo de caixa
    if (document.querySelector('#insumo-caixa').checked) {
        movimentacoes.push({
            id: Date.now() + 1,
            perfil: 'Profissional',
            subperfil: 'Banquinha / Comercio',
            data: dataHoje(),
            descricao: `Compra: ${dados.nome} (${dados.qtd} ${dados.unidade})`,
            tipo: 'Despesa',
            categoria: 'Compra de insumos',
            valor: dados.preco,
            pagamento: document.querySelector('#insumo-pagamento').value
        });
        salvarMovimentacoes();
    }

    salvarInsumos();
    cancelarEdicaoInsumo();
    atualizarSistema();
});

document.querySelector('#btn-cancelar-insumo').addEventListener('click', cancelarEdicaoInsumo);

function iniciarEdicaoInsumo(id) {
    const insumo = insumos.find(i => i.id === id);
    if (!insumo) return;
    idInsumoEmEdicao = id;
    document.querySelector('#insumo-nome').value = insumo.nome;
    definirMoeda('#insumo-preco', insumo.preco);
    document.querySelector('#insumo-qtd').value = insumo.qtd;
    document.querySelector('#insumo-unidade').value = insumo.unidade;
    document.querySelector('#insumo-unidade').disabled = insumoEmUso(id);
    document.querySelector('#btn-salvar-insumo').textContent = 'Atualizar (nova compra)';
    document.querySelector('#btn-cancelar-insumo').style.display = 'inline-block';
}

function deletarInsumo(id) {
    if (insumoEmUso(id)) {
        alert("Este insumo é usado em um produto. Exclua o produto antes.");
        return;
    }
    insumos = insumos.filter(i => i.id !== id);
    salvarInsumos();
    atualizarSistema();
}

function renderizarInsumos() {
    const corpo = document.querySelector('#lista-insumos');
    corpo.innerHTML = '';
    insumos.forEach(i => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escaparHTML(i.nome)}</td>
            <td>${formatarMoeda(i.preco)} / ${i.qtd} ${i.unidade}</td>
            <td>${formatarCustoUnitario(i.preco / i.qtd)} / ${i.unidade}</td>
            <td>
                <button class="btn-edit" onclick="iniciarEdicaoInsumo(${i.id})">Editar</button>
                <button class="btn-danger" onclick="deletarInsumo(${i.id})">Excluir</button>
            </td>`;
        corpo.appendChild(tr);
    });
}

// Produto: linhas "insumo + quantidade usada"
function adicionarLinhaItem() {
    if (insumos.length === 0) {
        alert("Cadastre ao menos um insumo antes de montar um produto.");
        return;
    }
    const linha = document.createElement('div');
    linha.className = 'linha-item';
    linha.innerHTML = `
        <select class="item-insumo">${insumos.map(i => `<option value="${i.id}">${escaparHTML(i.nome)}</option>`).join('')}</select>
        <input type="number" class="item-qtd" step="any" min="0.0001" placeholder="Qtd usada" required>
        <select class="item-unidade"></select>
        <button type="button" class="btn-danger">✕</button>`;

    const selInsumo = linha.querySelector('.item-insumo');
    const selUnidade = linha.querySelector('.item-unidade');
    const atualizarUnidades = () => {
        const insumo = insumos.find(i => i.id === Number(selInsumo.value));
        selUnidade.innerHTML = Object.keys(UNIDADES[insumo.unidade]).map(u => `<option value="${u}">${u}</option>`).join('');
    };
    selInsumo.addEventListener('change', atualizarUnidades);
    linha.querySelector('button').addEventListener('click', () => linha.remove());
    atualizarUnidades();
    document.querySelector('#itens-produto').appendChild(linha);
}

document.querySelector('#btn-add-item').addEventListener('click', adicionarLinhaItem);

document.querySelector('#form-produto').addEventListener('submit', (e) => {
    e.preventDefault();
    const itens = [...document.querySelectorAll('#itens-produto .linha-item')].map(linha => ({
        insumoId: Number(linha.querySelector('.item-insumo').value),
        qtd: parseFloat(linha.querySelector('.item-qtd').value),
        unidade: linha.querySelector('.item-unidade').value
    }));
    if (itens.length === 0) {
        alert("Adicione ao menos um insumo ao produto.");
        return;
    }
    produtos.push({
        id: Date.now(),
        nome: document.querySelector('#produto-nome').value.trim(),
        preco: lerMoeda(document.querySelector('#produto-preco').value),
        itens
    });
    salvarProdutos();
    e.target.reset();
    document.querySelector('#itens-produto').innerHTML = '';
    atualizarSistema();
});

function deletarProduto(id) {
    produtos = produtos.filter(p => p.id !== id);
    salvarProdutos();
    atualizarSistema();
}

// Custo = soma de (quantidade usada × custo por unidade de cada insumo), sempre com o preço atual do insumo
function calcularCustoProduto(produto) {
    return produto.itens.reduce((soma, item) => {
        const insumo = insumos.find(i => i.id === item.insumoId);
        if (!insumo) return soma;
        const qtdNaUnidadeDaCompra = item.qtd * UNIDADES[insumo.unidade][item.unidade];
        return soma + qtdNaUnidadeDaCompra * (insumo.preco / insumo.qtd);
    }, 0);
}

function avaliarMargem(margem, custo) {
    if (margem < 0) {
        return { classe: 'alerta-perigo', cor: 'texto-vermelho', texto: '🔴 Vendendo no prejuízo: o custo é maior que o preço de venda.' };
    }
    if (margem < 30) {
        return { classe: 'alerta-atencao', cor: 'texto-amarelo', texto: `🟡 Margem baixa (menos de 30%). Para ter 30% de margem, venda por ${formatarMoeda(custo / 0.7)}.` };
    }
    return { classe: 'alerta-sucesso', cor: 'texto-verde', texto: '🟢 Boa margem de lucro.' };
}

function renderizarProdutos() {
    const lista = document.querySelector('#lista-produtos');
    lista.innerHTML = '';
    if (produtos.length === 0) {
        lista.innerHTML = '<p class="vazio">Nenhum produto ainda. Cadastre os insumos, depois monte o produto com as quantidades usadas.</p>';
        return;
    }

    produtos.forEach(p => {
        const custo = calcularCustoProduto(p);
        const lucro = p.preco - custo;
        const margem = p.preco > 0 ? lucro / p.preco * 100 : 0;
        const veredito = avaliarMargem(margem, custo);
        const composicao = p.itens.map(i => {
            const insumo = insumos.find(x => x.id === i.insumoId);
            return `${i.qtd} ${i.unidade} de ${escaparHTML(insumo ? insumo.nome : '?')}`;
        }).join(' + ');

        const div = document.createElement('div');
        div.className = 'caixinha';
        div.innerHTML = `
            <div class="caixinha-topo"><span>${escaparHTML(p.nome)}</span><span>Venda: ${formatarMoeda(p.preco)}</span></div>
            <div class="mini-resumo">
                <div>Custo<strong>${formatarMoeda(custo)}</strong></div>
                <div>Lucro<strong class="${veredito.cor}">${formatarMoeda(lucro)}</strong></div>
                <div>Margem<strong class="${veredito.cor}">${margem.toFixed(1)}%</strong></div>
            </div>
            <div class="mensagem-alerta ${veredito.classe}">${veredito.texto}</div>
            <small>${composicao}</small>
            <div class="caixinha-acoes"><button class="btn-danger" onclick="deletarProduto(${p.id})">Excluir</button></div>`;
        lista.appendChild(div);
    });
}

// ==========================================
// 6C. DINHEIRO COM VÍRGULA AUTOMÁTICA, SEPARAÇÃO, CUSTOS DO VEÍCULO, APPS E ORÇAMENTOS
// ==========================================

// ---------- Campos de dinheiro: só digitar os números, a vírgula entra sozinha ----------
function formatarCampoMoeda(numero, casas = 2) {
    return numero.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

function lerMoeda(texto, casas = 2) {
    const digitos = String(texto).replace(/\D/g, '');
    return digitos === '' ? 0 : parseInt(digitos, 10) / Math.pow(10, casas);
}

function definirMoeda(seletor, numero) {
    document.querySelector(seletor).value = numero > 0 ? formatarCampoMoeda(numero) : '';
}

document.addEventListener('input', (e) => {
    if (!e.target.matches('input[data-moeda]')) return;
    const casas = Number(e.target.dataset.casas || 2);
    const digitos = e.target.value.replace(/\D/g, '');
    e.target.value = digitos === '' ? '' : formatarCampoMoeda(parseInt(digitos, 10) / Math.pow(10, casas), casas);
});

// ---------- Separar um percentual de cada entrada para uma caixinha ----------
function atualizarGrupoSeparar() {
    const receita = document.querySelector('#tipo').value === 'Receita';
    document.querySelector('#grupo-separar').style.display = receita && !idEmEdicao ? '' : 'none';
    const motorista = document.querySelector('#perfil').value === 'Profissional'
        && document.querySelector('#subperfil').value === 'Motorista de App';
    document.querySelector('#grupo-origem').style.display = receita && motorista ? '' : 'none';
}

document.querySelector('#tipo').addEventListener('change', atualizarGrupoSeparar);
document.querySelector('#perfil').addEventListener('change', atualizarGrupoSeparar);
document.querySelector('#subperfil').addEventListener('change', atualizarGrupoSeparar);

function atualizarSelectsSeparacao() {
    ['#sep-caixinha', '#orc-sep-caixinha'].forEach(seletor => {
        const select = document.querySelector(seletor);
        const atual = select.value;
        select.innerHTML = '<option value="">Caixinha "Separado" (automática)</option>' +
            caixinhas.map(c => `<option value="${c.id}">${escaparHTML(c.nome)}</option>`).join('');
        if ([...select.options].some(o => o.value === atual)) select.value = atual;
    });
}

// Se a pessoa der um nome, usa (ou cria) a caixinha com esse nome; senão usa a escolhida ou "Separado"
function separarParaCaixinha(valorEntrada, percentual, idCaixinha, nome) {
    if (!percentual || percentual <= 0) return 0;
    const separado = arredondar(valorEntrada * Math.min(percentual, 100) / 100);
    const nomeLimpo = (nome || '').trim();
    const achar = (n) => caixinhas.find(c => normalizarTexto(c.nome) === normalizarTexto(n));

    let alvo = null;
    if (nomeLimpo) alvo = achar(nomeLimpo);
    else if (idCaixinha) alvo = caixinhas.find(c => c.id === Number(idCaixinha));
    if (!alvo) alvo = achar(nomeLimpo || 'Separado');
    if (!alvo) {
        alvo = { id: Date.now() + 2, nome: nomeLimpo || 'Separado', meta: 0, guardado: 0 };
        caixinhas.push(alvo);
    }

    alvo.guardado = arredondar(alvo.guardado + separado);
    salvarCaixinhas();
    return separado;
}


// ---------- Orçamento de Chapeação e Pintura ----------
const formOrcamento = document.querySelector('#form-orcamento');

function salvarOrcamentos() {
    localStorage.setItem(`orcamentos_${usuarioLogado}`, JSON.stringify(orcamentos));
}

function adicionarLinhaOrcamento() {
    const linha = document.createElement('div');
    linha.className = 'linha-orc';
    linha.innerHTML = `
        <input type="text" class="orc-desc" placeholder="Peça ou material (ex: Parachoque)" required>
        <input type="number" class="orc-qtd" min="0.01" step="any" value="1" required>
        <input type="text" inputmode="numeric" data-moeda class="orc-valor" placeholder="Valor unit. 0,00" pattern="(?!0,00$).+" title="Informe um valor maior que zero" required>
        <button type="button" class="btn-danger">✕</button>`;
    linha.querySelector('button').addEventListener('click', () => {
        linha.remove();
        atualizarPreviaOrcamento();
    });
    document.querySelector('#itens-orcamento').appendChild(linha);
}

function lerItensOrcamento() {
    return [...document.querySelectorAll('#itens-orcamento .linha-orc')].map(linha => ({
        descricao: linha.querySelector('.orc-desc').value.trim(),
        qtd: parseFloat(linha.querySelector('.orc-qtd').value) || 0,
        valor: lerMoeda(linha.querySelector('.orc-valor').value)
    }));
}

// Total = materiais + acréscimo (%) sobre os materiais + mão de obra (sem acréscimo)
function calcularOrcamento(itens, percentual, maoDeObra) {
    const materiais = itens.reduce((soma, i) => soma + i.qtd * i.valor, 0);
    const acrescimo = materiais * percentual / 100;
    return { materiais, acrescimo, maoDeObra, total: materiais + acrescimo + maoDeObra };
}

function atualizarPreviaOrcamento() {
    const r = calcularOrcamento(
        lerItensOrcamento(),
        parseFloat(document.querySelector('#orc-pct').value) || 0,
        lerMoeda(document.querySelector('#orc-mao').value)
    );
    document.querySelector('#previa-orcamento').innerHTML =
        `Materiais ${formatarMoeda(r.materiais)} + acréscimo ${formatarMoeda(r.acrescimo)} + mão de obra ${formatarMoeda(r.maoDeObra)}
         <br><strong>Total a cobrar: ${formatarMoeda(r.total)}</strong>`;
}

document.querySelector('#btn-add-orc').addEventListener('click', adicionarLinhaOrcamento);
formOrcamento.addEventListener('input', atualizarPreviaOrcamento);

formOrcamento.addEventListener('submit', (e) => {
    e.preventDefault();
    const itens = lerItensOrcamento();
    if (itens.length === 0) {
        alert("Adicione ao menos uma peça ou material.");
        return;
    }
    orcamentos.push({
        id: Date.now(),
        data: dataHoje(),
        cliente: document.querySelector('#orc-cliente').value.trim(),
        contato: document.querySelector('#orc-contato').value.trim(),
        veiculo: document.querySelector('#orc-veiculo').value.trim(),
        itens,
        pct: parseFloat(document.querySelector('#orc-pct').value) || 0,
        maoDeObra: lerMoeda(document.querySelector('#orc-mao').value),
        pagamento: document.querySelector('#orc-pagamento').value,
        sepPct: parseFloat(document.querySelector('#orc-sep-pct').value) || 0,
        sepCaixinha: document.querySelector('#orc-sep-caixinha').value,
        sepNome: document.querySelector('#orc-sep-nome').value,
        status: 'Pendente'
    });
    salvarOrcamentos();
    formOrcamento.reset();
    document.querySelector('#itens-orcamento').innerHTML = '';
    adicionarLinhaOrcamento();
    atualizarPreviaOrcamento();
    atualizarSistema();
});

function deletarOrcamento(id) {
    if (!confirm("Excluir este orçamento? Se ele já foi marcado como recebido, os lançamentos no caixa também saem.")) return;
    orcamentos = orcamentos.filter(o => o.id !== id);
    movimentacoes = movimentacoes.filter(m => m.orcamentoId !== id);
    salvarOrcamentos();
    salvarMovimentacoes();
    atualizarSistema();
}

// O texto para o cliente não mostra o acréscimo nem o valor de cada peça
function copiarOrcamento(id) {
    const o = orcamentos.find(x => x.id === id);
    if (!o) return;
    const r = calcularOrcamento(o.itens, o.pct, o.maoDeObra);
    const texto = `*Orçamento - Chapeação e Pintura*\nCliente: ${o.cliente}\nVeículo: ${o.veiculo}\n\nPeças e materiais:\n` +
        o.itens.map(i => `- ${i.qtd}x ${i.descricao}`).join('\n') +
        `\n\n*Total: ${formatarMoeda(r.total)}*`;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(texto)
            .then(() => alert("Orçamento copiado! Cole no WhatsApp."))
            .catch(() => prompt("Copie o texto do orçamento:", texto));
    } else {
        prompt("Copie o texto do orçamento:", texto);
    }
}

function receberOrcamento(id) {
    const o = orcamentos.find(x => x.id === id);
    if (!o || o.status === 'Recebido') return;
    const r = calcularOrcamento(o.itens, o.pct, o.maoDeObra);
    const base = { perfil: 'Profissional', subperfil: 'Chapeação e Pintura', data: dataHoje(), orcamentoId: id, pagamento: o.pagamento };
    const separado = separarParaCaixinha(r.total, o.sepPct, o.sepCaixinha, o.sepNome);

    movimentacoes.push({ ...base, id: Date.now(), descricao: `Orçamento: ${o.cliente} (${o.veiculo})`, tipo: 'Receita', categoria: 'Serviços', valor: r.total, separado: separado || undefined });
    movimentacoes.push({ ...base, id: Date.now() + 1, descricao: `Materiais: ${o.cliente}`, tipo: 'Despesa', categoria: 'Peças e materiais', valor: r.materiais });
    o.status = 'Recebido';

    salvarOrcamentos();
    salvarMovimentacoes();
    atualizarSistema();
}

function renderizarOrcamentos() {
    const lista = document.querySelector('#lista-orcamentos');
    lista.innerHTML = '';
    if (orcamentos.length === 0) {
        lista.innerHTML = '<p class="vazio">Nenhum orçamento ainda.</p>';
        return;
    }

    orcamentos.forEach(o => {
        const r = calcularOrcamento(o.itens, o.pct, o.maoDeObra);
        const div = document.createElement('div');
        div.className = 'caixinha';
        div.innerHTML = `
            <div class="caixinha-topo"><span>${escaparHTML(o.cliente)}</span><span>${formatarData(o.data)}</span></div>
            <small>${escaparHTML(o.contato)} · ${escaparHTML(o.veiculo)}</small>
            <div class="mini-resumo">
                <div>Materiais<strong>${formatarMoeda(r.materiais)}</strong></div>
                <div>Acréscimo (${o.pct}%)<strong>${formatarMoeda(r.acrescimo)}</strong></div>
                <div>Mão de obra<strong>${formatarMoeda(r.maoDeObra)}</strong></div>
                <div>Total a cobrar<strong class="texto-verde">${formatarMoeda(r.total)}</strong></div>
            </div>
            <small>${o.itens.map(i => `${i.qtd}x ${escaparHTML(i.descricao)} (${formatarMoeda(i.valor)})`).join(' · ')}</small>
            <p><span class="${o.status === 'Recebido' ? 'status-paga' : 'status-pendente'}">${o.status}</span></p>
            <div class="caixinha-acoes">
                <button class="btn-primary btn-pequeno" onclick="copiarOrcamento(${o.id})">Copiar p/ WhatsApp</button>
                ${o.status === 'Recebido' ? '' : `<button class="btn-success" onclick="receberOrcamento(${o.id})">Marcar recebido</button>`}
                <button class="btn-danger" onclick="deletarOrcamento(${o.id})">Excluir</button>
            </div>`;
        lista.appendChild(div);
    });
}

adicionarLinhaOrcamento();
atualizarPreviaOrcamento();

// ==========================================
// 6D. MOTORISTA, COMBUSTÍVEL, CUSTOS POR ITEM, PAGAMENTOS E TEMA
// ==========================================
const FORMAS_PAGAMENTO = ['Pix', 'Dinheiro', 'Cartão de débito', 'Cartão de crédito', 'Outro'];
const opcoesPagamento = FORMAS_PAGAMENTO.map(f => `<option>${f}</option>`).join('');

// Cada módulo tem a mesma estrutura de itens de custo. Para criar um novo (ex: feira), basta incluir aqui.
const MODULOS_CUSTOS = {
    motorista: {
        subperfil: 'Motorista de App',
        titulo: '🧾 Itens de custo do veículo',
        ajuda: 'Adicione o que o carro custa: manutenção, pneus, seguro, financiamento... Cada item mostra o seu custo por km.',
        sugestoes: ['Manutenção', 'Troca de óleo', 'Pneus', 'Seguro', 'Financiamento', 'IPVA / Licenciamento', 'Lavagem'],
        porKm: true
    },
    comercio: {
        subperfil: 'Banquinha / Comercio',
        titulo: '🧾 Custos fixos do negócio',
        ajuda: 'Aluguel, energia, embalagens... Eles entram no resultado do mês.',
        sugestoes: ['Aluguel', 'Energia', 'Água', 'Internet', 'Embalagens'],
        porKm: false
    },
    chapeacao: {
        subperfil: 'Chapeação e Pintura',
        titulo: '🧾 Custos fixos da oficina',
        ajuda: 'Aluguel, energia, tintas... Eles entram no resultado do mês.',
        sugestoes: ['Aluguel', 'Energia', 'Água', 'Tinta e solventes', 'Ferramentas'],
        porKm: false
    }
};

function salvarCustos() {
    localStorage.setItem(`custos_${usuarioLogado}`, JSON.stringify(custos));
}

function salvarAbastecimentos() {
    localStorage.setItem(`abastecimentos_${usuarioLogado}`, JSON.stringify(abastecimentos));
}

function limite30Dias() {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function kmPeriodo(limite) {
    return corridas.filter(c => c.data >= limite).reduce((soma, c) => soma + c.km, 0);
}

// ---------- Itens de custo (genérico, um por módulo) ----------
// Para itens por durabilidade (pneus, óleo), só vale o lançamento mais recente de cada nome
function itensAtivos(modulo) {
    const mapa = {};
    custos.filter(c => c.modulo === modulo).forEach(c => {
        if (c.tipo !== 'durabilidade') {
            mapa[c.id] = c;
            return;
        }
        const chave = 'dur:' + normalizarTexto(c.nome);
        if (!mapa[chave] || c.data > mapa[chave].data) mapa[chave] = c;
    });
    return Object.values(mapa);
}

function custoNoMes(c, limite) {
    if (c.tipo === 'mensal') return c.valor;
    if (c.tipo === 'anual') return c.valor / 12;
    if (c.tipo === 'avulso') return c.data >= limite ? c.valor : 0;
    return 0;
}

function custoPorKmDoItem(c, limite, km30) {
    if (c.tipo === 'durabilidade') return c.durabilidade > 0 ? c.valor / c.durabilidade : 0;
    return km30 > 0 ? custoNoMes(c, limite) / km30 : 0;
}

function montarCustosModulo(modulo) {
    const cfg = MODULOS_CUSTOS[modulo];
    const tipos = [['avulso', 'Gasto avulso (um pagamento)'], ['mensal', 'Fixo mensal'], ['anual', 'Fixo anual']];
    if (cfg.porKm) tipos.unshift(['durabilidade', 'Por durabilidade em km (pneus, óleo...)']);

    document.querySelector(`#custos-${modulo}`).innerHTML = `
        <section class="formulario-secao">
            <h2>${cfg.titulo}</h2>
            <p class="texto-apoio">${cfg.ajuda}</p>
            <form id="form-custo-${modulo}">
                <div class="campo">
                    <label for="custo-nome-${modulo}">Item:</label>
                    <input type="text" id="custo-nome-${modulo}" list="sug-${modulo}" placeholder="Escolha ou escreva" required>
                    <datalist id="sug-${modulo}">${cfg.sugestoes.map(s => `<option value="${s}">`).join('')}</datalist>
                </div>
                <div class="campo">
                    <label for="custo-valor-${modulo}">Valor (R$):</label>
                    <input type="text" inputmode="numeric" data-moeda id="custo-valor-${modulo}" placeholder="0,00" required pattern="(?!0,00$).+" title="Informe um valor maior que zero">
                </div>
                <div class="campo">
                    <label for="custo-tipo-${modulo}">Tipo:</label>
                    <select id="custo-tipo-${modulo}">${tipos.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select>
                </div>
                <div class="campo" id="grupo-dur-${modulo}" style="display: none;">
                    <label for="custo-dur-${modulo}">Dura quantos km?</label>
                    <input type="number" id="custo-dur-${modulo}" min="1" step="any" placeholder="Ex: 40000">
                    <label for="custo-odo-${modulo}">Km do odômetro na troca (opcional):</label>
                    <input type="number" id="custo-odo-${modulo}" min="0" step="any" placeholder="Ex: 85000">
                </div>
                <div class="campo" id="grupo-data-${modulo}">
                    <label for="custo-data-${modulo}">Data:</label>
                    <input type="date" id="custo-data-${modulo}">
                </div>
                <div class="campo">
                    <label for="custo-pag-${modulo}">Forma de pagamento:</label>
                    <select id="custo-pag-${modulo}">${opcoesPagamento}</select>
                </div>
                <button type="submit" class="btn-primary">Adicionar Item</button>
            </form>
            <div class="overflow-tabela">
                <table>
                    <thead><tr><th>Item</th><th>Tipo</th><th>Valor</th><th>${cfg.porKm ? 'Custo/km' : 'No mês'}</th><th>Ações</th></tr></thead>
                    <tbody id="lista-custos-${modulo}"></tbody>
                </table>
            </div>
        </section>`;

    const campo = (nome) => document.querySelector(`#custo-${nome}-${modulo}`);
    const ajustar = () => {
        const tipo = campo('tipo').value;
        const precisaData = tipo === 'avulso' || tipo === 'durabilidade';
        document.querySelector(`#grupo-data-${modulo}`).style.display = precisaData ? '' : 'none';
        campo('data').required = precisaData;
        document.querySelector(`#grupo-dur-${modulo}`).style.display = tipo === 'durabilidade' ? '' : 'none';
        campo('dur').required = tipo === 'durabilidade';
    };
    campo('tipo').addEventListener('change', ajustar);
    ajustar();

    document.querySelector(`#form-custo-${modulo}`).addEventListener('submit', (e) => {
        e.preventDefault();
        const id = Date.now();
        const item = {
            id,
            modulo,
            tipo: campo('tipo').value,
            nome: campo('nome').value.trim(),
            valor: lerMoeda(campo('valor').value),
            data: campo('data').value,
            durabilidade: parseFloat(campo('dur').value) || 0,
            odometro: parseFloat(campo('odo').value) || 0,
            pagamento: campo('pag').value
        };
        custos.push(item);

        // Compra de um pagamento só (avulso ou durabilidade) também sai do caixa
        if (item.tipo === 'avulso' || item.tipo === 'durabilidade') {
            movimentacoes.push({
                id,
                perfil: 'Profissional',
                subperfil: cfg.subperfil,
                data: item.data,
                descricao: `Custo: ${item.nome}`,
                tipo: 'Despesa',
                categoria: item.nome,
                valor: item.valor,
                pagamento: item.pagamento,
                custoId: id
            });
            salvarMovimentacoes();
        }

        salvarCustos();
        e.target.reset();
        ajustar();
        atualizarSistema();
    });
}

function deletarCusto(id) {
    custos = custos.filter(c => c.id !== id);
    movimentacoes = movimentacoes.filter(m => m.custoId !== id);
    salvarCustos();
    salvarMovimentacoes();
    atualizarSistema();
}

function renderizarCustos() {
    const limite = limite30Dias();
    const km30 = kmPeriodo(limite);
    const tipos = { durabilidade: 'Por km de uso', avulso: 'Avulso', mensal: 'Fixo mensal', anual: 'Fixo anual' };

    Object.keys(MODULOS_CUSTOS).forEach(modulo => {
        const cfg = MODULOS_CUSTOS[modulo];
        const ativos = itensAtivos(modulo);
        const corpo = document.querySelector(`#lista-custos-${modulo}`);
        corpo.innerHTML = '';

        custos.filter(c => c.modulo === modulo).forEach(c => {
            const ativo = ativos.includes(c);
            let detalhe = c.data ? formatarData(c.data) : '';
            if (c.tipo === 'durabilidade') {
                const rodado = ativo ? kmPeriodo(c.data) : 0;
                detalhe += ` · dura ${c.durabilidade} km`;
                if (c.odometro) detalhe += ` · trocado aos ${c.odometro} km, próxima aos ${c.odometro + c.durabilidade} km`;
                detalhe += ativo ? ` · faltam ${Math.max(0, c.durabilidade - rodado).toFixed(0)} km` : ' · substituído';
            }
            const ultima = cfg.porKm
                ? `${formatarCustoUnitario(ativo ? custoPorKmDoItem(c, limite, km30) : 0)}/km`
                : formatarMoeda(custoNoMes(c, limite));
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escaparHTML(c.nome)}<br><small>${detalhe}</small></td>
                <td>${tipos[c.tipo]}</td>
                <td>${formatarMoeda(c.valor)}</td>
                <td>${ultima}</td>
                <td><button class="btn-danger" onclick="deletarCusto(${c.id})">Excluir</button></td>`;
            corpo.appendChild(tr);
        });
    });
}

// ---------- Combustível ----------
const formAbastecimento = document.querySelector('#form-abastecimento');

function totalAbastecimentoForm() {
    const litro = lerMoeda(document.querySelector('#ab-litro').value, 3);
    const litros = parseFloat(document.querySelector('#ab-litros').value) || 0;
    return arredondar(litro * litros + lerMoeda(document.querySelector('#ab-aditivo-valor').value));
}

formAbastecimento.addEventListener('input', () => {
    document.querySelector('#ab-total').textContent = `Total do abastecimento: ${formatarMoeda(totalAbastecimentoForm())}`;
});

formAbastecimento.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = Date.now();
    const a = {
        id,
        data: document.querySelector('#ab-data').value,
        valorLitro: lerMoeda(document.querySelector('#ab-litro').value, 3),
        litros: parseFloat(document.querySelector('#ab-litros').value),
        km: parseFloat(document.querySelector('#ab-km').value) || 0,
        aditivoNome: document.querySelector('#ab-aditivo-nome').value.trim(),
        aditivoValor: lerMoeda(document.querySelector('#ab-aditivo-valor').value),
        pagamento: document.querySelector('#ab-pag').value,
        total: totalAbastecimentoForm()
    };
    abastecimentos.push(a);

    movimentacoes.push({
        id,
        perfil: 'Profissional',
        subperfil: 'Motorista de App',
        data: a.data,
        descricao: `Abastecimento (${a.litros} L)${a.aditivoNome ? ' + ' + a.aditivoNome : ''}`,
        tipo: 'Despesa',
        categoria: 'Combustível',
        valor: a.total,
        pagamento: a.pagamento,
        abastecimentoId: id
    });

    salvarAbastecimentos();
    salvarMovimentacoes();
    formAbastecimento.reset();
    document.querySelector('#ab-total').textContent = '';
    atualizarSistema();
});

function deletarAbastecimento(id) {
    abastecimentos = abastecimentos.filter(a => a.id !== id);
    movimentacoes = movimentacoes.filter(m => m.abastecimentoId !== id);
    salvarAbastecimentos();
    salvarMovimentacoes();
    atualizarSistema();
}

// Consumo e custo/km do combustível (aditivo incluído), últimos 30 dias
function estatisticasCombustivel() {
    const lista = abastecimentos.filter(a => a.data >= limite30Dias());
    const km = lista.reduce((soma, a) => soma + a.km, 0);
    const litros = lista.reduce((soma, a) => soma + a.litros, 0);
    const gasto = lista.reduce((soma, a) => soma + a.total, 0);
    return { km, litros, gasto, consumo: km > 0 && litros > 0 ? km / litros : 0, custoKm: km > 0 ? gasto / km : 0 };
}

function renderizarAbastecimentos() {
    const corpo = document.querySelector('#lista-abastecimentos');
    corpo.innerHTML = '';
    [...abastecimentos].sort((a, b) => b.data.localeCompare(a.data)).forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatarData(a.data)}<br><small>${escaparHTML(a.aditivoNome)}${a.aditivoNome ? ' ' + formatarMoeda(a.aditivoValor) : ''}</small></td>
            <td>${a.litros} L × ${formatarCustoUnitario(a.valorLitro)}</td>
            <td>${formatarMoeda(a.total)}<br><small>${a.pagamento || ''}</small></td>
            <td>${a.km ? `${(a.km / a.litros).toFixed(1)} km/L<br><small>${formatarCustoUnitario(a.total / a.km)}/km</small>` : '-'}</td>
            <td><button class="btn-danger" onclick="deletarAbastecimento(${a.id})">Excluir</button></td>`;
        corpo.appendChild(tr);
    });

    const est = estatisticasCombustivel();
    document.querySelector('#resumo-combustivel').innerHTML = est.km > 0
        ? `<div class="mini-resumo">
               <div>Média de consumo<strong>${est.consumo.toFixed(1)} km/L</strong></div>
               <div>Custo/km do combustível<strong>${formatarCustoUnitario(est.custoKm)}</strong></div>
               <div>Gasto (30 dias)<strong>${formatarMoeda(est.gasto)}</strong></div>
           </div>`
        : '<p class="vazio">Informe os km percorridos em cada abastecimento para calcular a média de consumo e o custo/km.</p>';
}

// ---------- Motorista: custo por km, km do dia e resultado ----------
const formCorrida = document.querySelector('#form-corrida');

document.querySelector('#custo-km').addEventListener('change', (e) => {
    custoPorKm = lerMoeda(e.target.value);
    localStorage.setItem(`custo_km_${usuarioLogado}`, custoPorKm);
    atualizarSistema();
});

document.querySelector('#modo-custo').addEventListener('change', (e) => {
    modoCusto = e.target.value;
    localStorage.setItem(`modo_custo_${usuarioLogado}`, modoCusto);
    atualizarSistema();
});

// Custo por km = combustível + cada item de custo (automático), ou o valor fixo informado (manual)
function obterCustoPorKm() {
    if (modoCusto === 'auto') {
        const limite = limite30Dias();
        const km30 = kmPeriodo(limite);
        const partes = [];

        const combustivel = estatisticasCombustivel().custoKm;
        if (combustivel > 0) partes.push({ nome: 'Combustível', valor: combustivel });

        itensAtivos('motorista').forEach(c => {
            const valor = custoPorKmDoItem(c, limite, km30);
            if (valor > 0) partes.push({ nome: c.nome, valor });
        });

        // Despesas soltas do carro lançadas direto no caixa
        const soltas = movimentacoes
            .filter(m => m.tipo === 'Despesa' && m.subperfil === 'Motorista de App' && !m.custoId && !m.abastecimentoId && m.data >= limite)
            .reduce((soma, m) => soma + m.valor, 0);
        if (soltas > 0 && km30 > 0) partes.push({ nome: 'Outras despesas', valor: soltas / km30 });

        const total = partes.reduce((soma, p) => soma + p.valor, 0);
        if (total > 0) return { valor: total, auto: true, partes };
    }
    return { valor: custoPorKm, auto: false, partes: [] };
}

formCorrida.addEventListener('submit', (e) => {
    e.preventDefault();
    corridas.push({
        id: Date.now(),
        data: document.querySelector('#corrida-data').value,
        km: parseFloat(document.querySelector('#corrida-km').value)
    });
    salvarCorridas();
    formCorrida.reset();
    atualizarSistema();
});

function deletarKmDia(data) {
    corridas = corridas.filter(c => c.data !== data);
    salvarCorridas();
    atualizarSistema();
}

// Compara quanto cada km rende com o custo por km
function avaliarGanhoPorKm(ganhoPorKm, custo) {
    if (custo <= 0) {
        return { classe: 'alerta-info', cor: '', texto: '💡 Informe o custo por km (manual) ou lance combustível e itens de custo para ver se está compensando.' };
    }
    if (ganhoPorKm < custo) {
        return { classe: 'alerta-perigo', cor: 'texto-vermelho', texto: '🔴 Rodando no prejuízo: cada km rende menos do que custa.' };
    }
    if (ganhoPorKm < custo * 1.3) {
        return { classe: 'alerta-atencao', cor: 'texto-amarelo', texto: '🟡 Margem apertada: o ganho por km está menos de 30% acima do custo.' };
    }
    return { classe: 'alerta-sucesso', cor: 'texto-verde', texto: '🟢 Rodando bem: o ganho por km cobre o custo com folga.' };
}

// Km total do dia ÷ soma de todas as entradas do dia (todos os aplicativos)
function resumoPorDia() {
    const custo = obterCustoPorKm().valor;
    const dias = {};
    const dia = (data) => (dias[data] = dias[data] || { km: 0, entrou: 0 });

    corridas.forEach(c => { dia(c.data).km += c.km; });
    movimentacoes
        .filter(m => m.tipo === 'Receita' && m.subperfil === 'Motorista de App')
        .forEach(m => { dia(m.data).entrou += m.valor; });

    return Object.entries(dias).map(([data, d]) => {
        const gasto = d.km * custo;
        const liquido = d.entrou - gasto;
        return { data, ...d, gasto, liquido, pct: d.entrou > 0 ? liquido / d.entrou * 100 : 0 };
    }).sort((a, b) => b.data.localeCompare(a.data));
}

function renderizarCorridas() {
    const custo = obterCustoPorKm();
    document.querySelector('#modo-custo').value = modoCusto;
    definirMoeda('#custo-km', custoPorKm);
    document.querySelector('#info-custo').textContent = custo.auto
        ? `📊 Automático: ${custo.partes.map(p => `${p.nome} ${formatarCustoUnitario(p.valor)}`).join(' + ')} = ${formatarCustoUnitario(custo.valor)}/km.`
        : (modoCusto === 'manual'
            ? 'Usando o custo por km fixo que você informou.'
            : 'Ainda não há dados para o cálculo automático: lance o combustível e os itens de custo, ou informe um valor manual.');

    const dias = resumoPorDia();
    const corpo = document.querySelector('#lista-corridas');
    corpo.innerHTML = '';
    dias.forEach(d => {
        const ganhoKm = d.km > 0 ? d.entrou / d.km : 0;
        const cor = d.km > 0 && d.entrou > 0 ? avaliarGanhoPorKm(ganhoKm, custo.valor).cor : '';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatarData(d.data)}</td>
            <td>${d.km || '-'}</td>
            <td>${formatarMoeda(d.entrou)}</td>
            <td>${d.km ? formatarMoeda(d.gasto) : '-'}</td>
            <td class="${d.liquido >= 0 ? 'texto-verde' : 'texto-vermelho'}">${d.km ? formatarMoeda(d.liquido) : '-'}</td>
            <td class="${cor}">${d.km && d.entrou > 0 ? d.pct.toFixed(1) + '%' : '-'}</td>
            <td>${d.km ? `<button class="btn-danger" onclick="deletarKmDia('${d.data}')">Excluir km</button>` : ''}</td>`;
        corpo.appendChild(tr);
    });

    const resumo = document.querySelector('#resumo-corridas');
    const doMes = dias.filter(d => d.data.startsWith(mesAtual()));
    const km = doMes.reduce((soma, d) => soma + d.km, 0);
    const entrou = doMes.reduce((soma, d) => soma + d.entrou, 0);
    if (km === 0 || entrou === 0) {
        resumo.innerHTML = '<p class="vazio">Lance os km do dia aqui e as entradas em "Nova Movimentação" (Profissional → Motorista de App) para ver se está compensando.</p>';
        return;
    }

    const gasto = km * custo.valor;
    const liquido = entrou - gasto;
    const veredito = avaliarGanhoPorKm(entrou / km, custo.valor);
    resumo.innerHTML = `
        <div class="mini-resumo">
            <div>Km no mês<strong>${km.toFixed(1)}</strong></div>
            <div>Entrou (todas as rendas)<strong>${formatarMoeda(entrou)}</strong></div>
            <div>Ganho por km<strong>${formatarMoeda(entrou / km)}</strong></div>
            <div>Gasto (${formatarCustoUnitario(custo.valor)}/km)<strong>${formatarMoeda(gasto)}</strong></div>
            <div>Líquido<strong class="${liquido >= 0 ? 'texto-verde' : 'texto-vermelho'}">${formatarMoeda(liquido)}</strong></div>
            <div>% líquido<strong>${(liquido / entrou * 100).toFixed(1)}%</strong></div>
        </div>
        <div class="mensagem-alerta ${veredito.classe}">${veredito.texto}</div>`;
}

// ---------- Quanto entrou de cada aplicativo (a origem é escolhida ao lançar a entrada) ----------
function renderizarCardsApps() {
    const area = document.querySelector('#cards-apps');
    area.innerHTML = '';
    const grupos = {};
    let total = 0;

    movimentacoes
        .filter(m => m.tipo === 'Receita' && m.subperfil === 'Motorista de App' && m.data.startsWith(mesAtual()))
        .forEach(m => {
            const nome = m.origem || 'Sem origem';
            grupos[nome] = (grupos[nome] || 0) + m.valor;
            total += m.valor;
        });

    const lista = Object.entries(grupos).sort((a, b) => b[1] - a[1]);
    lista.forEach(([nome, valor], i) => {
        const destaque = i === 0 && lista.length > 1;
        const div = document.createElement('div');
        div.className = 'card-app' + (destaque ? ' card-app-top' : '');
        div.innerHTML = `
            <h4>${escaparHTML(nome)}${destaque ? ' ⭐' : ''}</h4>
            <p class="valor-app">${formatarMoeda(valor)}</p>
            <small>${(valor / total * 100).toFixed(0)}% das entradas</small>`;
        area.appendChild(div);
    });

    if (lista.length > 1) {
        const nota = document.createElement('p');
        nota.className = 'texto-apoio nota-apps';
        nota.textContent = `⭐ Quem mais rendeu neste mês: ${lista[0][0]}. O km é um só para o dia todo, então a comparação é pelo total que entrou.`;
        area.appendChild(nota);
    }
}

// ---------- Resultado do mês dos módulos de negócio (mesma ideia para qualquer módulo novo) ----------
function renderizarResultadoModulo(modulo) {
    const sub = MODULOS_CUSTOS[modulo].subperfil;
    const doMes = movimentacoes.filter(m => m.subperfil === sub && m.data.startsWith(mesAtual()));
    const entradas = doMes.filter(m => m.tipo === 'Receita').reduce((soma, m) => soma + m.valor, 0);
    const saidas = doMes.filter(m => m.tipo === 'Despesa').reduce((soma, m) => soma + m.valor, 0);
    const fixos = itensAtivos(modulo)
        .filter(c => c.tipo === 'mensal' || c.tipo === 'anual')
        .reduce((soma, c) => soma + (c.tipo === 'mensal' ? c.valor : c.valor / 12), 0);
    const area = document.querySelector(`#resultado-${modulo}`);

    if (entradas === 0 && saidas === 0 && fixos === 0) {
        area.innerHTML = '<p class="vazio">Lance as entradas e saídas em "Nova Movimentação" escolhendo este segmento.</p>';
        return;
    }

    const liquido = entradas - saidas - fixos;
    const pct = entradas > 0 ? liquido / entradas * 100 : 0;
    let classe = 'alerta-sucesso';
    let texto = '🟢 Resultado positivo com boa folga.';
    if (liquido < 0) {
        classe = 'alerta-perigo';
        texto = '🔴 No mês, os custos estão maiores que as entradas.';
    } else if (pct < 20) {
        classe = 'alerta-atencao';
        texto = '🟡 Sobra pouco: o líquido está abaixo de 20% do que entrou.';
    }

    area.innerHTML = `
        <div class="mini-resumo">
            <div>Entrou<strong>${formatarMoeda(entradas)}</strong></div>
            <div>Saídas lançadas<strong>${formatarMoeda(saidas)}</strong></div>
            <div>Custos fixos<strong>${formatarMoeda(fixos)}</strong></div>
            <div>Líquido real<strong class="${liquido >= 0 ? 'texto-verde' : 'texto-vermelho'}">${formatarMoeda(liquido)}</strong></div>
            <div>% líquido<strong>${entradas > 0 ? pct.toFixed(1) + '%' : '-'}</strong></div>
        </div>
        <div class="mensagem-alerta ${classe}">${texto}</div>`;
}

// ---------- Resumo por forma de pagamento ----------
function renderizarPagamentos() {
    const area = document.querySelector('#resumo-pagamentos');
    area.innerHTML = '';
    const grupos = {};

    movimentacoes.filter(m => m.data.startsWith(mesAtual())).forEach(m => {
        const forma = m.pagamento || 'Não informado';
        grupos[forma] = grupos[forma] || { entrou: 0, saiu: 0 };
        if (m.tipo === 'Receita') grupos[forma].entrou += m.valor;
        else grupos[forma].saiu += m.valor;
    });

    const nomes = Object.keys(grupos);
    if (nomes.length === 0) {
        area.innerHTML = '<p class="vazio">Sem lançamentos neste mês.</p>';
        return;
    }
    nomes.forEach(forma => {
        const div = document.createElement('div');
        div.innerHTML = `${escaparHTML(forma)}
            <strong class="texto-verde">+ ${formatarMoeda(grupos[forma].entrou)}</strong>
            <strong class="texto-vermelho">− ${formatarMoeda(grupos[forma].saiu)}</strong>`;
        area.appendChild(div);
    });
}

// ---------- Tema: automático (segue o sistema), claro ou escuro ----------
const consultaEscuro = window.matchMedia('(prefers-color-scheme: dark)');

function aplicarTema() {
    const escolha = localStorage.getItem('tema') || 'auto';
    const escuro = escolha === 'escuro' || (escolha === 'auto' && consultaEscuro.matches);
    document.documentElement.dataset.tema = escuro ? 'escuro' : 'claro';
    document.querySelector('#seletor-tema').value = escolha;
}

document.querySelector('#seletor-tema').addEventListener('change', (e) => {
    localStorage.setItem('tema', e.target.value);
    aplicarTema();
});
consultaEscuro.addEventListener('change', aplicarTema);
aplicarTema();

Object.keys(MODULOS_CUSTOS).forEach(montarCustosModulo);

// ==========================================
// 7. SALVAR DADOS (separados por usuário) E SESSÃO
// ==========================================
function salvarMovimentacoes() {
    localStorage.setItem(`fluxo_caixa_${usuarioLogado}`, JSON.stringify(movimentacoes));
}

function salvarContas() {
    localStorage.setItem(`contas_pagar_${usuarioLogado}`, JSON.stringify(contas));
}

atualizarGrupoSeparar();

// Mantém o login ao recarregar a página (só enquanto a aba estiver aberta)
const sessaoSalva = sessionStorage.getItem('usuario_logado');
if (sessaoSalva && buscarUsuario(sessaoSalva)) {
    logarNoSistema(sessaoSalva);
}
