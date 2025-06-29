document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS DO DOM ---
    const pages = document.querySelectorAll('.page');
    const navButtons = document.querySelectorAll('.nav-button');
    const addItemForm = document.getElementById('add-item-form');
    const allItemsList = document.getElementById('all-items-list');
    const clearAllDataBtn = document.getElementById('clear-all-data');

    // Inputs do formulário de adição
    const inputMercado = document.getElementById('input_mercado');
    const inputProduto = document.getElementById('input_produto');
    const inputMarca = document.getElementById('input_marca');
    const inputPreco = document.getElementById('input_preco');
    const inputMes = document.getElementById('input_mes');
    const inputAno = document.getElementById('input_ano');
    const inputQuantidade = document.getElementById('input_quantidade'); // *** NOVO ***
    const runningTotalDisplay = document.getElementById('running-total-display'); // *** NOVO ***

    // Elementos de Configuração
    const selects = {
        mercadoA: document.getElementById('select-mercado-a'),
        mesA: document.getElementById('select-mes-a'),
        anoA: document.getElementById('select-ano-a'),
        mercadoB: document.getElementById('select-mercado-b'),
        mesB: document.getElementById('select-mes-b'),
        anoB: document.getElementById('select-ano-b'),
    };

    // Elementos da tela de comparação
    const displayA = document.getElementById('mercado-a-display').querySelector('h2');
    const displayB = document.getElementById('mercado-b-display').querySelector('h2');
    const totalADisplay = document.getElementById('total-a');
    const totalBDisplay = document.getElementById('total-b');
    const compareListA = document.getElementById('compare-list-a');
    const compareListB = document.getElementById('compare-list-b');
    const comparisonResult = document.getElementById('comparison-result');

    // --- ESTADO DA APLICAÇÃO ---
    let state = {
        items: [],
        comparisonA: { mercado: null, mes: null, ano: null },
        comparisonB: { mercado: null, mes: null, ano: null },
    };

    // --- FUNÇÕES DE DADOS (LOCALSTORAGE) ---
    const saveData = () => {
        localStorage.setItem('mercadoComparadorState', JSON.stringify(state));
    };

    const loadData = () => {
        const data = localStorage.getItem('mercadoComparadorState');
        if (data) {
            const loadedState = JSON.parse(data);
            state.items = loadedState.items || [];
             // *** MODIFICADO ***: Garante que itens antigos tenham quantidade 1
            state.items.forEach(item => {
                if (item.quantity === undefined) {
                    item.quantity = 1;
                }
            });
            state.comparisonA = loadedState.comparisonA || { mercado: null, mes: null, ano: null };
            state.comparisonB = loadedState.comparisonB || { mercado: null, mes: null, ano: null };
        }
    };

    // --- FUNÇÕES DE RENDERIZAÇÃO ---

    const showPage = (pageId) => {
        pages.forEach(page => page.classList.add('hide'));
        document.getElementById(pageId).classList.remove('hide');
        navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === pageId);
        });
        if (pageId === 'itens') {
            updateRunningTotal(); // Atualiza o total ao entrar na página de itens
        }
    };
    
    // *** NOVO ***: Função para calcular e exibir o total da compra atual
    const updateRunningTotal = () => {
        const currentMercado = inputMercado.value.trim();
        const currentMes = parseInt(inputMes.value);
        const currentAno = parseInt(inputAno.value);

        if (!currentMercado || !currentMes || !currentAno) {
            runningTotalDisplay.textContent = 'Preencha Mercado, Mês e Ano';
            return;
        }

        const total = state.items
            .filter(item => 
                item.mercado === currentMercado && 
                item.mes === currentMes && 
                item.ano === currentAno
            )
            .reduce((sum, item) => sum + (item.preco * item.quantity), 0);
        
        runningTotalDisplay.textContent = `Total desta compra: R$ ${total.toFixed(2)}`;
    };

    // *** MODIFICADO ***: Atualizada para mostrar a quantidade e o total do item
    const renderAllItemsList = () => {
        allItemsList.innerHTML = '';
        if (state.items.length === 0) {
            allItemsList.innerHTML = '<p>Nenhum item cadastrado ainda.</p>';
            return;
        }
        [...state.items].reverse().forEach((item, index) => {
            const originalIndex = state.items.length - 1 - index;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item-display';
            const mesFormatado = String(item.mes).padStart(2, '0');
            const totalItem = (item.preco * item.quantity).toFixed(2);
            itemDiv.innerHTML = `
                <div class="info">
                    <div class="produto">${item.produto} <small>(${item.marca || 'S/ Marca'})</small></div>
                    <div class="item-details">
                        <strong>${item.mercado} (${mesFormatado}/${item.ano}):</strong> 
                        ${item.quantity} x R$ ${item.preco.toFixed(2)} = <strong>R$ ${totalItem}</strong>
                    </div>
                </div>
                <button class="excluir" data-index="${originalIndex}">Excluir</button>
            `;
            allItemsList.appendChild(itemDiv);
        });
    };

    const renderSettings = () => {
        const unique = {
            mercados: [...new Set(state.items.map(i => i.mercado))],
            meses: [...new Set(state.items.map(i => i.mes))].sort((a,b) => a-b),
            anos: [...new Set(state.items.map(i => i.ano))].sort((a,b) => a-b),
        };

        const populateSelect = (select, options, placeholder, selectedValue) => {
            select.innerHTML = `<option value="">${placeholder}</option>`;
            options.forEach(opt => {
                select.innerHTML += `<option value="${opt}" ${opt == selectedValue ? 'selected' : ''}>${opt}</option>`;
            });
             select.value = selectedValue || "";
        };

        populateSelect(selects.mercadoA, unique.mercados, 'Mercado A...', state.comparisonA.mercado);
        populateSelect(selects.mesA, unique.meses, 'Mês A...', state.comparisonA.mes);
        populateSelect(selects.anoA, unique.anos, 'Ano A...', state.comparisonA.ano);
        populateSelect(selects.mercadoB, unique.mercados, 'Mercado B...', state.comparisonB.mercado);
        populateSelect(selects.mesB, unique.meses, 'Mês B...', state.comparisonB.mes);
        populateSelect(selects.anoB, unique.anos, 'Ano B...', state.comparisonB.ano);
    };

    // *** MODIFICADO ***: Atualizada para calcular o total com base na quantidade
    const renderComparison = () => {
        compareListA.innerHTML = '';
        compareListB.innerHTML = '';
        let totalA = 0, totalB = 0;

        const formatDisplay = (comp) => comp.mercado ? `${comp.mercado} (${String(comp.mes).padStart(2, '0')}/${comp.ano})` : `Selecione Dados`;
        displayA.textContent = formatDisplay(state.comparisonA);
        displayB.textContent = formatDisplay(state.comparisonB);

        const isComparisonReady = (comp) => comp.mercado && comp.mes && comp.ano;
        if (!isComparisonReady(state.comparisonA) || !isComparisonReady(state.comparisonB)) {
            comparisonResult.textContent = 'Complete a seleção na aba de Configurações para comparar.';
            totalADisplay.textContent = 'R$ 0,00';
            totalBDisplay.textContent = 'R$ 0,00';
            return;
        }

        const uniqueProducts = [...new Map(state.items.map(item => [`${item.produto.toLowerCase()}|${(item.marca || '').toLowerCase()}`, item])).values()];
        
        uniqueProducts.forEach(p => {
            const itemKey = `${p.produto.toLowerCase()}|${(p.marca || '').toLowerCase()}`;
            
            const findItem = (comp) => state.items.find(i => 
                i.mercado === comp.mercado && i.mes == comp.mes && i.ano == comp.ano && 
                `${i.produto.toLowerCase()}|${(i.marca || '').toLowerCase()}` === itemKey
            );

            const itemA = findItem(state.comparisonA);
            const itemB = findItem(state.comparisonB);

            if (!itemA && !itemB) return;

            let priceClassA = '', priceClassB = '';
            if (itemA && itemB) {
                if (itemA.preco < itemB.preco) { priceClassA = 'cheaper'; priceClassB = 'more-expensive'; }
                else if (itemB.preco < itemA.preco) { priceClassB = 'cheaper'; priceClassA = 'more-expensive'; }
                else { priceClassA = 'equal'; priceClassB = 'equal'; }
            } else if (itemA) { priceClassA = 'cheaper'; }
            else if (itemB) { priceClassB = 'cheaper'; }

            if(itemA) {
                totalA += itemA.preco * itemA.quantity; // <-- cálculo com quantidade
                compareListA.innerHTML += createItemCard(itemA, priceClassA);
            } else {
                compareListA.innerHTML += createNotFoundCard(p);
            }

            if(itemB) {
                totalB += itemB.preco * itemB.quantity; // <-- cálculo com quantidade
                compareListB.innerHTML += createItemCard(itemB, priceClassB);
            } else {
                 compareListB.innerHTML += createNotFoundCard(p);
            }
        });

        totalADisplay.textContent = `R$ ${totalA.toFixed(2)}`;
        totalBDisplay.textContent = `R$ ${totalB.toFixed(2)}`;
        
        const diff = Math.abs(totalA - totalB);
        if (totalA > 0 || totalB > 0) {
            if (totalA < totalB) { comparisonResult.textContent = `A seleção A é R$ ${diff.toFixed(2)} mais barata!`; }
            else if (totalB < totalA) { comparisonResult.textContent = `A seleção B é R$ ${diff.toFixed(2)} mais barata!`; }
            else { comparisonResult.textContent = 'O valor total é o mesmo nas duas seleções.'; }
        } else {
            comparisonResult.textContent = 'Nenhum item em comum encontrado para esta seleção.';
        }
    };
    
    const createItemCard = (item, priceClass) => `
        <div class="compare-item-card"><div class="produto"><span class="item-nome">${item.quantity}x ${item.produto}</span><span class="item-marca">${item.marca || 'S/ Marca'}</span></div><div class="preco ${priceClass}">R$ ${item.preco.toFixed(2)}</div></div>`;
    const createNotFoundCard = (product) => `
         <div class="compare-item-card not-found"><span>${product.produto} (${product.marca || 'S/ Marca'})</span></div>`;

    const renderApp = () => {
        renderAllItemsList();
        renderSettings();
        renderComparison();
        updateRunningTotal(); // Garante que o total seja exibido ao renderizar
    };
    
    // *** MODIFICADO ***: Reseta a quantidade para 1
    const resetItemForm = () => {
        inputProduto.value = '';
        inputMarca.value = '';
        inputPreco.value = '';
        inputQuantidade.value = '1'; // <-- Reseta a quantidade
        
        const currentDate = new Date();
        inputMes.value = currentDate.getMonth() + 1;
        inputAno.value = currentDate.getFullYear();
        
        inputProduto.focus();
    };
    
    const setInitialDate = () => {
        const currentDate = new Date();
        inputMes.value = currentDate.getMonth() + 1;
        inputAno.value = currentDate.getFullYear();
    }

    // --- EVENT LISTENERS ---

    navButtons.forEach(button => button.addEventListener('click', () => showPage(button.dataset.page)));

    // *** MODIFICADO ***: Adiciona a quantidade ao novo item
    addItemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newItem = {
            mercado: inputMercado.value.trim(),
            produto: inputProduto.value.trim(),
            marca: inputMarca.value.trim(),
            mes: parseInt(inputMes.value),
            ano: parseInt(inputAno.value),
            preco: parseFloat(inputPreco.value),
            quantity: parseInt(inputQuantidade.value) || 1, // <-- Adiciona a quantidade
        };
        state.items.push(newItem);
        saveData();
        renderApp();
        resetItemForm(); 
    });

    allItemsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('excluir')) {
            state.items.splice(e.target.dataset.index, 1);
            saveData();
            renderApp();
        }
    });

    clearAllDataBtn.addEventListener('click', () => {
        if (confirm('Tem certeza? TODOS os itens e configurações serão apagados.')) {
            state.items = [];
            state.comparisonA = { mercado: null, mes: null, ano: null };
            state.comparisonB = { mercado: null, mes: null, ano: null };
            saveData();
            renderApp();
        }
    });
    
    Object.keys(selects).forEach(key => {
        selects[key].addEventListener('change', (e) => {
            const side = key.endsWith('A') ? 'comparisonA' : 'comparisonB';
            const prop = key.includes('mercado') ? 'mercado' : (key.includes('mes') ? 'mes' : 'ano');
            state[side][prop] = e.target.value || null;
            saveData();
            renderComparison();
        });
    });

    // *** NOVO ***: Event listeners para atualizar o total da compra ao mudar mercado/data
    [inputMercado, inputMes, inputAno].forEach(input => {
        input.addEventListener('change', updateRunningTotal);
        input.addEventListener('keyup', updateRunningTotal); // Para o campo de texto
    });


    // --- INICIALIZAÇÃO ---
    const init = () => {
        loadData();
        renderApp();
        showPage('comparador');
        setInitialDate(); 
        updateRunningTotal();
    };

    init();
});