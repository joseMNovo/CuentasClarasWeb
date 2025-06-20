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

// Calculator functions
function showToast(message) {
    let toast = document.getElementById('toast-message');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-message';
        toast.style.position = 'fixed';
        toast.style.top = '32px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.background = 'rgba(44, 62, 80, 0.95)';
        toast.style.color = '#fff';
        toast.style.padding = '16px 32px';
        toast.style.borderRadius = '32px';
        toast.style.fontSize = '15px';
        toast.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)';
        toast.style.zIndex = '9999';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2200);
}

function calculate() {
    const sueldo1Value = document.getElementById('sueldo1').value;
    const sueldo2Value = document.getElementById('sueldo2').value;
    const totalValue = document.getElementById('total').value;
    if (!sueldo1Value || !sueldo2Value || !totalValue) {
        showToast('Por favor, completa todos los campos, incluyendo el monto.');
        document.getElementById('result1').textContent = '$0,00';
        document.getElementById('result2').textContent = '$0,00';
        return null;
    }
    const sueldo1 = parseNumberInput(sueldo1Value);
    const sueldo2 = parseNumberInput(sueldo2Value);
    const total = parseNumberInput(totalValue);
    if (total > sueldo1 + sueldo2) {
        showToast('El monto no puede ser más alto que los sueldos.');
        document.getElementById('result1').textContent = '$0,00';
        document.getElementById('result2').textContent = '$0,00';
        return null;
    }
    if (total > 0 && (sueldo1 > 0 || sueldo2 > 0)) {
        const sueldoTotal = sueldo1 + sueldo2;
        const porcentaje1 = sueldoTotal > 0 ? (sueldo1 / sueldoTotal) * 100 : 0;
        const porcentaje2 = sueldoTotal > 0 ? (sueldo2 / sueldoTotal) * 100 : 0;
        const pago1 = (sueldo1 / sueldoTotal) * total;
        const pago2 = (sueldo2 / sueldoTotal) * total;

        // Formatear con puntos como separador de miles y coma para decimales
        function formatWithDots(value) {
            // Redondear a 2 decimales
            let parts = value.toFixed(2).split('.');
            let integerPart = parts[0];
            let decimalPart = parts[1];
            // Insertar puntos como separador de miles
            integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            return integerPart + ',' + decimalPart;
        }

        document.getElementById('result1').innerHTML = `${formatWithDots(pago1)} <span style="font-size: 0.75em;"> - (${porcentaje1.toFixed(2)}%)</span>`;
        document.getElementById('result2').innerHTML = `${formatWithDots(pago2)} <span style="font-size: 0.75em;"> - (${porcentaje2.toFixed(2)}%)</span>`;
        return { sueldo1, sueldo2, total, pago1, pago2, porcentaje1, porcentaje2 };
    } else {
        document.getElementById('result1').textContent = '$0,00';
        document.getElementById('result2').textContent = '$0,00';
        return null;
    }
}

function clearCalculator() {
    document.getElementById('sueldo1').value = '';
    document.getElementById('sueldo2').value = '';
    document.getElementById('total').value = '';
    document.getElementById('result1').textContent = '$0,00';
    document.getElementById('result2').textContent = '$0,00';
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
    showRandomCatFact();
}); 