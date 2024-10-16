class MinHeap {
    constructor() {
        this.heap = [];
    }

    insert(value) {
        this.heap.push(value);
        this.bubbleUp();
    }

    bubbleUp() {
        let index = this.heap.length - 1;
        while (index > 0) {
            let parentIndex = Math.floor((index - 1) / 2);
            if (this.heap[index].amount >= this.heap[parentIndex].amount) break;
            [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
            index = parentIndex;
        }
    }

    extractMin() {
        if (this.heap.length === 0) return null;
        if (this.heap.length === 1) return this.heap.pop();

        const min = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.bubbleDown();
        return min;
    }

    bubbleDown() {
        let index = 0;
        const length = this.heap.length;

        while (true) {
            let leftChildIndex = 2 * index + 1;
            let rightChildIndex = 2 * index + 2;
            let smallestIndex = index;

            if (leftChildIndex < length && this.heap[leftChildIndex].amount < this.heap[smallestIndex].amount) {
                smallestIndex = leftChildIndex;
            }
            if (rightChildIndex < length && this.heap[rightChildIndex].amount < this.heap[smallestIndex].amount) {
                smallestIndex = rightChildIndex;
            }
            if (smallestIndex === index) break;
            [this.heap[index], this.heap[smallestIndex]] = [this.heap[smallestIndex], this.heap[index]];
            index = smallestIndex;
        }
    }

    isEmpty() {
        return this.heap.length === 0;
    }
}

function addInputs() {
    const numPersons = parseInt(document.getElementById("persons").value);
    const nameInputsDiv = document.getElementById("nameInputs");
    nameInputsDiv.innerHTML = '';

    for (let i = 1; i <= numPersons; i++) {
        nameInputsDiv.innerHTML += `<label for="name${i}">Person ${i} Name:</label>
        <input type="text" id="name${i}" placeholder="Enter Name ${i}"><br>`;
    }
}

function updateOwesLabels() {
    const numPersons = parseInt(document.getElementById("persons").value);
    const paymentInputsDiv = document.getElementById("paymentInputs");
    const names = [];

    for (let i = 1; i <= numPersons; i++) {
        const name = document.getElementById(`name${i}`).value.trim() || `Person ${i}`;
        names.push(name);
    }

    paymentInputsDiv.innerHTML = '';
    for (let i = 1; i <= numPersons; i++) {
        for (let j = 1; j <= numPersons; j++) {
            if (i !== j) {
                paymentInputsDiv.innerHTML += `<label id="label_p${i}p${j}" for="p${i}p${j}">${names[i - 1]} owes ${names[j - 1]}:</label>
                <input type="number" id="p${i}p${j}" value="0"><br>`;
            }
        }
        paymentInputsDiv.innerHTML += '<br>';
    }

    paymentInputsDiv.style.display = 'block';
}

function calculateResult() {
    const numPersons = parseInt(document.getElementById("persons").value);
    const netAmounts = new Array(numPersons).fill(0);
    const transactionTable = document.getElementById("transactionTable");
    const simplifiedTransactions = document.getElementById("simplifiedTransactions");
    const matrixTable = document.getElementById("matrixTable");
    const names = [];

    // Clear previous content to avoid duplication
    transactionTable.innerHTML = '';
    simplifiedTransactions.innerHTML = '';
    matrixTable.innerHTML = '';

    // Collect names
    for (let i = 1; i <= numPersons; i++) {
        const name = document.getElementById(`name${i}`).value.trim() || `Person ${i}`;
        names.push(name);
    }

    // Create matrix
    const matrix = Array.from({ length: numPersons }, () => Array(numPersons).fill(0));
    for (let i = 1; i <= numPersons; i++) {
        for (let j = 1; j <= numPersons; j++) {
            if (i !== j) {
                const amount = parseInt(document.getElementById(`p${i}p${j}`).value) || 0;
                matrix[i - 1][j - 1] = amount;
            }
        }
    }

    // Update matrix table
    matrixTable.innerHTML = `<table><thead><tr><th></th>${names.map(name => `<th>${name}</th>`).join('')}</tr></thead><tbody>` +
        matrix.map((row, i) => `<tr><th>${names[i]}</th>${row.map(amount => `<td>${amount}</td>`).join('')}</tr>`).join('') +
        `</tbody></table>`;

    // Calculate net amounts
    for (let i = 1; i <= numPersons; i++) {
        for (let j = 1; j <= numPersons; j++) {
            if (i !== j) {
                const amountOwed = parseFloat(document.getElementById(`p${i}p${j}`).value);
                netAmounts[i - 1] -= amountOwed;
                netAmounts[j - 1] += amountOwed;
            }
        }
    }

    const debtorHeap = new MinHeap();
    const creditorHeap = new MinHeap();

    netAmounts.forEach((amount, i) => {
        if (amount < 0) {
            debtorHeap.insert({ index: i, amount: -amount });
        } else if (amount > 0) {
            creditorHeap.insert({ index: i, amount });
        }
    });

    const transactions = [];
    let result = '';

    while (!debtorHeap.isEmpty() && !creditorHeap.isEmpty()) {
        const debtor = debtorHeap.extractMin();
        const creditor = creditorHeap.extractMin();
        const settledAmount = Math.min(debtor.amount, creditor.amount);

        transactions.push({
            debtor: debtor.index,
            creditor: creditor.index,
            amount: settledAmount
        });

        result += `${names[debtor.index]} pays ${names[creditor.index]}: ${settledAmount.toFixed(2)}\n`;

        debtor.amount -= settledAmount;
        creditor.amount -= settledAmount;

        if (debtor.amount > 0) {
            debtorHeap.insert(debtor);
        }
        if (creditor.amount > 0) {
            creditorHeap.insert(creditor);
        }
    }

    document.getElementById("output").innerText = result;
    drawGraph(transactions, names);
}

function drawGraph(transactions, names) {
    const canvas = document.getElementById("transactionCanvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;

    const radius = 20;
    const positions = [];

    for (let i = 0; i < names.length; i++) {
        const angle = (i / names.length) * (2 * Math.PI);
        const x = width / 2 + Math.cos(angle) * (width / 3);
        const y = height / 2 + Math.sin(angle) * (height / 3);
        positions.push({ x, y });

        // Draw the vertex circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = "#007bff";
        ctx.fill();
        ctx.stroke();

        // Draw the name outside the vertex
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(names[i], x, y - radius - 10); // Positioned above the vertex
    }

    ctx.strokeStyle = "#ff5733";
    transactions.forEach(transaction => {
        const fromPos = positions[transaction.debtor];
        const toPos = positions[transaction.creditor];
        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);
        ctx.lineTo(toPos.x, toPos.y);
        ctx.stroke();

        // Draw an arrow at the end of the line
        const headlen = 10; // Length of arrow head
        const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
        ctx.beginPath();
        ctx.moveTo(toPos.x, toPos.y);
        ctx.lineTo(toPos.x - headlen * Math.cos(angle - Math.PI / 6), toPos.y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toPos.x - headlen * Math.cos(angle + Math.PI / 6), toPos.y - headlen * Math.sin(angle + Math.PI / 6));
        ctx.lineTo(toPos.x, toPos.y);
        ctx.fillStyle = "#ff5733";
        ctx.fill();
        ctx.stroke();

        // Draw transaction amount on the edge
        const midX = (fromPos.x + toPos.x) / 2;
        const midY = (fromPos.y + toPos.y) / 2;
        ctx.fillStyle = "black";
        ctx.fillText(transaction.amount.toFixed(2), midX, midY);
    });
}
