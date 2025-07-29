/* FinPilot JavaScript - Expanded for maximum functionality */
document.addEventListener('DOMContentLoaded', () => {
  // Data storage with local storage persistence
  let categories = JSON.parse(localStorage.getItem('finPilotCategories')) || [];
  let recurringExpenses = JSON.parse(localStorage.getItem('finPilotRecurringExpenses')) || [];
  let savingsGoals = JSON.parse(localStorage.getItem('finPilotSavingsGoals')) || [];
  let debts = JSON.parse(localStorage.getItem('finPilotDebts')) || [];
  let investments = JSON.parse(localStorage.getItem('finPilotInvestments')) || [];
  let assets = JSON.parse(localStorage.getItem('finPilotAssets')) || [];
  let liabilities = JSON.parse(localStorage.getItem('finPilotLiabilities')) || [];
  let retirementPlans = JSON.parse(localStorage.getItem('finPilotRetirementPlans')) || [];
  let emergencyFund = JSON.parse(localStorage.getItem('finPilotEmergencyFund')) || { target: 0, current: 0 };
  let currencyRates = { USD: 1, EUR: 0.92, GBP: 0.78, JPY: 145.32 }; // Mock rates

  // DOM elements
  const budgetForm = document.getElementById('budgetForm');
  const categoriesContainer = document.getElementById('categoriesContainer');
  const totalIncomeInput = document.getElementById('totalIncome');
  const totalExpensesSpan = document.getElementById('totalExpenses');
  const balanceSpan = document.getElementById('balance');
  const addCategoryBtn = document.getElementById('addCategoryBtn');
  const recurringExpensesContainer = document.getElementById('recurringExpensesContainer');
  const interestForm = document.getElementById('interestForm');
  const interestResult = document.getElementById('interestResult');
  const budgetChartCanvas = document.getElementById('budgetChart');
  const interestChartCanvas = document.getElementById('interestChart');
  const exportPDFBtn = document.getElementById('exportPDF');
  const exportTextBtn = document.getElementById('exportText');
  const savingsGoalForm = document.getElementById('savingsGoalForm');
  const savingsGoalTable = document.getElementById('savingsGoalList');
  const debtForm = document.getElementById('debtForm');
  const debtTable = document.getElementById('debtList');
  const taxForm = document.getElementById('taxForm');
  const taxResult = document.getElementById('taxResult');
  const currencyConverterForm = document.getElementById('currencyConverterForm');
  const converterResult = document.getElementById('converterResult');
  const investmentForm = document.getElementById('investmentForm');
  const investmentTable = document.getElementById('investmentList');
  const netWorthForm = document.getElementById('netWorthForm');
  const netWorthResult = document.getElementById('netWorthResult');
  const retirementForm = document.getElementById('retirementForm');
  const retirementTable = document.getElementById('retirementList');
  const emergencyFundForm = document.getElementById('emergencyFundForm');
  const emergencyFundProgress = document.getElementById('emergencyFundProgress');
  const feedbackForm = document.getElementById('feedbackForm');
  const darkModeToggle = document.getElementById('darkModeToggle');

  // Chart.js instances
  let budgetChart, interestChart, savingsChart, debtChart, netWorthChart;

  // Dark mode toggle
  darkModeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark', darkModeToggle.checked);
    localStorage.setItem('finPilotDarkMode', darkModeToggle.checked);
  });
  if (localStorage.getItem('finPilotDarkMode') === 'true') {
    darkModeToggle.checked = true;
    document.body.classList.add('dark');
  }

  // Utility functions
  function parseFixed(value) {
    return parseFloat(value) || 0;
  }

  function validateInput(value, type, min = 0) {
    if (type === 'number' && (isNaN(value) || value < min)) {
      return false;
    }
    if (type === 'text' && !value.trim()) {
      return false;
    }
    return true;
  }

  function showError(input, message) {
    const existingError = input.parentElement.querySelector('.error');
    if (existingError) existingError.remove();
    const error = document.createElement('small');
    error.className = 'error';
    error.style.color = '#e74c3c';
    error.textContent = message;
    input.parentElement.appendChild(error);
    input.setAttribute('aria-invalid', 'true');
    setTimeout(() => error.remove(), 3000);
  }

  function clearErrors(container) {
    container.querySelectorAll('.error').forEach(error => error.remove());
    container.querySelectorAll('[aria-invalid="true"]').forEach(input => input.removeAttribute('aria-invalid'));
  }

  function animateElement(element, action = 'add') {
    element.style.transition = 'opacity 0.3s, transform 0.3s';
    element.style.opacity = action === 'add' ? '0' : '1';
    element.style.transform = action === 'add' ? 'translateY(10px)' : 'translateY(0)';
    setTimeout(() => {
      element.style.opacity = action === 'add' ? '1' : '0';
      element.style.transform = action === 'add' ? 'translateY(0)' : 'translateY(10px)';
      if (action === 'remove') setTimeout(() => element.remove(), 300);
    }, 10);
  }

  // Budget Planner
  const categoryPresets = [
    { name: 'Groceries', amount: 0 },
    { name: 'Rent/Mortgage', amount: 0 },
    { name: 'Utilities', amount: 0 },
    { name: 'Transportation', amount: 0 },
    { name: 'Entertainment', amount: 0 }
  ];

  function initializeCategories() {
    if (categories.length === 0) {
      categories = [...categoryPresets];
      localStorage.setItem('finPilotCategories', JSON.stringify(categories));
    }
    categories.forEach((cat, index) => addCategoryDOM(cat, index));
    updateBudget();
  }

  function addCategoryDOM(category, index) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'form-group';
    categoryDiv.innerHTML = `
      <label for="categoryName-${index}">Category Name</label>
      <input type="text" id="categoryName-${index}" value="${category.name}" placeholder="e.g., Groceries" aria-describedby="categoryNameHelp-${index}">
      <small id="categoryNameHelp-${index}" class="helper-text">Enter category name</small>
      <label for="categoryAmount-${index}">Amount</label>
      <input type="number" id="categoryAmount-${index}" min="0" step="0.01" value="${category.amount.toFixed(2)}" placeholder="0.00" aria-describedby="categoryAmountHelp-${index}">
      <small id="categoryAmountHelp-${index}" class="helper-text">Enter category amount</small>
      <button type="button" class="btn btn-secondary" aria-label="Remove category">Remove</button>
    `;
    categoriesContainer.appendChild(categoryDiv);
    animateElement(categoryDiv);
  }

  function addCategory() {
    const index = categories.length;
    categories.push({ name: '', amount: 0 });
    localStorage.setItem('finPilotCategories', JSON.stringify(categories));
    addCategoryDOM({ name: '', amount: 0 }, index);
    updateBudget();
  }

  function removeCategory(button) {
    const index = Array.from(categoriesContainer.children).indexOf(button.parentElement);
    animateElement(button.parentElement, 'remove');
    categories.splice(index, 1);
    localStorage.setItem('finPilotCategories', JSON.stringify(categories));
    updateBudget();
  }

  function updateBudget() {
    const totalIncome = parseFixed(totalIncomeInput.value);
    if (!validateInput(totalIncome, 'number')) {
      showError(totalIncomeInput, 'Please enter a valid income amount');
      return;
    }
    const totalExpenses = categories.reduce((sum, cat) => sum + parseFixed(cat.amount), 0) +
      recurringExpenses.reduce((sum, exp) => sum + parseFixed(exp.amount), 0);
    const balance = totalIncome - totalExpenses;
    totalExpensesSpan.textContent = totalExpenses.toFixed(2);
    balanceSpan.textContent = balance.toFixed(2);
    balanceSpan.setAttribute('aria-live', 'polite');
    updateBudgetChart();
  }

  // Recurring Expenses
  function addRecurringExpense() {
    const index = recurringExpenses.length;
    recurringExpenses.push({ name: '', amount: 0, frequency: 'monthly', nextDue: '' });
    localStorage.setItem('finPilotRecurringExpenses', JSON.stringify(recurringExpenses));
    const expenseDiv = document.createElement('div');
    expenseDiv.className = 'form-group';
    expenseDiv.innerHTML = `
      <label for="recurringName-${index}">Expense Name</label>
      <input type="text" id="recurringName-${index}" placeholder="e.g., Netflix" aria-describedby="recurringNameHelp-${index}">
      <small id="recurringNameHelp-${index}" class="helper-text">Enter expense name</small>
      <label for="recurringAmount-${index}">Amount</label>
      <input type="number" id="recurringAmount-${index}" min="0" step="0.01" placeholder="0.00" aria-describedby="recurringAmountHelp-${index}">
      <small id="recurringAmountHelp-${index}" class="helper-text">Enter expense amount</small>
      <label for="recurringFrequency-${index}">Frequency</label>
      <select id="recurringFrequency-${index}" aria-label="Select expense frequency">
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      </select>
      <label for="recurringDueDate-${index}">Next Due Date</label>
      <input type="date" id="recurringDueDate-${index}" aria-describedby="recurringDueDateHelp-${index}">
      <small id="recurringDueDateHelp-${index}" class="helper-text">Select next due date</small>
      <button type="button" class="btn btn-secondary" aria-label="Remove recurring expense">Remove</button>
    `;
    recurringExpensesContainer.appendChild(expenseDiv);
    animateElement(expenseDiv);
    updateBudget();
  }

  function removeRecurringExpense(button) {
    const index = Array.from(recurringExpensesContainer.children).indexOf(button.parentElement);
    animateElement(button.parentElement, 'remove');
    recurringExpenses.splice(index, 1);
    localStorage.setItem('finPilotRecurringExpenses', JSON.stringify(recurringExpenses));
    updateBudget();
  }

  // Interest Calculator with monthly contributions
  interestForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors(interestForm);
    const principal = parseFixed(document.getElementById('principal').value);
    const rate = parseFixed(document.getElementById('rate').value) / 100;
    const time = parseFixed(document.getElementById('time').value);
    const compoundFreq = parseInt(document.getElementById('compoundFreq').value);
    const interestType = document.getElementById('interestType').value;
    const currency = document.getElementById('currencySelectInterest').value;
    const monthlyContribution = parseFixed(document.getElementById('monthlyContribution')?.value || 0);

    if (!validateInput(principal, 'number') || !validateInput(rate, 'number') || !validateInput(time, 'number')) {
      showError(document.getElementById('principal'), 'Please enter valid values');
      return;
    }

    let result;
    if (interestType === 'simple') {
      result = principal * (1 + rate * time) + monthlyContribution * 12 * time;
    } else {
      result = principal * Math.pow(1 + rate / compoundFreq, compoundFreq * time);
      if (monthlyContribution > 0) {
        for (let i = 1; i <= time * compoundFreq; i++) {
          result += monthlyContribution * Math.pow(1 + rate / compoundFreq, i);
        }
      }
    }
    interestResult.textContent = `Total Amount: ${currency} ${result.toFixed(2)} (Interest: ${currency} ${(result - principal).toFixed(2)})`;
    interestResult.setAttribute('aria-live', 'polite');
    updateInterestChart(principal, rate, time, compoundFreq, interestType, currency, monthlyContribution);
  });

  // Savings Goal Tracker
  savingsGoalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors(savingsGoalForm);
    const name = document.getElementById('goalName').value;
    const amount = parseFixed(document.getElementById('goalAmount').value);
    const date = document.getElementById('goalDate').value;
    const current = parseFixed(document.getElementById('currentSavings').value);

    if (!validateInput(name, 'text') || !validateInput(amount, 'number') || !date) {
      showError(document.getElementById('goalName'), 'Please fill all fields correctly');
      return;
    }

    savingsGoals.push({ name, amount, date, current });
    localStorage.setItem('finPilotSavingsGoals', JSON.stringify(savingsGoals));
    updateSavingsGoalTable();
    updateSavingsChart();
    savingsGoalForm.reset();
  });

  function updateSavingsGoalTable() {
    savingsGoalTable.innerHTML = savingsGoals.map(goal => `
      <tr>
        <td>${goal.name}</td>
        <td>${goal.amount.toFixed(2)}</td>
        <td>${goal.current.toFixed(2)}</td>
        <td>${goal.date}</td>
      </tr>
    `).join('');
    savingsGoalTable.setAttribute('aria-live', 'polite');
  }

  // Debt Management with payoff estimation
  debtForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors(debtForm);
    const name = document.getElementById('debtName').value;
    const amount = parseFixed(document.getElementById('debtAmount').value);
    const rate = parseFixed(document.getElementById('debtRate').value);
    const payment = parseFixed(document.getElementById('debtPayment').value);

    if (!validateInput(name, 'text') || !validateInput(amount, 'number') || !validateInput(payment, 'number')) {
      showError(document.getElementById('debtName'), 'Please fill all fields correctly');
      return;
    }

    debts.push({ name, amount, rate, payment });
    localStorage.setItem('finPilotDebts', JSON.stringify(debts));
    updateDebtTable();
    updateDebtChart();
    debtForm.reset();
  });

  function updateDebtTable() {
    debtTable.innerHTML = debts.map(debt => `
      <tr>
        <td>${debt.name}</td>
        <td>${debt.amount.toFixed(2)}</td>
        <td>${debt.rate.toFixed(2)}%</td>
        <td>${debt.payment.toFixed(2)}</td>
      </tr>
    `).join('');
    debtTable.setAttribute('aria-live', 'polite');
  }

  // Tax Calculator with mock brackets
  taxForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors(taxForm);
    const income = parseFixed(document.getElementById('taxableIncome').value);
    const region = document.getElementById('taxRegion').value;

    if (!validateInput(income, 'number')) {
      showError(document.getElementById('taxableIncome'), 'Please enter a valid income');
      return;
    }

    const taxBrackets = {
      us: [
        { max: 11000, rate: 0.10 },
        { max: 44725, rate: 0.12 },
        { max: 95375, rate: 0.22 },
        { max: Infinity, rate: 0.24 }
      ],
      ca: [{ max: 50197, rate: 0.15 }, { max: 100392, rate: 0.205 }, { max: Infinity, rate: 0.26 }],
      uk: [{ max: 50270, rate: 0.20 }, { max: 125140, rate: 0.40 }, { max: Infinity, rate: 0.45 }],
      au: [{ max: 45000, rate: 0.19 }, { max: 120000, rate: 0.325 }, { max: Infinity, rate: 0.37 }],
      eu: [{ max: 50000, rate: 0.25 }, { max: 100000, rate: 0.35 }, { max: Infinity, rate: 0.40 }]
    };

    let tax = 0;
    let remainingIncome = income;
    for (const bracket of taxBrackets[region] || taxBrackets.eu) {
      if (remainingIncome <= 0) break;
      const taxableInBracket = Math.min(remainingIncome, bracket.max);
      tax += taxableInBracket * bracket.rate;
      remainingIncome -= taxableInBracket;
    }
    taxResult.textContent = `Estimated Tax: ${tax.toFixed(2)}`;
    taxResult.setAttribute('aria-live', 'polite');
  });

  // Currency Converter (mock API)
  currencyConverterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors(currencyConverterForm);
    const amount = parseFixed(document.getElementById('converterAmount').value);
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;

    if (!validateInput(amount, 'number')) {
      showError(document.getElementById('converterAmount'), 'Please enter a valid amount');
      return;
    }

    const rate = currencyRates[toCurrency] / currencyRates[fromCurrency] || 1;
    const converted = amount * rate;
    converterResult.textContent = `${amount.toFixed(2)} ${fromCurrency} = ${converted.toFixed(2)} ${toCurrency} (Mock rate)`;
    converterResult.setAttribute('aria-live', 'polite');
  });

  // Investment Portfolio
  investmentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors(investmentForm);
    const name = document.getElementById('investmentName').value;
    const type = document.getElementById('investmentType').value;
    const value = parseFixed(document.getElementById('investmentValue').value);

    if (!validateInput(name, 'text') || !validateInput(value, 'number')) {
      showError(document.getElementById('investmentName'), 'Please fill all fields correctly');
      return;
    }

    investments.push({ name, type, value });
    localStorage.setItem('finPilotInvestments', JSON.stringify(investments));
    updateInvestmentTable();
    investmentForm.reset();
  });

  function updateInvestmentTable() {
    investmentTable.innerHTML = investments.map(inv => `
      <tr>
        <td>${inv.name}</td>
        <td>${inv.type}</td>
        <td>${inv.value.toFixed(2)}</td>
      </tr>
    `).join('');
    investmentTable.setAttribute('aria-live', 'polite');
  }

  // Net Worth Calculator
  netWorthForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors(netWorthForm);
    const totalAssets = assets.reduce((sum, asset) => sum + parseFixed(asset.value), 0);
    const totalLiabilities = liabilities.reduce((sum, liab) => sum + parseFixed(liab.value), 0);
    const netWorth = totalAssets - totalLiabilities;
    netWorthResult.textContent = `Net Worth: ${netWorth.toFixed(2)}`;
    netWorthResult.setAttribute('aria-live', 'polite');
    updateNetWorthChart();
  });

  netWorthForm.querySelectorAll('button[aria-label="Add asset"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = document.getElementById('assetName').value;
      const value = parseFixed(document.getElementById('assetValue').value);
      if (!validateInput(name, 'text') || !validateInput(value, 'number')) {
        showError(document.getElementById('assetName'), 'Please fill all fields correctly');
        return;
      }
      assets.push({ name, value });
      localStorage.setItem('finPilotAssets', JSON.stringify(assets));
      document.getElementById('assetName').value = '';
      document.getElementById('assetValue').value = '';
    });
  });

  netWorthForm.querySelectorAll('button[aria-label="Add liability"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = document.getElementById('liabilityName').value;
      const value = parseFixed(document.getElementById('liabilityValue').value);
      if (!validateInput(name, 'text') || !validateInput(value, 'number')) {
        showError(document.getElementById('liabilityName'), 'Please fill all fields correctly');
        return;
      }
      liabilities.push({ name, value });
      localStorage.setItem('finPilotLiabilities', JSON.stringify(liabilities));
      document.getElementById('liabilityName').value = '';
      document.getElementById('liabilityValue').value = '';
    });
  });

  // Retirement Planner with savings projection
  retirementForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors(retirementForm);
    const age = parseInt(document.getElementById('retirementAge').value);
    const income = parseFixed(document.getElementById('retirementIncome').value);
    const savings = parseFixed(document.getElementById('currentRetirementSavings').value);

    if (!validateInput(age, 'number', 18) || !validateInput(income, 'number') || !validateInput(savings, 'number')) {
      showError(document.getElementById('retirementAge'), 'Please fill all fields correctly');
      return;
    }

    retirementPlans.push({ age, income, savings });
    localStorage.setItem('finPilotRetirementPlans', JSON.stringify(retirementPlans));
    updateRetirementTable();
    retirementForm.reset();
  });

  function updateRetirementTable() {
    retirementTable.innerHTML = retirementPlans.map(plan => `
      <tr>
        <td>${plan.age}</td>
        <td>${plan.income.toFixed(2)}</td>
        <td>${plan.savings.toFixed(2)}</td>
      </tr>
    `).join('');
    retirementTable.setAttribute('aria-live', 'polite');
  }

  // Emergency Fund Tracker
  emergencyFundForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors(emergencyFundForm);
    emergencyFund.target = parseFixed(document.getElementById('emergencyFundTarget').value);
    emergencyFund.current = parseFixed(document.getElementById('emergencyFundCurrent').value);

    if (!validateInput(emergencyFund.target, 'number') || !validateInput(emergencyFund.current, 'number')) {
      showError(document.getElementById('emergencyFundTarget'), 'Please enter valid amounts');
      return;
    }

    const progress = (emergencyFund.current / emergencyFund.target) * 100;
    emergencyFundProgress.value = progress;
    emergencyFundProgress.setAttribute('aria-valuetext', `${progress.toFixed(0)}% funded`);
    localStorage.setItem('finPilotEmergencyFund', JSON.stringify(emergencyFund));
  });

  // Feedback Form (Placeholder)
  feedbackForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors(feedbackForm);
    const message = document.getElementById('feedbackMessage').value;
    if (!validateInput(message, 'text')) {
      showError(document.getElementById('feedbackMessage'), 'Please enter your feedback');
      return;
    }
    alert('Feedback submitted! (Backend required for processing)');
    feedbackForm.reset();
  });

  // Charts
  function updateBudgetChart() {
    if (budgetChart) budgetChart.destroy();
    budgetChart = new Chart(budgetChartCanvas, {
      type: 'pie',
      data: {
        labels: categories.map(cat => cat.name || 'Unnamed'),
        datasets: [{
          data: categories.map(cat => parseFixed(cat.amount)),
          backgroundColor: ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22'],
          borderColor: '#fff',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top', labels: { color: document.body.classList.contains('dark') ? '#e0e0e0' : '#333' } },
          title: { display: true, text: 'Budget Distribution', color: document.body.classList.contains('dark') ? '#e0e0e0' : '#333' }
        }
      }
    });
  }

  function updateInterestChart(principal, rate, time, compoundFreq, interestType, currency, monthlyContribution) {
    if (interestChart) interestChart.destroy();
    const labels = Array.from({ length: Math.ceil(time) + 1 }, (_, i) => i);
    const data = labels.map(t => {
      if (interestType === 'simple') {
        return principal * (1 + rate * t) + monthlyContribution * 12 * t;
      } else {
        let amount = principal * Math.pow(1 + rate / compoundFreq, compoundFreq * t);
        if (monthlyContribution > 0) {
          for (let i = 1; i <= t * compoundFreq; i++) {
            amount += monthlyContribution * Math.pow(1 + rate / compoundFreq, i);
          }
        }
        return amount;
      }
    });
    interestChart = new Chart(interestChartCanvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: `Amount (${currency})`,
          data,
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.2)',
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top', labels: { color: document.body.classList.contains('dark') ? '#e0e0e0' : '#333' } },
          title: { display: true, text: 'Interest Growth', color: document.body.classList.contains('dark') ? '#e0e0e0' : '#333' }
        },
        scales: {
          x: { title: { display: true, text: 'Years', color: document.body.classList.contains('dark') ? '#e0e0e0' : '#333' } },
          y: { title: { display: true, text: `Amount (${currency})`, color: document.body.classList.contains('dark') ? '#e0e0e0' : '#333' } }
        }
      }
    });
  }

  function updateSavingsChart() {
    if (savingsChart) savingsChart.destroy();
    const canvas = document.createElement('canvas');
    canvas.id = 'savingsChart';
    canvas.setAttribute('aria-label', 'Savings goals progress chart');
    canvas.setAttribute('role', 'img');
    document.getElementById('chartsSection').appendChild(canvas);
    savingsChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: savingsGoals.map(goal => goal.name),
        datasets: [{
          label: 'Current Savings',
          data: savingsGoals.map(goal => parseFixed(goal.current)),
          backgroundColor: '#2ecc71'
        }, {
          label: 'Target Amount',
          data: savingsGoals.map(goal => parseFixed(goal.amount)),
          backgroundColor: '#3498db'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top', labels: { color: document.body.classList.contains('dark') ? '#e0e0e0' : '#333' } },
          title: { display: true, text: 'Savings Goals Progress', color: document.body.classList.contains('dark') ? '#e0e0e0' : '#333' }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Amount', color: document.body.classList.contains('dark') ? '#e0e0e0' : '#333' } }
        }
      }
    });
  }

  function updateDebtChart() {
    if (debtChart) debtChart.destroy();
    const canvas = document.createElement('canvas');
    canvas.id = 'debtChart';
    canvas.setAttribute('aria-label', 'Debt overview chart');
    canvas.setAttribute('role', 'img');
    document.getElementById('chartsSection').appendChild(canvas);
    debtChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: debts.map(debt => debt.name),
        datasets: [{
          label: 'Debt Amount',
          data: debts.map(debt => parseFixed(debt.amount)),
          backgroundColor: '#e74c3c'
        }, {
          label: 'Monthly Payment',
          data: debts.map(debt => parseFixed(debt.payment)),
          backgroundColor: '#f1c40f'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top', labels: { color: document.body.classList.contains('dark') ? '#e0e0e0' : '#333' } },
          title: { display: true, text: 'Debt Overview', color: document.body.classList.contains('dark') ? '#e0e0e0' : '#333' }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Amount', color: document.body.classList.contains('dark') ? '#e0e0e0' : '#333' } }
        }
      }
    });
  }

  function updateNetWorthChart() {
    if (netWorthChart) netWorthChart.destroy();
    const canvas = document.createElement('canvas');
    canvas.id = 'netWorthChart';
    canvas.setAttribute('aria-label', 'Net worth breakdown chart');
    canvas.setAttribute('role', 'img');
    document.getElementById('chartsSection').appendChild(canvas);
    netWorthChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Assets', 'Liabilities', 'Net Worth'],
        datasets: [{
          label: 'Amount',
          data: [
            assets.reduce((sum, asset) => sum + parseFixed(asset.value), 0),
            liabilities.reduce((sum, liab) => sum + parseFixed(liab.value), 0),
            assets.reduce((sum, asset) => sum + parseFixed(asset.value), 0) -
            liabilities.reduce((sum, liab) => sum + parseFixed(liab.value), 0)
          ],
          backgroundColor: ['#2ecc71', '#e74c3c', '#3498db']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top', labels: { color: document.body.classList.contains('dark') ? '#e0e0e0' : '#333' } },
          title: { display: true, text: 'Net Worth Breakdown', color: document.body.classList.contains('dark') ? '#e0e0e0' : '#333' }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Amount', color: document.body.classList.contains('dark') ? '#e0e0e0' : '#333' } }
        }
      }
    });
  }

  // Export Functionality
  exportPDFBtn.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('FinPilot Financial Report', 20, 20);
    doc.setFontSize(12);

    let y = 30;
    doc.text('Budget Summary', 20, y);
    y += 10;
    categories.forEach(cat => {
      doc.text(`${cat.name || 'Unnamed'}: ${cat.amount.toFixed(2)}`, 20, y);
      y += 10;
    });
    doc.text(`Total Income: ${totalIncomeInput.value || 0}`, 20, y);
    y += 10;
    doc.text(`Total Expenses: ${totalExpensesSpan.textContent}`, 20, y);
    y += 10;
    doc.text(`Balance: ${balanceSpan.textContent}`, 20, y);
    y += 20;

    doc.text('Recurring Expenses', 20, y);
    y += 10;
    recurringExpenses.forEach(exp => {
      doc.text(`${exp.name}: ${exp.amount.toFixed(2)} (${exp.frequency}, Due: ${exp.nextDue || 'N/A'})`, 20, y);
      y += 10;
    });
    y += 20;

    doc.text('Interest Summary', 20, y);
    y += 10;
    doc.text(interestResult.textContent || 'No calculation yet', 20, y);
    y += 20;

    doc.text('Savings Goals', 20, y);
    y += 10;
    savingsGoals.forEach(goal => {
      doc.text(`${goal.name}: ${goal.amount.toFixed(2)} (Current: ${goal.current.toFixed(2)}, Due: ${goal.date})`, 20, y);
      y += 10;
    });
    y += 20;

    doc.text('Debts', 20, y);
    y += 10;
    debts.forEach(debt => {
      doc.text(`${debt.name}: ${debt.amount.toFixed(2)} (${debt.rate}% Rate, Payment: ${debt.payment.toFixed(2)})`, 20, y);
      y += 10;
    });
    y += 20;

    doc.text('Investments', 20, y);
    y += 10;
    investments.forEach(inv => {
      doc.text(`${inv.name}: ${inv.value.toFixed(2)} (${inv.type})`, 20, y);
      y += 10;
    });
    y += 20;

    doc.text('Net Worth', 20, y);
    y += 10;
    doc.text(netWorthResult.textContent || 'No calculation yet', 20, y);
    y += 20;

    doc.text('Retirement Plans', 20, y);
    y += 10;
    retirementPlans.forEach(plan => {
      doc.text(`Age ${plan.age}: Income ${plan.income.toFixed(2)}, Savings ${plan.savings.toFixed(2)}`, 20, y);
      y += 10;
    });
    y += 20;

    doc.text('Emergency Fund', 20, y);
    y += 10;
    doc.text(`Target: ${emergencyFund.target.toFixed(2)}, Current: ${emergencyFund.current.toFixed(2)}`, 20, y);

    doc.save('FinPilot_Full_Report.pdf');
  });

  exportTextBtn.addEventListener('click', () => {
    const text = `
      FinPilot Financial Report
      Budget Summary:
      ${categories.map(cat => `${cat.name || 'Unnamed'}: ${cat.amount.toFixed(2)}`).join('\n')}
      Total Income: ${totalIncomeInput.value || 0}
      Total Expenses: ${totalExpensesSpan.textContent}
      Balance: ${balanceSpan.textContent}
      Recurring Expenses:
      ${recurringExpenses.map(exp => `${exp.name}: ${exp.amount.toFixed(2)} (${exp.frequency}, Due: ${exp.nextDue || 'N/A'})`).join('\n')}
      Interest Summary:
      ${interestResult.textContent || 'No calculation yet'}
      Savings Goals:
      ${savingsGoals.map(goal => `${goal.name}: ${goal.amount.toFixed(2)} (Current: ${goal.current.toFixed(2)}, Due: ${goal.date})`).join('\n')}
      Debts:
      ${debts.map(debt => `${debt.name}: ${debt.amount.toFixed(2)} (${debt.rate}% Rate, Payment: ${debt.payment.toFixed(2)})`).join('\n')}
      Investments:
      ${investments.map(inv => `${inv.name}: ${inv.value.toFixed(2)} (${inv.type})`).join('\n')}
      Net Worth:
      ${netWorthResult.textContent || 'No calculation yet'}
      Retirement Plans:
      ${retirementPlans.map(plan => `Age ${plan.age}: Income ${plan.income.toFixed(2)}, Savings ${plan.savings.toFixed(2)}`).join('\n')}
      Emergency Fund:
      Target: ${emergencyFund.target.toFixed(2)}, Current: ${emergencyFund.current.toFixed(2)}
    `;
    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'FinPilot_Full_Report.txt';
    link.click();
  });

  // Event listeners for dynamic updates
  addCategoryBtn.addEventListener('click', addCategory);
  recurringExpensesContainer.addEventListener('click', (e) => {
    if (e.target.textContent === '+ Add Expense') addRecurringExpense();
  });
  categoriesContainer.addEventListener('input', (e) => {
    const index = Array.from(categoriesContainer.children).indexOf(e.target.closest('.form-group'));
    if (e.target.id.includes('categoryName')) {
      categories[index].name = e.target.value;
    } else if (e.target.id.includes('categoryAmount')) {
      categories[index].amount = parseFixed(e.target.value);
    }
    localStorage.setItem('finPilotCategories', JSON.stringify(categories));
    updateBudget();
  });
  recurringExpensesContainer.addEventListener('input', (e) => {
    const index = Array.from(recurringExpensesContainer.children).indexOf(e.target.closest('.form-group'));
    if (e.target.id.includes('recurringName')) {
      recurringExpenses[index].name = e.target.value;
    } else if (e.target.id.includes('recurringAmount')) {
      recurringExpenses[index].amount = parseFixed(e.target.value);
    } else if (e.target.id.includes('recurringFrequency')) {
      recurringExpenses[index].frequency = e.target.value;
    } else if (e.target.id.includes('recurringDueDate')) {
      recurringExpenses[index].nextDue = e.target.value;
    }
    localStorage.setItem('finPilotRecurringExpenses', JSON.stringify(recurringExpenses));
    updateBudget();
  });
  totalIncomeInput.addEventListener('input', updateBudget);

  // Keyboard accessibility
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });

  // Initialize
  initializeCategories();
  addRecurringExpense();
  updateBudget();
  updateSavingsGoalTable();
  updateDebtTable();
  updateInvestmentTable();
  updateRetirementTable();
  if (emergencyFund.target > 0) {
    const progress = (emergencyFund.current / emergencyFund.target) * 100;
    emergencyFundProgress.value = progress;
    emergencyFundProgress.setAttribute('aria-valuetext', `${progress.toFixed(0)}% funded`);
  }
});