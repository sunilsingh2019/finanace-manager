// Utility functions for the finance management system
document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    setupFormHandlers();
});

function initializeCharts() {
    // Placeholder for chart initialization
    console.log('Charts will be initialized here');
}

function setupFormHandlers() {
    const transactionForm = document.getElementById('transaction-form');
    if (transactionForm) {
        transactionForm.addEventListener('submit', handleTransactionSubmit);
    }
}

async function handleTransactionSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    try {
        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(Object.fromEntries(formData)),
        });

        if (response.ok) {
            // Handle successful transaction
            console.log('Transaction added successfully');
        } else {
            // Handle error
            console.error('Failed to add transaction');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Authentication functions
async function login(username, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            window.location.href = '/dashboard';
        } else {
            throw new Error(data.error || 'Login failed');
        }
    } catch (error) {
        showError('loginError', error.message);
    }
}

async function register(username, email, password) {
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        if (response.ok) {
            window.location.href = '/login';
        } else {
            throw new Error(data.error || 'Registration failed');
        }
    } catch (error) {
        showError('registerError', error.message);
    }
}

// Transaction functions
async function addTransaction(transactionData) {
    try {
        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('token')
            },
            body: JSON.stringify(transactionData)
        });
        
        if (response.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('addTransactionModal'));
            modal.hide();
            loadDashboard();
        } else {
            const data = await response.json();
            throw new Error(data.error || 'Failed to add transaction');
        }
    } catch (error) {
        showError('transactionError', error.message);
    }
}

async function loadDashboard() {
    try {
        // Load summary
        const summaryResponse = await fetch('/api/transactions/summary', {
            headers: { 'Authorization': localStorage.getItem('token') }
        });
        const summary = await summaryResponse.json();
        
        updateSummaryCards(summary);
        
        // Load recent transactions
        const transactionsResponse = await fetch('/api/transactions', {
            headers: { 'Authorization': localStorage.getItem('token') }
        });
        const transactions = await transactionsResponse.json();
        
        updateTransactionTable(transactions);
        updateCharts(transactions);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// UI update functions
function updateSummaryCards(summary) {
    document.getElementById('totalBalance').textContent = formatCurrency(summary.balance);
    document.getElementById('totalIncome').textContent = formatCurrency(summary.total_income);
    document.getElementById('totalExpenses').textContent = formatCurrency(summary.total_expense);
}

function updateTransactionTable(transactions) {
    const tbody = document.getElementById('recentTransactions');
    tbody.innerHTML = '';
    
    transactions.slice(0, 10).forEach(tx => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(tx.date).toLocaleDateString()}</td>
            <td>${tx.description}</td>
            <td><span class="badge bg-secondary">${tx.category}</span></td>
            <td><span class="badge bg-${tx.type === 'income' ? 'success' : 'danger'}">${tx.type}</span></td>
            <td class="text-end amount-${tx.type}">${formatCurrency(tx.amount)}</td>
        `;
        tbody.appendChild(row);
    });
}

function updateCharts(transactions) {
    updateMonthlyChart(transactions);
    updateCategoryChart(transactions);
}

function updateMonthlyChart(transactions) {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    const monthlyData = processMonthlyData(transactions);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthlyData.labels,
            datasets: [
                {
                    label: 'Income',
                    data: monthlyData.income,
                    borderColor: '#198754',
                    tension: 0.1
                },
                {
                    label: 'Expenses',
                    data: monthlyData.expenses,
                    borderColor: '#dc3545',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function updateCategoryChart(transactions) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    const categoryData = processCategoryData(transactions);
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categoryData.labels,
            datasets: [{
                data: categoryData.values,
                backgroundColor: [
                    '#0d6efd', '#6610f2', '#6f42c1', '#d63384',
                    '#dc3545', '#fd7e14', '#ffc107', '#198754'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.classList.remove('d-none');
}

function processMonthlyData(transactions) {
    // Process transactions into monthly income and expense data
    // Implementation details...
    return {
        labels: [],
        income: [],
        expenses: []
    };
}

function processCategoryData(transactions) {
    // Process transactions into category totals
    // Implementation details...
    return {
        labels: [],
        values: []
    };
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            login(username, password);
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                showError('registerError', 'Passwords do not match');
                return;
            }
            
            register(username, email, password);
        });
    }

    const saveTransactionBtn = document.getElementById('saveTransaction');
    if (saveTransactionBtn) {
        saveTransactionBtn.addEventListener('click', () => {
            const form = document.getElementById('transactionForm');
            const formData = new FormData(form);
            const transactionData = Object.fromEntries(formData);
            addTransaction(transactionData);
        });
    }

    // Initialize dashboard if on dashboard page
    if (document.getElementById('monthlyChart')) {
        loadDashboard();
    }
});