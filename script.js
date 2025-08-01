// Calculator state
let currentInput = '';
let expression = '';
let lastWasOperator = false;
let justCalculated = false;
let calculationHistory = [];
let isLightMode = false;

const display = document.getElementById('display');
const expressionDisplay = document.getElementById('expression');
const historyDisplay = document.getElementById('history');
const themeToggle = document.getElementById('themeToggle');

function toggleTheme() {
    isLightMode = !isLightMode;
    const body = document.body;
    const themeIcon = document.querySelector('.theme-icon');
    
    if (isLightMode) {
        body.classList.add('light-mode');
        body.classList.remove('bg-black');
        body.classList.add('bg-gray-100');
        themeIcon.textContent = '☀️';
    } else {
        body.classList.remove('light-mode');
        body.classList.remove('bg-gray-100');
        body.classList.add('bg-black');
        themeIcon.textContent = '🌙';
    }
    
    // Re-trigger history scroll effect for theme change
    setTimeout(() => {
        handleHistoryScroll();
    }, 100);
}

// Load history from memory on startup
function loadHistory() {
    calculationHistory = calculationHistory || [];
    updateHistory();
}

// Save history to memory
function saveHistory() {
    // History persists during the session in memory
}

function updateHistory() {
    if (calculationHistory.length === 0) {
        historyDisplay.innerHTML = '<div class="text-center text-gray-600 mt-4">No calculations yet</div>';
        return;
    }
    
    let historyHTML = '';
    calculationHistory.forEach((calc, index) => {
        historyHTML += `<div class="history-item text-right mb-1 p-2 rounded hover:bg-gray-800 cursor-pointer transition-all duration-200" data-index="${index}">
            <div class="text-gray-500 text-xs">${calc.expression}</div>
            <div class="text-white font-medium">${calc.result}</div>
        </div>`;
    });
    
    historyDisplay.innerHTML = historyHTML;
    
    // Add click listeners to history items
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            const calc = calculationHistory[index];
            reuseCalculation(calc);
        });
    });
    
    // Auto-scroll to bottom to show latest calculations
    historyDisplay.scrollTop = historyDisplay.scrollHeight;
    
    // Add scroll listener for fade effect
    historyDisplay.addEventListener('scroll', handleHistoryScroll);
}

function handleHistoryScroll() {
    const historyItems = document.querySelectorAll('.history-item');
    const containerRect = historyDisplay.getBoundingClientRect();
    const barrierHeight = 20;
    
    historyItems.forEach(item => {
        const itemRect = item.getBoundingClientRect();
        const itemBottom = itemRect.bottom - containerRect.top;
        const containerHeight = containerRect.height;
        
        // Check if item is in the fade zone (near the bottom barrier)
        if (itemBottom > containerHeight - barrierHeight - 10) {
            const fadeAmount = Math.max(0, (containerHeight - barrierHeight - itemBottom + 10) / 30);
            item.style.opacity = Math.max(0.3, fadeAmount);
        } else {
            item.style.opacity = 1;
        }
    });
}

function reuseCalculation(calc) {
    console.log('Reusing calculation:', calc);
    
    // Clear current state
    currentInput = calc.result;
    expression = '';
    lastWasOperator = false;
    justCalculated = true;
    
    // Update display with the result
    updateDisplay();
    
    // Visual feedback
    const historyItems = document.querySelectorAll('.history-item');
    historyItems.forEach(item => item.classList.remove('bg-blue-900'));
    
    // Find the clicked item properly
    const clickedItem = document.querySelector(`[data-index="${calculationHistory.indexOf(calc)}"]`);
    if (clickedItem) {
        clickedItem.classList.add('bg-blue-900');
        setTimeout(() => {
            clickedItem.classList.remove('bg-blue-900');
        }, 300);
    }
}

function updateDisplay() {
    // Show current input in main display
    let displayValue = currentInput || '0';
    
    display.textContent = displayValue;
    
    // Start from the beginning (left side) for display
    display.scrollLeft = 0;
    
    // Show full expression in expression line
    let expText = expression;
    if (currentInput && !lastWasOperator) {
        expText += currentInput;
    }
    expressionDisplay.textContent = expText;
    
    // Auto-scroll to the end for expression (to see latest input)
    expressionDisplay.scrollLeft = expressionDisplay.scrollWidth;
}

function inputNumber(num) {
    if (justCalculated) {
        // Start fresh after calculation
        clearAll();
        justCalculated = false;
    }
    
    if (lastWasOperator) {
        currentInput = num;
        lastWasOperator = false;
    } else {
        if (currentInput === '0') {
            currentInput = num;
        } else {
            currentInput += num;
        }
    }
    updateDisplay();
}

function inputDecimal() {
    if (justCalculated) {
        clearAll();
        justCalculated = false;
    }
    
    if (lastWasOperator) {
        currentInput = '0.';
        lastWasOperator = false;
    } else if (currentInput.indexOf('.') === -1) {
        if (!currentInput) currentInput = '0';
        currentInput += '.';
    }
    updateDisplay();
}

function setOperation(op) {
    // Don't allow multiplication or division without a number first
    if ((op === '*' || op === '/')) {
        // Check if we have a valid number to multiply/divide
        if (!justCalculated && !currentInput) {
            return; // No number available for multiplication/division
        }
    }
    
    if (justCalculated) {
        // Continue with result from previous calculation
        expression = display.textContent + ' ';
        currentInput = '';
        justCalculated = false;
    } else if (currentInput) {
        // Add current input to expression
        expression += currentInput + ' ';
        currentInput = '';
    } else if (expression && lastWasOperator) {
        // Replace last operator
        expression = expression.slice(0, -2) + ' ';
    }
    
    // Convert operation symbols for display
    let opSymbol = op;
    if (op === '*') opSymbol = '×';
    if (op === '/') opSymbol = '÷';
    
    expression += opSymbol + ' ';
    lastWasOperator = true;
    updateDisplay();
}

function evaluateExpression(expr) {
    try {
        // Replace display symbols with JavaScript operators
        let jsExpr = expr.replace(/×/g, '*').replace(/÷/g, '/');
        
        // Use Function constructor for safe evaluation
        const result = Function('"use strict"; return (' + jsExpr + ')')();
        
        // Format the result
        if (typeof result === 'number') {
            // Handle division by zero
            if (!isFinite(result)) {
                return 'Error';
            }
            // Round to avoid floating point precision issues
            return parseFloat(result.toFixed(10));
        }
        return result;
    } catch (error) {
        console.error('Evaluation error:', error);
        return 'Error';
    }
}

function calculate() {
    if (!expression && !currentInput) {
        return;
    }
    
    // Build complete expression
    let fullExpression = expression;
    if (currentInput) {
        fullExpression += currentInput;
    }
    
    // Remove trailing operators
    fullExpression = fullExpression.trim();
    if (['+', '-', '×', '÷'].includes(fullExpression.slice(-1))) {
        fullExpression = fullExpression.slice(0, -1).trim();
    }
    
    if (!fullExpression) {
        return;
    }
    
    const result = evaluateExpression(fullExpression);
    
    if (result === 'Error') {
        display.textContent = 'Error';
        currentInput = '';
        expression = '';
        lastWasOperator = false;
        justCalculated = false;
        return;
    }
    
    // Add to history before clearing
    calculationHistory.push({
        expression: fullExpression,
        result: result.toString(),
        timestamp: new Date().toLocaleTimeString()
    });
    
    // Keep only last 20 calculations
    if (calculationHistory.length > 20) {
        calculationHistory.shift();
    }
    
    // Save and update history display
    saveHistory();
    updateHistory();
    
    // Show result
    currentInput = result.toString();
    expression = '';
    lastWasOperator = false;
    justCalculated = true;
    updateDisplay();
}

function clearAll() {
    currentInput = '';
    expression = '';
    lastWasOperator = false;
    justCalculated = false;
    updateDisplay();
}

function clearEntry() {
    if (currentInput) {
        currentInput = '';
    } else if (expression) {
        // Remove last part of expression
        const parts = expression.trim().split(' ');
        if (parts.length > 0) {
            parts.pop();
            expression = parts.join(' ') + (parts.length > 0 ? ' ' : '');
        }
    }
    updateDisplay();
}

function percentage() {
    if (currentInput) {
        currentInput = (parseFloat(currentInput) / 100).toString();
        updateDisplay();
    }
}

// Add button press animation
function addButtonPressEffect(button) {
    button.classList.add('button-pressed');
    setTimeout(() => {
        button.classList.remove('button-pressed');
    }, 100);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    loadHistory();
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Button clicks
    document.querySelectorAll('.calc-btn').forEach(button => {
        button.addEventListener('click', function() {
            addButtonPressEffect(this);
            
            const action = this.dataset.action;
            
            switch(action) {
                case 'number':
                    inputNumber(this.dataset.number);
                    break;
                case 'decimal':
                    inputDecimal();
                    break;
                case 'operation':
                    setOperation(this.dataset.operation);
                    break;
                case 'equals':
                    calculate();
                    break;
                case 'clear':
                    clearAll();
                    break;
                case 'clear-entry':
                    clearEntry();
                    break;
                case 'percent':
                    percentage();
                    break;
            }
        });
    });
    
    // Keyboard support
    document.addEventListener('keydown', function(e) {
        e.preventDefault();
        
        if (e.key >= '0' && e.key <= '9') {
            inputNumber(e.key);
        } else if (e.key === '.') {
            inputDecimal();
        } else if (e.key === '+') {
            setOperation('+');
        } else if (e.key === '-') {
            setOperation('-');
        } else if (e.key === '*') {
            setOperation('*');
        } else if (e.key === '/') {
            setOperation('/');
        } else if (e.key === 'Enter' || e.key === '=') {
            calculate();
        } else if (e.key === 'Escape') {
            clearAll();
        } else if (e.key === 'Backspace') {
            clearEntry();
        } else if (e.key === '%') {
            percentage();
        }
    });
});
