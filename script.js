const form = document.getElementById("transaction-form");
const description = document.getElementById("description");
const amount = document.getElementById("amount");
const type = document.getElementById("type");
const category = document.getElementById("category");
const formError = document.getElementById("form-error");

// Category only makes sense for expenses, so hide it for income
function toggleCategoryField() {
    category.style.display = type.value === "expense" ? "block" : "none";
}
type.addEventListener("change", toggleCategoryField);
toggleCategoryField();

const balance = document.getElementById("balance");
const income = document.getElementById("income");
const expense = document.getElementById("expense");

const transactionList = document.getElementById("transaction-list");
const chartCanvas = document.getElementById("expense-chart");
const noExpensesMsg = document.getElementById("no-expenses-msg");

let expenseChart = null;

// Build/refresh the pie chart from current expense transactions
function updateChart() {
    const categoryTotals = {};

    transactions
        .filter(t => t.type === "expense")
        .forEach(t => {
            const cat = t.category || "Other";
            categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
        });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    if (labels.length === 0) {
        chartCanvas.style.display = "none";
        noExpensesMsg.style.display = "block";
        if (expenseChart) {
            expenseChart.destroy();
            expenseChart = null;
        }
        return;
    }

    chartCanvas.style.display = "block";
    noExpensesMsg.style.display = "none";

    const colors = ["#60a5fa", "#f87171", "#34d399", "#fbbf24", "#a78bfa", "#f472b6"];

    if (expenseChart) {
        expenseChart.data.labels = labels;
        expenseChart.data.datasets[0].data = data;
        expenseChart.update();
    } else {
        expenseChart = new Chart(chartCanvas, {
            type: "pie",
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: "bottom" }
                }
            }
        });
    }
}

// Load saved transactions or start with an empty array
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

// Format a number as FCFA with thousand separators
function formatCurrency(value) {
    return `FCFA ${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// Save transactions to Local Storage
function saveTransactions() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

// Update balance and totals
function updateSummary() {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(transaction => {
        if (transaction.type === "income") {
            totalIncome += transaction.amount;
        } else {
            totalExpense += transaction.amount;
        }
    });

    const currentBalance = totalIncome - totalExpense;

    income.textContent = formatCurrency(totalIncome);
    expense.textContent = formatCurrency(totalExpense);
    balance.textContent = formatCurrency(currentBalance);
}

// Display transactions
function displayTransactions() {
    transactionList.innerHTML = "";

    transactions.forEach((transaction) => {

        const li = document.createElement("li");
        li.classList.add("transaction", transaction.type);

        const categoryTag = transaction.type === "expense" && transaction.category
            ? ` <span class="category-tag">${transaction.category}</span>`
            : "";

        li.innerHTML = `
            <div>
                <strong>${transaction.description}</strong>${categoryTag}<br>
                ${formatCurrency(transaction.amount)}
            </div>

            <button class="delete-btn" data-id="${transaction.id}">
                Delete
            </button>
        `;

        transactionList.appendChild(li);
    });

    updateSummary();
    updateChart();
}

// Delete transaction by its unique id (not array index, so it stays correct
// even if the list is ever sorted or filtered)
function deleteTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    saveTransactions();
    displayTransactions();
}

// Handle delete button clicks (event delegation instead of inline onclick)
transactionList.addEventListener("click", function (e) {
    if (e.target.classList.contains("delete-btn")) {
        const id = Number(e.target.dataset.id);
        deleteTransaction(id);
    }
});

// Add transaction
form.addEventListener("submit", function (e) {

    e.preventDefault();

    const amountValue = Number(amount.value);

    // Validate: must be a real, positive number
    if (!amountValue || amountValue <= 0) {
        formError.textContent = "Please enter an amount greater than 0.";
        return;
    }

    if (description.value.trim() === "") {
        formError.textContent = "Please enter a description.";
        return;
    }

    formError.textContent = "";

    const newTransaction = {
        id: Date.now(),
        description: description.value.trim(),
        amount: amountValue,
        type: type.value,
        category: type.value === "expense" ? category.value : null
    };

    transactions.push(newTransaction);

    saveTransactions();
    displayTransactions();

    form.reset();
    toggleCategoryField();
});

// Load existing data when page opens
displayTransactions();
