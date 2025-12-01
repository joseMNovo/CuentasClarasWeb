// Utility functions
function formatCurrency(value) {
    return '$' + parseFloat(value).toFixed(2).replace('.', ',');
}

function getCurrentDate() {
    const now = new Date();
    return now.toLocaleDateString('es-ES');
}

function generateId() {
    return Date.now().toString();
}

function parseNumberInput(value) {
    if (typeof value === 'string') {
        // Elimina puntos como separador de miles y reemplaza la coma por punto decimal
        return parseFloat(value.replace(/\./g, '').replace(',', '.'));
    }
    return parseFloat(value) || 0;
}

function validateNumericInput(event) {
    // Permitir teclas de control
    const controlKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'];
    if (controlKeys.includes(event.key)) {
        return true;
    }
    
    // Permitir solo números, punto y coma
    if (!/[0-9.,]/.test(event.key)) {
        event.preventDefault();
        return false;
    }
    
    return true;
}

function setupNumericValidation() {
    // Aplicar validación a todos los campos numéricos
    const numericFields = ['sueldo1', 'sueldo2', 'total', 'item-amount-input'];
    numericFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('keypress', validateNumericInput);
            field.addEventListener('paste', function(e) {
                e.preventDefault();
                const paste = (e.clipboardData || window.clipboardData).getData('text');
                const numericPaste = paste.replace(/[^0-9.,]/g, '');
                this.value = numericPaste;
            });
        }
    });
}

// Modificaciones de sueldos
let modifications = {
    sueldo1: [],
    sueldo2: []
};

let currentModifyingSueldo = null;

// Nombres personalizados de sueldos
let sueldoNames = {
    sueldo1: 'Sueldo 1',
    sueldo2: 'Sueldo 2'
};

let currentRenamingSueldo = null;

// Cargar nombres (siempre por defecto)
function loadSueldoNames() {
    // Siempre reiniciar a los valores por defecto
    sueldoNames = {
        sueldo1: 'Sueldo 1',
        sueldo2: 'Sueldo 2'
    };
    updateAllSueldoNames();
}

// Guardar nombres (solo en memoria, no en localStorage)
function saveSueldoNames() {
    updateAllSueldoNames();
    // Si el modal de modificaciones está abierto, actualizar su título
    if (currentModifyingSueldo) {
        const modalTitle = document.getElementById('modal-title');
        const sueldoKey = `sueldo${currentModifyingSueldo}`;
        if (modalTitle) {
            modalTitle.textContent = `Modificar ${sueldoNames[sueldoKey]}`;
        }
    }
}

// Actualizar todos los lugares donde aparecen los nombres
function updateAllSueldoNames() {
    // Actualizar labels de inputs
    document.getElementById('label-sueldo1').textContent = sueldoNames.sueldo1;
    document.getElementById('label-sueldo2').textContent = sueldoNames.sueldo2;
    
    // Actualizar labels de resultados
    const resultGroups = document.querySelectorAll('.result-group');
    if (resultGroups.length >= 2) {
        const result1Label = resultGroups[0].querySelector('.result-label');
        const result2Label = resultGroups[1].querySelector('.result-label');
        if (result1Label) result1Label.textContent = sueldoNames.sueldo1 + ':';
        if (result2Label) result2Label.textContent = sueldoNames.sueldo2 + ':';
    }
}

// Funciones para renombrar
function openRenamePopup(sueldoNum) {
    currentRenamingSueldo = sueldoNum;
    const popup = document.getElementById('rename-popup');
    const input = document.getElementById('rename-input');
    const sueldoKey = `sueldo${sueldoNum}`;
    input.value = sueldoNames[sueldoKey];
    popup.classList.add('active');
    input.focus();
    input.select();
}

function closeRenamePopup() {
    const popup = document.getElementById('rename-popup');
    popup.classList.remove('active');
    currentRenamingSueldo = null;
}

function saveRename() {
    if (!currentRenamingSueldo) return;
    const input = document.getElementById('rename-input');
    const newName = input.value.trim();
    if (newName) {
        const sueldoKey = `sueldo${currentRenamingSueldo}`;
        sueldoNames[sueldoKey] = newName;
        saveSueldoNames();
    }
    closeRenamePopup();
}

// Calculator functions
function showToast(message) {
    let toast = document.getElementById('toast-message');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-message';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2200);
}

function calculateModificationTotal(sueldoNum) {
    const items = modifications[`sueldo${sueldoNum}`] || [];
    return items.reduce((total, item) => {
        return total + (item.tipo === 'suma' ? item.monto : -item.monto);
    }, 0);
}

function calculate() {
    const sueldo1Value = document.getElementById('sueldo1').value;
    const sueldo2Value = document.getElementById('sueldo2').value;
    const totalValue = document.getElementById('total').value;
    if (!sueldo1Value || !sueldo2Value || !totalValue) {
        showToast('Por favor, completa todos los campos, incluyendo el monto.');
        document.getElementById('result1').innerHTML = '';
        document.getElementById('result2').innerHTML = '';
        return null;
    }
    const sueldo1 = parseNumberInput(sueldo1Value);
    const sueldo2 = parseNumberInput(sueldo2Value);
    const total = parseNumberInput(totalValue);
    if (total > sueldo1 + sueldo2) {
        showToast('El monto no puede ser más alto que los sueldos.');
        document.getElementById('result1').innerHTML = '';
        document.getElementById('result2').innerHTML = '';
        return null;
    }
    if (total > 0 && (sueldo1 > 0 || sueldo2 > 0)) {
        const sueldoTotal = sueldo1 + sueldo2;
        const porcentaje1 = sueldoTotal > 0 ? (sueldo1 / sueldoTotal) * 100 : 0;
        const porcentaje2 = sueldoTotal > 0 ? (sueldo2 / sueldoTotal) * 100 : 0;
        const pago1 = (sueldo1 / sueldoTotal) * total;
        const pago2 = (sueldo2 / sueldoTotal) * total;

        // Calcular modificaciones
        const mod1 = calculateModificationTotal(1);
        const mod2 = calculateModificationTotal(2);
        const pago1Final = pago1 + mod1;
        const pago2Final = pago2 + mod2;

        // Renderizar resultado 1
        const result1El = document.getElementById('result1');
        const modifyBtn1 = document.getElementById('modify-btn-1');
        if (mod1 !== 0) {
            result1El.innerHTML = `
                <span class="original-price strikethrough">${formatWithDots(pago1)} <span style="font-size: 0.75em;"> - (${porcentaje1.toFixed(2)}%)</span></span>
                <span class="modified-price">${formatWithDots(pago1Final)}</span>
            `;
            result1El.classList.add('has-modification');
        } else {
            result1El.innerHTML = `${formatWithDots(pago1)} <span style="font-size: 0.75em;"> - (${porcentaje1.toFixed(2)}%)</span>`;
            result1El.classList.remove('has-modification');
        }
        if (modifyBtn1) modifyBtn1.style.display = 'block';

        // Renderizar resultado 2
        const result2El = document.getElementById('result2');
        const modifyBtn2 = document.getElementById('modify-btn-2');
        if (mod2 !== 0) {
            result2El.innerHTML = `
                <span class="original-price strikethrough">${formatWithDots(pago2)} <span style="font-size: 0.75em;"> - (${porcentaje2.toFixed(2)}%)</span></span>
                <span class="modified-price">${formatWithDots(pago2Final)}</span>
            `;
            result2El.classList.add('has-modification');
        } else {
            result2El.innerHTML = `${formatWithDots(pago2)} <span style="font-size: 0.75em;"> - (${porcentaje2.toFixed(2)}%)</span>`;
            result2El.classList.remove('has-modification');
        }
        if (modifyBtn2) modifyBtn2.style.display = 'block';

        // Mostrar/ocultar icono de modificaciones
        const modificationIcon = document.getElementById('modification-icon');
        if (mod1 !== 0 || mod2 !== 0) {
            if (modificationIcon) modificationIcon.style.display = 'flex';
        } else {
            if (modificationIcon) modificationIcon.style.display = 'none';
        }

        return { sueldo1, sueldo2, total, pago1, pago2, pago1Final, pago2Final, porcentaje1, porcentaje2 };
    } else {
        document.getElementById('result1').innerHTML = '';
        document.getElementById('result2').innerHTML = '';
        document.getElementById('modify-btn-1').style.display = 'none';
        document.getElementById('modify-btn-2').style.display = 'none';
        document.getElementById('modification-icon').style.display = 'none';
        return null;
    }
}

function clearCalculator() {
    document.getElementById('sueldo1').value = '';
    document.getElementById('sueldo2').value = '';
    document.getElementById('total').value = '';
    document.getElementById('result1').innerHTML = '';
    document.getElementById('result2').innerHTML = '';
    document.getElementById('modify-btn-1').style.display = 'none';
    document.getElementById('modify-btn-2').style.display = 'none';
    document.getElementById('modification-icon').style.display = 'none';
    modifications = { sueldo1: [], sueldo2: [] };
}

// Cargar historial desde el backend
let historyData = [];
let filteredData = [];

function loadHistory() {
    fetch('/api/historial')
        .then(response => response.json())
        .then(data => {
            historyData = Array.isArray(data) ? data : [];
            filteredData = [...historyData];
            renderHistory();
        })
        .catch(() => {
            historyData = [];
            filteredData = [];
            renderHistory();
        });
}

// Modificar saveCalculation para guardar en el backend
function saveCalculation() {
    const result = calculate();
    if (result) {
        fetch('/api/agregar_historial', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sueldo1: result.sueldo1,
                sueldo2: result.sueldo2,
                total: result.total
            })
        })
        .then(response => response.json())
        .then(newRecord => {
            if (!newRecord.error) {
                loadHistory();
            } else {
                alert(newRecord.error);
            }
        });
    }
}

// History functions
function renderHistory() {
    const historyContent = document.getElementById('history-content');
    if (filteredData.length === 0) {
        historyContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <div class="empty-state-text">No hay registros</div>
                <div class="empty-state-subtext">Los cálculos aparecerán aquí cuando los realices</div>
            </div>
        `;
        return;
    }
    const tableHTML = `
        <table class="history-table">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Sueldo 1</th>
                    <th>Sueldo 2</th>
                    <th>Total</th>
                    <th>Pago 1</th>
                    <th>Pago 2</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${filteredData.map(record => `
                    <tr>
                        <td>${record.fecha}</td>
                        <td class="currency">${formatCurrency(record.sueldo1)}</td>
                        <td class="currency">${formatCurrency(record.sueldo2)}</td>
                        <td class="currency">${formatCurrency(record.total)}</td>
                        <td class="currency">${formatCurrency(record.pago1)}</td>
                        <td class="currency">${formatCurrency(record.pago2)}</td>
                        <td>
                            <div class="actions">
                                <button class="action-btn delete-btn" onclick="deleteRecord('${record.id}')">🗑️</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    historyContent.innerHTML = tableHTML;
}

function filterHistory(searchTerm) {
    if (!searchTerm) {
        filteredData = [...historyData];
    } else {
        filteredData = historyData.filter(record => 
            record.fecha.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.total.includes(searchTerm) ||
            record.pago1.includes(searchTerm) ||
            record.pago2.includes(searchTerm)
        );
    }
    renderHistory();
}

function editRecord(id) {
    const record = historyData.find(r => r.id === id);
    if (record) {
        // Switch to calculator tab and populate fields
        switchTab('calculator');
        document.getElementById('sueldo1').value = record.sueldo1;
        document.getElementById('sueldo2').value = record.sueldo2;
        document.getElementById('total').value = record.total;
        calculate();
        // Delete the old record
        deleteRecord(id, false);
    }
}

// Modificar deleteRecord para eliminar en el backend
function deleteRecord(id, showConfirm = true) {
    if (showConfirm && !confirm('¿Estás seguro de que quieres eliminar este registro?')) {
        return;
    }
    fetch(`/api/historial/${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadHistory();
            } else {
                alert('No se pudo eliminar el registro.');
            }
        });
}

function addNewRecord() {
    switchTab('calculator');
    clearCalculator();
}

// Tab switching
function switchTab(tabName) {
    // Update tab appearance
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        tab.classList.add('inactive');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.remove('inactive');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    // Show/hide sections
    document.querySelectorAll('.calculator-section, .history-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${tabName}-section`).classList.add('active');
    // Render history when switching to history tab
    if (tabName === 'history') {
        renderHistory();
    }
}

// Modal functions
function openModifyModal(sueldoNum) {
    currentModifyingSueldo = sueldoNum;
    const modal = document.getElementById('modify-modal');
    const modalTitle = document.getElementById('modal-title');
    const sueldoKey = `sueldo${sueldoNum}`;
    modalTitle.textContent = `Modificar ${sueldoNames[sueldoKey]}`;
    // Limpiar inputs
    document.getElementById('item-desc-input').value = '';
    document.getElementById('item-amount-input').value = '';
    renderItemsList();
    modal.classList.add('active');
    // Establecer foco en el campo de monto después de que el modal se muestre
    setTimeout(() => {
        document.getElementById('item-amount-input').focus();
    }, 100);
}

function closeModifyModal() {
    const modal = document.getElementById('modify-modal');
    modal.classList.remove('active');
    currentModifyingSueldo = null;
}

function renderItemsList() {
    if (!currentModifyingSueldo) return;
    const itemsList = document.getElementById('items-list');
    const items = modifications[`sueldo${currentModifyingSueldo}`] || [];
    
    if (items.length === 0) {
        itemsList.innerHTML = '';
        return;
    }
    
    itemsList.innerHTML = items.map((item, index) => `
        <div class="item-row" data-index="${index}">
            <div class="item-description">${item.descripcion}</div>
            <div class="item-type ${item.tipo}">${item.tipo === 'suma' ? '+' : '−'}</div>
            <div class="item-amount ${item.tipo}">${formatWithDots(item.monto)}</div>
            <button class="item-delete" onclick="deleteItem(${index})">🗑️</button>
        </div>
    `).join('');
}

function formatWithDots(value) {
    let parts = parseFloat(value).toFixed(2).split('.');
    let integerPart = parts[0];
    let decimalPart = parts[1];
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return integerPart + ',' + decimalPart;
}

function addItem(tipo) {
    if (!currentModifyingSueldo) return;
    
    const descripcionInput = document.getElementById('item-desc-input');
    const montoInput = document.getElementById('item-amount-input');
    
    const descripcion = descripcionInput.value.trim();
    if (!descripcion) {
        showToast('Por favor, ingresa una descripción');
        return;
    }
    
    const montoStr = montoInput.value.trim();
    if (!montoStr) {
        showToast('Por favor, ingresa un monto');
        return;
    }
    
    const monto = parseNumberInput(montoStr);
    if (isNaN(monto) || monto <= 0) {
        showToast('El monto debe ser un número positivo');
        return;
    }
    
    const sueldoKey = `sueldo${currentModifyingSueldo}`;
    if (!modifications[sueldoKey]) {
        modifications[sueldoKey] = [];
    }
    
    modifications[sueldoKey].push({
        descripcion: descripcion,
        tipo: tipo,
        monto: monto
    });
    
    // Limpiar inputs
    descripcionInput.value = '';
    montoInput.value = '';
    
    renderItemsList();
    calculate();
}

function deleteItem(index) {
    if (!currentModifyingSueldo) return;
    const sueldoKey = `sueldo${currentModifyingSueldo}`;
    if (modifications[sueldoKey] && modifications[sueldoKey][index]) {
        modifications[sueldoKey].splice(index, 1);
        renderItemsList();
        calculate();
    }
}

function showItemsTooltip(event, sueldoNum) {
    const items = modifications[`sueldo${sueldoNum}`] || [];
    if (items.length === 0) return;
    
    const tooltip = document.getElementById('items-tooltip');
    const itemsHtml = items.map(item => `
        <div class="tooltip-item">
            <span class="tooltip-type ${item.tipo}">${item.tipo === 'suma' ? '+' : '-'}</span>
            <span class="tooltip-desc">${item.descripcion}</span>
            <span class="tooltip-amount">${formatWithDots(item.monto)}</span>
        </div>
    `).join('');
    
    tooltip.innerHTML = itemsHtml;
    tooltip.style.display = 'block';
    tooltip.style.left = event.pageX + 10 + 'px';
    tooltip.style.top = event.pageY + 10 + 'px';
}

function hideItemsTooltip() {
    const tooltip = document.getElementById('items-tooltip');
    tooltip.style.display = 'none';
}

function showModificationsPopup(event) {
    const items1 = modifications.sueldo1 || [];
    const items2 = modifications.sueldo2 || [];
    
    if (items1.length === 0 && items2.length === 0) {
        return;
    }
    
    const popup = document.getElementById('modifications-popup');
    let html = '<div class="popup-header">Modificaciones</div>';
    
    if (items1.length > 0) {
        html += `<div class="popup-section"><div class="popup-section-title">${sueldoNames.sueldo1}:</div>`;
        items1.forEach(item => {
            html += `
                <div class="popup-item">
                    <span class="popup-type ${item.tipo}">${item.tipo === 'suma' ? '+' : '−'}</span>
                    <span class="popup-desc">${item.descripcion}</span>
                    <span class="popup-amount ${item.tipo}">${formatWithDots(item.monto)}</span>
                </div>
            `;
        });
        html += '</div>';
    }
    
    if (items2.length > 0) {
        html += `<div class="popup-section"><div class="popup-section-title">${sueldoNames.sueldo2}:</div>`;
        items2.forEach(item => {
            html += `
                <div class="popup-item">
                    <span class="popup-type ${item.tipo}">${item.tipo === 'suma' ? '+' : '−'}</span>
                    <span class="popup-desc">${item.descripcion}</span>
                    <span class="popup-amount ${item.tipo}">${formatWithDots(item.monto)}</span>
                </div>
            `;
        });
        html += '</div>';
    }
    
    popup.innerHTML = html;
    popup.style.display = 'block';
    popup.style.left = event.pageX + 10 + 'px';
    popup.style.top = event.pageY + 10 + 'px';
}

function hideModificationsPopup() {
    const popup = document.getElementById('modifications-popup');
    popup.style.display = 'none';
}

// Cat facts
function showRandomCatFact() {
    fetch('/json/cat_facts.json')
        .then(response => response.json())
        .then(data => {
            const catFacts = data.facts || data;
            const catFooter = document.getElementById('cat-footer');
            if (catFacts && catFacts.length > 0 && catFooter) {
                const randomIndex = Math.floor(Math.random() * catFacts.length);
                catFooter.innerHTML = catFacts[randomIndex];
            }
        })
        .catch(error => {
            console.error('Error fetching cat facts:', error);
        });
}

// Event listeners
window.addEventListener('DOMContentLoaded', function() {
    loadHistory();
    document.getElementById('calculate-btn').addEventListener('click', () => {
        calculate();
        //saveCalculation();
    });
    document.getElementById('clear-btn').addEventListener('click', clearCalculator);
    document.querySelectorAll('.input-field').forEach(input => {
        input.addEventListener('input', () => {
            if (document.getElementById('total').value) {
                calculate();
            }
        });
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    document.getElementById('search-box').addEventListener('input', function() {
        filterHistory(this.value);
    });
    document.getElementById('add-record-btn').addEventListener('click', addNewRecord);
    
    // Modal events
    document.getElementById('modify-btn-1').addEventListener('click', () => openModifyModal(1));
    document.getElementById('modify-btn-2').addEventListener('click', () => openModifyModal(2));
    document.getElementById('modal-close').addEventListener('click', closeModifyModal);
    document.getElementById('add-suma-btn').addEventListener('click', () => addItem('suma'));
    document.getElementById('add-resta-btn').addEventListener('click', () => addItem('resta'));
    document.getElementById('modify-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModifyModal();
        }
    });
    // Permitir agregar item con Enter
    document.getElementById('item-amount-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('item-desc-input').focus();
        }
    });
    document.getElementById('item-desc-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addItem('suma'); // Por defecto suma al presionar Enter
        }
    });
    
    // Configurar validación numérica
    setupNumericValidation();
    
    // Cargar nombres personalizados
    loadSueldoNames();
    
    // Eventos para renombrar sueldos
    document.getElementById('label-sueldo1').addEventListener('click', () => openRenamePopup(1));
    document.getElementById('label-sueldo2').addEventListener('click', () => openRenamePopup(2));
    document.getElementById('rename-save').addEventListener('click', saveRename);
    document.getElementById('rename-cancel').addEventListener('click', closeRenamePopup);
    document.getElementById('rename-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveRename();
        } else if (e.key === 'Escape') {
            closeRenamePopup();
        }
    });
    document.getElementById('rename-popup').addEventListener('click', function(e) {
        if (e.target === this) {
            closeRenamePopup();
        }
    });
    
    // Ocultar botones de modificar inicialmente
    document.getElementById('modify-btn-1').style.display = 'none';
    document.getElementById('modify-btn-2').style.display = 'none';
    document.getElementById('modification-icon').style.display = 'none';
    
    // Eventos para el icono de modificaciones
    document.getElementById('modification-icon').addEventListener('mouseenter', showModificationsPopup);
    document.getElementById('modification-icon').addEventListener('mouseleave', hideModificationsPopup);
    
    // Tooltip events
    document.getElementById('result1').addEventListener('mouseenter', function(e) {
        if (modifications.sueldo1 && modifications.sueldo1.length > 0) {
            showItemsTooltip(e, 1);
        }
    });
    document.getElementById('result1').addEventListener('mouseleave', hideItemsTooltip);
    document.getElementById('result2').addEventListener('mouseenter', function(e) {
        if (modifications.sueldo2 && modifications.sueldo2.length > 0) {
            showItemsTooltip(e, 2);
        }
    });
    document.getElementById('result2').addEventListener('mouseleave', hideItemsTooltip);
    
    showRandomCatFact();
    
    // Configurar modal de novedades
    const newsModal = document.getElementById('news-modal');
    const newsModalClose = document.getElementById('news-modal-close');
    const newsModalBtn = document.getElementById('news-modal-btn');
    
    if (newsModalClose) {
        newsModalClose.addEventListener('click', closeNewsModal);
    }
    
    if (newsModalBtn) {
        newsModalBtn.addEventListener('click', closeNewsModal);
    }
    
    if (newsModal) {
        newsModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeNewsModal();
            }
        });
        
        // Mostrar modal de novedades al cargar
        showNewsModal();
    }
});

// Modal de novedades
function showNewsModal() {
    const modal = document.getElementById('news-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeNewsModal() {
    const modal = document.getElementById('news-modal');
    if (modal) {
        modal.classList.remove('active');
    }
} 